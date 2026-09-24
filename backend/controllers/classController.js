import {
  getAll,
  getById,
  create,
  update,
  remove,
} from '../utils/fileHandler.js';
import { success, error } from '../utils/response.js';
import { generateId, now, calculateGradeDetails } from '../utils/helpers.js';

const COLLECTION = 'classes';

// ==================== GET ALL (with counts) ====================
export async function getClasses(req, res, next) {
  try {
    const {
      search = '',
      grade = '',
      academicYear = '',
      status = '',
      page = 1,
      limit = 20,
      sortBy = 'grade',
      order = 'asc',
      withCounts = 'false',
    } = req.query;

    let classes = await getAll(COLLECTION);

    if (search) {
      const q = search.toLowerCase();
      classes = classes.filter(
        (c) =>
          c.className?.toLowerCase().includes(q) ||
          c.classId?.toLowerCase().includes(q) ||
          c.room?.toLowerCase().includes(q)
      );
    }
    if (grade) classes = classes.filter((c) => String(c.grade) === String(grade));
    if (academicYear)
      classes = classes.filter((c) => c.academicYear === academicYear);
    if (status) classes = classes.filter((c) => c.status === status);

    classes.sort((a, b) => {
      const A = a[sortBy] ?? '';
      const B = b[sortBy] ?? '';
      if (A < B) return order === 'asc' ? -1 : 1;
      if (A > B) return order === 'asc' ? 1 : -1;
      return 0;
    });

    // Optionally attach counts + teacher name (used by sidebar menu)
    if (withCounts === 'true') {
      const [students, teachers] = await Promise.all([
        getAll('students'),
        getAll('teachers'),
      ]);
      classes = classes.map((c) => {
        const classStudents = students.filter(
          (s) => s.classId === c.id && s.status === 'active'
        );
        const teacher = teachers.find((t) => t.id === c.classTeacher);
        return {
          ...c,
          studentCount: classStudents.length,
          maleCount: classStudents.filter((s) => s.gender === 'male').length,
          femaleCount: classStudents.filter((s) => s.gender === 'female').length,
          teacherName: teacher ? `${teacher.firstName} ${teacher.lastName}` : null,
          teacherPhoto: teacher?.photo || '',
        };
      });
    }

    const total = classes.length;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.max(1, parseInt(limit));
    const totalPages = Math.ceil(total / limitNum);
    const startIndex = (pageNum - 1) * limitNum;
    const paginated = classes.slice(startIndex, startIndex + limitNum);

    return success(
      res,
      {
        classes: paginated,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages,
          hasNext: pageNum < totalPages,
          hasPrev: pageNum > 1,
        },
      },
      'Classes fetched successfully'
    );
  } catch (err) {
    next(err);
  }
}

// ==================== GET ONE ====================
export async function getClass(req, res, next) {
  try {
    const cls = await getById(COLLECTION, req.params.id);
    if (!cls) return error(res, 'Class not found', 404);
    return success(res, cls, 'Class fetched successfully');
  } catch (err) {
    next(err);
  }
}

// ==================== GET CLASS + STUDENTS + SUBJECTS + STATS ====================
export async function getClassStudents(req, res, next) {
  try {
    const cls = await getById(COLLECTION, req.params.id);
    if (!cls) return error(res, 'Class not found', 404);

    const [students, teachers, subjects, scores, attendance] = await Promise.all([
      getAll('students'),
      getAll('teachers'),
      getAll('subjects'),
      getAll('scores'),
      getAll('attendance'),
    ]);

    const classStudents = students.filter((s) => s.classId === cls.id);
    const activeStudents = classStudents.filter((s) => s.status === 'active');
    const classTeacher =
      teachers.find((t) => t.id === cls.classTeacher) || null;
    const classSubjects = subjects.filter(
      (s) => String(s.grade) === String(cls.grade) && s.status === 'active'
    );

    // Attendance summary for this class
    const classAttendance = attendance.filter((a) => a.classId === cls.id);
    const presentCount = classAttendance.filter(
      (a) => a.status === 'present'
    ).length;
    const attendanceRate =
      classAttendance.length > 0
        ? Math.round((presentCount / classAttendance.length) * 100)
        : 0;

    // Average score for this class
    const classScores = scores.filter((s) => s.classId === cls.id);
    const totalScore = classScores.reduce((sum, s) => sum + (s.score || 0), 0);
    const totalMax = classScores.reduce(
      (sum, s) => sum + (s.maxScore || 100),
      0
    );
    const avgScore =
      totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : 0;

    return success(
      res,
      {
        class: cls,
        classTeacher,
        students: classStudents,
        subjects: classSubjects,
        stats: {
          totalStudents: classStudents.length,
          activeStudents: activeStudents.length,
          male: activeStudents.filter((s) => s.gender === 'male').length,
          female: activeStudents.filter((s) => s.gender === 'female').length,
          attendanceRate,
          avgScore,
        },
      },
      'Class students fetched successfully'
    );
  } catch (err) {
    next(err);
  }
}

