import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';

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

const PageWrapper = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -12 }}
    transition={{ duration: 0.35, ease: "easeOut" }}
    className="w-full"
  >
    {children}
  </motion.div>
);

const AppRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Public Routes */}
        <Route path="/" element={<PageWrapper><Landing /></PageWrapper>} />
        <Route path="/login/:roleParam" element={<PageWrapper><LoginRole /></PageWrapper>} />
        <Route path="/signup/:roleParam" element={<PageWrapper><SignupRole /></PageWrapper>} />
        <Route path="/meeting/:roomId" element={<PageWrapper><MeetingRoom /></PageWrapper>} />

        {/* User Protected Routes */}
        <Route path="/user" element={<ProtectedRoute allowedRoles={['user']}><Navigate to="/user/dashboard" /></ProtectedRoute>} />
        <Route path="/user/dashboard" element={<ProtectedRoute allowedRoles={['user']}><PageWrapper><UserDashboard /></PageWrapper></ProtectedRoute>} />
        <Route path="/user/bookings" element={<ProtectedRoute allowedRoles={['user']}><PageWrapper><Bookings /></PageWrapper></ProtectedRoute>} />
        <Route path="/user/availability" element={<ProtectedRoute allowedRoles={['user']}><PageWrapper><Availability /></PageWrapper></ProtectedRoute>} />
        <Route path="/user/book/:hostId" element={<ProtectedRoute allowedRoles={['user']}><PageWrapper><BookingForm /></PageWrapper></ProtectedRoute>} />

        {/* Host Protected Routes */}
        <Route path="/host" element={<ProtectedRoute allowedRoles={['host']}><Navigate to="/host/dashboard" /></ProtectedRoute>} />
        <Route path="/host/dashboard" element={<ProtectedRoute allowedRoles={['host']}><PageWrapper><HostDashboard /></PageWrapper></ProtectedRoute>} />
        <Route path="/host/manage-availability" element={<ProtectedRoute allowedRoles={['host']}><PageWrapper><ManageAvailability /></PageWrapper></ProtectedRoute>} />
        <Route path="/host/add-availability" element={<ProtectedRoute allowedRoles={['host']}><PageWrapper><AddAvailability /></PageWrapper></ProtectedRoute>} />
        <Route path="/host/edit-availability/:id" element={<ProtectedRoute allowedRoles={['host']}><PageWrapper><EditAvailability /></PageWrapper></ProtectedRoute>} />
        <Route path="/host/bookings" element={<ProtectedRoute allowedRoles={['host']}><PageWrapper><HostBookings /></PageWrapper></ProtectedRoute>} />
        <Route path="/host/settings" element={<ProtectedRoute allowedRoles={['host']}><PageWrapper><HostSettings /></PageWrapper></ProtectedRoute>} />

        {/* Admin Protected Routes */}
        <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><Navigate to="/admin/dashboard" /></ProtectedRoute>} />
        <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['admin']}><PageWrapper><AdminDashboard /></PageWrapper></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['admin']}><PageWrapper><AdminUsers /></PageWrapper></ProtectedRoute>} />
        <Route path="/admin/stats" element={<ProtectedRoute allowedRoles={['admin']}><PageWrapper><AdminStats /></PageWrapper></ProtectedRoute>} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
};

const App = () => {
  return (
    <Router>
      <div className="min-h-screen bg-[#FAFAF8] text-[#1A1A1A] font-inter">
        <Toaster 
          position="bottom-right"
          toastOptions={{
            duration: 2500,
            style: {
              background: '#FFFFFF',
              color: '#1A1A1A',
              border: '1px solid #E8E4DF',
              borderRadius: '10px',
              fontSize: '14px',
              padding: '12px 16px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
            },
          }}
        />
        <AppRoutes />
      </div>
    </Router>
  );
};

export default App;
