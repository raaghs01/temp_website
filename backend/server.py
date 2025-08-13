from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File, Form, Depends, Body
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
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

# Load environment variables
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
    group_leader_name: str = ""
    role: str = "ambassador"  # "ambassador" or "admin"
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
    group_leader_name: str = ""
    role: str = "ambassador"

class UserLogin(BaseModel):
    email: str
    password: str
    role: str = "ambassador"

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
    proof_image: Optional[str] = None  # Base64 encoded image (for backward compatibility)
    proof_files: Optional[List[dict]] = None  # List of files with metadata
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
    group_leader_name: str
    role: str
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
        college=user_data.college,
        group_leader_name=user_data.group_leader_name,
        role=user_data.role
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
            group_leader_name=user.group_leader_name,
            role=user.role,
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
    
    # Verify role matches
    if user.role != login_data.role:
        raise HTTPException(status_code=401, detail="Invalid role for this account")
    
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
            group_leader_name=user.group_leader_name,
            role=user.role,
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
        group_leader_name=current_user.group_leader_name,
        role=current_user.role,
        current_day=current_user.current_day,
        total_points=current_user.total_points,
        total_referrals=current_user.total_referrals,
        rank_position=rank,
        registration_date=current_user.registration_date
    )

class ProfileUpdateRequest(BaseModel):
    name: str
    email: str
    college: str
    group_leader_name: str

@api_router.put("/profile")
async def update_profile(
    data: ProfileUpdateRequest,
    current_user: User = Depends(get_current_user)
):
    # Update user profile in database
    await db.users.update_one(
        {"id": current_user.id},
        {"$set": {
            "name": data.name,
            "email": data.email,
            "college": data.college,
            "group_leader_name": data.group_leader_name
        }}
    )

    return {"message": "Profile updated successfully"}

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

@api_router.post("/submit-task-with-files")
async def submit_task_with_files(
    task_id: str = Form(...),
    status_text: str = Form(""),
    people_connected: int = Form(0),
    files: List[UploadFile] = File(...),
    current_user: User = Depends(get_current_user)
):
    # Get the task to validate
    task = await db.tasks.find_one({"id": task_id})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    # Process files if provided
    processed_files = []
    if files:
        for file in files:
            try:
                # Read file data
                file_data = await file.read()
                file_base64 = base64.b64encode(file_data).decode('utf-8')

                # Get file info
                file_info = {
                    "filename": file.filename,
                    "content_type": file.content_type,
                    "size": len(file_data),
                    "data": file_base64
                }
                processed_files.append(file_info)

            except Exception as e:
                raise HTTPException(status_code=400, detail=f"Error processing file {file.filename}: {str(e)}")

    # Calculate points (base + bonus for people connected + file bonus)
    points_earned = task["points_reward"] + (people_connected * 10)
    if processed_files:
        # Bonus for providing proof files (25 points for first file, 10 for each additional)
        points_earned += 25 + (len(processed_files) - 1) * 10

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
            "is_completed": True,
            "proof_files": processed_files
        }

        # Keep backward compatibility - if only one image file, also store in proof_image
        if len(processed_files) == 1 and processed_files[0]["content_type"].startswith("image/"):
            update_data["proof_image"] = processed_files[0]["data"]

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
        new_submission_data = {
            "id": str(uuid.uuid4()),
            "user_id": current_user.id,
            "task_id": task_id,
            "day": task["day"],
            "status_text": status_text,
            "people_connected": people_connected,
            "points_earned": points_earned,
            "proof_files": processed_files,
            "submission_date": datetime.utcnow(),
            "is_completed": True
        }

        # Keep backward compatibility - if only one image file, also store in proof_image
        if len(processed_files) == 1 and processed_files[0]["content_type"].startswith("image/"):
            new_submission_data["proof_image"] = processed_files[0]["data"]

        await db.task_submissions.insert_one(new_submission_data)

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

    return {
        "message": "Task submitted successfully with files",
        "points_earned": points_earned,
        "files_uploaded": len(processed_files)
    }

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

