
#!/usr/bin/env python3
"""
Comprehensive Backend API Testing for College Ambassador Management Dashboard
Tests all core functionality including authentication, task management, submissions, and analytics.
"""

import requests
import json
import base64
import io
from PIL import Image
import time
import sys
import os

# Get backend URL from frontend .env file
def get_backend_url():
    try:
        with open('/app/frontend/.env', 'r') as f:
            for line in f:
                if line.startswith('REACT_APP_BACKEND_URL='):
                    return line.split('=', 1)[1].strip()
    except Exception as e:
        print(f"Error reading backend URL: {e}")
        return None

BASE_URL = get_backend_url()
if not BASE_URL:
    print("❌ Could not get backend URL from frontend/.env")
    sys.exit(1)

API_BASE = f"{BASE_URL}/api"
print(f"🔗 Testing backend at: {API_BASE}")

# Test data
TEST_USER = {
    "email": "alex.martinez@berkeley.edu",
    "password": "SecurePass123!",
    "name": "Alex Martinez",
    "college": "UC Berkeley"
}

TEST_USER_2 = {
    "email": "emma.wilson@harvard.edu", 
    "password": "EmmaSecure456!",
    "name": "Emma Wilson",
    "college": "Harvard University"
}

# Global variables for test state
auth_token = None
user_id = None
task_ids = {}

def create_test_image():
    """Create a simple test image for upload testing"""
    img = Image.new('RGB', (100, 100), color='red')
    img_buffer = io.BytesIO()
    img.save(img_buffer, format='PNG')
    img_buffer.seek(0)
    return img_buffer

def test_user_registration():
    """Test user registration endpoint"""
    print("\n🧪 Testing User Registration...")
    
    url = f"{API_BASE}/register"
    response = requests.post(url, json=TEST_USER)
    
    if response.status_code == 200:
        data = response.json()
        if "token" in data and "user" in data:
            global auth_token, user_id
            auth_token = data["token"]
            user_id = data["user"]["id"]
            print(f"✅ Registration successful - User ID: {user_id}")
            print(f"✅ JWT token received: {auth_token[:20]}...")
            return True
        else:
            print(f"❌ Registration response missing required fields: {data}")
            return False
    else:
        print(f"❌ Registration failed: {response.status_code} - {response.text}")
        return False

def test_duplicate_registration():
    """Test duplicate email registration handling"""
    print("\n🧪 Testing Duplicate Registration...")
    
    url = f"{API_BASE}/register"
    response = requests.post(url, json=TEST_USER)
    
    if response.status_code == 400:
        print("✅ Duplicate registration properly rejected")
        return True
    else:
        print(f"❌ Duplicate registration should return 400, got: {response.status_code}")
        return False

def test_user_login():
    """Test user login endpoint"""
    print("\n🧪 Testing User Login...")
    
    login_data = {
        "email": TEST_USER["email"],
        "password": TEST_USER["password"]
    }
    
    url = f"{API_BASE}/login"
    response = requests.post(url, json=login_data)
    
    if response.status_code == 200:
        data = response.json()
        if "token" in data and "user" in data:
            global auth_token, user_id
            auth_token = data["token"]
            user_id = data["user"]["id"]
            print(f"✅ Login successful - User: {data['user']['name']}")
            print(f"✅ Current day: {data['user']['current_day']}")
            return True
        else:
            print(f"❌ Login response missing required fields: {data}")
            return False
    else:
        print(f"❌ Login failed: {response.status_code} - {response.text}")
        return False

def test_invalid_login():
    """Test login with invalid credentials"""
    print("\n🧪 Testing Invalid Login...")
    
    login_data = {
        "email": TEST_USER["email"],
        "password": "wrongpassword"
    }
    
    url = f"{API_BASE}/login"
    response = requests.post(url, json=login_data)
    
    if response.status_code == 401:
        print("✅ Invalid login properly rejected")
        return True
    else:
        print(f"❌ Invalid login should return 401, got: {response.status_code}")
        return False

