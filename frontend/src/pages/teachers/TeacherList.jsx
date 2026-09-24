import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  GraduationCap,
  Plus,
  Eye,
  Pencil,
  Trash2,
  Filter,
} from 'lucide-react';

import { teacherService } from '../../services/teacherService';
import useDebounce from '../../hooks/useDebounce';
import { GENDER_OPTIONS, STATUS_OPTIONS } from '../../utils/constants';
import { getFullName, getInitials, formatDate } from '../../utils/formatters';

import PageHeader from '../../components/PageHeader';
import Button from '../../components/Button';
import Badge from '../../components/Badge';
import SearchBar from '../../components/SearchBar';
import Select from '../../components/Select';
import Pagination from '../../components/Pagination';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import ConfirmDialog from '../../components/ConfirmDialog';
import TeacherForm from './TeacherForm';

export default function TeacherList() {
  const [teachers, setTeachers] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const [search, setSearch] = useState('');
  const [gender, setGender] = useState('');
  const [status, setStatus] = useState('active');
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebounce(search, 400);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchTeachers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await teacherService.getAll({
        search: debouncedSearch,
        gender,
        status,
        page,
        limit: 10,
      });
      setTeachers(res.data.teachers);
      setPagination(res.data.pagination);
    } catch (err) {
      toast.error(err.message || 'Failed to load teachers');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, gender, status, page]);

  useEffect(() => {
    fetchTeachers();
  }, [fetchTeachers]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, gender, status]);

  const handleAdd = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const handleEdit = (t) => {
    setEditing(t);
    setFormOpen(true);
  };

  const handleDeleteClick = (t) => {
    setDeleting(t);
    setConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      await teacherService.deactivate(deleting.id);
      toast.success('Teacher deactivated');
      setConfirmOpen(false);
      setDeleting(null);
      fetchTeachers();
    } catch (err) {
      toast.error(err.message || 'Delete failed');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleFormSuccess = () => {
    setFormOpen(false);
    setEditing(null);
    fetchTeachers();
  };

  return (
    <div>
      <PageHeader
        title="តារាងគ្រូបង្រៀនសរុប"
        subtitle="Manage all teaching staff"
        icon={GraduationCap}
        actions={
          <Button icon={Plus} onClick={handleAdd}>
            Add Teacher
          </Button>
        }
      />

      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-5">
        <div className="flex flex-col sm:flex-row gap-3">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search by name, ID, email, phone..."
            className="flex-1"
          />
          <Button
            variant="outline"
            icon={Filter}
            onClick={() => setShowFilters((v) => !v)}
          >
            Filters
          </Button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-gray-100">
            <Select
              label="Gender"
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              options={GENDER_OPTIONS}
              placeholder="All Genders"
            />
            <Select
              label="Status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              options={STATUS_OPTIONS}
              placeholder="All Statuses"
            />
            <div className="flex items-end">
              <Button
                variant="secondary"
                onClick={() => {
                  setSearch('');
                  setGender('');
                  setStatus('active');
                }}
                className="w-full"
              >
                Reset Filters
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <LoadingSpinner message="Loading teachers..." />
        ) : teachers.length === 0 ? (
          <EmptyState
            icon={GraduationCap}
            title="No teachers found"
            description="Try adjusting filters or add a new teacher."
            action={
              <Button icon={Plus} onClick={handleAdd}>
                Add Teacher
              </Button>
            }
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 py-3">
                      Teacher
                    </th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 py-3">
                      Teacher ID
                    </th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 py-3">
                      Position
                    </th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 py-3">
                      Gender
                    </th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 py-3">
                      Hired
                    </th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 py-3">
                      Status
                    </th>
                    <th className="text-right text-xs font-semibold text-gray-500 uppercase px-4 py-3">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {teachers.map((t) => (
                    <tr key={t.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-semibold text-xs flex-shrink-0">
                            {getInitials(t.firstName, t.lastName)}
                          </div>
                          <div>
                            <p className="font-medium text-gray-800 text-sm">
                              {getFullName(t)}
                            </p>
                            <p className="text-xs text-gray-500">{t.khmerName}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 font-mono">
                        {t.teacherId}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {t.position || '—'}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={t.gender === 'male' ? 'info' : 'purple'}>
                          {t.gender}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {formatDate(t.hireDate)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={t.status === 'active' ? 'success' : 'default'}>
                          {t.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            to={`/teachers/${t.id}`}
                            className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleEdit(t)}
                            className="p-2 rounded-lg hover:bg-gray-100 text-blue-600"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(t)}
                            className="p-2 rounded-lg hover:bg-red-50 text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination pagination={pagination} onPageChange={setPage} />
          </>
        )}
      </div>

      <TeacherForm
        isOpen={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        onSuccess={handleFormSuccess}
        teacher={editing}
      />

      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => {
          setConfirmOpen(false);
          setDeleting(null);
        }}
        onConfirm={handleConfirmDelete}
        loading={deleteLoading}
        title="Deactivate Teacher?"
        message={`Are you sure you want to deactivate ${getFullName(deleting)}?`}
        confirmText="Deactivate"
      />
    </div>
  );
}