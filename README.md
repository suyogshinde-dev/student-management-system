# EduPulse - Full-Stack Student Management System

A full-stack **Student Management System (SMS)** built with **Python 3.12**, **Django 6.0**, **Django REST Framework (DRF)**, **MySQL**, and **React 19 (Vite)**.

Designed with a modern Slate & Indigo UI/UX aesthetic, responsive analytics dashboards, batch class attendance tracking, automatic 4.0 scale GPA and letter grade computation, role-based access control (RBAC), class-appropriate data isolation, and secure CSV report exports.

---

## 🌟 Key Features

- **👨‍🎓 Student Directory & Academic Profiles**: Comprehensive student record management with roll number enforcement, department association, search, multi-field filtering, pagination, and detailed transcript profile drawers.
- **📚 Curriculum & Faculty Management**: Configure academic departments, course catalogs, credit units, semesters, and assigned course instructors.
- **📝 Course Registration & Enrollments**: Manage student course registrations per academic year and semester with active status tracking (`Enrolled`, `Completed`, `Dropped`).
- **📅 Class Attendance Tracker & Batch Entry**: Daily lecture attendance logging with interactive **Batch Mark Class Attendance** dialog. Dynamic attendance rate calculation with visual warning flags for attendance below 75%.
- **🏆 Exam Scores, Letter Grades & Transcripts**: Record scores for Midterms, Finals, Quizzes, Assignments, and Practical Labs. Automatic letter grade assignment (`A+` to `F`) and 4.0 scale GPA computation.
- **📊 Role-Aware Dashboard Analytics**: Dynamic dashboards powered by Recharts featuring student department distribution bar charts, grade breakdown pie charts, and top performer highlights.
- **📑 Protected CSV Reports & Data Export**: One-click generation and download of official CSV spreadsheets for Student Master Directory, Attendance Logs, and Academic Transcripts.
- **🔔 Notifications & Announcements**: Category-filtered system notices, academic announcements, and attendance threshold alerts.
- **🛡️ Enterprise Security Architecture**: Token-based JWT authentication, class-appropriate teacher authorization, student data isolation, and environment variable secrets management.

---

## 🎭 User Roles & Permissions

The system implements strict **Role-Based Access Control (RBAC)** enforced at the Django REST Framework backend level (queryset filtering and object-level permission guards):

| Role | Dashboard View | Student Directory | Courses & Depts | Attendance & Marks | CSV Exports |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Admin** | Full Institutional Analytics | Full CRUD over all students | Full CRUD over all courses & departments | Full access to all attendance & marks | Download all full CSV reports |
| **Teacher / Staff** | Scoped Class Analytics | View & edit students in assigned courses | View assigned courses (`Course.teacher`) | Batch mark attendance & record exam marks for assigned courses | Download CSV reports for assigned classes |
| **Student** | Personal Student Portal | Read-only access to own profile | View enrolled courses | Read-only access to own attendance rate & transcript | Access restricted (`403 Forbidden`) |

---

## 🛠️ Technology Stack

- **Backend Framework**: Python 3.12, Django 6.0.4, Django REST Framework 3.18
- **Authentication & Security**: `djangorestframework-simplejwt` (JWT Bearer Tokens), `django-cors-headers`, `python-dotenv`
- **Database**: MySQL 8.0 / MariaDB (`mysqlclient` 2.2 / `PyMySQL` 1.1)
- **Frontend Framework**: React 19, Vite 8.3, React Router v7
- **UI Components & Styling**: Custom CSS System (Vanilla CSS with CSS Variables & Glassmorphism), Lucide React Icons
- **Data Visualization**: Recharts 3.10
- **HTTP Client**: Axios 1.20 (with JWT request/response interceptors & token auto-refresh)

---

## 🏗️ System Architecture & Project Structure

