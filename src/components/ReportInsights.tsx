import Navbar from "./Navbar";
import { useParams, Link } from "react-router-dom";
import { API_BASE } from "./config";
import {
  ArrowLeft,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  Download,
  Share2,
  Calendar,
  FileText,
  Stethoscope,
} from "lucide-react";
import { useEffect, useState } from "react";
import { getAuthItem } from "./utils/authStorage";

interface TestResult {
  name: string;
  value: string;
  unit: string;
  normalRange: string;
  status: "low" | "normal" | "high";
  interpretation: string;
}

export default function ReportInsights() {
  const { id } = useParams();
  const [report, setReport] = useState<any>(null);
  const [aiSummary, setAiSummary] = useState<any>(null);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [doctorComment, setDoctorComment] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Download handler
  const handleDownload = async () => {
    if (!id || !report) return;
    
    try {
      const token = getAuthItem("authToken");
      const response = await fetch(`${API_BASE}/download-report/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) {
        throw new Error('Download failed');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = report.file_name || 'report.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download error:', err);
      alert('Could not download report');
    }
  };

  useEffect(() => {
    const token = getAuthItem("authToken");
    fetch(`${API_BASE}/report/${id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then((res) => res.json())
      .then((data) => {
        setReport(data);
        setAiSummary(data.ai_summary);
        setTestResults(data.testResults || []);
        setDoctorComment(data.doctor_comment || null);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center text-xl font-semibold">
        Loading report...
      </div>
    );

  if (!report)
    return (
      <div className="min-h-screen flex items-center justify-center text-xl">
        Report not found.
      </div>
    );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "high":
        return "bg-red-100 text-red-700 border-red-300";
      case "low":
        return "bg-yellow-100 text-yellow-700 border-yellow-300";
      case "normal":
        return "bg-green-100 text-green-700 border-green-300";
      default:
        return "bg-gray-100 text-gray-700 border-gray-300";
    }
  };

  const getStatusIcon = (status: string) => {
    if (status === "normal") return <CheckCircle className="w-5 h-5" />;
    return <AlertCircle className="w-5 h-5" />;
  };

  const abnormalCount = testResults.filter((t) => t.status !== "normal").length;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-20">
        <Link
          to="/view-reports"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8 font-medium transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Reports
        </Link>

        {/* Report Header */}
        <div className="bg-white rounded-2xl shadow-sm p-12 border border-gray-100 mb-12">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 mb-8">
            <div>
              <h1 className="text-gray-900 mb-4">{report.file_name}</h1>

              <div className="flex flex-wrap items-center gap-6 text-gray-600">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  <span>
                    {new Date(report.uploaded_at).toLocaleDateString("en-US")}
                  </span>
                </div>

                <span className="text-gray-300">•</span>
                <span>Medical Report</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button className="flex items-center gap-2 px-6 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors font-medium">
                <Share2 className="w-5 h-5" />
                Share
              </button>

              <button 
                onClick={handleDownload}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
              >
                <Download className="w-5 h-5" />
                Download PDF
              </button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
              <div className="text-sm text-gray-600 mb-2">Total Tests</div>
              <div className="text-3xl font-bold text-gray-900">
                {testResults.length}
              </div>
            </div>

            <div className="bg-green-50 rounded-xl p-6 border border-green-200">
              <div className="text-sm text-green-700 mb-2">Normal Results</div>
              <div className="text-3xl font-bold text-green-900">
                {testResults.length - abnormalCount}
              </div>
            </div>

            <div className="bg-red-50 rounded-xl p-6 border border-red-200">
              <div className="text-sm text-red-700 mb-2">Abnormal Results</div>
              <div className="text-3xl font-bold text-red-900">
                {abnormalCount}
              </div>
            </div>
          </div>
        </div>

        {/* AI Summary */}
        <div
          className={`rounded-2xl shadow-sm p-12 border-2 mb-12 ${
            aiSummary?.severity === "low"
              ? "bg-blue-50 border-blue-300"
              : aiSummary?.severity === "medium"
              ? "bg-yellow-50 border-yellow-300"
              : "bg-red-50 border-red-300"
          }`}
        >
          <div className="flex items-start gap-4 mb-8">
            <div
              className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                aiSummary?.severity === "low"
                  ? "bg-blue-200"
                  : aiSummary?.severity === "medium"
                  ? "bg-yellow-200"
                  : "bg-red-200"
              }`}
            >
              <FileText className="w-7 h-7 text-gray-900" />
            </div>

            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                AI-Powered Analysis
              </h2>
              <p className="text-lg text-gray-700">{aiSummary?.overall}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                🔍 Key Findings
              </h3>
              <ul className="space-y-3">
                {(aiSummary?.keyFindings || []).map((f: string, i:number) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="w-2 h-2 bg-blue-600 rounded-full mt-2"></span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                💡 Recommendations
              </h3>
              <ul className="space-y-3">
                {(aiSummary?.recommendations || []).map((r: string, i:number) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="w-2 h-2 bg-green-600 rounded-full mt-2"></span>
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <p className="mt-8 pt-8 border-t border-gray-300 text-sm text-gray-600 italic">
            ⚠️ This AI-generated analysis is for informational purposes only.
          </p>
        </div>

        {/* Doctor's Comment Section */}
        {doctorComment && (
          <div className="bg-white rounded-2xl shadow-sm p-12 border-2 border-teal-200 mb-12">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-14 h-14 bg-teal-100 rounded-xl flex items-center justify-center">
                <Stethoscope className="w-7 h-7 text-teal-600" />
              </div>

              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Doctor's Notes
                </h2>
                <p className="text-sm text-gray-500">
                  Your assigned doctor has reviewed this report
                </p>
              </div>
            </div>

            <div className="bg-teal-50 rounded-xl p-6 border border-teal-200">
              <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                {doctorComment}
              </p>
            </div>

            <p className="mt-6 text-sm text-gray-500 italic">
              💬 If you have questions about these notes, please contact your doctor directly.
            </p>
          </div>
        )}

        {/* Detailed Test Results */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-10 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">
              Detailed Test Results
            </h2>
          </div>

          <div className="divide-y divide-gray-200">
            {testResults.length === 0 && (
              <p className="p-10 text-gray-600">No test results found.</p>
            )}

            {testResults.map((test, index) => (
              <div key={index} className="p-10 hover:bg-gray-50 transition-colors">
                <div className="flex flex-col lg:flex-row justify-between gap-8">
                  <div className="flex-1">
                    <div className="flex items-start gap-4 mb-6">
                      <div
                        className={`p-3 rounded-xl border-2 ${getStatusColor(
                          test.status
                        )}`}
                      >
                        {getStatusIcon(test.status)}
                      </div>

                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                          {test.name}
                        </h3>

                        <div
                          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 font-semibold ${getStatusColor(
                            test.status
                          )}`}
                        >
                          <span className="capitalize">{test.status}</span>
                        </div>
                      </div>
                    </div>

                    <p className="text-gray-700">{test.interpretation}</p>
                  </div>

                  <div className="lg:w-80 bg-gray-50 rounded-xl p-6 border border-gray-200">
                    <div className="mb-6">
                      <div className="text-sm text-gray-600 mb-2">
                        Your Result
                      </div>
                      <div className="text-3xl font-bold text-gray-900">
                        {test.value}{" "}
                        <span className="text-lg text-gray-600">
                          {test.unit}
                        </span>
                      </div>
                    </div>

                    <div>
                      <div className="text-sm text-gray-600 mb-2">
                        Normal Range
                      </div>
                      <div className="text-lg font-semibold text-gray-700">
                        {test.normalRange} {test.unit}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Trends CTA */}
        <div className="mt-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-lg p-10 text-white">
          <div className="flex flex-col md:flex-row justify-between">
            <div>
              <h3 className="text-2xl font-bold mb-2">
                Track Your Health Trends
              </h3>
              <p className="text-blue-100">
                See how your values change over time.
              </p>
            </div>

            <Link
              to="/trends"
              className="flex items-center gap-2 bg-white text-blue-600 px-8 py-4 rounded-xl font-medium hover:bg-blue-50 transition"
            >
              <TrendingUp className="w-5 h-5" />
              View Trends
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
