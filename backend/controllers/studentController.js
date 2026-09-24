import {
  getAll,
  getById,
  create,
  update,
  remove,
} from '../utils/fileHandler.js';
import { success, error } from '../utils/response.js';
import {
  generateId,
  generateStudentId,
  now,
} from '../utils/helpers.js';
import { pushNotification } from '../utils/notify.js';

const COLLECTION = 'students';

// ==================== GET ALL STUDENTS ====================
export async function getStudents(req, res, next) {
  try {
    const {
      search = '',
      classId = '',
      gender = '',
      academicYear = '',
      status = '',
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      order = 'desc',
    } = req.query;

    let students = await getAll(COLLECTION);

    if (search) {
      const q = search.toLowerCase();
      students = students.filter(
        (s) =>
          s.firstName?.toLowerCase().includes(q) ||
          s.lastName?.toLowerCase().includes(q) ||
          s.khmerName?.includes(search) ||
          s.studentId?.toLowerCase().includes(q) ||
          s.email?.toLowerCase().includes(q)
      );
    }

    if (classId) students = students.filter((s) => s.classId === classId);
    if (gender) students = students.filter((s) => s.gender === gender);
    if (academicYear)
      students = students.filter((s) => s.academicYear === academicYear);
    if (status) students = students.filter((s) => s.status === status);

    students.sort((a, b) => {
      const A = a[sortBy] ?? '';
      const B = b[sortBy] ?? '';
      if (A < B) return order === 'asc' ? -1 : 1;
      if (A > B) return order === 'asc' ? 1 : -1;
      return 0;
    });

    const total = students.length;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.max(1, parseInt(limit));
    const totalPages = Math.ceil(total / limitNum);
    const startIndex = (pageNum - 1) * limitNum;
    const paginated = students.slice(startIndex, startIndex + limitNum);

    return success(
      res,
      {
        students: paginated,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages,
          hasNext: pageNum < totalPages,
          hasPrev: pageNum > 1,
        },
      },
      'Students fetched successfully'
    );
  } catch (err) {
    next(err);
  }
}

// ==================== GET STUDENT BY ID ====================
export async function getStudent(req, res, next) {
  try {
    const student = await getById(COLLECTION, req.params.id);
    if (!student) return error(res, 'Student not found', 404);
    return success(res, student, 'Student fetched successfully');
  } catch (err) {
    next(err);
  }
}

// ==================== GET STUDENT PROFILE ====================
export async function getStudentProfile(req, res, next) {
  try {
    const student = await getById(COLLECTION, req.params.id);
    if (!student) return error(res, 'Student not found', 404);

    const [classes, attendance, scores, subjects, teachers] = await Promise.all([
      getAll('classes'),
      getAll('attendance'),
      getAll('scores'),
      getAll('subjects'),
      getAll('teachers'),
    ]);

    const studentClass = classes.find((c) => c.id === student.classId) || null;
    const classTeacher = studentClass
      ? teachers.find((t) => t.id === studentClass.classTeacher) || null
      : null;

    const studentAttendance = attendance.filter(
      (a) => a.studentId === student.id
    );
    const attendanceSummary = {
      total: studentAttendance.length,
      present: studentAttendance.filter((a) => a.status === 'present').length,
      absent: studentAttendance.filter((a) => a.status === 'absent').length,
      late: studentAttendance.filter((a) => a.status === 'late').length,
      permission: studentAttendance.filter((a) => a.status === 'permission')
        .length,
      percentage:
        studentAttendance.length > 0
          ? Math.round(
              (studentAttendance.filter((a) => a.status === 'present').length /
                studentAttendance.length) *
                100
            )
          : 0,
      records: studentAttendance,
    };

    const studentScores = scores.filter((s) => s.studentId === student.id);
    const scoresWithSubject = studentScores.map((sc) => ({
      ...sc,
      subject: subjects.find((sub) => sub.id === sc.subjectId) || null,
    }));

    const totalScore = studentScores.reduce((sum, s) => sum + (s.score || 0), 0);
    const totalMax = studentScores.reduce(
      (sum, s) => sum + (s.maxScore || 100),
      0
    );
    const average =
      studentScores.length > 0
        ? Math.round((totalScore / studentScores.length) * 100) / 100
        : 0;
    const percentage =
      totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : 0;

    const scoreSummary = {
      totalSubjects: studentScores.length,
      totalScore,
      average,
      percentage,
      records: scoresWithSubject,
    };

    return success(
      res,
      {
        student,
        class: studentClass,
        classTeacher,
        attendance: attendanceSummary,
        scores: scoreSummary,
      },
      'Student profile fetched successfully'
    );
  } catch (err) {
    next(err);
  }
}

