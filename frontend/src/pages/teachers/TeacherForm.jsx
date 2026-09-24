import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { teacherService } from '../../services/teacherService';
import api from '../../services/api';
import Modal from '../../components/Modal';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Select from '../../components/Select';
import PhotoUpload from '../../components/PhotoUpload';
import { GENDER_OPTIONS, STATUS_OPTIONS } from '../../utils/constants';

const emptyForm = {
  teacherId: '',
  firstName: '',
  lastName: '',
  khmerName: '',
  gender: '',
  dateOfBirth: '',
  photo: '',
  phone: '',
  email: '',
  address: '',
  position: 'Teacher',
  hireDate: new Date().toISOString().split('T')[0],
  status: 'active',
};

export default function TeacherForm({ isOpen, onClose, onSuccess, teacher }) {
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const isEdit = Boolean(teacher);

  useEffect(() => {
    if (isOpen) {
      setForm(teacher ? { ...emptyForm, ...teacher } : emptyForm);
      setErrors({});
    }
  }, [isOpen, teacher]);

  const handleChange = (field) => (e) => {
    setForm((p) => ({ ...p, [field]: e.target.value }));
    if (errors[field]) setErrors((p) => ({ ...p, [field]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.firstName?.trim()) e.firstName = 'First name is required';
    if (!form.lastName?.trim()) e.lastName = 'Last name is required';
    if (!form.gender) e.gender = 'Gender is required';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      e.email = 'Invalid email format';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      if (isEdit) {
        await teacherService.update(teacher.id, form);
        toast.success('Teacher updated successfully');
      } else {
        await teacherService.create(form);
        toast.success('Teacher created successfully');
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
    if (!teacher) {
      toast.error('Save the teacher first, then edit to upload a photo');
      throw new Error('No teacher id');
    }
    const formData = new FormData();
    formData.append('photo', file);
    const res = await api.post(`/teachers/${teacher.id}/photo`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    setForm((prev) => ({ ...prev, photo: res.data.photo }));
    onSuccess?.();
  };

  const handlePhotoRemove = async () => {
    if (!teacher) return;
    await api.delete(`/teachers/${teacher.id}/photo`);
    setForm((prev) => ({ ...prev, photo: '' }));
    onSuccess?.();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Teacher' : 'Add New Teacher / បន្ថែមគ្រូថ្មី'}
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
            onRemove={teacher ? handlePhotoRemove : null}
            size="lg"
          />
        </div>

        {!isEdit && (
          <p className="text-xs text-gray-500 text-center -mt-2 mb-2">
            💡 Save the teacher first, then reopen to edit and upload a photo.
          </p>
        )}

        {isEdit && (
          <Input
            label="Teacher ID / លេខសម្គាល់គ្រូ"
            value={form.teacherId}
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
            placeholder="e.g. Chanthou"
          />
          <Input
            label="Last Name * / នាមត្រកូល"
            value={form.lastName}
            onChange={handleChange('lastName')}
            error={errors.lastName}
            placeholder="e.g. Sovann"
          />
        </div>

        <Input
          label="Khmer Name / នាមខ្លួនជាភាសាខ្មែរ"
          value={form.khmerName}
          onChange={handleChange('khmerName')}
          placeholder="e.g. សុវណ្ណ ចន្ធូ"
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
            placeholder="teacher@school.edu.kh"
          />
        </div>

        <Input
          label="Address / អាសយដ្ឋាន"
          value={form.address}
          onChange={handleChange('address')}
          placeholder="Street, Khan, City"
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label="Position / តំណែង"
            value={form.position}
            onChange={handleChange('position')}
            placeholder="e.g. Math Teacher"
          />
          <Input
            label="Hire Date / កាលបរិច្ឆេទជាក់ស្តែង"
            type="date"
            value={form.hireDate}
            onChange={handleChange('hireDate')}
          />
          <Select
            label="Status"
            value={form.status}
            onChange={handleChange('status')}
            options={STATUS_OPTIONS}
            placeholder="Select status"
          />
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            {isEdit ? 'Save Changes' : 'Create Teacher'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}