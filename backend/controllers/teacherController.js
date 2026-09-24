import {
  getAll,
  getById,
  create,
  update,
  remove,
} from '../utils/fileHandler.js';
import { success, error } from '../utils/response.js';
import { generateId, generateTeacherId, now } from '../utils/helpers.js';

const COLLECTION = 'teachers';

// ==================== GET ALL ====================
export async function getTeachers(req, res, next) {
  try {
    const {
      search = '',
      gender = '',
      status = '',
      position = '',
      subjectId = '',
      classId = '',
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      order = 'desc',
    } = req.query;

    let teachers = await getAll(COLLECTION);

    // Search
    if (search) {
      const q = search.toLowerCase();
      teachers = teachers.filter(
        (t) =>
          t.firstName?.toLowerCase().includes(q) ||
          t.lastName?.toLowerCase().includes(q) ||
          t.khmerName?.includes(search) ||
          t.teacherId?.toLowerCase().includes(q) ||
          t.email?.toLowerCase().includes(q) ||
          t.phone?.includes(search)
      );
    }

    // Filters
    if (gender) teachers = teachers.filter((t) => t.gender === gender);
    if (status) teachers = teachers.filter((t) => t.status === status);
    if (position)
      teachers = teachers.filter((t) =>
        t.position?.toLowerCase().includes(position.toLowerCase())
      );
    if (subjectId)
      teachers = teachers.filter((t) => t.subjects?.includes(subjectId));
    if (classId)
      teachers = teachers.filter((t) => t.classes?.includes(classId));

    // Sort
    teachers.sort((a, b) => {
      const A = a[sortBy] ?? '';
      const B = b[sortBy] ?? '';
      if (A < B) return order === 'asc' ? -1 : 1;
      if (A > B) return order === 'asc' ? 1 : -1;
      return 0;
    });

    // Pagination
    const total = teachers.length;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.max(1, parseInt(limit));
    const totalPages = Math.ceil(total / limitNum);
    const startIndex = (pageNum - 1) * limitNum;
    const paginated = teachers.slice(startIndex, startIndex + limitNum);

    return success(
      res,
      {
        teachers: paginated,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages,
          hasNext: pageNum < totalPages,
          hasPrev: pageNum > 1,
        },
      },
      'Teachers fetched successfully'
    );
  } catch (err) {
    next(err);
  }
}

// ==================== GET ONE ====================
export async function getTeacher(req, res, next) {
  try {
    const teacher = await getById(COLLECTION, req.params.id);
    if (!teacher) return error(res, 'Teacher not found', 404);
    return success(res, teacher, 'Teacher fetched successfully');
  } catch (err) {
    next(err);
  }
}

// ==================== GET PROFILE ====================
/**
 * Returns teacher + subjects + classes + student counts
 */
export async function getTeacherProfile(req, res, next) {
  try {
    const teacher = await getById(COLLECTION, req.params.id);
    if (!teacher) return error(res, 'Teacher not found', 404);

    const [subjects, classes, students] = await Promise.all([
      getAll('subjects'),
      getAll('classes'),
      getAll('students'),
    ]);

    // Subjects this teacher teaches (by teacherId OR by being in teacher.subjects)
    const teacherSubjects = subjects.filter(
      (s) =>
        s.teacherId === teacher.id || (teacher.subjects || []).includes(s.id)
    );

    // Classes this teacher teaches (by classTeacher OR by being in teacher.classes)
    const teacherClasses = classes.filter(
      (c) =>
        c.classTeacher === teacher.id || (teacher.classes || []).includes(c.id)
    );

    // For each class, count students
    const classesWithCounts = teacherClasses.map((c) => ({
      ...c,
      studentCount: students.filter((s) => s.classId === c.id && s.status === 'active')
        .length,
    }));

    return success(
      res,
      {
        teacher,
        subjects: teacherSubjects,
        classes: classesWithCounts,
        totalStudents: classesWithCounts.reduce(
          (sum, c) => sum + c.studentCount,
          0
        ),
      },
      'Teacher profile fetched successfully'
    );
  } catch (err) {
    next(err);
  }
}