// ==================== CLASS GRADING (auto-calc) ====================
/**
 * GET /api/classes/:classId/grading?subjectId=&type=&month=
 * Returns per-student scores + auto-calculated total/average/grade
 */
export async function getClassGrading(req, res, next) {
  try {
    const { classId } = req.params;
    const { subjectId = '', type = '', month = '' } = req.query;

    const cls = await getById(COLLECTION, classId);
    if (!cls) return error(res, 'Class not found', 404);

    const [students, scores, subjects] = await Promise.all([
      getAll('students'),
      getAll('scores'),
      getAll('subjects'),
    ]);

    const classStudents = students
      .filter((s) => s.classId === classId && s.status === 'active')
      .sort((a, b) => (a.firstName || '').localeCompare(b.firstName || ''));

    const classSubjects = subjects.filter(
      (s) => String(s.grade) === String(cls.grade) && s.status === 'active'
    );

    // Build per-student row with all their scores (filtered by subject/type if provided)
    const rows = classStudents.map((student) => {
      let studentScores = scores.filter((s) => s.studentId === student.id);
      if (subjectId)
        studentScores = studentScores.filter((s) => s.subjectId === subjectId);
      if (type) studentScores = studentScores.filter((s) => s.type === type);
      if (month) studentScores = studentScores.filter((s) => s.month === month);

      const total = studentScores.reduce((sum, s) => sum + (s.score || 0), 0);
      const maxTotal = studentScores.reduce(
        (sum, s) => sum + (s.maxScore || 100),
        0
      );
      const average =
        studentScores.length > 0
          ? Math.round((total / studentScores.length) * 100) / 100
          : 0;
      const percentage =
        maxTotal > 0 ? Math.round((total / maxTotal) * 100) : 0;
      const details = calculateGradeDetails(total, maxTotal || 1);

      return {
        student,
        scoreCount: studentScores.length,
        total,
        maxTotal,
        average,
        percentage,
        grade: details.grade,
        remark: details.remark,
        scores: studentScores,
      };
    });

    // Class-level average
    const classTotal = rows.reduce((sum, r) => sum + r.total, 0);
    const classMax = rows.reduce((sum, r) => sum + r.maxTotal, 0);
    const classAverage =
      classMax > 0 ? Math.round((classTotal / classMax) * 100) : 0;

    // Rank
    const ranked = [...rows]
      .sort((a, b) => b.average - a.average)
      .map((row, idx) => ({ studentId: row.student.id, rank: idx + 1 }));
    const rankMap = Object.fromEntries(
      ranked.map((r) => [r.studentId, r.rank])
    );
    rows.forEach((row) => {
      row.rank = rankMap[row.student.id] || 0;
    });

    return success(
      res,
      {
        class: cls,
        subjects: classSubjects,
        rows,
        summary: {
          totalStudents: rows.length,
          classAverage,
          totalScores: rows.reduce((sum, r) => sum + r.scoreCount, 0),
        },
      },
      'Class grading fetched'
    );
  } catch (err) {
    next(err);
  }
}

// ==================== CLASS ATTENDANCE SUMMARY ====================
/**
 * GET /api/classes/:classId/attendance-summary?month=10&year=2024
 * Returns per-student attendance counts + class totals
 */
export async function getClassAttendanceSummary(req, res, next) {
  try {
    const { classId } = req.params;
    const { month = '', year = '' } = req.query;

    const cls = await getById(COLLECTION, classId);
    if (!cls) return error(res, 'Class not found', 404);

    const [students, attendance] = await Promise.all([
      getAll('students'),
      getAll('attendance'),
    ]);

    const classStudents = students
      .filter((s) => s.classId === classId && s.status === 'active')
      .sort((a, b) => (a.firstName || '').localeCompare(b.firstName || ''));

    let classRecords = attendance.filter((a) => a.classId === classId);

    // Filter by month/year if provided
    if (month && year) {
      const prefix = `${year}-${String(month).padStart(2, '0')}`;
      classRecords = classRecords.filter((a) => a.date?.startsWith(prefix));
    }

    const rows = classStudents.map((student) => {
      const sRecords = classRecords.filter((r) => r.studentId === student.id);
      const present = sRecords.filter((r) => r.status === 'present').length;
      const absent = sRecords.filter((r) => r.status === 'absent').length;
      const late = sRecords.filter((r) => r.status === 'late').length;
      const permission = sRecords.filter(
        (r) => r.status === 'permission'
      ).length;
      const total = sRecords.length;
      const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

      return {
        student,
        present,
        absent,
        late,
        permission,
        total,
        percentage,
      };
    });

    // Class summary
    const classSummary = {
      totalStudents: rows.length,
      totalRecords: classRecords.length,
      present: classRecords.filter((r) => r.status === 'present').length,
      absent: classRecords.filter((r) => r.status === 'absent').length,
      late: classRecords.filter((r) => r.status === 'late').length,
      permission: classRecords.filter((r) => r.status === 'permission').length,
    };
    classSummary.rate =
      classSummary.totalRecords > 0
        ? Math.round(
            (classSummary.present / classSummary.totalRecords) * 100
          )
        : 0;

    return success(
      res,
      {
        class: cls,
        rows,
        summary: classSummary,
        filters: { month: month || null, year: year || null },
      },
      'Class attendance summary fetched'
    );
  } catch (err) {
    next(err);
  }
}