```
StudentManagementSystem/
├── .env.example                     # Root environment configuration template
├── .gitignore                       # Git exclusion rules
├── README.md                        # Project documentation
├── student_management/              # Django Backend Application
│   ├── .env.example                 # Backend environment template
│   ├── manage.py                    # Django CLI entrypoint
│   ├── student_management/          # Django Project Configuration
│   │   ├── settings.py              # Environment settings, DRF, JWT & CORS setup
│   │   ├── urls.py                  # Main URL routing (`/api/`, `/admin/`, `/students/`)
│   │   └── wsgi.py                  # WSGI server application
│   └── students/                    # Core Domain Application
│       ├── models.py                # Relational MySQL models (Student, Course, Mark, etc.)
│       ├── serializers.py           # DRF Serializers & validation logic
│       ├── permissions.py           # Custom DRF permission classes (IsTeacherOrAdmin, etc.)
│       ├── api_views.py             # ViewSets, role-scoped queries & CSV exports
│       ├── urls.py                  # API router & authentication routes
│       └── management/commands/
│           └── seed_data.py         # Multi-teacher database seeder
└── frontend/                        # React.js SPA (Vite)
    ├── package.json                 # Node dependencies
    ├── vite.config.js               # Vite configuration & backend API proxy
    ├── src/
    │   ├── App.jsx                  # Main application router & protected layouts
    │   ├── index.css                # Slate & Indigo design system
    │   ├── context/
    │   │   └── AuthContext.jsx      # Authentication & role state management
    │   ├── services/
    │   │   └── api.js               # Axios API service & JWT interceptors
    │   ├── components/              # Sidebar, TopBar, Modal, Toast, StudentDetailModal
    │   └── pages/                   # DashboardPage, StudentsPage, CoursesPage, etc.
```

---

## 🔒 Security Highlights

1. **JWT Authentication (`djangorestframework-simplejwt`)**: Token-based authentication using short-lived Access Tokens and Refresh Tokens.
2. **Backend Role Authorization**: All write operations (`POST`, `PUT`, `DELETE`) are guarded by Django REST Framework permission classes (`permissions.py`). Frontend UI changes do not bypass backend enforcement.
3. **Student Data Isolation**: Querysets for `Student`, `Enrollment`, `Attendance`, and `Mark` viewsets automatically filter records so logged-in students can only retrieve their own data (`user = request.user`). Direct URL/API calls to another student's profile return `403 Forbidden` or `404 Not Found`.
4. **Teacher Class-Level Access Control**: Teachers are assigned to specific courses (`Course.teacher`). A Teacher can only view, batch-mark attendance, or record marks for students enrolled in their assigned classes. Cross-teacher modifications return `403 Forbidden`.
5. **Protected CSV Export Endpoints**: `/api/reports/students/csv/`, `/api/reports/attendance/csv/`, and `/api/reports/marks/csv/` require authentication and `IsTeacherOrAdmin` permission, scoping output to appropriate classes.
6. **Environment Variables**: Sensitive configurations (`SECRET_KEY`, `DB_PASSWORD`, `ALLOWED_HOSTS`) are loaded dynamically from `.env` using `python-dotenv`. Real secrets are excluded from Git via `.gitignore`.

---

## 📦 Main Application Modules

| Module | Description | Key Capabilities |
| :--- | :--- | :--- |
| **Students** | Directory of enrolled students | Search, filter by department/status/gender, pagination, profile drawer with academic transcript & GPA. |
| **Courses & Depts** | Degree curriculum & faculties | Configure course codes, credit units, semesters, and assigned course instructors. |
| **Enrollments** | Term course registrations | Register students for academic years and semesters with status tracking (`Enrolled`, `Completed`, `Dropped`). |
| **Attendance** | Daily lecture attendance | Attendance logs, batch attendance entry dialog, attendance percentage calculation, low-attendance alert flags (< 75%). |
| **Marks & Records** | Exam scores & transcripts | Midterm/Final/Quiz score entry, auto letter grade assignment (`A+` to `F`), transcript drawer, 4.0 scale GPA calculation. |
| **Reports** | Official data exports | Protected CSV report generation for Students, Attendance Logs, and Academic Transcripts. |
| **Dashboard** | Role-aware analytics | Institutional bar/pie charts for Admins/Teachers; personal academic portal for Students. |

---

## 🔌 API Overview

All API endpoints are prefixed with `/api/` and return JSON responses:

### 🔑 Authentication
- `POST /api/auth/login/` — Authenticate user credentials and return JWT tokens & user info.
- `GET /api/auth/me/` — Retrieve profile details of currently authenticated user.
- `POST /api/auth/register/` — Register a new student user account.

### 📊 Dashboard & Reports
- `GET /api/dashboard/stats/` — Retrieve role-scoped dashboard metrics and analytics.
- `GET /api/reports/students/csv/` — Export CSV report of student directory (Admin/Teacher only).
- `GET /api/reports/attendance/csv/` — Export CSV report of attendance records (Admin/Teacher only).
- `GET /api/reports/marks/csv/` — Export CSV report of academic marks (Admin/Teacher only).

