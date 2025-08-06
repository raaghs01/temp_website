from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File, Form, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timedelta
import jwt
import hashlib
import base64
from io import BytesIO

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = "your-super-secret-jwt-key-change-in-production"
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_DELTA = timedelta(days=30)

# Create the main app without a prefix
app = FastAPI()
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for debugging
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Security
security = HTTPBearer()

# Models
class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    password_hash: str
    name: str
    college: str
    current_day: int = 0
    total_points: int = 0
    total_referrals: int = 0
    registration_date: datetime = Field(default_factory=datetime.utcnow)
    is_active: bool = True
    rank_position: Optional[int] = None

class UserCreate(BaseModel):
    email: str
    password: str
    name: str
    college: str

class UserLogin(BaseModel):
    email: str
    password: str

class Task(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    day: int
    title: str
    description: str
    task_type: str  # "orientation", "daily_task"
    points_reward: int = 50
    is_active: bool = True

class TaskSubmission(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    task_id: str
    day: int
    status_text: str = ""
    people_connected: int = 0
    points_earned: int = 0
    proof_image: Optional[str] = None  # Base64 encoded image
    submission_date: datetime = Field(default_factory=datetime.utcnow)
    is_completed: bool = False

class TaskSubmissionCreate(BaseModel):
    task_id: str
    status_text: str = ""
    people_connected: int = 0

class UserProfile(BaseModel):
    id: str
    email: str
    name: str
    college: str
    current_day: int
    total_points: int
    total_referrals: int
    rank_position: Optional[int]
    registration_date: datetime

class LeaderboardEntry(BaseModel):
    name: str
    college: str
    total_points: int
    total_referrals: int
    rank: int

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

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("user_id")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user = await db.users.find_one({"id": user_id})
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        
        return User(**user)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def calculate_user_rank(user_id: str):
    """Calculate user's rank based on points"""
    user = await db.users.find_one({"id": user_id})
    if not user:
        return None
    
    # Get user's total points, default to 0 if not present
    user_points = user.get("total_points", 0)
    
    # Count users with higher points
    higher_ranked = await db.users.count_documents({
        "total_points": {"$gt": user_points},
        "is_active": True
    })
    
    return higher_ranked + 1

# Initialize default tasks
async def initialize_tasks():
    # Check if tasks already exist
    existing_tasks = await db.tasks.count_documents({})
    if existing_tasks > 0:
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
        }
    ]
    
    # Add daily promotion tasks with varying points
    promotion_tasks = [
        "Share brand story on social media",
        "Connect with 5 potential customers",
        "Create engaging content about our products",
        "Host a brand awareness event",
        "Write a product review blog post",
        "Organize a campus meetup",
        "Partner with student organizations",
        "Create video testimonials",
        "Run Instagram/TikTok campaigns",
        "Distribute promotional materials",
        "Conduct product demos",
        "Get feedback from 10 students",
        "Create brand awareness posters",
        "Network at college events",
        "Launch referral campaigns"
    ]
    
    for day in range(1, 16):
        task_desc = promotion_tasks[(day - 1) % len(promotion_tasks)]
        points = 50 + (day * 5)  # Increasing points as days progress
        
        default_tasks.append({
            "id": str(uuid.uuid4()),
            "day": day,
            "title": f"Day {day}: {task_desc.title()}",
            "description": f"{task_desc}. Track your progress and share proof of your promotional activities.",
            "task_type": "daily_task",
            "points_reward": points,
            "is_active": True
        })
    
    await db.tasks.insert_many(default_tasks)

# Routes
@api_router.post("/register")
async def register(user_data: UserCreate):
    # Check if user already exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create new user
    user = User(
        email=user_data.email,
        password_hash=hash_password(user_data.password),
        name=user_data.name,
        college=user_data.college
    )
    
    await db.users.insert_one(user.dict())
    
    # Create access token
    token = create_access_token(user.id)
    
    # Calculate initial rank
    rank = await calculate_user_rank(user.id)
    
    return {
        "message": "Registration successful",
        "token": token,
        "user": UserProfile(
            id=user.id,
            email=user.email,
            name=user.name,
            college=user.college,
            current_day=user.current_day,
            total_points=user.total_points,
            total_referrals=user.total_referrals,
            rank_position=rank,
            registration_date=user.registration_date
        )
    }

