import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Users,
  Plus,
  Eye,
  Pencil,
  Trash2,
  Filter,
} from 'lucide-react';

import { studentService } from '../../services/studentService';
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
import StudentForm from './StudentForm';

// Small helper — get full URL for uploaded photo
const SERVER_URL = 'http://localhost:5000';
function photoUrl(path) {
  if (!path) return '';
  if (path.startsWith('http') || path.startsWith('data:')) return path;
  return `${SERVER_URL}${path}`;
}

export default function StudentList() {
  const [students, setStudents] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  // filters
  const [search, setSearch] = useState('');
  const [gender, setGender] = useState('');
  const [status, setStatus] = useState('active');
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebounce(search, 400);

  // modal
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  // delete confirm
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await studentService.getAll({
        search: debouncedSearch,
        gender,
        status,
        page,
        limit: 10,
      });
      setStudents(res.data.students);
      setPagination(res.data.pagination);
    } catch (err) {
      toast.error(err.message || 'Failed to load students');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, gender, status, page]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, gender, status]);

  const handleAdd = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const handleEdit = (student) => {
    setEditing(student);
    setFormOpen(true);
  };

  const handleDeleteClick = (student) => {
    setDeleting(student);
    setConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      await studentService.deactivate(deleting.id);
      toast.success('Student deactivated');
      setConfirmOpen(false);
      setDeleting(null);
      fetchStudents();
    } catch (err) {
      toast.error(err.message || 'Delete failed');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleFormSuccess = () => {
    setFormOpen(false);
    setEditing(null);
    fetchStudents();
  };

  return (
    <div>
      <PageHeader
        title="តារាងសិស្សសរុប"
        subtitle="គ្រប់គ្រងសិស្សទាំងអស់ដែលបានចុះឈ្មោះ"
        icon={Users}
        actions={
          <Button icon={Plus} onClick={handleAdd}>
            Add Student
          </Button>
        }
      />

      {/* Filters Bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-5">
        <div className="flex flex-col sm:flex-row gap-3">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search by name, ID, or email..."
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4 pt-4 border-t border-gray-100">
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

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <LoadingSpinner message="Loading students..." />
        ) : students.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No students found"
            description="Try adjusting your filters or add a new student."
            action={
              <Button icon={Plus} onClick={handleAdd}>
                Add Student
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
                      Student
                    </th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 py-3">
                      Student ID
                    </th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 py-3">
                      Gender
                    </th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 py-3">
                      Enrolled
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
                  {students.map((s) => (
                    <tr key={s.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {/* ==================== PHOTO / INITIALS ==================== */}
                          {s.photo ? (
                            <img
                              src={photoUrl(s.photo)}
                              alt={getFullName(s)}
                              className="w-9 h-9 rounded-full object-cover flex-shrink-0 border border-gray-200"
                              onError={(e) => {
                                // Fallback to initials if the image fails
                                e.target.onerror = null;
                                e.target.replaceWith(
                                  Object.assign(document.createElement('div'), {
                                    className:
                                      'w-9 h-9 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-semibold text-xs flex-shrink-0',
                                    textContent: getInitials(s.firstName, s.lastName),
                                  })
                                );
                              }}
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-semibold text-xs flex-shrink-0">
                              {getInitials(s.firstName, s.lastName)}
                            </div>
                          )}

                          <div>
                            <p className="font-medium text-gray-800 text-sm">
                              {getFullName(s)}
                            </p>
                            <p className="text-xs text-gray-500">{s.khmerName}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 font-mono">
                        {s.studentId}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={s.gender === 'male' ? 'info' : 'purple'}>
                          {s.gender}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {formatDate(s.enrollmentDate)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={s.status === 'active' ? 'success' : 'default'}
                        >
                          {s.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            to={`/students/${s.id}`}
                            className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
                            title="View"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleEdit(s)}
                            className="p-2 rounded-lg hover:bg-gray-100 text-blue-600"
                            title="Edit"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(s)}
                            className="p-2 rounded-lg hover:bg-red-50 text-red-600"
                            title="Deactivate"
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

      {/* Form Modal */}
      <StudentForm
        isOpen={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        onSuccess={handleFormSuccess}
        student={editing}
      />

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => {
          setConfirmOpen(false);
          setDeleting(null);
        }}
        onConfirm={handleConfirmDelete}
        loading={deleteLoading}
        title="Deactivate Student?"
        message={`Are you sure you want to deactivate ${getFullName(
          deleting
        )}? You can reactivate them later.`}
        confirmText="Deactivate"
      />
    </div>
  );
}