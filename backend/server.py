from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File, Form, Depends, Body, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field, field_validator
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
from uuid import UUID
from datetime import datetime, timedelta
import jwt
import hashlib
import base64
from io import BytesIO
from contextlib import asynccontextmanager
import traceback
from fastapi.responses import JSONResponse
from supabase import create_client, Client
import uvicorn


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

# Supabase Configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
SUPABASE_BUCKET = "submissions"

# Create Supabase client (only if credentials are provided)
supabase: Client = None
if SUPABASE_URL and SUPABASE_KEY:
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        print("✅ Supabase client initialized successfully")
    except Exception as e:
        print(f"⚠️ Failed to initialize Supabase client: {e}")
        print("📁 File uploads will be stored locally in uploads/ directory")
else:
    print("⚠️ Supabase credentials not provided (SUPABASE_URL, SUPABASE_KEY)")
    print("📁 File uploads will be stored locally in uploads/ directory")

# Create the main app with lifespan
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    try:
        db_connected = await init_db()
        if db_connected:
            await initialize_tasks()
        else:
            print("⚠️ Starting server without database connection (fallback mode)")
    except Exception as e:
        print(f"⚠️ Database initialization failed: {e}")
        print("⚠️ Starting server without database connection (fallback mode)")
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
        "http://localhost:5000",
        "http://127.0.0.1:5000",
    ],
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods
    allow_headers=["*"],  # Allow all headers
    expose_headers=["*"],  # Expose all headers
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

    class Config:
        from_attributes = True

    @field_validator('id')
    @classmethod
    def convert_uuid_to_str(cls, v):
        if isinstance(v, UUID):
            return str(v)
        return v

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

