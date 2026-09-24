import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowLeft, School, Users, BookOpen, GraduationCap,
  ClipboardList, CalendarCheck, BarChart3, Award,
} from 'lucide-react';

import { classService } from '../../services/classService';
import { scoreService } from '../../services/scoreService';
import { getFullName, getInitials, formatDate } from '../../utils/formatters';
import PageHeader from '../../components/PageHeader';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import Select from '../../components/Select';

const SERVER_URL = 'http://localhost:5000';

export default function ClassDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [tab, setTab] = useState('overview'); // overview | grading | attendance
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await classService.getStudents(id);
        if (mounted) setData(res.data);
      } catch (err) {
        toast.error(err.message || 'Failed to load class');
        navigate('/classes');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [id, navigate]);

  if (loading) return <LoadingSpinner message="Loading class..." />;
  if (!data) return null;

  const { class: cls, classTeacher, students, subjects, stats } = data;

  const tabs = [
    { key: 'overview', label: 'Overview', icon: BarChart3 },
    { key: 'grading', label: 'Grading', icon: ClipboardList },
    { key: 'attendance', label: 'Attendance', icon: CalendarCheck },
  ];

  return (
    <div>
      <div className="mb-4">
        <Link
          to="/classes"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-primary-600"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Classes
        </Link>
      </div>

      <PageHeader
        title={`Class ${cls.className}`}
        subtitle={`Grade ${cls.grade} • ${cls.academicYear} • ${cls.room || 'No room'}`}
        icon={School}
        actions={
          <div className="flex gap-2">
            <Badge variant="info">{students.length} students</Badge>
            <Badge variant={cls.status === 'active' ? 'success' : 'default'}>
              {cls.status}
            </Badge>
          </div>
        }
      />

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 mb-5">
        <div className="flex border-b border-gray-200 overflow-x-auto">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition whitespace-nowrap
                ${
                  tab === key
                    ? 'border-primary-600 text-primary-700'
                    : 'border-transparent text-gray-600 hover:text-gray-800'
                }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab: Overview */}
      {tab === 'overview' && (
        <OverviewTab cls={cls} classTeacher={classTeacher} students={students} subjects={subjects} stats={stats} />
      )}

      {/* Tab: Grading */}
      {tab === 'grading' && (
        <GradingTab classId={id} subjects={subjects} />
      )}

      {/* Tab: Attendance */}
      {tab === 'attendance' && (
        <AttendanceTab classId={id} />
      )}
    </div>
  );
}

