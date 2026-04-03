# pyre-ignore-all-errors
from sqlalchemy.orm import Session
from models.user import User
from core.security import hash_password, verify_password, create_access_token
import uuid

def create_user(db: Session, username: str, email: str, password: str, age: int):
    hashed = hash_password(password)
    
    tag = "Adult"
    if age < 13:
        tag = "Child"
    elif age < 20:
        tag = "Teen"
        
    user = User(
        username=username,
        email=email,
        password_hash=hashed,
        age=age,
        demographic_tag=tag
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

def authenticate_user(db: Session, email: str, password: str):
    user = db.query(User).filter(User.email == email).first()
    if not user:
        return None
    if not verify_password(password, user.password_hash):
        return None
    return user

def login_user(db: Session, email: str, password: str):
    user = authenticate_user(db, email, password)
    if not user:
        return None
    token = create_access_token({"sub": str(user.id)})
    return token

def create_guest_user(db: Session):
    unique_suffix = uuid.uuid4().hex[:8]
    username = f"Guest_{unique_suffix}"
    
    user = User(
        username=username,
        is_guest=True,
        provider="guest"
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    token = create_access_token({"sub": str(user.id)})
    return token, user

def link_email_to_guest(db: Session, user: User, email: str, password: str):
    existing = db.query(User).filter(User.email == email).first()
    if existing:
        return False, "Email already registered"
        
    user.email = email
    user.password_hash = hash_password(password)
    user.is_guest = False
    user.provider = "local"
    db.commit()
    db.refresh(user)
    return True, "Account successfully linked"

def generate_reset_token(db: Session, email: str):
    user = db.query(User).filter(User.email == email, User.is_guest == False).first()
    if not user:
        return None
    from datetime import datetime, timedelta
    import random
    
    expire = datetime.utcnow() + timedelta(minutes=5)
    otp = str(random.randint(100000, 999999))
    user.otp = otp
    user.otp_expires_at = expire
    db.commit()
    return otp

def reset_password(db: Session, email: str, otp: str, new_password: str):
    from datetime import datetime
    user = db.query(User).filter(User.email == email, User.is_guest == False).first()
    if not user:
        return False, "User not found"
        
    if not user.otp or user.otp != otp:
        return False, "Invalid OTP"
        
    if not user.otp_expires_at or user.otp_expires_at < datetime.utcnow():
        return False, "OTP has expired"
        
    user.password_hash = hash_password(new_password)
    user.otp = None
    user.otp_expires_at = None
    db.commit()
    return True, "Password updated successfully"