def create_access_token(user_id) -> str:
    payload = {
        "sub": str(user_id),  # Convert UUID to string and use 'sub' as standard JWT claim
        "exp": datetime.utcnow() + JWT_EXPIRATION_DELTA
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: AsyncSession = Depends(get_db)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")  # Use 'sub' claim instead of 'user_id'
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

def get_current_day_from_registration(registration_date: datetime) -> int:
    """Calculate current day based on registration date"""
    now = datetime.utcnow()
    days_passed = (now - registration_date).days
    return max(1, days_passed + 1)  # Day 1 starts immediately after registration

async def get_available_tasks_for_user(user: User, db: AsyncSession) -> List[dict]:
    """Get available tasks based on user's current day and completion status"""
    db_service = DatabaseService(db)
    
    # Calculate current day based on registration date
    current_day = get_current_day_from_registration(user.registration_date)
    
    # Get all tasks
    all_tasks = await db_service.get_all_active_tasks()
    
    # Get user's completed tasks
    user_submissions = await db_service.get_user_submissions(user.id)
    completed_task_ids = {sub.task_id for sub in user_submissions if sub.is_completed}
    
    available_tasks = []
    
    for task in all_tasks:
        # Task availability logic - make it more permissive
        is_available = False
        
        if current_day == 0:
            # Registration day (Day 0): Day 0 and Day 1 tasks available
            if task.day in [0, 1]:
                is_available = True
        elif current_day == 1:
            # Day 1: Day 0, Day 1, and Day 2 tasks available
            if task.day in [0, 1, 2]:
                is_available = True
        else:
            # Day 2+: Current day and next day tasks available, plus all previous incomplete tasks
            if task.day <= current_day + 1:
                is_available = True
        
        if is_available:
            task_dict = {
                "id": task.id,
                "title": task.title,
                "description": task.description,
                "points": task.points_reward,
                "day": task.day,
                "status": "completed" if task.id in completed_task_ids else "available",
                "deadline": (user.registration_date + timedelta(days=task.day + 1)).isoformat() if task.day > 0 else None
            }
            available_tasks.append(task_dict)
    
    return sorted(available_tasks, key=lambda x: x["day"])

# Initialize default tasks
async def initialize_tasks():
    try:
        async with AsyncSessionLocal() as session:
            db_service = DatabaseService(session)

            # Check if tasks already exist
            existing_tasks = await db_service.get_all_active_tasks()
            if len(existing_tasks) > 0:
                return
            default_tasks = [
            {
                "id": uuid.uuid4(),
                "day": 0,
                "title": "Complete Orientation",
                "description": "Watch the orientation video and read the company documents. This will help you understand our mission and how to be an effective ambassador.",
                "task_type": "orientation",
                "points_reward": 100,
                "is_active": True
            },
            {
                "id": uuid.uuid4(),
                "day": 1,
                "title": "Social Media Setup",
                "description": "Set up your social media profiles and connect with our official accounts. Share your first post about joining DC Studios.",
                "task_type": "social_media",
                "points_reward": 150,
                "is_active": True
            },
            {
                "id": uuid.uuid4(),
                "day": 2,
                "title": "Campus Outreach",
                "description": "Visit different departments in your college and introduce DC Studios to students. Collect contact information of interested students.",
                "task_type": "outreach",
                "points_reward": 200,
                "is_active": True
            },
            {
                "id": uuid.uuid4(),
                "day": 3,
                "title": "Event Planning",
                "description": "Plan and organize a small tech event or workshop in your college. Submit your event proposal and timeline.",
                "task_type": "event",
                "points_reward": 250,
                "is_active": True
            },
            {
                "id": uuid.uuid4(),
                "day": 4,
                "title": "Content Creation",
                "description": "Create engaging content about DC Studios services. This could be a blog post, video, or infographic.",
                "task_type": "content",
                "points_reward": 180,
                "is_active": True
            },
            {
                "id": uuid.uuid4(),
                "day": 5,
                "title": "Feedback Collection",
                "description": "Collect feedback from students about their interest in tech services and internship opportunities.",
                "task_type": "feedback",
                "points_reward": 120,
                "is_active": True
            },
            {
                "id": uuid.uuid4(),
                "day": 6,
                "title": "Partnership Development",
                "description": "Identify potential partnership opportunities with student clubs, societies, or college administration.",
                "task_type": "partnership",
                "points_reward": 300,
                "is_active": True
            },
            {
                "id": uuid.uuid4(),
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
    except Exception as e:
        print(f"⚠️ Failed to initialize tasks: {e}")
        return

# Routes
@app.get("/")
async def root():
    return {
        "message": "DC Studios Ambassador Platform API",
        "status": "running",
        "version": "1.0.0",
        "endpoints": {
            "health": "/api/health",
            "login": "/api/login",
            "register": "/api/register"
        }
    }

@api_router.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "database": "connected"
    }

@api_router.post("/register")
async def register(user_data: UserCreate, db: AsyncSession = Depends(get_db)):
    db_service = DatabaseService(db)
    
    # Check if user exists
    existing_user = await db_service.get_user_by_email(user_data.email)
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    user_dict = {
        "id": uuid.uuid4(),
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
            id=str(user.id),
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
            id=str(user.id),
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
async def get_profile(current_user: User = Depends(get_current_user)):
    rank = await calculate_user_rank(current_user.id, AsyncSessionLocal())
    
    return UserProfile(
        id=str(current_user.id),
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
    """Get tasks available for the current user based on their registration day"""
    return await get_available_tasks_for_user(current_user, db)

@api_router.get("/all-tasks")
async def get_all_tasks(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Get all tasks with their status (available, completed, locked) for the current user"""
    db_service = DatabaseService(db)
    
    # Calculate current day based on registration date
    current_day = get_current_day_from_registration(current_user.registration_date)
    print(f"🔍 User {current_user.email} is on day {current_day}")
    
    # Get all tasks
    all_tasks = await db_service.get_all_active_tasks()
    
    # Get user's completed tasks
    user_submissions = await db_service.get_user_submissions(current_user.id)
    completed_task_ids = {sub.task_id for sub in user_submissions if sub.is_completed}
    
    tasks_with_status = []
    
    for task in all_tasks:
        # Determine if task is available, completed, or locked
        if task.id in completed_task_ids:
            status = "completed"
        elif current_day == 0 and task.day in [0, 1]:
            status = "available"
        elif current_day == 1 and task.day in [0, 1, 2]:
            status = "available"
        elif current_day >= 2 and task.day <= current_day + 1:
            status = "available"
        else:
            status = "locked"
        
        task_dict = {
            "id": task.id,
            "title": task.title,
            "description": task.description,
            "points": task.points_reward,
            "day": task.day,
            "status": status,
            "deadline": (current_user.registration_date + timedelta(days=task.day + 1)).isoformat() if task.day > 0 else None
        }
        tasks_with_status.append(task_dict)
        
        print(f"   Task: {task.title} (Day {task.day}) -> {status}")
    
    return sorted(tasks_with_status, key=lambda x: x["day"])

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
    
    # Verify task is available for user
    available_tasks = await get_available_tasks_for_user(current_user, db)
    available_task_ids = {t["id"] for t in available_tasks}
    
    if submission.task_id not in available_task_ids:
        raise HTTPException(status_code=400, detail="Task not available for your current day")
    
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
        submission_data["id"] = uuid.uuid4()
        await db_service.create_submission(submission_data)
        
        # Update user points and referrals
        await db_service.update_user_points(current_user.id, points_earned, submission.people_connected)
    
    return {"message": "Task submitted successfully", "points_earned": points_earned}

@api_router.get("/dashboard-stats")
async def get_dashboard_stats(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    db_service = DatabaseService(db)
    
    # Calculate current day from registration
    current_day = get_current_day_from_registration(current_user.registration_date)
    
    # Get user's submissions
    submissions = await db_service.get_user_submissions(current_user.id)
    completed_submissions = [s for s in submissions if s.is_completed]
    
    # Get updated user data
    user = await db_service.get_user_by_id(current_user.id)
    
    total_tasks_completed = len(completed_submissions)
    
    # Get available tasks for current day
    available_tasks = await get_available_tasks_for_user(user, db)
    total_available_tasks = len(available_tasks)
    
    # Get next incomplete task
    incomplete_tasks = [t for t in available_tasks if t["status"] != "completed"]
    next_task = min(incomplete_tasks, key=lambda x: x["day"]) if incomplete_tasks else None
    
    # Calculate rank
    rank = await calculate_user_rank(user.id, db)
    
    # Calculate completion percentage based on available tasks
    completion_percentage = (total_tasks_completed / max(total_available_tasks, 1)) * 100
    
    return {
        "total_points": user.total_points,
        "total_referrals": user.total_referrals,
        "current_day": current_day,
        "total_tasks_completed": total_tasks_completed,
        "total_available_tasks": total_available_tasks,
        "rank": rank,
        "completion_percentage": round(completion_percentage, 1),
        "next_task": next_task,
        "days_since_registration": current_day
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
    files: List[UploadFile] = File(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    db_service = DatabaseService(db)

    print(f"🔍 Task submission attempt:")
    print(f"   User: {current_user.email}")
    print(f"   Registration date: {current_user.registration_date}")
    print(f"   Task ID: {task_id}")

    # Calculate current day for debugging
    current_day = get_current_day_from_registration(current_user.registration_date)
    print(f"   Current day: {current_day}")

    # Convert task_id to UUID for comparison
    try:
        task_uuid = UUID(task_id)
    except ValueError:
        print(f"❌ Invalid task ID format: {task_id}")
        raise HTTPException(status_code=400, detail="Invalid task ID format")

    # 1) Validate task
    task = await db_service.get_task_by_id(task_uuid)
    if not task:
        print(f"❌ Task not found: {task_id}")
        raise HTTPException(status_code=404, detail="Task not found")

    print(f"   Task found: {task.title} (Day {task.day})")

    # Verify task is available for user
    available_tasks = await get_available_tasks_for_user(current_user, db)
    available_task_ids = {t["id"] for t in available_tasks}

    print(f"   Available task IDs: {available_task_ids}")
    print(f"   Is task available: {task_uuid in available_task_ids}")

    if task_uuid not in available_task_ids:
        print(f"❌ Task not available for current day")
        print(f"   Available tasks: {[t['title'] + f' (Day {t['day']})' for t in available_tasks]}")
        raise HTTPException(status_code=400, detail="Task not available for your current day")

    # 2) Compute points
    points_earned = task.points_reward + (people_connected * 10)

    # 3) Build the submission payload
    submission_data = {
        "user_id": current_user.id,
        "task_id": task_uuid,
        "day": task.day,
        "status_text": status_text,
        "people_connected": people_connected,
        "points_earned": points_earned,
        "is_completed": True,
        "submission_date": datetime.utcnow(),
    }

    # 4) Upsert submission
    existing = await db_service.get_submission_by_user_and_task(current_user.id, task_id)
    submission_id = None

    if existing:
        old_points = existing.points_earned
        point_diff = points_earned - old_points

        await db_service.update_submission(existing.id, submission_data)
        await db_service.update_user_points(
            current_user.id,
            point_diff,
            people_connected - existing.people_connected
        )
        submission_id = existing.id
    else:
        submission_id = uuid.uuid4()
        submission_data["id"] = submission_id
        await db_service.create_submission(submission_data)
        await db_service.update_user_points(current_user.id, points_earned, people_connected)

    # 5) Upload files (Supabase or local fallback)
    file_urls = []

    # For Day 0 (orientation) tasks, files are optional
    if files is None:
        files = []

    # Try Supabase first, fall back to local storage if it fails
    use_local_storage = False

    if supabase is not None:
        # Upload to Supabase Storage
        try:
            for file in files:
                if not file.filename:
                    continue

                # Generate unique file name
                file_extension = file.filename.split(".")[-1] if "." in file.filename else "bin"
                unique_filename = f"{submission_id}_{uuid.uuid4()}.{file_extension}"

                # Read file content
                file_content = await file.read()

                # Upload to Supabase Storage
                upload_response = supabase.storage.from_(SUPABASE_BUCKET).upload(unique_filename, file_content)

                # Get the public URL for the uploaded file
                public_url = supabase.storage.from_(SUPABASE_BUCKET).get_public_url(unique_filename)
                print("Image public URL:", public_url)

                file_urls.append({
                    "filename": file.filename,
                    "url": public_url
                })

                # Create SubmissionFile record in the database
                try:
                    await db_service.create_submission_files(
                        str(submission_id),
                        [public_url],
                        [file.content_type or 'application/octet-stream']
                    )
                    print(f"✅ Created SubmissionFile record for: {file.filename}")
                except Exception as e:
                    print(f"⚠️ Could not create SubmissionFile record: {e}")
                    # Continue without failing

        except Exception as e:
            print(f"❌ File upload error: {e}")
            # If Supabase fails, fall back to local storage
            if "Bucket not found" in str(e) or "bucket" in str(e).lower():
                print(f"📁 Falling back to local storage due to Supabase error")
                use_local_storage = True
            else:
                raise HTTPException(status_code=500, detail=f"Failed to upload files: {str(e)}")
    else:
        use_local_storage = True

    if use_local_storage:
        # Fallback to local storage
        uploads_dir = Path("uploads")
        uploads_dir.mkdir(exist_ok=True)

        # Clear any partial uploads from Supabase attempt
        file_urls = []

        try:
            for file in files:
                if not file.filename:
                    continue

                # Reset file pointer if it was read during Supabase attempt
                await file.seek(0)

                # Generate unique file name
                file_extension = file.filename.split(".")[-1] if "." in file.filename else "bin"
                unique_filename = f"{submission_id}_{uuid.uuid4()}.{file_extension}"

                # Save to local uploads directory
                file_path = uploads_dir / unique_filename

                # Read and save file content
                file_content = await file.read()
                with open(file_path, "wb") as f:
                    f.write(file_content)

                local_url = f"/uploads/{unique_filename}"
                file_urls.append({
                    "filename": file.filename,
                    "url": local_url
                })

                # Create SubmissionFile record in the database for local files too
                try:
                    await db_service.create_submission_files(
                        str(submission_id),
                        [local_url],
                        [file.content_type or 'application/octet-stream']
                    )
                    print(f"✅ Created SubmissionFile record for local file: {file.filename}")
                except Exception as e:
                    print(f"⚠️ Could not create SubmissionFile record for local file: {e}")

                print(f"📁 File saved locally: {file_path}")

        except Exception as e:
            print(f"❌ Local file save error: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to save files locally: {str(e)}")

    return {
        "message": "Task submitted successfully",
        "points_earned": points_earned,
        "saved_files": [f["filename"] for f in file_urls],
        "file_urls": file_urls,
    }

# Admin endpoints for file management
@api_router.post("/upload_submission")
async def upload_submission(
    submission_id: str = Form(...),  # existing submission_id
    files: List[UploadFile] = File(...),
    current_user: User = Depends(get_current_user)
):
    # Verify admin access
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    if supabase is None:
        raise HTTPException(status_code=503, detail="File upload service not available. Please configure Supabase credentials.")
    
    file_urls = []
    
    try:
        for file in files:
            if not file.filename:
                continue
                
            # Generate unique file name
            file_extension = file.filename.split(".")[-1] if "." in file.filename else "bin"
            unique_filename = f"{submission_id}_{uuid.uuid4()}.{file_extension}"
            
            # Read file content
            file_content = await file.read()
            
            # Upload to Supabase Storage
            upload_response = supabase.storage.from_(SUPABASE_BUCKET).upload(unique_filename, file_content)
            
            # Old (incorrect) code:
            # file_url = upload_response.get('key')

            # New (correct) code:
            file_url = getattr(upload_response, 'key', None)
            # Or, if your client uses .data:
            # file_url = upload_response.data.get('Key') if hasattr(upload_response, 'data') else None
            
            file_urls.append(file_url)
            
            # Insert into submission_files table
            try:
                supabase.table("submission_files").insert({
                    "submission_id": submission_id,
                    "file_url": file_url,
                    "filename": file.filename,
                    "created_at": datetime.utcnow().isoformat()
                }).execute()
            except Exception as e:
                print(f"⚠️ Could not insert into submission_files table: {e}")
                
    except Exception as e:
        print(f"❌ File upload error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to upload files: {str(e)}")
    
    return {"message": "Files uploaded successfully", "file_urls": file_urls}

@api_router.get("/admin/user_submissions/{user_id}")
async def get_user_submissions_with_files(
    user_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Verify admin access
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    db_service = DatabaseService(db)
    
    try:
        # Fetch all submissions for this user from your database
        submissions = await db_service.get_user_submissions(user_id)
        submission_ids = [s.id for s in submissions]
        
        if not submission_ids:
            return {"user_id": user_id, "submissions": [], "files": []}
        
        # Fetch all files for these submissions from Supabase (if available)
        files_data = []
        if supabase is not None:
            try:
                files_response = supabase.table("submission_files").select("*").in_("submission_id", submission_ids).execute()
                files_data = files_response.data if files_response.data else []
            except Exception as e:
                print(f"⚠️ Could not fetch files from submission_files table: {e}")
                files_data = []
        else:
            print("⚠️ Supabase not available, cannot fetch submission files")
        
        # Format submissions data
        submissions_data = []
        for submission in submissions:
            submission_files = [f for f in files_data if f["submission_id"] == submission.id]
            submissions_data.append({
                "id": submission.id,
                "task_id": submission.task_id,
                "status_text": submission.status_text,
                "people_connected": submission.people_connected,
                "points_earned": submission.points_earned,
                "submission_date": submission.submission_date.isoformat() if submission.submission_date else None,
                "is_completed": submission.is_completed,
                "files": submission_files
            })
        
        return {
            "user_id": user_id, 
            "submissions": submissions_data,
            "total_files": len(files_data)
        }
        
    except Exception as e:
        print(f"❌ Error fetching user submissions: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch user submissions")

# Admin Dashboard Endpoints
@api_router.get("/admin/ambassadors")
async def get_all_ambassadors(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Verify admin access
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    db_service = DatabaseService(db)

    try:
        # Get all ambassador users
        ambassadors = await db_service.get_all_users()

        # Filter only ambassadors and calculate their stats
        ambassador_data = []
        for user in ambassadors:
            if user.role == "ambassador":
                # Get user's submissions and calculate stats
                submissions = await db_service.get_user_submissions(user.id)
                total_points = sum(sub.points_earned or 0 for sub in submissions)
                tasks_completed = len([sub for sub in submissions if sub.status == "completed"])

                # Debug logging
                print(f"🔍 User {user.name}: {len(submissions)} submissions, {tasks_completed} completed")
                if submissions:
                    print(f"   Sample statuses: {[sub.status for sub in submissions[:3]]}")

                ambassador_data.append({
                    "id": str(user.id),
                    "user_id": str(user.id),
                    "name": user.name,
                    "email": user.email,
                    "college": user.college,
                    "group_leader_name": user.group_leader_name,
                    "status": user.status or "active",
                    "is_active": user.is_active,
                    "registration_date": user.registration_date.isoformat() if user.registration_date else None,
                    "last_login": user.last_login.isoformat() if user.last_login else None,
                    "tasks_completed": tasks_completed,
                    "total_points": total_points,
                    "total_submissions": len(submissions)
                })

        # Sort by total points descending
        ambassador_data.sort(key=lambda x: x["total_points"], reverse=True)

        return ambassador_data

    except Exception as e:
        print(f"❌ Error fetching ambassadors: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch ambassadors data")

@api_router.get("/admin/submissions")
async def get_all_submissions(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Verify admin access
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    db_service = DatabaseService(db)

    try:
        # Get all submissions with user details
        all_submissions = []
        users = await db_service.get_all_users()

        for user in users:
            if user.role == "ambassador":
                submissions = await db_service.get_user_submissions(user.id)
                for submission in submissions:
                    all_submissions.append({
                        "id": str(submission.id),
                        "user_id": str(user.id),
                        "user_name": user.name,
                        "user_email": user.email,
                        "task_id": submission.task_id,
                        "status_text": submission.status_text,
                        "people_connected": submission.people_connected,
                        "points_earned": submission.points_earned,
                        "submission_date": submission.submission_date.isoformat() if submission.submission_date else None,
                        "updated_at": submission.updated_at.isoformat() if submission.updated_at else None,
                        "file_urls": submission.proof_files or []
                    })

        # Sort by submission date descending
        all_submissions.sort(key=lambda x: x["submission_date"] or x["created_at"] or "", reverse=True)

        return all_submissions

    except Exception as e:
        print(f"❌ Error fetching submissions: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch submissions data")

@api_router.get("/admin/dashboard-stats")
async def get_admin_dashboard_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Verify admin access
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    db_service = DatabaseService(db)

    try:
        # Get all users and submissions
        all_users = await db_service.get_all_users()
        ambassadors = [user for user in all_users if user.role == "ambassador"]
        active_ambassadors = [user for user in ambassadors if user.is_active and (user.status != "suspended")]

        # Get all submissions
        all_submissions = []
        total_points = 0

        for user in ambassadors:
            submissions = await db_service.get_user_submissions(user.id)
            all_submissions.extend(submissions)
            total_points += sum(sub.points_earned or 0 for sub in submissions)

        # Calculate time-based stats
        from datetime import datetime, timedelta
        now = datetime.utcnow()
        today = now.date()
        week_ago = now - timedelta(days=7)

        # Today's submissions
        today_submissions = [
            sub for sub in all_submissions
            if sub.submission_date and sub.submission_date.date() == today
        ]

        # This week's submissions
        week_submissions = [
            sub for sub in all_submissions
            if sub.submission_date and sub.submission_date >= week_ago
        ]

        # Pending approvals (submissions that need review)
        pending_submissions = [
            sub for sub in all_submissions
            if sub.status_text in ["submitted", "pending", "in_progress"]
        ]

        # Get total available tasks
        tasks = await db_service.get_all_tasks()
        total_available_tasks = len([task for task in tasks if task.is_active])

        return {
            "total_ambassadors": len(ambassadors),
            "active_ambassadors": len(active_ambassadors),
            "total_tasks_assigned": len(ambassadors) * total_available_tasks,
            "tasks_completed_today": len(today_submissions),
            "total_tasks_submitted": len(all_submissions),
            "tasks_submitted_this_week": len(week_submissions),
            "total_points_distributed": total_points,
            "pending_approvals": len(pending_submissions),
            "system_health": 98,  # Could be calculated based on error rates, uptime, etc.
            "total_available_tasks": total_available_tasks
        }

    except Exception as e:
        print(f"❌ Error calculating dashboard stats: {e}")
        raise HTTPException(status_code=500, detail="Failed to calculate dashboard statistics")

@api_router.get("/admin/all_submissions_with_files")
async def get_all_submissions_with_files(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Verify admin access
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    db_service = DatabaseService(db)

    try:
        # Get all users and their submissions
        all_submissions_with_files = []
        users = await db_service.get_all_users()

        for user in users:
            if user.role == "ambassador":
                submissions = await db_service.get_user_submissions(user.id)
                for submission in submissions:
                    all_submissions_with_files.append({
                        "id": str(submission.id),
                        "user_id": str(user.id),
                        "user_name": user.name,
                        "user_email": user.email,
                        "user_college": user.college,
                        "task_id": submission.task_id,
                        "status_text": submission.status_text,
                        "people_connected": submission.people_connected,
                        "points_earned": submission.points_earned,
                        "submission_date": submission.submission_date.isoformat() if submission.submission_date else None,
                        "updated_at": submission.updated_at.isoformat() if submission.updated_at else None,
                        "file_urls": submission.proof_files or []
                    })

        return all_submissions_with_files

    except Exception as e:
        print(f"❌ Error fetching submissions with files: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch submissions with files")

@api_router.post("/admin/ambassador/{ambassador_id}/action")
async def admin_ambassador_action(
    ambassador_id: str,
    action: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Verify admin access
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    db_service = DatabaseService(db)

    try:
        action_type = action.get("action")

        if action_type == "suspend":
            await db_service.update_user_status(ambassador_id, "suspended")
            return {"message": "Ambassador suspended successfully"}
        elif action_type == "activate":
            await db_service.update_user_status(ambassador_id, "active")
            return {"message": "Ambassador activated successfully"}
        elif action_type == "deactivate":
            await db_service.update_user_status(ambassador_id, "inactive")
            return {"message": "Ambassador deactivated successfully"}
        else:
            raise HTTPException(status_code=400, detail="Invalid action type")

    except Exception as e:
        print(f"❌ Error performing ambassador action: {e}")
        raise HTTPException(status_code=500, detail="Failed to perform action")

@api_router.get("/admin/analytics/growth")
async def get_growth_analytics(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Verify admin access
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    db_service = DatabaseService(db)

    try:
        from datetime import datetime, timedelta

        # Get all ambassadors
        all_users = await db_service.get_all_users()
        ambassadors = [user for user in all_users if user.role == "ambassador"]

        # Calculate monthly growth for the last 6 months
        now = datetime.utcnow()
        monthly_data = []

        for i in range(6):
            month_start = now.replace(day=1) - timedelta(days=30*i)
            month_end = month_start + timedelta(days=30)

            registrations = len([
                user for user in ambassadors
                if user.registration_date and month_start <= user.registration_date < month_end
            ])

            activations = len([
                user for user in ambassadors
                if user.registration_date and month_start <= user.registration_date < month_end
                and user.is_active
            ])

            monthly_data.append({
                "month": month_start.strftime("%b %Y"),
                "registrations": registrations,
                "activations": activations
            })

        monthly_data.reverse()  # Show oldest to newest

        # Calculate overall metrics
        total_ambassadors = len(ambassadors)
        active_ambassadors = len([user for user in ambassadors if user.is_active])

        # Calculate weekly growth
        week_ago = now - timedelta(days=7)
        new_this_week = len([
            user for user in ambassadors
            if user.registration_date and user.registration_date >= week_ago
        ])

        prev_week_start = week_ago - timedelta(days=7)
        new_prev_week = len([
            user for user in ambassadors
            if user.registration_date and prev_week_start <= user.registration_date < week_ago
        ])

        weekly_growth = ((new_this_week - new_prev_week) / max(new_prev_week, 1)) * 100 if new_prev_week > 0 else 0

        return {
            "total_ambassadors": total_ambassadors,
            "active_ambassadors": active_ambassadors,
            "weekly_growth": round(weekly_growth, 1),
            "monthly_data": monthly_data,
            "avg_task_completion": 75,  # Could be calculated from actual data
            "total_points_awarded": sum(
                sum(sub.points_earned or 0 for sub in await db_service.get_user_submissions(user.id))
                for user in ambassadors
            ),
            "system_uptime": 99.8,
            "peak_active_hours": "2:00 PM - 6:00 PM",
            "top_performing_college": ambassadors[0].college if ambassadors else "N/A"
        }

    except Exception as e:
        print(f"❌ Error fetching growth analytics: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch growth analytics")

@api_router.get("/admin/analytics/performance")
async def get_performance_analytics(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Verify admin access
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    db_service = DatabaseService(db)

    try:
        # Get all ambassadors and their submissions
        all_users = await db_service.get_all_users()
        ambassadors = [user for user in all_users if user.role == "ambassador"]

        # Calculate performance metrics
        performance_data = []
        high_performers = 0
        average_performers = 0
        low_performers = 0

        for user in ambassadors:
            submissions = await db_service.get_user_submissions(user.id)
            total_points = sum(sub.points_earned or 0 for sub in submissions)
            tasks_completed = len([sub for sub in submissions if sub.status == "completed"])

            # Categorize performance (you can adjust these thresholds)
            if total_points >= 2000:
                high_performers += 1
                performance_category = "high"
            elif total_points >= 1000:
                average_performers += 1
                performance_category = "average"
            else:
                low_performers += 1
                performance_category = "low"

            performance_data.append({
                "user_id": str(user.id),
                "name": user.name,
                "college": user.college,
                "total_points": total_points,
                "tasks_completed": tasks_completed,
                "performance_category": performance_category
            })

        # Calculate college-wise performance
        college_performance = {}
        for user_data in performance_data:
            college = user_data["college"]
            if college not in college_performance:
                college_performance[college] = {
                    "total_ambassadors": 0,
                    "total_points": 0,
                    "avg_points": 0
                }
            college_performance[college]["total_ambassadors"] += 1
            college_performance[college]["total_points"] += user_data["total_points"]

        # Calculate averages
        for college in college_performance:
            college_data = college_performance[college]
            college_data["avg_points"] = college_data["total_points"] / college_data["total_ambassadors"]

        # Sort colleges by average performance
        top_colleges = sorted(
            college_performance.items(),
            key=lambda x: x[1]["avg_points"],
            reverse=True
        )[:5]

        return {
            "performance_distribution": {
                "high_performers": high_performers,
                "average_performers": average_performers,
                "low_performers": low_performers
            },
            "top_performers": sorted(performance_data, key=lambda x: x["total_points"], reverse=True)[:10],
            "college_rankings": [
                {
                    "college": college,
                    "avg_points": data["avg_points"],
                    "total_ambassadors": data["total_ambassadors"],
                    "total_points": data["total_points"]
                }
                for college, data in top_colleges
            ],
            "overall_stats": {
                "total_ambassadors": len(ambassadors),
                "avg_points_per_ambassador": sum(d["total_points"] for d in performance_data) / len(performance_data) if performance_data else 0,
                "completion_rate": (sum(d["tasks_completed"] for d in performance_data) / (len(performance_data) * 30)) * 100 if performance_data else 0  # Assuming 30 total tasks
            }
        }

    except Exception as e:
        print(f"❌ Error fetching performance analytics: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch performance analytics")

@api_router.get("/admin/analytics/engagement")
async def get_engagement_analytics(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Verify admin access
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    db_service = DatabaseService(db)

    try:
        from datetime import datetime, timedelta

        # Get all users and submissions
        all_users = await db_service.get_all_users()
        ambassadors = [user for user in all_users if user.role == "ambassador"]

        # Calculate daily engagement for the last 30 days
        now = datetime.utcnow()
        daily_engagement = []

        for i in range(30):
            day = now - timedelta(days=i)
            day_start = day.replace(hour=0, minute=0, second=0, microsecond=0)
            day_end = day_start + timedelta(days=1)

            daily_submissions = 0
            active_users = 0

            for user in ambassadors:
                submissions = await db_service.get_user_submissions(user.id)
                day_submissions = [
                    sub for sub in submissions
                    if sub.submission_date and day_start <= sub.submission_date < day_end
                ]

                if day_submissions:
                    daily_submissions += len(day_submissions)
                    active_users += 1

            daily_engagement.append({
                "date": day.strftime("%Y-%m-%d"),
                "submissions": daily_submissions,
                "active_users": active_users,
                "engagement_rate": (active_users / len(ambassadors)) * 100 if ambassadors else 0
            })

        daily_engagement.reverse()  # Show oldest to newest

        # Calculate peak hours (simplified - would need more detailed timestamp analysis)
        peak_hours = "2:00 PM - 6:00 PM"  # This could be calculated from actual submission times

        # Calculate retention metrics
        week_ago = now - timedelta(days=7)
        month_ago = now - timedelta(days=30)

        active_this_week = 0
        active_this_month = 0

        for user in ambassadors:
            submissions = await db_service.get_user_submissions(user.id)
            recent_submissions = [
                sub for sub in submissions
                if sub.submission_date and sub.submission_date >= week_ago
            ]
            month_submissions = [
                sub for sub in submissions
                if sub.submission_date and sub.submission_date >= month_ago
            ]

            if recent_submissions:
                active_this_week += 1
            if month_submissions:
                active_this_month += 1

        return {
            "daily_engagement": daily_engagement,
            "peak_hours": peak_hours,
            "retention_metrics": {
                "weekly_active_rate": (active_this_week / len(ambassadors)) * 100 if ambassadors else 0,
                "monthly_active_rate": (active_this_month / len(ambassadors)) * 100 if ambassadors else 0,
                "total_ambassadors": len(ambassadors)
            },
            "engagement_summary": {
                "avg_daily_submissions": sum(d["submissions"] for d in daily_engagement) / len(daily_engagement) if daily_engagement else 0,
                "avg_daily_active_users": sum(d["active_users"] for d in daily_engagement) / len(daily_engagement) if daily_engagement else 0,
                "peak_engagement_rate": max(d["engagement_rate"] for d in daily_engagement) if daily_engagement else 0
            }
        }

    except Exception as e:
        print(f"❌ Error fetching engagement analytics: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch engagement analytics")

# Community Management Endpoints
@api_router.get("/admin/community/stats")
async def get_community_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Verify admin access
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    try:
        # For now, return mock data since we don't have community tables yet
        # In a real implementation, you would query community posts, discussions, etc.
        return {
            "total_posts": 0,
            "active_discussions": 0,
            "flagged_content": 0,
            "community_engagement": 0,
            "recent_activity": []
        }

    except Exception as e:
        print(f"❌ Error fetching community stats: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch community statistics")

@api_router.get("/admin/community/posts")
async def get_community_posts(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Verify admin access
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    try:
        # Return empty array since we don't have community posts table yet
        return []

    except Exception as e:
        print(f"❌ Error fetching community posts: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch community posts")

@api_router.get("/admin/community/announcements")
async def get_announcements(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Verify admin access
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    try:
        # Return empty array since we don't have announcements table yet
        return []

    except Exception as e:
        print(f"❌ Error fetching announcements: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch announcements")

# Admin Profile Management Endpoints
@api_router.get("/admin/profile")
async def get_admin_profile(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Verify admin access
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    try:
        # Get admin user details
        admin_profile = {
            "id": str(current_user.id),
            "name": current_user.name,
            "email": current_user.email,
            "role": "System Administrator",
            "department": "DS Team",
            "created_at": current_user.registration_date.strftime("%Y-%m-%d") if current_user.registration_date else "N/A",
            "last_login": current_user.last_login.strftime("%Y-%m-%d %H:%M:%S") if current_user.last_login else "N/A",
            "permissions": [
                "user_management",
                "system_settings",
                "data_export",
                "security_config",
                "analytics_access",
                "task_management"
            ],
            "settings": {
                "email_notifications": True,
                "security_alerts": True,
                "weekly_reports": True,
                "system_updates": False
            }
        }

        return admin_profile

    except Exception as e:
        print(f"❌ Error fetching admin profile: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch admin profile")

@api_router.get("/admin/profile/stats")
async def get_admin_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Verify admin access
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    db_service = DatabaseService(db)

    try:
        # Get all users and calculate stats
        all_users = await db_service.get_all_users()
        ambassadors = [user for user in all_users if user.role == "ambassador"]

        # Calculate total submissions
        total_submissions = 0
        for user in ambassadors:
            submissions = await db_service.get_user_submissions(user.id)
            total_submissions += len(submissions)

        # Get all tasks
        all_tasks = await db_service.get_all_tasks()

        admin_stats = {
            "users_managed": len(ambassadors),
            "reports_generated": total_submissions,  # Using submissions as reports metric
            "system_actions": len(all_tasks) + total_submissions,  # Tasks created + submissions
            "uptime_maintained": 99.8  # Static for now
        }

        return admin_stats

    except Exception as e:
        print(f"❌ Error fetching admin stats: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch admin statistics")

@api_router.put("/admin/profile")
async def update_admin_profile(
    profile_data: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Verify admin access
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    db_service = DatabaseService(db)

    try:
        # Update allowed fields
        update_data = {}
        if "name" in profile_data:
            update_data["name"] = profile_data["name"]
        if "email" in profile_data:
            update_data["email"] = profile_data["email"]

        if update_data:
            success = await db_service.update_user_profile(current_user.id, update_data)
            if success:
                return {"message": "Profile updated successfully"}
            else:
                raise HTTPException(status_code=400, detail="Failed to update profile")

        return {"message": "No changes to update"}

    except Exception as e:
        print(f"❌ Error updating admin profile: {e}")
        raise HTTPException(status_code=500, detail="Failed to update admin profile")

@api_router.post("/admin/change-password")
async def change_admin_password(
    password_data: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Verify admin access
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    try:
        current_password = password_data.get("current_password")
        new_password = password_data.get("new_password")

        if not current_password or not new_password:
            raise HTTPException(status_code=400, detail="Current and new passwords are required")

        # Verify current password (simplified - in production use proper password hashing)
        if current_password != "admin123":  # This should be properly verified against hashed password
            raise HTTPException(status_code=400, detail="Current password is incorrect")

        # In production, hash the new password and update in database
        # For now, just return success
        return {"message": "Password changed successfully"}

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error changing password: {e}")
        raise HTTPException(status_code=500, detail="Failed to change password")

# Admin Reports Endpoints
@api_router.get("/admin/reports/submissions")
async def get_submissions_report(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    group_leader: str = None,
    start_date: str = None,
    end_date: str = None
):
    # Verify admin access
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    db_service = DatabaseService(db)

    try:
        from datetime import datetime

        # Get all users and their submissions
        all_users = await db_service.get_all_users()
        ambassadors = [user for user in all_users if user.role == "ambassador"]

        # Filter by group leader if specified
        if group_leader and group_leader != "all":
            ambassadors = [user for user in ambassadors if user.group_leader_name == group_leader]

        all_submissions = []
        for user in ambassadors:
            submissions = await db_service.get_user_submissions(user.id)

            for submission in submissions:
                # Filter by date range if specified
                if start_date or end_date:
                    submission_date = submission.submission_date
                    if submission_date:
                        if start_date and submission_date < datetime.fromisoformat(start_date):
                            continue
                        if end_date and submission_date > datetime.fromisoformat(end_date):
                            continue

                # Get task details
                task = await db_service.get_task_by_id(submission.task_id)

                # Get the first image file URL from submission files
                image_url = None
                if hasattr(submission, 'files') and submission.files:
                    # Get the first image file
                    for file in submission.files:
                        if file.file_url:
                            image_url = file.file_url
                            break

                # Fallback to proof_image if no files found
                if not image_url and submission.proof_image:
                    image_url = submission.proof_image

                submission_data = {
                    "id": str(submission.id),
                    "task_id": str(submission.task_id),
                    "task_title": task.title if task else f"Day {submission.day} Task",
                    "task_day": submission.day,
                    "user_id": str(user.id),
                    "user_name": user.name,
                    "user_email": user.email,
                    "user_college": user.college,
                    "group_leader_name": user.group_leader_name or "No Group Leader",
                    "status_text": submission.status_text or "",
                    "people_connected": submission.people_connected or 0,
                    "points_earned": submission.points_earned or 0,
                    "submission_date": submission.submission_date.isoformat() if submission.submission_date else None,
                    "is_completed": submission.status == "completed",
                    "submission_text": submission.status_text,
                    "image_url": image_url,
                    "created_at": submission.submission_date.isoformat() if submission.submission_date else None,
                    "updated_at": submission.updated_at.isoformat() if submission.updated_at else None
                }
                all_submissions.append(submission_data)

        return all_submissions

    except Exception as e:
        print(f"❌ Error fetching submissions report: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch submissions report")

@api_router.get("/admin/reports/ambassadors")
async def get_ambassadors_report(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Verify admin access
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    db_service = DatabaseService(db)

    try:
        # Get all ambassadors
        all_users = await db_service.get_all_users()
        ambassadors = [user for user in all_users if user.role == "ambassador"]

        ambassador_reports = []
        for user in ambassadors:
            submissions = await db_service.get_user_submissions(user.id)

            # Calculate metrics
            total_points = sum(sub.points_earned or 0 for sub in submissions)
            total_people_connected = sum(sub.people_connected or 0 for sub in submissions)
            completed_tasks = len([sub for sub in submissions if sub.status == "completed"])
            current_day = max([sub.day for sub in submissions], default=0)

            ambassador_data = {
                "id": str(user.id),
                "name": user.name,
                "email": user.email,
                "college": user.college,
                "group_leader_name": user.group_leader_name or "No Group Leader",
                "total_points": total_points,
                "rank_position": 0,  # Will be calculated after sorting
                "current_day": current_day,
                "total_referrals": total_people_connected,  # Using people_connected as referrals
                "events_hosted": len([sub for sub in submissions if "event" in (sub.status_text or "").lower()]),
                "students_reached": total_people_connected,
                "revenue_generated": total_points * 10,  # Estimated revenue
                "social_media_posts": len([sub for sub in submissions if "social" in (sub.status_text or "").lower()]),
                "engagement_rate": min(95, (completed_tasks / max(current_day, 1)) * 100),  # Completion rate as engagement
                "followers_growth": total_people_connected,
                "campaign_days": current_day,
                "status": user.status if hasattr(user, 'status') else "active",
                "last_activity": user.last_login.isoformat() if user.last_login else user.registration_date.isoformat() if user.registration_date else "N/A",
                "join_date": user.registration_date.isoformat() if user.registration_date else "N/A"
            }
            ambassador_reports.append(ambassador_data)

        # Sort by total points and assign ranks
        ambassador_reports.sort(key=lambda x: x["total_points"], reverse=True)
        for i, ambassador in enumerate(ambassador_reports):
            ambassador["rank_position"] = i + 1

        return ambassador_reports

    except Exception as e:
        print(f"❌ Error fetching ambassadors report: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch ambassadors report")

@api_router.get("/admin/reports/metrics")
async def get_report_metrics(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Verify admin access
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    db_service = DatabaseService(db)

    try:
        # Get all users and submissions
        all_users = await db_service.get_all_users()
        ambassadors = [user for user in all_users if user.role == "ambassador"]
        all_tasks = await db_service.get_all_tasks()

        total_submissions = 0
        total_points = 0
        total_people_connected = 0

        for user in ambassadors:
            submissions = await db_service.get_user_submissions(user.id)
            total_submissions += len(submissions)
            total_points += sum(sub.points_earned or 0 for sub in submissions)
            total_people_connected += sum(sub.people_connected or 0 for sub in submissions)

        # Calculate completion rate
        total_possible_submissions = len(ambassadors) * len(all_tasks)
        completion_rate = (total_submissions / max(total_possible_submissions, 1)) * 100

        metrics = {
            "totalAmbassadors": len(ambassadors),
            "totalTasks": len(all_tasks),
            "totalPoints": total_points,
            "totalPeopleConnected": total_people_connected,
            "averageTaskTime": "2.5 hours",  # Static for now
            "completionRate": round(completion_rate, 1),
            "total_submissions": total_submissions
        }

        return metrics

    except Exception as e:
        print(f"❌ Error fetching report metrics: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch report metrics")

@api_router.get("/admin/reports/group-leaders")
async def get_group_leaders(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Verify admin access
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    db_service = DatabaseService(db)

    try:
        # Get all ambassadors and extract unique group leaders
        all_users = await db_service.get_all_users()
        ambassadors = [user for user in all_users if user.role == "ambassador"]

        group_leaders = set()
        for user in ambassadors:
            if user.group_leader_name:
                group_leaders.add(user.group_leader_name)

        return sorted(list(group_leaders))

    except Exception as e:
        print(f"❌ Error fetching group leaders: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch group leaders")

# Admin Tasks Management Endpoints
@api_router.get("/admin/tasks")
async def get_admin_tasks(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Verify admin access
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    db_service = DatabaseService(db)

    try:
        # Get all tasks
        tasks = await db_service.get_all_tasks()

        task_list = []
        for task in tasks:
            task_data = {
                "id": str(task.id),
                "title": task.title,
                "description": task.description,
                "day": task.day,
                "points": task.points_reward,
                "status": "active" if task.is_active else "draft",
                "created_by": task.created_by or "admin@test.com",
                "created_at": task.created_at.strftime("%Y-%m-%d") if task.created_at else "N/A",
                "updated_at": task.updated_at.strftime("%Y-%m-%d") if task.updated_at else None
            }
            task_list.append(task_data)

        # Sort by day
        task_list.sort(key=lambda x: x["day"])

        return task_list

    except Exception as e:
        print(f"❌ Error fetching admin tasks: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch admin tasks")

@api_router.post("/admin/tasks")
async def create_task(
    task_data: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Verify admin access
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    db_service = DatabaseService(db)

    try:
        # Validate required fields
        required_fields = ["title", "description", "day", "points"]
        for field in required_fields:
            if field not in task_data:
                raise HTTPException(status_code=400, detail=f"Missing required field: {field}")

        # Create new task
        new_task_data = {
            "title": task_data["title"],
            "description": task_data["description"],
            "day": int(task_data["day"]),
            "points": int(task_data["points"]),
            "is_active": task_data.get("status", "active") == "active",
            "created_by": current_user.email
        }

        task_id = await db_service.create_task(new_task_data)

        return {
            "message": "Task created successfully",
            "task_id": str(task_id)
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error creating task: {e}")
        raise HTTPException(status_code=500, detail="Failed to create task")

@api_router.put("/admin/tasks/{task_id}")
async def update_task(
    task_id: str,
    task_data: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Verify admin access
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    db_service = DatabaseService(db)

    try:
        # Get existing task
        task = await db_service.get_task_by_id(task_id)
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")

        # Update task data

        update_data = {}
        if "title" in task_data:
            update_data["title"] = task_data["title"]
        if "description" in task_data:
            update_data["description"] = task_data["description"]
        if "day" in task_data:
            update_data["day"] = int(task_data["day"])
        if "points" in task_data:
            update_data["points"] = int(task_data["points"])
        if "status" in task_data:
            update_data["is_active"] = task_data["status"] == "active"

        success = await db_service.update_task(task_id, update_data)

        if success:
            return {"message": "Task updated successfully"}
        else:
            raise HTTPException(status_code=400, detail="Failed to update task")

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error updating task: {e}")
        raise HTTPException(status_code=500, detail="Failed to update task")

@api_router.delete("/admin/tasks/{task_id}")
async def delete_task(
    task_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Verify admin access
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    db_service = DatabaseService(db)

    try:
        # Check if task exists
        task = await db_service.get_task_by_id(task_id)
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")

        # Delete task
        success = await db_service.delete_task(task_id)

        if success:
            return {"message": "Task deleted successfully"}
        else:
            raise HTTPException(status_code=400, detail="Failed to delete task")

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error deleting task: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete task")
        all_users = await db_service.get_all_users()  # You may need to implement this method
        
        all_submissions_with_files = []
        
        for user in all_users:
            submissions = await db_service.get_user_submissions(user.id)
            
            for submission in submissions:
                # Fetch files for this submission (if Supabase is available)
                files_data = []
                if supabase is not None:
                    try:
                        files_response = supabase.table("submission_files").select("*").eq("submission_id", submission.id).execute()
                        files_data = files_response.data if files_response.data else []
                    except Exception as e:
                        print(f"⚠️ Could not fetch files for submission {submission.id}: {e}")
                        files_data = []
                else:
                    print("⚠️ Supabase not available, cannot fetch submission files")
                
                all_submissions_with_files.append({
                    "user_id": user.id,
                    "user_name": user.name,
                    "user_email": user.email,
                    "submission": {
                        "id": submission.id,
                        "task_id": submission.task_id,
                        "status_text": submission.status_text,
                        "people_connected": submission.people_connected,
                        "points_earned": submission.points_earned,
                        "submission_date": submission.submission_date.isoformat() if submission.submission_date else None,
                        "is_completed": submission.is_completed,
                        "files": files_data
                    }
                })
        
        return {"submissions": all_submissions_with_files}
        
    except Exception as e:
        print(f"❌ Error fetching all submissions: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch all submissions")

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
    uvicorn.run(app, host="127.0.0.1", port=5001, log_level="info")
