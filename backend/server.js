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

// ==================== CORS (flexible for dev + prod) ====================
// Set FRONTEND_URL in .env for production.
// Falls back to common localhost origins for development.
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:5174',
];

if (process.env.FRONTEND_URL) {
  // FRONTEND_URL can be a single URL or a comma-separated list
  process.env.FRONTEND_URL.split(',').forEach((url) => {
    const trimmed = url.trim();
    if (trimmed) allowedOrigins.push(trimmed);
  });
}

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, curl)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      // Allow all vercel.app preview URLs
      if (/\.vercel\.app$/.test(origin)) return callback(null, true);
      // Allow all railway.app preview URLs
      if (/\.railway\.app$/.test(origin)) return callback(null, true);
      // Allow all onrender.com preview URLs
      if (/\.onrender\.com$/.test(origin)) return callback(null, true);

      console.warn(`⚠️  CORS blocked origin: ${origin}`);
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);

// ==================== MIDDLEWARE ====================
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
      env: process.env.NODE_ENV || 'development',
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

// ==================== API ROUTES ====================
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
  console.log(`🌍  Env:            ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗  Allowed CORS:   ${allowedOrigins.join(', ')}`);
  console.log('════════════════════════════════════════════════');
  console.log('');
});
