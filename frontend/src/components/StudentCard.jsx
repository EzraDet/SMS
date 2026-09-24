import { QRCodeSVG } from 'qrcode.react';
import { getFullName, getInitials, formatDate } from '../utils/formatters';

/**
 * Student ID Card — 85.6mm × 54mm (standard CR80 size, printed at 3.375in × 2.125in)
 * Displays school header, student photo/initials, details, and QR code.
 *
 * Props:
 *   student    — student object
 *   cls        — class object (optional)
 *   schoolInfo — { name, khmerName, phone, address, logo }
 *   compact    — boolean, smaller layout for bulk print
 */
export default function StudentCard({
  student,
  cls,
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

  // QR payload — encoded as compact JSON string
  const qrPayload = JSON.stringify({
    id: student.studentId,
    name: getFullName(student),
    class: cls?.className || '',
    year: student.academicYear || '',
    url: `${window.location.origin}/students/${student.id}`,
  });

  const baseClasses = compact
    ? 'w-[340px] h-[215px] p-3 text-[10px]'
    : 'w-[420px] h-[265px] p-4 text-xs';

  return (
    <div
      className={`${baseClasses} bg-white rounded-xl shadow-lg border border-gray-200 flex flex-col overflow-hidden relative`}
      style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
    >
      {/* Top accent bar */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700" />

      {/* Header */}
      <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
        <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center flex-shrink-0">
          {school.logo ? (
            <img
              src={school.logo}
              alt="logo"
              className="w-full h-full object-cover rounded-lg"
            />
          ) : (
            <span className="text-white font-bold text-sm">🎓</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-800 leading-tight truncate">
            {school.name}
          </p>
          <p className="text-[9px] text-gray-500 truncate">{school.khmerName}</p>
        </div>
        <div className="text-right text-[8px] text-gray-500 leading-tight">
          <p className="uppercase font-semibold text-primary-600">
            Student ID
          </p>
          <p>2024-2025</p>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 flex gap-3 pt-3">
        {/* Photo / initials */}
        <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
          <div
            className={`${
              compact ? 'w-16 h-20' : 'w-20 h-24'
            } rounded-lg bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-xl overflow-hidden`}
          >
            {student.photo ? (
              <img
                src={student.photo}
                alt="student"
                className="w-full h-full object-cover"
              />
            ) : (
              getInitials(student.firstName, student.lastName)
            )}
          </div>
          <span className="text-[8px] text-gray-400 font-mono">
            {student.studentId}
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
                {getFullName(student)}
              </p>
              <p className="text-[9px] text-gray-500 truncate">
                {student.khmerName}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[9px]">
              <DetailItem label="Gender" value={student.gender} />
              <DetailItem
                label="DOB"
                value={formatDate(student.dateOfBirth)}
              />
              <DetailItem
                label="Class"
                value={cls?.className || '—'}
              />
              <DetailItem
                label="Grade"
                value={cls?.grade ? `Grade ${cls.grade}` : '—'}
              />
            </div>
          </div>

          {/* Contact footer inside details */}
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
              fgColor="#1e3a8a"
            />
          </div>
          <p className="text-[7px] text-gray-400 text-center mt-1 leading-tight">
            Scan to verify
          </p>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-700 via-primary-600 to-primary-500" />
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