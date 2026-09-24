import {
  getAll,
  getById,
  create,
  update,
  remove,
} from '../utils/fileHandler.js';
import { success, error } from '../utils/response.js';
import { generateId, now } from '../utils/helpers.js';

const COLLECTION = 'subjects';

// ==================== GET ALL ====================
export async function getSubjects(req, res, next) {
  try {
    const {
      search = '',
      grade = '',
      teacherId = '',
      status = '',
      page = 1,
      limit = 20,
      sortBy = 'subjectName',
      order = 'asc',
    } = req.query;

    let subjects = await getAll(COLLECTION);

    // Search
    if (search) {
      const q = search.toLowerCase();
      subjects = subjects.filter(
        (s) =>
          s.subjectName?.toLowerCase().includes(q) ||
          s.subjectId?.toLowerCase().includes(q) ||
          s.khmerName?.includes(search) ||
          s.description?.toLowerCase().includes(q)
      );
    }

    // Filters
    if (grade) subjects = subjects.filter((s) => String(s.grade) === String(grade));
    if (teacherId) subjects = subjects.filter((s) => s.teacherId === teacherId);
    if (status) subjects = subjects.filter((s) => s.status === status);

    // Sort
    subjects.sort((a, b) => {
      const A = a[sortBy] ?? '';
      const B = b[sortBy] ?? '';
      if (A < B) return order === 'asc' ? -1 : 1;
      if (A > B) return order === 'asc' ? 1 : -1;
      return 0;
    });

    // Pagination
    const total = subjects.length;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.max(1, parseInt(limit));
    const totalPages = Math.ceil(total / limitNum);
    const startIndex = (pageNum - 1) * limitNum;
    const paginated = subjects.slice(startIndex, startIndex + limitNum);

    return success(
      res,
      {
        subjects: paginated,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages,
          hasNext: pageNum < totalPages,
          hasPrev: pageNum > 1,
        },
      },
      'Subjects fetched successfully'
    );
  } catch (err) {
    next(err);
  }
}

// ==================== GET ONE ====================
export async function getSubject(req, res, next) {
  try {
    const subject = await getById(COLLECTION, req.params.id);
    if (!subject) return error(res, 'Subject not found', 404);

    // Attach teacher info
    let teacher = null;
    if (subject.teacherId) {
      teacher = await getById('teachers', subject.teacherId);
    }

    return success(
      res,
      { ...subject, teacher },
      'Subject fetched successfully'
    );
  } catch (err) {
    next(err);
  }
}

// ==================== STATS ====================
export async function getSubjectStats(req, res, next) {
  try {
    const subjects = await getAll(COLLECTION);

    const byGrade = {};
    subjects.forEach((s) => {
      byGrade[s.grade] = (byGrade[s.grade] || 0) + 1;
    });

    return success(
      res,
      {
        total: subjects.length,
        active: subjects.filter((s) => s.status === 'active').length,
        inactive: subjects.filter((s) => s.status === 'inactive').length,
        withTeacher: subjects.filter((s) => s.teacherId).length,
        withoutTeacher: subjects.filter((s) => !s.teacherId).length,
        byGrade,
      },
      'Subject stats fetched successfully'
    );
  } catch (err) {
    next(err);
  }
}

// ==================== CREATE ====================
export async function createSubject(req, res, next) {
  try {
    const existing = await getAll(COLLECTION);

    const newSubject = {
      id: generateId('sub'),
      subjectId:
        req.body.subjectId ||
        `SUB${String(existing.length + 1).padStart(3, '0')}`,
      subjectName: req.body.subjectName,
      khmerName: req.body.khmerName || '',
      description: req.body.description || '',
      teacherId: req.body.teacherId || '',
      grade: Number(req.body.grade) || 0,
      status: req.body.status || 'active',
      createdAt: now(),
    };

    // Duplicate check: same name + grade
    const duplicate = existing.find(
      (s) =>
        s.subjectName?.toLowerCase() === newSubject.subjectName?.toLowerCase() &&
        String(s.grade) === String(newSubject.grade)
    );
    if (duplicate) {
      return error(
        res,
        `Subject '${newSubject.subjectName}' already exists for Grade ${newSubject.grade}`,
        409
      );
    }

    // Validate teacher if provided
    if (newSubject.teacherId) {
      const teacher = await getById('teachers', newSubject.teacherId);
      if (!teacher) return error(res, 'Assigned teacher not found', 404);
    }

    await create(COLLECTION, newSubject);
    return success(res, newSubject, 'Subject created successfully', 201);
  } catch (err) {
    next(err);
  }
}

// ==================== UPDATE ====================
export async function updateSubject(req, res, next) {
  try {
    const existing = await getById(COLLECTION, req.params.id);
    if (!existing) return error(res, 'Subject not found', 404);

    // Validate teacher if changing
    if (req.body.teacherId && req.body.teacherId !== existing.teacherId) {
      const teacher = await getById('teachers', req.body.teacherId);
      if (!teacher) return error(res, 'Assigned teacher not found', 404);
    }

    const { id, createdAt, teacher, ...allowed } = req.body;

    const updated = await update(COLLECTION, req.params.id, {
      ...allowed,
      grade: allowed.grade !== undefined ? Number(allowed.grade) : existing.grade,
      updatedAt: now(),
    });

    return success(res, updated, 'Subject updated successfully');
  } catch (err) {
    next(err);
  }
}

// ==================== ASSIGN TEACHER ====================
export async function assignTeacherToSubject(req, res, next) {
  try {
    const subject = await getById(COLLECTION, req.params.id);
    if (!subject) return error(res, 'Subject not found', 404);

    const { teacherId = '' } = req.body;

    if (teacherId) {
      const teacher = await getById('teachers', teacherId);
      if (!teacher) return error(res, 'Teacher not found', 404);
    }

    const updated = await update(COLLECTION, req.params.id, {
      teacherId,
      updatedAt: now(),
    });

    return success(res, updated, 'Teacher assigned to subject');
  } catch (err) {
    next(err);
  }
}

// ==================== SOFT DELETE ====================
export async function deleteSubject(req, res, next) {
  try {
    const existing = await getById(COLLECTION, req.params.id);
    if (!existing) return error(res, 'Subject not found', 404);

    // Prevent deletion if scores exist
    const scores = await getAll('scores');
    const subjectScores = scores.filter((s) => s.subjectId === req.params.id);
    if (subjectScores.length > 0) {
      return error(
        res,
        `Cannot delete: ${subjectScores.length} score record(s) linked to this subject`,
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
      'Subject deactivated successfully'
    );
  } catch (err) {
    next(err);
  }
}

// ==================== HARD DELETE ====================
export async function hardDeleteSubject(req, res, next) {
  try {
    const existing = await getById(COLLECTION, req.params.id);
    if (!existing) return error(res, 'Subject not found', 404);

    await remove(COLLECTION, req.params.id);
    return success(res, { id: req.params.id }, 'Subject permanently deleted');
  } catch (err) {
    next(err);
  }
}