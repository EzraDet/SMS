import { getAll } from '../utils/fileHandler.js';
import { success } from '../utils/response.js';
import { calculateGradeDetails } from '../utils/helpers.js';

export async function getDashboardStats(req, res, next) {
  try {
    const [students, teachers, classes, subjects, attendance, scores, activities] =
      await Promise.all([
        getAll('students'),
        getAll('teachers'),
        getAll('classes'),
        getAll('subjects'),
        getAll('attendance'),
        getAll('scores'),
        getAll('activities'),
      ]);

    const today = new Date().toISOString().split('T')[0];

    const activeStudents = students.filter((s) => s.status === 'active');
    const activeTeachers = teachers.filter((t) => t.status === 'active');
    const activeClasses = classes.filter((c) => c.status === 'active');
    const activeSubjects = subjects.filter((s) => s.status === 'active');

    const todayRecords = attendance.filter((a) => a.date === today);
    const todayStats = {
      present: todayRecords.filter((a) => a.status === 'present').length,
      absent: todayRecords.filter((a) => a.status === 'absent').length,
      late: todayRecords.filter((a) => a.status === 'late').length,
      permission: todayRecords.filter((a) => a.status === 'permission').length,
      total: activeStudents.length,
    };

    const monthlyAttendance = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const prefix = `${yyyy}-${mm}`;
      const monthRecords = attendance.filter((a) => a.date?.startsWith(prefix));
      const present = monthRecords.filter((a) => a.status === 'present').length;
      const percentage =
        monthRecords.length > 0
          ? Math.round((present / monthRecords.length) * 100)
          : 0;
      monthlyAttendance.push({
        month: d.toLocaleDateString('en-US', { month: 'short' }),
        present,
        absent: monthRecords.filter((a) => a.status === 'absent').length,
        percentage,
      });
    }

    const genderDistribution = [
      { name: 'Male', value: activeStudents.filter((s) => s.gender === 'male').length },
      { name: 'Female', value: activeStudents.filter((s) => s.gender === 'female').length },
    ];

    const studentsPerClass = activeClasses.map((c) => ({
      class: c.className,
      count: activeStudents.filter((s) => s.classId === c.id).length,
      capacity: c.maxStudents,
    }));

    const subjectPerformance = activeSubjects.map((sub) => {
      const subScores = scores.filter((s) => s.subjectId === sub.id);
      const total = subScores.reduce((sum, s) => sum + (s.score || 0), 0);
      const maxTotal = subScores.reduce((sum, s) => sum + (s.maxScore || 100), 0);
      const avg =
        maxTotal > 0 ? Math.round((total / maxTotal) * 100 * 100) / 100 : 0;
      return { subject: sub.subjectName, average: avg };
    });

    const studentAverages = activeStudents
      .map((student) => {
        const sScores = scores.filter((s) => s.studentId === student.id);
        const total = sScores.reduce((sum, s) => sum + (s.score || 0), 0);
        const maxTotal = sScores.reduce((sum, s) => sum + (s.maxScore || 100), 0);
        const avg =
          sScores.length > 0
            ? Math.round((total / sScores.length) * 100) / 100
            : 0;
        const details = calculateGradeDetails(total, maxTotal || 1);
        return {
          student,
          average: avg,
          grade: details.grade,
          percentage: details.percentage,
          scoreCount: sScores.length,
        };
      })
      .filter((r) => r.scoreCount > 0)
      .sort((a, b) => b.average - a.average)
      .slice(0, 5);

    const recentActivities = [...activities]
      .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
      .slice(0, 8);

    return success(
      res,
      {
        counts: {
          students: activeStudents.length,
          teachers: activeTeachers.length,
          classes: activeClasses.length,
          subjects: activeSubjects.length,
          male: genderDistribution[0].value,
          female: genderDistribution[1].value,
        },
        today: todayStats,
        monthlyAttendance,
        genderDistribution,
        studentsPerClass,
        subjectPerformance,
        topStudents: studentAverages,
        recentActivities,
      },
      'Dashboard stats fetched'
    );
  } catch (err) {
    next(err);
  }
}