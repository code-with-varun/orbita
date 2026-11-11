import urllib.request
import json
import time

def post(url, data):
    req = urllib.request.Request(url, data=json.dumps(data).encode('utf-8'), headers={'Content-Type': 'application/json'})
    return json.loads(urllib.request.urlopen(req).read().decode('utf-8'))

def get(url):
    req = urllib.request.Request(url)
    return json.loads(urllib.request.urlopen(req).read().decode('utf-8'))

def put(url, data):
    req = urllib.request.Request(url, data=json.dumps(data).encode('utf-8'), headers={'Content-Type': 'application/json'}, method='PUT')
    return json.loads(urllib.request.urlopen(req).read().decode('utf-8'))

# Clean reset with superadmin
post('http://localhost:5001/api/system/reset', {'user_email': 'superadmin@orbita.com', 'user_role': 'Superadmin'})

# 1. Create Goal 1 and Goal 2
g1 = post('http://localhost:5001/api/tasks', {'title': 'Goal 1 Focus', 'orbita_type': 'Goal', 'workspace': 'Work', 'target_hours': 10})
g2 = post('http://localhost:5001/api/tasks', {'title': 'Goal 2 Focus', 'orbita_type': 'Goal', 'workspace': 'Work', 'target_hours': 15})

# Start Timer on Goal 1
t1 = post('http://localhost:5001/api/tasks/' + g1['id'] + '/timer/start', {})
print('Goal 1 Timer Started:', t1['message'])
time.sleep(2)

# Start Timer on Goal 2 -> Should auto-stop Goal 1!
t2 = post('http://localhost:5001/api/tasks/' + g2['id'] + '/timer/start', {})
print('Goal 2 Timer Started (Auto-stopped Goal 1):', t2['message'])

g1_check = get('http://localhost:5001/api/tasks/' + g1['id'])
print('Goal 1 Is Running:', g1_check['is_timer_running'], '(Expected False)')

# Test Pause on Goal 2
p2 = post('http://localhost:5001/api/tasks/' + g2['id'] + '/timer/pause', {})
print('Goal 2 Paused, Accumulated:', p2['accumulated_seconds'], 's')

time.sleep(2)

# Test Resume on Goal 2
r2 = post('http://localhost:5001/api/tasks/' + g2['id'] + '/timer/resume', {})
print('Goal 2 Resumed:', r2['message'])
time.sleep(1)

# Test Stop on Goal 2
s2 = post('http://localhost:5001/api/tasks/' + g2['id'] + '/timer/stop', {})
print('Goal 2 Stopped, Total Seconds Logged:', s2['duration_seconds'], 's')

# Check Timesheets in MongoDB
ts = get('http://localhost:5001/api/timesheets')
print('Timesheet records count in MongoDB:', len(ts))
for s in ts:
    print(' - Session:', s['task_title'], f"({s['duration_seconds']}s)")

# Clean reset for fresh user
post('http://localhost:5001/api/system/reset', {'user_email': 'superadmin@orbita.com', 'user_role': 'Superadmin'})
print('Test completed successfully, DB reset to fresh setup!')
