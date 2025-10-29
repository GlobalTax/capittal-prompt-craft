# Security Testing Guide

This document provides comprehensive testing procedures for all security features implemented in the Capittal Valoraciones application.

## Table of Contents

1. [RLS Policy Testing](#rls-policy-testing)
2. [MFA Security Testing](#mfa-security-testing)
3. [Edge Function Validation Testing](#edge-function-validation-testing)
4. [Rate Limiting Testing](#rate-limiting-testing)
5. [Session Security Testing](#session-security-testing)
6. [Penetration Testing Scenarios](#penetration-testing-scenarios)

---

## RLS Policy Testing

### 1. Test RLS Infinite Recursion Fix

```sql
-- This should NOT cause infinite recursion
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "test-user-id"}';

-- Test global_admins table
SELECT * FROM global_admins LIMIT 1;

-- Test document_permissions table
SELECT * FROM document_permissions LIMIT 1;

-- Verify SECURITY DEFINER functions exist
SELECT proname, prosecdef 
FROM pg_proc 
WHERE proname IN (
  'is_global_admin_secure', 
  'can_manage_document_permissions_secure',
  'can_view_document_permissions_secure'
);
```

**Expected Result**: No errors, queries complete in <100ms.

### 2. Test Commission Tables RLS

```sql
-- As regular user, should only see own commissions
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "user-1-id"}';

SELECT * FROM commission_calculations; -- Should only return user-1 data
SELECT * FROM commission_escrow WHERE employee_id != 'user-1-id'; -- Should return 0 rows

-- As admin, should see all
SET LOCAL request.jwt.claims TO '{"sub": "admin-user-id"}';
SELECT COUNT(*) FROM commission_calculations; -- Should return all rows
```

**Expected Result**: Users see only their own data, admins see all.

### 3. Test Team Members RLS

```sql
-- User should only see team members in their organization
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "user-in-org-1"}';

SELECT organization_id, COUNT(*) 
FROM team_members 
GROUP BY organization_id;
-- Should only show org-1 data

-- Try to access another organization's data
SELECT * FROM team_members WHERE organization_id = 'org-2-id';
-- Should return 0 rows
```

**Expected Result**: Org-scoped access enforced.

### 4. Test All 13 New RLS Tables

```sql
-- Verify RLS is enabled on all tables
SELECT 
  schemaname,
  tablename,
  rowsecurity,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = t.tablename) as policy_count
FROM pg_tables t
WHERE schemaname = 'public'
AND tablename IN (
  'commission_calculations',
  'commission_escrow',
  'team_members',
  'system_notifications',
  'pending_invitations',
  'security_logs',
  'user_verification_status',
  'automation_rules',
  'alert_rules',
  'proposals',
  'calendar_integrations',
  'booking_links',
  'availability_patterns'
)
ORDER BY tablename;
```

**Expected Result**: All 13 tables have `rowsecurity = true` and `policy_count > 0`.

---

## MFA Security Testing

### 1. Test Server-Side Secret Generation

**Manual Test Steps:**

1. Open DevTools → Network tab
2. Navigate to Security Settings
3. Click "Activar MFA"
4. **Verify in Network tab:**
   - `mfa-generate-secret` request is called
   - Response contains `qr_code_url` and `factor_id`
   - Response does NOT contain `secret` field
   - No secret visible in any request/response

**Expected Result**: ✅ Secret NEVER appears in client-side code or network traffic.

### 2. Test MFA Verification Flow

**Manual Test Steps:**

1. Generate MFA secret (from previous test)
2. Scan QR code with authenticator app
3. Enter 6-digit code
4. **Verify:**
   - `mfa-verify` request sends only `factor_id` and `token`
   - Response contains `valid: true` and `backup_codes`
   - Database shows `is_verified: true` and `verified_at` timestamp

**SQL Verification:**

```sql
SELECT 
  id,
  user_id,
  factor_type,
  is_verified,
  verified_at,
  LENGTH(secret) as secret_length -- Should be >0 but NOT visible to client
FROM user_mfa_factors
WHERE user_id = 'test-user-id';
```

**Expected Result**: Factor marked as verified, secret stored server-side only.

### 3. Test MFA Rate Limiting

**Manual Test Steps:**

1. Generate MFA factor
2. Enter WRONG code 5 times in a row
3. **Verify:**
   - After 5th attempt, toast shows "Demasiados intentos fallidos"
   - 6th attempt is blocked
   - Wait 15 minutes or manually reset counter
   - Can attempt again after reset

**Check Logs:**

```bash
# View MFA rate limit logs
supabase functions logs mfa-verify --tail
```

**Expected Result**: Rate limit triggers after 5 failed attempts, blocks for 15 minutes.

---

## Edge Function Validation Testing

### 1. Test admin-delete-user Validation

```bash
# Test with invalid UUID
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/admin-delete-user \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"user_id": "not-a-uuid"}'

# Expected: 400 Bad Request with "ID de usuario inválido"

# Test with missing user_id
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/admin-delete-user \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'

# Expected: 400 Bad Request with validation error
```

### 2. Test send-user-invitation Validation

```bash
# Test with invalid email
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/send-user-invitation \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"email": "not-an-email", "role": "admin"}'

# Expected: 400 Bad Request with "Email inválido"

# Test with invalid role
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/send-user-invitation \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "role": "hacker"}'

# Expected: 400 Bad Request with "Rol inválido"
```

### 3. Test link-invitation Validation

```bash
# Test with invalid token format
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/link-invitation \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"token": "12345"}'

# Expected: 400 Bad Request with "Token de invitación inválido"
```

### 4. Test security-alerts Validation

```bash
# Test with invalid severity
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/security-alerts \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "event_id": "550e8400-e29b-41d4-a716-446655440000",
    "event_type": "test_alert",
    "severity": "super_critical",
    "description": "Test alert",
    "created_at": "2025-01-29T10:00:00Z"
  }'

# Expected: 400 Bad Request with "Severidad inválida"
```

---

## Rate Limiting Testing

### 1. Test MFA Rate Limiting

**Automated Test Script:**

```typescript
// test-mfa-rate-limit.ts
import { supabase } from './supabase-client';

async function testMFARateLimit() {
  const factorId = 'test-factor-id';
  
  console.log('Testing MFA rate limit (5 attempts per 15 min)...');
  
  for (let i = 1; i <= 6; i++) {
    const { data, error } = await supabase.functions.invoke('mfa-verify', {
      body: {
        factor_id: factorId,
        token: '000000' // Wrong code
      }
    });
    
    console.log(`Attempt ${i}:`, data?.valid ? 'Valid' : 'Invalid');
    
    if (i === 6 && !error) {
      console.error('❌ FAIL: 6th attempt should be blocked!');
    } else if (i === 6 && error) {
      console.log('✅ PASS: Rate limit triggered on 6th attempt');
    }
  }
}

testMFARateLimit();
```

### 2. Test Admin Invitation Rate Limiting

**Manual Test:**

1. Login as admin (not superadmin)
2. Send 10 invitations rapidly
3. Try to send 11th invitation
4. **Verify:** 11th attempt is blocked with "Demasiadas invitaciones"

**SQL Check:**

```sql
SELECT * FROM rate_limit_tracking
WHERE identifier = 'admin-user-id'
AND action_type = 'send_invitation'
ORDER BY window_start DESC
LIMIT 1;
```

---

## Session Security Testing

### 1. Test Device Fingerprinting

**Manual Test Steps:**

1. Login on Device A (e.g., Chrome on Windows)
2. Copy session token
3. Use token on Device B (e.g., Firefox on Mac) with different:
   - User-Agent
   - Screen resolution
   - Timezone
4. **Verify:**
   - Toast warning appears: "Actividad inusual detectada"
   - Security log created with `suspicious_session_detected`

**SQL Verification:**

```sql
SELECT * FROM security_logs
WHERE event_type = 'suspicious_session_detected'
AND user_id = 'test-user-id'
ORDER BY created_at DESC
LIMIT 1;
```

### 2. Test IP Change Detection

**Manual Test Steps:**

1. Login from IP A
2. Use VPN to change to IP B (different country)
3. Refresh page
4. **Verify:**
   - Toast warning appears
   - `detect_suspicious_ip_change` RPC returns `suspicious: true`

**SQL Check:**

```sql
SELECT 
  user_id,
  ip_address,
  last_activity,
  device_fingerprint
FROM user_sessions
WHERE user_id = 'test-user-id'
ORDER BY last_activity DESC;
```

### 3. Test Session Revocation

**Manual Test Steps:**

1. Login on 2 devices
2. Go to Security Settings → Active Sessions
3. Click "Revoke" on one session
4. **Verify:**
   - Session marked as `is_active: false`
   - User is logged out on that device

---

## Penetration Testing Scenarios

### Scenario 1: SQL Injection Attempt

**Test:**

```bash
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/admin-delete-user \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"user_id": "1; DROP TABLE users; --"}'
```

**Expected Result**: Zod validation rejects input, returns 400 error.

### Scenario 2: XSS Attempt in Invitation Email

**Test:**

```bash
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/send-user-invitation \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "role": "admin",
    "message": "<script>alert(\"XSS\")</script>"
  }'
```

**Expected Result**: HTML escaped, email renders `&lt;script&gt;` as plain text.

### Scenario 3: Brute Force MFA

**Test:**

```python
# brute-force-mfa.py
import requests

for i in range(100):
    response = requests.post(
        'https://YOUR_PROJECT.supabase.co/functions/v1/mfa-verify',
        json={'factor_id': 'valid-factor-id', 'token': f'{i:06d}'},
        headers={'Authorization': 'Bearer YOUR_TOKEN'}
    )
    print(f'Attempt {i}: {response.status_code}')
    
    if response.status_code == 429:
        print('✅ PASS: Rate limit triggered')
        break
```

**Expected Result**: Rate limit triggers after 5 attempts, blocks further attempts.

### Scenario 4: Unauthorized RLS Bypass

**Test:**

```sql
-- Try to access another user's data
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "user-1-id"}';

-- This should return 0 rows
SELECT * FROM commission_escrow WHERE employee_id = 'user-2-id';

-- This should fail
INSERT INTO commission_escrow (employee_id, amount) 
VALUES ('user-2-id', 1000);
```

**Expected Result**: RLS blocks unauthorized access, returns 0 rows or error.

---

## Automated Security Test Suite

### Run All Tests

```bash
# Install dependencies
npm install -D @playwright/test

# Run security test suite
npm run test:security

# View test report
npm run test:security:report
```

### CI/CD Integration

Add to `.github/workflows/security-tests.yml`:

```yaml
name: Security Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  security-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test:security
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: security-test-results
          path: test-results/
```

---

## Security Metrics Dashboard

### Key Metrics to Monitor

1. **RLS Coverage**: 100% (47/47 tables)
2. **Edge Function Validation**: 100% (5/5 functions)
3. **MFA Adoption Rate**: Track via `SELECT COUNT(*) FROM user_mfa_factors WHERE is_verified = true`
4. **Failed Login Attempts**: Monitor `security_logs` for `failed_login` events
5. **Rate Limit Triggers**: Count rate limit 429 responses per day
6. **Suspicious Sessions**: Monitor `suspicious_session_detected` events

### Alerting Thresholds

- **Critical**: >10 failed MFA attempts from same IP in 1 hour
- **High**: >5 suspicious session detections per day
- **Medium**: >100 rate limit triggers per day
- **Low**: Any SQL injection attempt (should be 0)

---

## Manual Checklist for Security Audits

- [ ] All RLS policies tested with SQL queries
- [ ] MFA secret never exposed in client-side code
- [ ] Edge functions validate all inputs with Zod
- [ ] Rate limiting tested on all critical endpoints
- [ ] Session security tested with device fingerprinting
- [ ] SQL injection attempts blocked
- [ ] XSS attempts sanitized
- [ ] CSRF tokens validated
- [ ] All edge function logs reviewed
- [ ] Security metrics dashboard configured
- [ ] Penetration testing report reviewed
- [ ] All findings documented and addressed

---

## Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Supabase Security Best Practices](https://supabase.com/docs/guides/auth/security)
- [Zod Documentation](https://zod.dev/)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)

---

**Last Updated**: 2025-01-29  
**Reviewed By**: Development Team  
**Next Review**: 2025-04-29 (Quarterly)
