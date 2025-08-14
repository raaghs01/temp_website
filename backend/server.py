from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File, Form, Depends, Body, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from db import get_db, init_db, AsyncSessionLocal
from services.database_service import DatabaseService
from models import User, Task, Submission
import os
import logging
from pathlib import Path
from typing import List, Optional
import uuid
from datetime import datetime, timedelta
import jwt
import hashlib
import base64
from io import BytesIO
from contextlib import asynccontextmanager
import traceback
from fastapi.responses import JSONResponse


# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# JWT Configuration
JWT_SECRET = os.getenv("JWT_SECRET", "your-super-secret-jwt-key-change-in-production")
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_DELTA = timedelta(days=30)

# Create the main app with lifespan
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await init_db()
    await initialize_tasks()
    yield
    # Shutdown (if needed)

app = FastAPI(lifespan=lifespan)

# Global exception handler for debugging
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    # Log a full traceback to the console
    logger.error("Unhandled exception occurred handling request %s %s", request.method, request.url)
    traceback.print_exc()

    # Return safe JSON (the CORS middleware will still attach CORS headers)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"},
    )

# Add CORS middleware FIRST, before any routers
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept"],
)

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Security
security = HTTPBearer()

# Models
class UserCreate(BaseModel):
    email: str
    password: str
    name: str
    college: str
    group_leader_name: str = ""
    role: str = "ambassador"

class UserLogin(BaseModel):
    email: str
    password: str
    role: str = "ambassador"

class TaskSubmissionCreate(BaseModel):
    task_id: str
    status_text: str = ""
    people_connected: int = 0

class UserProfile(BaseModel):
    id: str
    email: str
    name: str
    college: str
    group_leader_name: str
    role: str
    current_day: int
    total_points: int
    total_referrals: int
    rank_position: Optional[int]
    registration_date: datetime
    status: str

class LeaderboardEntry(BaseModel):
    name: str
    college: str
    total_points: int
    total_referrals: int
    rank: int

class UserStatusUpdateRequest(BaseModel):
    user_id: str
    status: str

class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str

class ProfileUpdate(BaseModel):
    name: str
    email: str
    college: str
    group_leader_name: str

# Utility functions
def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def verify_password(password: str, hashed: str) -> bool:
    return hash_password(password) == hashed

