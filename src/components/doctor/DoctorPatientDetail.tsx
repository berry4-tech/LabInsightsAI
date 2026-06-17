import DoctorNavbar from "./DoctorNavbar";
import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  Pencil,
} from "lucide-react";
import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";
import { API_BASE } from "../config";
import { getAuthItem } from "../utils/authStorage";

interface DoctorPatientDetailProps {
  onLogout: () => void;
}

interface TestResult {
  name: string;
  value: string;
  unit: string;
  status: string;
}

interface PatientProfile {
  name: string;
  email: string;
  phone?: string;
  gender?: string;
  dateOfBirth?: string;
  createdAt?: string;
}

interface LatestReport {
  file_id: string;
  file_name: string;
  uploaded_at: string;
  severity?: string;
  testResults?: TestResult[];
}

export default function DoctorPatientDetail({ onLogout }: DoctorPatientDetailProps) {
  const { patientId } = useParams<{ patientId: string }>();
  const [patient, setPatient] = useState<PatientProfile & { age?: number | null; assignedDate?: string } | null>(null);
  const [latestReport, setLatestReport] = useState<LatestReport | null>(null);
  const [allReports, setAllReports] = useState<LatestReport[]>([]);
  const [doctorComment, setDoctorComment] = useState("");
  const [savedComment, setSavedComment] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (patientId) loadPatientDetails(patientId);
  }, [patientId]);

  const loadPatientDetails = async (email: string) => {
    try {
      setLoading(true);
      const token = getAuthItem("authToken");
      const res = await fetch(`${API_BASE}/doctor/patient-detail/${email}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setSavedComment(data.doctorComment || "");

      setPatient({
        ...data.profile,
        age: calculateAge(data.profile?.dateOfBirth),
        assignedDate: data.profile?.createdAt || new Date().toISOString(),
      });

      setLatestReport(data.latestReport || null);
      setAllReports(data.reports || []);
    } catch (err) {
      console.error("Error loading patient:", err);
    } finally {
      setLoading(false);
    }
  };

  const saveComment = async () => {
    if (!doctorComment.trim() || !patient || !latestReport) return;

    setSaving(true);
    try {
      const payload = {
        email: patient.email,
        file_id: latestReport.file_id,
        comment: doctorComment
      };

      const token = getAuthItem("authToken");
      const res = await fetch(`${API_BASE}/doctor/add-comment`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success || data.message) {
        setSavedComment(doctorComment);
        setDoctorComment("");
        setIsEditing(false);
        toast.success(savedComment ? "Comment updated!" : "Comment added successfully!");
      }
    } catch (err) {
      console.error("Error saving comment:", err);
      toast.error("Failed to save comment. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const calculateAge = (dob?: string): number | null => {
    if (!dob) return null;
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();

    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;

    return age;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DoctorNavbar onLogout={onLogout} />
        <div className="max-w-7xl mx-auto px-6 sm:px-8 py-24">
          <p className="text-center text-gray-600">Loading patient...</p>
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DoctorNavbar onLogout={onLogout} />
        <div className="max-w-7xl mx-auto px-6 sm:px-8 py-24">
          <p className="text-center text-gray-600">Patient not found.</p>
          <Link
            to="/doctor/patients"
            className="block text-center text-blue-600 hover:text-blue-700 mt-4"
          >
            ← Back to Patients
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DoctorNavbar onLogout={onLogout} />

      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-24">
        {/* BACK BUTTON */}
        <Link
          to="/doctor/patients"
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-8 font-medium"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Patients
        </Link>

        {/* PATIENT CARD */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 mb-8">
          <div className="flex flex-col md:flex-row items-start gap-8">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
              {patient.name.charAt(0).toUpperCase()}
            </div>

            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {patient.name}
              </h1>

              <p className="text-gray-600 mb-6">
                {patient.age ? `${patient.age} years old • ` : ""}
                {patient.gender || "N/A"}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500 font-medium mb-1">Email</p>
                    <p className="text-gray-900 font-medium">{patient.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500 font-medium mb-1">Phone</p>
                    <p className="text-gray-900 font-medium">{patient.phone || "N/A"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500 font-medium mb-1">Patient Since</p>
                    <p className="text-gray-900 font-medium">
                      {patient.assignedDate ? new Date(patient.assignedDate).toLocaleDateString() : "N/A"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* LATEST REPORT */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Latest Report
          </h2>

          {!latestReport ? (
            <p className="text-gray-600">No reports uploaded yet.</p>
          ) : (
            <div className="space-y-6">
              {/* Report Header */}
              <div className="flex justify-between items-start pb-6 border-b border-gray-200">
                <div>
                  <p className="font-semibold text-gray-900 text-lg">
                    {latestReport.file_name}
                  </p>
                  <p className="text-gray-600 text-sm mt-2">
                    Uploaded on{" "}
                    {new Date(latestReport.uploaded_at).toLocaleDateString()}
                  </p>
                </div>

                <span
                  className={`px-4 py-2 text-sm font-semibold rounded-full whitespace-nowrap ${
                    latestReport.severity === "high"
                      ? "bg-red-100 text-red-600"
                      : latestReport.severity === "medium"
                      ? "bg-yellow-100 text-yellow-600"
                      : "bg-green-100 text-green-600"
                  }`}
                >
                  {latestReport.severity?.toUpperCase() || "NORMAL"}
                </span>
              </div>

              {/* Test Results */}
              {latestReport.testResults && latestReport.testResults.length > 0 && (
                <div className="space-y-3">
                  {latestReport.testResults.map((t, idx) => (
                    <div
                      key={idx}
                      className="p-4 bg-gray-50 border border-gray-200 rounded-xl flex justify-between items-center"
                    >
                      <div>
                        <p className="font-semibold text-gray-900">{t.name}</p>
                        <p className="text-gray-500 text-sm">{t.unit}</p>
                      </div>

                      <div className="text-right">
                        <p className="font-bold text-gray-900 text-lg">{t.value}</p>
                        <p
                          className={`text-sm font-medium ${
                            t.status === "high"
                              ? "text-red-600"
                              : t.status === "low"
                              ? "text-green-600"
                              : "text-gray-600"
                          }`}
                        >
                          {t.status}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Doctor Comment Section */}
              <div className="mt-8 p-6 bg-gray-50 rounded-xl border">
                <h3 className="text-lg font-semibold mb-4">Doctor Notes</h3>

                {savedComment && !isEditing ? (
                  <div className="p-4 bg-white border rounded-xl">
                    <p className="text-gray-700 mb-3">{savedComment}</p>

                    <button
                      onClick={() => {
                        setIsEditing(true);
                        setDoctorComment(savedComment);
                      }}
                      className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mt-2"
                    >
                      <Pencil className="w-4 h-4" />
                      <span className="text-sm font-medium">Edit</span>
                    </button>
                  </div>
                ) : (
                  <>
                    <textarea
                      value={doctorComment}
                      onChange={(e) => setDoctorComment(e.target.value)}
                      placeholder="Write your clinical notes..."
                      className="w-full p-4 border rounded-xl focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                      rows={4}
                    />

                    <div className="mt-3 flex gap-3">
                      <button
                        onClick={saveComment}
                        disabled={saving || !doctorComment.trim()}
                        className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {saving ? "Saving..." : savedComment ? "Update Comment" : "Save Comment"}
                      </button>

                      {savedComment && (
                        <button
                          onClick={() => {
                            setIsEditing(false);
                            setDoctorComment("");
                          }}
                          className="bg-gray-400 text-white px-6 py-3 rounded-xl hover:bg-gray-500 transition-colors"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
