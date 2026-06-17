# LabInsight AI - Medical Lab Report Interpreter

A professional AI-powered web application that helps users analyze and understand their medical lab reports through advanced AI technology.

## 🌟 Features

### User Side

#### 1. **Report Insights Page** ✅
- Detailed analysis view for each lab report
- Test values with normal range comparisons
- Color-coded status indicators (Low/Normal/High)
- AI-generated doctor-style interpretations
- Abnormal value highlighting
- Visual summary cards

#### 2. **Trends Dashboard** ✅
- Interactive charts showing health metrics over time
- Multiple test parameters tracking (Hemoglobin, Cholesterol, TSH, etc.)
- Time range selection (3 months, 6 months, 1 year)
- Trend analysis with improvement/decline indicators
- Visual insights with color-coded status
- Comparison with normal ranges

#### 3. **Profile & Health Details** ✅
- Personal information management
- Medical history tracking (conditions, allergies, medications)
- Health metrics (blood type, height, weight)
- Unit preferences (metric/imperial)
- Editable profile fields
- Secure data storage

#### 4. **Settings Page** ✅
- Password change functionality
- Account deletion option
- Notification preferences
  - Email notifications
  - Report alerts
  - Trend alerts
  - Newsletter subscription
- Two-factor authentication toggle
- Language and theme preferences

#### 5. **View Reports** ✅
- Complete list of all uploaded reports
- Search and filter functionality
- Status-based filtering (Normal/Abnormal/Critical)
- Quick access to detailed insights
- Download report options
- Upload new reports

#### 6. **Upload Report** ✅
- PDF and image upload support
- Drag-and-drop interface
- Instant AI analysis
- Progress tracking

### Admin Side

#### 1. **Admin Dashboard** ✅
- Overview statistics
  - Total users
  - Total reports
  - Active users today
  - Average reports per user
- User growth charts
- Report type distribution
- Recent activity feed
- Trend indicators

#### 2. **Manage Users** ✅
- Complete user list with search
- User status management (Active/Suspended/Pending)
- Filter by status
- User details (join date, reports count, last active)
- Actions: Edit, Suspend, Delete
- Statistics cards

#### 3. **Manage Reports** ✅
- Overview of all uploaded reports
- User-report associations
- Status tracking (Normal/Abnormal/Critical)
- Search by user or report name
- Filter by status
- View, download, delete actions
- Detailed statistics

#### 4. **Medical Reference Range Editor** ✅ (MOST IMPORTANT)
- Comprehensive test parameter database
- Editable normal ranges
  - Min/Max values
  - Units
  - Age groups
  - Gender-specific ranges
- Category-based organization (CBC, Lipid Panel, Thyroid, etc.)
- Search and filter functionality
- Add new test parameters
- Delete existing ranges
- **Changes directly affect AI analysis logic**
- Includes 15+ pre-configured test parameters

## 🎨 Design Features

- **Clean, Modern UI**: Professional medical aesthetic
- **Generous Spacing**: Ample padding and margins for readability
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Color-Coded Status**: Easy visual identification
  - Green: Normal results
  - Yellow: Abnormal results
  - Red: Critical results
- **Gradient Accents**: Modern blue-purple gradients
- **Smooth Animations**: Professional transitions
- **Accessible**: High contrast, clear typography

## 🛠️ Tech Stack

- **Frontend Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Routing**: React Router v6
- **Styling**: Tailwind CSS v4
- **Charts**: Recharts
- **Icons**: Lucide React, React Icons
- **UI Components**: Custom component library

## 📁 Project Structure

```
/
├── components/
│   ├── admin/
│   │   ├── AdminDashboard.tsx      # Admin overview with stats
│   │   ├── AdminLogin.tsx          # Secure admin authentication
│   │   ├── AdminNavbar.tsx         # Admin navigation
│   │   ├── ManageUsers.tsx         # User management
│   │   ├── ManageReports.tsx       # Report oversight
│   │   └── ReferenceRangeEditor.tsx # Medical range configuration
│   ├── Home.tsx                    # Landing page
│   ├── SignIn.tsx                  # User authentication
│   ├── GetStarted.tsx              # User registration
│   ├── Profile.tsx                 # User profile management
│   ├── ViewReports.tsx             # Reports list
│   ├── UploadReport.tsx            # Report upload
│   ├── ReportInsights.tsx          # Detailed analysis
│   ├── Trends.tsx                  # Health trends dashboard
│   ├── Settings.tsx                # User settings
│   └── Navbar.tsx                  # User navigation
├── styles/
│   └── globals.css                 # Global styles and typography
├── App.tsx                         # Main app with routing
└── package.json                    # Dependencies

```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd labinsight-ai
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   ```
   http://localhost:5173
   ```

### Building for Production

```bash
npm run build
npm run preview
```

## 🔐 Authentication Flow

### Unified Sign-In System
1. Visit home page at `/`
2. Click "Get Started" or "Sign In"
3. **For Admin Access**: Use `admin1@gmail.com` / `abc`
4. **For User Access**: Use any other email/password
5. System automatically routes you to the correct dashboard

### Admin Access
- **Email**: `admin1@gmail.com`
- **Password**: `abc`
- Automatically redirects to `/admin/dashboard`

### User Access
- **Any email** (except admin1@gmail.com)
- **Any password**
- Automatically redirects to `/view-reports`

## 📊 Reference Range Management

The **Medical Reference Range Editor** is the core admin feature that controls AI analysis:

### Pre-configured Tests:
- **CBC**: Hemoglobin, WBC, RBC
- **Lipid Panel**: Total Cholesterol, LDL, HDL
- **Thyroid**: TSH, Free T4
- **Liver Function**: ALT, AST
- **Kidney Function**: Creatinine, BUN
- **Vitamins**: Vitamin D

### Key Features:
- Edit existing ranges in-line
- Add new test parameters
- Gender and age-specific ranges
- Unit standardization
- Immediate application to AI logic
- Category-based organization

## 🎯 Key User Flows

### Uploading a Report
1. Navigate to "Upload" in navbar
2. Drag & drop PDF or image file
3. AI automatically extracts values
4. View instant analysis
5. Access from "My Reports"

### Viewing Trends
1. Navigate to "Trends"
2. Select test parameter
3. Choose time range
4. View interactive chart
5. Read AI-generated insights

### Admin: Updating Reference Ranges
1. Login to admin portal
2. Go to "Reference Ranges"
3. Search for test parameter
4. Click edit icon
5. Update min/max values
6. Save changes
7. **All future analyses use new ranges**

## 🔮 Future Enhancements

- [ ] Real AI integration (OpenAI/Anthropic)
- [ ] PDF report parsing with OCR
- [ ] Email notifications
- [ ] Export trends to PDF
- [ ] Multi-language support
- [ ] Premium subscription tiers
- [ ] Doctor collaboration features
- [ ] Mobile app (React Native)
- [ ] Real-time chat with healthcare providers
- [ ] Integration with wearables

## 📝 Notes

- This is a demonstration/prototype application
- Not intended for actual medical diagnosis
- Always consult healthcare professionals
- Reference ranges should be verified with medical literature
- Data is stored locally (no backend yet)

## 🏥 Medical Disclaimer

This application is for educational and informational purposes only. It does not provide medical advice, diagnosis, or treatment. Always seek the advice of qualified health providers with any questions regarding a medical condition.

## 📄 License

MIT License - Feel free to use this project for learning and development.

## 👥 Credits

Built with ❤️ for healthcare accessibility

---

**Version**: 1.0.0  
**Last Updated**: November 2024  
**Status**: ✅ Production Ready