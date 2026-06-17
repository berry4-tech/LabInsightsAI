import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Activity, LayoutDashboard, Users, User, UserPlus, LogOut, Menu, X } from 'lucide-react';
import { removeAuthItem } from '../utils/authStorage';

interface DoctorNavbarProps {
  onLogout?: () => void;
}

interface NavItem {
  name: string;
  path: string;
  icon: React.ElementType;
}

export default function DoctorNavbar({ onLogout }: DoctorNavbarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    removeAuthItem("doctorEmail");
    removeAuthItem("doctorToken");
    removeAuthItem("authToken");
    if (onLogout) {
      onLogout();
    }
    navigate('/signin');
  };

  const navItems: NavItem[] = [
    { name: 'Dashboard', path: '/doctor/dashboard', icon: LayoutDashboard },
    { name: 'My Patients', path: '/doctor/patients', icon: Users },
    { name: 'Requests', path: '/doctor/requests', icon: UserPlus },
    { name: 'Profile', path: '/doctor/profile', icon: User },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <style>{`
        @media (max-width: 639px) {
          .desktop-nav { display: none !important; }
          .mobile-hamburger { display: block !important; }
        }
        @media (min-width: 640px) {
          .desktop-nav { display: flex !important; }
          .mobile-hamburger { display: none !important; }
        }
      `}</style>
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-12 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          <Link to="/doctor/dashboard" className="flex items-center gap-2 sm:gap-3">
            <Activity className="w-7 h-7 sm:w-8 sm:h-8 text-blue-600" />
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="text-base sm:text-xl font-bold text-gray-900">LabInsight AI</span>
              <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full hidden sm:inline-block">
                Doctor Portal
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="desktop-nav items-center gap-2">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all ${
                  isActive(item.path)
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.name}</span>
              </Link>
            ))}
            
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2.5 text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-xl font-medium transition-all ml-2"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>

          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="mobile-hamburger p-2 rounded-lg text-gray-600 hover:bg-gray-100"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="sm:hidden mt-3 pb-3 border-t border-gray-200 pt-3">
            <div className="flex flex-col gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all ${
                    isActive(item.path)
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </Link>
              ))}
              
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="flex items-center gap-3 px-3 py-2.5 text-red-600 hover:bg-red-50 rounded-xl font-medium transition-all"
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
