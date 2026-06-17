# 🔐 Authentication Flow Diagram

## Visual Guide to Unified Authentication

---

## 📊 Flow Chart

```
                    START
                      |
                      v
              ┌───────────────┐
              │   Home Page   │
              │      (/)      │
              └───────────────┘
                      |
         ┌────────────┴────────────┐
         │                         │
         v                         v
    ┌─────────┐              ┌──────────┐
    │Sign Up  │              │ Sign In  │
    │(/get-   │              │(/signin) │
    │started) │              │          │
    └─────────┘              └──────────┘
         │                         │
         │                         │
         │              ┌──────────┴──────────┐
         │              │                     │
         │              v                     v
         │      ┌──────────────┐      ┌──────────────┐
         │      │  Admin Creds?│      │  User Creds? │
         │      │admin1@...abc │      │  any email   │
         │      └──────────────┘      └──────────────┘
         │              │                     │
         │              │                     │
         └──────────────┴─────────────────────┘
                        │
              ┌─────────┴─────────┐
              │                   │
              v                   v
      ┌──────────────┐    ┌──────────────┐
      │Admin Portal  │    │User Dashboard│
      │  /admin/     │    │ /view-reports│
      │  dashboard   │    │              │
      └──────────────┘    └──────────────┘
              │                   │
              v                   v
      ┌──────────────┐    ┌──────────────┐
      │Admin Features│    │User Features │
      │- Dashboard   │    │- Reports     │
      │- Users       │    │- Trends      │
      │- Reports     │    │- Profile     │
      │- Ref Ranges  │    │- Settings    │
      └──────────────┘    └──────────────┘
```

---

## 🔀 Decision Tree

```
User visits /signin
       |
       v
   [Enter Credentials]
       |
       v
   email === 'admin1@gmail.com'
   AND
   password === 'abc'
       |
   ┌───┴───┐
   │       │
  YES     NO
   │       │
   v       v
ADMIN    USER
   │       │
   v       v
/admin/  /view-
dashboard reports
```

---

## 🎯 User Journey Maps

### Journey 1: Regular User Sign Up

```
Step 1: Home Page
  ↓
Step 2: Click "Get Started"
  ↓
Step 3: Fill Registration Form
  - Full Name
  - Email
  - Password
  - Confirm Password
  ↓
Step 4: Click "Create Account"
  ↓
Step 5: AUTO → Logged in as User
  ↓
Step 6: AUTO → Redirect to /view-reports
  ↓
Step 7: View Reports Dashboard
```

### Journey 2: Regular User Sign In

```
Step 1: Home Page
  ↓
Step 2: Click "Sign In"
  ↓
Step 3: Enter Credentials
  - Email: user@example.com
  - Password: anything
  ↓
Step 4: Click "Sign In"
  ↓
Step 5: System checks: NOT admin
  ↓
Step 6: AUTO → Logged in as User
  ↓
Step 7: AUTO → Redirect to /view-reports
  ↓
Step 8: View Reports Dashboard
```

### Journey 3: Admin Sign In

```
Step 1: Home Page
  ↓
Step 2: Click "Sign In"
  ↓
Step 3: See Hint Box
  "Admin Access: admin1@gmail.com / abc"
  ↓
Step 4: Enter Admin Credentials
  - Email: admin1@gmail.com
  - Password: abc
  ↓
Step 5: Click "Sign In"
  ↓
Step 6: System checks: IS admin ✓
  ↓
Step 7: AUTO → Logged in as Admin
  ↓
Step 8: AUTO → Redirect to /admin/dashboard
  ↓
Step 9: Admin Dashboard
```

---

## 🔐 Authentication States

### State 1: Anonymous (Not Logged In)

