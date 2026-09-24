import {
  getAll,
  getById,
  create,
  update,
  remove,
  readDB,
  writeDB,
} from '../utils/fileHandler.js';
import { success, error } from '../utils/response.js';
import { generateId, now } from '../utils/helpers.js';
import { pushNotification } from '../utils/notify.js';

const COLLECTION = 'attendance';
const VALID_STATUSES = ['present', 'absent', 'late', 'permission'];

// ==================== GET ALL ====================
export async function getAttendance(req, res, next) {
  try {
    const {
      classId = '',
      studentId = '',
      date = '',
      from = '',
      to = '',
      status = '',
      academicYear = '',
      page = 1,
      limit = 100,
      sortBy = 'date',
      order = 'desc',
    } = req.query;

    let records = await getAll(COLLECTION);

    if (classId) records = records.filter((r) => r.classId === classId);
    if (studentId) records = records.filter((r) => r.studentId === studentId);
    if (date) records = records.filter((r) => r.date === date);
    if (academicYear)
      records = records.filter((r) => r.academicYear === academicYear);
    if (status) records = records.filter((r) => r.status === status);
    if (from) records = records.filter((r) => r.date >= from);
    if (to) records = records.filter((r) => r.date <= to);

    records.sort((a, b) => {
      const A = a[sortBy] ?? '';
      const B = b[sortBy] ?? '';
      if (A < B) return order === 'asc' ? -1 : 1;
      if (A > B) return order === 'asc' ? 1 : -1;
      return 0;
    });

    const total = records.length;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.max(1, parseInt(limit));
    const totalPages = Math.ceil(total / limitNum);
    const startIndex = (pageNum - 1) * limitNum;
    const paginated = records.slice(startIndex, startIndex + limitNum);

    return success(
      res,
      {
        attendance: paginated,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages,
          hasNext: pageNum < totalPages,
          hasPrev: pageNum > 1,
        },
      },
      'Attendance fetched successfully'
    );
  } catch (err) {
    next(err);
  }
}

// ==================== GET ONE ====================
export async function getAttendanceById(req, res, next) {
  try {
    const record = await getById(COLLECTION, req.params.id);
    if (!record) return error(res, 'Attendance record not found', 404);
    return success(res, record, 'Attendance record fetched');
  } catch (err) {
    next(err);
  }
}

// ==================== GET CLASS + DATE ====================
export async function getClassAttendance(req, res, next) {
  try {
    const { classId, date } = req.params;

    const [cls, students, records] = await Promise.all([
      getById('classes', classId),
      getAll('students'),
      getAll(COLLECTION),
    ]);

    if (!cls) return error(res, 'Class not found', 404);

    const classStudents = students
      .filter((s) => s.classId === classId && s.status === 'active')
      .sort((a, b) => (a.firstName || '').localeCompare(b.firstName || ''));

    const dayRecords = records.filter(
      (r) => r.classId === classId && r.date === date
    );

    const items = classStudents.map((s) => {
      const existing = dayRecords.find((r) => r.studentId === s.id);
      return {
        student: s,
        attendance: existing || null,
        status: existing?.status || null,
        remark: existing?.remark || '',
        attendanceId: existing?.id || null,
      };
    });

    const summary = {
      total: classStudents.length,
      present: dayRecords.filter((r) => r.status === 'present').length,
      absent: dayRecords.filter((r) => r.status === 'absent').length,
      late: dayRecords.filter((r) => r.status === 'late').length,
      permission: dayRecords.filter((r) => r.status === 'permission').length,
      marked: dayRecords.length,
      unmarked: Math.max(0, classStudents.length - dayRecords.length),
    };

    return success(
      res,
      { class: cls, date, items, summary },
      'Class attendance fetched'
    );
  } catch (err) {
    next(err);
  }
}