### 🎓 Domain Resource Endpoints (DRF Router)
- `GET|POST /api/departments/` | `GET|PUT|DELETE /api/departments/{id}/`
- `GET|POST /api/courses/` | `GET|PUT|DELETE /api/courses/{id}/`
- `GET|POST /api/students/` | `GET|PUT|DELETE /api/students/{id}/` | `GET /api/students/{id}/profile/`
- `GET|POST /api/enrollments/` | `GET|PUT|DELETE /api/enrollments/{id}/`
- `GET|POST /api/attendance/` | `GET|PUT|DELETE /api/attendance/{id}/` | `POST /api/attendance/batch_mark/` | `GET /api/attendance/report/`
- `GET|POST /api/marks/` | `GET|PUT|DELETE /api/marks/{id}/` | `GET /api/marks/transcript/`
- `GET /api/notifications/` | `POST /api/notifications/{id}/mark_read/` | `POST /api/notifications/mark_all_read/`

---

## 🔑 Demo Accounts

The database seed command creates demo accounts for instant testing:

| Role | Username | Password | Assigned Scope & Access Level |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin` | `admin123` | Full Administrative & Institutional System Access |
| **Teacher 1** | `teacher` | `teacher123` | Assigned Computer Science courses (`CS101`, `CS102`, `CS103`) |
| **Teacher 2** | `teacher2` | `teacher123` | Assigned Electronics courses (`EC101`, `EC102`) |
| **Student** | `student1` | `student123` | Alex Johnson (`STU2025001`) - Read-only Personal Student Portal |

---

## ⚡ Installation and Setup Instructions

### Prerequisites
- **Python 3.10+**
- **Node.js v18+ & npm**
- **MySQL Server** running on `localhost:3306`

### 1. Clone Repository & Setup Environment
```bash
git clone https://github.com/suyogshinde-dev/student-management-system.git
cd student-management-system
```

### 2. Backend Setup (Django + MySQL)
```bash
# Navigate to Django backend directory
cd student_management

# Create and activate Python virtual environment
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

# Install backend dependencies
pip install -r requirements.txt

# Create environment configuration file from template
cp .env.example .env

# Run database migrations to create MySQL tables
python manage.py migrate

# Seed database with demo accounts, departments, courses, students, and marks
python manage.py seed_data

# Start Django development server
python manage.py runserver 127.0.0.1:8000
```

### 3. Frontend Setup (React.js + Vite)
Open a new terminal window:
```bash
# Navigate to frontend directory
cd frontend

# Install Node dependencies
npm install

# Start Vite React development server
npm run dev
```

Visit **[http://localhost:5173](http://localhost:5173)** in your browser.

---

## 🧪 Testing & Verification

The system underwent comprehensive security, API authorization, and role isolation testing during development to verify backend access controls and data isolation policies.

### Verification Checklist Covered:
- [x] Anonymous access to API endpoints and CSV exports is blocked (`401 Unauthorized`).
- [x] Student role receives isolated data and cannot perform write operations (`403 Forbidden`).
- [x] Student cannot inspect another student's profile or transcript (`403 Forbidden` / `404 Not Found`).
- [x] Teacher 1 (`teacher`) can view and manage assigned CS courses, but is blocked from modifying Teacher 2's EC classes (`403 Forbidden`).
- [x] Client-side UI role switching does not bypass Django backend authorization.
- [x] Admin retains full institutional access.

---

## 📸 Screenshots

*(Placeholders for application screenshots)*

### 1. Admin Analytics Dashboard
```
+-----------------------------------------------------------------------+
|  [ Screenshot Placeholder: Admin Analytics Dashboard with Recharts ]  |
+-----------------------------------------------------------------------+
```

### 2. Student Directory & Profile Drawer
```
+-----------------------------------------------------------------------+
|  [ Screenshot Placeholder: Student Directory & Transcript Drawer ]   |
+-----------------------------------------------------------------------+
```

### 3. Batch Attendance Marking Dialog
```
+-----------------------------------------------------------------------+
|  [ Screenshot Placeholder: Batch Mark Class Attendance Modal ]        |
+-----------------------------------------------------------------------+
```

### 4. Student Portal View
```
+-----------------------------------------------------------------------+
|  [ Screenshot Placeholder: Student Personal Dashboard & Grades ]      |
+-----------------------------------------------------------------------+
```

---

## 🚀 Future Improvements

- [ ] **PDF Transcript Generation**: Export downloadable official PDF transcript certificates.
- [ ] **Fee & Financial Management**: Track tuition fee payment status and balance receipts.
- [ ] **Course Materials & Assignments**: Enable teachers to upload lecture slides and assignment attachments.

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
