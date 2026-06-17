import Navbar from './Navbar';
import { FileText, Calendar, AlertCircle, CheckCircle, Eye, Download, Search, Upload,Trash2  } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { API_BASE } from './config';
import { getAuthItem } from './utils/authStorage';


interface Report {
  id: string;
  name: string;
  date: string;
  type: string;
  status: 'normal' | 'abnormal' | 'critical';
  abnormalCount: number;
  totalTests: number;
}

interface ViewReportsProps {
  onSignOut: () => void;
}

export default function ViewReports({ onSignOut }: ViewReportsProps) {
  const [reports, setReports] = useState<Report[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  

  // 🔥 FETCH REPORTS FROM BACKEND
  useEffect(() => {
  const email = getAuthItem("userEmail");
  const token = getAuthItem("authToken");
  if (!email) return;

  fetch(`${API_BASE}/reports?email=${email}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
    .then(res => res.json())
    .then(data => {
      const transformed = data.reports.map((r: any) => ({
        id: r.file_id,
        name: (r.file_name || "Lab Report"),
        date: r.uploaded_at || new Date().toISOString(),
        type: "Medical Report",
        status: "normal",           // TEMP — will come from AI later
        abnormalCount: 0,           // TEMP
        totalTests: 0,              // TEMP
      }));
      setReports(transformed);
    })
    .catch(err => console.error("Report fetch error:", err));
}, []);


  // 🔍 FILTER LOGIC
  const filteredReports = reports.filter((report) => {
    const matchesSearch =
       report.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
  report.type?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesFilter = filterStatus === 'all' || report.status === filterStatus;

    return matchesSearch && matchesFilter;
  });

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
        return <CheckCircle className="w-5 h-5" />;
      case 'abnormal':
      case 'critical':
        return <AlertCircle className="w-5 h-5" />;
      default:
        return null;
    }
  };
  // Download handler
const handleDownload = async (reportId: string, fileName: string) => {
  try {
    const token = getAuthItem("authToken");
    const response = await fetch(`${API_BASE}/download-report/${reportId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!response.ok) {
      throw new Error('Download failed');
    }
    
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName || 'report.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (err) {
    console.error('Download error:', err);
    alert('Could not download report');
  }
};

const handleDelete = async (reportId: string) => {
  if (!window.confirm("Are you sure you want to delete this report?")) return;

  try {
    const token = getAuthItem("authToken");
    const res = await fetch(`${API_BASE}/delete-report/${reportId}`, {
      method: "DELETE",
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const data = await res.json();
    if (res.ok) {
      // Remove from UI without reload
      setReports(prev => prev.filter(r => r.id !== reportId));
    } else {
      alert(data.error || "Failed to delete report");
    }
  } catch (err) {
    console.error("Delete error:", err);
    alert("Could not delete report");
  }
};


  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar onSignOut={onSignOut} />

      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-20">

        {/* HEADER */}
        <div className="mb-20">
          <h1 className="text-gray-900 mb-4">My Lab Reports</h1>
          <p className="text-lg text-gray-600">View and manage all your medical lab reports</p>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          <div className="bg-white rounded-2xl shadow-sm p-10 border border-gray-100">
            <div className="text-sm text-gray-600 mb-3">Total Reports</div>
            <div className="text-4xl font-bold text-gray-900">{reports.length}</div>
          </div>
          <div className="bg-green-50 rounded-2xl shadow-sm p-10 border border-green-100">
            <div className="text-sm text-green-700 mb-3">Normal Results</div>
            <div className="text-4xl font-bold text-green-900">
              {reports.filter(r => r.status === 'normal').length}
            </div>
          </div>
          <div className="bg-yellow-50 rounded-2xl shadow-sm p-10 border border-yellow-100">
            <div className="text-sm text-yellow-700 mb-3">Abnormal Results</div>
            <div className="text-4xl font-bold text-yellow-900">
              {reports.filter(r => r.status === 'abnormal').length}
            </div>
          </div>
          <div className="bg-red-50 rounded-2xl shadow-sm p-10 border border-red-100">
            <div className="text-sm text-red-700 mb-3">Critical Results</div>
            <div className="text-4xl font-bold text-red-900">
              {reports.filter(r => r.status === 'critical').length}
            </div>
          </div>
        </div>

        {/* FILTERS */}
        <div className="bg-white rounded-2xl shadow-sm p-10 border border-gray-100 mb-12">
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search reports by name or type..."
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

        {/* REPORTS LIST */}
        {filteredReports.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-16 border border-gray-100 text-center">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-6" />
            <h3 className="text-xl font-semibold text-gray-900 mb-3">No reports found</h3>
            <p className="text-gray-600 mb-8">Try adjusting your search or filter criteria</p>
            <Link
              to="/upload-report"
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-3.5 rounded-xl font-medium hover:bg-blue-700 transition-colors"
            >
              <Upload className="w-5 h-5" />
              Upload Your First Report
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {filteredReports.map((report) => (
              <div
                key={report.id}
                className="bg-white rounded-2xl shadow-sm p-8 border border-gray-100 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div className="flex items-start gap-6">
                    <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <FileText className="w-7 h-7 text-blue-600" />
                    </div>

                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">{report.name}</h3>

                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(report.date).toLocaleDateString('en-US')}</span>
                        </div>

                        <span className="text-gray-300">•</span>
                        <span>{report.type}</span>

                        <span className="text-gray-300">•</span>
                        <span>{report.totalTests} tests performed</span>

                        {report.abnormalCount > 0 && (
                          <>
                            <span className="text-gray-300">•</span>
                            <span className="text-red-600 font-medium">
                              {report.abnormalCount} abnormal
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className={`flex items-center gap-2 px-5 py-2.5 rounded-xl border font-medium ${getStatusColor(report.status)}`}>
                      {getStatusIcon(report.status)}
                      <span className="capitalize">{report.status}</span>
                    </div>

                    <Link
                      to={`/report-insights/${report.id}`}
                      className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-blue-700 transition-colors"
                    >
                      <Eye className="w-5 h-5" />
                      View Details
                    </Link>

                    <button 
                      onClick={() => handleDownload(report.id, report.name)}
                      className="p-2.5 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
                      title="Download Report"
                    >
                      <Download className="w-5 h-5 text-gray-600" />
                    </button>
                    <button
  onClick={() => handleDelete(report.id)}
  className="p-2.5 border border-red-300 rounded-xl hover:bg-red-50 transition-colors"
>
  <Trash2 className="w-5 h-5 text-red-600" />
</button>


                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
