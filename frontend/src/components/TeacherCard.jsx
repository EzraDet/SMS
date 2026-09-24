import { QRCodeSVG } from 'qrcode.react';
import { getFullName, getInitials, formatDate } from '../utils/formatters';

const SERVER_URL = 'http://localhost:5000';

/**
 * Teacher ID Card — 85.6mm × 54mm (standard CR80 size)
 *
 * Props:
 *   teacher    — teacher object
 *   schoolInfo — { name, khmerName, phone, email, address, logo }
 *   compact    — boolean, smaller layout for bulk print
 */
export default function TeacherCard({
  teacher,
  schoolInfo = {},
  compact = false,
}) {
  const school = {
    name: schoolInfo.name || 'School Management System',
    khmerName: schoolInfo.khmerName || 'ប្រព័ន្ធគ្រប់គ្រងសាលារៀន',
    phone: schoolInfo.phone || '+855 12 345 678',
    address: schoolInfo.address || 'Phnom Penh, Cambodia',
    email: schoolInfo.email || 'info@school.edu.kh',
    logo: schoolInfo.logo || '',
  };

  const qrPayload = JSON.stringify({
    id: teacher.teacherId,
    name: getFullName(teacher),
    role: 'teacher',
    position: teacher.position || '',
    url: `${window.location.origin}/teachers/${teacher.id}`,
  });

  const baseClasses = compact
    ? 'w-[340px] h-[215px] p-3 text-[10px]'
    : 'w-[420px] h-[265px] p-4 text-xs';

  // Resolve photo URL (handles absolute, data, and relative paths)
  const photoSrc = teacher.photo
    ? teacher.photo.startsWith('http') || teacher.photo.startsWith('data:')
      ? teacher.photo
      : `${SERVER_URL}${teacher.photo}`
    : '';

  return (
    <div
      className={`${baseClasses} bg-white rounded-xl shadow-lg border border-gray-200 flex flex-col overflow-hidden relative`}
      style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
    >
      {/* Top accent bar (green for teachers) */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-green-500 via-green-600 to-green-700" />

      {/* Header */}
      <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
        <div className="w-8 h-8 rounded-lg bg-green-600 flex items-center justify-center flex-shrink-0">
          {school.logo ? (
            <img
              src={school.logo}
              alt="logo"
              className="w-full h-full object-cover rounded-lg"
            />
          ) : (
            <span className="text-white font-bold text-sm">👨‍🏫</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-800 leading-tight truncate">
            {school.name}
          </p>
          <p className="text-[9px] text-gray-500 truncate">{school.khmerName}</p>
        </div>
        <div className="text-right text-[8px] text-gray-500 leading-tight">
          <p className="uppercase font-semibold text-green-600">Teacher ID</p>
          <p>2024-2025</p>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 flex gap-3 pt-3">
        {/* ==================== PHOTO / INITIALS ==================== */}
        <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
          <div
            className={`${
              compact ? 'w-16 h-20' : 'w-20 h-24'
            } rounded-lg bg-green-100 text-green-700 flex items-center justify-center font-bold text-xl overflow-hidden`}
          >
            {photoSrc ? (
              <img
                src={photoSrc}
                alt="teacher"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.replaceWith(
                    document.createTextNode(
                      getInitials(teacher.firstName, teacher.lastName)
                    )
                  );
                }}
              />
            ) : (
              getInitials(teacher.firstName, teacher.lastName)
            )}
          </div>
          <span className="text-[8px] text-gray-400 font-mono">
            {teacher.teacherId}
          </span>
        </div>

        {/* Details */}
        <div className="flex-1 flex flex-col justify-between min-w-0">
          <div className="space-y-1">
            <div>
              <p
                className={`font-bold text-gray-800 ${
                  compact ? 'text-[12px]' : 'text-sm'
                } leading-tight truncate`}
              >
                {getFullName(teacher)}
              </p>
              <p className="text-[9px] text-gray-500 truncate">
                {teacher.khmerName}
              </p>
              {teacher.position && (
                <p className="text-[9px] text-green-600 font-medium truncate">
                  {teacher.position}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[9px]">
              <DetailItem label="Gender" value={teacher.gender} />
              <DetailItem
                label="Hired"
                value={formatDate(teacher.hireDate)}
              />
              <DetailItem
                label="Phone"
                value={teacher.phone || '—'}
              />
            </div>
          </div>

          {/* Contact footer */}
          <div className="text-[8px] text-gray-400 mt-1 leading-tight">
            <p className="truncate">📞 {school.phone}</p>
            <p className="truncate">✉️ {school.email}</p>
          </div>
        </div>

        {/* QR code */}
        <div className="flex flex-col items-center justify-between flex-shrink-0">
          <div className="bg-white p-1 rounded-lg border border-gray-100">
            <QRCodeSVG
              value={qrPayload}
              size={compact ? 60 : 72}
              level="M"
              bgColor="#ffffff"
              fgColor="#166534"
            />
          </div>
          <p className="text-[7px] text-gray-400 text-center mt-1 leading-tight">
            Scan to verify
          </p>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-green-700 via-green-600 to-green-500" />
    </div>
  );
}

function DetailItem({ label, value }) {
  return (
    <div className="flex gap-1 min-w-0">
      <span className="text-gray-400 flex-shrink-0">{label}:</span>
      <span className="text-gray-700 font-medium truncate capitalize">
        {value || '—'}
      </span>
    </div>
  );
}