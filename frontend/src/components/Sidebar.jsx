import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  School,
  CalendarCheck,
  ClipboardList,
  FileText,
  IdCard,
  CalendarRange,
  UserCog,
  Trophy,
  ChevronDown,
  ChevronRight,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { hasPageAccess } from '../utils/permissions';
import { classService } from '../services/classService';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true, key: 'dashboard' },
  { to: '/students', label: 'Students', icon: Users, key: 'students' },
  { to: '/teachers', label: 'Teachers', icon: GraduationCap, key: 'teachers' },
  { to: '/classes', label: 'Classes', icon: School, key: 'classes', expandable: true },
  { to: '/subjects', label: 'Subjects', icon: BookOpen, key: 'subjects' },
  { to: '/attendance', label: 'Attendance', icon: CalendarCheck, key: 'attendance' },
  { to: '/scores', label: 'Scores', icon: ClipboardList, key: 'scores' },
  { to: '/results', label: 'Results', icon: FileText, key: 'results' },
  { to: '/ranking', label: 'Ranking', icon: Trophy, key: 'ranking' },
  { to: '/student-cards', label: 'Student Cards', icon: IdCard, key: 'student-cards' },
  { to: '/teacher-cards', label: 'Teacher Cards', icon: IdCard, key: 'teacher-cards' },
  { to: '/academic-years', label: 'Academic Years', icon: CalendarRange, key: 'academic-years' },
  { to: '/users', label: 'Users', icon: UserCog, key: 'users' },
];

export default function Sidebar({ isOpen, onClose }) {
  const { user } = useAuth();
  const location = useLocation();

  const [classes, setClasses] = useState([]);
  const [classesOpen, setClassesOpen] = useState(false);
  const [classesLoaded, setClassesLoaded] = useState(false);

  // Load classes the first time the user expands the menu
  useEffect(() => {
    if (!classesOpen || classesLoaded) return;
    classService
      .getAll({ status: 'active', limit: 100, withCounts: 'true' })
      .then((res) => {
        setClasses(res.data.classes || []);
        setClassesLoaded(true);
      })
      .catch(() => setClasses([]));
  }, [classesOpen, classesLoaded]);

  const visibleItems = navItems.filter((item) =>
    hasPageAccess(user?.role, item.key)
  );

  // Auto-expand Classes if we're on a class page
  useEffect(() => {
    if (location.pathname.startsWith('/classes')) {
      setClassesOpen(true);
    }
  }, [location.pathname]);

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={onClose} />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200
          transform transition-transform duration-200 lg:translate-x-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-primary-600 rounded-lg">
              <School className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-gray-800 text-sm">School MS</h1>
              <p className="text-[10px] text-gray-500">Management System</p>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden p-1 rounded hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Nav */}
        <nav className="p-3 space-y-1 overflow-y-auto h-[calc(100vh-4rem)]">
          {visibleItems.map(({ to, label, icon: Icon, end, expandable }) => {
            if (expandable && label === 'Classes') {
              const isActive = location.pathname.startsWith('/classes');
              return (
                <div key={to}>
                  <div
                    className={`flex items-center rounded-lg text-sm font-medium transition
                      ${
                        isActive
                          ? 'bg-primary-50 text-primary-700'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                  >
                    <NavLink
                      to={to}
                      end={end}
                      onClick={onClose}
                      className="flex-1 flex items-center gap-3 px-3 py-2.5"
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      {label}
                    </NavLink>
                    <button
                      onClick={() => setClassesOpen((v) => !v)}
                      className="p-2 pr-3 hover:text-primary-700"
                      title={classesOpen ? 'Collapse' : 'Expand'}
                    >
                      {classesOpen ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  {/* Sub-menu: class list */}
                  {classesOpen && (
                    <div className="mt-1 ml-4 pl-3 border-l-2 border-gray-100 space-y-0.5">
                      {classes.length === 0 ? (
                        <p className="text-xs text-gray-400 px-2 py-1.5">
                          No classes
                        </p>
                      ) : (
                        classes.map((c) => (
                          <NavLink
                            key={c.id}
                            to={`/classes/${c.id}`}
                            onClick={onClose}
                            className={({ isActive }) =>
                              `flex items-center justify-between gap-2 px-2 py-1.5 rounded-md text-xs transition
                              ${
                                isActive
                                  ? 'bg-primary-100 text-primary-700 font-medium'
                                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                              }`
                            }
                          >
                            <span className="truncate">{c.className}</span>
                            <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full flex-shrink-0">
                              {c.studentCount ?? 0}
                            </span>
                          </NavLink>
                        ))
                      )}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <NavLink
                key={to}
                to={to}
                end={end}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition
                  ${
                    isActive
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`
                }
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {label}
              </NavLink>
            );
          })}
        </nav>
      </aside>
    </>
  );
}