// ==================== STATS ====================
export async function getClassStats(req, res, next) {
  try {
    const [classes, students] = await Promise.all([
      getAll(COLLECTION),
      getAll('students'),
    ]);

    const activeClasses = classes.filter((c) => c.status === 'active');
    const totalCapacity = activeClasses.reduce(
      (sum, c) => sum + (c.maxStudents || 0),
      0
    );
    const enrolled = students.filter((s) => s.status === 'active').length;

    const byGrade = {};
    activeClasses.forEach((c) => {
      byGrade[c.grade] = (byGrade[c.grade] || 0) + 1;
    });

    return success(
      res,
      {
        total: classes.length,
        active: activeClasses.length,
        byGrade,
        totalCapacity,
        totalEnrolled: enrolled,
        occupancyRate:
          totalCapacity > 0 ? Math.round((enrolled / totalCapacity) * 100) : 0,
      },
      'Class stats fetched'
    );
  } catch (err) {
    next(err);
  }
}

// ==================== CREATE ====================
export async function createClass(req, res, next) {
  try {
    const existing = await getAll(COLLECTION);

    const duplicate = existing.find(
      (c) =>
        c.className?.toLowerCase() === req.body.className?.toLowerCase() &&
        c.academicYear === req.body.academicYear
    );
    if (duplicate) {
      return error(
        res,
        `Class '${req.body.className}' already exists for ${req.body.academicYear}`,
        409
      );
    }

    const newClass = {
      id: generateId('c'),
      classId:
        req.body.classId ||
        `CLS${String(existing.length + 1).padStart(3, '0')}`,
      className: req.body.className,
      grade: Number(req.body.grade) || 0,
      section: req.body.section || '',
      room: req.body.room || '',
      academicYear: req.body.academicYear || '',
      classTeacher: req.body.classTeacher || '',
      maxStudents: Number(req.body.maxStudents) || 40,
      status: req.body.status || 'active',
      createdAt: now(),
    };

    await create(COLLECTION, newClass);
    return success(res, newClass, 'Class created successfully', 201);
  } catch (err) {
    next(err);
  }
}

// ==================== UPDATE ====================
export async function updateClass(req, res, next) {
  try {
    const existing = await getById(COLLECTION, req.params.id);
    if (!existing) return error(res, 'Class not found', 404);

    const { id, createdAt, ...allowed } = req.body;

    const updated = await update(COLLECTION, req.params.id, {
      ...allowed,
      grade:
        allowed.grade !== undefined ? Number(allowed.grade) : existing.grade,
      maxStudents:
        allowed.maxStudents !== undefined
          ? Number(allowed.maxStudents)
          : existing.maxStudents,
      updatedAt: now(),
    });

    return success(res, updated, 'Class updated successfully');
  } catch (err) {
    next(err);
  }
}

// ==================== ASSIGN TEACHER ====================
export async function assignTeacherToClass(req, res, next) {
  try {
    const cls = await getById(COLLECTION, req.params.id);
    if (!cls) return error(res, 'Class not found', 404);

    const { teacherId = '' } = req.body;

    if (teacherId) {
      const teacher = await getById('teachers', teacherId);
      if (!teacher) return error(res, 'Teacher not found', 404);
    }

    const updated = await update(COLLECTION, req.params.id, {
      classTeacher: teacherId,
      updatedAt: now(),
    });

    return success(res, updated, 'Class teacher assigned');
  } catch (err) {
    next(err);
  }
}

// ==================== SOFT DELETE ====================
export async function deleteClass(req, res, next) {
  try {
    const existing = await getById(COLLECTION, req.params.id);
    if (!existing) return error(res, 'Class not found', 404);

    const students = await getAll('students');
    const enrolled = students.filter(
      (s) => s.classId === req.params.id && s.status === 'active'
    );

    if (enrolled.length > 0) {
      return error(
        res,
        `Cannot delete: ${enrolled.length} active student(s) still enrolled. Reassign them first.`,
        400
      );
    }

    await update(COLLECTION, req.params.id, {
      status: 'inactive',
      deactivatedAt: now(),
    });

    return success(
      res,
      { id: req.params.id },
      'Class deactivated successfully'
    );
  } catch (err) {
    next(err);
  }
}

// ==================== HARD DELETE ====================
export async function hardDeleteClass(req, res, next) {
  try {
    const existing = await getById(COLLECTION, req.params.id);
    if (!existing) return error(res, 'Class not found', 404);

    await remove(COLLECTION, req.params.id);
    return success(res, { id: req.params.id }, 'Class permanently deleted');
  } catch (err) {
    next(err);
  }
}