# 🚀 Quick Start Guide

## Getting the App Running

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Start Development Server
```bash
npm run dev
```

### Step 3: Open in Browser
The app will automatically open at `http://localhost:5173`

---

## 🎯 Quick Tour

### USER SIDE

#### 1. Create Account
- Click **"Get Started"** on home page
- Fill in your details
- Click **"Create Account"**
- You're automatically logged in!

**OR Sign In as User:**
- Click **"Sign In"**
- Use any email (except admin1@gmail.com)
- Use any password
- You're logged in!

### ADMIN SIDE

#### 1. Access Admin Portal
- Click **"Sign In"** from home page
- **Email**: `admin1@gmail.com`
- **Password**: `abc`
- Automatically redirects to admin dashboard

**Note:** There's only ONE sign-in page. It automatically detects if you're an admin!

---

## 🎨 UI Features to Notice

### Design Elements
- **Massive Spacing**: Everything has breathing room
- **Color Coding**:
  - 🟢 Green = Normal/Good
  - 🟡 Yellow = Abnormal/Warning
  - 🔴 Red = Critical/Danger
- **Gradient Backgrounds**: Modern blue-purple accents
- **Smooth Animations**: Professional transitions
- **Responsive**: Works on all screen sizes

### Status Badges
- Look for colored badges throughout
- They show at a glance if results are normal

### Charts & Graphs
- Interactive hover tooltips
- Color-coded trend lines
- Reference line for normal ranges

---

## 📱 Navigation Tips

### User Navbar
- **My Reports**: View all uploaded reports
- **Trends**: Health metrics over time
- **Upload**: Add new lab reports
- **Profile**: Manage personal info
- **Settings**: Account preferences
- **Admin**: Quick link to admin portal

### Admin Navbar
- **Dashboard**: Platform overview
- **Users**: User management
- **Reports**: Report oversight
- **Reference Ranges**: Medical parameter editor
- **Main Site**: Return to user side
- **Logout**: Exit admin portal

---

## 🔑 Key Features to Test

### For Users:
1. ✅ View detailed report analysis
2. 📈 Track trends over time
3. 📝 Edit profile information
4. ⚙️ Configure settings
5. 🔍 Search and filter reports

### For Admins:
1. 📊 View platform analytics
2. 👥 Manage user accounts
3. 📋 Oversee all reports
4. ⚕️ **Edit medical reference ranges**
5. 🔍 Search and filter data

---

## 💡 Pro Tips

1. **Reference Ranges are Critical**: Any changes in admin immediately affect how the AI interprets ALL reports

2. **Status Colors Matter**: 
   - Green badge = You're good
   - Yellow badge = Needs attention
   - Red badge = Urgent concern

3. **Trends Show Progress**: Use the trends page to see if your health metrics are improving over time

4. **Profile Matters**: Your age, gender, and medical history help the AI provide better insights

5. **Admin Has Power**: The reference range editor is the most important admin tool - it controls the entire AI logic

---

## 🎯 Common Tasks

### Upload a New Report
1. Click **"Upload"** in navbar
2. Drag & drop PDF or image
3. AI automatically analyzes
4. View instant results

### Check If Results Are Normal
1. Go to **"My Reports"**
2. Look at the colored badge
3. Green = Normal ✅
4. Yellow = Abnormal ⚠️
5. Red = Critical 🚨

### Update Medical Info
1. Go to **"Profile"**
2. Click **"Edit Profile"**
3. Scroll to Medical Information section
4. Add conditions, allergies, medications
5. Save changes

### Change Normal Ranges (Admin)
1. Login to admin
2. Go to **"Reference Ranges"**
3. Find test parameter
4. Click edit ✏️
5. Update values
6. Save ✅

---

## 🐛 Troubleshooting

**App won't start?**
```bash
rm -rf node_modules package-lock.json
npm install
npm run dev
```

**Charts not showing?**
- Refresh the page
- Check browser console for errors

**Can't login?**
- Any email/password works (demo mode)
- Try: admin@example.com / password123

---

## 📞 Need Help?

Check the main **README.md** for detailed documentation!

---

**Happy Testing! 🎉**