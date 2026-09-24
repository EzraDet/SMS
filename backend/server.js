import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import { requestLogger } from './middleware/logger.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';
import { success } from './utils/response.js';
import { readDB } from './utils/fileHandler.js';

// ==================== ROUTES ====================
import authRoutes from './routes/auth.js';
import studentRoutes from './routes/students.js';
import teacherRoutes from './routes/teachers.js';
import classRoutes from './routes/classes.js';
import subjectRoutes from './routes/subjects.js';
import attendanceRoutes from './routes/attendance.js';
import scoreRoutes from './routes/scores.js';
import dashboardRoutes from './routes/dashboard.js';
import academicYearRoutes from './routes/academicYears.js';
import notificationRoutes from './routes/notifications.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// ==================== MIDDLEWARE ====================
app.use(
  cors({
    origin: ['http://localhost:3000', 'http://localhost:5173'],
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use(requestLogger);

// ==================== STATIC FILES (uploaded photos) ====================
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ==================== HEALTH CHECK ====================
app.get('/', (req, res) => {
  success(
    res,
    {
      name: 'School Management System API',
      version: '1.0.0',
      status: 'running',
      timestamp: new Date().toISOString(),
    },
    'Welcome to School Management API'
  );
});

app.get('/api/health', async (req, res) => {
  try {
    const db = await readDB();
    const stats = {};
    Object.keys(db).forEach((k) => {
      stats[k] = Array.isArray(db[k]) ? db[k].length : 0;
    });
    success(
      res,
      { status: 'healthy', database: 'connected', collections: stats },
      'API and database are healthy'
    );
  } catch (err) {
    errorHandler(err, req, res);
  }
});

// ==================== API ROUTES (after middleware!) ====================
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/scores', scoreRoutes);
app.use('/api/academic-years', academicYearRoutes);
app.use('/api/notifications', notificationRoutes);

// ==================== ERROR HANDLING ====================
app.use(notFound);
app.use(errorHandler);

// ==================== START SERVER ====================
app.listen(PORT, () => {
  console.log('');
  console.log('════════════════════════════════════════════════');
  console.log('🎓  SCHOOL MANAGEMENT SYSTEM API');
  console.log('════════════════════════════════════════════════');
  console.log(`🚀  Server:         http://localhost:${PORT}`);
  console.log(`📊  Health:         http://localhost:${PORT}/api/health`);
  console.log(`🖼️  Uploads:        http://localhost:${PORT}/uploads`);
  console.log(`🔐  Auth:           http://localhost:${PORT}/api/auth`);
  console.log(`📈  Dashboard:      http://localhost:${PORT}/api/dashboard`);
  console.log(`👥  Students:       http://localhost:${PORT}/api/students`);
  console.log(`🧑‍🏫  Teachers:       http://localhost:${PORT}/api/teachers`);
  console.log(`🏫  Classes:        http://localhost:${PORT}/api/classes`);
  console.log(`📚  Subjects:       http://localhost:${PORT}/api/subjects`);
  console.log(`📋  Attendance:     http://localhost:${PORT}/api/attendance`);
  console.log(`📝  Scores:         http://localhost:${PORT}/api/scores`);
  console.log(`📅  Academic Years: http://localhost:${PORT}/api/academic-years`);
  console.log(`🔔  Notifications:  http://localhost:${PORT}/api/notifications`);
  console.log(`🌍  Env:            ${process.env.NODE_ENV || 'development'}`);
  console.log('════════════════════════════════════════════════');
  console.log('');
});