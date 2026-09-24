import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { CalendarRange, Plus, Pencil, Trash2, CheckCircle2, Archive, Star } from 'lucide-react';

import { academicYearService } from '../../services/academicYearService';
import { formatDate } from '../../utils/formatters';
import PageHeader from '../../components/PageHeader';
import Button from '../../components/Button';
import Badge from '../../components/Badge';
import Modal from '../../components/Modal';
import Input from '../../components/Input';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import ConfirmDialog from '../../components/ConfirmDialog';

const emptyForm = { name: '', startDate: '', endDate: '' };

export default function AcademicYearsPage() {
  const [years, setYears] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const [confirm, setConfirm] = useState({ open: false, type: '', target: null });
  const [confirmLoading, setConfirmLoading] = useState(false);

  const fetchYears = async () => {
    setLoading(true);
    try {
      const res = await academicYearService.getAll({ limit: 100 });
      setYears(res.data.academicYears);
    } catch (err) {
      toast.error(err.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchYears(); }, []);

  const handleAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormOpen(true);
  };

  const handleEdit = (y) => {
    setEditing(y);
    setForm({ name: y.name, startDate: y.startDate, endDate: y.endDate });
    setFormOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name || !form.startDate || !form.endDate) {
      return toast.error('All fields are required');
    }
    setSaving(true);
    try {
      if (editing) {
        await academicYearService.update(editing.id, form);
        toast.success('Updated');
      } else {
        await academicYearService.create(form);
        toast.success('Created');
      }
      setFormOpen(false);
      fetchYears();
    } catch (err) {
      toast.error(err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const askConfirm = (type, target) => setConfirm({ open: true, type, target });

  const handleConfirm = async () => {
    if (!confirm.target) return;
    setConfirmLoading(true);
    try {
      if (confirm.type === 'setActive') {
        await academicYearService.setActive(confirm.target.id);
        toast.success(`'${confirm.target.name}' is now the active year`);
      } else if (confirm.type === 'archive') {
        await academicYearService.archive(confirm.target.id);
        toast.success('Archived');
      } else if (confirm.type === 'delete') {
        await academicYearService.remove(confirm.target.id);
        toast.success('Deleted');
      }
      setConfirm({ open: false, type: '', target: null });
      fetchYears();
    } catch (err) {
      toast.error(err.message || 'Action failed');
    } finally {
      setConfirmLoading(false);
    }
  };

  const confirmContent = {
    setActive: {
      title: 'Set as active year?',
      message: 'This becomes the default year for new students and classes.',
      confirmText: 'Set Active',
      variant: 'success',
    },
    archive: {
      title: 'Archive this year?',
      message: 'Historical data (students, scores, attendance) is preserved.',
      confirmText: 'Archive',
      variant: 'danger',
    },
    delete: {
      title: 'Delete this year?',
      message: 'Only possible if no students or classes reference it.',
      confirmText: 'Delete',
      variant: 'danger',
    },
  }[confirm.type] || {};

  return (
    <div>
      <PageHeader
        title="Academic Years"
        subtitle="Manage school years and archive old data"
        icon={CalendarRange}
        actions={<Button icon={Plus} onClick={handleAdd}>Add Year</Button>}
      />

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <LoadingSpinner message="Loading years..." />
        ) : years.length === 0 ? (
          <EmptyState
            icon={CalendarRange}
            title="No academic years"
            description="Add your first academic year to get started."
            action={<Button icon={Plus} onClick={handleAdd}>Add Year</Button>}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 py-3">Year</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 py-3">Start</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 py-3">End</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 py-3">Status</th>
                  <th className="text-right text-xs font-semibold text-gray-500 uppercase px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {years.map((y) => (
                  <tr key={y.id} className={`hover:bg-gray-50 ${y.isActive ? 'bg-green-50/50' : ''}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {y.isActive && <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />}
                        <span className="font-semibold text-gray-800">{y.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{formatDate(y.startDate)}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{formatDate(y.endDate)}</td>
                    <td className="px-4 py-3">
                      {y.isActive ? (
                        <Badge variant="success">Active</Badge>
                      ) : y.status === 'archived' ? (
                        <Badge variant="default">Archived</Badge>
                      ) : (
                        <Badge variant="info">Inactive</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {!y.isActive && y.status !== 'archived' && (
                          <button
                            onClick={() => askConfirm('setActive', y)}
                            className="p-2 rounded-lg hover:bg-green-50 text-green-600"
                            title="Set Active"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        )}
                        {y.status !== 'archived' && !y.isActive && (
                          <button
                            onClick={() => askConfirm('archive', y)}
                            className="p-2 rounded-lg hover:bg-yellow-50 text-yellow-600"
                            title="Archive"
                          >
                            <Archive className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleEdit(y)}
                          className="p-2 rounded-lg hover:bg-gray-100 text-blue-600"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        {!y.isActive && (
                          <button
                            onClick={() => askConfirm('delete', y)}
                            className="p-2 rounded-lg hover:bg-red-50 text-red-600"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Form modal */}
      <Modal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? 'Edit Academic Year' : 'Add Academic Year / បន្ថែមឆ្នាំសិក្សាថ្មី'}
        size="md"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <Input
            label="Name * / ឈ្មោះឆ្នាំសិក្សា"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. 2025-2026"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Start Date * / ថ្ងៃចាប់ផ្តើម"
              type="date"
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
            />
            <Input
              label="End Date * / ថ្ងៃបញ្ចប់"
              type="date"
              value={form.endDate}
              onChange={(e) => setForm({ ...form, endDate: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
            <Button variant="secondary" type="button" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              {editing ? 'Save Changes' : 'Create Year'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Confirm dialog */}
      <ConfirmDialog
        isOpen={confirm.open}
        onClose={() => setConfirm({ open: false, type: '', target: null })}
        onConfirm={handleConfirm}
        loading={confirmLoading}
        title={confirmContent.title}
        message={confirmContent.message}
        confirmText={confirmContent.confirmText}
        variant={confirmContent.variant}
      />
    </div>
  );
}