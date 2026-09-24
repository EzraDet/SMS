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
  BookOpen,
  School,
  Users,
} from 'lucide-react';

import { teacherService } from '../../services/teacherService';
import { getFullName, getInitials, formatDate } from '../../utils/formatters';

import PageHeader from '../../components/PageHeader';
import Button from '../../components/Button';
import Badge from '../../components/Badge';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function TeacherProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await teacherService.getProfile(id);
        if (mounted) setData(res.data);
      } catch (err) {
        toast.error(err.message || 'Failed to load teacher');
        navigate('/teachers');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [id, navigate]);

  if (loading) return <LoadingSpinner message="Loading teacher..." />;
  if (!data) return null;

  const { teacher, subjects, classes, totalStudents } = data;

  return (
    <div>
      <div className="mb-4">
        <Link
          to="/teachers"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-primary-600"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Teachers
        </Link>
      </div>

      <PageHeader
        title="Teacher Profile"
        subtitle={`Details for ${getFullName(teacher)}`}
        icon={Users}
        actions={<Button icon={Pencil} variant="outline">Edit</Button>}
      />

      {/* Profile card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-5">
        <div className="flex flex-col sm:flex-row items-start gap-5">
          <div className="w-20 h-20 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-2xl flex-shrink-0">
            {getInitials(teacher.firstName, teacher.lastName)}
          </div>
          <div className="flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-gray-800">{getFullName(teacher)}</h2>
                <p className="text-gray-500">{teacher.khmerName}</p>
                <p className="text-sm text-gray-400 font-mono mt-1">{teacher.teacherId}</p>
                <p className="text-sm text-primary-600 mt-1">{teacher.position}</p>
              </div>
              <div className="flex gap-2">
                <Badge variant={teacher.gender === 'male' ? 'info' : 'purple'}>
                  {teacher.gender}
                </Badge>
                <Badge variant={teacher.status === 'active' ? 'success' : 'default'}>
                  {teacher.status}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-5 pt-5 border-t border-gray-100">
              <InfoItem icon={Mail} label="Email" value={teacher.email || '—'} />
              <InfoItem icon={Phone} label="Phone" value={teacher.phone || '—'} />
              <InfoItem icon={Calendar} label="Hire Date" value={formatDate(teacher.hireDate)} />
              <InfoItem icon={MapPin} label="Address" value={teacher.address || '—'} />
              <InfoItem icon={Calendar} label="Date of Birth" value={formatDate(teacher.dateOfBirth)} />
              <InfoItem icon={Users} label="Total Students" value={totalStudents} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Subjects */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-5 h-5 text-primary-600" />
            <h3 className="font-semibold text-gray-800">
              Subjects Taught ({subjects.length})
            </h3>
          </div>
          {subjects.length === 0 ? (
            <p className="text-gray-500 text-sm">No subjects assigned.</p>
          ) : (
            <div className="space-y-2">
              {subjects.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-800">{s.subjectName}</p>
                    <p className="text-xs text-gray-500">{s.khmerName}</p>
                  </div>
                  <Badge variant="info">Grade {s.grade}</Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Classes */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <School className="w-5 h-5 text-primary-600" />
            <h3 className="font-semibold text-gray-800">
              Assigned Classes ({classes.length})
            </h3>
          </div>
          {classes.length === 0 ? (
            <p className="text-gray-500 text-sm">No classes assigned.</p>
          ) : (
            <div className="space-y-2">
              {classes.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {c.className} — Room {c.room || 'N/A'}
                    </p>
                    <p className="text-xs text-gray-500">{c.academicYear}</p>
                  </div>
                  <Badge variant="purple">{c.studentCount} students</Badge>
                </div>
              ))}
            </div>
          )}
        </div>
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