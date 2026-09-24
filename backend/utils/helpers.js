import { v4 as uuidv4 } from 'uuid';

/**
 * Generate a unique ID with prefix (e.g., "s-abc123")
 */
export function generateId(prefix = 'id') {
  return `${prefix}-${uuidv4().slice(0, 8)}`;
}

/**
 * Generate student ID like STU2024001
 */
export function generateStudentId(existingStudents = []) {
  const year = new Date().getFullYear();
  const count = existingStudents.length + 1;
  return `STU${year}${String(count).padStart(3, '0')}`;
}

/**
 * Generate teacher ID like TCH001
 */
export function generateTeacherId(existingTeachers = []) {
  const count = existingTeachers.length + 1;
  return `TCH${String(count).padStart(3, '0')}`;
}

/**
 * Calculate grade from score (simple version)
 */
export function calculateGrade(score, maxScore = 100) {
  const percentage = (score / maxScore) * 100;
  if (percentage >= 90) return 'A';
  if (percentage >= 80) return 'B';
  if (percentage >= 70) return 'C';
  if (percentage >= 60) return 'D';
  if (percentage >= 50) return 'E';
  return 'F';
}

/**
 * Get current ISO timestamp
 */
export function now() {
  return new Date().toISOString();
}

/**
 * Grading scale — configurable later via settings
 */
export const GRADING_SCALE = [
  { min: 90, max: 100, grade: 'A', remark: 'Excellent' },
  { min: 80, max: 89.99, grade: 'B', remark: 'Very Good' },
  { min: 70, max: 79.99, grade: 'C', remark: 'Good' },
  { min: 60, max: 69.99, grade: 'D', remark: 'Satisfactory' },
  { min: 50, max: 59.99, grade: 'E', remark: 'Pass' },
  { min: 0, max: 49.99, grade: 'F', remark: 'Fail' },
];

/**
 * Calculate grade + remark from score (with grade + remark info)
 */
export function calculateGradeDetails(score, maxScore = 100) {
  if (!maxScore || maxScore <= 0) {
    return { percentage: 0, grade: 'F', remark: 'Fail' };
  }
  const percentage = (score / maxScore) * 100;
  const entry = GRADING_SCALE.find(
    (g) => percentage >= g.min && percentage <= g.max
  );
  return {
    percentage: Math.round(percentage * 100) / 100,
    grade: entry?.grade || 'F',
    remark: entry?.remark || 'Fail',
  };
}

/**
 * Determine pass/fail from grade
 */
export function getResult(grade) {
  return grade === 'F' ? 'Fail' : 'Pass';
}