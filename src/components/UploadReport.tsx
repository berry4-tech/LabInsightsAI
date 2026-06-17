import Navbar from './Navbar';
import { Upload, FileText, AlertCircle, CheckCircle2, Loader2, X } from 'lucide-react';
import { API_BASE } from './config';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuthItem } from './utils/authStorage';

interface UploadReportProps {
  onSignOut?: () => void;
  onReportUpload?: () => void;
  hasUploadedReports?: boolean;
}

export default function UploadReport({ onSignOut, onReportUpload, hasUploadedReports }: UploadReportProps) {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadComplete, setUploadComplete] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || isUploading) return; // Prevent double-clicks

    setIsUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("email", getAuthItem("userEmail") || "");

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 500);

      const token = getAuthItem("authToken");
      const res = await fetch(`${API_BASE}/upload-report`, {
        method: "POST",
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      });

      clearInterval(progressInterval);

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Upload failed");
      }

      const data = await res.json();
      setUploadProgress(100);
      setUploadComplete(true);

      if (data.report_id) {
        onReportUpload && onReportUpload();
        // Small delay to show completion before navigating
        setTimeout(() => {
          navigate(`/report-insights/${data.report_id}`);
        }, 1000);
      } else {
        throw new Error("No report ID received");
      }
    } catch (err: any) {
      console.error("Upload error:", err);
      setError(err.message || "Failed to upload report. Please try again.");
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
    }
  };



  const removeFile = () => {
    setSelectedFile(null);
    setUploadProgress(0);
    setUploadComplete(false);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar onSignOut={onSignOut} hasUploadedReports={hasUploadedReports} />
      
      <div className="max-w-5xl mx-auto px-6 sm:px-8 lg:px-12 py-20">
        {/* Header */}
        <div className="text-center mb-20">
          <h1 className="text-gray-900 mb-4">Upload Lab Report</h1>
          <p className="text-lg text-gray-600">Upload your medical lab report to get instant AI-powered insights</p>
        </div>

        {/* Upload Area */}
        <div className="bg-white rounded-2xl shadow-sm p-12 border border-gray-100 mb-12">
          {!selectedFile ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-3 border-dashed rounded-2xl p-16 text-center transition-all ${
                isDragging
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-8">
                <Upload className="w-10 h-10 text-blue-600" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                Drag & Drop Your Lab Report
              </h3>
              <p className="text-gray-600 mb-8">or</p>
              <label className="inline-flex items-center gap-2 bg-blue-600 text-white px-10 py-4 rounded-xl font-medium hover:bg-blue-700 transition-colors cursor-pointer shadow-sm">
                <FileText className="w-5 h-5" />
                Browse Files
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileSelect}
                />
              </label>
              <p className="text-sm text-gray-500 mt-6">
                Supported formats: PDF, JPG, PNG (Max size: 10MB)
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Selected File */}
              <div className="bg-gray-50 rounded-xl p-8 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center">
                      <FileText className="w-7 h-7 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{selectedFile.name}</p>
                      <p className="text-sm text-gray-600">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  {!isUploading && !uploadComplete && (
                    <button
                      onClick={removeFile}
                      className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  )}
                </div>

                {/* Upload Progress */}
                {isUploading && (
                  <div className="mt-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Uploading...</span>
                      <span className="text-sm font-semibold text-blue-600">{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Upload Complete */}
                {uploadComplete && (
                  <div className="mt-6 flex items-center gap-2 text-green-600">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="font-medium">Upload successful! Redirecting to insights...</span>
                  </div>
                )}

                {error && (
                  <div className="mt-6 flex items-center gap-2 text-red-600 bg-red-50 p-4 rounded-lg">
                    <AlertCircle className="w-5 h-5" />
                    <span className="font-medium">{error}</span>
                  </div>
                )}
              </div>

              {/* Upload Button */}
              {!isUploading && !uploadComplete && (
                <button
                  onClick={handleUpload}
                  className="w-full bg-blue-600 text-white py-4 rounded-xl font-medium hover:bg-blue-700 transition-colors shadow-sm text-lg"
                >
                  Upload and Analyze Report
                </button>
              )}

              {isUploading && (
                <button
                  disabled
                  className="w-full bg-gray-400 text-white py-4 rounded-xl font-medium cursor-not-allowed text-lg flex items-center justify-center gap-3"
                >
                  <Loader2 className="w-6 h-6 animate-spin" />
                  Processing...
                </button>
              )}
            </div>
          )}
        </div>

        {/* Information Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white rounded-2xl shadow-sm p-8 border border-gray-100">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
              <Upload className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Quick Upload</h3>
            <p className="text-gray-600">Upload your report in seconds. We support PDF and image formats.</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-8 border border-gray-100">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-6">
              <FileText className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">AI Analysis</h3>
            <p className="text-gray-600">Get instant, detailed insights powered by advanced AI technology.</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-8 border border-gray-100">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-6">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Secure & Private</h3>
            <p className="text-gray-600">Your health data is encrypted and kept completely confidential.</p>
          </div>
        </div>

        {/* Tips Section */}
        <div className="mt-12 bg-blue-50 rounded-2xl shadow-sm p-10 border border-blue-100">
          <div className="flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Tips for Best Results</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span>Ensure the report is clear and readable</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span>Include all pages of your lab report</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span>Make sure test names and values are visible</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span>Upload recent reports for accurate trend analysis</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}