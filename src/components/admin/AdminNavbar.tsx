import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Activity, LayoutDashboard, Users, FileText, UserCog, LogOut, Menu, X, Home } from 'lucide-react';
import { removeAuthItem } from '../utils/authStorage';

interface AdminNavbarProps {
  onLogout?: () => void;
}

export default function AdminNavbar({ onLogout }: AdminNavbarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/admin/users', label: 'Users', icon: Users },
    { path: '/admin/doctors', label: 'Doctors', icon: UserCog },
    { path: '/admin/reports', label: 'Reports', icon: FileText },
  ];

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    removeAuthItem("adminEmail");
    removeAuthItem("authToken");
    if (onLogout) {
      onLogout();
    }
    navigate('/signin');
  };

  return (
    <nav className="bg-gray-900 shadow-lg border-b border-gray-800 sticky top-0 z-50">
      <style>{`
        @media (max-width: 639px) {
          .desktop-nav { display: none !important; }
          .desktop-right { display: none !important; }
          .mobile-hamburger { display: block !important; }
        }
        @media (min-width: 640px) {
          .desktop-nav { display: flex !important; }
          .desktop-right { display: flex !important; }
          .mobile-hamburger { display: none !important; }
        }
      `}</style>
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-12 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          <Link to="/admin/dashboard" className="flex items-center gap-2 sm:gap-3">
            <Activity className="w-7 h-7 sm:w-8 sm:h-8 text-blue-500" />
            <div>
              <span className="text-base sm:text-xl font-bold text-white block">LabInsight AI</span>
              <span className="text-xs text-red-400 font-medium">Admin Portal</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="desktop-nav items-center gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-colors ${
                    isActive(item.path)
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Desktop Right Side */}
          <div className="desktop-right items-center gap-3">
            <Link
              to="/"
              className="px-4 py-2.5 text-gray-300 hover:bg-gray-800 hover:text-white rounded-xl font-medium transition-colors"
            >
              Main Site
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2.5 text-red-400 hover:bg-red-900/20 rounded-xl font-medium transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>

          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="mobile-hamburger p-2 rounded-lg text-gray-300 hover:bg-gray-800"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="sm:hidden mt-3 pb-3 border-t border-gray-700 pt-3">
            <div className="flex flex-col gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-colors ${
                      isActive(item.path)
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
              
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 text-gray-300 hover:bg-gray-800 hover:text-white rounded-xl font-medium transition-colors"
              >
                <Home className="w-5 h-5" />
                <span>Main Site</span>
              </Link>
              
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="flex items-center gap-3 px-3 py-2.5 text-red-400 hover:bg-red-900/20 rounded-xl font-medium transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
