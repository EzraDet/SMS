import bcrypt from 'bcryptjs';
import { getAll, create, getById, update } from '../utils/fileHandler.js';
import { success, error } from '../utils/response.js';
import { signToken } from '../utils/jwt.js';
import { generateId, now } from '../utils/helpers.js';
import { pushNotification } from '../utils/notify.js';

const COLLECTION = 'users';
const VALID_ROLES = ['super_admin', 'admin', 'teacher', 'staff'];

/**
 * Strip password before sending user object to client
 */
function sanitizeUser(user) {
  if (!user) return null;
  const { password, ...safe } = user;
  return safe;
}

// ==================== LOGIN ====================
export async function login(req, res, next) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return error(res, 'Username and password are required', 400);
    }

    const users = await getAll(COLLECTION);
    const user = users.find(
      (u) => u.username.toLowerCase() === String(username).toLowerCase()
    );

    if (!user) {
      return error(res, 'Invalid credentials', 401);
    }

    if (user.status === 'inactive') {
      return error(res, 'Account is deactivated. Contact admin.', 403);
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return error(res, 'Invalid credentials', 401);
    }

    const token = signToken({
      id: user.id,
      username: user.username,
      role: user.role,
    });

    return success(
      res,
      { token, user: sanitizeUser(user) },
      'Login successful'
    );
  } catch (err) {
    next(err);
  }
}

// ==================== ME ====================
export async function me(req, res, next) {
  try {
    const user = await getById(COLLECTION, req.user.id);
    if (!user) return error(res, 'User not found', 404);
    return success(res, sanitizeUser(user), 'User fetched');
  } catch (err) {
    next(err);
  }
}

// ==================== REGISTER (Super Admin only) ====================
export async function register(req, res, next) {
  try {
    const { username, password, fullName, email, role = 'staff' } = req.body;

    if (!username || !password || !fullName) {
      return error(res, 'username, password, fullName are required', 400);
    }
    if (!VALID_ROLES.includes(role)) {
      return error(res, `Invalid role. Allowed: ${VALID_ROLES.join(', ')}`, 400);
    }

    const users = await getAll(COLLECTION);
    const duplicate = users.find(
      (u) => u.username.toLowerCase() === username.toLowerCase()
    );
    if (duplicate) {
      return error(res, `Username '${username}' already exists`, 409);
    }

    const hash = await bcrypt.hash(password, 10);

    const newUser = {
      id: generateId('u'),
      username,
      password: hash,
      fullName,
      email: email || '',
      role,
      status: 'active',
      createdAt: now(),
    };

    await create(COLLECTION, newUser);

    // 🔔 Push notification (inside the function, newUser is in scope)
    await pushNotification({
      title: 'New user account',
      message: `${newUser.fullName} (${newUser.role}) was added.`,
      type: 'user_created',
      targetRoles: ['super_admin'],
      link: '/users',
    });

    return success(res, sanitizeUser(newUser), 'User created', 201);
  } catch (err) {
    next(err);
  }
}

// ==================== LIST USERS (Super Admin) ====================
export async function listUsers(req, res, next) {
  try {
    const users = await getAll(COLLECTION);
    return success(res, users.map(sanitizeUser), 'Users fetched');
  } catch (err) {
    next(err);
  }
}

// ==================== UPDATE USER ====================
export async function updateUser(req, res, next) {
  try {
    const existing = await getById(COLLECTION, req.params.id);
    if (!existing) return error(res, 'User not found', 404);

    const { password, id, createdAt, ...allowed } = req.body;

    if (password) {
      allowed.password = await bcrypt.hash(password, 10);
    }

    if (allowed.role && !VALID_ROLES.includes(allowed.role)) {
      return error(res, `Invalid role`, 400);
    }

    const updated = await update(COLLECTION, req.params.id, {
      ...allowed,
      updatedAt: now(),
    });

    return success(res, sanitizeUser(updated), 'User updated');
  } catch (err) {
    next(err);
  }
}

// ==================== DELETE USER ====================
export async function deleteUser(req, res, next) {
  try {
    const existing = await getById(COLLECTION, req.params.id);
    if (!existing) return error(res, 'User not found', 404);
    if (existing.username === 'superadmin') {
      return error(res, 'Cannot delete the super admin', 403);
    }

    await update(COLLECTION, req.params.id, {
      status: 'inactive',
      deactivatedAt: now(),
    });

    return success(res, { id: req.params.id }, 'User deactivated');
  } catch (err) {
    next(err);
  }
}