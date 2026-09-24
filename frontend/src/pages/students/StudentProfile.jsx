import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  Pencil,
  Mail,
  Phone,
  MapPin,
  Calendar,
  User as UserIcon,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
} from 'lucide-react';

import { studentService } from '../../services/studentService';
import { getFullName, getInitials, formatDate } from '../../utils/formatters';
import { GRADE_COLORS } from '../../utils/constants';

import PageHeader from '../../components/PageHeader';
import Button from '../../components/Button';
import Badge from '../../components/Badge';
import LoadingSpinner from '../../components/LoadingSpinner';

const SERVER_URL = 'http://localhost:5000';

export default function StudentProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await studentService.getProfile(id);
        if (mounted) setData(res.data);
      } catch (err) {
        toast.error(err.message || 'Failed to load profile');
        navigate('/students');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id, navigate]);

  if (loading) return <LoadingSpinner message="Loading profile..." />;
  if (!data) return null;

  const { student, class: cls, classTeacher, attendance, scores } = data;

  const attendanceItems = [
    { label: 'Present', value: attendance.present, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Absent', value: attendance.absent, icon: XCircle, color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'Late', value: attendance.late, icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50' },
    { label: 'Permission', value: attendance.permission, icon: AlertCircle, color: 'text-blue-600', bg: 'bg-blue-50' },
  ];

  return (
    <div>
      <div className="mb-4">
        <Link
          to="/students"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-primary-600"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Students
        </Link>
      </div>

      <PageHeader
        title="Student Profile"
        subtitle={`Detailed view for ${getFullName(student)}`}
        icon={Users}
        actions={
          <Link to="/students">
            <Button icon={Pencil} variant="outline">
              Edit
            </Button>
          </Link>
        }
      />

      {/* Profile Card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-5">
        <div className="flex flex-col sm:flex-row items-start gap-5">
          {/* ==================== PHOTO / INITIALS ==================== */}
          {student.photo ? (
            <img
              src={`${SERVER_URL}${student.photo}`}
              alt={getFullName(student)}
              className="w-20 h-20 rounded-full object-cover flex-shrink-0 border-4 border-white shadow-lg"
              onError={(e) => {
                e.target.onerror = null;
                e.target.replaceWith(
                  Object.assign(document.createElement('div'), {
                    className:
                      'w-20 h-20 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-2xl flex-shrink-0',
                    textContent: getInitials(student.firstName, student.lastName),
                  })
                );
              }}
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-2xl flex-shrink-0">
              {getInitials(student.firstName, student.lastName)}
            </div>
          )}

          <div className="flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-gray-800">
                  {getFullName(student)}
                </h2>
                <p className="text-gray-500">{student.khmerName}</p>
                <p className="text-sm text-gray-400 font-mono mt-1">
                  {student.studentId}
                </p>
              </div>
              <div className="flex gap-2">
                <Badge variant={student.gender === 'male' ? 'info' : 'purple'}>
                  {student.gender}
                </Badge>
                <Badge variant={student.status === 'active' ? 'success' : 'default'}>
                  {student.status}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-5 pt-5 border-t border-gray-100">
              <InfoItem icon={Mail} label="Email" value={student.email || '—'} />
              <InfoItem icon={Phone} label="Phone" value={student.phone || '—'} />
              <InfoItem icon={Calendar} label="Date of Birth" value={formatDate(student.dateOfBirth)} />
              <InfoItem icon={MapPin} label="Address" value={student.address || '—'} />
              <InfoItem icon={UserIcon} label="Parent" value={student.parentName || '—'} />
              <InfoItem icon={Phone} label="Parent Phone" value={student.parentPhone || '—'} />
            </div>
          </div>
        </div>
      </div>

      {/* Class Info + Attendance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-800 mb-4">Class Information</h3>
          {cls ? (
            <div className="space-y-3 text-sm">
              <Row label="Class" value={cls.className} />
              <Row label="Grade" value={cls.grade} />
              <Row label="Room" value={cls.room} />
              <Row
                label="Class Teacher"
                value={classTeacher ? getFullName(classTeacher) : '—'}
              />
              <Row label="Academic Year" value={student.academicYear} />
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No class assigned</p>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">Attendance Summary</h3>
            <Badge variant="info">{attendance.percentage}%</Badge>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {attendanceItems.map(({ label, value, icon: Icon, color, bg }) => (
              <div key={label} className={`${bg} rounded-lg p-3`}>
                <div className="flex items-center gap-2">
                  <Icon className={`w-4 h-4 ${color}`} />
                  <span className="text-xs text-gray-600">{label}</span>
                </div>
                <p className={`text-xl font-bold mt-1 ${color}`}>{value}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Total Records</span>
              <span className="font-semibold">{attendance.total}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Scores */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-800">Score Summary</h3>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-500">Average:</span>
            <span className="font-bold text-gray-800">{scores.average}</span>
            <Badge variant="info">{scores.percentage}%</Badge>
          </div>
        </div>

        {scores.records.length === 0 ? (
          <p className="text-gray-500 text-sm">No scores recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-y border-gray-200">
                <tr>
                  <th className="text-left px-3 py-2 font-medium text-gray-600">Subject</th>
                  <th className="text-left px-3 py-2 font-medium text-gray-600">Type</th>
                  <th className="text-left px-3 py-2 font-medium text-gray-600">Score</th>
                  <th className="text-left px-3 py-2 font-medium text-gray-600">Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {scores.records.map((rec) => (
                  <tr key={rec.id}>
                    <td className="px-3 py-2 text-gray-800">
                      {rec.subject?.subjectName || '—'}
                    </td>
                    <td className="px-3 py-2 text-gray-600">
                      {rec.type} {rec.month ? `- ${rec.month}` : ''}
                    </td>
                    <td className="px-3 py-2 font-medium">
                      {rec.score}/{rec.maxScore}
                    </td>
                    <td className="px-3 py-2">
                      <Badge variant={GRADE_COLORS[rec.grade] || 'default'}>
                        {rec.grade}
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

function InfoItem({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-sm text-gray-800 truncate">{value}</p>
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