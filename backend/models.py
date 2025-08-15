from sqlalchemy import Column, String, Integer, Boolean, DateTime, Text, ForeignKey, JSON, Float
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    name = Column(String, nullable=False)
    college = Column(String, nullable=False)
    group_leader_name = Column(String, default="")
    role = Column(String, default="ambassador", index=True)
    
    # Progress tracking
    current_day = Column(Integer, default=0)
    total_points = Column(Integer, default=0, index=True)
    total_referrals = Column(Integer, default=0)
    
    # Metadata
    registration_date = Column(DateTime, default=datetime.utcnow, index=True)
    last_login = Column(DateTime, nullable=True)
    last_submission_date = Column(DateTime, nullable=True, index=True)
    is_active = Column(Boolean, default=True)
    status = Column(String, default="active")
    
    # JSON fields for flexible data
    profile_settings = Column(JSON, default=dict)
    notification_preferences = Column(JSON, default=dict)
    
    # Relationships
    submissions = relationship("Submission", back_populates="user")
    analytics = relationship("Analytics", back_populates="user")

class SubmissionFile(Base):
    __tablename__ = "submission_files"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    submission_id = Column(String, ForeignKey("submissions.id"), nullable=False, index=True)
    file_url = Column(Text, nullable=False)
    file_type = Column(String, nullable=True)
    uploaded_at = Column(DateTime, default=datetime.utcnow)

    submission = relationship("Submission", back_populates="files")

class Task(Base):
    __tablename__ = "tasks"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    day = Column(Integer, nullable=False, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    task_type = Column(String, nullable=False, index=True)
    points_reward = Column(Integer, default=50)
    
    # Task configuration
    requirements = Column(JSON, default=dict)
    submission_guidelines = Column(JSON, default=list)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True, index=True)
    created_by = Column(String, nullable=True)
    
    # Relationships
    submissions = relationship("Submission", back_populates="task")

class Submission(Base):
    __tablename__ = "submissions"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    task_id = Column(String, ForeignKey("tasks.id"), nullable=False, index=True)
    day = Column(Integer, nullable=False)
    
    # Submission content
    status_text = Column(Text, default="")
    people_connected = Column(Integer, default=0)
    proof_files = Column(JSON, default=list)
    proof_image = Column(Text, nullable=True)  # Base64 or URL
    
    # Scoring
    points_earned = Column(Integer, default=0)
    status = Column(String, default="pending", index=True)
    
    # Review data
    reviewed_by = Column(String, nullable=True)
    review_notes = Column(Text, nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    
    # Metadata
    submission_date = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow)
    is_completed = Column(Boolean, default=False)
    
    # Relationships
    user = relationship("User", back_populates="submissions")
    files = relationship("SubmissionFile", back_populates="submission")
    task = relationship("Task", back_populates="submissions")

class Analytics(Base):
    __tablename__ = "analytics"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    date = Column(DateTime, default=datetime.utcnow, index=True)
    
    # Daily metrics
    points_earned_today = Column(Integer, default=0)
    tasks_completed_today = Column(Integer, default=0)
    referrals_made_today = Column(Integer, default=0)
    
    # Cumulative metrics
    total_points = Column(Integer, default=0)
    total_tasks_completed = Column(Integer, default=0)
    total_referrals = Column(Integer, default=0)
    current_streak = Column(Integer, default=0)
    
    # Performance metrics
    completion_rate = Column(Float, default=0.0)
    engagement_score = Column(Float, default=0.0)
    
    # Relationships
    user = relationship("User", back_populates="analytics")