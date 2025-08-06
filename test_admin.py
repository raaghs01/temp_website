import requests
import json

# Test admin registration and login
API_BASE = "http://localhost:8000/api"

def test_admin_functionality():
    print("Testing admin functionality...")
    
    # Test admin registration
    admin_data = {
        "email": "admin@test.com",
        "password": "admin123",
        "name": "Admin User",
        "college": "Test University",
        "role": "admin"
    }
    
    print("1. Registering admin user...")
    try:
        response = requests.post(f"{API_BASE}/register", json=admin_data)
        print(f"Registration response: {response.status_code}")
        if response.status_code == 200:
            print("Admin registration successful!")
            print(f"Response: {response.json()}")
        else:
            print(f"Registration failed: {response.text}")
    except Exception as e:
        print(f"Registration error: {e}")
    
    # Test admin login
    print("\n2. Testing admin login...")
    login_data = {
        "email": "admin@test.com",
        "password": "admin123",
        "role": "admin"
    }
    
    try:
        response = requests.post(f"{API_BASE}/login", json=login_data)
        print(f"Login response: {response.status_code}")
        if response.status_code == 200:
            print("Admin login successful!")
            result = response.json()
            print(f"User role: {result['user']['role']}")
            print(f"Token: {result['token'][:50]}...")
            
            # Test admin stats endpoint
            print("\n3. Testing admin stats endpoint...")
            headers = {"Authorization": f"Bearer {result['token']}"}
            stats_response = requests.get(f"{API_BASE}/admin/stats", headers=headers)
            print(f"Admin stats response: {stats_response.status_code}")
            if stats_response.status_code == 200:
                print("Admin stats successful!")
                print(f"Stats: {stats_response.json()}")
            else:
                print(f"Admin stats failed: {stats_response.text}")
                
        else:
            print(f"Login failed: {response.text}")
    except Exception as e:
        print(f"Login error: {e}")

if __name__ == "__main__":
    test_admin_functionality() 