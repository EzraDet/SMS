import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { classService } from '../../services/classService';
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
  classId: '',
  className: '',
  grade: '',
  section: '',
  room: '',
  academicYear: 'ay-2024-2025',
  classTeacher: '',
  maxStudents: 40,
  status: 'active',
};

export default function ClassForm({ isOpen, onClose, onSuccess, cls }) {
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [teachers, setTeachers] = useState([]);

  const isEdit = Boolean(cls);

  useEffect(() => {
    if (isOpen) {
      setForm(cls ? { ...emptyForm, ...cls } : emptyForm);
      setErrors({});
      // Load teachers for the class teacher dropdown
      teacherService
        .getAll({ status: 'active', limit: 100 })
        .then((res) => setTeachers(res.data.teachers || []))
        .catch(() => setTeachers([]));
    }
  }, [isOpen, cls]);

  const handleChange = (field) => (e) => {
    setForm((p) => ({ ...p, [field]: e.target.value }));
    if (errors[field]) setErrors((p) => ({ ...p, [field]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.className?.trim()) e.className = 'Class name required';
    if (!form.grade) e.grade = 'Grade required';
    if (!form.academicYear) e.academicYear = 'Academic year required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const payload = {
        ...form,
        grade: Number(form.grade),
        maxStudents: Number(form.maxStudents),
      };
      if (isEdit) {
        await classService.update(cls.id, payload);
        toast.success('Class updated');
      } else {
        await classService.create(payload);
        toast.success('Class created');
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
      title={isEdit ? 'Edit Class' : 'Add New Class / បន្ថែមថ្នាក់ថ្មី'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Class Name * / ឈ្មោះថ្នាក់"
            value={form.className}
            onChange={handleChange('className')}
            error={errors.className}
            placeholder="e.g. 7A"
          />
          <Select
            label="Grade * / កម្រិត"
            value={form.grade}
            onChange={handleChange('grade')}
            options={GRADE_OPTIONS}
            error={errors.grade}
            placeholder="Select grade"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label="Section / ផ្នែក"
            value={form.section}
            onChange={handleChange('section')}
            placeholder="e.g. A"
          />
          <Input
            label="Room"
            value={form.room}
            onChange={handleChange('room')}
            placeholder="e.g. Room 101"
          />
          <Input
            label="Max Students / ចំនួនសិស្សអតិបរមា"
            type="number"
            value={form.maxStudents}
            onChange={handleChange('maxStudents')}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Academic Year * / ឆ្នាំសិក្សា"
            value={form.academicYear}
            onChange={handleChange('academicYear')}
            error={errors.academicYear}
          />
          <Select
            label="Class Teacher / គ្រូបង្រៀនថ្នាក់"
            value={form.classTeacher}
            onChange={handleChange('classTeacher')}
            options={teacherOptions}
            placeholder="Select a teacher"
          />
        </div>

        <Select
          label="Status"
          value={form.status}
          onChange={handleChange('status')}
          options={STATUS_OPTIONS}
          placeholder="Select status"
        />

        <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            {isEdit ? 'Save Changes' : 'Create Class'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}