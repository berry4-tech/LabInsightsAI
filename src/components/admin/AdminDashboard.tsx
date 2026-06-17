import AdminNavbar from './AdminNavbar';
import {
  Users, FileText, Activity, TrendingUp,
  ArrowUp, ArrowDown, Clock
} from 'lucide-react';
import { API_BASE } from '../config';

import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer
} from 'recharts';

import { useEffect, useState } from 'react';
import { getAuthItem } from '../utils/authStorage';

interface ActivityItem {
  user: string;
  action: string;
  time: string;
}

export default function AdminDashboard({ onLogout }: any) {

  // ------------------------------
  // BACKEND DATA STATES
  // ------------------------------
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalReports, setTotalReports] = useState(0);
  const [statusCounts, setStatusCounts] = useState({ normal: 0, abnormal: 0, critical: 0 });
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [growthData, setGrowthData] = useState<any[]>([]);


  // ------------------------------
  // LOAD DATA FROM BACKEND
  // ------------------------------
  useEffect(() => {
    const token = getAuthItem("authToken");
    const headers = { 'Authorization': `Bearer ${token}` };

    fetch(`${API_BASE}/admin/dashboard/user-growth`, { headers })
      .then(res => res.json())
      .then(data => setGrowthData(data.growth));

    fetch(`${API_BASE}/admin/dashboard/recent-activity`, { headers })
      .then(res => res.json())
      .then(data => setRecentActivity(data.recent));

    fetch(`${API_BASE}/admin/dashboard/report-status`, { headers })
      .then(res => res.json())
      .then(data => setStatusCounts(data));

    fetch(`${API_BASE}/admin/users`, { headers })
      .then(res => res.json())
      .then(data => setTotalUsers(data.users.length));

    fetch(`${API_BASE}/admin/reports`, { headers })
      .then(res => res.json())
      .then(data => setTotalReports(data.reports.length));

  }, []);


  // ------------------------------
  // DERIVED UI STATS
  // ------------------------------
  const stats = [
    {
      label: 'Total Users',
      value: totalUsers,
      change: '+5%',
      trend: 'up',
      icon: Users,
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
      borderColor: 'border-blue-100',
    },
    {
      label: 'Total Reports',
      value: totalReports,
      change: '+11%',
      trend: 'up',
      icon: FileText,
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600',
      borderColor: 'border-purple-100',
    },
    {
      label: 'Active Today',
      value: recentActivity.length,
      change: '+2%',
      trend: 'up',
      icon: Activity,
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
      borderColor: 'border-green-100',
    },
    {
      label: 'Avg Reports/User',
      value: totalUsers ? (totalReports / totalUsers).toFixed(2) : 0,
      change: '+1%',
      trend: 'up',
      icon: TrendingUp,
      bgColor: 'bg-orange-50',
      iconColor: 'text-orange-600',
      borderColor: 'border-orange-100',
    },
  ];

  // ------------------------------
  // BAR GRAPH DATA (Normal/Abnormal/Critical)
  // ------------------------------
  const reportStatusData = [
    { type: "Normal", count: statusCounts.normal },
    { type: "Abnormal", count: statusCounts.abnormal },
    { type: "Critical", count: statusCounts.critical },
  ];


  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavbar onLogout={onLogout} />

      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-20">

        {/* HEADER */}
        <div className="mb-20">
          <h1 className="text-gray-900 mb-4">Dashboard</h1>
          <p className="text-lg text-gray-600">Overview of platform analytics and user activity</p>
        </div>

        {/* -------- STATS GRID -------- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
          {stats.map((stat, index) => (
            <div key={index} className={`bg-white rounded-2xl shadow-sm p-10 border ${stat.borderColor}`}>
              <div className="flex items-start justify-between mb-8">
                <div className={`w-16 h-16 ${stat.bgColor} rounded-xl flex items-center justify-center`}>
                  <stat.icon className={`w-8 h-8 ${stat.iconColor}`} />
                </div>
                <div className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium ${stat.trend === "up" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                  }`}>
                  <ArrowUp className="w-4 h-4" />
                  {stat.change}
                </div>
              </div>
              <div className="text-4xl font-bold text-gray-900 mb-3">{stat.value}</div>
              <div className="text-sm text-gray-600">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* -------- MAIN CHARTS (LINE + RECENT ACTIVITY) -------- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mb-20">

          {/* USER GROWTH */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm p-12 border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900 mb-10">User Growth</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart
                data={[
                  { month: "0", users: 0 },
                  { month: new Date().toISOString().slice(0, 7), users: totalUsers },
                ]}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" allowDecimals={false} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="users"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={{ fill: "#3b82f6", r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>

          </div>

          {/* RECENT ACTIVITY */}
          <div className="bg-white rounded-2xl shadow-sm p-12 border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900 mb-10">Recent Activity</h2>
            <div className="space-y-6">
              {recentActivity.map((item, index) => (
                <div key={index} className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {item.user.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{item.user}</p>
                    <p className="text-sm text-gray-600">{item.action}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Clock className="w-3 h-3 text-gray-400" />
                      <span className="text-xs text-gray-500">
                        {new Date(item.time).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* -------- REPORT STATUS BAR GRAPH -------- */}
        <div className="bg-white rounded-2xl shadow-sm p-12 border border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900 mb-10">Report Severity Overview</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={reportStatusData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="type" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

      </div>
    </div>
  );
}
