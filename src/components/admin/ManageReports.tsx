import AdminNavbar from './AdminNavbar';
import {
  Search,
  Eye,
  Download,
  Trash2,
  Calendar,
  FileText,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { API_BASE } from '../config';
import { getAuthItem } from '../utils/authStorage';

interface Report {
  _id: string;
  userName: string;
  userEmail: string;
  reportName: string;
  uploadDate: string;
  type: string;
  status: 'normal' | 'abnormal' | 'critical';
  abnormalCount: number;
  totalTests: number;
  file_path: string;
}

export default function ManageReports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // --------------------------------
  // FETCH REPORTS FROM BACKEND
  // --------------------------------
  const loadReports = async () => {
    try {
      const token = getAuthItem("authToken");
      const res = await fetch(`${API_BASE}/admin/reports`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setReports(data.reports || []);
    } catch (err) {
      console.error("Error loading reports:", err);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  // --------------------------------
  // DELETE REPORT
  // --------------------------------
  const handleDelete = async (reportId: string) => {
    if (!window.confirm("Delete this report permanently?")) return;

    try {
      const token = getAuthItem("authToken");
      await fetch(`${API_BASE}/admin/reports/${reportId}`, {
        method: "DELETE",
        headers: { 'Authorization': `Bearer ${token}` }
      });

      setReports((prev) => prev.filter((r) => r._id !== reportId));
    } catch (err) {
      console.error("Failed to delete report:", err);
    }
  };

  // --------------------------------
  // VIEW PDF IN BROWSER
  // --------------------------------
  const handleView = async (id: string) => {
    try {
      const token = getAuthItem("authToken");
      const res = await fetch(`${API_BASE}/admin/view/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!res.ok) throw new Error('Failed to fetch file');
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      window.open(url, "_blank");
    } catch (err) {
      console.error("Error viewing report:", err);
    }
  };

  // --------------------------------
  // DOWNLOAD PDF
  // --------------------------------
  const handleDownload = async (id: string, fileName: string) => {
    try {
      const token = getAuthItem("authToken");
      const res = await fetch(`${API_BASE}/admin/download/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!res.ok) throw new Error('Failed to download file');
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName || 'report.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error downloading report:", err);
    }
  };

  // --------------------------------
  // FILTER LOGIC
  // --------------------------------
  const filteredReports = reports.filter((report) => {
    const search = searchQuery.toLowerCase();

    const matchesSearch =
      report.userName.toLowerCase().includes(search) ||
      report.reportName.toLowerCase().includes(search) ||
      report.userEmail.toLowerCase().includes(search);

    const matchesFilter =
      filterStatus === "all" || report.status === filterStatus;

    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: reports.length,
    normal: reports.filter((r) => r.status === "normal").length,
    abnormal: reports.filter((r) => r.status === "abnormal").length,
    critical: reports.filter((r) => r.status === "critical").length,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'normal':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'abnormal':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'critical':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'normal':
        return <CheckCircle className="w-4 h-4" />;
      case 'abnormal':
      case 'critical':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavbar />

      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-20">

        {/* Header */}
        <div className="mb-20">
          <h1 className="text-gray-900 mb-4">Manage Reports</h1>
          <p className="text-lg text-gray-600">Overview and management of all uploaded lab reports</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          <div className="bg-white rounded-2xl shadow-sm p-10 border border-gray-100">
            <div className="text-sm text-gray-600 mb-3">Total Reports</div>
            <div className="text-4xl font-bold text-gray-900">{stats.total}</div>
          </div>
          <div className="bg-green-50 rounded-2xl shadow-sm p-10 border border-green-100">
            <div className="text-sm text-green-700 mb-3">Normal Results</div>
            <div className="text-4xl font-bold text-green-900">{stats.normal}</div>
          </div>
          <div className="bg-yellow-50 rounded-2xl shadow-sm p-10 border border-yellow-100">
            <div className="text-sm text-yellow-700 mb-3">Abnormal Results</div>
            <div className="text-4xl font-bold text-yellow-900">{stats.abnormal}</div>
          </div>
          <div className="bg-red-50 rounded-2xl shadow-sm p-10 border border-red-100">
            <div className="text-sm text-red-700 mb-3">Critical Results</div>
            <div className="text-4xl font-bold text-red-900">{stats.critical}</div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm p-10 border border-gray-100 mb-12">
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by user name, email, or report name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
            </div>

            <div className="lg:w-64">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-4 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="all">All Status</option>
                <option value="normal">Normal</option>
                <option value="abnormal">Abnormal</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>
        </div>

        {/* Reports Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-8 py-5">User</th>
                  <th className="px-8 py-5">Report Name</th>
                  <th className="px-8 py-5">Upload Date</th>
                  <th className="px-8 py-5">Type</th>
                  <th className="px-8 py-5">Results</th>
                  <th className="px-8 py-5">Status</th>
                  <th className="px-8 py-5">Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredReports.map((report) => (
                  <tr key={report._id} className="hover:bg-gray-50">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                          {report.userName.charAt(0)}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{report.userName}</div>
                          <div className="text-sm text-gray-600">{report.userEmail}</div>
                        </div>
                      </div>
                    </td>

                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-blue-600" />
                        <span>{report.reportName}</span>
                      </div>
                    </td>

                    <td className="px-8 py-6">{new Date(report.uploadDate).toDateString()}</td>

                    <td className="px-8 py-6 text-gray-600">{report.type}</td>

                    <td className="px-8 py-6">
                      <div className="text-sm">
                        <div>{report.totalTests} tests</div>
                        {report.abnormalCount > 0 && (
                          <div className="text-red-600">{report.abnormalCount} abnormal</div>
                        )}
                      </div>
                    </td>

                    <td className="px-8 py-6">
                      <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border ${getStatusColor(report.status)}`}>
                        {getStatusIcon(report.status)}
                        <span>{report.status}</span>
                      </div>
                    </td>

                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">

                        {/* VIEW */}
                        <button
                          onClick={() => handleView(report._id)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                        >
                          <Eye className="w-5 h-5" />
                        </button>

                        {/* DOWNLOAD */}
                        <button
                          onClick={() => handleDownload(report._id, report.reportName)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                        >
                          <Download className="w-5 h-5" />
                        </button>

                        

                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>

            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
