import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  CalendarCheck,
  Save,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
} from 'lucide-react';

import { classService } from '../../services/classService';
import { attendanceService } from '../../services/attendanceService';
import { getFullName, getInitials } from '../../utils/formatters';
import { ATTENDANCE_STATUSES } from '../../utils/constants';

import PageHeader from '../../components/PageHeader';
import Button from '../../components/Button';
import Select from '../../components/Select';
import Badge from '../../components/Badge';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import Input from '../../components/Input';

const SERVER_URL = 'http://localhost:5000';

export default function AttendancePage() {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // local editable state: { [studentId]: { status, remark } }
  const [marks, setMarks] = useState({});

  // Load classes
  useEffect(() => {
    classService
      .getAll({ status: 'active', limit: 100 })
      .then((res) => {
        setClasses(res.data.classes || []);
        if (res.data.classes?.length && !selectedClass) {
          setSelectedClass(res.data.classes[0].id);
        }
      })
      .catch(() => toast.error('Failed to load classes'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchClassAttendance = useCallback(async () => {
    if (!selectedClass || !date) return;
    setLoading(true);
    try {
      const res = await attendanceService.getClassAttendance(
        selectedClass,
        date
      );
      setData(res.data);

      // Seed local marks
      const initialMarks = {};
      res.data.items.forEach((item) => {
        initialMarks[item.student.id] = {
          status: item.status || '',
          remark: item.remark || '',
          attendanceId: item.attendanceId,
        };
      });
      setMarks(initialMarks);
    } catch (err) {
      toast.error(err.message || 'Failed to load attendance');
    } finally {
      setLoading(false);
    }
  }, [selectedClass, date]);

  useEffect(() => {
    fetchClassAttendance();
  }, [fetchClassAttendance]);

  const setStatus = (studentId, status) => {
    setMarks((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], status },
    }));
  };

  const setRemark = (studentId, remark) => {
    setMarks((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], remark },
    }));
  };

  const markAll = (status) => {
    if (!data) return;
    const next = { ...marks };
    data.items.forEach((item) => {
      next[item.student.id] = { ...next[item.student.id], status };
    });
    setMarks(next);
  };

  const handleSave = async () => {
    if (!data || !selectedClass) return;

    const records = data.items.map((item) => ({
      studentId: item.student.id,
      status: marks[item.student.id]?.status || 'present',
      remark: marks[item.student.id]?.remark || '',
    }));

    if (records.every((r) => !r.status)) {
      return toast.error('Please mark at least one student');
    }

    setSaving(true);
    try {
      await attendanceService.bulkSave({
        classId: selectedClass,
        date,
        academicYear: data.class?.academicYear || '',
        records,
      });
      toast.success('Attendance saved successfully');
      fetchClassAttendance();
    } catch (err) {
      toast.error(err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  // Live summary
  const summary = (() => {
    if (!data) return null;
    const counts = { present: 0, absent: 0, late: 0, permission: 0, unmarked: 0 };
    data.items.forEach((item) => {
      const status = marks[item.student.id]?.status;
      if (!status) counts.unmarked++;
      else counts[status] = (counts[status] || 0) + 1;
    });
    return counts;
  })();

  const classOptions = classes.map((c) => ({
    value: c.id,
    label: `${c.className} (Grade ${c.grade}) — ${c.room || 'No room'}`,
  }));

  return (
    <div>
      <PageHeader
        title="Attendance / វត្តមានសិស្ស"
        subtitle="Mark and manage daily attendance"
        icon={CalendarCheck}
        actions={
          data && data.items.length > 0 ? (
            <Button
              icon={Save}
              onClick={handleSave}
              loading={saving}
              disabled={loading}
            >
              Save Attendance
            </Button>
          ) : null
        }
      />

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Select
            label="Class"
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            options={classOptions}
            placeholder="Select a class"
          />
          <Input
            label="Date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <div className="flex items-end gap-2">
            <Button
              variant="outline"
              onClick={() => markAll('present')}
              disabled={!data || !data.items.length}
              className="flex-1"
            >
              All Present
            </Button>
            <Button
              variant="outline"
              onClick={() => markAll('absent')}
              disabled={!data || !data.items.length}
              className="flex-1"
            >
              All Absent
            </Button>
          </div>
        </div>
      </div>

      {/* Summary cards */}
      {summary && data && data.items.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-5">
          <SummaryCard
            label="Present"
            value={summary.present}
            color="text-green-600"
            bg="bg-green-50"
            icon={CheckCircle2}
          />
          <SummaryCard
            label="Absent"
            value={summary.absent}
            color="text-red-600"
            bg="bg-red-50"
            icon={XCircle}
          />
          <SummaryCard
            label="Late"
            value={summary.late}
            color="text-yellow-600"
            bg="bg-yellow-50"
            icon={Clock}
          />
          <SummaryCard
            label="Permission"
            value={summary.permission}
            color="text-blue-600"
            bg="bg-blue-50"
            icon={AlertCircle}
          />
          <SummaryCard
            label="Unmarked"
            value={summary.unmarked}
            color="text-gray-600"
            bg="bg-gray-50"
            icon={Users}
          />
        </div>
      )}

      {/* Roster */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <LoadingSpinner message="Loading students..." />
        ) : !selectedClass ? (
          <EmptyState
            icon={CalendarCheck}
            title="Select a class"
            description="Choose a class and date to start marking attendance."
          />
        ) : !data || data.items.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No students in this class"
            description="Add students to this class first."
          />
        ) : (
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
                  <th className="text-center text-xs font-semibold text-gray-500 uppercase px-4 py-3">
                    Status
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 py-3">
                    Remark
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.items.map((item) => {
                  const mark = marks[item.student.id] || {};
                  return (
                    <tr key={item.student.id} className="hover:bg-gray-50">
                      {/* ✅ PHOTO + NAME */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {item.student.photo ? (
                            <img
                              src={
                                item.student.photo.startsWith('http')
                                  ? item.student.photo
                                  : `${SERVER_URL}${item.student.photo}`
                              }
                              alt={getFullName(item.student)}
                              className="w-9 h-9 rounded-full object-cover flex-shrink-0 border border-gray-200"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.replaceWith(
                                  Object.assign(document.createElement('div'), {
                                    className:
                                      'w-9 h-9 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-semibold text-xs flex-shrink-0',
                                    textContent: getInitials(
                                      item.student.firstName,
                                      item.student.lastName
                                    ),
                                  })
                                );
                              }}
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-semibold text-xs flex-shrink-0">
                              {getInitials(
                                item.student.firstName,
                                item.student.lastName
                              )}
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-gray-800 text-sm">
                              {getFullName(item.student)}
                            </p>
                            <p className="text-xs text-gray-500">
                              {item.student.khmerName}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3 text-sm font-mono text-gray-600">
                        {item.student.studentId}
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex justify-center gap-1 flex-wrap">
                          {ATTENDANCE_STATUSES.map((s) => (
                            <button
                              key={s.value}
                              onClick={() => setStatus(item.student.id, s.value)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition border
                                ${
                                  mark.status === s.value
                                    ? statusActiveClass(s.value)
                                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                                }`}
                            >
                              {s.label}
                            </button>
                          ))}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={mark.remark || ''}
                          onChange={(e) =>
                            setRemark(item.student.id, e.target.value)
                          }
                          placeholder="Optional note"
                          className="w-full max-w-[200px] px-2 py-1.5 border border-gray-200 rounded-lg text-sm
                            focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function statusActiveClass(status) {
  switch (status) {
    case 'present':
      return 'bg-green-600 text-white border-green-600';
    case 'absent':
      return 'bg-red-600 text-white border-red-600';
    case 'late':
      return 'bg-yellow-500 text-white border-yellow-500';
    case 'permission':
      return 'bg-blue-600 text-white border-blue-600';
    default:
      return 'bg-primary-600 text-white border-primary-600';
  }
}

function SummaryCard({ label, value, color, bg, icon: Icon }) {
  return (
    <div className={`${bg} rounded-xl p-4`}>
      <div className="flex items-center gap-2">
        <Icon className={`w-4 h-4 ${color}`} />
        <span className="text-xs text-gray-600">{label}</span>
      </div>
      <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
    </div>
  );
}