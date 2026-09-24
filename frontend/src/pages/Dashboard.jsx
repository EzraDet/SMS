import { useEffect, useState } from 'react';
import {
  Users,
  GraduationCap,
  School,
  BookOpen,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  Trophy,
  Activity,
  LayoutDashboard,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import toast from 'react-hot-toast';

import { dashboardService } from '../services/dashboardService';
import { useAuth } from '../context/AuthContext';
import { getFullName, getInitials } from '../utils/formatters';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import ChartCard from '../components/ChartCard';
import Badge from '../components/Badge';
import LoadingSpinner from '../components/LoadingSpinner';

const PIE_COLORS = ['#3b82f6', '#a855f7'];

// Empty fallback so the page never crashes on missing data
const EMPTY = {
  counts: { students: 0, teachers: 0, classes: 0, subjects: 0, male: 0, female: 0 },
  today: { present: 0, absent: 0, late: 0, permission: 0, total: 0 },
  monthlyAttendance: [],
  genderDistribution: [],
  studentsPerClass: [],
  subjectPerformance: [],
  topStudents: [],
  recentActivities: [],
};

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await dashboardService.getStats();
        // Merge with EMPTY so every field has a fallback
        setData({
          counts: { ...EMPTY.counts, ...(res.data?.counts || {}) },
          today: { ...EMPTY.today, ...(res.data?.today || {}) },
          monthlyAttendance: res.data?.monthlyAttendance || [],
          genderDistribution: res.data?.genderDistribution || [],
          studentsPerClass: res.data?.studentsPerClass || [],
          subjectPerformance: res.data?.subjectPerformance || [],
          topStudents: res.data?.topStudents || [],
          recentActivities: res.data?.recentActivities || [],
        });
      } catch (err) {
        console.error('Dashboard error:', err);
        setError(err.message || 'Failed to load dashboard');
        toast.error(err.message || 'Failed to load dashboard');
        // Even on error, show the empty state so the page doesn't white-screen
        setData(EMPTY);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <LoadingSpinner message="Loading dashboard..." />;
  if (!data) return null;

  const { counts, today, monthlyAttendance, genderDistribution, studentsPerClass, subjectPerformance, topStudents, recentActivities } = data;

  const attendanceRate =
    today.total > 0 ? Math.round((today.present / today.total) * 100) : 0;

  return (
    <div>
      <PageHeader
        title={`Welcome, ${user?.fullName?.split(' ')[0] || 'User'}`}
        subtitle="Here's what's happening at your school today"
        icon={LayoutDashboard}
      />

      {error && (
        <div className="mb-5 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
          ⚠️ Some dashboard data couldn't be loaded: {error}
        </div>
      )}

      {/* Row 1: Counts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-5">
        <StatCard title="សិស្សសរុប" value={counts.students} subtitle={`${counts.male} male · ${counts.female} female`} icon={Users} color="primary" />
        <StatCard title="គ្រូបង្រៀន" value={counts.teachers} icon={GraduationCap} color="green" />
        <StatCard title="ថ្នាក់" value={counts.classes} icon={School} color="purple" />
        <StatCard title="វិជ្ជាជីវៈ" value={counts.subjects} icon={BookOpen} color="yellow" />
      </div>

      {/* Row 2: Today's attendance */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-5">
        <StatCard title="វត្តមានថ្ងៃនេះ" value={today.present} icon={CheckCircle2} color="green" />
        <StatCard title="អវត្តមានថ្ងៃនេះ" value={today.absent} icon={XCircle} color="red" />
        <StatCard title="មកយឺតថ្ងៃនេះ" value={today.late} icon={Clock} color="yellow" />
        <StatCard title="អត្តសញ្ញាណ" value={`${attendanceRate}%`} icon={TrendingUp} color="blue" />
      </div>

      {/* Row 3: Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        <ChartCard title="វត្តមានប្រចាំខែ" subtitle="Last 6 months — students present per month">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlyAttendance}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="present" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} name="Present" />
              <Line type="monotone" dataKey="absent" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} name="Absent" />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="ស្ថិតិតាមភេទ" subtitle="Active students by gender">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={genderDistribution} cx="50%" cy="50%" outerRadius={90} fill="#8884d8" dataKey="value" label={(entry) => `${entry.name}: ${entry.value}`}>
                {genderDistribution.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Row 4: Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        <ChartCard title="សិស្ស/ថ្នាក់" subtitle="Current enrollment">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={studentsPerClass}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="class" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Bar dataKey="count" fill="#3b82f6" name="Students" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="លទ្ធផលការងារលើមុខវិជ្ជា" subtitle="Average score % per subject">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={subjectPerformance}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="subject" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Bar dataKey="average" fill="#a855f7" name="Avg %" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Row 5: Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-5 h-5 text-yellow-500" />
            <h3 className="font-semibold text-gray-800">សិស្ស 5 នាក់ដែលល្អបំផ្លាញ</h3>
          </div>
          {topStudents.length === 0 ? (
            <p className="text-gray-500 text-sm py-4">No score data yet.</p>
          ) : (
            <div className="space-y-3">
              {topStudents.map((row, idx) => (
                <div key={row.student.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                  <div className="w-6 text-center font-bold text-gray-400">#{idx + 1}</div>
                  <div className="w-9 h-9 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-semibold text-xs flex-shrink-0">
                    {getInitials(row.student.firstName, row.student.lastName)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 text-sm truncate">{getFullName(row.student)}</p>
                    <p className="text-xs text-gray-500 font-mono">{row.student.studentId}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-800">{row.average}</p>
                    <Badge variant={row.grade === 'A' ? 'success' : row.grade === 'B' ? 'info' : row.grade === 'C' ? 'purple' : row.grade === 'D' ? 'warning' : row.grade === 'E' ? 'warning' : 'danger'}>
                      {row.grade}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-primary-600" />
            <h3 className="font-semibold text-gray-800">សកម្មភាពថ្មីៗ</h3>
          </div>
          {recentActivities.length === 0 ? (
            <p className="text-gray-500 text-sm py-4">No activities yet.</p>
          ) : (
            <div className="space-y-3">
              {recentActivities.map((act) => (
                <div key={act.id} className="flex items-start gap-3 pb-3 border-b border-gray-100 last:border-0">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <Activity className="w-4 h-4 text-gray-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800">{act.message}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {act.createdAt ? new Date(act.createdAt).toLocaleDateString() : ''}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}