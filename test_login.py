import requests
import json

# Test the login functionality
BACKEND_URL = "http://127.0.0.1:5000"

def test_registration():
    """Test user registration"""
    print("Testing user registration...")
    
    registration_data = {
        "email": "test@example.com",
        "password": "password123",
        "name": "Test User",
        "college": "Test College",
        "role": "ambassador"
    }
    
    try:
        response = requests.post(f"{BACKEND_URL}/api/register", json=registration_data)
        print(f"Registration Status Code: {response.status_code}")
        print(f"Registration Response: {response.text}")
        
        if response.status_code == 200:
            print("✅ Registration successful!")
            return response.json()
        else:
            print("❌ Registration failed!")
            return None
    except Exception as e:
        print(f"❌ Registration error: {e}")
        return None

def test_login():
    """Test user login"""
    print("\nTesting user login...")
    
    login_data = {
        "email": "test@example.com",
        "password": "password123",
        "role": "ambassador"
    }
    
    try:
        response = requests.post(f"{BACKEND_URL}/api/login", json=login_data)
        print(f"Login Status Code: {response.status_code}")
        print(f"Login Response: {response.text}")
        
        if response.status_code == 200:
            print("✅ Login successful!")
            return response.json()
        else:
            print("❌ Login failed!")
            return None
    except Exception as e:
        print(f"❌ Login error: {e}")
        return None

def test_profile_access(token):
    """Test accessing profile with token"""
    print("\nTesting profile access...")
    
    headers = {
        "Authorization": f"Bearer {token}"
    }
    
    try:
        response = requests.get(f"{BACKEND_URL}/api/profile", headers=headers)
        print(f"Profile Status Code: {response.status_code}")
        print(f"Profile Response: {response.text}")
        
        if response.status_code == 200:
            print("✅ Profile access successful!")
            return response.json()
        else:
            print("❌ Profile access failed!")
            return None
    except Exception as e:
        print(f"❌ Profile access error: {e}")
        return None

if __name__ == "__main__":
    print("🧪 Testing Login Functionality")
    print("=" * 50)
    
    # Test registration
    reg_result = test_registration()
    
    # Test login
    login_result = test_login()
    
    if login_result and "token" in login_result:
        # Test profile access
        profile_result = test_profile_access(login_result["token"])
    
    print("\n" + "=" * 50)
    print("🏁 Test completed!")
