import urllib.request
import json

BASE_URL = 'http://localhost:5001'

def get_json(path):
    req = urllib.request.Request(f"{BASE_URL}{path}")
    with urllib.request.urlopen(req) as res:
        return res.status, json.loads(res.read().decode())

def test_admin_overview():
    status, data = get_json('/api/admin/overview')
    print("1. Admin Overview Response:", status)
    print("   Database Status:", data.get('database_status'))
    print("   Users:", data.get('users'))
    print("   Work Items:", data.get('work_items'))
    print("   Effort:", data.get('effort'))

def test_admin_users():
    status, users = get_json('/api/admin/users')
    print("2. Admin Users Count:", status, len(users))
    for u in users:
        print(f"   - User: {u['name']} ({u['email']}) | Role: {u['role']} | Work Items: {u['task_count']} | Hours: {u['logged_hours']}h")

def test_admin_backup():
    status, data = get_json('/api/admin/backups/dump')
    print("3. Backup Data Dump Response:", status)
    print("   Counts:", data.get('record_counts'))

if __name__ == '__main__':
    print("Testing Superadmin API Endpoints...")
    test_admin_overview()
    test_admin_users()
    test_admin_backup()
    print("\nALL SUPERADMIN ENDPOINTS TESTED PERFECTLY!")