// ==================== GET STATS ====================
export async function getTeacherStats(req, res, next) {
  try {
    const teachers = await getAll(COLLECTION);

    const stats = {
      total: teachers.length,
      active: teachers.filter((t) => t.status === 'active').length,
      inactive: teachers.filter((t) => t.status === 'inactive').length,
      male: teachers.filter((t) => t.gender === 'male').length,
      female: teachers.filter((t) => t.gender === 'female').length,
    };

    return success(res, stats, 'Teacher stats fetched successfully');
  } catch (err) {
    next(err);
  }
}

// ==================== CREATE ====================
export async function createTeacher(req, res, next) {
  try {
    const existing = await getAll(COLLECTION);

    // Duplicate teacherId
    if (req.body.teacherId) {
      if (existing.some((t) => t.teacherId === req.body.teacherId)) {
        return error(
          res,
          `Teacher ID '${req.body.teacherId}' already exists`,
          409
        );
      }
    }

    const teacherId = req.body.teacherId || generateTeacherId(existing);

    const newTeacher = {
      id: generateId('t'),
      teacherId,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      khmerName: req.body.khmerName || '',
      gender: req.body.gender,
      dateOfBirth: req.body.dateOfBirth || '',
      photo: req.body.photo || '',
      phone: req.body.phone || '',
      email: req.body.email || '',
      address: req.body.address || '',
      position: req.body.position || 'Teacher',
      subjects: Array.isArray(req.body.subjects) ? req.body.subjects : [],
      classes: Array.isArray(req.body.classes) ? req.body.classes : [],
      hireDate: req.body.hireDate || now().split('T')[0],
      status: req.body.status || 'active',
      createdAt: now(),
    };

    await create(COLLECTION, newTeacher);
    return success(res, newTeacher, 'Teacher created successfully', 201);
  } catch (err) {
    next(err);
  }
}

// ==================== UPDATE ====================
export async function updateTeacher(req, res, next) {
  try {
    const existing = await getById(COLLECTION, req.params.id);
    if (!existing) return error(res, 'Teacher not found', 404);

    if (req.body.teacherId && req.body.teacherId !== existing.teacherId) {
      const all = await getAll(COLLECTION);
      if (
        all.some(
          (t) => t.teacherId === req.body.teacherId && t.id !== req.params.id
        )
      ) {
        return error(
          res,
          `Teacher ID '${req.body.teacherId}' already exists`,
          409
        );
      }
    }

    const { id, createdAt, ...allowed } = req.body;

    const updated = await update(COLLECTION, req.params.id, {
      ...allowed,
      updatedAt: now(),
    });

    return success(res, updated, 'Teacher updated successfully');
  } catch (err) {
    next(err);
  }
}

// ==================== ASSIGN SUBJECTS / CLASSES ====================
/**
 * Body: { subjects: [ids], classes: [ids] }
 * Replaces the full list (idempotent)
 */
export async function assignTeacher(req, res, next) {
  try {
    const teacher = await getById(COLLECTION, req.params.id);
    if (!teacher) return error(res, 'Teacher not found', 404);

    const updates = {};
    if (Array.isArray(req.body.subjects)) updates.subjects = req.body.subjects;
    if (Array.isArray(req.body.classes)) updates.classes = req.body.classes;

    if (Object.keys(updates).length === 0) {
      return error(res, 'Provide subjects[] and/or classes[]', 400);
    }

    const updated = await update(COLLECTION, req.params.id, {
      ...updates,
      updatedAt: now(),
    });

    return success(res, updated, 'Teacher assignments updated');
  } catch (err) {
    next(err);
  }
}

// ==================== SOFT DELETE ====================
export async function deleteTeacher(req, res, next) {
  try {
    const existing = await getById(COLLECTION, req.params.id);
    if (!existing) return error(res, 'Teacher not found', 404);

    await update(COLLECTION, req.params.id, {
      status: 'inactive',
      deactivatedAt: now(),
    });

    return success(
      res,
      { id: req.params.id },
      'Teacher deactivated successfully'
    );
  } catch (err) {
    next(err);
  }
}

// ==================== HARD DELETE ====================
export async function hardDeleteTeacher(req, res, next) {
  try {
    const existing = await getById(COLLECTION, req.params.id);
    if (!existing) return error(res, 'Teacher not found', 404);

    await remove(COLLECTION, req.params.id);
    return success(res, { id: req.params.id }, 'Teacher permanently deleted');
  } catch (err) {
    next(err);
  }
}