```
┌────────────────────────────────┐
│ State: Anonymous               │
├────────────────────────────────┤
│ isAuthenticated: false         │
│ isAdminAuthenticated: false    │
├────────────────────────────────┤
│ Can Access:                    │
│ ✅ /                          │
│ ✅ /signin                    │
│ ✅ /get-started               │
├────────────────────────────────┤
│ Cannot Access:                 │
│ ❌ /profile                   │
│ ❌ /view-reports              │
│ ❌ /admin/dashboard           │
│ (Redirects to /signin)        │
└────────────────────────────────┘
```

### State 2: User (Logged In)

```
┌────────────────────────────────┐
│ State: User                    │
├────────────────────────────────┤
│ isAuthenticated: true          │
│ isAdminAuthenticated: false    │
├────────────────────────────────┤
│ Can Access:                    │
│ ✅ /                          │
│ ✅ /profile                   │
│ ✅ /view-reports              │
│ ✅ /upload-report             │
│ ✅ /report-insights/:id       │
│ ✅ /trends                    │
│ ✅ /settings                  │
├────────────────────────────────┤
│ Cannot Access:                 │
│ ❌ /admin/*                   │
│ (Redirects to /signin)        │
└────────────────────────────────┘
```

### State 3: Admin (Logged In)

```
┌────────────────────────────────┐
│ State: Admin                   │
├────────────────────────────────┤
│ isAuthenticated: false         │
│ isAdminAuthenticated: true     │
├────────────────────────────────┤
│ Can Access:                    │
│ ✅ /                          │
│ ✅ /admin/dashboard           │
│ ✅ /admin/users               │
│ ✅ /admin/reports             │
│ ✅ /admin/reference-ranges    │
├────────────────────────────────┤
│ Cannot Access:                 │
│ ❌ /view-reports              │
│ ❌ /profile                   │
│ (Redirects to /signin)        │
│                                │
│ Note: Admin cannot access      │
│ regular user pages without     │
│ logging in as user separately  │
└────────────────────────────────┘
```

---

## 📝 Sign-In Page States

### Initial State

```
┌─────────────────────────────────────┐
│        Welcome Back                 │
│   Sign in to your account           │
├─────────────────────────────────────┤
│ ℹ️ Admin Access:                   │
│    admin1@gmail.com / abc           │
│    Use any other email for user     │
├─────────────────────────────────────┤
│ Email Address                       │
│ [ you@example.com               ]   │
│                                     │
│ Password                            │
│ [ ••••••••••                    ]   │
│                                     │
│ ☐ Remember me  Forgot password?     │
│                                     │
│ [        Sign In                ]   │
├─────────────────────────────────────┤
│     Or continue with                │
│                                     │
│  [ 🔵 Google ]  [ ⚫ GitHub ]       │
├─────────────────────────────────────┤
│ Don't have an account? Sign up      │
└─────────────────────────────────────┘
```

### Filled - Admin Credentials

```
┌─────────────────────────────────────┐
│        Welcome Back                 │
│   Sign in to your account           │
├─────────────────────────────────────┤
│ ℹ️ Admin Access:                   │
│    admin1@gmail.com / abc           │
│    Use any other email for user     │
├─────────────────────────────────────┤
│ Email Address                       │
│ [ admin1@gmail.com              ]✓  │
│                                     │
│ Password                            │
│ [ •••                           ]✓  │
│                                     │
│ ☑ Remember me  Forgot password?     │
│                                     │
│ [        Sign In                ]   │
│        ↓ Click this                 │
│        ↓                            │
│   AUTO REDIRECT TO:                 │
│   /admin/dashboard                  │
└─────────────────────────────────────┘
```

### Filled - User Credentials

```
┌─────────────────────────────────────┐
│        Welcome Back                 │
│   Sign in to your account           │
├─────────────────────────────────────┤
│ ℹ️ Admin Access:                   │
│    admin1@gmail.com / abc           │
│    Use any other email for user     │
├─────────────────────────────────────┤
│ Email Address                       │
│ [ user@example.com              ]✓  │
│                                     │
│ Password                            │
│ [ ••••••••••                    ]✓  │
│                                     │
│ ☐ Remember me  Forgot password?     │
│                                     │
│ [        Sign In                ]   │
│        ↓ Click this                 │
│        ↓                            │
│   AUTO REDIRECT TO:                 │
│   /view-reports                     │
└─────────────────────────────────────┘
```