// ==================== TODAY STATS ====================
export async function getTodayStats(req, res, next) {
  try {
    const today = new Date().toISOString().split('T')[0];
    const [records, students] = await Promise.all([
      getAll(COLLECTION),
      getAll('students'),
    ]);

    const todayRecords = records.filter((r) => r.date === today);
    const activeStudents = students.filter((s) => s.status === 'active');

    const present = todayRecords.filter((r) => r.status === 'present').length;
    const absent = todayRecords.filter((r) => r.status === 'absent').length;
    const late = todayRecords.filter((r) => r.status === 'late').length;
    const permission = todayRecords.filter(
      (r) => r.status === 'permission'
    ).length;

    return success(
      res,
      {
        date: today,
        totalStudents: activeStudents.length,
        marked: todayRecords.length,
        unmarked: Math.max(0, activeStudents.length - todayRecords.length),
        present,
        absent,
        late,
        permission,
        attendancePercentage:
          todayRecords.length > 0
            ? Math.round((present / todayRecords.length) * 100)
            : 0,
      },
      'Today stats fetched'
    );
  } catch (err) {
    next(err);
  }
}

// ==================== MONTHLY REPORT ====================
export async function getMonthlyReport(req, res, next) {
  try {
    const { month, year, classId = '', studentId = '' } = req.query;

    if (!month || !year) {
      return error(res, 'month and year query params are required', 400);
    }

    const mm = String(month).padStart(2, '0');
    const prefix = `${year}-${mm}`;

    const [records, students, classes] = await Promise.all([
      getAll(COLLECTION),
      getAll('students'),
      getAll('classes'),
    ]);

    let monthRecords = records.filter((r) => r.date?.startsWith(prefix));

    if (classId) {
      const studentIds = students
        .filter((s) => s.classId === classId)
        .map((s) => s.id);
      monthRecords = monthRecords.filter((r) =>
        studentIds.includes(r.studentId)
      );
    }

    if (studentId) {
      monthRecords = monthRecords.filter((r) => r.studentId === studentId);
    }

    const byStudent = {};
    monthRecords.forEach((r) => {
      if (!byStudent[r.studentId]) {
        byStudent[r.studentId] = {
          present: 0,
          absent: 0,
          late: 0,
          permission: 0,
          total: 0,
        };
      }
      byStudent[r.studentId][r.status] =
        (byStudent[r.studentId][r.status] || 0) + 1;
      byStudent[r.studentId].total++;
    });

    const report = Object.entries(byStudent).map(([sid, counts]) => {
      const student = students.find((s) => s.id === sid);
      const cls = student ? classes.find((c) => c.id === student.classId) : null;
      return {
        studentId: sid,
        student: student || null,
        class: cls || null,
        ...counts,
        percentage:
          counts.total > 0
            ? Math.round((counts.present / counts.total) * 100)
            : 0,
      };
    });

    return success(
      res,
      {
        month: Number(month),
        year: Number(year),
        classId: classId || null,
        studentId: studentId || null,
        report,
        totals: {
          students: report.length,
          records: monthRecords.length,
        },
      },
      'Monthly report generated'
    );
  } catch (err) {
    next(err);
  }
}

// ==================== STUDENT STATS ====================
export async function getStudentStats(req, res, next) {
  try {
    const { studentId } = req.params;
    const student = await getById('students', studentId);
    if (!student) return error(res, 'Student not found', 404);

    const records = await getAll(COLLECTION);
    const studentRecords = records.filter((r) => r.studentId === studentId);

    const present = studentRecords.filter((r) => r.status === 'present').length;
    const absent = studentRecords.filter((r) => r.status === 'absent').length;
    const late = studentRecords.filter((r) => r.status === 'late').length;
    const permission = studentRecords.filter(
      (r) => r.status === 'permission'
    ).length;

    return success(
      res,
      {
        studentId,
        student,
        total: studentRecords.length,
        present,
        absent,
        late,
        permission,
        percentage:
          studentRecords.length > 0
            ? Math.round((present / studentRecords.length) * 100)
            : 0,
      },
      'Student attendance stats fetched'
    );
  } catch (err) {
    next(err);
  }
}

