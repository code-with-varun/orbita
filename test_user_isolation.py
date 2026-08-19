import urllib.request
import json
import time

def post(url, data):
    req = urllib.request.Request(url, data=json.dumps(data).encode('utf-8'), headers={'Content-Type': 'application/json'})
    return json.loads(urllib.request.urlopen(req).read().decode('utf-8'))

def get(url):
    req = urllib.request.Request(url)
    return json.loads(urllib.request.urlopen(req).read().decode('utf-8'))

# Clean reset with superadmin
post('http://localhost:5001/api/system/reset', {'user_email': 'superadmin@orbita.com', 'user_role': 'Superadmin'})

# 1. Register Alice and Bob
u_alice = post('http://localhost:5001/api/auth/register', {'name': 'Alice Smith', 'email': 'alice@example.com', 'password': 'password123', 'role': 'Member'})
u_bob = post('http://localhost:5001/api/auth/register', {'name': 'Bob Jones', 'email': 'bob@example.com', 'password': 'password123', 'role': 'Member'})

print('Alice Registered:', u_alice['user']['email'], 'ID:', u_alice['user']['id'])
print('Bob Registered:', u_bob['user']['email'], 'ID:', u_bob['user']['id'])

# 2. Alice creates a task
t_alice = post('http://localhost:5001/api/tasks', {
    'title': 'Alice Secret Task',
    'orbita_type': 'Task',
    'workspace': 'Personal',
    'user_id': u_alice['user']['id'],
    'user_email': u_alice['user']['email'],
    'user_name': u_alice['user']['name']
})
print('Alice Created Task:', t_alice['ticket_key'], t_alice['title'])

# 3. Bob creates a goal
t_bob = post('http://localhost:5001/api/tasks', {
    'title': 'Bob Private Goal',
    'orbita_type': 'Goal',
    'workspace': 'Work',
    'target_hours': 10,
    'user_id': u_bob['user']['id'],
    'user_email': u_bob['user']['email'],
    'user_name': u_bob['user']['name']
})
print('Bob Created Goal:', t_bob['ticket_key'], t_bob['title'])

# 4. Verify Alice's Isolation
alice_items = get(f"http://localhost:5001/api/tasks?user_id={u_alice['user']['id']}&user_email={u_alice['user']['email']}&user_role=Member")
print("\n--- Alice View ---")
print(f"Alice sees {len(alice_items)} item(s): {[item['title'] for item in alice_items]}")
assert len(alice_items) == 1 and alice_items[0]['title'] == 'Alice Secret Task', 'Isolation failure: Alice saw unexpected items!'

# 5. Verify Bob's Isolation
bob_items = get(f"http://localhost:5001/api/tasks?user_id={u_bob['user']['id']}&user_email={u_bob['user']['email']}&user_role=Member")
print("\n--- Bob View ---")
print(f"Bob sees {len(bob_items)} item(s): {[item['title'] for item in bob_items]}")
assert len(bob_items) == 1 and bob_items[0]['title'] == 'Bob Private Goal', 'Isolation failure: Bob saw unexpected items!'

# 6. Verify Superadmin Oversight
super_items = get("http://localhost:5001/api/tasks?user_email=superadmin@orbita.com&user_role=Superadmin")
print("\n--- Superadmin View ---")
print(f"Superadmin sees {len(super_items)} item(s): {[item['title'] for item in super_items]}")
assert len(super_items) == 2, 'Superadmin should have full oversight across all users!'

# 7. Test Routine Creation without Scheduled/Due Dates
r_alice = post('http://localhost:5001/api/tasks', {
    'title': 'Alice Daily Standup Routine',
    'orbita_type': 'Routine',
    'workspace': 'Work',
    'recurrence_type': 'Daily',
    'recurrence_interval': 1,
    'user_id': u_alice['user']['id'],
    'user_email': u_alice['user']['email'],
    'user_name': u_alice['user']['name']
})
print('\nRoutine created without manual dates:', r_alice['ticket_key'], r_alice['title'], 'Recurrence:', r_alice['recurrence_type'])

# Clean reset for fresh user
post('http://localhost:5001/api/system/reset', {'user_email': 'superadmin@orbita.com', 'user_role': 'Superadmin'})
print('\nDatabase cleanly reset to fresh setup for user! All tests passed 100%!')
