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

# 1. Reset Database
print("1. Wiping DB...")
res_reset = post('http://localhost:5001/api/system/reset', {})
print("Reset result:", res_reset)

# 2. Register
print("\n2. Registering User...")
reg = post('http://localhost:5001/api/auth/register', {
    'name': 'Varun VK',
    'email': 'varun@orbita.com',
    'password': 'password123',
    'role': 'Admin'
})
print("User registered:", reg['user']['name'], reg['user']['email'])

# 3. Create 4 Types
print("\n3. Creating 4 Core Types...")
# Type 1: TASK (Single Action)
task_item = post('http://localhost:5001/api/tasks', {
    'title': 'Buy groceries & fruits',
    'orbita_type': 'Task',
    'workspace': 'Personal',
    'is_urgent': 1,
    'is_important': 1,
    'tags': 'Personal, Home'
})
print(f"Created TASK: {task_item['ticket_key']} - {task_item['title']} (Timer: {task_item['is_timer_allowed']})")

# Type 2: ROUTINE (Recurring)
routine_item = post('http://localhost:5001/api/tasks', {
    'title': 'Electricity & Internet Bill Payment',
    'orbita_type': 'Routine',
    'workspace': 'Personal',
    'is_urgent': 1,
    'is_important': 1,
    'recurrence_type': 'Monthly',
    'recurrence_day': '5th',
    'tags': 'Finance, Utilities'
})
print(f"Created ROUTINE: {routine_item['ticket_key']} - {routine_item['title']} (Repeats: {routine_item['recurrence_type']})")

# Type 3: GOAL (Focus Effort)
goal_item = post('http://localhost:5001/api/tasks', {
    'title': 'Learning JavaScript & Advanced React',
    'orbita_type': 'Goal',
    'workspace': 'Work',
    'is_urgent': 0,
    'is_important': 1,
    'target_hours': 25,
    'tags': 'Engineering, Career'
})
print(f"Created GOAL: {goal_item['ticket_key']} - {goal_item['title']} (Target: {goal_item['target_hours']}h, Timer: {goal_item['is_timer_allowed']})")

# Type 4: PROJECT (Multi-Stage Delivery)
project_item = post('http://localhost:5001/api/tasks', {
    'title': 'Build MERN Work Management App',
    'orbita_type': 'Project',
    'workspace': 'Work',
    'is_urgent': 1,
    'is_important': 1,
    'tags': 'Engineering, MERN',
    'stages': [
        {
            'title': 'Stage 1: Architecture & Backend',
            'tasks': [{'title': 'Database Schema Design'}, {'title': 'REST API Endpoints'}]
        },
        {
            'title': 'Stage 2: Frontend & Polish',
            'tasks': [{'title': 'Vite React UI'}, {'title': 'End-to-End QA Testing'}]
        }
    ]
})
print(f"Created PROJECT: {project_item['ticket_key']} - {project_item['title']} (Timer: {project_item['is_timer_allowed']})")

# 4. Fetch Project details with stages
proj_detail = get(f"http://localhost:5001/api/tasks/{project_item['id']}")
print("\n4. Project Stages & Tasks Hierarchy:")
for st in proj_detail.get('stages', []):
    print(f"  - Stage: {st['title']} (is_completed: {st['is_completed']})")
    for t in st.get('tasks', []):
        print(f"     * Task: {t['title']} (done: {t['is_completed']})")

# 5. Test Focus Timer on Goal
print("\n5. Testing Focus Timer on Goal...")
start_res = post(f"http://localhost:5001/api/tasks/{goal_item['id']}/timer/start", {'user_name': 'Varun VK'})
print("Timer Started:", start_res)
time.sleep(2)
stop_res = post(f"http://localhost:5001/api/tasks/{goal_item['id']}/timer/stop", {'user_name': 'Varun VK', 'notes': 'JS Mastery Session'})
print("Timer Stopped:", stop_res)

# 6. Test Completing Stage Tasks in Project
print("\n6. Completing Stage 1 Task 1 in Project...")
first_task_id = proj_detail['stages'][0]['tasks'][0]['id']
put(f"http://localhost:5001/api/stage-tasks/{first_task_id}", {'is_completed': True, 'user_name': 'Varun VK'})
proj_after = get(f"http://localhost:5001/api/tasks/{project_item['id']}")
print(f"Project progress now: {proj_after.get('progress_percentage', 0)}% ({proj_after.get('completed_tasks', 0)}/{proj_after.get('total_tasks', 0)} tasks done)")

# 7. Check Dashboard Stats
print("\n7. Checking Dashboard Stats...")
stats = get('http://localhost:5001/api/dashboard/stats')
print("Dashboard Stats:", json.dumps(stats, indent=2))

# 8. Check Priority Matrix
print("\n8. Checking Priority Matrix...")
matrix = get('http://localhost:5001/api/matrix')
print("Matrix Q1 Items:", len(matrix['Q1']), "Q2 Items:", len(matrix['Q2']))
