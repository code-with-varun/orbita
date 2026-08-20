import urllib.request
import urllib.parse
import json

BASE = 'http://localhost:5001'

def post(url, data):
    req = urllib.request.Request(
        BASE + url,
        data=json.dumps(data).encode('utf-8'),
        headers={'Content-Type': 'application/json'}
    )
    return json.loads(urllib.request.urlopen(req).read().decode('utf-8'))

def get(url):
    return json.loads(urllib.request.urlopen(BASE + url.replace(' ', '%20')).read().decode('utf-8'))

def put(url, data):
    req = urllib.request.Request(
        BASE + url,
        data=json.dumps(data).encode('utf-8'),
        headers={'Content-Type': 'application/json'},
        method='PUT'
    )
    return json.loads(urllib.request.urlopen(req).read().decode('utf-8'))

print('1. Testing User Authentication...')
try:
    login_res = post('/api/auth/login', {'email': 'test_routine_user@orbita.com', 'password': 'password123'})
    user = login_res.get('user')
except Exception:
    user = None

if not user:
    reg_res = post('/api/auth/register', {
        'name': 'Test Routine User',
        'email': 'test_routine_user@orbita.com',
        'password': 'password123',
        'role': 'Member'
    })
    user = reg_res['user']

uid = user['id']
uemail = user['email']
uname = user['name']
print('User logged in:', uname, uid, uemail)

print('\n2. Creating Goal and Testing Focus Timer Sessions (Timesheet Visibility)...')
goal = post('/api/tasks', {
    'title': 'Test Deep Work Mastery Goal',
    'orbita_type': 'Goal',
    'workspace': 'Personal',
    'target_hours': 10,
    'user_id': uid,
    'user_email': uemail,
    'created_by': uname
})
gid = goal['id']
print('Created Goal ID:', gid)

# Start timer
post(f'/api/tasks/{gid}/timer/start', {'user_id': uid, 'user_email': uemail, 'user_name': uname})
# Stop timer
post(f'/api/tasks/{gid}/timer/stop', {'user_id': uid, 'user_email': uemail, 'user_name': uname, 'notes': 'Deep focus session'})

# Check timesheets for user
ts = get(f'/api/timesheets?user_id={uid}&user_email={uemail}&user_role=Member&user_name={uname}')
print('User timesheets count:', len(ts))
assert len(ts) > 0, 'Timesheet session should be visible to user!'
print('Timesheet verification passed!')

print('\n3. Testing Routine Auto-Occurrence Engine...')
routine = post('/api/tasks', {
    'title': 'Daily Morning Review Routine',
    'orbita_type': 'Routine',
    'recurrence_type': 'Daily',
    'recurrence_interval': 1,
    'workspace': 'Work',
    'priority_quadrant': 'Q3',
    'user_id': uid,
    'user_email': uemail,
    'created_by': uname
})
rid = routine['id']
print('Created Routine ID:', rid)

# Query tasks for user which triggers auto-occurrence generator
tasks = get(f'/api/tasks?user_id={uid}&user_email={uemail}&user_role=Member&user_name={uname}')
occurrences = [t for t in tasks if t.get('routine_id') == rid]
print('Generated Occurrences for this routine:', len(occurrences))
assert len(occurrences) > 0, 'Routine occurrence tasks should be generated!'
for occ in occurrences:
    print(f" - Occurrence: {occ['ticket_key']} | {occ['title']} | Date: {occ.get('routine_occurrence_date')} | Status: {occ['status']}")

# Trigger generator a second time to verify duplicate prevention
post('/api/routines/generate', {'user_id': uid, 'user_email': uemail, 'user_name': uname})
tasks2 = get(f'/api/tasks?user_id={uid}&user_email={uemail}&user_role=Member&user_name={uname}')
occurrences2 = [t for t in tasks2 if t.get('routine_id') == rid]
assert len(occurrences) == len(occurrences2), 'Idempotency check: No duplicate occurrences should be created!'
print('Idempotency verified: exactly same occurrence count!')

# Test Completing an Occurrence Task
first_occ_id = occurrences[0]['id']
put(f'/api/tasks/{first_occ_id}', {'status': 'Completed', 'user_name': uname})

# Verify the occurrence is completed
completed_occ = get(f'/api/tasks/{first_occ_id}')
assert completed_occ['status'] == 'Completed', 'Occurrence task should be Completed!'

# Verify the parent routine remains Active
parent_routine = get(f'/api/tasks/{rid}')
assert parent_routine['status'] == 'Active', 'Parent Routine MUST remain Active!'
print('Occurrence completed successfully while parent Routine remains Active!')

print('\nALL TESTS PASSED WITH 100% SUCCESS!')