def create_access_token(user_id: str) -> str:
    payload = {
        "user_id": user_id,
        "exp": datetime.utcnow() + JWT_EXPIRATION_DELTA
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: AsyncSession = Depends(get_db)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("user_id")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")

        db_service = DatabaseService(db)
        user = await db_service.get_user_by_id(user_id)
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")

        # Check if user is suspended (only for non-admin users)
        if user.role != "admin" and user.status == "suspended":
            raise HTTPException(status_code=403, detail="Your account has been suspended. Please contact support.")

        # Check if user is inactive
        if not user.is_active:
            raise HTTPException(status_code=403, detail="Your account is inactive. Please contact support.")

        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except (jwt.DecodeError, jwt.InvalidSignatureError, Exception):
        raise HTTPException(status_code=401, detail="Invalid token")

async def calculate_user_rank(user_id: str, db: AsyncSession) -> int:
    """Calculate user's rank based on total points"""
    db_service = DatabaseService(db)
    leaderboard = await db_service.get_leaderboard(1000)
    
    for i, user in enumerate(leaderboard):
        if user.id == user_id:
            return i + 1
    
    return len(leaderboard) + 1

# Initialize default tasks
async def initialize_tasks():
    async with AsyncSessionLocal() as session:
        db_service = DatabaseService(session)
        
        # Check if tasks already exist
        existing_tasks = await db_service.get_all_active_tasks()
        if len(existing_tasks) > 0:
            return

        default_tasks = [
            {
                "id": str(uuid.uuid4()),
                "day": 0,
                "title": "Complete Orientation",
                "description": "Watch the orientation video and read the company documents. This will help you understand our mission and how to be an effective ambassador.",
                "task_type": "orientation",
                "points_reward": 100,
                "is_active": True
            },
            {
                "id": str(uuid.uuid4()),
                "day": 1,
                "title": "Social Media Setup",
                "description": "Set up your social media profiles and connect with our official accounts. Share your first post about joining DC Studios.",
                "task_type": "social_media",
                "points_reward": 150,
                "is_active": True
            },
            {
                "id": str(uuid.uuid4()),
                "day": 2,
                "title": "Campus Outreach",
                "description": "Visit different departments in your college and introduce DC Studios to students. Collect contact information of interested students.",
                "task_type": "outreach",
                "points_reward": 200,
                "is_active": True
            },
            {
                "id": str(uuid.uuid4()),
                "day": 3,
                "title": "Event Planning",
                "description": "Plan and organize a small tech event or workshop in your college. Submit your event proposal and timeline.",
                "task_type": "event",
                "points_reward": 250,
                "is_active": True
            },
            {
                "id": str(uuid.uuid4()),
                "day": 4,
                "title": "Content Creation",
                "description": "Create engaging content about DC Studios services. This could be a blog post, video, or infographic.",
                "task_type": "content",
                "points_reward": 180,
                "is_active": True
            },
            {
                "id": str(uuid.uuid4()),
                "day": 5,
                "title": "Feedback Collection",
                "description": "Collect feedback from students about their interest in tech services and internship opportunities.",
                "task_type": "feedback",
                "points_reward": 120,
                "is_active": True
            },
            {
                "id": str(uuid.uuid4()),
                "day": 6,
                "title": "Partnership Development",
                "description": "Identify potential partnership opportunities with student clubs, societies, or college administration.",
                "task_type": "partnership",
                "points_reward": 300,
                "is_active": True
            },
            {
                "id": str(uuid.uuid4()),
                "day": 7,
                "title": "Weekly Report",
                "description": "Submit a comprehensive weekly report of your activities, achievements, and challenges faced.",
                "task_type": "report",
                "points_reward": 100,
                "is_active": True
            }
        ]

        for task_data in default_tasks:
            await db_service.create_task(task_data)

# Routes
@api_router.post("/register")
async def register(user_data: UserCreate, db: AsyncSession = Depends(get_db)):
    db_service = DatabaseService(db)
    
    # Check if user exists
    existing_user = await db_service.get_user_by_email(user_data.email)
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    user_dict = {
        "id": str(uuid.uuid4()),
        "email": user_data.email,
        "password_hash": hash_password(user_data.password),
        "name": user_data.name,
        "college": user_data.college,
        "group_leader_name": user_data.group_leader_name,
        "role": user_data.role,
        "current_day": 0,
        "total_points": 0,
        "total_referrals": 0,
        "registration_date": datetime.utcnow(),
        "is_active": True,
        "status": "active"
    }
    
    user_id = await db_service.create_user(user_dict)
    user = await db_service.get_user_by_id(user_id)
    
    # Create access token
    token = create_access_token(user.id)
    rank = await calculate_user_rank(user.id, db)
    
    return {
        "message": "Registration successful",
        "token": token,
        "user": UserProfile(
            id=user.id,
            email=user.email,
            name=user.name,
            college=user.college,
            group_leader_name=user.group_leader_name,
            role=user.role,
            current_day=user.current_day,
            total_points=user.total_points,
            total_referrals=user.total_referrals,
            rank_position=rank,
            registration_date=user.registration_date,
            status=user.status
        )
    }

@api_router.post("/login")
async def login(login_data: UserLogin, db: AsyncSession = Depends(get_db)):
    db_service = DatabaseService(db)
    
    # Find user
    user = await db_service.get_user_by_email(login_data.email)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # Verify password
    if not verify_password(login_data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # Verify role matches
    if user.role != login_data.role:
        raise HTTPException(status_code=401, detail="Invalid role for this account")

    # Check if user is suspended
    if user.status == "suspended":
        raise HTTPException(status_code=403, detail="Your account has been suspended. Please contact support.")

    # Check if user is inactive
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Your account is inactive. Please contact support.")

    # Create access token
    token = create_access_token(user.id)
    rank = await calculate_user_rank(user.id, db)

    return {
        "message": "Login successful",
        "token": token,
        "user": UserProfile(
            id=user.id,
            email=user.email,
            name=user.name,
            college=user.college,
            group_leader_name=user.group_leader_name,
            role=user.role,
            current_day=user.current_day,
            total_points=user.total_points,
            total_referrals=user.total_referrals,
            rank_position=rank,
            registration_date=user.registration_date,
            status=user.status
        )
    }

@api_router.get("/profile")
async def get_profile(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    rank = await calculate_user_rank(current_user.id, db)



    return UserProfile(
        id=current_user.id,
        email=current_user.email,
        name=current_user.name,
        college=current_user.college,
        group_leader_name=current_user.group_leader_name,
        role=current_user.role,
        current_day=current_user.current_day,
        total_points=current_user.total_points,
        total_referrals=current_user.total_referrals,
        rank_position=rank,
        registration_date=current_user.registration_date,
        status=current_user.status
    )

@api_router.put("/profile")
async def update_profile(
    profile: ProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Optional: validate email or fields before saving
    if not profile.name.strip():
        raise HTTPException(status_code=400, detail="Name cannot be empty")

    # Fetch the latest user instance from DB
    result = await db.execute(select(User).where(User.id == current_user.id))
    user_obj = result.scalars().first()

    if not user_obj:
        raise HTTPException(status_code=404, detail="User not found")

    # Update fields
    user_obj.name = profile.name
    user_obj.email = profile.email
    user_obj.college = profile.college
    user_obj.group_leader_name = profile.group_leader_name

    await db.commit()
    await db.refresh(user_obj)

    return {
        "status": "success",
        "message": "Profile updated successfully",
        "data": {
            "name": user_obj.name,
            "email": user_obj.email,
            "college": user_obj.college,
            "group_leader_name": user_obj.group_leader_name
        }
    }

@api_router.get("/tasks")
async def get_tasks(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    db_service = DatabaseService(db)
    tasks = await db_service.get_all_active_tasks()
    return tasks

@api_router.get("/leaderboard")
async def get_leaderboard(limit: int = 10, db: AsyncSession = Depends(get_db)):
    db_service = DatabaseService(db)
    return await db_service.get_leaderboard(limit)

@api_router.post("/submit-task")
async def submit_task_text(
    submission: TaskSubmissionCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    db_service = DatabaseService(db)
    
    # Get the task to validate
    task = await db_service.get_task_by_id(submission.task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Calculate points (base + bonus for people connected)
    points_earned = task.points_reward + (submission.people_connected * 10)
    
    # Check if already submitted
    existing_submission = await db_service.get_submission_by_user_and_task(current_user.id, submission.task_id)
    
    submission_data = {
        "user_id": current_user.id,
        "task_id": submission.task_id,
        "day": task.day,
        "status_text": submission.status_text,
        "people_connected": submission.people_connected,
        "points_earned": points_earned,
        "is_completed": True,
        "submission_date": datetime.utcnow()
    }
    
    if existing_submission:
        # Update existing submission
        old_points = existing_submission.points_earned
        point_difference = points_earned - old_points
        
        await db_service.update_submission(existing_submission.id, submission_data)
        
        # Update user points and referrals
        await db_service.update_user_points(
            current_user.id, 
            point_difference, 
            submission.people_connected - existing_submission.people_connected
        )
    else:
        # Create new submission
        submission_data["id"] = str(uuid.uuid4())
        await db_service.create_submission(submission_data)
        
        # Update user points and referrals
        await db_service.update_user_points(current_user.id, points_earned, submission.people_connected)
    
    # Update user's current day if this was their current task
    if task.day == current_user.current_day:
        await db_service.update_user_current_day(current_user.id, current_user.current_day + 1)
    
    return {"message": "Task submitted successfully", "points_earned": points_earned}

@api_router.get("/dashboard-stats")
async def get_dashboard_stats(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    db_service = DatabaseService(db)
    
    # Get user's submissions
    submissions = await db_service.get_user_submissions(current_user.id)
    
    # Get updated user data
    user = await db_service.get_user_by_id(current_user.id)
    
    total_tasks_completed = len(submissions)
    current_day = user.current_day
    
    # Get next task
    next_task = await db_service.get_task_by_day(current_day)
    
    # Calculate rank
    rank = await calculate_user_rank(user.id, db)
    
    # Calculate completion percentage
    total_available_tasks = current_day + 1
    completion_percentage = (total_tasks_completed / max(total_available_tasks, 1)) * 100
    
    return {
        "total_points": user.total_points,
        "total_referrals": user.total_referrals,
        "current_day": current_day,
        "total_tasks_completed": total_tasks_completed,
        "rank": rank,
        "completion_percentage": round(completion_percentage, 1),
        "next_task": {
            "id": next_task.id if next_task else None,
            "title": next_task.title if next_task else "No more tasks",
            "description": next_task.description if next_task else "",
            "points_reward": next_task.points_reward if next_task else 0
        } if next_task else None
    }

@api_router.get("/my-submissions")
async def get_my_submissions(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    db_service = DatabaseService(db)
    submissions = await db_service.get_user_submissions(current_user.id)
    return submissions

# @api_router.post("/submit-task-with-files")
# async def submit_task_with_files(
#     task_id: str = Form(...),
#     status_text: str = Form(...),
#     people_connected: int = Form(0),
#     files: List[UploadFile] = File(...),
#     current_user: User = Depends(get_current_user),
#     db: AsyncSession = Depends(get_db)
# ):
#     db_service = DatabaseService(db)
@api_router.post("/submit-task-with-files")
async def submit_task_with_files(
    task_id: str = Form(...),
    status_text: str = Form(""),
    people_connected: int = Form(0),
    files: List[UploadFile] = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    db_service = DatabaseService(db)

    # 1) Validate task
    task = await db_service.get_task_by_id(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    # 2) Save files locally (adjust path as you like)
    upload_dir = Path("uploads")
    upload_dir.mkdir(parents=True, exist_ok=True)

    saved_filenames: List[str] = []
    try:
        for f in files:
            if not f.filename:
                continue
            dest = upload_dir / f.filename
            content = await f.read()
            dest.write_bytes(content)
            saved_filenames.append(f.filename)
    except Exception as e:
        # Surface a 400 instead of a 500 so you see the real issue in the client
        raise HTTPException(status_code=400, detail=f"Failed to save files: {e}")

    # 3) Compute points
    points_earned = task.points_reward + (people_connected * 10)

    # 4) Build the submission payload ONLY with columns your model has
    submission_data = {
        "user_id": current_user.id,
        "task_id": task_id,
        "day": task.day,
        "status_text": status_text,
        "people_connected": people_connected,
        "points_earned": points_earned,
        "is_completed": True,
        "submission_date": datetime.utcnow(),
        # If your Submission model has a column for filenames, use the correct name here:
        # e.g. "file_names": ",".join(saved_filenames)
    }

    # 5) Upsert submission
    existing = await db_service.get_submission_by_user_and_task(current_user.id, task_id)

    if existing:
        old_points = existing.points_earned
        point_diff = points_earned - old_points

        await db_service.update_submission(existing.id, submission_data)
        await db_service.update_user_points(
            current_user.id,
            point_diff,
            people_connected - existing.people_connected
        )
    else:
        submission_data["id"] = str(uuid.uuid4())
        await db_service.create_submission(submission_data)
        await db_service.update_user_points(current_user.id, points_earned, people_connected)

    # 6) Advance current day if needed
    if task.day == current_user.current_day:
        await db_service.update_user_current_day(current_user.id, current_user.current_day + 1)

    return {
        "message": "Task submitted successfully",
        "points_earned": points_earned,
        "saved_files": saved_filenames,
    }
@api_router.post("/change-password")
async def change_password(
    data: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Verify old password
    if not verify_password(data.old_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Old password is incorrect")

    # Hash new password
    new_password_hash = hash_password(data.new_password)

    # Update password in database
    db_service = DatabaseService(db)
    await db_service.update_user_password(current_user.id, new_password_hash)

    return {"message": "Password changed successfully"}

# Initialize tasks on startup
# @app.on_event("startup")
# async def startup_event():
#     await init_db()
#     await initialize_tasks()

# Include the router in the main app (move this AFTER CORS middleware)
app.include_router(api_router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=5000, log_level="info")