// ==================== CREATE ONE ====================
export async function createAttendance(req, res, next) {
  try {
    const { studentId, classId, date, status, remark = '' } = req.body;

    if (!VALID_STATUSES.includes(status)) {
      return error(
        res,
        `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`,
        400
      );
    }

    const student = await getById('students', studentId);
    if (!student) return error(res, 'Student not found', 404);

    const records = await getAll(COLLECTION);
    const existing = records.find(
      (r) => r.studentId === studentId && r.date === date
    );
    if (existing) {
      return error(
        res,
        'Attendance already exists for this student on this date. Use PUT to update.',
        409
      );
    }

    const record = {
      id: generateId('att'),
      studentId,
      classId: classId || student.classId,
      academicYear: student.academicYear || '',
      date,
      status,
      remark,
      recordedBy: req.user?.id || 'system',
      createdAt: now(),
    };

    await create(COLLECTION, record);
    return success(res, record, 'Attendance recorded', 201);
  } catch (err) {
    next(err);
  }
}

// ==================== BULK UPSERT ====================
export async function bulkAttendance(req, res, next) {
  try {
    const { classId, date, academicYear = '', records = [] } = req.body;

    if (!classId || !date || !Array.isArray(records)) {
      return error(res, 'classId, date and records[] are required', 400);
    }

    for (const r of records) {
      if (!VALID_STATUSES.includes(r.status)) {
        return error(
          res,
          `Invalid status "${r.status}" for student ${r.studentId}`,
          400
        );
      }
    }

    const cls = await getById('classes', classId);
    if (!cls) return error(res, 'Class not found', 404);

    const db = await readDB();
    const list = db[COLLECTION] || [];

    let created = 0;
    let updated = 0;

    for (const item of records) {
      const { studentId, status, remark = '' } = item;
      const idx = list.findIndex(
        (r) => r.studentId === studentId && r.date === date
      );

      if (idx >= 0) {
        list[idx] = {
          ...list[idx],
          status,
          remark,
          classId,
          academicYear: academicYear || list[idx].academicYear,
          updatedAt: now(),
        };
        updated++;
      } else {
        list.push({
          id: generateId('att'),
          studentId,
          classId,
          academicYear,
          date,
          status,
          remark,
          recordedBy: req.user?.id || 'system',
          createdAt: now(),
        });
        created++;
      }
    }

    db[COLLECTION] = list;
    await writeDB(db);

    // 🔔 Push notification (inside the function)
    await pushNotification({
      title: 'Attendance marked',
      message: `Attendance saved for class on ${date}.`,
      type: 'attendance_marked',
      targetRoles: ['super_admin', 'admin'],
      link: '/attendance',
    });

    return success(
      res,
      { classId, date, created, updated, total: records.length },
      `Attendance saved (${created} new, ${updated} updated)`
    );
  } catch (err) {
    next(err);
  }
}

// ==================== UPDATE ONE ====================
export async function updateAttendance(req, res, next) {
  try {
    const existing = await getById(COLLECTION, req.params.id);
    if (!existing) return error(res, 'Attendance not found', 404);

    if (req.body.status && !VALID_STATUSES.includes(req.body.status)) {
      return error(
        res,
        `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`,
        400
      );
    }

    const { id, createdAt, ...allowed } = req.body;
    const updated = await update(COLLECTION, req.params.id, {
      ...allowed,
      updatedAt: now(),
    });

    return success(res, updated, 'Attendance updated');
  } catch (err) {
    next(err);
  }
}

// ==================== DELETE ====================
export async function deleteAttendance(req, res, next) {
  try {
    const existing = await getById(COLLECTION, req.params.id);
    if (!existing) return error(res, 'Attendance not found', 404);

    await remove(COLLECTION, req.params.id);
    return success(res, { id: req.params.id }, 'Attendance deleted');
  } catch (err) {
    next(err);
  }
}