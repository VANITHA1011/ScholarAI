from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

print("--- Testing Admin Endpoints ---")
# 1. Admin Login
admin_login = client.post('/api/v1/auth/login', json={'email': 'admin@scholarship.com', 'password': 'Admin@123'})
print('1. Admin Login Status:', admin_login.status_code)
assert admin_login.status_code == 200
admin_data = admin_login.json()
print('   Admin User:', admin_data.get('user'))
admin_token = admin_data['access_token']
admin_headers = {'Authorization': f'Bearer {admin_token}'}

# 2. Get Admin Stats
stats = client.get('/api/v1/admin/stats', headers=admin_headers)
print('2. Admin Stats:', stats.status_code, stats.json())
assert stats.status_code == 200

# 3. Get Applications List
apps = client.get('/api/v1/admin/applications', headers=admin_headers)
print('3. Admin Applications List:', apps.status_code, f'Count: {len(apps.json())}')
assert apps.status_code == 200

if len(apps.json()) > 0:
    first_app = apps.json()[0]
    app_id = first_app['id']
    student_name = first_app['student']['fullName']
    sch_name = first_app['scholarship']['scholarship_name']
    app_status = first_app['status']
    print(f'   App #{app_id}: Student={student_name}, Scholarship={sch_name}, Status={app_status}')

    # 4. Get Application Detail
    detail = client.get(f'/api/v1/admin/applications/{app_id}', headers=admin_headers)
    print('4. Application Detail Status:', detail.status_code)
    assert detail.status_code == 200

    # 5. Update Status
    status_update = client.put(
        f'/api/v1/admin/applications/{app_id}/status',
        headers=admin_headers,
        json={'status': 'Approved', 'admin_notes': 'Document verified and approved by scholarship admin'}
    )
    print('5. Status Update Response:', status_update.status_code, status_update.json())
    assert status_update.status_code == 200

    # 6. Verify Updated Status
    verify_detail = client.get(f'/api/v1/admin/applications/{app_id}', headers=admin_headers)
    print('6. Verified New Status:', verify_detail.json()['status'])
    assert verify_detail.json()['status'] == 'Approved'

# 7. Get Students List
students = client.get('/api/v1/admin/students', headers=admin_headers)
print('7. Admin Students Count:', len(students.json()))
assert students.status_code == 200

print("\nALL ADMIN TESTS PASSED SUCCESSFULLY!")
