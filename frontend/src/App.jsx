import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Layouts
import Layout from './components/layout/Layout';
import AuthLayout from './components/layout/AuthLayout';

// Auth pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';

// Admin pages
import AdminDashboardPage from './pages/admin/Dashboard';
import EmployeesPage from './pages/admin/Employees';
import EmployeeDetailPage from './pages/admin/EmployeeDetail';
import AttendancePage from './pages/admin/Attendance';
import AttendanceCalendarPage from './pages/admin/AttendanceCalendar';
import AttendanceHistoryPage from './pages/admin/AttendanceHistory';
import LeavesPage from './pages/admin/Leaves';
import DepartmentsPage from './pages/admin/Departments';
import DesignationsPage from './pages/admin/Designations';
import HolidaysPage from './pages/admin/Holidays';
import ReportsPage from './pages/admin/Reports';
import SettingsPage from './pages/admin/Settings';
import TaskManagerPage from './pages/admin/TaskManager';

// Employee pages
import EmployeeDashboardPage from './pages/employee/Dashboard';
import EmployeeAttendancePage from './pages/employee/Attendance';
import EmployeeLeavesPage from './pages/employee/Leaves';

// Shared
import ProfilePage from './pages/shared/Profile';
import NotFound from './pages/shared/NotFound';

const PrivateRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return children;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
};

export default function App() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Navigate to={user ? '/dashboard' : '/login'} replace />} />
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
        <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
        <Route path="/reset-password/:token" element={<PublicRoute><ResetPassword /></PublicRoute>} />
      </Route>

      {/* Protected */}
      <Route element={<PrivateRoute><Layout /></PrivateRoute>}>
        {/* Dashboard â€” role-based */}
        <Route path="/dashboard" element={
          user?.role === 'admin'
            ? <PrivateRoute roles={['admin']}><AdminDashboardPage /></PrivateRoute>
            : <PrivateRoute roles={['employee']}><EmployeeDashboardPage /></PrivateRoute>
        } />

        {/* Admin */}
        <Route path="/employees" element={<PrivateRoute roles={['admin']}><EmployeesPage /></PrivateRoute>} />
        <Route path="/employees/:id" element={<PrivateRoute roles={['admin']}><EmployeeDetailPage /></PrivateRoute>} />
        <Route path="/attendance" element={<PrivateRoute roles={['admin']}><AttendancePage /></PrivateRoute>} />
        <Route path="/attendance/calendar" element={<PrivateRoute roles={['admin']}><AttendanceCalendarPage /></PrivateRoute>} />
        <Route path="/attendance/history" element={<PrivateRoute roles={['admin']}><AttendanceHistoryPage /></PrivateRoute>} />
        <Route path="/leaves" element={<PrivateRoute roles={['admin']}><LeavesPage /></PrivateRoute>} />
        <Route path="/tasks" element={<PrivateRoute roles={['admin']}><TaskManagerPage /></PrivateRoute>} />
        <Route path="/departments" element={<PrivateRoute roles={['admin']}><DepartmentsPage /></PrivateRoute>} />
        <Route path="/designations" element={<PrivateRoute roles={['admin']}><DesignationsPage /></PrivateRoute>} />
        <Route path="/holidays" element={<PrivateRoute roles={['admin']}><HolidaysPage /></PrivateRoute>} />
        <Route path="/reports" element={<PrivateRoute roles={['admin']}><ReportsPage /></PrivateRoute>} />
        <Route path="/settings" element={<PrivateRoute roles={['admin']}><SettingsPage /></PrivateRoute>} />

        {/* Employee */}
        <Route path="/my-attendance" element={<PrivateRoute roles={['employee']}><EmployeeAttendancePage /></PrivateRoute>} />
        <Route path="/my-leaves" element={<PrivateRoute roles={['employee']}><EmployeeLeavesPage /></PrivateRoute>} />

        {/* Shared */}
        <Route path="/profile" element={<ProfilePage />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

