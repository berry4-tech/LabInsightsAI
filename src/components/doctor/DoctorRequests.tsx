import DoctorNavbar from "./DoctorNavbar";
import {
  UserPlus,
  Mail,
  Phone,
  Calendar,
  FileText,
  Check,
  X,
  Clock,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { API_BASE } from "../config";
import { getAuthItem } from "../utils/authStorage";

interface ConnectionRequest {
  id: string;
  patientId: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  message: string;
  requestDate: string;
  status: "pending" | "accepted" | "rejected";
  reportsCount: number;
  doctorId: string;
  rejectionMessage?: string;
}

interface DoctorRequestsProps {
  onLogout: () => void;
}

export default function DoctorRequests({ onLogout }: DoctorRequestsProps) {
  const doctorEmail = getAuthItem("doctorEmail");

  const [requests, setRequests] = useState<ConnectionRequest[]>([]);
  const [filter, setFilter] = useState<"all" | "pending" | "accepted" | "rejected">("pending");
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Load requests from server
  const loadRequests = async () => {
    if (!doctorEmail) return;

    try {
      setLoading(true);
      const token = getAuthItem("authToken");
      const res = await fetch(`${API_BASE}/doctor/requests/${doctorEmail}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();

      if (Array.isArray(data.requests)) {
        setRequests(data.requests);
      } else {
        console.error("Unexpected API format:", data);
        setRequests([]);
      }
    } catch (err) {
      console.error("Error loading requests:", err);
      toast.error("Failed to load connection requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  // Accept request
  const handleAcceptRequest = async (requestId: string) => {
    try {
      setProcessingId(requestId);
      const token = getAuthItem("authToken");
      const res = await fetch(`${API_BASE}/doctor/request/update/${requestId}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ status: "accepted" }),
      });

      if (!res.ok) throw new Error("Failed to accept request");

      toast.success("Request accepted");
      await loadRequests();
    } catch (err) {
      console.error("Error accepting request:", err);
      toast.error("Error accepting request");
    } finally {
      setProcessingId(null);
    }
  };

  // Reject request
  const handleRejectRequest = async (requestId: string) => {
    try {
      setProcessingId(requestId);
      const token = getAuthItem("authToken");
      const res = await fetch(`${API_BASE}/doctor/request/update/${requestId}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ status: "rejected" }),
      });

      if (!res.ok) throw new Error("Failed to reject request");

      toast.error("Request rejected");
      await loadRequests();
    } catch (err) {
      console.error("Error rejecting request:", err);
      toast.error("Error rejecting request");
    } finally {
      setProcessingId(null);
    }
  };

  // Filter logic
  const filteredRequests = requests.filter((req) =>
    filter === "all" ? true : req.status === filter
  );

  const pendingCount = requests.filter((r) => r.status === "pending").length;
  const acceptedCount = requests.filter((r) => r.status === "accepted").length;
  const rejectedCount = requests.filter((r) => r.status === "rejected").length;

  // Status badge UI
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-lg text-sm border border-yellow-300">
            <Clock className="w-4 h-4" />
            Pending
          </span>
        );
      case "accepted":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-lg text-sm border border-green-300">
            <Check className="w-4 h-4" />
            Accepted
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-lg text-sm border border-red-300">
            <X className="w-4 h-4" />
            Rejected
          </span>
        );
      default:
        return null;
    }
  };

  const getTabCount = (tab: string): number => {
    switch (tab) {
      case "pending": return pendingCount;
      case "accepted": return acceptedCount;
      case "rejected": return rejectedCount;
      default: return requests.length;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <DoctorNavbar onLogout={onLogout} />

      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-24">
        <h1 className="text-gray-900 mb-4 text-2xl font-bold">
          Patient Connection Requests
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          Review and manage connection requests from your patients
        </p>

        {/* STATS CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="rounded-2xl p-6 shadow-sm text-yellow-700 bg-yellow-100 border border-yellow-300">
            <Clock className="w-8 h-8 mb-3 opacity-90" />
            <p className="text-sm font-medium">Pending Requests</p>
            <p className="text-3xl font-bold">{pendingCount}</p>
          </div>

          <div className="rounded-2xl p-6 shadow-sm text-green-700 bg-green-100 border border-green-300">
            <Check className="w-8 h-8 mb-3 opacity-90" />
            <p className="text-sm font-medium">Accepted</p>
            <p className="text-3xl font-bold">{acceptedCount}</p>
          </div>

          <div className="rounded-2xl p-6 shadow-sm text-red-700 bg-red-100 border border-red-300">
            <X className="w-8 h-8 mb-3 opacity-90" />
            <p className="text-sm font-medium">Rejected</p>
            <p className="text-3xl font-bold">{rejectedCount}</p>
          </div>
        </div>

        {/* FILTER TABS */}
        <div className="flex gap-6 border-b mb-8">
          {(["pending", "accepted", "rejected", "all"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`pb-3 border-b-2 font-medium transition-colors ${
                filter === tab
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)} ({getTabCount(tab)})
            </button>
          ))}
        </div>

        {/* LIST OF REQUESTS */}
        {loading ? (
          <div className="bg-white border rounded-2xl py-20 text-center">
            <p className="text-gray-600">Loading requests...</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="bg-white border rounded-2xl py-20 text-center">
            <UserPlus className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">No requests found</p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredRequests.map((req) => (
              <div
                key={req.id}
                className="bg-white border rounded-2xl shadow-sm p-8"
              >
                <div className="flex flex-col lg:flex-row gap-6 items-start justify-between">
                  <div className="flex gap-4 flex-1">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-2xl font-bold">
                        {req.patientName.charAt(0).toUpperCase()}
                      </span>
                    </div>

                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        {req.patientName}
                      </h3>

                      <div className="text-gray-600 space-y-1 text-sm">
                        <p className="flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          {req.patientEmail}
                        </p>

                        <p className="flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          {req.patientPhone || "N/A"}
                        </p>

                        <p className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          Requested on{" "}
                          {new Date(req.requestDate).toLocaleDateString()}
                        </p>

                        <p className="flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          {req.reportsCount} reports uploaded
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 items-end">
                    {getStatusBadge(req.status)}

                    {req.status === "pending" && (
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => handleAcceptRequest(req.id)}
                          disabled={processingId === req.id}
                          className="flex items-center gap-2 bg-green-600 text-white px-6 py-2.5 rounded-xl hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Check className="w-4 h-4" />
                          Accept
                        </button>

                        <button
                          onClick={() => handleRejectRequest(req.id)}
                          disabled={processingId === req.id}
                          className="flex items-center gap-2 bg-red-600 text-white px-6 py-2.5 rounded-xl hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <X className="w-4 h-4" />
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* MESSAGE */}
                {req.message && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <p className="font-semibold text-gray-900 mb-3">
                      Patient's Message:
                    </p>
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                      <p className="text-gray-700">{req.message}</p>
                    </div>
                  </div>
                )}

                {req.rejectionMessage && (
                  <p className="text-red-600 mt-4 font-medium">
                    {req.rejectionMessage}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
