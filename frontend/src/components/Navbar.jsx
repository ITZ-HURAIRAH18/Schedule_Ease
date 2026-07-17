import React, { useContext, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Menu, X } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
    setMobileMenuOpen(false);
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <nav className="sticky top-0 z-[100] h-[56px] bg-[#FFF4D6] border-b border-[#E8DCC0] flex items-center justify-between px-4 md:px-6">
      <div className="flex items-center gap-8">
        <Link to="/" className="flex items-center gap-3">
          <img src="/nexgen-logo.svg" alt="NexGen" className="w-8 h-8" />
          <span className="text-base font-semibold text-[#1A1A1A]">NexGen</span>
        </Link>

        <div className="hidden md:flex items-center gap-6">
          {links.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`text-sm font-medium transition-colors h-[56px] flex items-center relative ${
                  isActive ? 'text-[#FC6C26]' : 'text-[#4A4A4A] hover:text-[#1A1A1A]'
                }`}
              >
                {link.name}
                {isActive && (
                  <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[#FC6C26]" />
                )}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-4">
        {user ? (
          <div className="hidden md:flex items-center gap-3 group cursor-pointer relative">
            <span className="text-sm font-medium text-[#4A4A4A]">{user.name}</span>
            <div className="w-8 h-8 rounded-full bg-[#FFF4D6] flex items-center justify-center text-[#FC6C26] text-xs font-semibold">
              {getInitials(user.name)}
            </div>
            <button 
              onClick={handleLogout}
              className="text-xs text-[#8A8A8A] hover:text-[#FC6C26] ml-2"
            >
              Logout
            </button>
          </div>
        ) : (
          <Link 
            to="/" 
            className="hidden md:block text-sm font-medium text-[#FC6C26] hover:text-[#E05A1A]"
          >
            Sign In
          </Link>
        )}

        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-[#1A1A1A]"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="fixed inset-0 top-[56px] z-[99] bg-[#FFF4D6] md:hidden">
          <div className="flex flex-col p-6 gap-2">
            {links.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`text-sm font-medium transition-colors py-3 px-4 rounded-[8px] ${
                    isActive 
                      ? 'text-[#FC6C26] bg-[#FFF4D6]' 
                      : 'text-[#4A4A4A] hover:bg-[#FFF4D6]'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
            <div className="border-t border-[#E8DCC0] pt-4 mt-4 px-4">
              {user ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#FFF4D6] flex items-center justify-center text-[#FC6C26] text-xs font-semibold">
                      {getInitials(user.name)}
                    </div>
                    <span className="text-sm font-medium text-[#4A4A4A]">{user.name}</span>
                  </div>
                  <button 
                    onClick={handleLogout}
                    className="text-xs text-[#8A8A8A] hover:text-[#FC6C26]"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <Link 
                  to="/" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-sm font-medium text-[#FC6C26] hover:text-[#E05A1A]"
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
