# 🔬 LabInsight AI

> **LabInsight AI-Powered Lab Report Analysis Platform**

A full-stack healthcare web application that uses artificial intelligence to analyze lab reports, provide personalized health insights, and connect patients with doctors for professional medical guidance.

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)
![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Architecture](#architecture)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [User Roles & Flows](#user-roles--flows)
- [Project Structure](#project-structure)
- [Team Members](#team-members)
- [Screenshots](#screenshots)
- [License](#license)

---

## 🎯 Overview

**LabInsight AI** is a comprehensive healthcare platform designed to:

- Allow users to upload lab reports (PDF/images) and receive AI-generated analysis
- Provide an intelligent chatbot powered by RAG (Retrieval Augmented Generation) for health queries
- Connect patients with doctors for professional medical consultation
- Enable doctors to manage patients, view reports, and add professional comments
- Give administrators full control over users, doctors, and system reports

---

## ✨ Features

### 👤 For Users (Patients)
- **Secure Authentication** - Email/password login with Google OAuth 2.0
- **Report Upload** - Upload lab reports (PDF, JPEG, PNG) with 10MB limit
- **AI Analysis** - Get instant AI-generated insights including:
  - Overall health summary
  - Key findings & recommendations
  - Severity assessment (low/medium/high)
  - Individual test interpretations
- **AI Chat Assistant** - Ask health questions and get context-aware answers based on your reports
- **Agentic Assistant** - A LangGraph agent that picks tools to read your reports, compare results across reports, search report text, find a matching doctor, and send them a review request only after you approve it
- **Trends Visualization** - Track health metrics over time with charts
- **Doctor Connection** - Send requests to connect with available doctors
- **Profile Management** - Manage personal and medical information

### 👨‍⚕️ For Doctors
- **Patient Management** - View all connected patients
- **Report Review** - Access patient lab reports and AI analysis
- **Professional Comments** - Add medical comments and recommendations
- **Connection Requests** - Accept or reject patient connection requests
- **Dashboard** - Overview of patients, pending requests, and recent activity

### 🔐 For Administrators
- **User Management** - View, edit, suspend, or delete user accounts
- **Doctor Management** - Create and manage doctor accounts
- **Report Oversight** - View all reports across the platform
- **System Dashboard** - Statistics and analytics overview

---

## 🛠 Technology Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| React 18 | UI Framework |
| TypeScript | Type Safety |
| Vite | Build Tool |
| Tailwind CSS | Styling |
| Radix UI / shadcn | Component Library |
| React Router DOM | Routing |
| Recharts | Data Visualization |
| React Markdown | Markdown Rendering |
| Firebase Auth | Google OAuth 2.0 |
| Lucide React | Icons |

### Backend (Node.js)
| Technology | Purpose |
|------------|---------|
| Node.js | Runtime Environment |
| Express.js | Web Framework |
| MongoDB | Database |
| Mongoose | ODM |
| JWT | Authentication Tokens |
| bcrypt | Password Hashing |
| Multer | File Upload |
| Swagger UI | API Documentation |
| CORS | Cross-Origin Requests |

### AI Service (Python)
| Technology | Purpose |
|------------|---------|
| Flask | Microservice Framework |
| Groq API | LLM (Llama 3.3 70B) |
| SentenceTransformers | Text Embeddings |
| LangChain | PDF Processing |
| LangGraph | Tool-calling agent with human-in-the-loop approval |
| PyMongo | MongoDB Connection |
| NumPy | Vector Operations |

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT (Browser)                         │
│                     React + TypeScript + Vite                    │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND (Node.js + Express)                   │
│                         Port: 5000                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐ │
│  │   Auth   │  │  Upload  │  │  Admin   │  │     Doctor       │ │
│  │  Routes  │  │  Routes  │  │  Routes  │  │     Routes       │ │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────────┘ │
│                         │                                        │
│                    Swagger UI (/api-docs)                        │
└─────────────────────────────┬───────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
┌─────────────────┐  ┌───────────────┐  ┌─────────────────────────┐
│    MongoDB      │  │  File Storage │  │   AI Service (Python)   │
│   (Database)    │  │   (uploads/)  │  │       Port: 5001        │
│                 │  │               │  │  ┌───────────────────┐  │
│  - Users        │  │  - PDFs       │  │  │  Groq LLM API     │  │
│  - Profiles     │  │  - Images     │  │  │  (Llama 3.3 70B)  │  │
│  - Reports      │  │               │  │  └───────────────────┘  │
│  - Doctors      │  │               │  │  ┌───────────────────┐  │
│  - Requests     │  │               │  │  │  Embeddings       │  │
│                 │  │               │  │  │  (RAG System)     │  │
└─────────────────┘  └───────────────┘  │  └───────────────────┘  │
                                        └─────────────────────────┘
```

---

## 📥 Installation

### Prerequisites

- **Node.js** v18+ ([Download](https://nodejs.org/))
- **Python** 3.9+ ([Download](https://python.org/))
- **MongoDB** (Local or [MongoDB Atlas](https://www.mongodb.com/atlas))
- **Git** ([Download](https://git-scm.com/))

### Step 1: Clone the Repository

```bash
git clone https://github.com/your-username/labinsight-ai.git
cd labinsight-ai
```

### Step 2: Install Frontend Dependencies

```bash
# From project root
npm install
```

### Step 3: Install Backend Dependencies

```bash
cd Backend-Node
npm install
cd ..
```

### Step 4: Install AI Service Dependencies

```bash
cd AI-Service
pip install -r requirements.txt
cd ..
```

---

## ⚙️ Configuration

### Backend Environment Variables

Create `Backend-Node/.env`:

```env
# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/LabInsight

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRES_IN=7d

# Server Port
PORT=5000

# AI Service URL
AI_SERVICE_URL=http://localhost:5001
```

### AI Service Environment Variables

Create `AI-Service/.env`:

```env
# Groq API Key (Get from https://console.groq.com/)
GROQ_API_KEY=your-groq-api-key

# MongoDB Connection
MONGO_URI=mongodb://localhost:27017/LabInsight

# Same secret as Backend-Node/.env, so the agent can verify the user's login token
JWT_SECRET=your-jwt-secret
```

### Firebase Configuration (Google OAuth)

The Firebase configuration is already set up in `src/components/firebase.ts`. If you want to use your own Firebase project:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable Google Authentication
4. Update the config in `firebase.ts`

---

## 🚀 Running the Application

### Option 1: Run All Services

Open **3 terminal windows**:

**Terminal 1 - Frontend:**
```bash
npm run dev
```
Frontend runs at: `http://localhost:5173`

**Terminal 2 - Backend:**
```bash
cd Backend-Node
node server.js
```
Backend runs at: `http://localhost:5000`

**Terminal 3 - AI Service:**
```bash
cd AI-Service
python ai_service.py
```
AI Service runs at: `http://localhost:5001`

### Option 2: Using Concurrent Scripts (Optional)

You can set up a script to run all services together. Add to root `package.json`:

```json
{
  "scripts": {
    "dev": "vite",
    "backend": "cd Backend-Node && node server.js",
    "ai": "cd AI-Service && python ai_service.py"
  }
}
```

---

## 📚 API Documentation

### Swagger UI

Once the backend is running, access the interactive API documentation at:

```
http://localhost:5000/api-docs
```

### Key API Endpoints

#### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/signup` | Register new user |
| POST | `/auth/login` | User login |
| POST | `/auth/doctor-login` | Doctor login |
| POST | `/auth/change-password` | Change password |

#### User Profile & Reports
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/profile/:email` | Get user profile |
| PUT | `/profile/:email` | Update profile |
| POST | `/upload-report` | Upload lab report |
| GET | `/reports?email=` | Get user's reports |
| GET | `/report/:id` | Get single report |
| DELETE | `/delete-report/:id` | Delete report |

#### Doctor Routes
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/doctors` | List all doctors |
| POST | `/send-request` | Send connection request |
| GET | `/doctor/patients/:email` | Get doctor's patients |
| PUT | `/doctor/request/update/:id` | Accept/reject request |
| POST | `/doctor/add-comment` | Add comment to report |

#### Admin Routes
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/users` | Get all users |
| PUT | `/admin/users/:email/status` | Update user status |
| DELETE | `/admin/users/:email` | Delete user |
| POST | `/admin/create-doctor` | Create doctor account |

#### AI Service
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/analyze` | Analyze PDF report |
| GET | `/chat/latest-report?email=` | Get latest report info |
| POST | `/chat/ask` | Ask AI a question |
| POST | `/agent/chat` | Agent turn (requires `Authorization: Bearer <token>`) |
| POST | `/agent/resume` | Approve or cancel the agent's pending action |

See [AI-Service/README.md](AI-Service/README.md#agent) for how the agent works and how to run its evaluation.

---

## 👥 User Roles & Flows

### Flow 1: User Registration & Report Analysis
```
Sign Up → Login → Upload Report → View AI Analysis → Chat with AI
```

### Flow 2: Patient-Doctor Connection
```
Login → Browse Doctors → Send Request → (Doctor Accepts) → View Assigned Doctor
```

### Flow 3: Doctor Workflow
```
Login → View Dashboard → Check Requests → Accept/Reject → View Patients → Add Comments
```

### Flow 4: Admin Management
```
Login → Dashboard → Manage Users → Manage Doctors → View Reports
```

---

## 📁 Project Structure

```
Final_Web/
├── 📂 AI-Service/                 # Python AI Microservice
│   ├── ai_service.py              # Main Flask application
│   ├── requirements.txt           # Python dependencies
│   ├── Embeddings/                # Generated embeddings (.pkl)
│   └── .env.example
│
├── 📂 Backend-Node/               # Node.js Backend
│   ├── server.js                  # Express entry point
│   ├── swagger.js                 # Swagger configuration
│   ├── config/
│   │   └── db.js                  # MongoDB connection
│   ├── middleware/
│   │   └── auth.js                # JWT middleware
│   ├── models/                    # Mongoose schemas
│   │   ├── User.js
│   │   ├── Profile.js
│   │   ├── Report.js
│   │   ├── DoctorProfile.js
│   │   ├── AssignedDoctor.js
│   │   └── ConnectionRequest.js
│   ├── routes/                    # API routes
│   │   ├── auth.js
│   │   ├── profile.js
│   │   ├── upload.js
│   │   ├── admin.js
│   │   ├── doctorRoutes.js
│   │   └── ...
│   └── uploads/                   # Uploaded files
│
├── 📂 src/                        # React Frontend
│   ├── App.tsx                    # Main app with routes
│   ├── main.tsx                   # Entry point
│   ├── index.css                  # Global styles
│   ├── components/
│   │   ├── admin/                 # Admin components
│   │   ├── doctor/                # Doctor components
│   │   ├── ui/                    # Shared UI components
│   │   ├── Home.tsx
│   │   ├── SignIn.tsx
│   │   ├── Profile.tsx
│   │   ├── Chat.tsx
│   │   ├── ViewReports.tsx
│   │   └── ...
│   └── styles/
│
├── 📄 package.json                # Frontend dependencies
├── 📄 vite.config.ts              # Vite configuration
├── 📄 index.html                  # HTML entry point
├── 📄 README.md                   # This file
├── 📄 TEAM_WORKFLOW.md            # Team collaboration guide
└── 📄 .gitignore
```

---

## 👨‍💻 Team Members

| Name | Role | Responsibilities |
|------|------|------------------|
| Anushika Balamurugan | Frontend - User Module | User authentication, dashboard, reports UI |
| Venkata Sriya Kamarsu | Frontend - Admin/Doctor | Admin panel, doctor portal |
| Akshay Madavalappil Ramesh | Backend Developer | Node.js APIs, database, authentication |
| Amrin Bushra Taj | AI & Documentation | AI service, chatbot, documentation |

---

## 📸 Screenshots

### Landing Page
![alt text](<Landing Page.jpeg>)

### User Dashboard
![alt text](<User Dashboard.jpeg>)

### AI Chat Assistant
![alt text](<AI Chat Assistant.jpeg>)

### Admin Dashboard
![alt text](<Admin Portal Dashboard.jpeg>)

### Doctor Portal
![alt text](<Doctor Dashboard.jpeg>)

---

## 🔒 Security Features

- **Password Hashing** - bcrypt with salt rounds
- **JWT Authentication** - Secure token-based auth
- **Role-Based Access Control** - Admin, Doctor, User roles
- **File Validation** - Type and size restrictions
- **Protected Routes** - Middleware-based authorization
- **Google OAuth 2.0** - Secure social login

---

## 📄 License

This project is created for educational purposes as part of **INFO 6150 - Fall 2025**.

---

## 🙏 Acknowledgments

- [Groq](https://groq.com/) for LLM API
- [Firebase](https://firebase.google.com/) for Authentication
- [shadcn/ui](https://ui.shadcn.com/) for UI Components
- [Tailwind CSS](https://tailwindcss.com/) for Styling

---

## ⚠️ Disclaimer

This application is for educational purposes only. The AI-generated health insights should not replace professional medical advice. Always consult with healthcare providers for medical decisions.
