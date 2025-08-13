#!/usr/bin/env python3
"""
Final test to verify task unlocking is working correctly
"""

import requests
import json

API_BASE = "http://127.0.0.1:5000/api"

def test_unlocking():
    """Test the unlocking logic"""
    print("🔍 Final test of task unlocking logic...")
    
    # Use the existing user
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
            
            # Find completed days using the correct field
            completed_days = set()
            for submission in submissions:
                if submission.get('is_completed') == True:
                    # Find the corresponding task to get the day
                    for task in tasks:
                        if task['id'] == submission['task_id']:
                            completed_days.add(task['day'])
                            break
            
            print(f"✅ Completed days: {sorted(completed_days)}")
            
            if completed_days:
                highest_completed = max(completed_days)
                max_available_day = highest_completed + 2
                
                print(f"\n🎯 Unlocking Logic:")
                print(f"   Highest completed day: {highest_completed}")
                print(f"   Max available day: {max_available_day}")
                
                # Check which tasks should be available
                available_days = []
                locked_days = []
                
                for task in sorted(tasks, key=lambda x: x['day']):
                    day = task['day']
                    is_completed = any(
                        sub['task_id'] == task['id'] and sub.get('is_completed') == True 
                        for sub in submissions
                    )
                    
                    if is_completed:
                        status = "✅ COMPLETED"
                    elif day <= max_available_day:
                        status = "🔓 AVAILABLE"
                        available_days.append(day)
                    else:
                        status = "🔒 LOCKED"
                        locked_days.append(day)
                    
                    print(f"   Day {day:2d}: {status}")
                
                print(f"\n📊 Expected Results:")
                print(f"   Available days: {available_days}")
                print(f"   Locked days: {locked_days}")
                
                # Specific check for Day 4 and Day 5
                if highest_completed >= 3:
                    if 4 in available_days and 5 in available_days:
                        print(f"   ✅ SUCCESS: Day 4 and Day 5 should be available!")
                        return True
                    else:
                        print(f"   ❌ ISSUE: Day 4 and Day 5 should be available but aren't")
                        return False
                else:
                    print(f"   ℹ️ Need to complete Day 3 to unlock Day 4 and 5")
                    return True
            else:
                print("   ℹ️ No completed tasks found")
                return True
        else:
            print(f"❌ Failed to get data")
            return False
    else:
        print(f"❌ Login failed: {response.status_code}")
        return False

if __name__ == "__main__":
    success = test_unlocking()
    print(f"\n{'🎉 TEST PASSED' if success else '❌ TEST FAILED'}")
