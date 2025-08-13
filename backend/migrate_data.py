# #!/usr/bin/env python3
# """
# Script to migrate data from MongoDB to PostgreSQL
# """
# import asyncio
# from motor.motor_asyncio import AsyncIOMotorClient
# from sqlalchemy.ext.asyncio import AsyncSession
# from db import AsyncSessionLocal, init_db
# from models import User, Task, Submission, Analytics
# import os
# from dotenv import load_dotenv

# load_dotenv()

# async def migrate_data():
#     # MongoDB connection
#     mongo_client = AsyncIOMotorClient(os.getenv("MONGO_URL_OLD"))  # Keep old URL
#     mongo_db = mongo_client[os.getenv("DB_NAME_OLD")]
    
#     # PostgreSQL connection
#     await init_db()
    
#     async with AsyncSessionLocal() as session:
#         # Migrate users
#         print("Migrating users...")
#         async for user_doc in mongo_db.users.find():
#             user = User(
#                 id=user_doc.get("id"),
#                 email=user_doc.get("email"),
#                 password_hash=user_doc.get("password_hash"),
#                 name=user_doc.get("name"),
#                 college=user_doc.get("college"),
#                 # ... map all fields
#             )
#             session.add(user)
        
#         # Migrate tasks
#         print("Migrating tasks...")
#         async for task_doc in mongo_db.tasks.find():
#             task = Task(
#                 id=task_doc.get("id"),
#                 day=task_doc.get("day"),
#                 title=task_doc.get("title"),
#                 # ... map all fields
#             )
#             session.add(task)
        
#         # Migrate submissions
#         print("Migrating submissions...")
#         async for sub_doc in mongo_db.submissions.find():
#             submission = Submission(
#                 id=sub_doc.get("id"),
#                 user_id=sub_doc.get("user_id"),
#                 task_id=sub_doc.get("task_id"),
#                 # ... map all fields
#             )
#             session.add(submission)
        
#         await session.commit()
#         print("Migration completed!")
    
#     mongo_client.close()

# if __name__ == "__main__":
#     asyncio.run(migrate_data())