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
import {
  generateId,
  now,
  calculateGradeDetails,
  getResult,
} from '../utils/helpers.js';
import { pushNotification } from '../utils/notify.js';

const COLLECTION = 'scores';
const VALID_TYPES = ['monthly', 'semester1', 'semester2', 'final'];

// ==================== GET ALL ====================
export async function getScores(req, res, next) {
  try {
    const {
      classId = '',
      studentId = '',
      subjectId = '',
      academicYear = '',
      type = '',
      month = '',
      page = 1,
      limit = 100,
    } = req.query;

    let scores = await getAll(COLLECTION);

    if (classId) scores = scores.filter((s) => s.classId === classId);
    if (studentId) scores = scores.filter((s) => s.studentId === studentId);
    if (subjectId) scores = scores.filter((s) => s.subjectId === subjectId);
    if (academicYear)
      scores = scores.filter((s) => s.academicYear === academicYear);
    if (type) scores = scores.filter((s) => s.type === type);
    if (month) scores = scores.filter((s) => s.month === month);

    scores.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

    const total = scores.length;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.max(1, parseInt(limit));
    const totalPages = Math.ceil(total / limitNum);
    const startIndex = (pageNum - 1) * limitNum;
    const paginated = scores.slice(startIndex, startIndex + limitNum);

    return success(
      res,
      {
        scores: paginated,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages,
          hasNext: pageNum < totalPages,
          hasPrev: pageNum > 1,
        },
      },
      'Scores fetched successfully'
    );
  } catch (err) {
    next(err);
  }
}

// ==================== GET ONE ====================
export async function getScore(req, res, next) {
  try {
    const score = await getById(COLLECTION, req.params.id);
    if (!score) return error(res, 'Score not found', 404);
    return success(res, score, 'Score fetched');
  } catch (err) {
    next(err);
  }
}

// ==================== CLASS + SUBJECT ====================
export async function getClassSubjectScores(req, res, next) {
  try {
    const { classId, subjectId } = req.params;
    const { type = 'monthly', month = '', academicYear = '' } = req.query;

    const [cls, students, subject, allScores] = await Promise.all([
      getById('classes', classId),
      getAll('students'),
      getById('subjects', subjectId),
      getAll(COLLECTION),
    ]);

    if (!cls) return error(res, 'Class not found', 404);
    if (!subject) return error(res, 'Subject not found', 404);

    const classStudents = students
      .filter((s) => s.classId === classId && s.status === 'active')
      .sort((a, b) => (a.firstName || '').localeCompare(b.firstName || ''));

    const existing = allScores.filter(
      (s) =>
        s.classId === classId &&
        s.subjectId === subjectId &&
        s.type === type &&
        (month ? s.month === month : true) &&
        (academicYear ? s.academicYear === academicYear : true)
    );

    const items = classStudents.map((student) => {
      const existingScore = existing.find((s) => s.studentId === student.id);
      return {
        student,
        score: existingScore || null,
        scoreId: existingScore?.id || null,
        value: existingScore?.score ?? '',
        maxScore: existingScore?.maxScore ?? 100,
        grade: existingScore?.grade || '',
        remark: existingScore?.remark || '',
      };
    });

    return success(
      res,
      { class: cls, subject, type, month, items },
      'Class subject scores fetched'
    );
  } catch (err) {
    next(err);
  }
}

// ==================== STUDENT SCORES (REPORT CARD) ====================
export async function getStudentScores(req, res, next) {
  try {
    const { studentId } = req.params;
    const { academicYear = '' } = req.query;

    const [student, scores, subjects, cls] = await Promise.all([
      getById('students', studentId),
      getAll(COLLECTION),
      getAll('subjects'),
      getAll('classes'),
    ]);

    if (!student) return error(res, 'Student not found', 404);

    let studentScores = scores.filter((s) => s.studentId === studentId);
    if (academicYear) {
      studentScores = studentScores.filter(
        (s) => s.academicYear === academicYear
      );
    }

    const scoresWithSubject = studentScores.map((s) => ({
      ...s,
      subject: subjects.find((sub) => sub.id === s.subjectId) || null,
    }));

    const bySubject = {};
    scoresWithSubject.forEach((s) => {
      if (!s.subject) return;
      if (!bySubject[s.subjectId]) {
        bySubject[s.subjectId] = { subject: s.subject, scores: [] };
      }
      bySubject[s.subjectId].scores.push(s);
    });

    const reportRows = Object.values(bySubject).map(({ subject, scores }) => {
      const total = scores.reduce((sum, s) => sum + (s.score || 0), 0);
      const maxTotal = scores.reduce((sum, s) => sum + (s.maxScore || 100), 0);
      const average =
        scores.length > 0 ? Math.round((total / scores.length) * 100) / 100 : 0;
      const percentage = maxTotal > 0 ? Math.round((total / maxTotal) * 100) : 0;
      const details = calculateGradeDetails(total, maxTotal || 1);

      return {
        subject,
        scores,
        total,
        maxTotal,
        average,
        percentage,
        grade: details.grade,
        remark: details.remark,
        result: getResult(details.grade),
      };
    });

    const totalScore = studentScores.reduce((sum, s) => sum + (s.score || 0), 0);
    const totalMax = studentScores.reduce(
      (sum, s) => sum + (s.maxScore || 100),
      0
    );
    const overallDetails = calculateGradeDetails(totalScore, totalMax || 1);

    const studentClass = cls.find((c) => c.id === student.classId) || null;

    return success(
      res,
      {
        student,
        class: studentClass,
        academicYear: academicYear || student.academicYear,
        rows: reportRows,
        summary: {
          totalSubjects: reportRows.length,
          totalScore,
          totalMax,
          average:
            studentScores.length > 0
              ? Math.round((totalScore / studentScores.length) * 100) / 100
              : 0,
          percentage: overallDetails.percentage,
          grade: overallDetails.grade,
          remark: overallDetails.remark,
          result: getResult(overallDetails.grade),
        },
      },
      'Student scores fetched'
    );
  } catch (err) {
    next(err);
  }
}