@api_router.post("/login")
async def login(login_data: UserLogin):
    # Find user
    user_data = await db.users.find_one({"email": login_data.email})
    if not user_data:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    user = User(**user_data)
    
    # Verify password
    if not verify_password(login_data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Create access token
    token = create_access_token(user.id)
    
    # Calculate current rank
    rank = await calculate_user_rank(user.id)
    
    return {
        "message": "Login successful",
        "token": token,
        "user": UserProfile(
            id=user.id,
            email=user.email,
            name=user.name,
            college=user.college,
            current_day=user.current_day,
            total_points=user.total_points,
            total_referrals=user.total_referrals,
            rank_position=rank,
            registration_date=user.registration_date
        )
    }

@api_router.get("/profile")
async def get_profile(current_user: User = Depends(get_current_user)):
    rank = await calculate_user_rank(current_user.id)
    return UserProfile(
        id=current_user.id,
        email=current_user.email,
        name=current_user.name,
        college=current_user.college,
        current_day=current_user.current_day,
        total_points=current_user.total_points,
        total_referrals=current_user.total_referrals,
        rank_position=rank,
        registration_date=current_user.registration_date
    )

@api_router.get("/tasks/{day}")
async def get_task_for_day(day: int, current_user: User = Depends(get_current_user)):
    task = await db.tasks.find_one({"day": day, "is_active": True})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found for this day")
    
    return Task(**task)

@api_router.get("/tasks")
async def get_all_tasks(current_user: User = Depends(get_current_user)):
    tasks = await db.tasks.find({"is_active": True}).sort("day", 1).to_list(100)
    return [Task(**task) for task in tasks]

@api_router.post("/submit-task")
async def submit_task_text(
    submission: TaskSubmissionCreate,
    current_user: User = Depends(get_current_user)
):
    # Get the task to validate
    task = await db.tasks.find_one({"id": submission.task_id})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Calculate points (base + bonus for people connected)
    points_earned = task["points_reward"] + (submission.people_connected * 10)
    
    # Check if already submitted
    existing_submission = await db.task_submissions.find_one({
        "user_id": current_user.id,
        "task_id": submission.task_id
    })
    
    if existing_submission:
        # Update existing submission
        old_points = existing_submission.get("points_earned", 0)
        point_difference = points_earned - old_points
        
        await db.task_submissions.update_one(
            {"user_id": current_user.id, "task_id": submission.task_id},
            {"$set": {
                "status_text": submission.status_text,
                "people_connected": submission.people_connected,
                "points_earned": points_earned,
                "submission_date": datetime.utcnow(),
                "is_completed": True
            }}
        )
        
        # Update user points and referrals
        await db.users.update_one(
            {"id": current_user.id},
            {
                "$inc": {
                    "total_points": point_difference,
                    "total_referrals": submission.people_connected - existing_submission.get("people_connected", 0)
                }
            }
        )
    else:
        # Create new submission
        new_submission = TaskSubmission(
            user_id=current_user.id,
            task_id=submission.task_id,
            day=task["day"],
            status_text=submission.status_text,
            people_connected=submission.people_connected,
            points_earned=points_earned,
            is_completed=True
        )
        await db.task_submissions.insert_one(new_submission.dict())
        
        # Update user points and referrals
        await db.users.update_one(
            {"id": current_user.id},
            {
                "$inc": {
                    "total_points": points_earned,
                    "total_referrals": submission.people_connected
                }
            }
        )
    
    # Update user's current day if this was their current task
    if task["day"] == current_user.current_day:
        await db.users.update_one(
            {"id": current_user.id},
            {"$set": {"current_day": current_user.current_day + 1}}
        )
    
    return {"message": "Task submitted successfully", "points_earned": points_earned}

@api_router.post("/submit-task-with-image")
async def submit_task_with_image(
    task_id: str = Form(...),
    status_text: str = Form(""),
    people_connected: int = Form(0),
    image: UploadFile = File(None),
    current_user: User = Depends(get_current_user)
):
    # Get the task to validate
    task = await db.tasks.find_one({"id": task_id})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Process image if provided
    image_base64 = None
    if image:
        try:
            image_data = await image.read()
            image_base64 = base64.b64encode(image_data).decode('utf-8')
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Error processing image: {str(e)}")
    
    # Calculate points (base + bonus for people connected + image bonus)
    points_earned = task["points_reward"] + (people_connected * 10)
    if image_base64:
        points_earned += 25  # Bonus for providing proof image
    
    # Check if already submitted
    existing_submission = await db.task_submissions.find_one({
        "user_id": current_user.id,
        "task_id": task_id
    })
    
    if existing_submission:
        # Update existing submission
        old_points = existing_submission.get("points_earned", 0)
        point_difference = points_earned - old_points
        
        update_data = {
            "status_text": status_text,
            "people_connected": people_connected,
            "points_earned": points_earned,
            "submission_date": datetime.utcnow(),
            "is_completed": True
        }
        if image_base64:
            update_data["proof_image"] = image_base64
            
        await db.task_submissions.update_one(
            {"user_id": current_user.id, "task_id": task_id},
            {"$set": update_data}
        )
        
        # Update user points and referrals
        await db.users.update_one(
            {"id": current_user.id},
            {
                "$inc": {
                    "total_points": point_difference,
                    "total_referrals": people_connected - existing_submission.get("people_connected", 0)
                }
            }
        )
    else:
        # Create new submission
        new_submission = TaskSubmission(
            user_id=current_user.id,
            task_id=task_id,
            day=task["day"],
            status_text=status_text,
            people_connected=people_connected,
            points_earned=points_earned,
            proof_image=image_base64,
            is_completed=True
        )
        await db.task_submissions.insert_one(new_submission.dict())
        
        # Update user points and referrals
        await db.users.update_one(
            {"id": current_user.id},
            {
                "$inc": {
                    "total_points": points_earned,
                    "total_referrals": people_connected
                }
            }
        )
    
    # Update user's current day if this was their current task
    if task["day"] == current_user.current_day:
        await db.users.update_one(
            {"id": current_user.id},
            {"$set": {"current_day": current_user.current_day + 1}}
        )
    
    return {"message": "Task submitted successfully with image", "points_earned": points_earned}

@api_router.get("/my-submissions")
async def get_my_submissions(current_user: User = Depends(get_current_user)):
    submissions = await db.task_submissions.find({"user_id": current_user.id}).sort("day", 1).to_list(100)
    return [TaskSubmission(**submission) for submission in submissions]

@api_router.get("/submission/{task_id}")
async def get_submission_for_task(task_id: str, current_user: User = Depends(get_current_user)):
    submission = await db.task_submissions.find_one({
        "user_id": current_user.id,
        "task_id": task_id
    })
    if not submission:
        return None
    return TaskSubmission(**submission)

# Dashboard stats
@api_router.get("/dashboard-stats")
async def get_dashboard_stats(current_user: User = Depends(get_current_user)):
    # Get user's submissions
    submissions = await db.task_submissions.find({"user_id": current_user.id}).to_list(100)
    
    # Get updated user data
    user_data = await db.users.find_one({"id": current_user.id})
    user = User(**user_data)
    
    total_tasks_completed = len(submissions)
    current_day = user.current_day
    
    # Get next task
    next_task = await db.tasks.find_one({"day": current_day, "is_active": True})
    
    # Calculate rank
    rank = await calculate_user_rank(user.id)
    
    # Calculate completion percentage
    total_available_tasks = current_day + 1
    completion_percentage = (total_tasks_completed / max(total_available_tasks, 1)) * 100
    
    return {
        "current_day": current_day,
        "total_tasks_completed": total_tasks_completed,
        "total_points": user.total_points,
        "total_referrals": user.total_referrals,
        "rank_position": rank,
        "completion_percentage": round(completion_percentage, 1),
        "next_task": Task(**next_task) if next_task else None,
        "user_name": user.name,
        "college": user.college
    }

# Leaderboard
@api_router.get("/leaderboard")
async def get_leaderboard(limit: int = 10, current_user: User = Depends(get_current_user)):
    # Get top users by points
    top_users = await db.users.find(
        {"is_active": True}
    ).sort("total_points", -1).limit(limit).to_list(limit)
    
    leaderboard = []
    for i, user in enumerate(top_users):
        leaderboard.append(LeaderboardEntry(
            name=user["name"],
            college=user["college"],
            total_points=user.get("total_points", 0),
            total_referrals=user.get("total_referrals", 0),
            rank=i + 1
        ))
    
    return leaderboard

# Initialize tasks on startup
@app.on_event("startup")
async def startup_event():
    await initialize_tasks()

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # or ["*"] for all origins (less secure)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()