# Admin endpoints
@api_router.get("/admin/stats")
async def get_admin_stats(current_user: User = Depends(get_current_user)):
    # Check if user is admin
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Access denied. Admin role required.")
    
    # Get all users
    all_users = await db.users.find({"is_active": True}).to_list(1000)
    
    # Calculate stats
    total_ambassadors = len([u for u in all_users if u.get("role") == "ambassador"])
    active_ambassadors = len([u for u in all_users if u.get("role") == "ambassador" and u.get("is_active", True)])
    
    # Calculate total revenue (simplified - could be enhanced with actual revenue tracking)
    total_revenue = sum(u.get("total_points", 0) * 0.1 for u in all_users if u.get("role") == "ambassador")
    
    # Get total events (simplified - could be enhanced with actual event tracking)
    total_events = len([u for u in all_users if u.get("role") == "ambassador" and u.get("total_points", 0) > 0])
    
    # Calculate total students reached
    total_students_reached = sum(u.get("total_referrals", 0) for u in all_users if u.get("role") == "ambassador")
    
    # Calculate average engagement rate
    engagement_rates = [u.get("total_points", 0) / max(u.get("current_day", 1), 1) for u in all_users if u.get("role") == "ambassador"]
    average_engagement_rate = sum(engagement_rates) / len(engagement_rates) if engagement_rates else 0
    
    # Find top performing college
    college_stats = {}
    for user in all_users:
        if user.get("role") == "ambassador":
            college = user.get("college", "Unknown")
            if college not in college_stats:
                college_stats[college] = 0
            college_stats[college] += user.get("total_points", 0)
    
    top_performing_college = max(college_stats.items(), key=lambda x: x[1])[0] if college_stats else "None"
    
    # Calculate monthly growth (simplified)
    monthly_growth = 15.5  # Placeholder value
    
    return {
        "total_ambassadors": total_ambassadors,
        "active_ambassadors": active_ambassadors,
        "total_revenue": round(total_revenue, 2),
        "total_events": total_events,
        "total_students_reached": total_students_reached,
        "average_engagement_rate": round(average_engagement_rate, 2),
        "top_performing_college": top_performing_college,
        "monthly_growth": monthly_growth
    }

@api_router.get("/admin/ambassadors")
async def get_ambassadors(current_user: User = Depends(get_current_user)):
    # Check if user is admin
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Access denied. Admin role required.")
    
    # Get all ambassador users
    ambassadors = await db.users.find({"role": "ambassador", "is_active": True}).to_list(1000)
    
    return [
        {
            "id": ambassador["id"],
            "name": ambassador["name"],
            "email": ambassador["email"],
            "college": ambassador["college"],
            "total_points": ambassador.get("total_points", 0),
            "rank_position": ambassador.get("rank_position"),
            "current_day": ambassador.get("current_day", 0),
            "total_referrals": ambassador.get("total_referrals", 0),
            "events_hosted": int(ambassador.get("total_points", 0) / 50),  # Simplified calculation
            "students_reached": ambassador.get("total_referrals", 0),
            "revenue_generated": ambassador.get("total_points", 0) * 0.1,  # Simplified calculation
            "social_media_posts": int(ambassador.get("total_points", 0) / 10),  # Simplified calculation
            "engagement_rate": ambassador.get("total_points", 0) / max(ambassador.get("current_day", 1), 1),
            "followers_growth": ambassador.get("total_referrals", 0) * 2,  # Simplified calculation
            "campaign_days": ambassador.get("current_day", 0),
            "status": "active" if ambassador.get("is_active", True) else "inactive",
            "last_activity": ambassador.get("registration_date", datetime.utcnow()).isoformat(),
            "join_date": ambassador.get("registration_date", datetime.utcnow()).isoformat()
        }
        for ambassador in ambassadors
    ]

# Change password endpoint
class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str

@api_router.post("/change-password")
async def change_password(
    data: ChangePasswordRequest,
    current_user: User = Depends(get_current_user)
):
    # Verify old password
    if not verify_password(data.old_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Old password is incorrect")

    # Hash new password
    new_password_hash = hash_password(data.new_password)

    # Update password in database
    await db.users.update_one(
        {"id": current_user.id},
        {"$set": {"password_hash": new_password_hash}}
    )

    return {"message": "Password changed successfully"}

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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=5000, log_level="info")