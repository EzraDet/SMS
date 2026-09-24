import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { BarChart3, Users, Download } from 'lucide-react';

import { classService } from '../../services/classService';
import { attendanceService } from '../../services/attendanceService';
import { getFullName } from '../../utils/formatters';

import PageHeader from '../../components/PageHeader';
import Select from '../../components/Select';
import Button from '../../components/Button';
import Badge from '../../components/Badge';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export default function AttendanceReport() {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  const [report, setReport] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    classService
      .getAll({ status: 'active', limit: 100 })
      .then((res) => setClasses(res.data.classes || []))
      .catch(() => toast.error('Failed to load classes'));
  }, []);

  const fetchReport = async () => {
    if (!selectedClass) return toast.error('Please select a class');
    setLoading(true);
    try {
      const res = await attendanceService.getMonthlyReport({
        month,
        year,
        classId: selectedClass,
      });
      setReport(res.data.report || []);
    } catch (err) {
      toast.error(err.message || 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (report.length === 0) return toast.error('No data to export');

    const headers = [
      'Student ID',
      'Name',
      'Present',
      'Absent',
      'Late',
      'Permission',
      'Total',
      'Percentage',
    ];
    const rows = report.map((r) => [
      r.student?.studentId || '',
      getFullName(r.student),
      r.present,
      r.absent,
      r.late,
      r.permission,
      r.total,
      `${r.percentage}%`,
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((v) => `"${v}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `attendance-${selectedClass}-${year}-${String(month).padStart(2, '0')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const classOptions = classes.map((c) => ({
    value: c.id,
    label: c.className,
  }));
  const monthOptions = MONTHS.map((m, i) => ({ value: i + 1, label: m }));

  return (
    <div>
      <PageHeader
        title="Attendance Report / បញ្ជីវត្តមានសិស្ស"
        subtitle="Monthly attendance summary by class"
        icon={BarChart3}
      />

      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-5">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <Select
            label="Class"
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            options={classOptions}
            placeholder="Select class"
          />
          <Select
            label="Month"
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            options={monthOptions}
            placeholder="Month"
          />
          <Select
            label="Year"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            options={[2024, 2025, 2026, 2027].map((y) => ({
              value: y,
              label: String(y),
            }))}
            placeholder="Year"
          />
          <div className="flex items-end gap-2">
            <Button onClick={fetchReport} className="flex-1">
              Generate
            </Button>
            <Button
              variant="outline"
              icon={Download}
              onClick={handleExportCSV}
              disabled={report.length === 0}
            >
              CSV
            </Button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <LoadingSpinner message="Generating report..." />
        ) : report.length === 0 ? (
          <EmptyState
            icon={BarChart3}
            title="No report data"
            description="Pick a class, month, and year, then click Generate."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 py-3">
                    Student
                  </th>
                  <th className="text-center text-xs font-semibold text-gray-500 uppercase px-4 py-3">
                    Present
                  </th>
                  <th className="text-center text-xs font-semibold text-gray-500 uppercase px-4 py-3">
                    Absent
                  </th>
                  <th className="text-center text-xs font-semibold text-gray-500 uppercase px-4 py-3">
                    Late
                  </th>
                  <th className="text-center text-xs font-semibold text-gray-500 uppercase px-4 py-3">
                    Permission
                  </th>
                  <th className="text-center text-xs font-semibold text-gray-500 uppercase px-4 py-3">
                    Total
                  </th>
                  <th className="text-center text-xs font-semibold text-gray-500 uppercase px-4 py-3">
                    %
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {report.map((row) => (
                  <tr key={row.studentId} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800 text-sm">
                        {getFullName(row.student)}
                      </p>
                      <p className="text-xs text-gray-500 font-mono">
                        {row.student?.studentId}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-center text-green-600 font-semibold">
                      {row.present}
                    </td>
                    <td className="px-4 py-3 text-center text-red-600 font-semibold">
                      {row.absent}
                    </td>
                    <td className="px-4 py-3 text-center text-yellow-600 font-semibold">
                      {row.late}
                    </td>
                    <td className="px-4 py-3 text-center text-blue-600 font-semibold">
                      {row.permission}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-700">
                      {row.total}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge
                        variant={
                          row.percentage >= 90
                            ? 'success'
                            : row.percentage >= 75
                            ? 'info'
                            : row.percentage >= 60
                            ? 'warning'
                            : 'danger'
                        }
                      >
                        {row.percentage}%
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