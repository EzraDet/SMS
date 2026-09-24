# 🎓 School Management System

A complete, full-stack school administration system built with modern web technologies.

## ✨ Features

- **Dashboard** — charts, stats, top students, recent activities
- **Students** — CRUD, search, filters, photos, profiles
- **Teachers** — CRUD, subjects, assigned classes, photos
- **Classes** — CRUD, teacher assignment, per-class grading & attendance
- **Subjects** — CRUD, teacher assignment
- **Attendance** — daily marking, bulk operations, monthly reports
- **Scores** — auto-calculated grades (A–F), bulk entry
- **Results** — printable report cards
- **Ranking** — class rankings with medals
- **Student Cards** — QR codes, print, PNG download
- **Teacher Cards** — QR codes, print, PNG download
- **Academic Years** — multi-year support with archiving
- **Users** — role management (Super Admin / Admin / Teacher / Staff)
- **Notifications** — real-time badge, auto-generated events
- **Reports** — CSV export, print
- **Auth** — JWT, bcrypt, protected routes, role-based access

## 🛠 Tech Stack

### Frontend
- React 18 + Vite
- TailwindCSS
- React Router v6
- Axios
- Recharts
- Lucide React
- react-hot-toast
- qrcode.react
- html-to-image

### Backend
- Node.js + Express 5
- JWT (jsonwebtoken)
- bcryptjs
- multer (file uploads)
- morgan (logging)
- JSON file database (swap-ready for MongoDB)

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm

### 1. Clone the repo

\`\`\`bash
git clone https://github.com/YOUR_USERNAME/school-management.git
cd school-management
\`\`\`

### 2. Set up the backend

\`\`\`bash
cd backend
npm install
cp .env.example .env       # then edit .env with your secrets
node utils/seedUsers.js    # seed demo users
npm run dev
\`\`\`

Backend runs on **http://localhost:5000**

### 3. Set up the frontend

\`\`\`bash
cd ../frontend
npm install
cp .env.example .env
npm run dev
\`\`\`

Frontend runs on **http://localhost:5173**

### 4. Login

| Username | Password | Role |
|----------|----------|------|
| `superadmin` | `password123` | Super Admin |
| `admin` | `password123` | Admin |
| `teacher1` | `password123` | Teacher |

## 📁 Project Structure

\`\`\`
school-management/
├── backend/
│   ├── controllers/
│   ├── middleware/
│   ├── routes/
│   ├── utils/
│   ├── db/db.json
│   ├── uploads/
│   └── server.js
│
└── frontend/
    ├── src/
    │   ├── components/
    │   ├── context/
    │   ├── hooks/
    │   ├── layouts/
    │   ├── pages/
    │   ├── services/
    │   └── utils/
    └── vite.config.js
\`\`\`

## 📝 License

MIT
