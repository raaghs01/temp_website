#!/usr/bin/env python3
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from pathlib import Path
import hashlib
import uuid
from datetime import datetime

ROOT_DIR = Path(__file__).parent / "backend"
load_dotenv(ROOT_DIR / '.env')

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

async def setup_admin():
    # MongoDB connection
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ['DB_NAME']]
    
    print("Clearing existing users...")
    await db.users.delete_many({})
    
    print("Creating test admin user...")
    admin_user = {
        "id": str(uuid.uuid4()),
        "email": "admin@test.com",
        "password_hash": hash_password("admin123"),
        "name": "Admin User",
        "college": "Test University",
        "role": "admin",
        "current_day": 0,
        "total_points": 0,
        "total_referrals": 0,
        "registration_date": datetime.utcnow(),
        "is_active": True,
        "rank_position": None
    }
    
    await db.users.insert_one(admin_user)
    print("Admin user created successfully!")
    print(f"Email: admin@test.com")
    print(f"Password: admin123")
    print(f"Role: {admin_user['role']}")
    
    # Create a test ambassador user
    print("\nCreating test ambassador user...")
    ambassador_user = {
        "id": str(uuid.uuid4()),
        "email": "ambassador@test.com",
        "password_hash": hash_password("ambassador123"),
        "name": "Test Ambassador",
        "college": "Test College",
        "role": "ambassador",
        "current_day": 0,
        "total_points": 0,
        "total_referrals": 0,
        "registration_date": datetime.utcnow(),
        "is_active": True,
        "rank_position": None
    }
    
    await db.users.insert_one(ambassador_user)
    print("Ambassador user created successfully!")
    print(f"Email: ambassador@test.com")
    print(f"Password: ambassador123")
    print(f"Role: {ambassador_user['role']}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(setup_admin()) 