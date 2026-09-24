import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FileText, Download, Users, GraduationCap, BookOpen, Printer } from 'lucide-react';

import { studentService } from '../../services/studentService';
import { teacherService } from '../../services/teacherService';
import { classService } from '../../services/classService';
import { exportToCSV } from '../../utils/exporter';
import { getFullName } from '../../utils/formatters';

import PageHeader from '../../components/PageHeader';
import Button from '../../components/Button';
import LoadingSpinner from '../../components/LoadingSpinner';
import Badge from '../../components/Badge';

const REPORTS = [
  { key: 'students', label: 'Student List', icon: Users, color: 'primary' },
  { key: 'teachers', label: 'Teacher List', icon: GraduationCap, color: 'green' },
  { key: 'classes', label: 'Class List', icon: BookOpen, color: 'purple' },
];

export default function ReportsPage() {
  const [active, setActive] = useState('students');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = async (key) => {
    setLoading(true);
    try {
      let rows = [];
      if (key === 'students') {
        const res = await studentService.getAll({ limit: 500, status: 'active' });
        rows = res.data.students.map((s) => ({
          StudentID: s.studentId,
          Name: getFullName(s),
          KhmerName: s.khmerName || '',
          Gender: s.gender,
          DOB: s.dateOfBirth || '',
          Phone: s.phone || '',
          Email: s.email || '',
          ClassId: s.classId || '',
          AcademicYear: s.academicYear || '',
          Status: s.status,
        }));
      } else if (key === 'teachers') {
        const res = await teacherService.getAll({ limit: 500, status: 'active' });
        rows = res.data.teachers.map((t) => ({
          TeacherID: t.teacherId,
          Name: getFullName(t),
          KhmerName: t.khmerName || '',
          Gender: t.gender,
          Position: t.position || '',
          Phone: t.phone || '',
          Email: t.email || '',
          HireDate: t.hireDate || '',
          Status: t.status,
        }));
      } else if (key === 'classes') {
        const res = await classService.getAll({ limit: 500, status: 'active' });
        rows = res.data.classes.map((c) => ({
          ClassID: c.classId,
          ClassName: c.className,
          Grade: c.grade,
          Section: c.section || '',
          Room: c.room || '',
          AcademicYear: c.academicYear,
          MaxStudents: c.maxStudents,
          Status: c.status,
        }));
      }
      setData(rows);
    } catch (err) {
      toast.error(err.message || 'Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(active);
  }, [active]);

  const handleExport = () => {
    if (data.length === 0) return toast.error('No data to export');
    exportToCSV(data, active);
    toast.success('CSV downloaded');
  };

  const handlePrint = () => window.print();

  const columns = data.length > 0 ? Object.keys(data[0]) : [];

  return (
    <div className="print-area">
      <div className="no-print">
        <PageHeader
          title="Reports"
          subtitle="View, print and export school data"
          icon={FileText}
          actions={
            <>
              <Button variant="outline" icon={Printer} onClick={handlePrint} disabled={!data.length}>
                Print
              </Button>
              <Button icon={Download} onClick={handleExport} disabled={!data.length}>
                Export CSV
              </Button>
            </>
          }
        />

        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-5">
          <div className="flex flex-wrap gap-2">
            {REPORTS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActive(key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition
                  ${
                    active === key
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <LoadingSpinner message="Loading report..." />
        ) : data.length === 0 ? (
          <div className="p-12 text-center text-gray-500">No data available.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 py-3">
                    #
                  </th>
                  {columns.map((col) => (
                    <th
                      key={col}
                      className="text-left text-xs font-semibold text-gray-500 uppercase px-4 py-3"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.map((row, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-gray-400">{idx + 1}</td>
                    {columns.map((col) => (
                      <td key={col} className="px-4 py-2 text-gray-700">
                        {String(row[col] ?? '')}
                      </td>
                    ))}
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