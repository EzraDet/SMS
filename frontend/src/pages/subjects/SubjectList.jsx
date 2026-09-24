import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { BookOpen, Plus, Pencil, Trash2, Filter } from 'lucide-react';

import { subjectService } from '../../services/subjectService';
import { teacherService } from '../../services/teacherService';
import useDebounce from '../../hooks/useDebounce';
import { STATUS_OPTIONS } from '../../utils/constants';
import { getFullName } from '../../utils/formatters';

import PageHeader from '../../components/PageHeader';
import Button from '../../components/Button';
import Badge from '../../components/Badge';
import SearchBar from '../../components/SearchBar';
import Select from '../../components/Select';
import Pagination from '../../components/Pagination';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import ConfirmDialog from '../../components/ConfirmDialog';
import SubjectForm from './SubjectForm';

const GRADE_OPTIONS = [7, 8, 9, 10, 11, 12].map((g) => ({
  value: String(g),
  label: `Grade ${g}`,
}));

export default function SubjectList() {
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
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

  const fetchSubjects = useCallback(async () => {
    setLoading(true);
    try {
      const res = await subjectService.getAll({
        search: debouncedSearch,
        grade,
        status,
        page,
        limit: 10,
      });
      setSubjects(res.data.subjects);
      setPagination(res.data.pagination);
    } catch (err) {
      toast.error(err.message || 'Failed to load subjects');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, grade, status, page]);

  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

  useEffect(() => {
    // Load teachers once for showing teacher name
    teacherService
      .getAll({ limit: 100, status: 'active' })
      .then((res) => setTeachers(res.data.teachers || []))
      .catch(() => setTeachers([]));
  }, []);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, grade, status]);

  const teacherMap = teachers.reduce((acc, t) => {
    acc[t.id] = getFullName(t);
    return acc;
  }, {});

  const handleAdd = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const handleEdit = (s) => {
    setEditing(s);
    setFormOpen(true);
  };
  const handleDeleteClick = (s) => {
    setDeleting(s);
    setConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      await subjectService.deactivate(deleting.id);
      toast.success('Subject deactivated');
      setConfirmOpen(false);
      setDeleting(null);
      fetchSubjects();
    } catch (err) {
      toast.error(err.message || 'Delete failed');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="មុខវិជ្ជា"
        subtitle="Manage subjects and their teachers"
        icon={BookOpen}
        actions={
          <Button icon={Plus} onClick={handleAdd}>
            Add Subject
          </Button>
        }
      />

      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-5">
        <div className="flex flex-col sm:flex-row gap-3">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search by name, ID, description..."
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
          <LoadingSpinner message="Loading subjects..." />
        ) : subjects.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="No subjects found"
            description="Try adjusting filters or add a new subject."
            action={
              <Button icon={Plus} onClick={handleAdd}>
                Add Subject
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
                      Subject
                    </th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 py-3">
                      Subject ID
                    </th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 py-3">
                      Grade
                    </th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 py-3">
                      Teacher
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
                  {subjects.map((s) => (
                    <tr key={s.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
                            <BookOpen className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-800 text-sm">
                              {s.subjectName}
                            </p>
                            <p className="text-xs text-gray-500">{s.khmerName}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 font-mono">
                        {s.subjectId}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="info">Grade {s.grade}</Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {s.teacherId ? teacherMap[s.teacherId] || '—' : (
                          <span className="text-gray-400 italic">Unassigned</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={s.status === 'active' ? 'success' : 'default'}>
                          {s.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleEdit(s)}
                            className="p-2 rounded-lg hover:bg-gray-100 text-blue-600"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(s)}
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

      <SubjectForm
        isOpen={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        onSuccess={() => {
          setFormOpen(false);
          setEditing(null);
          fetchSubjects();
        }}
        subject={editing}
      />

      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => {
          setConfirmOpen(false);
          setDeleting(null);
        }}
        onConfirm={handleConfirmDelete}
        loading={deleteLoading}
        title="Deactivate Subject?"
        message={`Are you sure you want to deactivate "${deleting?.subjectName}"?`}
        confirmText="Deactivate"
      />
    </div>
  );
}