import DoctorNavbar from "./DoctorNavbar";
import {
  Users,
  AlertTriangle,
  Clock,
  CheckCircle,
  ArrowRight,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { API_BASE } from "../config";
import { getAuthItem } from "../utils/authStorage";

interface Patient {
  name: string;
  email: string;
  age: number;
  gender: string;
  created_at: string;
}

interface Report {
  id: string;
  patientName: string;
  reportType: string;
  uploadDate: string;
  severity: string;
}

interface DoctorDashboardProps {
  onLogout: () => void;
}

export default function DoctorDashboard({ onLogout }: DoctorDashboardProps) {
  const doctorEmail = getAuthItem("doctorEmail");

  const [patients, setPatients] = useState<Patient[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [status, setStatus] = useState({
    normal: 0,
    abnormal: 0,
    critical: 0,
  });
  const [loading, setLoading] = useState(true);

  // Load ALL doctor dashboard data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([loadPatients(), loadStatus(), loadHighPriorityReports()]);
      setLoading(false);
    };
    loadData();
  }, []);

  // ------------------------
  // LOAD ASSIGNED PATIENTS
  // ------------------------
  const loadPatients = async () => {
    try {
      const token = getAuthItem("authToken");
      const res = await fetch(
        `${API_BASE}/api/doctor/dashboard/patients?email=${doctorEmail}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      const data = await res.json();
      setPatients(data.patients || []);
    } catch (err) {
      console.error("Error loading patients:", err);
    }
  };

  // ------------------------
  // LOAD STATUS COUNTS
  // ------------------------
  const loadStatus = async () => {
    try {
      const token = getAuthItem("authToken");
      const res = await fetch(
        `${API_BASE}/api/doctor/dashboard/report-status?email=${doctorEmail}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      const data = await res.json();
      setStatus(data);
    } catch (err) {
      console.error("Error loading status:", err);
    }
  };

  // ------------------------
  // LOAD HIGH PRIORITY REPORTS
  // ------------------------
  const loadHighPriorityReports = async () => {
    try {
      const token = getAuthItem("authToken");
      const res = await fetch(
        `${API_BASE}/api/doctor/dashboard/high-priority?email=${doctorEmail}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      const data = await res.json();
      setReports(data.reports || []);
    } catch (err) {
      console.error("Error loading high priority reports:", err);
    }
  };

  // ------------------------
  // STATS UI (Dynamic)
  // ------------------------
  const stats = [
    {
      label: "Total Patients",
      value: patients.length,
      icon: Users,
      bgColor: "bg-blue-50",
      iconColor: "text-blue-600",
      borderColor: "border-blue-100",
    },
    {
      label: "Pending Reviews",
      value: status.abnormal,
      icon: Clock,
      bgColor: "bg-yellow-50",
      iconColor: "text-yellow-600",
      borderColor: "border-yellow-100",
    },
    {
      label: "High Severity",
      value: status.critical,
      icon: AlertTriangle,
      bgColor: "bg-red-50",
      iconColor: "text-red-600",
      borderColor: "border-red-100",
    },
    {
      label: "Normal Reports",
      value: status.normal,
      icon: CheckCircle,
      bgColor: "bg-green-50",
      iconColor: "text-green-600",
      borderColor: "border-green-100",
    },
  ];

  // UI Helpers
  const getSeverityColor = (sev: string) => {
    if (sev === "high" || sev === "critical")
      return "bg-red-100 text-red-700 border-red-200";
    if (sev === "medium" || sev === "abnormal")
      return "bg-yellow-100 text-yellow-700 border-yellow-200";
    return "bg-green-100 text-green-700 border-green-200";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <DoctorNavbar onLogout={onLogout} />

      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-20">

        {/* HEADER */}
        <div className="mb-12 pt-4">
          <h1 className="text-gray-900 mb-4 text-3xl font-semibold">
            Doctor Dashboard
          </h1>
          <p className="text-lg text-gray-600">
            Overview of your patients and reports
          </p>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {stats.map((stat, index) => (
            <div
              key={index}
              className={`bg-white rounded-2xl shadow-sm p-8 border ${stat.borderColor}`}
            >
              <div className="flex items-start justify-between mb-6">
                <div
                  className={`w-14 h-14 ${stat.bgColor} rounded-xl flex items-center justify-center`}
                >
                  <stat.icon className={`w-7 h-7 ${stat.iconColor}`} />
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-2">
                {loading ? "—" : stat.value}
              </div>
              <div className="text-sm text-gray-600">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* MAIN GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">

          {/* HIGH PRIORITY REPORTS */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm p-8 border border-gray-100">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-semibold text-gray-900">
                High Priority Reports
              </h2>
              <Link
                to="/doctor/patients"
                className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center gap-2"
              >
                View Patients <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="space-y-4">
              {loading ? (
                <p className="text-gray-500">Loading reports...</p>
              ) : reports.length === 0 ? (
                <p className="text-gray-500">No high priority reports</p>
              ) : (
                reports.map((r, idx) => (
                  <div
                    key={idx}
                    className="p-5 border border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-semibold text-gray-900">
                        {r.patientName}
                      </h3>

                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium border ${getSeverityColor(
                          r.severity
                        )}`}
                      >
                        {r.severity.toUpperCase()}
                      </span>
                    </div>

                    <p className="text-sm text-gray-700">
                      Report: {r.reportType}
                    </p>

                    <div className="flex justify-between mt-3">
                      <span className="text-xs text-gray-500">
                        Uploaded: {new Date(r.uploadDate).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* RECENT PATIENTS */}
          <div className="bg-white rounded-2xl shadow-sm p-8 border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900 mb-8">
              Recent Patients
            </h2>

            <div className="space-y-4">
              {loading ? (
                <p className="text-gray-500">Loading patients...</p>
              ) : patients.length === 0 ? (
                <p className="text-gray-500">No patients assigned yet</p>
              ) : (
                patients.slice(0, 6).map((p, idx) => (
                  <Link key={idx} to={`/doctor/patient/${p.email}`}>
                    <div className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-xl transition">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                        {p.name.charAt(0).toUpperCase()}
                      </div>

                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {p.name}
                        </p>
                        <p className="text-xs text-gray-600">{p.email}</p>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
