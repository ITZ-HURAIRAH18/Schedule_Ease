import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

// Pages
import Landing from './pages/Landing';
import LoginRole from './pages/LoginRole';
import SignupRole from './pages/SignupRole';

// User Pages
import UserDashboard from './pages/user/UserDashboard';
import Bookings from './pages/user/Bookings';
import Availability from './pages/user/Availability';
import BookingForm from './pages/user/BookingForm';

// Host Pages
import HostDashboard from './pages/host/HostDashboard';
import ManageAvailability from './pages/host/ManageAvailability';
import AddAvailability from './pages/host/AddAvailability';
import EditAvailability from './pages/host/EditAvailability';
import HostBookings from './pages/host/HostBookings';
import HostSettings from './pages/host/HostSettings';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminStats from './pages/admin/AdminStats';

// Routes & Components
import ProtectedRoute from './routes/ProtectedRoute';
import MeetingRoom from './components/MeetingRoom';
import { Toaster } from 'react-hot-toast';

const BackgroundOrbs = () => (
  <div className="fixed inset-0 overflow-hidden -z-10 pointer-events-none">
    <motion.div
      animate={{
        x: [0, 100, 0],
        y: [0, 50, 0],
      }}
      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-violet-500/10 rounded-full blur-[120px]"
    />
    <motion.div
      animate={{
        x: [0, -80, 0],
        y: [0, 120, 0],
      }}
      transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
      className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[120px]"
    />
    <motion.div
      animate={{
        x: [0, 50, 0],
        y: [0, -100, 0],
      }}
      transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
      className="absolute top-[30%] right-[20%] w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px]"
    />
  </div>
);

const App = () => {
  return (
    <Router>
      <div className="min-h-screen relative font-inter text-slate-900 overflow-x-hidden">
        <BackgroundOrbs />
        <Toaster position="bottom-right" />
        
        <AnimatePresence mode="wait">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/login/:roleParam" element={<LoginRole />} />
            <Route path="/signup/:roleParam" element={<SignupRole />} />
            <Route path="/meeting/:roomId" element={<MeetingRoom />} />

            {/* User Protected Routes */}
            <Route path="/user" element={<ProtectedRoute allowedRoles={['user']}><Navigate to="/user/dashboard" /></ProtectedRoute>} />
            <Route path="/user/dashboard" element={<ProtectedRoute allowedRoles={['user']}><UserDashboard /></ProtectedRoute>} />
            <Route path="/user/bookings" element={<ProtectedRoute allowedRoles={['user']}><Bookings /></ProtectedRoute>} />
            <Route path="/user/availability" element={<ProtectedRoute allowedRoles={['user']}><Availability /></ProtectedRoute>} />
            <Route path="/user/book/:hostId" element={<ProtectedRoute allowedRoles={['user']}><BookingForm /></ProtectedRoute>} />

            {/* Host Protected Routes */}
            <Route path="/host" element={<ProtectedRoute allowedRoles={['host']}><Navigate to="/host/dashboard" /></ProtectedRoute>} />
            <Route path="/host/dashboard" element={<ProtectedRoute allowedRoles={['host']}><HostDashboard /></ProtectedRoute>} />
            <Route path="/host/manage-availability" element={<ProtectedRoute allowedRoles={['host']}><ManageAvailability /></ProtectedRoute>} />
            <Route path="/host/add-availability" element={<ProtectedRoute allowedRoles={['host']}><AddAvailability /></ProtectedRoute>} />
            <Route path="/host/edit-availability/:id" element={<ProtectedRoute allowedRoles={['host']}><EditAvailability /></ProtectedRoute>} />
            <Route path="/host/bookings" element={<ProtectedRoute allowedRoles={['host']}><HostBookings /></ProtectedRoute>} />
            <Route path="/host/settings" element={<ProtectedRoute allowedRoles={['host']}><HostSettings /></ProtectedRoute>} />

            {/* Admin Protected Routes */}
            <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><Navigate to="/admin/dashboard" /></ProtectedRoute>} />
            <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['admin']}><AdminUsers /></ProtectedRoute>} />
            <Route path="/admin/stats" element={<ProtectedRoute allowedRoles={['admin']}><AdminStats /></ProtectedRoute>} />

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AnimatePresence>
      </div>
    </Router>
  );
};

export default App;