// ==================== TAB: OVERVIEW ====================
function OverviewTab({ cls, classTeacher, students, subjects, stats }) {
  return (
    <>
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-5">
        <InfoCard title="Total Students" value={stats.totalStudents} icon={Users} color="primary" />
        <InfoCard
          title="Male / Female"
          value={`${stats.male} / ${stats.female}`}
          icon={Users}
          color="blue"
        />
        <InfoCard title="Avg Attendance" value={`${stats.attendanceRate}%`} icon={CalendarCheck} color="green" />
        <InfoCard title="Avg Score" value={`${stats.avgScore}%`} icon={BarChart3} color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
        {/* Class teacher */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-800 mb-4">Class Teacher</h3>
          {classTeacher ? (
            <div className="flex items-center gap-3">
              {classTeacher.photo ? (
                <img
                  src={
                    classTeacher.photo.startsWith('http')
                      ? classTeacher.photo
                      : `${SERVER_URL}${classTeacher.photo}`
                  }
                  alt={getFullName(classTeacher)}
                  className="w-14 h-14 rounded-full object-cover border-2 border-white shadow"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              ) : (
                <div className="w-14 h-14 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold">
                  {getInitials(classTeacher.firstName, classTeacher.lastName)}
                </div>
              )}
              <div>
                <p className="font-medium text-gray-800">{getFullName(classTeacher)}</p>
                <p className="text-xs text-gray-500">{classTeacher.position}</p>
                <p className="text-xs text-gray-400 mt-0.5">{classTeacher.phone}</p>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No class teacher assigned</p>
          )}
        </div>

        {/* Class info */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-800 mb-4">Class Information</h3>
          <div className="space-y-2 text-sm">
            <Row label="Class ID" value={cls.classId} />
            <Row label="Grade" value={cls.grade} />
            <Row label="Section" value={cls.section || '—'} />
            <Row label="Room" value={cls.room || '—'} />
            <Row label="Max Students" value={cls.maxStudents} />
          </div>
        </div>

        {/* Subjects for this grade */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-800 mb-4">
            Subjects ({subjects.length})
          </h3>
          {subjects.length === 0 ? (
            <p className="text-gray-500 text-sm">No subjects for this grade</p>
          ) : (
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {subjects.map((s) => (
                <div key={s.id} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700 truncate">{s.subjectName}</span>
                  <Badge variant="info">Grade {s.grade}</Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Students table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-800">Enrolled Students ({students.length})</h3>
        </div>
        {students.length === 0 ? (
          <EmptyState icon={Users} title="No students" description="No students in this class yet." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 py-3">Student</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 py-3">ID</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 py-3">Gender</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 py-3">Enrolled</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {students.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link to={`/students/${s.id}`} className="flex items-center gap-3">
                        {s.photo ? (
                          <img
                            src={s.photo.startsWith('http') ? s.photo : `${SERVER_URL}${s.photo}`}
                            alt={getFullName(s)}
                            className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-semibold text-xs">
                            {getInitials(s.firstName, s.lastName)}
                          </div>
                        )}
                        <span className="font-medium text-gray-800 text-sm">{getFullName(s)}</span>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 font-mono">{s.studentId}</td>
                    <td className="px-4 py-3">
                      <Badge variant={s.gender === 'male' ? 'info' : 'purple'}>{s.gender}</Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{formatDate(s.enrollmentDate)}</td>
                    <td className="px-4 py-3">
                      <Badge variant={s.status === 'active' ? 'success' : 'default'}>{s.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

// ==================== TAB: GRADING ====================
function GradingTab({ classId, subjects }) {
  const [subjectId, setSubjectId] = useState('');
  const [type, setType] = useState('monthly');
  const [month, setMonth] = useState('October');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (subjects.length > 0 && !subjectId) {
      setSubjectId(subjects[0].id);
    }
  }, [subjects, subjectId]);

  useEffect(() => {
    if (!subjectId) return;
    setLoading(true);
    scoreService
      .getAll({ classId, subjectId, type, month: type === 'monthly' ? month : '' })
      .then((res) => setData(res.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [classId, subjectId, type, month]);

  const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  const TYPES = [
    { value: 'monthly', label: 'Monthly' },
    { value: 'semester1', label: 'Semester 1' },
    { value: 'semester2', label: 'Semester 2' },
    { value: 'final', label: 'Final Exam' },
  ];

  return (
    <div>
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Select
            label="Subject"
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
            options={subjects.map((s) => ({ value: s.id, label: s.subjectName }))}
            placeholder="Select subject"
          />
          <Select
            label="Score Type"
            value={type}
            onChange={(e) => setType(e.target.value)}
            options={TYPES}
            placeholder="Type"
          />
          {type === 'monthly' && (
            <Select
              label="Month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              options={MONTHS.map((m) => ({ value: m, label: m }))}
              placeholder="Month"
            />
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <LoadingSpinner message="Loading scores..." />
        ) : !data || data.scores.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="No scores yet"
            description="Use the Scores page to enter scores for this class."
            action={
              <Link to="/scores">
                <Button icon={ClipboardList}>Go to Score Entry</Button>
              </Link>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 py-3">Student</th>
                  <th className="text-center text-xs font-semibold text-gray-500 uppercase px-4 py-3">Score</th>
                  <th className="text-center text-xs font-semibold text-gray-500 uppercase px-4 py-3">Max</th>
                  <th className="text-center text-xs font-semibold text-gray-500 uppercase px-4 py-3">%</th>
                  <th className="text-center text-xs font-semibold text-gray-500 uppercase px-4 py-3">Grade</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 py-3">Remark</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.scores.map((sc) => {
                  const pct = Math.round((sc.score / (sc.maxScore || 100)) * 100);
                  return (
                    <tr key={sc.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-700 font-mono">{sc.studentId}</td>
                      <td className="px-4 py-3 text-center text-sm font-semibold">{sc.score}</td>
                      <td className="px-4 py-3 text-center text-sm text-gray-500">{sc.maxScore}</td>
                      <td className="px-4 py-3 text-center text-sm">{pct}%</td>
                      <td className="px-4 py-3 text-center">
                        <Badge
                          variant={
                            sc.grade === 'A' ? 'success'
                            : sc.grade === 'B' ? 'info'
                            : sc.grade === 'C' ? 'purple'
                            : sc.grade === 'D' ? 'warning'
                            : sc.grade === 'E' ? 'warning'
                            : 'danger'
                          }
                        >
                          {sc.grade}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 italic">{sc.remark || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {data && data.scores.length > 0 && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
          💡 <strong>Auto-calculated grades</strong> — the system computes each student's grade from their score percentage (A/B/C/D/E/F).
          Click <Link to="/scores" className="underline font-medium">Score Entry</Link> to add or edit scores.
        </div>
      )}
    </div>
  );
}

// ==================== TAB: ATTENDANCE ====================
function AttendanceTab({ classId }) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    classService
      .getAttendanceSummary(classId)
      .then((res) => setSummary(res.data))
      .catch(() => setSummary(null))
      .finally(() => setLoading(false));
  }, [classId]);

  if (loading) return <LoadingSpinner message="Loading attendance..." />;
  if (!summary) return <EmptyState icon={CalendarCheck} title="No data" description="Attendance data unavailable." />;

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-5">
        <InfoCard title="Total Records" value={summary.summary.totalRecords} icon={CalendarCheck} color="primary" />
        <InfoCard title="Present" value={summary.summary.present} icon={CalendarCheck} color="green" />
        <InfoCard title="Absent" value={summary.summary.absent} icon={CalendarCheck} color="red" />
        <InfoCard title="Late" value={summary.summary.late} icon={CalendarCheck} color="yellow" />
        <InfoCard title="Rate" value={`${summary.summary.rate}%`} icon={BarChart3} color="purple" />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="font-semibold text-gray-800">Per-Student Attendance</h3>
          <Link to="/attendance">
            <Button variant="outline" size="sm" icon={CalendarCheck}>Mark Attendance</Button>
          </Link>
        </div>

        {summary.rows.length === 0 ? (
          <EmptyState icon={CalendarCheck} title="No attendance data" description="Start marking attendance for this class." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 py-3">Student</th>
                  <th className="text-center text-xs font-semibold text-gray-500 uppercase px-4 py-3 text-green-600">Present</th>
                  <th className="text-center text-xs font-semibold text-gray-500 uppercase px-4 py-3 text-red-600">Absent</th>
                  <th className="text-center text-xs font-semibold text-gray-500 uppercase px-4 py-3 text-yellow-600">Late</th>
                  <th className="text-center text-xs font-semibold text-gray-500 uppercase px-4 py-3 text-blue-600">Permission</th>
                  <th className="text-center text-xs font-semibold text-gray-500 uppercase px-4 py-3">Total</th>
                  <th className="text-center text-xs font-semibold text-gray-500 uppercase px-4 py-3">%</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {summary.rows.map((r) => (
                  <tr key={r.student.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {r.student.photo ? (
                          <img
                            src={r.student.photo.startsWith('http') ? r.student.photo : `${SERVER_URL}${r.student.photo}`}
                            alt={getFullName(r.student)}
                            className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-semibold text-xs">
                            {getInitials(r.student.firstName, r.student.lastName)}
                          </div>
                        )}
                        <span className="font-medium text-gray-800 text-sm">{getFullName(r.student)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-green-600 font-semibold">{r.present}</td>
                    <td className="px-4 py-3 text-center text-sm text-red-600 font-semibold">{r.absent}</td>
                    <td className="px-4 py-3 text-center text-sm text-yellow-600 font-semibold">{r.late}</td>
                    <td className="px-4 py-3 text-center text-sm text-blue-600 font-semibold">{r.permission}</td>
                    <td className="px-4 py-3 text-center text-sm text-gray-700">{r.total}</td>
                    <td className="px-4 py-3 text-center">
                      <Badge
                        variant={
                          r.percentage >= 90 ? 'success'
                          : r.percentage >= 75 ? 'info'
                          : r.percentage >= 60 ? 'warning'
                          : 'danger'
                        }
                      >
                        {r.percentage}%
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ==================== Shared helpers ====================
function InfoCard({ title, value, icon: Icon, color }) {
  const colors = {
    primary: 'bg-primary-100 text-primary-600',
    green: 'bg-green-100 text-green-600',
    red: 'bg-red-100 text-red-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    purple: 'bg-purple-100 text-purple-600',
    blue: 'bg-blue-100 text-blue-600',
  };
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center justify-between">
        <div className="min-w-0">
          <p className="text-xs text-gray-500 truncate">{title}</p>
          <p className="text-lg font-bold text-gray-800 mt-0.5 truncate">{value}</p>
        </div>
        <div className={`p-2 rounded-lg flex-shrink-0 ${colors[color]}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-800">{value}</span>
    </div>
  );
}