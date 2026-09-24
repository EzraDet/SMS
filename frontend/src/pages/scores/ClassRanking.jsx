import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Award, Medal, Trophy, Users } from 'lucide-react';

import { classService } from '../../services/classService';
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

export default function ClassRanking() {
  const [classes, setClasses] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [classId, setClassId] = useState('');
  const [academicYear, setAcademicYear] = useState('');

  const [ranking, setRanking] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load classes
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load academic years — auto-pick active
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

  const fetchRanking = async () => {
    if (!classId) return;
    setLoading(true);
    try {
      const res = await scoreService.getClassRanking(classId, {
        academicYear,
      });
      setRanking(res.data.ranking || []);
    } catch (err) {
      toast.error(err.message || 'Failed to load ranking');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRanking();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId, academicYear]);

  const classOptions = classes.map((c) => ({
    value: c.id,
    label: `Grade ${c.grade} - ${c.className}`,
  }));

  const yearOptions = academicYears.map((y) => ({
    value: y.id,
    label: y.name + (y.isActive ? ' (Active)' : ''),
  }));

  // Summary counts
  const passed = ranking.filter((r) => r.result === 'Pass').length;
  const failed = ranking.filter((r) => r.result === 'Fail').length;
  const classAverage =
    ranking.length > 0
      ? Math.round(
          (ranking.reduce((sum, r) => sum + (r.average || 0), 0) /
            ranking.length) *
            100
        ) / 100
      : 0;

  return (
    <div>
      <PageHeader
        title="Class Ranking / ចំណាត់ថ្នាក់ក្នុងថ្នាក់"
        subtitle="Students ranked by average score"
        icon={Trophy}
      />

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Select
            label="Class"
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
            options={classOptions}
            placeholder="Select class"
          />
          <Select
            label="Academic Year"
            value={academicYear}
            onChange={(e) => setAcademicYear(e.target.value)}
            options={yearOptions}
            placeholder="Select academic year"
          />
          <div className="flex items-end">
            <Button onClick={fetchRanking} className="w-full">
              Refresh Ranking
            </Button>
          </div>
        </div>
      </div>

      {/* Summary cards */}
      {ranking.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          <SummaryCard
            label="Students Ranked"
            value={ranking.length}
            color="text-primary-600"
            bg="bg-primary-50"
            icon={Users}
          />
          <SummaryCard
            label="Class Average"
            value={classAverage}
            color="text-gray-700"
            bg="bg-gray-50"
            icon={Award}
          />
          <SummaryCard
            label="Passed"
            value={passed}
            color="text-green-600"
            bg="bg-green-50"
            icon={Trophy}
          />
          <SummaryCard
            label="Failed"
            value={failed}
            color="text-red-600"
            bg="bg-red-50"
            icon={Award}
          />
        </div>
      )}

      {/* Ranking table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <LoadingSpinner message="Calculating ranking..." />
        ) : ranking.length === 0 ? (
          <EmptyState
            icon={Award}
            title="No ranking data"
            description="No scores recorded for this class yet."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 py-3 w-24">
                    Rank
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 py-3">
                    Student
                  </th>
                  <th className="text-center text-xs font-semibold text-gray-500 uppercase px-4 py-3">
                    Total
                  </th>
                  <th className="text-center text-xs font-semibold text-gray-500 uppercase px-4 py-3">
                    Average
                  </th>
                  <th className="text-center text-xs font-semibold text-gray-500 uppercase px-4 py-3">
                    %
                  </th>
                  <th className="text-center text-xs font-semibold text-gray-500 uppercase px-4 py-3">
                    Grade
                  </th>
                  <th className="text-center text-xs font-semibold text-gray-500 uppercase px-4 py-3">
                    Result
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {ranking.map((row) => (
                  <tr
                    key={row.student.id}
                    className={`hover:bg-gray-50 ${
                      row.rank === 1
                        ? 'bg-yellow-50'
                        : row.rank === 2
                        ? 'bg-gray-50'
                        : row.rank === 3
                        ? 'bg-orange-50/50'
                        : ''
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {row.rank === 1 && (
                          <Trophy className="w-5 h-5 text-yellow-500" />
                        )}
                        {row.rank === 2 && (
                          <Medal className="w-5 h-5 text-gray-400" />
                        )}
                        {row.rank === 3 && (
                          <Medal className="w-5 h-5 text-orange-600" />
                        )}
                        <span className="font-bold text-gray-700">
                          #{row.rank}
                        </span>
                      </div>
                    </td>

                    {/* ✅ PHOTO + NAME */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {row.student.photo ? (
                          <img
                            src={
                              row.student.photo.startsWith('http')
                                ? row.student.photo
                                : `${SERVER_URL}${row.student.photo}`
                            }
                            alt={getFullName(row.student)}
                            className="w-9 h-9 rounded-full object-cover flex-shrink-0 border border-gray-200"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.replaceWith(
                                Object.assign(document.createElement('div'), {
                                  className:
                                    'w-9 h-9 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-semibold text-xs flex-shrink-0',
                                  textContent: getInitials(
                                    row.student.firstName,
                                    row.student.lastName
                                  ),
                                })
                              );
                            }}
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-semibold text-xs flex-shrink-0">
                            {getInitials(
                              row.student.firstName,
                              row.student.lastName
                            )}
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-gray-800 text-sm">
                            {getFullName(row.student)}
                          </p>
                          <p className="text-xs text-gray-500 font-mono">
                            {row.student.studentId}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3 text-center text-sm text-gray-700">
                      {row.total}/{row.maxTotal}
                    </td>
                    <td className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                      {row.average}
                    </td>
                    <td className="px-4 py-3 text-center text-sm">
                      {row.percentage}%
                    </td>
                    <td className="px-4 py-3 text-center">
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
                    <td className="px-4 py-3 text-center">
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
      </div>
    </div>
  );
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