import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { ClipboardList, Save } from 'lucide-react';

import { classService } from '../../services/classService';
import { subjectService } from '../../services/subjectService';
import { scoreService } from '../../services/scoreService';
import { academicYearService } from '../../services/academicYearService';
import { getFullName, getInitials } from '../../utils/formatters';
import { SCORE_TYPES, MONTHS } from '../../utils/constants';

import PageHeader from '../../components/PageHeader';
import Button from '../../components/Button';
import Select from '../../components/Select';
import Badge from '../../components/Badge';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';

const SERVER_URL = 'http://localhost:5000';

export default function ScoreEntry() {
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);

  const [classId, setClassId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [type, setType] = useState('monthly');
  const [month, setMonth] = useState('October');
  const [academicYear, setAcademicYear] = useState('');

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Editable local scores: { [studentId]: { score, maxScore, remark } }
  const [entries, setEntries] = useState({});

  // ==================== LOAD DROPDOWN DATA ====================
  useEffect(() => {
    classService
      .getAll({ status: 'active', limit: 100 })
      .then((res) => {
        setClasses(res.data.classes || []);
        if (res.data.classes?.length && !classId) {
          setClassId(res.data.classes[0].id);
        }
      })
      .catch(() => toast.error('Failed to load classes'));

    subjectService
      .getAll({ status: 'active', limit: 100 })
      .then((res) => {
        setSubjects(res.data.subjects || []);
        if (res.data.subjects?.length && !subjectId) {
          setSubjectId(res.data.subjects[0].id);
        }
      })
      .catch(() => toast.error('Failed to load subjects'));

    academicYearService
      .getAll({ limit: 100 })
      .then((res) => {
        const years = res.data.academicYears || [];
        setAcademicYears(years);
        const active = years.find((y) => y.isActive);
        if (active && !academicYear) setAcademicYear(active.id);
        else if (!active && years[0] && !academicYear) setAcademicYear(years[0].id);
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ==================== FETCH SCORES ====================
  const fetchScores = useCallback(async () => {
    if (!classId || !subjectId || !type) return;
    setLoading(true);
    try {
      const res = await scoreService.getClassSubjectScores(classId, subjectId, {
        type,
        month: type === 'monthly' ? month : '',
        academicYear,
      });
      setData(res.data);

      const initial = {};
      res.data.items.forEach((item) => {
        initial[item.student.id] = {
          score: item.value,
          maxScore: item.maxScore,
          remark: item.remark,
        };
      });
      setEntries(initial);
    } catch (err) {
      toast.error(err.message || 'Failed to load scores');
    } finally {
      setLoading(false);
    }
  }, [classId, subjectId, type, month, academicYear]);

  useEffect(() => {
    fetchScores();
  }, [fetchScores]);

  const setEntry = (studentId, field, value) => {
    setEntries((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], [field]: value },
    }));
  };

  const handleSave = async () => {
    if (!data) return;

    const records = data.items
      .map((item) => {
        const e = entries[item.student.id] || {};
        return {
          studentId: item.student.id,
          score: e.score === '' || e.score === undefined ? null : Number(e.score),
          maxScore: Number(e.maxScore || 100),
          remark: e.remark || '',
        };
      })
      .filter((r) => r.score !== null);

    if (records.length === 0) {
      return toast.error('Please enter at least one score');
    }

    setSaving(true);
    try {
      await scoreService.bulkSave({
        classId,
        subjectId,
        academicYear,
        type,
        month: type === 'monthly' ? month : '',
        records,
      });
      toast.success('Scores saved successfully');
      fetchScores();
    } catch (err) {
      toast.error(err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  // ==================== OPTIONS ====================
  const classOptions = classes.map((c) => ({
    value: c.id,
    label: `${c.className} (Grade ${c.grade})`,
  }));

  const subjectOptions = subjects.map((s) => ({
    value: s.id,
    label: `${s.subjectName} (Grade ${s.grade})`,
  }));

  const yearOptions = academicYears.map((y) => ({
    value: y.id,
    label: y.name + (y.isActive ? ' (Active)' : ''),
  }));

  const typeOptions = SCORE_TYPES;
  const monthOptions = MONTHS.map((m) => ({ value: m, label: m }));

  return (
    <div>
      <PageHeader
        title="Score Entry / តារាងស្រង់ពិន្ទុសិស្ស"
        subtitle="Enter scores for a class and subject"
        icon={ClipboardList}
        actions={
          data && data.items.length > 0 ? (
            <Button icon={Save} onClick={handleSave} loading={saving}>
              Save Scores
            </Button>
          ) : null
        }
      />

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <Select
            label="Class"
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
            options={classOptions}
            placeholder="Select class"
          />
          <Select
            label="Subject"
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
            options={subjectOptions}
            placeholder="Select subject"
          />
          <Select
            label="Type"
            value={type}
            onChange={(e) => setType(e.target.value)}
            options={typeOptions}
            placeholder="Select type"
          />
          {type === 'monthly' && (
            <Select
              label="Month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              options={monthOptions}
              placeholder="Select month"
            />
          )}
          <Select
            label="Academic Year"
            value={academicYear}
            onChange={(e) => setAcademicYear(e.target.value)}
            options={yearOptions}
            placeholder="Select year"
          />
        </div>
      </div>

      {/* Roster */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <LoadingSpinner message="Loading students..." />
        ) : !data || data.items.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="No students"
            description="Pick a class and subject to enter scores."
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
                  <th className="text-center text-xs font-semibold text-gray-500 uppercase px-4 py-3 w-32">
                    Score
                  </th>
                  <th className="text-center text-xs font-semibold text-gray-500 uppercase px-4 py-3 w-24">
                    Max
                  </th>
                  <th className="text-center text-xs font-semibold text-gray-500 uppercase px-4 py-3 w-20">
                    Grade
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 py-3">
                    Remark
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.items.map((item) => {
                  const e = entries[item.student.id] || {};
                  const max = Number(e.maxScore || 100);
                  const pct =
                    e.score !== '' && e.score !== undefined && !isNaN(e.score)
                      ? (Number(e.score) / max) * 100
                      : 0;
                  const grade =
                    pct >= 90 ? 'A'
                    : pct >= 80 ? 'B'
                    : pct >= 70 ? 'C'
                    : pct >= 60 ? 'D'
                    : pct >= 50 ? 'E'
                    : e.score === '' || e.score === undefined ? '' : 'F';

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
                        <input
                          type="number"
                          min="0"
                          max={max}
                          value={e.score ?? ''}
                          onChange={(ev) =>
                            setEntry(item.student.id, 'score', ev.target.value)
                          }
                          className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm text-center
                            focus:outline-none focus:ring-2 focus:ring-primary-500"
                          placeholder="0"
                        />
                      </td>

                      <td className="px-4 py-3">
                        <input
                          type="number"
                          min="1"
                          value={e.maxScore ?? 100}
                          onChange={(ev) =>
                            setEntry(item.student.id, 'maxScore', ev.target.value)
                          }
                          className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm text-center
                            focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </td>

                      <td className="px-4 py-3 text-center">
                        {grade ? (
                          <Badge
                            variant={
                              grade === 'A' ? 'success'
                              : grade === 'B' ? 'info'
                              : grade === 'C' ? 'purple'
                              : grade === 'D' ? 'warning'
                              : grade === 'E' ? 'warning'
                              : 'danger'
                            }
                          >
                            {grade}
                          </Badge>
                        ) : (
                          <span className="text-gray-400 text-xs">—</span>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={e.remark || ''}
                          onChange={(ev) =>
                            setEntry(item.student.id, 'remark', ev.target.value)
                          }
                          placeholder="Optional"
                          className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm
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