import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { subjectService } from '../../services/subjectService';
import { teacherService } from '../../services/teacherService';
import Modal from '../../components/Modal';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Select from '../../components/Select';
import { STATUS_OPTIONS } from '../../utils/constants';

const GRADE_OPTIONS = [7, 8, 9, 10, 11, 12].map((g) => ({
  value: String(g),
  label: `Grade ${g}`,
}));

const emptyForm = {
  subjectId: '',
  subjectName: '',
  khmerName: '',
  description: '',
  teacherId: '',
  grade: '',
  status: 'active',
};

export default function SubjectForm({ isOpen, onClose, onSuccess, subject }) {
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [teachers, setTeachers] = useState([]);

  const isEdit = Boolean(subject);

  useEffect(() => {
    if (isOpen) {
      setForm(subject ? { ...emptyForm, ...subject } : emptyForm);
      setErrors({});
      teacherService
        .getAll({ status: 'active', limit: 100 })
        .then((res) => setTeachers(res.data.teachers || []))
        .catch(() => setTeachers([]));
    }
  }, [isOpen, subject]);

  const handleChange = (field) => (e) => {
    setForm((p) => ({ ...p, [field]: e.target.value }));
    if (errors[field]) setErrors((p) => ({ ...p, [field]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.subjectName?.trim()) e.subjectName = 'Subject name required';
    if (!form.grade) e.grade = 'Grade required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const payload = { ...form, grade: Number(form.grade) };
      if (isEdit) {
        await subjectService.update(subject.id, payload);
        toast.success('Subject updated');
      } else {
        await subjectService.create(payload);
        toast.success('Subject created');
      }
      onSuccess();
    } catch (err) {
      toast.error(err.message || 'Save failed');
    } finally {
      setLoading(false);
    }
  };

  const teacherOptions = teachers.map((t) => ({
    value: t.id,
    label: `${t.firstName} ${t.lastName} (${t.teacherId})`,
  }));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Subject' : 'Add New Subject / បន្ថែមមុខវិជ្ជាថ្មី'}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {isEdit && (
          <Input
            label="Subject ID / លេខសម្គាល់មុខវិជ្ជា"
            value={form.subjectId}
            disabled
            className="bg-gray-50"
          />
        )}

        <Input
          label="Subject Name * / ឈ្មោះមុខវិជ្ជា"
          value={form.subjectName}
          onChange={handleChange('subjectName')}
          error={errors.subjectName}
          placeholder="e.g. Mathematics"
        />

        <Input
          label="Khmer Name / ឈ្មោះភាសាខ្មែរ"
          value={form.khmerName}
          onChange={handleChange('khmerName')}
          placeholder="e.g. គណិតវិទ្យា"
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description / ការពិពណ៌នា
          </label>
          <textarea
            value={form.description}
            onChange={handleChange('description')}
            rows={3}
            placeholder="Brief description of the subject"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
              focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Grade * / ថ្នាក់សិក្សា"
            value={form.grade}
            onChange={handleChange('grade')}
            options={GRADE_OPTIONS}
            error={errors.grade}
            placeholder="Select grade"
          />
          <Select
            label="Status"
            value={form.status}
            onChange={handleChange('status')}
            options={STATUS_OPTIONS}
            placeholder="Select status"
          />
        </div>

        <Select
          label="Assigned Teacher / គ្រូទទួលបន្ទុក"
          value={form.teacherId}
          onChange={handleChange('teacherId')}
          options={teacherOptions}
          placeholder="Select teacher (optional)"
        />

        <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            {isEdit ? 'Save Changes' : 'Create Subject'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}