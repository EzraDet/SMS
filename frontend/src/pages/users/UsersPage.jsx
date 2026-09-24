import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { UserCog, Plus, Pencil, Trash2, Shield, Mail, KeyRound } from 'lucide-react';

import { userService } from '../../services/userService';
import { useAuth } from '../../context/AuthContext';
import { ROLE_LABELS } from '../../utils/permissions';
import { getInitials, formatDate } from '../../utils/formatters';

import PageHeader from '../../components/PageHeader';
import Button from '../../components/Button';
import Badge from '../../components/Badge';
import Modal from '../../components/Modal';
import Input from '../../components/Input';
import Select from '../../components/Select';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import ConfirmDialog from '../../components/ConfirmDialog';

const ROLE_OPTIONS = [
  { value: 'super_admin', label: 'Super Admin' },
  { value: 'admin', label: 'Admin' },
  { value: 'teacher', label: 'Teacher' },
  { value: 'staff', label: 'Staff' },
];

const emptyForm = {
  username: '',
  password: '',
  fullName: '',
  email: '',
  role: 'staff',
  status: 'active',
};

const roleBadge = {
  super_admin: 'purple',
  admin: 'info',
  teacher: 'success',
  staff: 'default',
};

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const [confirm, setConfirm] = useState({ open: false, target: null });
  const [confirmLoading, setConfirmLoading] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await userService.getAll();
      setUsers(res.data);
    } catch (err) {
      toast.error(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormOpen(true);
  };

  const handleEdit = (u) => {
    setEditing(u);
    setForm({
      username: u.username,
      password: '',
      fullName: u.fullName || '',
      email: u.email || '',
      role: u.role,
      status: u.status || 'active',
    });
    setFormOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.username || !form.fullName) {
      return toast.error('Username and Full Name are required');
    }
    if (!editing && !form.password) {
      return toast.error('Password is required for new users');
    }
    setSaving(true);
    try {
      if (editing) {
        const payload = { ...form };
        if (!payload.password) delete payload.password;
        delete payload.username; // don't allow username change
        await userService.update(editing.id, payload);
        toast.success('User updated');
      } else {
        await userService.create(form);
        toast.success('User created');
      }
      setFormOpen(false);
      fetchUsers();
    } catch (err) {
      toast.error(err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const askDeactivate = (u) => setConfirm({ open: true, target: u });

  const handleConfirmDeactivate = async () => {
    if (!confirm.target) return;
    setConfirmLoading(true);
    try {
      await userService.remove(confirm.target.id);
      toast.success('User deactivated');
      setConfirm({ open: false, target: null });
      fetchUsers();
    } catch (err) {
      toast.error(err.message || 'Failed');
    } finally {
      setConfirmLoading(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Users"
        subtitle="Manage system users and their roles"
        icon={UserCog}
        actions={<Button icon={Plus} onClick={handleAdd}>Add User</Button>}
      />

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <LoadingSpinner message="Loading users..." />
        ) : users.length === 0 ? (
          <EmptyState
            icon={UserCog}
            title="No users"
            description="Add your first user."
            action={<Button icon={Plus} onClick={handleAdd}>Add User</Button>}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 py-3">User</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 py-3">Username</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 py-3">Role</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 py-3">Status</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 py-3">Created</th>
                  <th className="text-right text-xs font-semibold text-gray-500 uppercase px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((u) => {
                  const isSelf = u.id === currentUser?.id;
                  return (
                    <tr key={u.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-semibold text-xs">
                            {getInitials(u.fullName?.[0] || '', u.fullName?.split(' ')[1] || '')}
                          </div>
                          <div>
                            <p className="font-medium text-gray-800 text-sm">
                              {u.fullName}
                              {isSelf && <span className="text-xs text-gray-400 ml-1">(you)</span>}
                            </p>
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {u.email || '—'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm font-mono text-gray-700">{u.username}</td>
                      <td className="px-4 py-3">
                        <Badge variant={roleBadge[u.role] || 'default'}>
                          <Shield className="w-3 h-3 mr-1 inline" />
                          {ROLE_LABELS[u.role] || u.role}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={u.status === 'active' ? 'success' : 'default'}>
                          {u.status || 'active'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {formatDate(u.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleEdit(u)}
                            className="p-2 rounded-lg hover:bg-gray-100 text-blue-600"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          {u.username !== 'superadmin' && !isSelf && u.status !== 'inactive' && (
                            <button
                              onClick={() => askDeactivate(u)}
                              className="p-2 rounded-lg hover:bg-red-50 text-red-600"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Form modal */}
      <Modal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? 'Edit User' : 'Add User'}
        size="md"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <Input
            label="Username *"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            disabled={!!editing}
            placeholder="e.g. staff1"
          />
          <Input
            label={editing ? 'New Password (leave empty to keep)' : 'Password *'}
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="••••••••"
          />
          <Input
            label="Full Name *"
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            placeholder="e.g. Sok Vanna"
          />
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="user@school.edu.kh"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Role *"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              options={ROLE_OPTIONS}
            />
            <Select
              label="Status"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              options={[
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
              ]}
            />
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
            <Button variant="secondary" type="button" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={saving} icon={editing ? null : KeyRound}>
              {editing ? 'Save Changes' : 'Create User'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={confirm.open}
        onClose={() => setConfirm({ open: false, target: null })}
        onConfirm={handleConfirmDeactivate}
        loading={confirmLoading}
        title="Deactivate user?"
        message={`'${confirm.target?.fullName}' will no longer be able to log in.`}
        confirmText="Deactivate"
        variant="danger"
      />
    </div>
  );
}