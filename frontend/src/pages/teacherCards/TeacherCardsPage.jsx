import { useEffect, useState, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import { IdCard, Printer, Download, Users, User } from 'lucide-react';
import { toPng } from 'html-to-image';

import { teacherService } from '../../services/teacherService';
import { getFullName } from '../../utils/formatters';

import PageHeader from '../../components/PageHeader';
import Button from '../../components/Button';
import Select from '../../components/Select';
import TeacherCard from '../../components/TeacherCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';

const SCHOOL_INFO = {
  name: 'School Management System',
  khmerName: 'ប្រព័ន្ធគ្រប់គ្រងសាលារៀន',
  phone: '+855 12 345 678',
  email: 'info@school.edu.kh',
};

export default function TeacherCardsPage() {
  const [teachers, setTeachers] = useState([]);
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [bulkAll, setBulkAll] = useState(false);
  const cardRef = useRef(null);

  useEffect(() => {
    teacherService
      .getAll({ status: 'active', limit: 500 })
      .then((res) => setTeachers(res.data.teachers || []))
      .catch(() => toast.error('Failed to load teachers'));
  }, []);

  const loadPreview = useCallback(() => {
    if (!selectedTeacher) return setPreview(null);
    const t = teachers.find((x) => x.id === selectedTeacher);
    setPreview(t || null);
  }, [selectedTeacher, teachers]);

  useEffect(() => { loadPreview(); }, [loadPreview]);

  const handlePrint = () => window.print();

  const handleDownloadPNG = async () => {
    if (!cardRef.current) return;
    try {
      const dataUrl = await toPng(cardRef.current, { pixelRatio: 3, cacheBust: true });
      const link = document.createElement('a');
      link.download = `teacher-card-${preview.teacherId}.png`;
      link.href = dataUrl;
      link.click();
      toast.success('Downloaded');
    } catch {
      toast.error('Download failed');
    }
  };

  const teacherOptions = teachers.map((t) => ({
    value: t.id,
    label: `${getFullName(t)} (${t.teacherId})`,
  }));

  return (
    <div>
      <div className="no-print">
        <PageHeader
          title="Teacher Cards"
          subtitle="Preview, print, and download teacher ID cards"
          icon={IdCard}
          actions={
            preview && !bulkAll ? (
              <>
                <Button variant="outline" icon={Download} onClick={handleDownloadPNG}>
                  Download PNG
                </Button>
                <Button icon={Printer} onClick={handlePrint}>Print Card</Button>
              </>
            ) : bulkAll && teachers.length > 0 ? (
              <Button icon={Printer} onClick={handlePrint}>
                Print All ({teachers.length})
              </Button>
            ) : null
          }
        />

        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-5">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setBulkAll(false)}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition
                  ${!bulkAll ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-600 hover:text-gray-800'}`}
              >
                <User className="w-4 h-4" /> Single
              </button>
              <button
                onClick={() => setBulkAll(true)}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition
                  ${bulkAll ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-600 hover:text-gray-800'}`}
              >
                <Users className="w-4 h-4" /> All Teachers
              </button>
            </div>

            {!bulkAll && (
              <div className="flex-1">
                <Select
                  value={selectedTeacher}
                  onChange={(e) => setSelectedTeacher(e.target.value)}
                  options={teacherOptions}
                  placeholder="Select a teacher"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="print-area">
        {bulkAll ? (
          teachers.length === 0 ? (
            <EmptyState icon={Users} title="No teachers" description="Add teachers first." />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 justify-items-center print:grid-cols-2 print:gap-4 print:p-4">
              {teachers.map((t) => (
                <TeacherCard key={t.id} teacher={t} schoolInfo={SCHOOL_INFO} compact />
              ))}
            </div>
          )
        ) : !preview ? (
          <EmptyState
            icon={IdCard}
            title="No teacher selected"
            description="Pick a teacher above to preview their card."
          />
        ) : (
          <div className="bg-gray-50 rounded-xl border border-gray-200 p-8 flex flex-col items-center">
            <div ref={cardRef}>
              <TeacherCard teacher={preview} schoolInfo={SCHOOL_INFO} />
            </div>
            <p className="text-xs text-gray-500 mt-4 no-print">
              Card size: 85.6 × 54 mm (standard CR80)
            </p>
          </div>
        )}
      </div>
    </div>
  );
}