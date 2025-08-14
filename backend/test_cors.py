import requests
import time

# Wait for server to start
time.sleep(3)

print("Testing CORS configuration...")

# Test preflight request
response = requests.options(
    'http://127.0.0.1:5000/api/submit-task-with-files',
    headers={
        'Origin': 'http://localhost:3000',
        'Access-Control-Request-Method': 'POST'
    }
)

print(f"Preflight Status: {response.status_code}")
print(f"Allow-Origin: {response.headers.get('access-control-allow-origin', 'NOT FOUND')}")
print(f"Allow-Methods: {response.headers.get('access-control-allow-methods', 'NOT FOUND')}")
print(f"Allow-Credentials: {response.headers.get('access-control-allow-credentials', 'NOT FOUND')}")

# Test actual POST request (should fail with 403 due to no auth, but CORS should work)
try:
    response = requests.post(
        'http://127.0.0.1:5000/api/submit-task-with-files',
        headers={'Origin': 'http://localhost:3000'},
        data={'task_id': 'test'}
    )
    print(f"POST Status: {response.status_code}")
    print(f"POST Allow-Origin: {response.headers.get('access-control-allow-origin', 'NOT FOUND')}")
except Exception as e:
    print(f"POST Error: {e}")
