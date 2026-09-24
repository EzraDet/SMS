import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { studentService } from '../../services/studentService';
import { classService } from '../../services/classService';
import { academicYearService } from '../../services/academicYearService';
import api from '../../services/api';
import Modal from '../../components/Modal';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Select from '../../components/Select';
import PhotoUpload from '../../components/PhotoUpload';
import { GENDER_OPTIONS, STATUS_OPTIONS } from '../../utils/constants';

const emptyForm = {
  studentId: '',
  firstName: '',
  lastName: '',
  khmerName: '',
  gender: '',
  dateOfBirth: '',
  photo: '',
  phone: '',
  email: '',
  address: '',
  parentName: '',
  parentPhone: '',
  emergencyContact: '',
  classId: '',
  academicYear: '',
  enrollmentDate: new Date().toISOString().split('T')[0],
  status: 'active',
};

export default function StudentForm({ isOpen, onClose, onSuccess, student }) {
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);

  const isEdit = Boolean(student);

  // Load classes + academic years when the modal opens
  useEffect(() => {
    if (!isOpen) return;

    setForm(student ? { ...emptyForm, ...student } : emptyForm);
    setErrors({});

    classService
      .getAll({ status: 'active', limit: 100 })
      .then((res) => setClasses(res.data.classes || []))
      .catch(() => setClasses([]));

    academicYearService
      .getAll({ limit: 100 })
      .then((res) => {
        const years = res.data.academicYears || [];
        setAcademicYears(years);

        if (!student) {
          const active = years.find((y) => y.isActive);
          if (active) {
            setForm((prev) => ({ ...prev, academicYear: active.id }));
          }
        }
      })
      .catch(() => setAcademicYears([]));
  }, [isOpen, student]);

  const handleChange = (field) => (e) => {
    setForm((p) => ({ ...p, [field]: e.target.value }));
    if (errors[field]) setErrors((p) => ({ ...p, [field]: '' }));
  };

  const validate = () => {
    const newErrors = {};
    if (!form.firstName?.trim()) newErrors.firstName = 'First name is required';
    if (!form.lastName?.trim()) newErrors.lastName = 'Last name is required';
    if (!form.gender) newErrors.gender = 'Gender is required';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = 'Invalid email format';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      if (isEdit) {
        await studentService.update(student.id, form);
        toast.success('Student updated successfully');
      } else {
        await studentService.create(form);
        toast.success('Student created successfully');
      }
      onSuccess();
    } catch (err) {
      toast.error(err.message || 'Save failed');
    } finally {
      setLoading(false);
    }
  };

  // ==================== PHOTO HANDLERS ====================
  const handlePhotoUpload = async (file) => {
    if (!student) {
      toast.error('Save the student first, then edit to upload a photo');
      throw new Error('No student id');
    }
    const formData = new FormData();
    formData.append('photo', file);
    const res = await api.post(`/students/${student.id}/photo`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    // Update local form with new photo path
    setForm((prev) => ({ ...prev, photo: res.data.photo }));
    onSuccess?.();
  };

  const handlePhotoRemove = async () => {
    if (!student) return;
    await api.delete(`/students/${student.id}/photo`);
    setForm((prev) => ({ ...prev, photo: '' }));
    onSuccess?.();
  };

  // ==================== OPTIONS ====================
  const classOptions = classes.map((c) => ({
    value: c.id,
    label: `${c.className} (Grade ${c.grade}) — ${c.room || 'No room'}`,
  }));

  const yearOptions = academicYears.map((y) => ({
    value: y.id,
    label: y.name + (y.isActive ? ' (Active)' : ''),
  }));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Student' : 'បញ្ចូលឈ្មោះសិស្ស/Add New Student'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* ==================== PHOTO UPLOAD ==================== */}
        <div className="flex justify-center mb-2">
          <PhotoUpload
            currentPhoto={form.photo}
            firstName={form.firstName}
            lastName={form.lastName}
            onUpload={handlePhotoUpload}
            onRemove={student ? handlePhotoRemove : null}
            size="lg"
          />
        </div>

        {!isEdit && (
          <p className="text-xs text-gray-500 text-center -mt-2 mb-2">
            💡 Save the student first, then reopen to edit and upload a photo.
          </p>
        )}

        {isEdit && (
          <Input
            label="Student ID / លេខសម្គាល់សិស្ស"
            value={form.studentId}
            disabled
            className="bg-gray-50"
          />
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="First Name * / នាមខ្លួន"
            value={form.firstName}
            onChange={handleChange('firstName')}
            error={errors.firstName}
            placeholder="e.g. Sokha"
          />
          <Input
            label="Last Name * / នាមត្រកូល"
            value={form.lastName}
            onChange={handleChange('lastName')}
            error={errors.lastName}
            placeholder="e.g. Chan"
          />
        </div>

        <Input
          label="Khmer Name / នាមខ្លួនជាភាសាខ្មែរ"
          value={form.khmerName}
          onChange={handleChange('khmerName')}
          placeholder="e.g. ចន់ សុខា"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Gender * / ភេទ"
            value={form.gender}
            onChange={handleChange('gender')}
            options={GENDER_OPTIONS}
            error={errors.gender}
            placeholder="Select gender"
          />
          <Input
            label="Date of Birth / កាលបរិច្ឆេទ​កើត"
            type="date"
            value={form.dateOfBirth}
            onChange={handleChange('dateOfBirth')}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Phone / ទូរស័ព្ទ"
            value={form.phone}
            onChange={handleChange('phone')}
            placeholder="012345678"
          />
          <Input
            label="Email / អ៊ីមែល"
            type="email"
            value={form.email}
            onChange={handleChange('email')}
            error={errors.email}
            placeholder="student@school.edu.kh"
          />
        </div>

        <Input
          label="Address / អាសយដ្ឋាន"
          value={form.address}
          onChange={handleChange('address')}
          placeholder="Street, Khan, City"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Parent/Guardian Name / នាមខ្លួនរបស់ម្តាយ/ឪពុក"
            value={form.parentName}
            onChange={handleChange('parentName')}
          />
          <Input
            label="Parent Phone / ទូរស័ព្ទរបស់ម្តាយ/ឪពុក"
            value={form.parentPhone}
            onChange={handleChange('parentPhone')}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Emergency Contact / ទាក់ទាក់ការពារ"
            value={form.emergencyContact}
            onChange={handleChange('emergencyContact')}
          />
          <Select
            label="Status"
            value={form.status}
            onChange={handleChange('status')}
            options={STATUS_OPTIONS}
            placeholder="Select status"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Class / ថ្នាក់សិក្សា"
            value={form.classId}
            onChange={handleChange('classId')}
            options={classOptions}
            placeholder={
              classOptions.length === 0
                ? 'No classes available'
                : 'Select a class'
            }
          />
          <Select
            label="Academic Year / ឆ្នាំសិក្សា"
            value={form.academicYear}
            onChange={handleChange('academicYear / ឆ្នាំសិក្សា')}
            options={yearOptions}
            placeholder={
              yearOptions.length === 0
                ? 'No academic years'
                : 'Select academic year'
            }
          />
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            {isEdit ? 'Save Changes' : 'Create Student'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}