---

## 🔄 State Transitions

### Transition 1: Anonymous → User

```
Before:
  isAuthenticated = false
  isAdminAuthenticated = false

Action:
  User signs in with regular credentials

After:
  isAuthenticated = true
  isAdminAuthenticated = false

Result:
  Can access user pages
  Cannot access admin pages
```

### Transition 2: Anonymous → Admin

```
Before:
  isAuthenticated = false
  isAdminAuthenticated = false

Action:
  User signs in with admin credentials
  (admin1@gmail.com / abc)

After:
  isAuthenticated = false
  isAdminAuthenticated = true

Result:
  Can access admin pages
  Cannot access user pages
```

### Transition 3: User → Anonymous

```
Before:
  isAuthenticated = true
  isAdminAuthenticated = false

Action:
  User clicks "Sign Out"

After:
  isAuthenticated = false
  isAdminAuthenticated = false

Result:
  Redirected to home page
  Cannot access protected pages
```

### Transition 4: Admin → Anonymous

```
Before:
  isAuthenticated = false
  isAdminAuthenticated = true

Action:
  Admin clicks "Logout"

After:
  isAuthenticated = false
  isAdminAuthenticated = false

Result:
  Redirected to /signin
  Cannot access protected pages
```

---

## 🎨 Visual Components

### Sign-In Button Behavior

```
┌─────────────────────────┐
│    [ Sign In ]          │
│         ↓               │
│    onClick handler      │
│         ↓               │
│   Check credentials     │
│         ↓               │
│  ┌──────┴──────┐       │
│  │             │       │
│ Admin?       User?     │
│  │             │       │
│  ↓             ↓       │
│ Admin      User        │
│ Portal   Dashboard     │
└─────────────────────────┘
```

### Hint Box Component

```
┌─────────────────────────────────┐
│ 🔵 Info Box                     │
├─────────────────────────────────┤
│ Admin Access:                   │
│ admin1@gmail.com / abc          │
│                                 │
│ Use any other email for user    │
│ access                          │
└─────────────────────────────────┘

Props:
  - bg-blue-50
  - border-blue-200
  - text-blue-800
  - Always visible on sign-in page
```

---

## 🧪 Testing Scenarios

### Test 1: Admin Login

```
Input:
  Email: admin1@gmail.com
  Password: abc

Expected Flow:
  1. Form submission
  2. Credential check ✓
  3. Match admin credentials ✓
  4. Call onAdminSignIn()
  5. Set isAdminAuthenticated = true
  6. Navigate to /admin/dashboard
  7. Admin navbar visible
  8. Admin features accessible

Result: ✅ PASS
```

### Test 2: User Login

```
Input:
  Email: test@example.com
  Password: password123

Expected Flow:
  1. Form submission
  2. Credential check ✓
  3. Not admin credentials ✓
  4. Call onSignIn()
  5. Set isAuthenticated = true
  6. Navigate to /view-reports
  7. User navbar visible
  8. User features accessible

Result: ✅ PASS
```

### Test 3: Wrong Admin Password

```
Input:
  Email: admin1@gmail.com
  Password: wrong

Expected Flow:
  1. Form submission
  2. Credential check ✗
  3. Not exact match
  4. Treated as regular user
  5. Call onSignIn()
  6. Navigate to /view-reports

Result: ✅ PASS (By design)
```

---

## 📋 Summary

**Entry Points:**
- `/` → Home
- `/signin` → Sign In (unified)
- `/get-started` → Sign Up

**Authentication Logic:**
- Static admin check
- Automatic role detection
- Smart routing

**User States:**
- Anonymous (no access)
- User (user features)
- Admin (admin features)

**Key Feature:**
- One sign-in page
- Auto-detects role
- Routes accordingly

---

**Simple, intuitive, and easy to test! ✨**
