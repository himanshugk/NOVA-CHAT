# pyre-ignore-all-errors
from sqlalchemy import Column, Integer, String, Boolean, DateTime
from datetime import datetime
from db.base import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=True)
    password_hash = Column(String, nullable=True)
    
    is_guest = Column(Boolean, default=False)
    profile_image = Column(String, nullable=True)
    provider = Column(String, default="local")
    
    status = Column(String, nullable=True)
    age = Column(Integer, default=18)
    bio = Column(String, nullable=True)
    passion = Column(String, nullable=True)
    profile_song = Column(String, nullable=True)
    desktop_session_id = Column(String, nullable=True)
    mobile_session_id = Column(String, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    otp = Column(String, nullable=True)
    otp_expires_at = Column(DateTime, nullable=True)
    demographic_tag = Column(String, default="Adult")
