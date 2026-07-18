import React, { useContext, useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Menu, X, User, LogOut, Settings } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

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

  const profilePath = userRole ? `/${userRole}/profile` : '/';
  const settingsPath = userRole === 'host' ? '/host/settings' : null;

  const handleLogout = () => {
    logout();
    navigate('/');
    setMobileMenuOpen(false);
    setDropdownOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
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
          <div className="hidden md:block relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-3 group cursor-pointer"
            >
              <span className="text-sm font-medium text-[#4A4A4A] group-hover:text-[#1A1A1A] transition-colors">{user.name}</span>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FC6C26] to-[#E05A1A] flex items-center justify-center text-white text-xs font-semibold shadow-sm">
                {getInitials(user.name)}
              </div>
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-[#E8DCC0] rounded-xl shadow-lg py-2 z-50">
                <div className="px-4 py-2 border-b border-[#E8DCC0] mb-1">
                  <p className="text-[13px] font-semibold text-[#1A1A1A] truncate">{user.name}</p>
                  <p className="text-[11px] text-[#8A8A8A] truncate">{user.email}</p>
                </div>
                <Link
                  to={profilePath}
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-[13px] text-[#4A4A4A] hover:bg-[#FFF4D6] hover:text-[#FC6C26] transition-colors"
                >
                  <User className="w-4 h-4" />
                  Profile
                </Link>
                {settingsPath && (
                  <Link
                    to={settingsPath}
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-[13px] text-[#4A4A4A] hover:bg-[#FFF4D6] hover:text-[#FC6C26] transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    Settings
                  </Link>
                )}
                <div className="border-t border-[#E8DCC0] mt-1 pt-1">
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-2.5 text-[13px] text-[#4A4A4A] hover:bg-[#FFF4D6] hover:text-[#FC6C26] transition-colors w-full text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              </div>
            )}
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
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FC6C26] to-[#E05A1A] flex items-center justify-center text-white text-xs font-semibold shadow-sm">
                      {getInitials(user.name)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#1A1A1A]">{user.name}</p>
                      <p className="text-[11px] text-[#8A8A8A]">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      to={profilePath}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex-1 text-center text-[13px] font-medium text-[#FC6C26] py-2 rounded-lg border border-[#E8DCC0] hover:bg-[#FFF4D6] transition-colors"
                    >
                      Profile
                    </Link>
                    {settingsPath && (
                      <Link
                        to={settingsPath}
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex-1 text-center text-[13px] font-medium text-[#FC6C26] py-2 rounded-lg border border-[#E8DCC0] hover:bg-[#FFF4D6] transition-colors"
                      >
                        Settings
                      </Link>
                    )}
                    <button
                      onClick={handleLogout}
                      className="flex-1 text-center text-[13px] font-medium text-[#8A8A8A] py-2 rounded-lg border border-[#E8DCC0] hover:bg-[#FFF4D6] transition-colors"
                    >
                      Logout
                    </button>
                  </div>
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
