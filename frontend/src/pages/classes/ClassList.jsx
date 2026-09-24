import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  School,
  Plus,
  Eye,
  Pencil,
  Trash2,
  Filter,
  Users,
} from 'lucide-react';

import { classService } from '../../services/classService';
import useDebounce from '../../hooks/useDebounce';
import { STATUS_OPTIONS } from '../../utils/constants';

import PageHeader from '../../components/PageHeader';
import Button from '../../components/Button';
import Badge from '../../components/Badge';
import SearchBar from '../../components/SearchBar';
import Select from '../../components/Select';
import Pagination from '../../components/Pagination';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import ConfirmDialog from '../../components/ConfirmDialog';
import ClassForm from './ClassForm';

const GRADE_OPTIONS = [7, 8, 9, 10, 11, 12].map((g) => ({
  value: String(g),
  label: `Grade ${g}`,
}));

export default function ClassList() {
  const [classes, setClasses] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const [search, setSearch] = useState('');
  const [grade, setGrade] = useState('');
  const [status, setStatus] = useState('active');
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebounce(search, 400);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchClasses = useCallback(async () => {
    setLoading(true);
    try {
      const res = await classService.getAll({
        search: debouncedSearch,
        grade,
        status,
        page,
        limit: 10,
      });
      setClasses(res.data.classes);
      setPagination(res.data.pagination);
    } catch (err) {
      toast.error(err.message || 'Failed to load classes');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, grade, status, page]);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, grade, status]);

  const handleAdd = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const handleEdit = (c) => {
    setEditing(c);
    setFormOpen(true);
  };
  const handleDeleteClick = (c) => {
    setDeleting(c);
    setConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      await classService.deactivate(deleting.id);
      toast.success('Class deactivated');
      setConfirmOpen(false);
      setDeleting(null);
      fetchClasses();
    } catch (err) {
      toast.error(err.message || 'Delete failed');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="ថ្នាក់រៀនសរុប"
        subtitle="Manage all classes and their assignments"
        icon={School}
        actions={
          <Button icon={Plus} onClick={handleAdd}>
            Add Class
          </Button>
        }
      />

      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-5">
        <div className="flex flex-col sm:flex-row gap-3">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search by class name, ID, room..."
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
              label="Grade"
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              options={GRADE_OPTIONS}
              placeholder="All Grades"
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
                  setGrade('');
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
          <LoadingSpinner message="Loading classes..." />
        ) : classes.length === 0 ? (
          <EmptyState
            icon={School}
            title="No classes found"
            description="Try adjusting filters or add a new class."
            action={
              <Button icon={Plus} onClick={handleAdd}>
                Add Class
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
                      Class
                    </th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 py-3">
                      Grade
                    </th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 py-3">
                      Room
                    </th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 py-3">
                      Academic Year
                    </th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 py-3">
                      Capacity
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
                  {classes.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-primary-100 text-primary-700 flex items-center justify-center">
                            <School className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-800 text-sm">
                              {c.className}
                            </p>
                            <p className="text-xs text-gray-500 font-mono">
                              {c.classId}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="info">Grade {c.grade}</Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {c.room || '—'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {c.academicYear}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        <span className="inline-flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {c.maxStudents}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={c.status === 'active' ? 'success' : 'default'}>
                          {c.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            to={`/classes/${c.id}`}
                            className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleEdit(c)}
                            className="p-2 rounded-lg hover:bg-gray-100 text-blue-600"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(c)}
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

      <ClassForm
        isOpen={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        onSuccess={() => {
          setFormOpen(false);
          setEditing(null);
          fetchClasses();
        }}
        cls={editing}
      />

      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => {
          setConfirmOpen(false);
          setDeleting(null);
        }}
        onConfirm={handleConfirmDelete}
        loading={deleteLoading}
        title="Deactivate Class?"
        message={`Are you sure you want to deactivate "${deleting?.className}"? Students must be reassigned first.`}
        confirmText="Deactivate"
      />
    </div>
  );
}