def test_get_profile():
    """Test authenticated profile endpoint"""
    print("\n🧪 Testing Get Profile...")
    
    if not auth_token:
        print("❌ No auth token available")
        return False
    
    headers = {"Authorization": f"Bearer {auth_token}"}
    url = f"{API_BASE}/profile"
    response = requests.get(url, headers=headers)
    
    if response.status_code == 200:
        data = response.json()
        if data["email"] == TEST_USER["email"] and data["name"] == TEST_USER["name"]:
            print(f"✅ Profile retrieved - Name: {data['name']}, College: {data['college']}")
            print(f"✅ Current day: {data['current_day']}")
            return True
        else:
            print(f"❌ Profile data mismatch: {data}")
            return False
    else:
        print(f"❌ Profile request failed: {response.status_code} - {response.text}")
        return False

def test_unauthorized_access():
    """Test access without token"""
    print("\n🧪 Testing Unauthorized Access...")
    
    url = f"{API_BASE}/profile"
    response = requests.get(url)
    
    if response.status_code == 403:
        print("✅ Unauthorized access properly blocked")
        return True
    else:
        print(f"❌ Unauthorized access should return 403, got: {response.status_code}")
        return False

def test_get_all_tasks():
    """Test getting all tasks"""
    print("\n🧪 Testing Get All Tasks...")
    
    if not auth_token:
        print("❌ No auth token available")
        return False
    
    headers = {"Authorization": f"Bearer {auth_token}"}
    url = f"{API_BASE}/tasks"
    response = requests.get(url, headers=headers)
    
    if response.status_code == 200:
        tasks = response.json()
        if len(tasks) >= 16:  # Should have Day 0 + Days 1-15
            global task_ids
            for task in tasks:
                task_ids[task["day"]] = task["id"]
            print(f"✅ Retrieved {len(tasks)} tasks")
            print(f"✅ Day 0 task: {tasks[0]['title']}")
            print(f"✅ Day 1 task: {tasks[1]['title']}")
            return True
        else:
            print(f"❌ Expected at least 16 tasks, got {len(tasks)}")
            return False
    else:
        print(f"❌ Get tasks failed: {response.status_code} - {response.text}")
        return False

def test_get_specific_day_task():
    """Test getting task for specific day"""
    print("\n🧪 Testing Get Specific Day Task...")
    
    if not auth_token:
        print("❌ No auth token available")
        return False
    
    headers = {"Authorization": f"Bearer {auth_token}"}
    
    # Test Day 0 (orientation)
    url = f"{API_BASE}/tasks/0"
    response = requests.get(url, headers=headers)
    
    if response.status_code == 200:
        task = response.json()
        if task["day"] == 0 and task["task_type"] == "orientation":
            print(f"✅ Day 0 task retrieved: {task['title']}")
            
            # Test Day 1 task
            url = f"{API_BASE}/tasks/1"
            response = requests.get(url, headers=headers)
            
            if response.status_code == 200:
                task = response.json()
                if task["day"] == 1 and task["task_type"] == "daily_task":
                    print(f"✅ Day 1 task retrieved: {task['title']}")
                    return True
                else:
                    print(f"❌ Day 1 task data incorrect: {task}")
                    return False
            else:
                print(f"❌ Day 1 task request failed: {response.status_code}")
                return False
        else:
            print(f"❌ Day 0 task data incorrect: {task}")
            return False
    else:
        print(f"❌ Day 0 task request failed: {response.status_code} - {response.text}")
        return False

def test_submit_task_text_only():
    """Test submitting task with text only"""
    print("\n🧪 Testing Text-Only Task Submission...")
    
    if not auth_token or not task_ids:
        print("❌ No auth token or task IDs available")
        return False
    
    headers = {"Authorization": f"Bearer {auth_token}"}
    
    # Submit Day 0 task
    submission_data = {
        "task_id": task_ids[0],
        "status_text": "Completed orientation video and read all company documents. Very excited to start as an ambassador!",
        "people_connected": 0
    }
    
    url = f"{API_BASE}/submit-task"
    response = requests.post(url, json=submission_data, headers=headers)
    
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Task submission successful: {data['message']}")
        return True
    else:
        print(f"❌ Task submission failed: {response.status_code} - {response.text}")
        return False

def test_submit_task_with_image():
    """Test submitting task with image"""
    print("\n🧪 Testing Task Submission with Image...")
    
    if not auth_token or not task_ids:
        print("❌ No auth token or task IDs available")
        return False
    
    headers = {"Authorization": f"Bearer {auth_token}"}
    
    # Create test image
    test_image = create_test_image()
    
    # Submit Day 1 task with image
    files = {
        'image': ('test_proof.png', test_image, 'image/png')
    }
    
    data = {
        'task_id': task_ids[1],
        'status_text': 'Shared company info with 5 classmates during lunch. Posted on social media and got great engagement!',
        'people_connected': 5
    }
    
    url = f"{API_BASE}/submit-task-with-image"
    response = requests.post(url, data=data, files=files, headers=headers)
    
    if response.status_code == 200:
        result = response.json()
        print(f"✅ Task with image submission successful: {result['message']}")
        return True
    else:
        print(f"❌ Task with image submission failed: {response.status_code} - {response.text}")
        return False