// ==================== CLASS RANKING ====================
export async function getClassRanking(req, res, next) {
  try {
    const { classId } = req.params;
    const { academicYear = '', type = '' } = req.query;

    const [cls, students, scores] = await Promise.all([
      getById('classes', classId),
      getAll('students'),
      getAll(COLLECTION),
    ]);

    if (!cls) return error(res, 'Class not found', 404);

    const classStudents = students.filter(
      (s) => s.classId === classId && s.status === 'active'
    );

    let classScores = scores.filter((s) => s.classId === classId);
    if (academicYear)
      classScores = classScores.filter((s) => s.academicYear === academicYear);
    if (type) classScores = classScores.filter((s) => s.type === type);

    const ranking = classStudents
      .map((student) => {
        const studentScores = classScores.filter(
          (s) => s.studentId === student.id
        );
        const total = studentScores.reduce((sum, s) => sum + (s.score || 0), 0);
        const maxTotal = studentScores.reduce(
          (sum, s) => sum + (s.maxScore || 100),
          0
        );
        const average =
          studentScores.length > 0
            ? Math.round((total / studentScores.length) * 100) / 100
            : 0;
        const percentage = maxTotal > 0 ? Math.round((total / maxTotal) * 100) : 0;
        const details = calculateGradeDetails(total, maxTotal || 1);

        return {
          student,
          total,
          maxTotal,
          average,
          percentage,
          grade: details.grade,
          remark: details.remark,
          result: getResult(details.grade),
          scoreCount: studentScores.length,
        };
      })
      .filter((r) => r.scoreCount > 0)
      .sort((a, b) => b.average - a.average)
      .map((row, index) => ({ ...row, rank: index + 1 }));

    return success(
      res,
      {
        class: cls,
        academicYear: academicYear || cls.academicYear,
        type: type || 'all',
        ranking,
      },
      'Class ranking generated'
    );
  } catch (err) {
    next(err);
  }
}

// ==================== STATS ====================
export async function getScoreStats(req, res, next) {
  try {
    const scores = await getAll(COLLECTION);

    const gradeCounts = { A: 0, B: 0, C: 0, D: 0, E: 0, F: 0 };
    scores.forEach((s) => {
      if (s.grade) gradeCounts[s.grade] = (gradeCounts[s.grade] || 0) + 1;
    });

    const byType = {};
    scores.forEach((s) => {
      byType[s.type] = (byType[s.type] || 0) + 1;
    });

    const totalPercentage =
      scores.length > 0
        ? scores.reduce((sum, s) => {
            const max = s.maxScore || 100;
            return sum + ((s.score || 0) / max) * 100;
          }, 0) / scores.length
        : 0;

    return success(
      res,
      {
        total: scores.length,
        byGrade: gradeCounts,
        byType,
        averagePercentage: Math.round(totalPercentage * 100) / 100,
      },
      'Score stats fetched'
    );
  } catch (err) {
    next(err);
  }
}

