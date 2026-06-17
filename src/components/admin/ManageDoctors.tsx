// ManageDoctors.tsx - Admin panel for doctor management

import AdminNavbar from "./AdminNavbar";
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Users,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  Copy,
} from "lucide-react";
import React, { useState, useEffect } from "react";
import { API_BASE } from "../config";
import { addDoctorSchema, validateField, validateForm, hasErrors, formatPhoneNumber } from '../utils/validation';
import { toast } from 'sonner';
import { getAuthItem } from '../utils/authStorage';

interface ManageDoctorsProps {
  onLogout?: () => void;
}

interface Doctor {
  id?: string;
  name: string;
  doctorEmail: string;
  specialization: string;
  phone: string;
  licenseNumber: string;
  patientsCount: number;
  reportsReviewed: number;
  status: "active" | "inactive";
}

interface FormData {
  name: string;
  email: string;
  specialization: string;
  phone: string;
  licenseNumber: string;
  password: string;
  confirmPassword: string;
  [key: string]: string; // Index signature for validation
}

interface NewDoctorCredentials {
  email: string;
  password: string;
}

export default function ManageDoctors({ onLogout }: ManageDoctorsProps) {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);

  const [newDoctorCredentials, setNewDoctorCredentials] =
    useState<NewDoctorCredentials | null>(null);

  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    specialization: "",
    phone: "",
    licenseNumber: "",
    password: "",
    confirmPassword: "",
  });

  // Validation state
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Handle field change
  const handleFieldChange = (field: string, value: string) => {
    const newFormData = { ...formData, [field]: value };
    setFormData(newFormData as FormData);
    
    // Real-time validation for password fields
    if (touched[field]) {
      const error = validateField(
        value,
        addDoctorSchema[field as keyof typeof addDoctorSchema] || [],
        newFormData
      );
      setErrors({ ...errors, [field]: error });
    }
  };

  // Handle field blur
  const handleBlur = (field: string) => {
    setTouched({ ...touched, [field]: true });
    const error = validateField(
      formData[field] || '',
      addDoctorSchema[field as keyof typeof addDoctorSchema] || [],
      formData
    );
    setErrors({ ...errors, [field]: error });
  };

  // Reset form and validation state
  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      specialization: "",
      phone: "",
      licenseNumber: "",
      password: "",
      confirmPassword: "",
    });
    setErrors({});
    setTouched({});
  };

  const [doctors, setDoctors] = useState<Doctor[]>([]);

  // Fetch doctors from backend
  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const token = getAuthItem("authToken");
      const res = await fetch(`${API_BASE}/admin/get-doctors`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      console.log("Doctors:", data);
      setDoctors(data);
    } catch (err) {
      console.error("Fetch doctors error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  // Add doctor
  const handleAddDoctor = async (): Promise<void> => {
    // Validate all fields
    const validationErrors = validateForm(formData, addDoctorSchema);
    setErrors(validationErrors);
    setTouched({
      name: true,
      email: true,
      specialization: true,
      phone: true,
      licenseNumber: true,
      password: true,
      confirmPassword: true,
    });

    if (hasErrors(validationErrors)) {
      return;
    }

    try {
      setSaving(true);
      const token = getAuthItem("authToken");
      const response = await fetch(`${API_BASE}/admin/create-doctor`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          specialization: formData.specialization,
          phone: formData.phone,
          licenseNumber: formData.licenseNumber,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Error creating doctor");
        return;
      }

      setNewDoctorCredentials({
        email: formData.email,
        password: formData.password,
      });

      setShowSuccessModal(true);
      setShowAddModal(false);

      // Reset form and validation state
      resetForm();

      toast.success("Doctor added successfully!");
      await fetchDoctors();
    } catch (error) {
      toast.error("Server error - backend not reachable");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  // Filter doctors
  const filteredDoctors = doctors.filter((doctor) => {
    const q = searchQuery.toLowerCase();
    return (
      doctor.name.toLowerCase().includes(q) ||
      doctor.doctorEmail.toLowerCase().includes(q) ||
      doctor.specialization.toLowerCase().includes(q)
    );
  });

  // Edit doctor
  const handleEditDoctorSave = async () => {
    if (!selectedDoctor) return;

    try {
      setSaving(true);
      const token = getAuthItem("authToken");
      const res = await fetch(
        `${API_BASE}/admin/update-doctor/${selectedDoctor.doctorEmail}`,
        {
          method: "PUT",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({
            name: formData.name,
            specialization: formData.specialization,
            phone: formData.phone,
            licenseNumber: formData.licenseNumber,
            status: selectedDoctor.status,
          }),
        }
      );

      if (!res.ok) {
        toast.error("Update failed");
        return;
      }

      toast.success("Doctor updated successfully!");
      await fetchDoctors();
      setShowEditModal(false);
      setSelectedDoctor(null);
    } catch (err) {
      console.error("Edit doctor error:", err);
    } finally {
      setSaving(false);
    }
  };

  const openEditModal = (doctor: Doctor): void => {
    setSelectedDoctor(doctor);
    setFormData({
      name: doctor.name,
      email: doctor.doctorEmail,
      specialization: doctor.specialization,
      phone: doctor.phone,
      licenseNumber: doctor.licenseNumber,
      password: "",
      confirmPassword: "",
    });
    setShowEditModal(true);
  };

  // Delete doctor
  const handleDeleteDoctor = async (email: string) => {
    if (!window.confirm("Are you sure you want to remove this doctor?")) return;

    try {
      const token = getAuthItem("authToken");
      const res = await fetch(`${API_BASE}/admin/delete-doctor/${email}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (!res.ok) {
        toast.error("Delete failed");
        return;
      }

      setDoctors((prev) => prev.filter((d) => d.doctorEmail !== email));
      toast.success("Doctor removed successfully!");
    } catch (err) {
      console.error("Delete error:", err);
      toast.error("Error deleting doctor");
    }
  };

  const getStatusColor = (status: Doctor["status"]): string => {
    return status === "active"
      ? "bg-green-100 text-green-700 border-green-200"
      : "bg-gray-100 text-gray-700 border-gray-200";
  };

  const getStatusIcon = (status: Doctor["status"]): JSX.Element =>
    status === "active" ? (
      <CheckCircle className="w-4 h-4" />
    ) : (
      <XCircle className="w-4 h-4" />
    );

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavbar onLogout={onLogout} />

      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-24">
        {/* HEADER */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Manage Doctors
            </h1>
            <p className="text-lg text-gray-600">
              Add, edit, and manage doctor accounts
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl shadow-lg hover:from-blue-700 hover:to-purple-700 transition-all"
          >
            <Plus className="w-5 h-5" />
            Add Doctor
          </button>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-sm p-6 border">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div className="text-3xl font-bold">{doctors.length}</div>
            <p className="text-sm text-gray-600">Total Doctors</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6 border">
            <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center mb-4">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="text-3xl font-bold">
              {doctors.filter((d) => d.status === "active").length}
            </div>
            <p className="text-sm text-gray-600">Active Doctors</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6 border">
            <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <div className="text-3xl font-bold">
              {doctors.reduce((sum, d) => sum + (d.patientsCount || 0), 0)}
            </div>
            <p className="text-sm text-gray-600">Total Patients</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6 border">
            <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center mb-4">
              <CheckCircle className="w-6 h-6 text-orange-600" />
            </div>
            <div className="text-3xl font-bold">
              {doctors.reduce((sum, d) => sum + (d.reportsReviewed || 0), 0)}
            </div>
            <p className="text-sm text-gray-600">Reports Reviewed</p>
          </div>
        </div>

        {/* SEARCH BAR */}
        <div className="bg-white rounded-2xl shadow-sm p-6 border mb-8">
          <div className="relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search doctors by name, email, or specialization..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
        </div>

        {/* TABLE */}
        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
          {loading ? (
            <div className="text-center py-20">
              <p className="text-gray-600">Loading doctors...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Doctor</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Specialization</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Contact</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Patients</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y">
                  {filteredDoctors.map((doctor) => (
                    <tr key={doctor.doctorEmail} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white flex items-center justify-center font-semibold">
                            {doctor.name[0]}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{doctor.name}</p>
                            <p className="text-sm text-gray-500">{doctor.licenseNumber}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-gray-700">{doctor.specialization}</td>

                      <td className="px-6 py-4">
                        <p className="text-gray-900">{doctor.doctorEmail}</p>
                        <p className="text-sm text-gray-500">{doctor.phone}</p>
                      </td>

                      <td className="px-6 py-4 text-center">
                        <p className="text-xl font-bold text-gray-900">{doctor.patientsCount || 0}</p>
                        <p className="text-xs text-gray-500">{doctor.reportsReviewed || 0} reviews</p>
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm ${getStatusColor(doctor.status)}`}
                        >
                          {getStatusIcon(doctor.status)}
                          {doctor.status.charAt(0).toUpperCase() + doctor.status.slice(1)}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => openEditModal(doctor)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-5 h-5" />
                          </button>

                          <button
                            onClick={() => handleDeleteDoctor(doctor.doctorEmail)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!loading && filteredDoctors.length === 0 && (
            <div className="text-center py-20">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900">No doctors found</h3>
              <p className="text-gray-600">Try adjusting your search.</p>
            </div>
          )}
        </div>
      </div>

      {/* ADD DOCTOR MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-8 shadow-xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-semibold mb-6">Add New Doctor</h2>

            <div className="space-y-4 mb-6">
              {/* Full Name */}
              <div>
                <label className="block text-sm font-medium mb-2">Full Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleFieldChange('name', e.target.value)}
                  onBlur={() => handleBlur('name')}
                  placeholder="Dr. John Doe"
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${
                    touched.name && errors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {touched.name && errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                )}
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-sm font-medium mb-2">Email Address</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleFieldChange('email', e.target.value)}
                  onBlur={() => handleBlur('email')}
                  placeholder="doctor@example.com"
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${
                    touched.email && errors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {touched.email && errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
              </div>

              {/* Specialization */}
              <div>
                <label className="block text-sm font-medium mb-2">Specialization</label>
                <select
                  value={formData.specialization}
                  onChange={(e) => handleFieldChange('specialization', e.target.value)}
                  onBlur={() => handleBlur('specialization')}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${
                    touched.specialization && errors.specialization ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select specialization</option>
                  <option value="General Medicine">General Medicine</option>
                  <option value="Cardiology">Cardiology</option>
                  <option value="Endocrinology">Endocrinology</option>
                  <option value="Nephrology">Nephrology</option>
                  <option value="Gastroenterology">Gastroenterology</option>
                  <option value="Hematology">Hematology</option>
                  <option value="Internal Medicine">Internal Medicine</option>
                </select>
                {touched.specialization && errors.specialization && (
                  <p className="mt-1 text-sm text-red-600">{errors.specialization}</p>
                )}
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-sm font-medium mb-2">Phone Number</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleFieldChange('phone', formatPhoneNumber(e.target.value))}
                  onBlur={() => handleBlur('phone')}
                  placeholder="(123) 456-7890"
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${
                    touched.phone && errors.phone ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {touched.phone && errors.phone && (
                  <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
                )}
              </div>

              {/* License Number */}
              <div>
                <label className="block text-sm font-medium mb-2">Medical License Number</label>
                <input
                  type="text"
                  value={formData.licenseNumber}
                  onChange={(e) => handleFieldChange('licenseNumber', e.target.value)}
                  onBlur={() => handleBlur('licenseNumber')}
                  placeholder="MD-12345"
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${
                    touched.licenseNumber && errors.licenseNumber ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {touched.licenseNumber && errors.licenseNumber && (
                  <p className="mt-1 text-sm text-red-600">{errors.licenseNumber}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium mb-2">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => handleFieldChange('password', e.target.value)}
                    onBlur={() => handleBlur('password')}
                    placeholder="Enter password"
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${
                      touched.password && errors.password ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5 text-gray-500" /> : <Eye className="w-5 h-5 text-gray-500" />}
                  </button>
                </div>
                {touched.password && errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                )}
                {!touched.password && (
                  <p className="mt-1 text-xs text-gray-500">
                    Must be 8+ characters with uppercase, lowercase, and number
                  </p>
                )}
                {touched.password && !errors.password && formData.password.length >= 8 && (
                  <p className="mt-1 text-sm text-green-600">✓ Password meets requirements</p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium mb-2">Confirm Password</label>
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={(e) => handleFieldChange('confirmPassword', e.target.value)}
                  onBlur={() => handleBlur('confirmPassword')}
                  placeholder="Confirm password"
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${
                    touched.confirmPassword && errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {touched.confirmPassword && errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                )}
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleAddDoctor}
                disabled={saving}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl shadow-lg disabled:opacity-50"
              >
                {saving ? "Adding..." : "Add Doctor"}
              </button>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
                className="flex-1 bg-gray-100 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT DOCTOR MODAL */}
      {showEditModal && selectedDoctor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-8 shadow-xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-semibold mb-6">Edit Doctor Details</h2>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium mb-2">Full Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Specialization</label>
                <input
                  type="text"
                  value={formData.specialization}
                  onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                  className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Phone Number</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: formatPhoneNumber(e.target.value) })}
                  placeholder="(123) 456-7890"
                  className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Medical License Number</label>
                <input
                  type="text"
                  value={formData.licenseNumber}
                  onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                  className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Status</label>
                <select
                  value={selectedDoctor.status}
                  onChange={(e) =>
                    setSelectedDoctor({
                      ...selectedDoctor,
                      status: e.target.value as "active" | "inactive",
                    })
                  }
                  className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleEditDoctorSave}
                disabled={saving}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl shadow-lg disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedDoctor(null);
                }}
                className="flex-1 bg-gray-100 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUCCESS MODAL */}
      {showSuccessModal && newDoctorCredentials && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
          <div className="bg-white rounded-2xl p-8 max-w-lg w-full shadow-xl">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-semibold mb-6 text-center">Doctor Added Successfully</h2>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <div className="relative">
                  <input
                    readOnly
                    value={newDoctorCredentials.email}
                    className="w-full px-4 py-3 border rounded-xl bg-gray-50"
                  />
                  <button
                    onClick={() => navigator.clipboard.writeText(newDoctorCredentials.email)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 hover:text-blue-600"
                  >
                    <Copy className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Password</label>
                <div className="relative">
                  <input
                    readOnly
                    type={showPassword ? "text" : "password"}
                    value={newDoctorCredentials.password}
                    className="w-full px-4 py-3 border rounded-xl bg-gray-50"
                  />
                  <button
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5 text-gray-500" /> : <Eye className="w-5 h-5 text-gray-500" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => {
                  setShowSuccessModal(false);
                  setNewDoctorCredentials(null);
                }}
                className="flex-1 bg-gray-100 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(
                    `Email: ${newDoctorCredentials.email}\nPassword: ${newDoctorCredentials.password}`
                  );
                  setShowSuccessModal(false);
                  setNewDoctorCredentials(null);
                }}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl"
              >
                Copy & Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