def test_get_my_submissions():
    """Test getting user's submission history"""
    print("\n🧪 Testing Get My Submissions...")
    
    if not auth_token:
        print("❌ No auth token available")
        return False
    
    headers = {"Authorization": f"Bearer {auth_token}"}
    url = f"{API_BASE}/my-submissions"
    response = requests.get(url, headers=headers)
    
    if response.status_code == 200:
        submissions = response.json()
        if len(submissions) >= 2:  # Should have at least 2 submissions from previous tests
            print(f"✅ Retrieved {len(submissions)} submissions")
            for sub in submissions:
                print(f"   - Day {sub['day']}: {sub['status_text'][:50]}...")
            return True
        else:
            print(f"❌ Expected at least 2 submissions, got {len(submissions)}")
            return False
    else:
        print(f"❌ Get submissions failed: {response.status_code} - {response.text}")
        return False

def test_get_specific_submission():
    """Test getting specific task submission"""
    print("\n🧪 Testing Get Specific Submission...")
    
    if not auth_token or not task_ids:
        print("❌ No auth token or task IDs available")
        return False
    
    headers = {"Authorization": f"Bearer {auth_token}"}
    
    # Get submission for Day 0 task
    url = f"{API_BASE}/submission/{task_ids[0]}"
    response = requests.get(url, headers=headers)
    
    if response.status_code == 200:
        submission = response.json()
        if submission and submission["task_id"] == task_ids[0]:
            print(f"✅ Specific submission retrieved for Day 0")
            print(f"   Status: {submission['status_text'][:50]}...")
            return True
        else:
            print(f"❌ Submission data incorrect: {submission}")
            return False
    else:
        print(f"❌ Get specific submission failed: {response.status_code} - {response.text}")
        return False

def test_dashboard_stats():
    """Test dashboard analytics endpoint"""
    print("\n🧪 Testing Dashboard Stats...")
    
    if not auth_token:
        print("❌ No auth token available")
        return False
    
    headers = {"Authorization": f"Bearer {auth_token}"}
    url = f"{API_BASE}/dashboard-stats"
    response = requests.get(url, headers=headers)
    
    if response.status_code == 200:
        stats = response.json()
        required_fields = ["current_day", "total_tasks_completed", "total_people_connected", "user_name", "college"]
        
        if all(field in stats for field in required_fields):
            print(f"✅ Dashboard stats retrieved:")
            print(f"   Current Day: {stats['current_day']}")
            print(f"   Tasks Completed: {stats['total_tasks_completed']}")
            print(f"   People Connected: {stats['total_people_connected']}")
            print(f"   User: {stats['user_name']} from {stats['college']}")
            
            if stats["next_task"]:
                print(f"   Next Task: {stats['next_task']['title']}")
            
            return True
        else:
            print(f"❌ Dashboard stats missing required fields: {stats}")
            return False
    else:
        print(f"❌ Dashboard stats failed: {response.status_code} - {response.text}")
        return False

def test_user_progression():
    """Test that user progresses through days correctly"""
    print("\n🧪 Testing User Day Progression...")
    
    if not auth_token:
        print("❌ No auth token available")
        return False
    
    headers = {"Authorization": f"Bearer {auth_token}"}
    
    # Check current profile to see if day progressed
    url = f"{API_BASE}/profile"
    response = requests.get(url, headers=headers)
    
    if response.status_code == 200:
        profile = response.json()
        current_day = profile["current_day"]
        
        if current_day >= 2:  # Should have progressed after completing Day 0 and Day 1
            print(f"✅ User progression working - Current day: {current_day}")
            return True
        else:
            print(f"❌ User should be on day 2 or higher, currently on day: {current_day}")
            return False
    else:
        print(f"❌ Profile check failed: {response.status_code} - {response.text}")
        return False

