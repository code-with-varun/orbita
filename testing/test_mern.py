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

# 1. Reset Database in MongoDB Atlas
print("1. Wiping MongoDB Atlas database clean...")
res_reset = post('http://localhost:5001/api/system/reset', {})
print("Reset result:", res_reset)

# 2. Register
print("\n2. Registering User in MongoDB Atlas...")
reg = post('http://localhost:5001/api/auth/register', {
    'name': 'Varun VK',
    'email': 'varun@orbita.com',
    'password': 'password123',
    'role': 'Admin'
})
print("User registered:", reg['user']['name'], reg['user']['email'], "ID:", reg['user']['id'])

# 3. Create 4 Core Types
print("\n3. Creating 4 Core Types...")
task_item = post('http://localhost:5001/api/tasks', {
    'title': 'Buy groceries & fruits',
    'orbita_type': 'Task',
    'workspace': 'Personal',
    'is_urgent': True,
    'is_important': True,
    'tags': 'Personal, Home'
})
print(f"Created TASK: {task_item['ticket_key']} - {task_item['title']} (Priority: {task_item['priority']}, Quadrant: {task_item['priority_quadrant']})")

routine_item = post('http://localhost:5001/api/tasks', {
    'title': 'Electricity Bill Payment',
    'orbita_type': 'Routine',
    'workspace': 'Personal',
    'is_urgent': True,
    'is_important': True,
    'recurrence_type': 'Monthly',
    'recurrence_day': '5th',
    'tags': 'Finance'
})
print(f"Created ROUTINE: {routine_item['ticket_key']} - {routine_item['title']} (Repeats: {routine_item['recurrence_type']})")

goal_item = post('http://localhost:5001/api/tasks', {
    'title': 'Mastering Advanced React & Node.js',
    'orbita_type': 'Goal',
    'workspace': 'Work',
    'is_urgent': False,
    'is_important': True,
    'target_hours': 30,
    'tags': 'Engineering, Career'
})
print(f"Created GOAL: {goal_item['ticket_key']} - {goal_item['title']} (Target: {goal_item['target_hours']}h)")

project_item = post('http://localhost:5001/api/tasks', {
    'title': 'Orbita MERN Application',
    'orbita_type': 'Project',
    'workspace': 'Work',
    'is_urgent': True,
    'is_important': True,
    'tags': 'Engineering, MERN',
    'stages': [
        {
            'title': 'Stage 1: MongoDB & Backend',
            'tasks': [{'title': 'Mongoose Schemas'}, {'title': 'REST API Endpoints'}]
        },
        {
            'title': 'Stage 2: Frontend & UI',
            'tasks': [{'title': 'Vite React Views'}, {'title': 'QA Verification'}]
        }
    ]
})
print(f"Created PROJECT: {project_item['ticket_key']} - {project_item['title']} (Stages: {len(project_item['stages'])})")

# 4. Check Priority Matrix (Includes standalone items + stage tasks)
print("\n4. Checking Priority Matrix with stage tasks...")
matrix = get('http://localhost:5001/api/matrix')
print(f"Matrix Q1 Items: {len(matrix['Q1'])} (Items: {[t['title'] for t in matrix['Q1']]})")
print(f"Matrix Q2 Items: {len(matrix['Q2'])} (Items: {[t['title'] for t in matrix['Q2']]})")

# 5. Test Stage-Task Focus Timer
print("\n5. Testing Stage-Task Focus Timer...")
proj_detail = get(f"http://localhost:5001/api/tasks/{project_item['id']}")
s1_id = proj_detail['stages'][0]['_id']
t1_id = proj_detail['stages'][0]['tasks'][0]['_id']

t_start = post(f"http://localhost:5001/api/projects/{project_item['id']}/stages/{s1_id}/tasks/{t1_id}/timer/start", {'user_name': 'Varun VK'})
print("Stage Task Timer Started:", t_start)
time.sleep(2)
t_stop = post(f"http://localhost:5001/api/projects/{project_item['id']}/stages/{s1_id}/tasks/{t1_id}/timer/stop", {'user_name': 'Varun VK'})
print("Stage Task Timer Stopped:", t_stop)

# 6. Verify Timesheet in MongoDB
timesheets = get('http://localhost:5001/api/timesheets')
print("\n6. Timesheet records in MongoDB Atlas:", len(timesheets), "First Session:", timesheets[0]['task_title'], f"({timesheets[0]['duration_seconds']}s)")

# 7. Complete all stage tasks -> check project auto-completion
print("\n7. Completing all stage tasks in project...")
for st in proj_detail['stages']:
    for t in st['tasks']:
        put(f"http://localhost:5001/api/projects/{project_item['id']}/stages/{st['_id']}/tasks/{t['_id']}", {'is_completed': True, 'user_name': 'Varun VK'})

proj_completed = get(f"http://localhost:5001/api/tasks/{project_item['id']}")
print(f"PROJECT STATUS NOW: {proj_completed['title']} -> Status: {proj_completed['status']}, Progress: {proj_completed['progress_percentage']}%, CompletedAt: {proj_completed['completed_at']}")

# 8. Clean Reset for fresh user
print("\n8. Final Clean Reset in MongoDB Atlas...")
post('http://localhost:5001/api/system/reset', {})
print("Database cleanly reset in MongoDB Atlas (0 users, 0 items)!")
