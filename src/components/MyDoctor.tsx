import Navbar from "./Navbar";
import { API_BASE } from "./config";
import {
  Stethoscope,
  UserCheck,
  Mail,
  Phone,
  Calendar,
  Award,
  FileCheck,
  MessageSquare,
  CheckCircle,
  Clock,
  Users,
  Search,
  Star,
  Send,
  X,
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { getAuthItem } from "./utils/authStorage";

interface Doctor {
  id: string; // doctorEmail used as id
  name: string;
  specialization: string;
  email: string;
  phone: string;
  experience: string;
  patientsCount: number;
  rating: number;
  education: string;
  availability: string;
  status: string;
  licenseNumber?: string;
  reportsReviewed?: number;
  certifications?: string[];
  assignedDate?: string;
}


interface ReportInsightShare {
  id: string;
  reportId: string;
  reportName: string;
  sharedDate: string;
  status: "pending" | "reviewed" | "approved";
  doctorReview?: string;
  reviewDate?: string;
  severity?: "low" | "medium" | "high";
}

interface DoctorRating {
  doctorId: string;
  rating: number;
  review: string;
  date: string;
}

interface MyDoctorProps {
  onSignOut: () => void;
  hasUploadedReports: boolean;
}

export default function MyDoctor({
  onSignOut,
  hasUploadedReports,
}: MyDoctorProps) {
  const [selectedTab, setSelectedTab] = useState<"my-doctor" | "find-doctor">(
    "my-doctor"
  );
  const [assignedDoctor, setAssignedDoctor] = useState<Doctor | null>(null);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(null);
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [requestMessage, setRequestMessage] = useState("");
  const [showShareReportDialog, setShowShareReportDialog] = useState(false);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [sharedReports, setSharedReports] = useState<ReportInsightShare[]>([]);
  const [showRatingDialog, setShowRatingDialog] = useState(false);
  const [ratingValue, setRatingValue] = useState(5);
  const [ratingReview, setRatingReview] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [availableDoctors, setAvailableDoctors] = useState<Doctor[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [loadingAssigned, setLoadingAssigned] = useState(false);

  const [latestReport, setLatestReport] = useState<any>(null);


  // 🔹 Normalize doctor from backend → Doctor type
  const mapDoctorFromApi = (d: any, index: number = 0): Doctor => {
    return {
      id: d.doctorEmail || d.email || String(index + 1), // <- used everywhere
      name: d.name || d.fullName || "Doctor",
      specialization: d.specialization || "General Practice",
      email: d.doctorEmail || d.email || "",
      phone: d.phone || "Not provided",
      experience:
        typeof d.experience === "number"
          ? `${d.experience} years`
          : d.experienceYears
            ? `${d.experienceYears} years`
            : d.experience || "—",
      patientsCount: d.patientsCount || d.patients_count || 0,
      rating: typeof d.rating === "number" ? d.rating : 4.8,
      education: d.degree || d.education || "MBBS",
      availability: d.availability || "Available",
      status: d.status || "active",
      licenseNumber: d.licenseNumber,
      reportsReviewed: d.reportsReviewed,
      certifications: d.certifications || [],
      assignedDate: d.assignedDate,
    };
  };

  // 🔹 Initial load
  // 🔹 Load doctors ONLY when Find Doctor tab is opened
// 🔹 Initial load
useEffect(() => {
  loadConnectionStatus();
  loadAssignedDoctor();
}, []);

// 🔹 Load doctors ONLY when Find Doctor tab is opened
useEffect(() => {
  if (selectedTab === "find-doctor") {
    loadDoctors();
  }
}, [selectedTab]);


  const loadDoctors = async () => {
    try {
      setLoadingDoctors(true);
      const token = getAuthItem("authToken");
      const res = await fetch(`${API_BASE}/doctors`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to fetch doctors");
      const data = await res.json();
      const mapped: Doctor[] = (data || []).map((d: any, idx: number) =>
        mapDoctorFromApi(d, idx)
      );
      setAvailableDoctors(mapped);
    } catch (err) {
      console.error("Error loading doctors:", err);
      toast.error("Could not load doctors from server");
    } finally {
      setLoadingDoctors(false);
    }
  };

  const loadAssignedDoctor = async () => {
  const email = getAuthItem("userEmail");
  if (!email) {
    console.warn("No userEmail found in localStorage");
    return;
  }

  try {
    setLoadingAssigned(true);

    // 1️⃣ Load Assigned Doctor
    const token = getAuthItem("authToken");
    const res = await fetch(`${API_BASE}/assigned-doctor/${email}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error("Failed to fetch assigned doctor");

    const data = await res.json();

    if (data && data.doctor) {
      const mappedDoctor = mapDoctorFromApi(data.doctor);
      setAssignedDoctor(mappedDoctor);
    } else {
      setAssignedDoctor(null);
    }

    // 2️⃣ Load Latest Report for This Patient (with doctor comment)
    const reportRes = await fetch(`${API_BASE}/my-latest-report?email=${email}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const reportData = await reportRes.json();

    setLatestReport(reportData.latestReport || null);

  } catch (err) {
    console.error("Error loading assigned doctor:", err);
    toast.error("Could not load your assigned doctor");
  } finally {
    setLoadingAssigned(false);
  }
};


  const loadSharedReports = () => {
    const stored = localStorage.getItem("sharedReportInsights");
    if (stored) {
      setSharedReports(JSON.parse(stored));
    }
  };

  const handleRequestDoctor = (doctorId: string) => {
    setSelectedDoctorId(doctorId);
    setShowRequestDialog(true);
  };

  const requestDoctorReview = () => {
  const userEmail = getAuthItem("userEmail");
  const assigned = assignedDoctor;

  const reviewRequests = JSON.parse(localStorage.getItem("doctorReviewRequests") || "[]");

  reviewRequests.push({
    id: `review_${Date.now()}`,
    patientEmail: userEmail,
    doctorEmail: assigned?.email,
    date: new Date().toISOString(),
    status: "pending"
  });

  localStorage.setItem("doctorReviewRequests", JSON.stringify(reviewRequests));

  toast.success("Review request sent to your doctor!");

  setShowShareReportDialog(false);
};


  const handleSendRequest = async () => {
  if (!requestMessage.trim()) {
    toast.error("Please enter a message");
    return;
  }

  const selectedDoctor = availableDoctors.find(d => d.id === selectedDoctorId);
  if (!selectedDoctor) {
    toast.error("Doctor not found");
    return;
  }

  const userEmail = getAuthItem("userEmail");

  try {
    const token = getAuthItem("authToken");
    await fetch(`${API_BASE}/send-request`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        id: `req_${Date.now()}`,
        doctorEmail: selectedDoctor.email,
        patientEmail: userEmail,
        message: requestMessage,
        requestDate: new Date().toISOString(),
      }),
    });

    toast.success("Your request has been sent and is pending approval.");

    // 🔥 IMPORTANT: refresh connection status in My Doctor tab
    await loadConnectionStatus();

    setShowRequestDialog(false);
    setRequestMessage("");
    setSelectedDoctorId(null);

  } catch (err) {
    toast.error("Failed to send request");
  }
};



  const handleShareReport = (reportId: string) => {
    setSelectedReportId(reportId);
    setShowShareReportDialog(true);
  };

  const confirmShareReport = () => {
    if (!selectedReportId || !assignedDoctor) return;

    const reports = JSON.parse(
      localStorage.getItem("uploadedReports") || "[]"
    );
    const report = reports.find((r: any) => r.id === selectedReportId);

    if (!report) return;

    const share: ReportInsightShare = {
      id: `share_${Date.now()}`,
      reportId: selectedReportId,
      reportName: report.name,
      sharedDate: new Date().toISOString(),
      status: "pending",
    };

    const updatedShares = [...sharedReports, share];
    setSharedReports(updatedShares);
    localStorage.setItem("sharedReportInsights", JSON.stringify(updatedShares));

    const doctorShares = JSON.parse(
      localStorage.getItem("doctorPendingReviews") || "[]"
    );
    localStorage.setItem(
      "doctorPendingReviews",
      JSON.stringify([
        ...doctorShares,
        {
          ...share,
          patientId: "patient_1",
          patientName: "John Doe",
        },
      ])
    );

    toast.success("Report insights shared with your doctor");
    setShowShareReportDialog(false);
    setSelectedReportId(null);
  };

  const handleRateDoctor = () => {
    setShowRatingDialog(true);
  };

  const submitRating = () => {
    if (!assignedDoctor) return;

    const rating: DoctorRating = {
      doctorId: assignedDoctor.id,
      rating: ratingValue,
      review: ratingReview,
      date: new Date().toISOString(),
    };

    const existingRatings = JSON.parse(
      localStorage.getItem("doctorRatings") || "[]"
    );
    localStorage.setItem(
      "doctorRatings",
      JSON.stringify([...existingRatings, rating])
    );

    toast.success("Thank you for rating your doctor!");
    setShowRatingDialog(false);
    setRatingValue(5);
    setRatingReview("");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-50 text-green-700 rounded-lg text-sm font-medium border border-green-200">
            <CheckCircle className="w-4 h-4" />
            Approved
          </span>
        );
      case "reviewed":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium border border-blue-200">
            <MessageSquare className="w-4 h-4" />
            Reviewed
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-50 text-yellow-700 rounded-lg text-sm font-medium border border-yellow-200">
            <Clock className="w-4 h-4" />
            Pending Review
          </span>
        );
      default:
        return null;
    }
  };

  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case "high":
        return "text-red-600 bg-red-50 border-red-200";
      case "medium":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "low":
        return "text-green-600 bg-green-50 border-green-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const filteredDoctors = availableDoctors.filter(
    (doctor) =>
      doctor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doctor.specialization
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
  );

  const availableReports = JSON.parse(
    localStorage.getItem("uploadedReports") || "[]"
  );

  const [connectionStatus, setConnectionStatus] = useState<{
    status: "pending" | "accepted" | "rejected" | null;
    rejectionMessage?: string;
    doctor?: { name: string };
  } | null>(null);


  const loadConnectionStatus = async () => {
    const userEmail = getAuthItem("userEmail");
    if (!userEmail) return;

    try {
      const token = getAuthItem("authToken");
      const res = await fetch(
        `${API_BASE}/patient/connection-status/${userEmail}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      if (!res.ok) {
        console.error("Failed to fetch connection status");
        return;
      }

      const data = await res.json();
      
      // Transform backend response to match component's expected format
      if (data.hasRequest) {
        setConnectionStatus({
          status: data.status,
          rejectionMessage: data.rejectionMessage,
          doctor: { name: data.doctorName }
        });
      } else {
        setConnectionStatus(null);
      }
    } catch (error) {
      console.error("Error loading connection status:", error);
    }
  };




  return (

    <div className="min-h-screen bg-gray-50">
      <Navbar onSignOut={onSignOut} hasUploadedReports={hasUploadedReports} />

      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-20">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-gray-900 mb-4">My Healthcare Provider</h1>
          <p className="text-lg text-gray-600">
            Connect with medical professionals who can review and provide
            insights on your lab reports
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-gray-200">
          <button
            onClick={() => setSelectedTab("my-doctor")}
            className={`pb-4 px-2 font-medium transition-colors border-b-2 ${selectedTab === "my-doctor"
                ? "text-blue-600 border-blue-600"
                : "text-gray-600 border-transparent hover:text-gray-900"
              }`}
          >
            <div className="flex items-center gap-2">
              <UserCheck className="w-5 h-5" />
              My Doctor
            </div>
          </button>
          <button
            onClick={() => setSelectedTab("find-doctor")}
            className={`pb-4 px-2 font-medium transition-colors border-b-2 ${selectedTab === "find-doctor"
                ? "text-blue-600 border-blue-600"
                : "text-gray-600 border-transparent hover:text-gray-900"
              }`}
          >
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Find a Doctor
            </div>
          </button>
        </div>

        {/* My Doctor Tab */}

        {selectedTab === "my-doctor" && (
          <>
            {/* --------------------------- *
     * LOADING STATE
     * --------------------------- */}
            {(loadingAssigned && !assignedDoctor) || loadingDoctors ? (
              <div className="text-center py-20">
                <div className="bg-white rounded-2xl shadow-sm p-12 border border-gray-100 max-w-2xl mx-auto">
                  <Stethoscope className="w-20 h-20 text-gray-300 mx-auto mb-6 animate-pulse" />
                  <h2 className="text-gray-900 mb-4">Loading your doctor...</h2>
                  <p className="text-lg text-gray-600">Fetching details...</p>
                </div>
              </div>
            ) : connectionStatus?.status === "pending" ? (
              /* --------------------------- *
               * PENDING REQUEST UI
               * --------------------------- */
              <div className="text-center py-20">
                <div className="bg-white rounded-2xl shadow-sm p-12 border max-w-2xl mx-auto">
                  <Clock className="w-20 h-20 text-yellow-500 mx-auto mb-6" />
                  <h2 className="text-gray-900 mb-4">Request Pending</h2>
                  <p className="text-lg text-gray-600">
                    Your connection request to <b>{connectionStatus.doctor?.name}</b> is awaiting approval.
                  </p>
                </div>
              </div>
            ) : connectionStatus?.status === "rejected" ? (
              /* --------------------------- *
               * REJECTED UI
               * --------------------------- */
              <div className="text-center py-20">
                <div className="bg-white rounded-2xl shadow-sm p-12 border max-w-2xl mx-auto">
                  <X className="w-20 h-20 text-red-500 mx-auto mb-6" />
                  <h2 className="text-gray-900 mb-4">Request Rejected</h2>
                  <p className="text-lg text-gray-600 mb-6">
                    {connectionStatus.rejectionMessage || "Your request was rejected."}
                  </p>

                  <button
                    onClick={() => setSelectedTab("find-doctor")}
                    className="bg-blue-600 text-white px-8 py-4 rounded-xl hover:bg-blue-700"
                  >
                    Find Another Doctor
                  </button>
                </div>
              </div>
            ) : !assignedDoctor ? (
              /* --------------------------- *
               * NO ASSIGNED DOCTOR YET
               * --------------------------- */
              <div className="text-center py-20">
                <div className="bg-white rounded-2xl shadow-sm p-12 border border-gray-100 max-w-2xl mx-auto">
                  <Stethoscope className="w-20 h-20 text-gray-300 mx-auto mb-6" />
                  <h2 className="text-gray-900 mb-4">No Doctor Assigned Yet</h2>
                  <p className="text-lg text-gray-600 mb-8">
                    Please select your doctor from the "Find a Doctor" tab.
                  </p>
                  <button
                    onClick={() => setSelectedTab("find-doctor")}
                    className="bg-blue-600 text-white px-8 py-4 rounded-xl hover:bg-blue-700"
                  >
                    Find a Doctor
                  </button>
                </div>
              </div>
            ) : (
              /* --------------------------- *
               * ACCEPTED → SHOW DOCTOR CARD
               * --------------------------- */
              <div className="space-y-8">
                {/* DOCTOR PROFILE CARD */}
                <div className="bg-white rounded-2xl shadow-sm p-12 border border-gray-100">
                  <div className="flex items-start gap-6">
                    <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <Stethoscope className="w-12 h-12 text-white" />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h2 className="text-gray-900 mb-2">{assignedDoctor.name}</h2>
                          <p className="text-blue-600 font-medium mb-2">
                            {assignedDoctor.specialization}
                          </p>
                          <p className="text-gray-600">{assignedDoctor.education}</p>
                        </div>

                        <div className="flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-lg border border-green-200">
                          <CheckCircle className="w-5 h-5" />
                          <span className="font-medium">Your Doctor</span>
                        </div>
                      </div>

                      {/* Doctor Details */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        <div className="flex items-center gap-3">
                          <Mail className="w-5 h-5 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-500">Email</p>
                            <p className="text-gray-900">{assignedDoctor.email}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <Phone className="w-5 h-5 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-500">Phone</p>
                            <p className="text-gray-900">{assignedDoctor.phone}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <Calendar className="w-5 h-5 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-500">Experience</p>
                            <p className="text-gray-900">{assignedDoctor.experience}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <Award className="w-5 h-5 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-500">Rating</p>
                            <p className="text-gray-900">{assignedDoctor.rating}/5.0</p>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={handleRateDoctor}
                        className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700"
                      >
                        <Star className="w-5 h-5" />
                        Rate Doctor
                      </button>
                    </div>
                  </div>


                </div>


{/* Doctor Comment Viewer */}
<div className="bg-white rounded-2xl shadow-sm p-12 border border-gray-100 mt-10">
  <h3 className="text-gray-900 mb-4">Doctor's Comment</h3>

  {!latestReport?.doctor_comment ? (
    <div className="text-center py-10 bg-gray-50 rounded-xl border border-gray-200">
      <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
      <p className="text-gray-600">Your doctor has not added a comment yet.</p>
    </div>
  ) : (
    <div className="bg-blue-50 border border-blue-100 rounded-xl p-6">
      <div className="flex items-start gap-3">
        <MessageSquare className="w-5 h-5 text-blue-600 flex-shrink-0 mt-1" />
        <div>
          <p className="text-sm font-medium text-blue-900 mb-2">
            Doctor’s Comment:
          </p>

          <p className="text-gray-700 mb-3">
            {latestReport.doctor_comment}
          </p>

          {latestReport.comment_date && (
            <p className="text-sm text-gray-500">
              Comment added on{" "}
              {new Date(latestReport.comment_date).toLocaleDateString(
                "en-US",
                {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                }
              )}
            </p>
          )}
        </div>
      </div>
    </div>
  )}
</div>


              </div>
            )}
          </>
        )}

        {/* Find a Doctor Tab */}
        {selectedTab === "find-doctor" && (
          <div>
            <div className="mb-8">
              <div className="relative">
                <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by name or specialization..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
            </div>

            <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-6">
              <div className="flex items-start gap-3">
                <Stethoscope className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-blue-900 font-medium mb-2">
                    Connect with a Specialist
                  </h3>
                  <p className="text-blue-700">
                    Browse our network of qualified healthcare professionals.
                    Send a connection request to have a doctor review your lab
                    reports and provide medical insights.
                  </p>
                </div>
              </div>
            </div>

            {loadingDoctors && availableDoctors.length === 0 ? (
              <div className="text-center py-12 text-gray-600">
                Loading doctors...
              </div>
            ) : filteredDoctors.length === 0 ? (
              <div className="text-center py-12 text-gray-600">
                No doctors found. Try a different search.
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredDoctors.map((doctor) => (
                  <div
                    key={doctor.email}
                    className="bg-white rounded-2xl shadow-sm p-8 border border-gray-100 hover:border-blue-300 transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <Stethoscope className="w-8 h-8 text-white" />
                      </div>

                      <div className="flex-1">
                        <h3 className="text-gray-900 mb-1">{doctor.name}</h3>
                        <p className="text-blue-600 font-medium mb-4">
                          {doctor.specialization}
                        </p>

                        <div className="space-y-2 mb-4">
                          <div className="flex items-center gap-2 text-gray-600 text-sm">
                            <Award className="w-4 h-4" />
                            {doctor.education}
                          </div>
                          <div className="flex items-center gap-2 text-gray-600 text-sm">
                            <Calendar className="w-4 h-4" />
                            {doctor.experience} experience
                          </div>
                        </div>

                        <div className="flex items-center gap-4 mb-4 text-sm">
                          <div className="flex items-center gap-1 text-gray-600">
                            <Users className="w-4 h-4" />
                            {doctor.patientsCount} patients
                          </div>
                          <div className="flex items-center gap-1 text-yellow-600">
                            <Star className="w-4 h-4 fill-current" />
                            {doctor.rating}/5.0
                          </div>
                        </div>

                        <button
                          onClick={() => handleRequestDoctor(doctor.id)}
                          className="w-full bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors"
                        >
                          Request Connection
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Request Dialog */}
      {showRequestDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8">
            <h3 className="text-gray-900 mb-4">Send Connection Request</h3>
            <p className="text-gray-600 mb-6">
              Send a message to the doctor explaining why you&apos;d like them
              to review your lab reports.
            </p>

            <textarea
              value={requestMessage}
              onChange={(e) => setRequestMessage(e.target.value)}
              placeholder="Hi Doctor, I would like you to review my lab reports and provide medical insights..."
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
              rows={4}
            />

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowRequestDialog(false);
                  setRequestMessage("");
                  setSelectedDoctorId(null);
                }}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSendRequest}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
              >
                Send Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Report Dialog */}
      {showShareReportDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8">
            <h3 className="text-gray-900 mb-4">Share Report Insights</h3>
            <p className="text-gray-600 mb-6">
              Select a report to share with your doctor for professional review.
            </p>

            <div className="space-y-2 mb-6 max-h-64 overflow-y-auto">
              {availableReports.map((report: any) => (
                <button
                  key={report.id}
                  onClick={() => setSelectedReportId(report.id)}
                  className={`w-full text-left px-4 py-3 border rounded-xl transition-colors ${selectedReportId === report.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-300 hover:border-blue-300"
                    }`}
                >
                  <p className="font-medium text-gray-900">{report.name}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(report.date).toLocaleDateString()}
                  </p>
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowShareReportDialog(false);
                  setSelectedReportId(null);
                }}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
  onClick={requestDoctorReview}
  className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl"
>
  <Send className="w-5 h-5" />
  Request Review
</button>


            </div>
          </div>
        </div>
      )}

      {/* Rating Dialog */}
      {showRatingDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8">
            <h3 className="text-gray-900 mb-4">Rate Your Doctor</h3>
            <p className="text-gray-600 mb-6">
              Share your experience with {assignedDoctor?.name}
            </p>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Rating
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    onClick={() => setRatingValue(value)}
                    className="p-2 hover:scale-110 transition-transform"
                  >
                    <Star
                      className={`w-8 h-8 ${value <= ratingValue
                          ? "fill-yellow-500 text-yellow-500"
                          : "text-gray-300"
                        }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Review (Optional)
              </label>
              <textarea
                value={ratingReview}
                onChange={(e) => setRatingReview(e.target.value)}
                placeholder="Share your thoughts about your doctor's service..."
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                rows={3}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowRatingDialog(false);
                  setRatingValue(5);
                  setRatingReview("");
                }}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={submitRating}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
              >
                Submit Rating
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