def test_invalid_task_submission():
    """Test submitting task with invalid task ID"""
    print("\n🧪 Testing Invalid Task Submission...")
    
    if not auth_token:
        print("❌ No auth token available")
        return False
    
    headers = {"Authorization": f"Bearer {auth_token}"}
    
    submission_data = {
        "task_id": "invalid-task-id-12345",
        "status_text": "This should fail",
        "people_connected": 1
    }
    
    url = f"{API_BASE}/submit-task"
    response = requests.post(url, json=submission_data, headers=headers)
    
    if response.status_code == 404:
        print("✅ Invalid task submission properly rejected")
        return True
    else:
        print(f"❌ Invalid task submission should return 404, got: {response.status_code}")
        return False

def test_enhanced_points_calculation():
    """Test enhanced points system with base points + bonuses"""
    print("\n🧪 Testing Enhanced Points Calculation...")
    
    if not auth_token or not task_ids:
        print("❌ No auth token or task IDs available")
        return False
    
    headers = {"Authorization": f"Bearer {auth_token}"}
    
    # Get current user points before submission
    profile_response = requests.get(f"{API_BASE}/profile", headers=headers)
    if profile_response.status_code != 200:
        print("❌ Could not get initial profile")
        return False
    
    initial_points = profile_response.json()["total_points"]
    print(f"   Initial points: {initial_points}")
    
    # Test 1: Submit task with text only (base points only)
    if 2 in task_ids:
        submission_data = {
            "task_id": task_ids[2],
            "status_text": "Created engaging social media content about our products",
            "people_connected": 0
        }
        
        response = requests.post(f"{API_BASE}/submit-task", json=submission_data, headers=headers)
        if response.status_code == 200:
            points_earned = response.json()["points_earned"]
            expected_base_points = 60  # Day 2 should have 50 + (2*5) = 60 base points
            
            if points_earned == expected_base_points:
                print(f"✅ Base points calculation correct: {points_earned} points")
            else:
                print(f"❌ Base points incorrect. Expected: {expected_base_points}, Got: {points_earned}")
                return False
        else:
            print(f"❌ Task submission failed: {response.status_code}")
            return False
    
    # Test 2: Submit task with people connected (base + people bonus)
    if 3 in task_ids:
        submission_data = {
            "task_id": task_ids[3],
            "status_text": "Hosted brand awareness event, connected with many students",
            "people_connected": 8
        }
        
        response = requests.post(f"{API_BASE}/submit-task", json=submission_data, headers=headers)
        if response.status_code == 200:
            points_earned = response.json()["points_earned"]
            expected_points = 65 + (8 * 10)  # Day 3: 50 + (3*5) + (8*10) = 145
            
            if points_earned == expected_points:
                print(f"✅ People connected bonus calculation correct: {points_earned} points")
            else:
                print(f"❌ People connected bonus incorrect. Expected: {expected_points}, Got: {points_earned}")
                return False
        else:
            print(f"❌ Task submission failed: {response.status_code}")
            return False
    
    # Test 3: Submit task with image (base + people bonus + image bonus)
    if 4 in task_ids:
        test_image = create_test_image()
        files = {'image': ('proof.png', test_image, 'image/png')}
        data = {
            'task_id': task_ids[4],
            'status_text': 'Wrote comprehensive product review blog post with photos',
            'people_connected': 3
        }
        
        response = requests.post(f"{API_BASE}/submit-task-with-image", data=data, files=files, headers=headers)
        if response.status_code == 200:
            points_earned = response.json()["points_earned"]
            expected_points = 70 + (3 * 10) + 25  # Day 4: 50 + (4*5) + (3*10) + 25 = 125
            
            if points_earned == expected_points:
                print(f"✅ Image bonus calculation correct: {points_earned} points")
            else:
                print(f"❌ Image bonus incorrect. Expected: {expected_points}, Got: {points_earned}")
                return False
        else:
            print(f"❌ Task with image submission failed: {response.status_code}")
            return False
    
    # Verify total points updated correctly
    final_profile = requests.get(f"{API_BASE}/profile", headers=headers)
    if final_profile.status_code == 200:
        final_points = final_profile.json()["total_points"]
        print(f"   Final points: {final_points}")
        print("✅ Enhanced points system working correctly")
        return True
    else:
        print("❌ Could not verify final points")
        return False

