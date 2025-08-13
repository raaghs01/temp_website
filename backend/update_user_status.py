# #!/usr/bin/env python3
# """
# Script to update existing users in the database to add the status field.
# This is needed after adding the status field to the User model.
# """

# import asyncio
# import os
# from motor.motor_asyncio import AsyncIOMotorClient
# from dotenv import load_dotenv
# from pathlib import Path

# # Load environment variables
# ROOT_DIR = Path(__file__).parent
# load_dotenv(ROOT_DIR / '.env')

# # MongoDB connection
# mongo_url = os.environ['MONGO_URL']
# client = AsyncIOMotorClient(mongo_url)
# db = client[os.environ['DB_NAME']]

# async def update_user_status():
#     """Update all users to have a status field if they don't have one"""
#     print("🔄 Updating user status fields...")
    
#     try:
#         # Find all users without a status field
#         users_without_status = await db.users.find({"status": {"$exists": False}}).to_list(1000)
        
#         if not users_without_status:
#             print("✅ All users already have status field")
#             return
        
#         print(f"📊 Found {len(users_without_status)} users without status field")
        
#         # Update each user to have status = "active" by default
#         for user in users_without_status:
#             await db.users.update_one(
#                 {"_id": user["_id"]},
#                 {"$set": {"status": "active"}}
#             )
#             print(f"✅ Updated user: {user.get('name', 'Unknown')} ({user.get('email', 'No email')})")
        
#         print(f"🎉 Successfully updated {len(users_without_status)} users")
        
#         # Verify the update
#         total_users = await db.users.count_documents({})
#         users_with_status = await db.users.count_documents({"status": {"$exists": True}})
        
#         print(f"📈 Total users: {total_users}")
#         print(f"📈 Users with status: {users_with_status}")
        
#         if total_users == users_with_status:
#             print("✅ All users now have status field!")
#         else:
#             print("⚠️  Some users still missing status field")
            
#     except Exception as e:
#         print(f"❌ Error updating user status: {e}")
#     finally:
#         client.close()

# async def main():
#     """Main function"""
#     print("🚀 Starting user status update script...")
#     await update_user_status()
#     print("✅ Script completed!")

# if __name__ == "__main__":
#     asyncio.run(main())
