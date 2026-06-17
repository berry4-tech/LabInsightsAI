import { Link, useLocation } from 'react-router-dom';
import {
  Activity,
  FileText,
  TrendingUp,
  User,
  Settings,
  Upload,
  LogOut,
  MessageCircle,
  Stethoscope
} from 'lucide-react';
import { getAuthItem, removeAuthItem } from './utils/authStorage';

interface NavbarProps {
  onSignOut?: () => void;
  hasUploadedReports?: boolean; // no longer used but kept to avoid TS errors
}

export default function Navbar({ onSignOut }: NavbarProps) {
  const location = useLocation();

  const navItems = [
    { path: '/view-reports', label: 'My Reports', icon: FileText },
    { path: '/trends', label: 'Trends', icon: TrendingUp },
    { path: '/chat', label: 'Chat', icon: MessageCircle },
    { path: '/upload-report', label: 'Upload', icon: Upload },
    { path: '/profile', label: 'Profile', icon: User },
    { path: '/my-doctor', label: 'My Doctor', icon: Stethoscope },
    { path: '/settings', label: 'Settings', icon: Settings },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-5">
        <div className="flex items-center justify-between">
          
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <Activity className="w-8 h-8 text-blue-600" />
            <span className="text-xl font-bold text-gray-900">LabInsight AI</span>
          </Link>

          {/* Navigation Menu */}
          <div className="hidden md:flex items-center gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-colors ${
                    isActive(item.path)
                      ? 'bg-blue-50 text-blue-600 border border-blue-200'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* Sign Out Button */}
          <div className="flex items-center gap-4">
            {getAuthItem("userEmail") && (
              <button
                onClick={() => {
                  removeAuthItem("userEmail");
                  removeAuthItem("authToken");
                  onSignOut && onSignOut();
                  window.location.href = "/signin";
                }}
                className="flex items-center gap-2 px-5 py-2.5 text-red-600 hover:bg-red-50 rounded-xl font-medium transition-colors"
              >
                <LogOut className="w-5 h-5" />
                Sign Out
              </button>
            )}
          </div>

        </div>
      </div>
    </nav>
  );
}