def test_leaderboard_system():
    """Test leaderboard endpoint and ranking calculation"""
    print("\n🧪 Testing Leaderboard System...")
    
    if not auth_token:
        print("❌ No auth token available")
        return False
    
    headers = {"Authorization": f"Bearer {auth_token}"}
    
    # Create a second user with different points for leaderboard testing
    print("   Creating second user for leaderboard comparison...")
    register_response = requests.post(f"{API_BASE}/register", json=TEST_USER_2)
    
    if register_response.status_code == 200:
        user2_token = register_response.json()["token"]
        user2_headers = {"Authorization": f"Bearer {user2_token}"}
        
        # Submit a task for user 2 to give them some points
        if 0 in task_ids:
            submission_data = {
                "task_id": task_ids[0],
                "status_text": "Completed orientation as second user",
                "people_connected": 2
            }
            requests.post(f"{API_BASE}/submit-task", json=submission_data, headers=user2_headers)
    
    # Test leaderboard endpoint
    url = f"{API_BASE}/leaderboard"
    response = requests.get(url, headers=headers)
    
    if response.status_code == 200:
        leaderboard = response.json()
        
        if isinstance(leaderboard, list) and len(leaderboard) > 0:
            print(f"✅ Leaderboard retrieved with {len(leaderboard)} entries")
            
            # Verify leaderboard structure
            first_entry = leaderboard[0]
            required_fields = ["name", "college", "total_points", "total_referrals", "rank"]
            
            if all(field in first_entry for field in required_fields):
                print("✅ Leaderboard entries have correct structure")
                
                # Verify ranking order (should be sorted by points descending)
                is_sorted = True
                for i in range(len(leaderboard) - 1):
                    if leaderboard[i]["total_points"] < leaderboard[i + 1]["total_points"]:
                        is_sorted = False
                        break
                
                if is_sorted:
                    print("✅ Leaderboard correctly sorted by points")
                    
                    # Verify rank numbers are sequential
                    ranks_correct = all(leaderboard[i]["rank"] == i + 1 for i in range(len(leaderboard)))
                    
                    if ranks_correct:
                        print("✅ Leaderboard ranks are correctly assigned")
                        
                        # Display top entries
                        for i, entry in enumerate(leaderboard[:3]):
                            print(f"   #{entry['rank']}: {entry['name']} ({entry['college']}) - {entry['total_points']} points")
                        
                        return True
                    else:
                        print("❌ Leaderboard ranks are not correctly assigned")
                        return False
                else:
                    print("❌ Leaderboard not sorted by points")
                    return False
            else:
                print(f"❌ Leaderboard entries missing required fields: {first_entry}")
                return False
        else:
            print("❌ Leaderboard should return a non-empty list")
            return False
    else:
        print(f"❌ Leaderboard request failed: {response.status_code} - {response.text}")
        return False

def test_advanced_analytics():
    """Test enhanced dashboard analytics with new fields"""
    print("\n🧪 Testing Advanced Analytics...")
    
    if not auth_token:
        print("❌ No auth token available")
        return False
    
    headers = {"Authorization": f"Bearer {auth_token}"}
    url = f"{API_BASE}/dashboard-stats"
    response = requests.get(url, headers=headers)
    
    if response.status_code == 200:
        stats = response.json()
        
        # Check for enhanced fields
        enhanced_fields = [
            "current_day", "total_tasks_completed", "total_points", 
            "total_referrals", "rank_position", "completion_percentage",
            "next_task", "user_name", "college"
        ]
        
        missing_fields = [field for field in enhanced_fields if field not in stats]
        
        if not missing_fields:
            print("✅ All enhanced analytics fields present")
            
            # Verify data types and ranges
            if isinstance(stats["completion_percentage"], (int, float)) and 0 <= stats["completion_percentage"] <= 100:
                print(f"✅ Completion percentage valid: {stats['completion_percentage']}%")
            else:
                print(f"❌ Invalid completion percentage: {stats['completion_percentage']}")
                return False
            
            if isinstance(stats["rank_position"], int) and stats["rank_position"] > 0:
                print(f"✅ Rank position valid: #{stats['rank_position']}")
            else:
                print(f"❌ Invalid rank position: {stats['rank_position']}")
                return False
            
            if isinstance(stats["total_points"], int) and stats["total_points"] >= 0:
                print(f"✅ Total points valid: {stats['total_points']}")
            else:
                print(f"❌ Invalid total points: {stats['total_points']}")
                return False
            
            if isinstance(stats["total_referrals"], int) and stats["total_referrals"] >= 0:
                print(f"✅ Total referrals valid: {stats['total_referrals']}")
            else:
                print(f"❌ Invalid total referrals: {stats['total_referrals']}")
                return False
            
            # Display comprehensive analytics
            print(f"   📊 Enhanced Analytics Summary:")
            print(f"      User: {stats['user_name']} ({stats['college']})")
            print(f"      Current Day: {stats['current_day']}")
            print(f"      Tasks Completed: {stats['total_tasks_completed']}")
            print(f"      Completion Rate: {stats['completion_percentage']}%")
            print(f"      Total Points: {stats['total_points']}")
            print(f"      Total Referrals: {stats['total_referrals']}")
            print(f"      Current Rank: #{stats['rank_position']}")
            
            return True
        else:
            print(f"❌ Missing enhanced analytics fields: {missing_fields}")
            return False
    else:
        print(f"❌ Advanced analytics request failed: {response.status_code} - {response.text}")
        return False