// ==================== CREATE ONE ====================
export async function createScore(req, res, next) {
  try {
    const {
      studentId,
      classId,
      subjectId,
      academicYear,
      type,
      month = '',
      score,
      maxScore = 100,
      remark = '',
    } = req.body;

    if (!VALID_TYPES.includes(type)) {
      return error(
        res,
        `Invalid type. Must be one of: ${VALID_TYPES.join(', ')}`,
        400
      );
    }
    if (score === undefined || score === null) {
      return error(res, 'Score is required', 400);
    }
    if (Number(score) < 0 || Number(score) > Number(maxScore)) {
      return error(res, `Score must be between 0 and ${maxScore}`, 400);
    }

    const student = await getById('students', studentId);
    if (!student) return error(res, 'Student not found', 404);

    const all = await getAll(COLLECTION);
    const duplicate = all.find(
      (s) =>
        s.studentId === studentId &&
        s.subjectId === subjectId &&
        s.type === type &&
        s.month === month
    );
    if (duplicate) {
      return error(
        res,
        'Score already exists for this student, subject, type and month. Use PUT to update.',
        409
      );
    }

    const details = calculateGradeDetails(Number(score), Number(maxScore));

    const newScore = {
      id: generateId('sc'),
      studentId,
      classId: classId || student.classId,
      subjectId,
      academicYear: academicYear || student.academicYear,
      type,
      month,
      score: Number(score),
      maxScore: Number(maxScore),
      grade: details.grade,
      remark: remark || details.remark,
      recordedBy: req.user?.id || 'system',
      createdAt: now(),
    };

    await create(COLLECTION, newScore);
    return success(res, newScore, 'Score created successfully', 201);
  } catch (err) {
    next(err);
  }
}

// ==================== BULK UPSERT ====================
export async function bulkScores(req, res, next) {
  try {
    const {
      classId,
      subjectId,
      academicYear = '',
      type,
      month = '',
      records = [],
    } = req.body;

    if (!classId || !subjectId || !type || !Array.isArray(records)) {
      return error(res, 'classId, subjectId, type and records[] required', 400);
    }
    if (!VALID_TYPES.includes(type)) {
      return error(
        res,
        `Invalid type. Must be one of: ${VALID_TYPES.join(', ')}`,
        400
      );
    }

    const db = await readDB();
    const list = db[COLLECTION] || [];

    let created = 0;
    let updated = 0;

    for (const item of records) {
      const { studentId, score, maxScore = 100, remark = '' } = item;

      if (score === undefined || score === null || score === '') continue;
      if (Number(score) < 0 || Number(score) > Number(maxScore)) {
        return error(
          res,
          `Invalid score ${score} for student ${studentId} (max ${maxScore})`,
          400
        );
      }

      const details = calculateGradeDetails(Number(score), Number(maxScore));

      const idx = list.findIndex(
        (s) =>
          s.studentId === studentId &&
          s.subjectId === subjectId &&
          s.type === type &&
          s.month === month
      );

      if (idx >= 0) {
        list[idx] = {
          ...list[idx],
          score: Number(score),
          maxScore: Number(maxScore),
          grade: details.grade,
          remark: remark || details.remark,
          academicYear: academicYear || list[idx].academicYear,
          updatedAt: now(),
        };
        updated++;
      } else {
        list.push({
          id: generateId('sc'),
          studentId,
          classId,
          subjectId,
          academicYear,
          type,
          month,
          score: Number(score),
          maxScore: Number(maxScore),
          grade: details.grade,
          remark: remark || details.remark,
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
      title: 'Scores entered',
      message: `${records.length} score(s) saved for subject.`,
      type: 'score_added',
      targetRoles: ['super_admin', 'admin'],
      link: '/scores',
    });

    return success(
      res,
      { created, updated, total: records.length },
      `Scores saved (${created} new, ${updated} updated)`
    );
  } catch (err) {
    next(err);
  }
}

// ==================== UPDATE ====================
export async function updateScore(req, res, next) {
  try {
    const existing = await getById(COLLECTION, req.params.id);
    if (!existing) return error(res, 'Score not found', 404);

    if (req.body.type && !VALID_TYPES.includes(req.body.type)) {
      return error(
        res,
        `Invalid type. Must be one of: ${VALID_TYPES.join(', ')}`,
        400
      );
    }

    const { id, createdAt, ...allowed } = req.body;

    if (allowed.score !== undefined) {
      const max = Number(allowed.maxScore || existing.maxScore || 100);
      const val = Number(allowed.score);
      if (val < 0 || val > max) {
        return error(res, `Score must be between 0 and ${max}`, 400);
      }
      const details = calculateGradeDetails(val, max);
      allowed.score = val;
      allowed.maxScore = max;
      allowed.grade = details.grade;
      if (!allowed.remark) allowed.remark = details.remark;
    }

    const updated = await update(COLLECTION, req.params.id, {
      ...allowed,
      updatedAt: now(),
    });

    return success(res, updated, 'Score updated');
  } catch (err) {
    next(err);
  }
}

// ==================== DELETE ====================
export async function deleteScore(req, res, next) {
  try {
    const existing = await getById(COLLECTION, req.params.id);
    if (!existing) return error(res, 'Score not found', 404);

    await remove(COLLECTION, req.params.id);
    return success(res, { id: req.params.id }, 'Score deleted');
  } catch (err) {
    next(err);
  }
}