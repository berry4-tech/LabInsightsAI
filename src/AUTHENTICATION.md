# 🔐 Authentication System

## Unified Sign-In Architecture

The application uses a **single sign-in page** that intelligently routes users based on their credentials.

---

## How It Works

### Single Entry Point
- **One sign-in page**: `/signin`
- **One sign-up page**: `/get-started`
- No separate admin login page

### Automatic Role Detection

When a user signs in, the system checks their credentials:

```typescript
if (email === 'admin1@gmail.com' && password === 'abc') {
  // Admin login
  setIsAdminAuthenticated(true);
  navigate('/admin/dashboard');
} else {
  // Regular user login
  setIsAuthenticated(true);
  navigate('/view-reports');
}
```

---

## Credentials

### 🔑 Admin Access

**Email**: `admin1@gmail.com`  
**Password**: `abc`

**Redirects to**: `/admin/dashboard`

**Features Access**:
- ✅ Admin Dashboard
- ✅ Manage Users
- ✅ Manage Reports
- ✅ Reference Range Editor (controls AI logic)

---

### 👤 User Access

**Email**: Any email (except `admin1@gmail.com`)  
**Password**: Any password

**Redirects to**: `/view-reports`

**Features Access**:
- ✅ View Reports
- ✅ Report Insights
- ✅ Trends Dashboard
- ✅ Upload Reports
- ✅ Profile Management
- ✅ Settings

---

## Sign-In Flow

### For Admin:

```
1. Navigate to /signin
2. Enter: admin1@gmail.com
3. Enter: abc
4. Click "Sign In"
5. → Automatically redirected to /admin/dashboard
```

### For Users:

```
1. Navigate to /signin
2. Enter: any email (e.g., user@example.com)
3. Enter: any password
4. Click "Sign In"
5. → Automatically redirected to /view-reports
```

---

## Sign-Up Flow

### Creating a New Account:

```
1. Navigate to /get-started
2. Fill in:
   - Full Name
   - Email
   - Password
   - Confirm Password
3. Check "I agree to Terms"
4. Click "Create Account"
5. → Automatically logged in as user
6. → Redirected to /view-reports
```

**Note**: Sign-up creates regular user accounts only. Admin account is static.

---

## Visual Indicators

### Sign-In Page Hint Box

The sign-in page displays a helpful hint:

```
┌─────────────────────────────────────┐
│ ℹ️ Admin Access: admin1@gmail.com  │
│    Password: abc                    │
│                                     │
│ Use any other email for user access │
└─────────────────────────────────────┘
```

This makes it clear how to access admin vs. user areas.

---

## Route Protection

### User Routes (Protected)

Requires `isAuthenticated = true`:
- `/profile`
- `/view-reports`
- `/upload-report`
- `/report-insights/:id`
- `/trends`
- `/settings`

### Admin Routes (Protected)

Requires `isAdminAuthenticated = true`:
- `/admin/dashboard`
- `/admin/users`
- `/admin/reports`
- `/admin/reference-ranges`

### Public Routes

No authentication required:
- `/` (Home)
- `/signin`
- `/get-started`

---

## Logout Behavior

### User Logout:
- Click "Sign Out" in navbar
- Redirects to home page
- `isAuthenticated` set to `false`

### Admin Logout:
- Click "Logout" in admin navbar
- Redirects to `/signin`
- `isAdminAuthenticated` set to `false`

---

## Code Implementation

### App.tsx State Management

```typescript
const [isAuthenticated, setIsAuthenticated] = useState(false);
const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);

const handleSignIn = () => {
  setIsAuthenticated(true);
};

const handleAdminSignIn = () => {
  setIsAdminAuthenticated(true);
};
```

### SignIn Component

```typescript
const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  
  if (email === 'admin1@gmail.com' && password === 'abc') {
    onAdminSignIn();
    navigate('/admin/dashboard');
  } else {
    onSignIn();
    navigate('/view-reports');
  }
};
```

---

## Benefits of This Approach

### ✅ Advantages:

1. **Simple UX**: Users don't need to know about separate admin portals
2. **Single Source of Truth**: One sign-in page to maintain
3. **Automatic Routing**: No manual selection needed
4. **Clear Documentation**: Easy to explain to users
5. **Demo-Friendly**: Static admin credentials make testing easy

### 🎯 User Experience:

- **Seamless**: No confusion about where to sign in
- **Intuitive**: System automatically knows your role
- **Transparent**: Hint box shows admin credentials
- **Flexible**: Easy to add more admin accounts in future

---

## Future Enhancements

### Phase 1 (Current):
- ✅ Static admin credentials
- ✅ Client-side role detection
- ✅ Automatic routing

### Phase 2 (With Backend):
- [ ] Database-stored users
- [ ] Role-based permissions
- [ ] Multiple admin accounts
- [ ] JWT authentication
- [ ] Session management

### Phase 3 (Advanced):
- [ ] Two-factor authentication
- [ ] OAuth integration
- [ ] Permission levels (Super Admin, Admin, Moderator)
- [ ] Audit logging
- [ ] Password reset via email

---

## Security Notes

### Current Implementation:

⚠️ **Demo Mode**: This is a client-side prototype
- Credentials are checked in frontend code
- No real authentication server
- No password hashing
- No session persistence

### For Production:

When integrating with a backend:

1. **Never store credentials in frontend**
2. **Use secure authentication service** (e.g., Supabase Auth, Firebase Auth)
3. **Hash passwords** with bcrypt
4. **Use JWT tokens** for session management
5. **Implement HTTPS** for all requests
6. **Add rate limiting** to prevent brute force
7. **Enable 2FA** for admin accounts

---

## Testing the System

### Test Admin Login:

```bash
# Open app
npm run dev

# Navigate to Sign In
# Enter: admin1@gmail.com
# Enter: abc
# → Should redirect to /admin/dashboard
```

### Test User Login:

```bash
# Open app
npm run dev

# Navigate to Sign In
# Enter: test@example.com
# Enter: password123
# → Should redirect to /view-reports
```

### Test Sign Up:

```bash
# Open app
npm run dev

# Navigate to Get Started
# Fill in form with any details
# → Should create user account
# → Should redirect to /view-reports
```

---

## Summary

**Authentication Type**: Unified single sign-in  
**Admin Account**: `admin1@gmail.com` / `abc` (static)  
**User Accounts**: Any email/password combination  
**Routing**: Automatic based on credentials  
**Security**: Demo mode (client-side only)  

**Status**: ✅ Fully functional for prototype/demo  
**Recommended for**: Development, testing, presentations  
**Not recommended for**: Production without backend integration  

---

**Built for simplicity and ease of testing!** 🚀
