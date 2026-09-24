import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Bell, CheckCheck, Trash2, Info, UserPlus, CalendarCheck,
  ClipboardList, UserCog, ArrowLeft,
} from 'lucide-react';
import { Link } from 'react-router-dom';

import { notificationService } from '../services/notificationService';
import PageHeader from '../components/PageHeader';
import Button from '../components/Button';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';

const TYPE_ICONS = {
  student_created: { icon: UserPlus, color: 'text-blue-600 bg-blue-100' },
  student_updated: { icon: UserPlus, color: 'text-blue-600 bg-blue-100' },
  attendance_marked: { icon: CalendarCheck, color: 'text-green-600 bg-green-100' },
  attendance_missing: { icon: CalendarCheck, color: 'text-red-600 bg-red-100' },
  score_added: { icon: ClipboardList, color: 'text-purple-600 bg-purple-100' },
  low_attendance: { icon: CalendarCheck, color: 'text-yellow-600 bg-yellow-100' },
  user_created: { icon: UserCog, color: 'text-indigo-600 bg-indigo-100' },
  system: { icon: Info, color: 'text-gray-600 bg-gray-100' },
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const navigate = useNavigate();

  const fetchAll = async () => {
    setLoading(true);
    try {
      const res = await notificationService.getAll({
        limit: 100,
        unreadOnly: filter === 'unread' ? 'true' : 'false',
      });
      setNotifications(res.data.notifications);
    } catch (err) {
      toast.error(err.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, [filter]);

  const handleClick = async (n) => {
    if (!n.isRead) {
      try {
        await notificationService.markRead(n.id);
        setNotifications((prev) =>
          prev.map((x) => (x.id === n.id ? { ...x, isRead: true } : x))
        );
      } catch {}
    }
    if (n.link) navigate(n.link);
  };

  const handleMarkAll = async () => {
    try {
      await notificationService.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      toast.success('All marked as read');
    } catch {
      toast.error('Failed');
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    try {
      await notificationService.remove(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch {
      toast.error('Delete failed');
    }
  };

  return (
    <div>
      <div className="mb-4">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-primary-600">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
      </div>

      <PageHeader
        title="Notifications"
        subtitle="All system notifications for your account"
        icon={Bell}
        actions={
          <Button variant="outline" icon={CheckCheck} onClick={handleMarkAll}>
            Mark all read
          </Button>
        }
      />

      <div className="flex gap-2 mb-4">
        {['all', 'unread'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition
              ${filter === f ? 'bg-primary-600 text-white' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'}`}
          >
            {f === 'all' ? 'All' : 'Unread'}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <LoadingSpinner message="Loading..." />
        ) : notifications.length === 0 ? (
          <EmptyState
            icon={Bell}
            title="No notifications"
            description={filter === 'unread' ? 'You have no unread notifications.' : 'Nothing here yet.'}
          />
        ) : (
          notifications.map((n) => {
            const meta = TYPE_ICONS[n.type] || TYPE_ICONS.system;
            const Icon = meta.icon;
            return (
              <div
                key={n.id}
                onClick={() => handleClick(n)}
                className={`group flex items-start gap-3 px-5 py-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 relative
                  ${!n.isRead ? 'bg-primary-50/30' : ''}`}
              >
                <div className={`p-2.5 rounded-lg flex-shrink-0 ${meta.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 pr-6">
                  <div className="flex items-center gap-2">
                    <p className={`text-sm ${!n.isRead ? 'font-semibold text-gray-800' : 'text-gray-700'}`}>
                      {n.title}
                    </p>
                    {!n.isRead && <span className="w-2 h-2 rounded-full bg-primary-500" />}
                  </div>
                  <p className="text-sm text-gray-600 mt-0.5">{n.message}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(n.createdAt).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={(e) => handleDelete(e, n.id)}
                  className="opacity-0 group-hover:opacity-100 p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}