#!/usr/bin/env python3
"""
Debug script to check task unlocking logic
"""

import requests
import json

API_BASE = "http://127.0.0.1:5000/api"

def debug_unlocking():
    """Debug the task unlocking logic"""
    print("🔍 Debugging task unlocking...")
    
    # Use existing user credentials
    login_data = {
        "email": "test.multifile@example.com",
        "password": "testpassword123"
    }
    
    response = requests.post(f"{API_BASE}/login", json=login_data)
    
    if response.status_code == 200:
        token = response.json().get('token')
        headers = {"Authorization": f"Bearer {token}"}
        
        # Get tasks
        tasks_response = requests.get(f"{API_BASE}/tasks", headers=headers)
        
        if tasks_response.status_code == 200:
            tasks = tasks_response.json()
            
            # Get submissions
            submissions_response = requests.get(f"{API_BASE}/my-submissions", headers=headers)
            submissions = []
            if submissions_response.status_code == 200:
                submissions = submissions_response.json()
            
            print(f"📋 Total tasks: {len(tasks)}")
            print(f"📝 Total submissions: {len(submissions)}")
            
            # Analyze completed days
            completed_days = set()
            for submission in submissions:
                if hasattr(submission, 'day'):
                    completed_days.add(submission.day)
                else:
                    # Find task to get day
                    for task in tasks:
                        if task['id'] == submission.get('task_id'):
                            completed_days.add(task['day'])
                            break
            
            print(f"✅ Completed days: {sorted(completed_days)}")
            
            # Check task status
            available_tasks = []
            locked_tasks = []
            completed_tasks = []
            
            for task in sorted(tasks, key=lambda x: x['day']):
                day = task['day']
                title = task['title']
                
                # Check if task is completed
                is_completed = any(
                    submission.get('task_id') == task['id'] 
                    for submission in submissions
                )
                
                if is_completed:
                    completed_tasks.append(task)
                    status = "✅ COMPLETED"
                else:
                    # Check if should be available based on our logic
                    highest_completed = max(completed_days) if completed_days else -1
                    if day <= highest_completed + 2:
                        available_tasks.append(task)
                        status = "🔓 AVAILABLE"
                    else:
                        locked_tasks.append(task)
                        status = "🔒 LOCKED"
                
                print(f"   Day {day:2d}: {title[:40]:<40} - {status}")
            
            print(f"\n📊 Summary:")
            print(f"   ✅ Completed: {len(completed_tasks)}")
            print(f"   🔓 Available: {len(available_tasks)}")
            print(f"   🔒 Locked: {len(locked_tasks)}")
            
            if completed_days:
                highest_completed = max(completed_days)
                print(f"\n🎯 Unlocking Logic:")
                print(f"   Highest completed day: {highest_completed}")
                print(f"   Should unlock up to day: {highest_completed + 2}")
                
                # Check if Day 4 and Day 5 should be unlocked
                if highest_completed >= 3:
                    print(f"   ✅ Day 4 should be AVAILABLE (3 + 1 = 4)")
                    print(f"   ✅ Day 5 should be AVAILABLE (3 + 2 = 5)")
                else:
                    print(f"   ❌ Need to complete Day 3 to unlock Day 4 and 5")
        else:
            print(f"❌ Failed to get tasks: {tasks_response.status_code}")
    else:
        print(f"❌ Login failed: {response.status_code}")

if __name__ == "__main__":
    debug_unlocking()
