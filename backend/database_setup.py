from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

async def setup_database_indexes():
    """Setup database indexes for optimal performance"""
    client = AsyncIOMotorClient(os.getenv("MONGO_URL"))
    db = client[os.getenv("DB_NAME")]
    
    # Users collection indexes
    await db.users.create_index("email", unique=True)
    await db.users.create_index("id", unique=True)
    await db.users.create_index("role")
    await db.users.create_index("college")
    await db.users.create_index("total_points")
    await db.users.create_index("registration_date")
    await db.users.create_index([("total_points", -1), ("total_referrals", -1)])  # Leaderboard
    
    # Tasks collection indexes
    await db.tasks.create_index("id", unique=True)
    await db.tasks.create_index("day")
    await db.tasks.create_index("task_type")
    await db.tasks.create_index("is_active")
    await db.tasks.create_index([("day", 1), ("is_active", 1)])
    
    # Submissions collection indexes
    await db.submissions.create_index("id", unique=True)
    await db.submissions.create_index("user_id")
    await db.submissions.create_index("task_id")
    await db.submissions.create_index("status")
    await db.submissions.create_index([("user_id", 1), ("task_id", 1)], unique=True)
    await db.submissions.create_index([("user_id", 1), ("submission_date", -1)])
    await db.submissions.create_index("submission_date")
    
    # Analytics collection indexes
    await db.analytics.create_index("user_id")
    await db.analytics.create_index("date")
    await db.analytics.create_index([("user_id", 1), ("date", -1)])
    
    print("Database indexes created successfully!")
    client.close()