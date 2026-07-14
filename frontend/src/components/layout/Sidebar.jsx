import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import {
  MdDashboard, MdPeople, MdAccessTime, MdCalendarToday, MdHistory,
  MdBeachAccess, MdBusiness, MdWork, MdEventNote, MdBarChart,
  MdSettings, MdPerson, MdClose, MdAssignment,
} from 'react-icons/md';

const adminLinks = [
  { to: '/dashboard', icon: MdDashboard, label: 'Dashboard' },
  { to: '/employees', icon: MdPeople, label: 'Employees' },
  { label: 'ATTENDANCE', isHeader: true },
  { to: '/attendance', icon: MdAccessTime, label: 'Mark Attendance' },
  { to: '/attendance/calendar', icon: MdCalendarToday, label: 'Calendar' },
  { to: '/attendance/history', icon: MdHistory, label: 'History' },
  { label: 'MANAGEMENT', isHeader: true },
  { to: '/leaves', icon: MdBeachAccess, label: 'Leaves' },
  { to: '/tasks', icon: MdAssignment, label: 'Tasks' },
  { to: '/holidays', icon: MdEventNote, label: 'Holidays' },
  { to: '/departments', icon: MdBusiness, label: 'Departments' },
  { to: '/designations', icon: MdWork, label: 'Designations' },
  { label: 'ANALYTICS', isHeader: true },
  { to: '/reports', icon: MdBarChart, label: 'Reports' },
  { label: 'GENERAL', isHeader: true },
  { to: '/profile', icon: MdPerson, label: 'Profile' },
  { to: '/settings', icon: MdSettings, label: 'Settings' },
];

const employeeLinks = [
  { to: '/dashboard', icon: MdDashboard, label: 'Dashboard' },
  { to: '/my-attendance', icon: MdAccessTime, label: 'My Attendance' },
  { to: '/my-leaves', icon: MdBeachAccess, label: 'My Leaves' },
  { to: '/profile', icon: MdPerson, label: 'Profile' },
];

export default function Sidebar({ isOpen, onClose }) {
  const { user } = useAuth();
  const links = user?.role === 'admin' ? adminLinks : employeeLinks;

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-primary-600 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div>
            <p className="font-bold text-gray-900 dark:text-white text-sm">AttendanceMS</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user?.role}</p>
          </div>
        </div>
        <button onClick={onClose} className="lg:hidden text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
          <MdClose size={20} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
        {links.map((link, idx) => {
          if (link.isHeader) {
            return <p key={idx} className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-3 pt-4 pb-1">{link.label}</p>;
          }
          return (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/dashboard'}
              onClick={onClose}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <link.icon size={18} />
              <span>{link.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* User info */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-sm font-semibold">
            {user?.name?.charAt(0)?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user?.name}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 h-screen sticky top-0">
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={onClose}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 bottom-0 w-64 bg-white dark:bg-gray-800 z-50 lg:hidden"
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

