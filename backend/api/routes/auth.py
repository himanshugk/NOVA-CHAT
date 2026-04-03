# pyre-ignore-all-errors
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from schemas.user import UserCreate, UserLogin, UserResponse, Token, LinkAccount, UserUpdate
from api.dependencies import get_db, get_current_user
from core.security import create_access_token
from services import auth_service
from models.user import User
import requests
from pydantic import BaseModel

class SocialLogin(BaseModel):
    provider: str
    access_token: str
    guest_token: str | None = None

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/register", response_model=UserResponse)
def register(user: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    return auth_service.create_user(db, user.username, user.email, user.password, user.age)

@router.post("/login", response_model=Token)
def login(user: UserLogin, db: Session = Depends(get_db)):
    user_obj = auth_service.authenticate_user(db, user.email, user.password)
    if not user_obj:
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    
    import uuid
    new_session_id = uuid.uuid4().hex

    if user.device_type == "desktop":
        if user_obj.desktop_session_id:
            raise HTTPException(status_code=403, detail="Already logged in on another Desktop device.")
        user_obj.desktop_session_id = new_session_id
    elif user.device_type == "mobile":
        if user_obj.mobile_session_id:
            raise HTTPException(status_code=403, detail="Already logged in on another Mobile device.")
        user_obj.mobile_session_id = new_session_id
    else:
        raise HTTPException(status_code=400, detail="Invalid device_type")
        
    db.commit()

    token = create_access_token({"sub": str(user_obj.id), "device_type": user.device_type, "session_id": new_session_id})
    return {"access_token": token, "token_type": "bearer"}

@router.post("/guest", response_model=Token)
def guest_login(db: Session = Depends(get_db)):
    token, _ = auth_service.create_guest_user(db)
    return {"access_token": token, "token_type": "bearer"}

@router.post("/social", response_model=Token)
def social_login(data: SocialLogin, db: Session = Depends(get_db)):
    if data.provider.lower() == 'google':
        verify_url = f"https://www.googleapis.com/oauth2/v3/userinfo?access_token={data.access_token}"
        try:
            r = requests.get(verify_url)
            r.raise_for_status()
            user_info = r.json()
        except BaseException:
            raise HTTPException(status_code=400, detail="Invalid Google token")
            
        email = user_info.get("email")
        name = user_info.get("name")
        picture = user_info.get("picture")
        
        if not email:
            raise HTTPException(status_code=400, detail="Email not provided by Google")
            
        user = db.query(User).filter(User.email == email).first()
        
        if not user and data.guest_token:
            from jose import jwt
            from core.config import SECRET_KEY, ALGORITHM
            try:
                payload = jwt.decode(data.guest_token, SECRET_KEY, algorithms=[ALGORITHM])
                guest_id = payload.get("sub")
                if guest_id:
                    guest_user = db.query(User).filter(User.id == int(guest_id)).first()
                    if guest_user and guest_user.is_guest:
                        guest_user.email = email
                        guest_user.provider = "google"
                        if picture:
                            guest_user.profile_image = picture
                        if name:
                            guest_user.username = name
                        guest_user.is_guest = False
                        db.commit()
                        db.refresh(guest_user)
                        user = guest_user
            except Exception:
                pass
                
        if not user:
            user = User(
                username=name or "Google_Pilot",
                email=email,
                provider="google",
                profile_image=picture,
                is_guest=False
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            
        token = create_access_token({"sub": str(user.id)})
        return {"access_token": token, "token_type": "bearer"}
    else:
        raise HTTPException(status_code=400, detail="Provider not supported yet")

@router.post("/link")
def link_account(
    data: LinkAccount, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    if not current_user.is_guest:
        raise HTTPException(status_code=400, detail="Account is already fully registered")
        
    success, message = auth_service.link_email_to_guest(db, current_user, data.email, data.password)
    if not success:
        raise HTTPException(status_code=400, detail=message)
    return {"message": message}

@router.get("/me", response_model=UserResponse)
def read_user_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.put("/me", response_model=UserResponse)
def update_user_me(
    data: UserUpdate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if data.username:
        current_user.username = data.username
    if data.email and not current_user.is_guest:
        current_user.email = data.email
    if data.status is not None:
        current_user.status = data.status
    if data.bio is not None:
        current_user.bio = data.bio
    if data.passion is not None:
        current_user.passion = data.passion
    if data.profile_song is not None:
        current_user.profile_song = data.profile_song
    db.commit()
    db.refresh(current_user)
    return current_user

@router.post("/logout")
def logout(
    device_type: str,
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    if device_type == "desktop":
        current_user.desktop_session_id = None
    elif device_type == "mobile":
        current_user.mobile_session_id = None
    db.commit()
    return {"message": "Logged out successfully"}

@router.delete("/me")
def delete_user_me(
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    db.delete(current_user)
    db.commit()
    return {"message": "User successfully deleted"}

class ForgotPassword(BaseModel):
    email: str

class ResetPassword(BaseModel):
    email: str
    otp: str
    new_password: str

@router.post("/forgot-password")
def forgot_password_route(data: ForgotPassword, db: Session = Depends(get_db)):
    otp = auth_service.generate_reset_token(db, data.email)
    
    if otp == "ACTIVE_OTP_EXISTS":
        raise HTTPException(status_code=429, detail="An active OTP was already sent. Please wait 5 minutes before requesting another.")
        
    if otp:
        import smtplib
        from email.mime.text import MIMEText
        from email.mime.multipart import MIMEMultipart
        import os
        
        sender_email = os.environ.get("SMTP_USER", "testing@example.com")
        sender_password = os.environ.get("SMTP_PASSWORD", "password")
        smtp_server = os.environ.get("SMTP_SERVER", "smtp.gmail.com")
        smtp_port = int(os.environ.get("SMTP_PORT", 587))
        
        try:
            msg = MIMEMultipart()
            msg['From'] = sender_email
            msg['To'] = data.email
            msg['Subject'] = "NOVA Password Reset OTP"
            
            body = f"Your Password Reset OTP is: {otp}\nThis code will expire in 5 minutes."
            msg.attach(MIMEText(body, 'plain'))
            
            server = smtplib.SMTP(smtp_server, smtp_port)
            server.starttls()
            server.login(sender_email, sender_password)
            server.send_message(msg)
            server.quit()
        except Exception as e:
            print(f"Failed to send email: {e}")
            pass # Keep silent to user to prevent email enumeration, but log it
            
    return {"message": "If that email exists, an OTP has been dispatched."}

@router.post("/reset-password")
def reset_password_route(data: ResetPassword, db: Session = Depends(get_db)):
    success, message = auth_service.reset_password(db, data.email, data.otp, data.new_password)
    if not success:
        raise HTTPException(status_code=400, detail=message)
    return {"message": message}