// ==================== GET STATS ====================
export async function getStudentStats(req, res, next) {
  try {
    const students = await getAll(COLLECTION);

    const stats = {
      total: students.length,
      active: students.filter((s) => s.status === 'active').length,
      inactive: students.filter((s) => s.status === 'inactive').length,
      male: students.filter((s) => s.gender === 'male').length,
      female: students.filter((s) => s.gender === 'female').length,
    };

    return success(res, stats, 'Student stats fetched successfully');
  } catch (err) {
    next(err);
  }
}

// ==================== CREATE STUDENT ====================
export async function createStudent(req, res, next) {
  try {
    const existing = await getAll(COLLECTION);

    if (req.body.studentId) {
      const duplicate = existing.find(
        (s) => s.studentId === req.body.studentId
      );
      if (duplicate) {
        return error(
          res,
          `Student ID '${req.body.studentId}' already exists`,
          409
        );
      }
    }

    const studentId = req.body.studentId || generateStudentId(existing);

    const newStudent = {
      id: generateId('s'),
      studentId,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      khmerName: req.body.khmerName || '',
      gender: req.body.gender,
      dateOfBirth: req.body.dateOfBirth || '',
      photo: req.body.photo || '',
      phone: req.body.phone || '',
      email: req.body.email || '',
      address: req.body.address || '',
      parentName: req.body.parentName || '',
      parentPhone: req.body.parentPhone || '',
      emergencyContact: req.body.emergencyContact || '',
      classId: req.body.classId || '',
      academicYear: req.body.academicYear || '',
      enrollmentDate: req.body.enrollmentDate || now().split('T')[0],
      status: req.body.status || 'active',
      createdAt: now(),
    };

    await create(COLLECTION, newStudent);

    // 🔔 Push notification (inside the function)
    await pushNotification({
      title: 'New student enrolled',
      message: `${newStudent.firstName} ${newStudent.lastName} was added.`,
      type: 'student_created',
      targetRoles: ['super_admin', 'admin'],
      link: '/students',
    });

    return success(res, newStudent, 'Student created successfully', 201);
  } catch (err) {
    next(err);
  }
}

// ==================== UPDATE STUDENT ====================
export async function updateStudent(req, res, next) {
  try {
    const existing = await getById(COLLECTION, req.params.id);
    if (!existing) return error(res, 'Student not found', 404);

    if (req.body.studentId && req.body.studentId !== existing.studentId) {
      const all = await getAll(COLLECTION);
      const duplicate = all.find(
        (s) => s.studentId === req.body.studentId && s.id !== req.params.id
      );
      if (duplicate) {
        return error(
          res,
          `Student ID '${req.body.studentId}' already exists`,
          409
        );
      }
    }

    const { id, createdAt, ...allowedUpdates } = req.body;

    const updated = await update(COLLECTION, req.params.id, {
      ...allowedUpdates,
      updatedAt: now(),
    });

    return success(res, updated, 'Student updated successfully');
  } catch (err) {
    next(err);
  }
}

// ==================== DELETE STUDENT (soft) ====================
export async function deleteStudent(req, res, next) {
  try {
    const existing = await getById(COLLECTION, req.params.id);
    if (!existing) return error(res, 'Student not found', 404);

    await update(COLLECTION, req.params.id, {
      status: 'inactive',
      deactivatedAt: now(),
    });

    return success(
      res,
      { id: req.params.id },
      'Student deactivated successfully'
    );
  } catch (err) {
    next(err);
  }
}

// ==================== HARD DELETE ====================
export async function hardDeleteStudent(req, res, next) {
  try {
    const existing = await getById(COLLECTION, req.params.id);
    if (!existing) return error(res, 'Student not found', 404);

    await remove(COLLECTION, req.params.id);
    return success(res, { id: req.params.id }, 'Student permanently deleted');
  } catch (err) {
    next(err);
  }
}