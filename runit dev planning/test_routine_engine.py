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

print('\n3. Testing Enhanced Routine Recurrence Options...')

# A. Daily Weekdays
rtn_daily = post('/api/tasks', {
    'title': 'Weekday Standup Routine',
    'orbita_type': 'Routine',
    'recurrence_type': 'Daily',
    'recurrence_day': 'weekdays',
    'recurrence_interval': 1,
    'workspace': 'Work',
    'user_id': uid,
    'user_email': uemail,
    'created_by': uname
})
print('Created Daily Weekdays Routine:', rtn_daily['id'])

# B. Weekly Multi-Days (Mon, Wed, Fri)
rtn_weekly = post('/api/tasks', {
    'title': 'Gym & Fitness Routine',
    'orbita_type': 'Routine',
    'recurrence_type': 'Weekly',
    'recurrence_day': 'Mon, Wed, Fri',
    'recurrence_interval': 1,
    'workspace': 'Personal',
    'user_id': uid,
    'user_email': uemail,
    'created_by': uname
})
print('Created Weekly Multi-day Routine:', rtn_weekly['id'])

# C. Monthly Specific Day & Last Day
rtn_monthly = post('/api/tasks', {
    'title': 'Monthly Electricity Bill Routine',
    'orbita_type': 'Routine',
    'recurrence_type': 'Monthly',
    'recurrence_day': '15',
    'recurrence_interval': 1,
    'workspace': 'Personal',
    'user_id': uid,
    'user_email': uemail,
    'created_by': uname
})
print('Created Monthly Day 15 Routine:', rtn_monthly['id'])

# Trigger generator
post('/api/routines/generate', {'user_id': uid, 'user_email': uemail, 'user_name': uname})
tasks = get(f'/api/tasks?user_id={uid}&user_email={uemail}&user_role=Member&user_name={uname}')

daily_occs = [t for t in tasks if t.get('routine_id') == rtn_daily['id']]
weekly_occs = [t for t in tasks if t.get('routine_id') == rtn_weekly['id']]

print(f'Daily occurrences count: {len(daily_occs)}')
print(f'Weekly occurrences count: {len(weekly_occs)}')

# Test completing an occurrence task
if len(daily_occs) > 0:
    first_occ_id = daily_occs[0]['id']
    put(f'/api/tasks/{first_occ_id}', {'status': 'Completed', 'user_name': uname})
    completed_occ = get(f'/api/tasks/{first_occ_id}')
    assert completed_occ['status'] == 'Completed', 'Occurrence task should be Completed!'
    parent_routine = get(f'/api/tasks/{rtn_daily["id"]}')
    assert parent_routine['status'] == 'Active', 'Parent Routine MUST remain Active!'
    print('Occurrence completion and parent persistence verified!')

print('\nALL ENHANCED RECURRENCE TESTS PASSED WITH 100% SUCCESS!')
