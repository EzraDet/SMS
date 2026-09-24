import { getAll, getById, update, remove, readDB, writeDB } from '../utils/fileHandler.js';
import { success, error } from '../utils/response.js';
import { pushNotification } from '../utils/notify.js';
import { now } from '../utils/helpers.js';

const COLLECTION = 'notifications';

/**
 * Filter notifications visible to a given user.
 * - If targetUserId is set, only that user sees it
 * - Otherwise, visible if user.role is in targetRoles
 */
function visibleToUser(notif, user) {
  if (notif.targetUserId) return notif.targetUserId === user.id;
  return (notif.targetRoles || []).includes(user.role);
}

// ==================== GET ALL ====================
export async function getNotifications(req, res, next) {
  try {
    const { unreadOnly = 'false', limit = 20 } = req.query;
    const all = await getAll(COLLECTION);

    let list = all.filter((n) => visibleToUser(n, req.user));

    // Sort newest first
    list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

    // Unread filter
    const readBy = req.user.id;
    if (unreadOnly === 'true') {
      list = list.filter((n) => !(n.readBy || []).includes(readBy));
    }

    const unreadCount = list.filter(
      (n) => !(n.readBy || []).includes(readBy)
    ).length;

    list = list.slice(0, parseInt(limit));

    // Annotate with isRead for this user
    const items = list.map((n) => ({
      ...n,
      isRead: (n.readBy || []).includes(readBy),
    }));

    return success(
      res,
      { notifications: items, unreadCount, total: items.length },
      'Notifications fetched'
    );
  } catch (err) {
    next(err);
  }
}

// ==================== MARK ONE READ ====================
export async function markRead(req, res, next) {
  try {
    const notif = await getById(COLLECTION, req.params.id);
    if (!notif) return error(res, 'Notification not found', 404);
    if (!visibleToUser(notif, req.user)) {
      return error(res, 'Not allowed', 403);
    }

    const db = await readDB();
    const idx = db[COLLECTION].findIndex((n) => n.id === req.params.id);
    if (idx === -1) return error(res, 'Notification not found', 404);

    const readBy = db[COLLECTION][idx].readBy || [];
    if (!readBy.includes(req.user.id)) {
      readBy.push(req.user.id);
      db[COLLECTION][idx].readBy = readBy;
      db[COLLECTION][idx].updatedAt = now();
      await writeDB(db);
    }

    return success(res, db[COLLECTION][idx], 'Marked as read');
  } catch (err) {
    next(err);
  }
}

// ==================== MARK ALL READ ====================
export async function markAllRead(req, res, next) {
  try {
    const db = await readDB();
    const list = db[COLLECTION] || [];
    let count = 0;

    db[COLLECTION] = list.map((n) => {
      if (!visibleToUser(n, req.user)) return n;
      const readBy = n.readBy || [];
      if (readBy.includes(req.user.id)) return n;
      count++;
      return { ...n, readBy: [...readBy, req.user.id], updatedAt: now() };
    });

    await writeDB(db);
    return success(res, { marked: count }, `${count} notifications marked as read`);
  } catch (err) {
    next(err);
  }
}

// ==================== CREATE (admin/system) ====================
export async function createNotification(req, res, next) {
  try {
    const { title, message, type, targetRoles, targetUserId, link } = req.body;
    if (!title || !message) {
      return error(res, 'title and message are required', 400);
    }

    const notif = await pushNotification({
      title,
      message,
      type: type || 'system',
      targetRoles,
      targetUserId,
      link,
    });

    if (!notif) return error(res, 'Failed to create notification', 500);
    return success(res, notif, 'Notification created', 201);
  } catch (err) {
    next(err);
  }
}

// ==================== DELETE (own notifications) ====================
export async function deleteNotification(req, res, next) {
  try {
    const notif = await getById(COLLECTION, req.params.id);
    if (!notif) return error(res, 'Notification not found', 404);
    if (!visibleToUser(notif, req.user)) {
      return error(res, 'Not allowed', 403);
    }

    await remove(COLLECTION, req.params.id);
    return success(res, { id: req.params.id }, 'Notification deleted');
  } catch (err) {
    next(err);
  }
}