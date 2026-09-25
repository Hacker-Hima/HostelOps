import http from 'http';

function request(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          const parsed = body ? JSON.parse(body) : null;
          resolve({ status: res.statusCode, headers: res.headers, body: parsed });
        } catch {
          resolve({ status: res.statusCode, headers: res.headers, raw: body });
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(typeof data === 'string' ? data : JSON.stringify(data));
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Starting HostelOps Backend Integration & Security Tests...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // 1. Health check
    console.log('1. Health Check Endpoint (/api/health)');
    const health = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/health',
      method: 'GET',
    });
    assert(health.status === 200, 'Health endpoint responds with 200 OK');
    assert(health.body.success === true, 'Success flag is true');
    assert(health.body.database && typeof health.body.database.connected === 'boolean', 'Database status structure is present');

    // 2. Auth: Super Admin Login
    console.log('\n2. Authentication: Super Admin Login');
    const adminLogin = await request(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      { username: 'superadmin', password: 'admin@123' }
    );
    assert(adminLogin.status === 200, 'Super Admin login status 200');
    assert(adminLogin.body.token && adminLogin.body.token.split('.').length === 3, 'Returns valid signed JWT format');
    assert(adminLogin.body.user.role === 'admin', 'Role is admin');
    assert(adminLogin.body.user.admin_type === 'superadmin', 'Admin type is superadmin');
    assert(!adminLogin.body.user.password, 'Password hash is NOT exposed');
    const adminToken = adminLogin.body.token;

    // 3. Auth: Student Login
    console.log('\n3. Authentication: Student Login');
    const studentLogin = await request(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      { username: 'student1', password: 'user@123' }
    );
    assert(studentLogin.status === 200, 'Student login status 200');
    assert(studentLogin.body.token && studentLogin.body.user.role === 'user', 'Returns token and role is user');
    const studentToken = studentLogin.body.token;

    // 4. Auth: Negative Test - Wrong Password & Unknown User
    console.log('\n4. Authentication: Invalid Credentials Rejection');
    const wrongPass = await request(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      { username: 'superadmin', password: 'wrongpassword' }
    );
    assert(wrongPass.status === 401, 'Wrong password correctly returns 401');

    const unknownUser = await request(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      { username: 'nonexistentuser999', password: 'anypassword' }
    );
    assert(unknownUser.status === 401, 'Unknown user correctly returns 401');

    // 5. Authorization: Role-based Permission Enforcement
    console.log('\n5. Authorization: Role-based Middleware Guards');
    const studentCreateAsset = await request(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/assets',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${studentToken}`,
        },
      },
      {
        tag: `TEST-AST-${Date.now()}`,
        name: 'Unauthorized Desk',
        category: 'Furniture',
      }
    );
    assert(studentCreateAsset.status === 403, 'Student cannot create assets (403 Forbidden)');

    const publicAdminCreate = await request(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/auth/users',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${studentToken}`,
        },
      },
      {
        username: 'hacker_admin',
        password: 'password123',
        role: 'admin',
      }
    );
    assert(publicAdminCreate.status === 403, 'Non-superadmin cannot create admin accounts (403 Forbidden)');

    // 6. User Registration: Forced role check
    console.log('\n6. User Registration: Public Self-Registration Security');
    const testUsername = `teststudent_${Date.now()}`;
    const studentReg = await request(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/auth/register',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      {
        username: testUsername,
        password: 'user@123',
        name: 'Test Student',
        email: `${testUsername}@example.edu`,
        role: 'admin', // attempting privilege escalation
        admin_type: 'superadmin',
      }
    );
    assert(studentReg.status === 201, 'Student self-registration creates user');
    assert(studentReg.body.user.role === 'user', 'Privilege escalation blocked: role forced to user');
    assert(!studentReg.body.user.admin_type, 'Privilege escalation blocked: admin_type stripped');

    // 7. Profile Update
    console.log('\n7. User Profile Persistence: PATCH /api/auth/profile');
    const profileUpdate = await request(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/auth/profile',
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${studentToken}`,
        },
      },
      {
        phone: '+91 99999 88888',
        room: '302',
        role: 'admin', // attempt escalation in profile update
      }
    );
    assert(profileUpdate.status === 200, 'Profile updated successfully');
    assert(profileUpdate.body.user.phone === '+91 99999 88888', 'Phone was updated');
    assert(profileUpdate.body.user.role === 'user', 'Role modification in profile update blocked');

    // 8. Asset Lifecycle & Transfer Bug Verification
    console.log('\n8. Asset Lifecycle & Transfer Bug Fix Verification');
    const testTag = `TEST-AST-${Date.now()}`;
    const newAsset = await request(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/assets',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
      },
      {
        tag: testTag,
        name: 'Lifecycle Test Chair',
        category: 'Furniture',
        block: 'Block A',
        floor: 'Floor 1',
        room: 'Central Store',
        purchaseCost: 2500,
        depreciationRate: 10,
        condition: 'Good',
        status: 'In Store',
      }
    );
    assert(newAsset.status === 201, 'Admin created test asset');

    // Allocate asset
    const allocate = await request(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/assets/allocate',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
      },
      {
        tag: testTag,
        block: 'Block B',
        floor: 'Floor 2',
        room: '204',
        studentRoll: '21CS204',
        studentName: 'Himachalam',
      }
    );
    assert(allocate.status === 200, 'Asset allocated to student in Room 204');
    assert(allocate.body.asset.status === 'Assigned', 'Status updated to Assigned');

    // Transfer asset & verify Transfer History Bug Fix
    const transfer = await request(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/assets/transfer',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
      },
      {
        tag: testTag,
        toBlock: 'Block C',
        toFloor: 'Floor 3',
        toRoom: '305',
        toStudentRoll: '23ME305',
        toStudentName: 'Devansh Chouhan',
        reason: 'Room relocation',
      }
    );
    assert(transfer.status === 200, 'Asset transferred to Room 305');
    assert(transfer.body.transfer.from_location.includes('204'), 'BUG FIX: from_location recorded original Room 204');
    assert(transfer.body.transfer.from_student === 'Himachalam', 'BUG FIX: from_student recorded original student Himachalam');
    assert(transfer.body.transfer.to_location.includes('305'), 'to_location recorded new Room 305');
    assert(transfer.body.transfer.to_student === 'Devansh Chouhan', 'to_student recorded new student Devansh');

    // Return asset
    const returnAsset = await request(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/assets/return',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
      },
      {
        tag: testTag,
        inspectedCondition: 'Good',
        remarks: 'Returned in good shape',
      }
    );
    assert(returnAsset.status === 200, 'Asset returned to Central Store');
    assert(returnAsset.body.asset.status === 'In Store', 'Asset status is now In Store');

    // Dispose asset
    const dispose = await request(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/assets/disposal',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
      },
      {
        assetTag: testTag,
        salvageValue: 350,
        disposalReason: 'Beyond Economical Repair',
        disposalMethod: 'Certified E-Waste Scrap',
      }
    );
    assert(dispose.status === 201, 'Asset disposed successfully');

    // Attempting to allocate or transfer a disposed asset must fail
    const reallocateDisposed = await request(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/assets/allocate',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
      },
      {
        tag: testTag,
        block: 'Block A',
        floor: 'Floor 1',
        room: '101',
      }
    );
    assert(reallocateDisposed.status === 400, 'State Guard: Cannot allocate disposed asset (400 Bad Request)');

    // 9. Notifications: isRead CamelCase consistency
    console.log('\n9. Notifications API: isRead Field Consistency');
    const notifs = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/notifications',
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(notifs.status === 200, 'Notifications endpoint returns 200');
    assert(Array.isArray(notifs.body) && notifs.body.length > 0, 'Notifications list is populated');
    assert(typeof notifs.body[0].isRead === 'boolean', 'isRead property is boolean in camelCase');

    // 10. Dynamic Real DB Analytics
    console.log('\n10. Real Database Analytics (/api/analytics)');
    const analytics = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/analytics',
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(analytics.status === 200, 'Analytics endpoint returns 200');
    assert(analytics.body.metrics && typeof analytics.body.metrics.totalAssets === 'number', 'Metrics computed from MongoDB');
    assert(analytics.body.categoryBreakdown && Array.isArray(analytics.body.categoryBreakdown), 'Category breakdown aggregated');
    assert(analytics.body.blockBreakdown && Array.isArray(analytics.body.blockBreakdown), 'Block distribution aggregated');

    console.log(`\n========================================`);
    console.log(`Tests Completed: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);
    console.log(`========================================\n`);

    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  }
}

runTests();