def test_user_rank_calculation():
    """Test individual user rank calculation accuracy"""
    print("\n🧪 Testing User Rank Calculation...")
    
    if not auth_token:
        print("❌ No auth token available")
        return False
    
    headers = {"Authorization": f"Bearer {auth_token}"}
    
    # Get user's profile with rank
    profile_response = requests.get(f"{API_BASE}/profile", headers=headers)
    if profile_response.status_code != 200:
        print("❌ Could not get user profile")
        return False
    
    user_rank = profile_response.json()["rank_position"]
    user_points = profile_response.json()["total_points"]
    
    # Get leaderboard to verify rank
    leaderboard_response = requests.get(f"{API_BASE}/leaderboard", headers=headers)
    if leaderboard_response.status_code != 200:
        print("❌ Could not get leaderboard")
        return False
    
    leaderboard = leaderboard_response.json()
    
    # Find user in leaderboard
    user_name = profile_response.json()["name"]
    user_in_leaderboard = None
    
    for entry in leaderboard:
        if entry["name"] == user_name:
            user_in_leaderboard = entry
            break
    
    if user_in_leaderboard:
        leaderboard_rank = user_in_leaderboard["rank"]
        
        if user_rank == leaderboard_rank:
            print(f"✅ User rank calculation consistent: #{user_rank}")
            print(f"   User points: {user_points}")
            return True
        else:
            print(f"❌ Rank mismatch - Profile: #{user_rank}, Leaderboard: #{leaderboard_rank}")
            return False
    else:
        print("❌ User not found in leaderboard")
        return False

def run_all_tests():
    """Run all backend tests in sequence"""
    print("🚀 Starting Comprehensive Backend API Testing")
    print("=" * 60)
    
    tests = [
        ("User Registration", test_user_registration),
        ("Duplicate Registration", test_duplicate_registration),
        ("User Login", test_user_login),
        ("Invalid Login", test_invalid_login),
        ("Get Profile", test_get_profile),
        ("Unauthorized Access", test_unauthorized_access),
        ("Get All Tasks", test_get_all_tasks),
        ("Get Specific Day Task", test_get_specific_day_task),
        ("Submit Task (Text Only)", test_submit_task_text_only),
        ("Submit Task with Image", test_submit_task_with_image),
        ("Get My Submissions", test_get_my_submissions),
        ("Get Specific Submission", test_get_specific_submission),
        ("Dashboard Stats", test_dashboard_stats),
        ("User Day Progression", test_user_progression),
        ("Invalid Task Submission", test_invalid_task_submission),
        # Enhanced Features Testing
        ("Enhanced Points Calculation", test_enhanced_points_calculation),
        ("Leaderboard System", test_leaderboard_system),
        ("Advanced Analytics", test_advanced_analytics),
        ("User Rank Calculation", test_user_rank_calculation),
    ]
    
    passed = 0
    failed = 0
    
    for test_name, test_func in tests:
        try:
            if test_func():
                passed += 1
            else:
                failed += 1
        except Exception as e:
            print(f"❌ {test_name} - Exception: {str(e)}")
            failed += 1
        
        time.sleep(0.5)  # Small delay between tests
    
    print("\n" + "=" * 60)
    print(f"🏁 Testing Complete: {passed} passed, {failed} failed")
    
    if failed == 0:
        print("🎉 All backend tests passed successfully!")
        return True
    else:
        print(f"⚠️  {failed} tests failed - check logs above for details")
        return False

if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)