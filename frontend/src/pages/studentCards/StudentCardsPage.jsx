import { useEffect, useState, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import { IdCard, Printer, Download, Users, User } from 'lucide-react';
import { toPng } from 'html-to-image';

import { studentService } from '../../services/studentService';
import { classService } from '../../services/classService';
import { getFullName } from '../../utils/formatters';

import PageHeader from '../../components/PageHeader';
import Button from '../../components/Button';
import Select from '../../components/Select';
import StudentCard from '../../components/StudentCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';

const SCHOOL_INFO = {
  name: 'School Management System',
  khmerName: 'ប្រព័ន្ធគ្រប់គ្រងសាលារៀន',
  phone: '+855 12 345 678',
  email: 'info@school.edu.kh',
  address: 'Phnom Penh, Cambodia',
};

export default function StudentCardsPage() {
  const [mode, setMode] = useState('single'); // single | bulk
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedClass, setSelectedClass] = useState('');

  const [previewStudent, setPreviewStudent] = useState(null);
  const [previewClass, setPreviewClass] = useState(null);
  const [bulkStudents, setBulkStudents] = useState([]);
  const [bulkClass, setBulkClass] = useState(null);

  const [loading, setLoading] = useState(false);
  const cardRef = useRef(null);

  // Load students + classes
  useEffect(() => {
    Promise.all([
      studentService.getAll({ status: 'active', limit: 500 }),
      classService.getAll({ status: 'active', limit: 100 }),
    ])
      .then(([sRes, cRes]) => {
        setStudents(sRes.data.students || []);
        setClasses(cRes.data.classes || []);
      })
      .catch(() => toast.error('Failed to load data'));
  }, []);

  // Load single preview
  const loadPreview = useCallback(async () => {
    if (!selectedStudent) {
      setPreviewStudent(null);
      setPreviewClass(null);
      return;
    }
    setLoading(true);
    try {
      const student = students.find((s) => s.id === selectedStudent);
      if (!student) throw new Error('Student not found');

      let cls = null;
      if (student.classId) {
        const clsRes = await classService.getById(student.classId);
        cls = clsRes.data;
      }

      setPreviewStudent(student);
      setPreviewClass(cls);
    } catch (err) {
      toast.error(err.message || 'Failed to load student');
    } finally {
      setLoading(false);
    }
  }, [selectedStudent, students]);

  // Load bulk preview
  const loadBulk = useCallback(async () => {
    if (!selectedClass) {
      setBulkStudents([]);
      setBulkClass(null);
      return;
    }
    setLoading(true);
    try {
      const res = await classService.getStudents(selectedClass);
      setBulkStudents(res.data.students || []);
      setBulkClass(res.data.class);
    } catch (err) {
      toast.error(err.message || 'Failed to load class');
    } finally {
      setLoading(false);
    }
  }, [selectedClass]);

  useEffect(() => {
    if (mode === 'single') loadPreview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, selectedStudent]);

  useEffect(() => {
    if (mode === 'bulk') loadBulk();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, selectedClass]);

  const handlePrint = () => window.print();

  const handleDownloadPNG = async () => {
    if (!cardRef.current) return;
    try {
      const dataUrl = await toPng(cardRef.current, {
        pixelRatio: 3,
        cacheBust: true,
      });
      const link = document.createElement('a');
      link.download = `card-${previewStudent.studentId}.png`;
      link.href = dataUrl;
      link.click();
      toast.success('Card downloaded');
    } catch {
      toast.error('Failed to download card');
    }
  };

  // ==================== OPTIONS ====================
  const studentOptions = students.map((s) => ({
    value: s.id,
    label: `${getFullName(s)} (${s.studentId})`,
  }));

  const classOptions = classes.map((c) => ({
    value: c.id,
    label: `${c.className} (Grade ${c.grade}) — ${c.room || 'No room'}`,
  }));

  return (
    <div>
      <div className="no-print">
        <PageHeader
          title="Student Cards"
          subtitle="Preview, print, and download student ID cards"
          icon={IdCard}
          actions={
            previewStudent && mode === 'single' ? (
              <>
                <Button
                  variant="outline"
                  icon={Download}
                  onClick={handleDownloadPNG}
                >
                  Download PNG
                </Button>
                <Button icon={Printer} onClick={handlePrint}>
                  Print Card
                </Button>
              </>
            ) : mode === 'bulk' && bulkStudents.length > 0 ? (
              <Button icon={Printer} onClick={handlePrint}>
                Print All ({bulkStudents.length})
              </Button>
            ) : null
          }
        />

        {/* Mode switcher */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-5">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setMode('single')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition
                  ${
                    mode === 'single'
                      ? 'bg-white text-primary-700 shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
              >
                <User className="w-4 h-4" /> Single Student
              </button>
              <button
                onClick={() => setMode('bulk')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition
                  ${
                    mode === 'bulk'
                      ? 'bg-white text-primary-700 shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
              >
                <Users className="w-4 h-4" /> Bulk (By Class)
              </button>
            </div>

            <div className="flex-1">
              {mode === 'single' ? (
                <Select
                  value={selectedStudent}
                  onChange={(e) => setSelectedStudent(e.target.value)}
                  options={studentOptions}
                  placeholder="Select a student"
                />
              ) : (
                <Select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  options={classOptions}
                  placeholder="Select a class"
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Preview area */}
      <div className="print-area">
        {loading ? (
          <LoadingSpinner message="Loading..." />
        ) : mode === 'single' ? (
          !previewStudent ? (
            <EmptyState
              icon={IdCard}
              title="No student selected"
              description="Choose a student above to preview their ID card."
            />
          ) : (
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-8 flex flex-col items-center">
              <div ref={cardRef}>
                <StudentCard
                  student={previewStudent}
                  cls={previewClass}
                  schoolInfo={SCHOOL_INFO}
                />
              </div>
              <p className="text-xs text-gray-500 mt-4 no-print">
                Card size: 85.6 × 54 mm (standard CR80)
              </p>
            </div>
          )
        ) : !bulkClass ? (
          <EmptyState
            icon={Users}
            title="No class selected"
            description="Choose a class to see all student cards."
          />
        ) : bulkStudents.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No students in this class"
            description="Add students to this class first."
          />
        ) : (
          <div className="bg-gray-50 rounded-xl border border-gray-200 p-6">
            <div className="mb-4 no-print">
              <p className="text-sm text-gray-600">
                <strong>{bulkStudents.length}</strong> card(s) for{' '}
                <strong>{bulkClass.className}</strong>
              </p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 justify-items-center print:grid-cols-2 print:gap-4 print:p-4">
              {bulkStudents.map((s) => (
                <StudentCard
                  key={s.id}
                  student={s}
                  cls={bulkClass}
                  schoolInfo={SCHOOL_INFO}
                  compact
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}