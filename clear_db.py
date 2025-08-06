#!/usr/bin/env python3
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent / "backend"
load_dotenv(ROOT_DIR / '.env')

async def clear_and_reinit_tasks():
    # MongoDB connection
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ['DB_NAME']]
    
    print("Clearing existing tasks...")
    await db.tasks.delete_many({})
    
    print("Clearing existing submissions...")
    await db.task_submissions.delete_many({})
    
    print("Database cleared. Restart backend to reinitialize tasks.")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(clear_and_reinit_tasks())