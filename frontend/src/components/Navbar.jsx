import React, { useContext } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();

  const userRole = user?.role;

  const navLinks = {
    user: [
      { name: 'Dashboard', path: '/user/dashboard' },
      { name: 'My Bookings', path: '/user/bookings' },
      { name: 'Available Hosts', path: '/user/availability' },
    ],
    host: [
      { name: 'Dashboard', path: '/host/dashboard' },
      { name: 'Bookings', path: '/host/bookings' },
      { name: 'Availability', path: '/host/manage-availability' },
      { name: 'Settings', path: '/host/settings' },
    ],
    admin: [
      { name: 'Dashboard', path: '/admin/dashboard' },
      { name: 'Users', path: '/admin/users' },
      { name: 'Stats', path: '/admin/stats' },
    ],
  };

  const links = userRole ? navLinks[userRole] : [];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <nav className="sticky top-0 z-[100] h-[56px] bg-white border-b border-[#E8E4DF] flex items-center justify-between px-6">
      <div className="flex items-center gap-8">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#C8622A] rounded-md flex items-center justify-center text-white font-bold">
            N
          </div>
          <span className="text-base font-semibold text-[#1A1A1A]">NexGen</span>
        </Link>

        <div className="flex items-center gap-6">
          {links.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`text-sm font-medium transition-colors h-[56px] flex items-center relative ${
                  isActive ? 'text-[#C8622A]' : 'text-[#4A4A4A] hover:text-[#1A1A1A]'
                }`}
              >
                {link.name}
                {isActive && (
                  <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[#C8622A]" />
                )}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-4">
        {user ? (
          <div className="flex items-center gap-3 group cursor-pointer relative">
            <span className="text-sm font-medium text-[#4A4A4A]">{user.name}</span>
            <div className="w-8 h-8 rounded-full bg-[#F5F3F0] flex items-center justify-center text-[#92694A] text-xs font-semibold">
              {getInitials(user.name)}
            </div>
            {/* Simple Dropdown placeholder / Logout button for now as per "dropdown arrow" in spec */}
            <button 
              onClick={handleLogout}
              className="text-xs text-[#8A8A8A] hover:text-[#C8622A] ml-2"
            >
              Logout
            </button>
          </div>
        ) : (
          <Link 
            to="/" 
            className="text-sm font-medium text-[#C8622A] hover:text-[#A84E20]"
          >
            Sign In
          </Link>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
