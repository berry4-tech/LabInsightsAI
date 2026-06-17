import DoctorNavbar from "./DoctorNavbar";
import {
  Search,
  Filter,
  ArrowRight,
  FileText,
  AlertTriangle,
  Users,
} from "lucide-react";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { API_BASE } from "../config";
import { getAuthItem } from "../utils/authStorage";

interface Patient {
  id: string;
  name: string;
  dob?: string;
  age?: number;
  gender?: string;
  email: string;
  phone: string;
  assignedDate: string;
  lastReport?: string;
  reportsCount: number;
  status: string;
  lastReportType?: string;
  severity?: string;
  conditions?: string[];
}

interface DoctorPatientsProps {
  onLogout: () => void;
}

export default function DoctorPatients({ onLogout }: DoctorPatientsProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPatientsFromMongo();
  }, []);

  const loadPatientsFromMongo = async () => {
    try {
      setLoading(true);
      const doctorEmail = getAuthItem("doctorEmail");
      if (!doctorEmail) {
        console.error("No doctor email in storage");
        return;
      }

      const token = getAuthItem("authToken");
      const res = await fetch(`${API_BASE}/doctor/patients/${doctorEmail}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();

      console.log("Fetched patients:", data);

      const enriched = data.map((p: any) => ({
        ...p,
        age: calculateAge(p.dob),
      }));

      setPatients(enriched);
    } catch (err) {
      console.error("Error loading patients:", err);
    } finally {
      setLoading(false);
    }
  };

  const calculateAge = (dob?: string): number | null => {
    if (!dob) return null;
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();

    const month = today.getMonth() - birthDate.getMonth();
    if (month < 0 || (month === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  };

  const filteredPatients = patients.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.lastReportType &&
        p.lastReportType.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = filterStatus === "all" || p.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "needs-follow-up":
        return "bg-red-100 text-red-600";
      case "under-review":
        return "bg-yellow-100 text-yellow-600";
      case "stable":
        return "bg-green-100 text-green-600";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case "high":
        return "text-red-600";
      case "medium":
        return "text-yellow-600";
      case "low":
        return "text-green-600";
      default:
        return "text-gray-600";
    }
  };

  const getStatusLabel = (status: string) =>
    status
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

  return (
    <div className="min-h-screen bg-gray-50">
      <DoctorNavbar onLogout={onLogout} />

      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-24">
        {/* HEADER */}
        <h1 className="text-gray-900 mb-2 text-3xl font-bold">
          My Patients
        </h1>
        <p className="text-gray-600 mb-8">
          Manage and review reports for patients who have connected with you
        </p>

        {/* SEARCH + FILTER */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                placeholder="Search by name, email, or report type..."
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-3">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
              >
                <option value="all">All Status</option>
                <option value="needs-follow-up">Needs Follow-up</option>
                <option value="under-review">Under Review</option>
                <option value="stable">Stable</option>
              </select>
            </div>
          </div>
        </div>

        {/* PATIENT GRID */}
        {loading ? (
          <div className="text-center bg-white p-20 rounded-2xl border border-gray-200">
            <p className="text-gray-600">Loading patients...</p>
          </div>
        ) : filteredPatients.length === 0 ? (
          <div className="text-center bg-white p-20 rounded-2xl border border-gray-200">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900">No patients found</h3>
            <p className="text-gray-600">
              Try adjusting your search or filters.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPatients.map((p) => (
              <div
                key={p.id || p.email}
                className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col lg:flex-row items-stretch gap-8">
                  {/* LEFT SECTION */}
                  <div className="flex gap-6 flex-1 items-start">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
                      {p.name.charAt(0).toUpperCase()}
                    </div>

                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{p.name}</h3>
                      <p className="text-gray-700 text-sm mb-1">
                        {p.age ? `${p.age} years old` : "Age unknown"}{p.gender ? `, ${p.gender}` : ""}
                      </p>
                      <p className="text-gray-600 text-sm mb-1">{p.email}</p>
                      <p className="text-gray-600 text-sm mb-6">{p.phone || "No phone"}</p>

                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <p className="text-xs text-gray-500 font-medium mb-2">Medical Conditions</p>
                          <p className="text-gray-900 font-semibold text-sm">
                            {p.conditions?.join(", ") || "None"}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-gray-500 font-medium mb-2">Total Reports</p>
                          <p className="text-gray-900 font-semibold text-sm">{p.reportsCount}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* MIDDLE SECTION - Status Badge */}
                  <div className="flex items-start justify-center lg:w-auto">
                    <span
                      className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap h-fit ${getStatusColor(
                        p.status
                      )}`}
                    >
                      {getStatusLabel(p.status)}
                    </span>
                  </div>

                  {/* RIGHT SECTION - Latest Report */}
                  <div className="lg:w-96 flex flex-col gap-4">
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-blue-600" />
                      <h4 className="font-bold text-gray-900">Latest Report</h4>
                    </div>

                    {p.reportsCount === 0 ? (
                      <p className="text-gray-600 text-sm">No reports uploaded yet</p>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-700">Type:</span>
                          <span className="text-sm font-semibold text-gray-900">{p.lastReportType || "N/A"}</span>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-700">Date:</span>
                          <span className="text-sm font-semibold text-gray-900">{p.lastReport || "N/A"}</span>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-700">Severity:</span>
                          <span className={`text-sm font-semibold flex items-center gap-1 ${getSeverityColor(p.severity)}`}>
                            {p.severity === "high" && <AlertTriangle className="w-4 h-4" />}
                            {p.severity?.toUpperCase() || "N/A"}
                          </span>
                        </div>
                      </div>
                    )}

                    <Link
                      to={`/doctor/patient/${p.email}`}
                      className="w-full bg-blue-600 text-white py-3 rounded-xl text-center hover:bg-blue-700 transition-colors font-semibold text-sm mt-2 flex items-center justify-center gap-2"
                    >
                      View Patient Details
                      <ArrowRight className="w-4 h-4" />
                    </Link>
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
