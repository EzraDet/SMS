import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FileText, Printer } from 'lucide-react';

import { studentService } from '../../services/studentService';
import { scoreService } from '../../services/scoreService';
import { academicYearService } from '../../services/academicYearService';
import { getFullName, getInitials } from '../../utils/formatters';

import PageHeader from '../../components/PageHeader';
import Button from '../../components/Button';
import Select from '../../components/Select';
import Badge from '../../components/Badge';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';

const SERVER_URL = 'http://localhost:5000';

export default function StudentResults() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialStudentId = searchParams.get('studentId') || '';

  const [students, setStudents] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [studentId, setStudentId] = useState(initialStudentId);
  const [academicYear, setAcademicYear] = useState('');

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Load students
  useEffect(() => {
    studentService
      .getAll({ status: 'active', limit: 200 })
      .then((res) => setStudents(res.data.students || []))
      .catch(() => toast.error('Failed to load students'));
  }, []);

  // Load academic years — pick the active one by default
  useEffect(() => {
    academicYearService
      .getAll({ limit: 100 })
      .then((res) => {
        const years = res.data.academicYears || [];
        setAcademicYears(years);
        const active = years.find((y) => y.isActive);
        if (active && !academicYear) {
          setAcademicYear(active.id);
        } else if (!active && years[0] && !academicYear) {
          setAcademicYear(years[0].id);
        }
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchResults = useCallback(async () => {
    if (!studentId) return;
    setLoading(true);
    try {
      const res = await scoreService.getStudentScores(studentId, {
        academicYear,
      });
      setData(res.data);
      setSearchParams({ studentId });
    } catch (err) {
      toast.error(err.message || 'Failed to load results');
    } finally {
      setLoading(false);
    }
  }, [studentId, academicYear, setSearchParams]);

  useEffect(() => {
    if (studentId) fetchResults();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId, academicYear]);

  const handlePrint = () => window.print();

  // Helper — resolve academic year ID to display name
  const getYearName = (id) => {
    const y = academicYears.find((x) => x.id === id);
    return y ? y.name : id;
  };

  const studentOptions = students.map((s) => ({
    value: s.id,
    label: `${getFullName(s)} (${s.studentId})`,
  }));

  const yearOptions = academicYears.map((y) => ({
    value: y.id,
    label: y.name + (y.isActive ? ' (Active)' : ''),
  }));

  return (
    <div>
      <div className="no-print">
        <PageHeader
          title="Student Results / នលិទ្ធផលសិស្ស"
          subtitle="Report card by academic year"
          icon={FileText}
          actions={
            data && (
              <Button icon={Printer} variant="outline" onClick={handlePrint}>
                Print
              </Button>
            )
          }
        />

        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Student"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              options={studentOptions}
              placeholder="Select student"
            />
            <Select
              label="Academic Year"
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              options={yearOptions}
              placeholder="Select academic year"
            />
          </div>
        </div>
      </div>

      {/* Printable area */}
      {loading ? (
        <LoadingSpinner message="Loading results..." />
      ) : !data ? (
        <EmptyState
          icon={FileText}
          title="No results yet"
          description="Select a student to view their report card."
        />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-6 sm:p-8 print:shadow-none print:border-0">
          {/* Header */}
          <div className="text-center border-b border-gray-200 pb-5 mb-6">
            <h1 className="text-2xl font-bold text-gray-800">
              🎓 School Management System
            </h1>
            <p className="text-sm text-gray-500 mt-1">Academic Report Card</p>
            <p className="text-xs text-gray-400 mt-0.5">
              Academic Year: {getYearName(data.academicYear || academicYear)}
            </p>
          </div>

          {/* Student info */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 mb-6">
            {/* ✅ PHOTO with initials fallback */}
            {data.student.photo ? (
              <img
                src={
                  data.student.photo.startsWith('http')
                    ? data.student.photo
                    : `${SERVER_URL}${data.student.photo}`
                }
                alt={getFullName(data.student)}
                className="w-20 h-20 rounded-full object-cover flex-shrink-0 border-4 border-white shadow-lg"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.replaceWith(
                    Object.assign(document.createElement('div'), {
                      className:
                        'w-20 h-20 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-2xl flex-shrink-0',
                      textContent: getInitials(
                        data.student.firstName,
                        data.student.lastName
                      ),
                    })
                  );
                }}
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-2xl flex-shrink-0">
                {getInitials(data.student.firstName, data.student.lastName)}
              </div>
            )}

            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-xl font-bold text-gray-800">
                {getFullName(data.student)}
              </h2>
              <p className="text-gray-500">{data.student.khmerName}</p>
              <div className="mt-2 flex flex-wrap justify-center sm:justify-start gap-3 text-sm text-gray-600">
                <span>
                  ID: <strong>{data.student.studentId}</strong>
                </span>
                {data.class && (
                  <span>
                    Class: <strong>{data.class.className}</strong>
                  </span>
                )}
                <span>
                  Gender: <strong>{data.student.gender}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Scores table */}
          {data.rows.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No scores recorded for this academic year.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border border-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left text-xs font-semibold text-gray-600 uppercase px-3 py-2 border-b">
                      Subject
                    </th>
                    <th className="text-center text-xs font-semibold text-gray-600 uppercase px-3 py-2 border-b">
                      Total
                    </th>
                    <th className="text-center text-xs font-semibold text-gray-600 uppercase px-3 py-2 border-b">
                      Max
                    </th>
                    <th className="text-center text-xs font-semibold text-gray-600 uppercase px-3 py-2 border-b">
                      Average
                    </th>
                    <th className="text-center text-xs font-semibold text-gray-600 uppercase px-3 py-2 border-b">
                      %
                    </th>
                    <th className="text-center text-xs font-semibold text-gray-600 uppercase px-3 py-2 border-b">
                      Grade
                    </th>
                    <th className="text-center text-xs font-semibold text-gray-600 uppercase px-3 py-2 border-b">
                      Result
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.rows.map((row) => (
                    <tr key={row.subject.id}>
                      <td className="px-3 py-2 text-sm text-gray-800">
                        {row.subject.subjectName}
                      </td>
                      <td className="px-3 py-2 text-sm text-center">
                        {row.total}
                      </td>
                      <td className="px-3 py-2 text-sm text-center">
                        {row.maxTotal}
                      </td>
                      <td className="px-3 py-2 text-sm text-center">
                        {row.average}
                      </td>
                      <td className="px-3 py-2 text-sm text-center">
                        {row.percentage}%
                      </td>
                      <td className="px-3 py-2 text-center">
                        <Badge
                          variant={
                            row.grade === 'A' ? 'success'
                            : row.grade === 'B' ? 'info'
                            : row.grade === 'C' ? 'purple'
                            : row.grade === 'D' ? 'warning'
                            : row.grade === 'E' ? 'warning'
                            : 'danger'
                          }
                        >
                          {row.grade}
                        </Badge>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <Badge
                          variant={row.result === 'Pass' ? 'success' : 'danger'}
                        >
                          {row.result}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Summary */}
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <SummaryBox label="Average" value={data.summary.average} />
            <SummaryBox
              label="Percentage"
              value={`${data.summary.percentage}%`}
            />
            <SummaryBox
              label="Grade"
              value={data.summary.grade}
              highlight={
                data.summary.grade === 'A' || data.summary.grade === 'B'
              }
            />
            <SummaryBox
              label="Result"
              value={data.summary.result}
              highlight={data.summary.result === 'Pass'}
            />
          </div>

          {/* Remark */}
          <div className="mt-6 pt-5 border-t border-gray-200">
            <p className="text-xs text-gray-500 uppercase font-semibold mb-1">
              Overall Remark
            </p>
            <p className="text-sm text-gray-700 italic">
              "{data.summary.remark}"
            </p>
          </div>

          {/* Signature */}
          <div className="mt-10 grid grid-cols-2 gap-8 text-center text-xs text-gray-500">
            <div>
              <div className="border-t border-gray-300 pt-2 mt-12">
                Class Teacher Signature
              </div>
            </div>
            <div>
              <div className="border-t border-gray-300 pt-2 mt-12">
                Principal Signature
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryBox({ label, value, highlight }) {
  return (
    <div
      className={`rounded-lg p-4 text-center ${
        highlight ? 'bg-green-50 border border-green-200' : 'bg-gray-50'
      }`}
    >
      <p className="text-xs text-gray-500 uppercase">{label}</p>
      <p
        className={`text-2xl font-bold mt-1 ${
          highlight ? 'text-green-700' : 'text-gray-800'
        }`}
      >
        {value}
      </p>
    </div>
  );
}