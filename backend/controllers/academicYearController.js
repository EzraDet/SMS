import { getAll, getById, create, update, remove, readDB, writeDB } from '../utils/fileHandler.js';
import { success, error } from '../utils/response.js';
import { generateId, now } from '../utils/helpers.js';

const COLLECTION = 'academicYears';

// ==================== GET ALL ====================
export async function getAcademicYears(req, res, next) {
  try {
    const { status = '', page = 1, limit = 50 } = req.query;
    let years = await getAll(COLLECTION);

    if (status) years = years.filter((y) => y.status === status);

    // Sort: active first, then by name desc
    years.sort((a, b) => {
      if (a.isActive && !b.isActive) return -1;
      if (!a.isActive && b.isActive) return 1;
      return (b.name || '').localeCompare(a.name || '');
    });

    const total = years.length;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.max(1, parseInt(limit));
    const startIndex = (pageNum - 1) * limitNum;
    const paginated = years.slice(startIndex, startIndex + limitNum);

    return success(
      res,
      {
        academicYears: paginated,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum),
        },
      },
      'Academic years fetched'
    );
  } catch (err) {
    next(err);
  }
}

// ==================== GET ONE ====================
export async function getAcademicYear(req, res, next) {
  try {
    const year = await getById(COLLECTION, req.params.id);
    if (!year) return error(res, 'Academic year not found', 404);
    return success(res, year, 'Academic year fetched');
  } catch (err) {
    next(err);
  }
}

// ==================== GET ACTIVE ====================
export async function getActiveYear(req, res, next) {
  try {
    const years = await getAll(COLLECTION);
    const active = years.find((y) => y.isActive);
    return success(res, active || null, active ? 'Active year found' : 'No active year');
  } catch (err) {
    next(err);
  }
}

// ==================== CREATE ====================
export async function createAcademicYear(req, res, next) {
  try {
    const { name, startDate, endDate } = req.body;
    if (!name || !startDate || !endDate) {
      return error(res, 'name, startDate, endDate are required', 400);
    }

    const years = await getAll(COLLECTION);
    if (years.some((y) => y.name === name)) {
      return error(res, `Academic year '${name}' already exists`, 409);
    }

    const newYear = {
      id: generateId('ay'),
      name,
      startDate,
      endDate,
      isActive: false,
      status: 'active',
      createdAt: now(),
    };

    await create(COLLECTION, newYear);
    return success(res, newYear, 'Academic year created', 201);
  } catch (err) {
    next(err);
  }
}

// ==================== UPDATE ====================
export async function updateAcademicYear(req, res, next) {
  try {
    const existing = await getById(COLLECTION, req.params.id);
    if (!existing) return error(res, 'Academic year not found', 404);

    const { id, createdAt, isActive, ...allowed } = req.body;

    const updated = await update(COLLECTION, req.params.id, {
      ...allowed,
      updatedAt: now(),
    });

    return success(res, updated, 'Academic year updated');
  } catch (err) {
    next(err);
  }
}

// ==================== SET ACTIVE ====================
export async function setActiveYear(req, res, next) {
  try {
    const target = await getById(COLLECTION, req.params.id);
    if (!target) return error(res, 'Academic year not found', 404);

    const db = await readDB();
    db[COLLECTION] = (db[COLLECTION] || []).map((y) => ({
      ...y,
      isActive: y.id === req.params.id,
    }));
    await writeDB(db);

    return success(res, target, `'${target.name}' set as active year`);
  } catch (err) {
    next(err);
  }
}

// ==================== ARCHIVE ====================
export async function archiveYear(req, res, next) {
  try {
    const existing = await getById(COLLECTION, req.params.id);
    if (!existing) return error(res, 'Academic year not found', 404);

    if (existing.isActive) {
      return error(res, 'Cannot archive the active year. Set another year active first.', 400);
    }

    const updated = await update(COLLECTION, req.params.id, {
      status: 'archived',
      archivedAt: now(),
    });

    return success(res, updated, 'Academic year archived');
  } catch (err) {
    next(err);
  }
}

// ==================== DELETE ====================
export async function deleteAcademicYear(req, res, next) {
  try {
    const existing = await getById(COLLECTION, req.params.id);
    if (!existing) return error(res, 'Academic year not found', 404);
    if (existing.isActive) return error(res, 'Cannot delete the active year', 400);

    // Prevent deletion if referenced by students/classes
    const students = await getAll('students');
    const classes = await getAll('classes');
    const inUse =
      students.some((s) => s.academicYear === existing.name) ||
      classes.some((c) => c.academicYear === existing.name);

    if (inUse) {
      return error(res, 'Cannot delete: year is used by students or classes', 400);
    }

    await remove(COLLECTION, req.params.id);
    return success(res, { id: req.params.id }, 'Academic year deleted');
  } catch (err) {
    next(err);
  }
}