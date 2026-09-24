import { useRef, useState } from 'react';
import { Camera, X, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import { getInitials } from '../utils/formatters';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const SERVER_URL = API_BASE.replace(/\/api\/?$/, ''); // strip /api

/**
 * Props:
 *   currentPhoto  — string path (e.g. "/uploads/students/foo.jpg")
 *   firstName     — for initials fallback
 *   lastName
 *   onUpload      — async (file) => API call. Should return updated entity.
 *   onRemove      — optional async () => void
 *   size          — 'md' | 'lg' (default 'md')
 */
export default function PhotoUpload({
  currentPhoto,
  firstName = '',
  lastName = '',
  onUpload,
  onRemove,
  size = 'md',
}) {
  const [preview, setPreview] = useState(currentPhoto || '');
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const inputRef = useRef(null);

  const fullPhotoUrl = preview
    ? preview.startsWith('http') || preview.startsWith('data:')
      ? preview
      : `${SERVER_URL}${preview}`
    : '';

  const dims = size === 'lg' ? 'w-32 h-32' : 'w-24 h-24';

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Client-side validation
    if (file.size > 3 * 1024 * 1024) {
      return toast.error('Image must be under 3 MB');
    }
    if (!file.type.startsWith('image/')) {
      return toast.error('Only image files are allowed');
    }

    // Show local preview immediately
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target.result);
    reader.readAsDataURL(file);

    setUploading(true);
    try {
      await onUpload(file);
      toast.success('Photo uploaded');
    } catch (err) {
      toast.error(err.message || 'Upload failed');
      setPreview(currentPhoto || '');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleRemove = async () => {
    if (!onRemove) return;
    if (!confirm('Remove this photo?')) return;
    setRemoving(true);
    try {
      await onRemove();
      setPreview('');
      toast.success('Photo removed');
    } catch (err) {
      toast.error(err.message || 'Remove failed');
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div className={`relative ${dims} rounded-full overflow-hidden bg-primary-100 border-4 border-white shadow-lg`}>
        {fullPhotoUrl ? (
          <img
            src={fullPhotoUrl}
            alt="photo"
            className="w-full h-full object-cover"
            onError={() => setPreview('')}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-primary-700 font-bold text-2xl">
            {getInitials(firstName, lastName) || <Camera className="w-8 h-8" />}
          </div>
        )}

        {uploading && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <Upload className="w-6 h-6 text-white animate-bounce" />
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
        >
          <Camera className="w-3.5 h-3.5" />
          {preview ? 'Change' : 'Upload'}
        </button>
        {preview && onRemove && (
          <button
            type="button"
            onClick={handleRemove}
            disabled={removing}
            className="text-xs text-red-600 hover:text-red-700 font-medium flex items-center gap-1"
          >
            <X className="w-3.5 h-3.5" />
            Remove
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFile}
        className="hidden"
      />
    </div>
  );
}