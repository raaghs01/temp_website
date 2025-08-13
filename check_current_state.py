#!/usr/bin/env python3
"""
Check the current state of tasks and submissions
"""

import requests
import json

API_BASE = "http://127.0.0.1:5000/api"

def check_state():
    """Check current state"""
    print("🔍 Checking current task state...")
    
    # Use the existing user from the screenshot
    login_data = {
        "email": "test.multifile@example.com",
        "password": "testpassword123"
    }
    
    response = requests.post(f"{API_BASE}/login", json=login_data)
    
    if response.status_code == 200:
        token = response.json().get('token')
        headers = {"Authorization": f"Bearer {token}"}
        
        # Get tasks and submissions
        tasks_response = requests.get(f"{API_BASE}/tasks", headers=headers)
        submissions_response = requests.get(f"{API_BASE}/my-submissions", headers=headers)
        
        if tasks_response.status_code == 200 and submissions_response.status_code == 200:
            tasks = tasks_response.json()
            submissions = submissions_response.json()
            
            print(f"📋 Total tasks: {len(tasks)}")
            print(f"📝 Total submissions: {len(submissions)}")
            
            # Map submissions to task days
            completed_task_ids = {sub['task_id'] for sub in submissions}
            completed_days = set()
            
            for task in tasks:
                if task['id'] in completed_task_ids:
                    completed_days.add(task['day'])
            
            print(f"✅ Completed days: {sorted(completed_days)}")
            
            # Show task status
            print(f"\n📊 Task Status:")
            for task in sorted(tasks, key=lambda x: x['day']):
                day = task['day']
                title = task['title']
                is_completed = task['id'] in completed_task_ids
                
                if is_completed:
                    status = "✅ COMPLETED"
                else:
                    # Apply our unlocking logic
                    highest_completed = max(completed_days) if completed_days else -1
                    if day <= highest_completed + 2:
                        status = "🔓 SHOULD BE AVAILABLE"
                    else:
                        status = "🔒 SHOULD BE LOCKED"
                
                print(f"   Day {day:2d}: {title[:50]:<50} - {status}")
            
            # Check unlocking logic
            if completed_days:
                highest_completed = max(completed_days)
                print(f"\n🎯 Unlocking Analysis:")
                print(f"   Highest completed day: {highest_completed}")
                print(f"   Should unlock up to day: {highest_completed + 2}")
                
                if highest_completed >= 3:
                    print(f"   ✅ Day 4 and Day 5 should be AVAILABLE")
                    
                    # Check if they actually are
                    day_4_tasks = [t for t in tasks if t['day'] == 4]
                    day_5_tasks = [t for t in tasks if t['day'] == 5]
                    
                    if day_4_tasks:
                        print(f"   Day 4 task found: {day_4_tasks[0]['title']}")
                    if day_5_tasks:
                        print(f"   Day 5 task found: {day_5_tasks[0]['title']}")
                else:
                    print(f"   ❌ Need to complete up to Day 3 to unlock Day 4 and 5")
        else:
            print(f"❌ Failed to get data: tasks={tasks_response.status_code}, submissions={submissions_response.status_code}")
    else:
        print(f"❌ Login failed: {response.status_code}")

if __name__ == "__main__":
    check_state()
