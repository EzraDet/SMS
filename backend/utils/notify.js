import { readDB, writeDB } from './fileHandler.js';
import { generateId, now } from './helpers.js';

/**
 * Push a notification into the shared notifications collection.
 *
 * @param {Object} opts
 * @param {string} opts.title
 * @param {string} opts.message
 * @param {string} [opts.type]         — event type, default 'system'
 * @param {string[]} [opts.targetRoles]— roles that should see it (default: all)
 * @param {string|null} [opts.targetUserId] — if set, only this user sees it
 * @param {string} [opts.link]         — route to navigate to on click
 */
export async function pushNotification({
  title,
  message,
  type = 'system',
  targetRoles = ['super_admin', 'admin', 'teacher', 'staff'],
  targetUserId = null,
  link = '',
}) {
  try {
    const db = await readDB();
    if (!db.notifications) db.notifications = [];

    const notif = {
      id: generateId('notif'),
      title,
      message,
      type,
      targetRoles,
      targetUserId,
      readBy: [],
      link,
      createdAt: now(),
    };

    db.notifications.push(notif);

    // Keep only the latest 500 to prevent unbounded growth
    if (db.notifications.length > 500) {
      db.notifications = db.notifications.slice(-500);
    }

    await writeDB(db);
    return notif;
  } catch (err) {
    console.error('pushNotification failed:', err.message);
    return null;
  }
}