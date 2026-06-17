import DoctorNavbar from "./DoctorNavbar";
import {
  Mail,
  Phone,
  Award,
  GraduationCap,
  Calendar,
  Edit2,
  Save,
  X,
  CheckCircle,
} from "lucide-react";
import { useState, useEffect } from "react";
import { API_BASE } from "../config";
import { editDoctorSchema, validateField, validateForm, hasErrors, formatPhoneNumber } from '../utils/validation';
import { toast } from 'sonner';
import { getAuthItem } from '../utils/authStorage';

interface DoctorProfileProps {
  onLogout?: () => void;
}

interface ProfileData {
  name: string;
  specialization: string;
  degree: string;
  bio: string;
  phone: string;
  experience: string;
  licenseNumber: string;
  certifications: string[];
  doctorEmail?: string;
}

export default function DoctorProfile({ onLogout }: DoctorProfileProps) {
  const email = getAuthItem("doctorEmail");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [editData, setEditData] = useState<ProfileData | null>(null);

  // Validation state
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Handle field change with validation
  const handleFieldChange = (field: string, value: string) => {
    if (!editData) return;
    const newEditData = { ...editData, [field]: value };
    setEditData(newEditData as ProfileData);
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors({ ...errors, [field]: null });
    }
  };

  // Handle field blur for validation
  const handleBlur = (field: string) => {
    if (!editData) return;
    setTouched({ ...touched, [field]: true });
    
    const schema = editDoctorSchema[field as keyof typeof editDoctorSchema];
    if (schema) {
      const error = validateField(String(editData[field as keyof ProfileData] || ''), schema);
      setErrors({ ...errors, [field]: error });
    }
  };

  // Validate all fields before save
  const validateAllFields = (): boolean => {
    if (!editData) return false;
    
    const formValues: Record<string, string> = {
      name: editData.name || '',
      specialization: editData.specialization || '',
      phone: editData.phone || '',
      licenseNumber: editData.licenseNumber || '',
      experience: editData.experience || '',
    };
    
    const validationErrors = validateForm(formValues, editDoctorSchema);
    setErrors(validationErrors);
    setTouched({
      name: true,
      specialization: true,
      phone: true,
      licenseNumber: true,
      experience: true,
    });
    
    return !hasErrors(validationErrors);
  };

  // Load doctor profile from backend
  useEffect(() => {
    if (!email) {
      setLoading(false);
      return;
    }

    const token = getAuthItem("authToken");
    fetch(`${API_BASE}/doctor/profile/${email}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then((res) => res.json())
      .then((data) => {
        console.log("Doctor profile loaded:", data);

        const safeData: ProfileData = {
          name: "",
          specialization: "",
          degree: "",
          bio: "",
          phone: "",
          experience: "",
          licenseNumber: "",
          certifications: [],
          ...data,
        };

        setProfileData(safeData);
        setEditData(safeData);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Profile load error:", err);
        setLoading(false);
      });
  }, [email]);

  const handleEdit = () => {
    if (profileData) {
      setEditData({ ...profileData });
      setIsEditing(true);
      setErrors({});
      setTouched({});
    }
  };

  // Save changes to backend
  const handleSave = async () => {
    if (!email || !editData) return;

    // Validate before saving
    if (!validateAllFields()) {
      return;
    }

    try {
      setSaving(true);
      const token = getAuthItem("authToken");
      const res = await fetch(`${API_BASE}/doctor/update-profile/${email}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(editData),
      });

      if (!res.ok) {
        toast.error("Update failed");
        return;
      }

      toast.success("Profile updated successfully!");
      setProfileData({ ...editData });
      setIsEditing(false);
    } catch (err) {
      console.error("Update error:", err);
      toast.error("Server error");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (profileData) {
      setEditData({ ...profileData });
    }
    setIsEditing(false);
    setErrors({});
    setTouched({});
  };

  const handleAddCertification = () => {
    if (!editData) return;
    setEditData({
      ...editData,
      certifications: [...editData.certifications, ""],
    });
  };

  const handleRemoveCertification = (index: number) => {
    if (!editData) return;
    const updated = editData.certifications.filter((_, i) => i !== index);
    setEditData({
      ...editData,
      certifications: updated,
    });
  };

  const handleCertificationChange = (index: number, value: string) => {
    if (!editData) return;
    const updated = [...editData.certifications];
    updated[index] = value;
    setEditData({
      ...editData,
      certifications: updated,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DoctorNavbar onLogout={onLogout} />
        <div className="flex items-center justify-center py-32">
          <p className="text-gray-600 text-xl">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DoctorNavbar onLogout={onLogout} />
        <div className="flex items-center justify-center py-32">
          <p className="text-gray-600 text-xl">Profile not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DoctorNavbar onLogout={onLogout} />

      <div className="max-w-5xl mx-auto px-6 sm:px-8 lg:px-12 py-24">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">My Profile</h1>
            <p className="text-gray-600">Manage your professional information</p>
          </div>
          {!isEditing ? (
            <button
              onClick={handleEdit}
              className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 transition-all"
            >
              <Edit2 className="w-5 h-5" />
              Edit Profile
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <button
                onClick={handleCancel}
                disabled={saving}
                className="flex items-center gap-2 bg-gray-100 text-gray-700 px-5 py-3 rounded-xl font-medium hover:bg-gray-200 transition-all disabled:opacity-50"
              >
                <X className="w-5 h-5" />
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 bg-blue-600 text-white px-5 py-3 rounded-xl font-medium hover:bg-blue-700 transition-all disabled:opacity-50"
              >
                <Save className="w-5 h-5" />
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          )}
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Gradient Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 h-32"></div>

          <div className="p-8 md:p-12">
            {/* Profile Picture & Basic Info */}
            <div className="flex flex-col md:flex-row items-start gap-8 -mt-20 mb-8">
              <div className="w-28 h-28 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center text-white shadow-xl border-4 border-white flex-shrink-0">
                <span className="text-4xl font-bold">
                  {profileData.name.charAt(0).toUpperCase() || "D"}
                </span>
              </div>

              <div className="flex-1 mt-4 md:mt-16">
                {isEditing && editData ? (
                  <div className="space-y-4">
                    {/* NAME */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name
                      </label>
                      <input
                        value={editData.name}
                        onChange={(e) => handleFieldChange('name', e.target.value)}
                        onBlur={() => handleBlur('name')}
                        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${
                          touched.name && errors.name ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {touched.name && errors.name && (
                        <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                      )}
                    </div>

                    {/* SPECIALIZATION */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Specialization
                      </label>
                      <input
                        value={editData.specialization}
                        onChange={(e) => handleFieldChange('specialization', e.target.value)}
                        onBlur={() => handleBlur('specialization')}
                        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${
                          touched.specialization && errors.specialization ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {touched.specialization && errors.specialization && (
                        <p className="mt-1 text-sm text-red-600">{errors.specialization}</p>
                      )}
                    </div>

                    {/* DEGREE */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Degree & Institution
                      </label>
                      <input
                        value={editData.degree}
                        onChange={(e) =>
                          setEditData({ ...editData, degree: e.target.value })
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <h2 className="text-2xl font-bold text-gray-900 mb-1">
                      {profileData.name || "Doctor Name"}
                    </h2>
                    <p className="text-blue-600 font-medium mb-3">
                      {profileData.specialization || "Specialization"}
                    </p>
                    <div className="flex items-center gap-2 text-gray-600">
                      <GraduationCap className="w-5 h-5" />
                      <span>{profileData.degree || "Degree not specified"}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* About */}
            <div className="mb-8">
              <h3 className="font-semibold text-gray-900 mb-3">About</h3>
              {isEditing && editData ? (
                <textarea
                  value={editData.bio}
                  onChange={(e) =>
                    setEditData({ ...editData, bio: e.target.value })
                  }
                  rows={4}
                  className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="Write a brief bio..."
                />
              ) : (
                <p className="text-gray-700 leading-relaxed">
                  {profileData.bio || "No bio provided"}
                </p>
              )}
            </div>

            {/* Contact Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Email */}
              <div className="flex items-start gap-3">
                <Mail className="w-6 h-6 text-blue-600 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-600 mb-1">Email</p>
                  <p className="font-medium text-gray-900">
                    {profileData.doctorEmail || email || "N/A"}
                  </p>
                </div>
              </div>

              {/* Phone */}
              <div className="flex items-start gap-3">
                <Phone className="w-6 h-6 text-green-600 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-gray-600 mb-1">Phone</p>
                  {isEditing && editData ? (
                    <>
                      <input
                        value={editData.phone}
                        onChange={(e) => handleFieldChange('phone', formatPhoneNumber(e.target.value))}
                        onBlur={() => handleBlur('phone')}
                        className={`px-4 py-2 border rounded-xl w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${
                          touched.phone && errors.phone ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="(123) 456-7890"
                      />
                      {touched.phone && errors.phone && (
                        <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
                      )}
                    </>
                  ) : (
                    <p className="font-medium text-gray-900">
                      {profileData.phone || "N/A"}
                    </p>
                  )}
                </div>
              </div>

              {/* Experience */}
              <div className="flex items-start gap-3">
                <Calendar className="w-6 h-6 text-purple-600 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-gray-600 mb-1">Experience</p>
                  {isEditing && editData ? (
                    <>
                      <input
                        type="number"
                        value={editData.experience}
                        onChange={(e) => handleFieldChange('experience', e.target.value)}
                        onBlur={() => handleBlur('experience')}
                        className={`px-4 py-2 border rounded-xl w-24 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${
                          touched.experience && errors.experience ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Years"
                      />
                      {touched.experience && errors.experience && (
                        <p className="mt-1 text-sm text-red-600">{errors.experience}</p>
                      )}
                    </>
                  ) : (
                    <p className="font-medium text-gray-900">
                      {profileData.experience ? `${profileData.experience} years` : "N/A"}
                    </p>
                  )}
                </div>
              </div>

              {/* License Number */}
              <div className="flex items-start gap-3">
                <Award className="w-6 h-6 text-orange-600 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-gray-600 mb-1">License Number</p>
                  {isEditing && editData ? (
                    <>
                      <input
                        value={editData.licenseNumber}
                        onChange={(e) => handleFieldChange('licenseNumber', e.target.value)}
                        onBlur={() => handleBlur('licenseNumber')}
                        className={`px-4 py-2 border rounded-xl w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${
                          touched.licenseNumber && errors.licenseNumber ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Enter license number"
                      />
                      {touched.licenseNumber && errors.licenseNumber && (
                        <p className="mt-1 text-sm text-red-600">{errors.licenseNumber}</p>
                      )}
                    </>
                  ) : (
                    <p className="font-medium text-gray-900">
                      {profileData.licenseNumber || "N/A"}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Certifications */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Certifications</h3>
                {isEditing && (
                  <button
                    onClick={handleAddCertification}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    + Add Certification
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {isEditing && editData
                  ? editData.certifications.map((cert: string, index: number) => (
                      <div key={index} className="flex items-center gap-3">
                        <input
                          type="text"
                          value={cert}
                          onChange={(e) =>
                            handleCertificationChange(index, e.target.value)
                          }
                          className="flex-1 px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                          placeholder="Enter certification"
                        />
                        <button
                          onClick={() => handleRemoveCertification(index)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    ))
                  : profileData.certifications.length > 0
                  ? profileData.certifications.map((cert: string, index: number) => (
                      <div
                        key={index}
                        className="flex items-start gap-3 p-4 bg-blue-50 rounded-xl border border-blue-100"
                      >
                        <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                        <p className="text-gray-900">{cert}</p>
                      </div>
                    ))
                  : (
                    <p className="text-gray-500">No certifications added</p>
                  )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
