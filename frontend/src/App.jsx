import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './layouts/DashboardLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

// Students
import StudentList from './pages/students/StudentList';
import StudentProfile from './pages/students/StudentProfile';

// Teachers
import TeacherList from './pages/teachers/TeacherList';
import TeacherProfile from './pages/teachers/TeacherProfile';

// Classes
import ClassList from './pages/classes/ClassList';
import ClassDetail from './pages/classes/ClassDetail';

// Subjects
import SubjectList from './pages/subjects/SubjectList';

// Attendance
import AttendancePage from './pages/attendance/AttendancePage';
import AttendanceReport from './pages/attendance/AttendanceReport';

// Scores / Results / Ranking
import ScoreEntry from './pages/scores/ScoreEntry';
import StudentResults from './pages/scores/StudentResults';
import ClassRanking from './pages/scores/ClassRanking';

// Student Cards
import StudentCardsPage from './pages/studentCards/StudentCardsPage';

// Teacher Cards
import TeacherCardsPage from './pages/teacherCards/TeacherCardsPage';

// Reports
import ReportsPage from './pages/reports/ReportsPage';

// Academic Years
import AcademicYearsPage from './pages/academicYears/AcademicYearsPage';

// Users
import UsersPage from './pages/users/UsersPage';

// Notifications
import NotificationsPage from './pages/NotificationsPage';

// 404
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{ duration: 3000, style: { fontSize: '14px' } }}
      />

      <Routes>
        {/* Public */}
        <Route path="/login" element={<Login />} />

        {/* Protected — everything inside DashboardLayout requires auth */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />

          {/* Students */}
          <Route path="students" element={<StudentList />} />
          <Route path="students/:id" element={<StudentProfile />} />

          {/* Teachers */}
          <Route path="teachers" element={<TeacherList />} />
          <Route path="teachers/:id" element={<TeacherProfile />} />

          {/* Classes */}
          <Route path="classes" element={<ClassList />} />
          <Route path="classes/:id" element={<ClassDetail />} />

          {/* Subjects */}
          <Route path="subjects" element={<SubjectList />} />

          {/* Attendance */}
          <Route path="attendance" element={<AttendancePage />} />
          <Route path="attendance/report" element={<AttendanceReport />} />

          {/* Scores / Results / Ranking */}
          <Route path="scores" element={<ScoreEntry />} />
          <Route path="results" element={<StudentResults />} />
          <Route path="ranking" element={<ClassRanking />} />

          {/* Student Cards */}
          <Route path="student-cards" element={<StudentCardsPage />} />

          {/* Teacher Cards */}
          <Route path="teacher-cards" element={<TeacherCardsPage />} />

          {/* Reports */}
          <Route path="reports" element={<ReportsPage />} />

          {/* Academic Years */}
          <Route path="academic-years" element={<AcademicYearsPage />} />

          {/* Users */}
          <Route path="users" element={<UsersPage />} />

          {/* Notifications */}
          <Route path="notifications" element={<NotificationsPage />} />

          {/* 404 fallback inside layout */}
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}