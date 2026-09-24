/**
 * Role → list of allowed page keys.
 * Sidebar uses this to hide menu items.
 */
export const ROLE_PERMISSIONS = {
  super_admin: [
    'dashboard', 'students', 'teachers', 'classes', 'subjects',
    'attendance', 'scores', 'results', 'ranking', 'student-cards',
    'academic-years', 'users',
  ],
  admin: [
    'dashboard', 'students', 'teachers', 'classes', 'subjects',
    'attendance', 'scores', 'results', 'ranking', 'student-cards',
    'academic-years',
  ],
  teacher: [
    'dashboard', 'students', 'classes', 'subjects',
    'attendance', 'scores', 'results', 'ranking',
  ],
  staff: ['dashboard', 'students', 'attendance', 'student-cards'],
};

/**
 * Can this user write (create/update/delete)?
 */
export function canWrite(role) {
  return role === 'super_admin' || role === 'admin';
}

/**
 * Can this user manage users?
 */
export function canManageUsers(role) {
  return role === 'super_admin';
}

export function hasPageAccess(role, pageKey) {
  if (!role) return false;
  return (ROLE_PERMISSIONS[role] || []).includes(pageKey);
}

export const ROLE_LABELS = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  teacher: 'Teacher',
  staff: 'Staff',
};
 