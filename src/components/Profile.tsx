import Navbar from './Navbar';
import { User, Calendar, Heart, Pill, AlertTriangle, Edit2, Save } from 'lucide-react';
import { useState, useEffect } from 'react';
import { profileSchema, validateField, hasErrors, formatPhoneNumber } from './utils/validation';
import { getAuthItem } from './utils/authStorage';
import { API_BASE } from './config';
import { toast } from 'sonner';

// Calculate age from date of birth
const calculateAge = (dateOfBirth: string): number | null => {
  if (!dateOfBirth) return null;
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  if (isNaN(birthDate.getTime())) return null;
  
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  // Adjust age if birthday hasn't occurred yet this year
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age >= 0 ? age : null;
};

interface ProfileProps {
  onSignOut?: () => void;
  hasUploadedReports?: boolean;
}

interface ProfileType {
  name: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  age: number | string;
  gender: string;
  bloodType: string;
  height: string;
  weight: string;
  address: string;
  medicalConditions: string[];
  allergies: string[];
  medications: string[];
  unitPreference: string;
}

export default function Profile({ onSignOut, hasUploadedReports }: ProfileProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [newCondition, setNewCondition] = useState('');
  const [newAllergy, setNewAllergy] = useState('');
  const [newMedication, setNewMedication] = useState('');

  // Validation state
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const [profile, setProfile] = useState<ProfileType>({
    name: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    age: "",
    gender: "",
    bloodType: "",
    height: "",
    weight: "",
    address: "",
    medicalConditions: [],
    allergies: [],
    medications: [],
    unitPreference: "metric",
  });

  // Fetch profile from backend
  useEffect(() => {
    const email = getAuthItem("userEmail");
    const token = getAuthItem("authToken");
    if (!email) {
      console.warn("No email found in storage");
      return;
    }

    fetch(`${API_BASE}/profile?email=${email}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(data => {
        console.log("✅ PROFILE FROM BACKEND:", data);
        setProfile(data);
      })
      .catch(err => console.error("❌ Profile fetch error:", err));
  }, []);

  // Handle field change with validation
  const handleFieldChange = (field: string, value: string) => {
    setProfile({ ...profile, [field]: value });
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors({ ...errors, [field]: null });
    }
  };

  // Handle field blur for real-time validation
  const handleBlur = (field: string) => {
    if (!isEditing) return;
    
    setTouched({ ...touched, [field]: true });
    
    const schema = profileSchema[field as keyof typeof profileSchema];
    if (schema) {
      const error = validateField(
        String(profile[field as keyof ProfileType] || ''),
        schema
      );
      setErrors({ ...errors, [field]: error });
    }
  };

  // Validate all editable fields
  const validateAllFields = (): boolean => {
    const newErrors: Record<string, string | null> = {};
    const newTouched: Record<string, boolean> = {};
    
    // Validate name (required)
    newErrors.name = validateField(profile.name, profileSchema.name);
    newTouched.name = true;
    
    // Validate phone (optional but must be valid if provided)
    if (profile.phone) {
      newErrors.phone = validateField(profile.phone, profileSchema.phone);
      newTouched.phone = true;
    }
    
    // Validate height (optional but must be valid if provided)
    if (profile.height) {
      newErrors.height = validateField(profile.height, profileSchema.height);
      newTouched.height = true;
    }
    
    // Validate weight (optional but must be valid if provided)
    if (profile.weight) {
      newErrors.weight = validateField(profile.weight, profileSchema.weight);
      newTouched.weight = true;
    }
    
    setErrors(newErrors);
    setTouched(newTouched);
    
    return !hasErrors(newErrors);
  };

  // Save profile to backend
  const handleSave = async () => {
    // Validate before saving
    if (!validateAllFields()) {
      toast.warning("Please fix the validation errors before saving.");
      return;
    }

    try {
      const token = getAuthItem("authToken");
      const response = await fetch(`${API_BASE}/profile`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(profile),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Update failed");
        return;
      }

      toast.success("Profile updated successfully!");
      setIsEditing(false);
      setTouched({});
      setErrors({});

    } catch (err) {
      console.error("❌ Save error:", err);
      toast.error("Backend connection failed");
    }
  };

  // Cancel editing
  const handleCancel = () => {
    setIsEditing(false);
    setTouched({});
    setErrors({});
    // Optionally refetch profile to reset changes
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar onSignOut={onSignOut} hasUploadedReports={hasUploadedReports} />
      
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-20">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-20">
          <div>
            <h1 className="text-gray-900 mb-4">My Profile</h1>
            <p className="text-lg text-gray-600">Manage your personal and health information</p>
          </div>
          <div className="flex gap-3">
            {isEditing && (
              <button
                onClick={handleCancel}
                className="flex items-center gap-2 bg-gray-200 text-gray-700 px-8 py-4 rounded-xl font-medium hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            )}
            <button
              onClick={() => isEditing ? handleSave() : setIsEditing(true)}
              className="flex items-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-xl font-medium hover:bg-blue-700 transition-colors shadow-sm"
            >
              {isEditing ? <Save className="w-5 h-5" /> : <Edit2 className="w-5 h-5" />}
              {isEditing ? 'Save Changes' : 'Edit Profile'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Profile Card */}
          <div className="bg-white rounded-2xl shadow-sm p-12 border border-gray-100">
            <div className="text-center">
              <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-8">
                <User className="w-16 h-16 text-white" />
              </div>
              <h2 className="text-gray-900 mb-3">{profile.name}</h2>
              <p className="text-gray-600 mb-8">{profile.email}</p>
              <div className="flex items-center justify-center gap-2 text-gray-600 mb-6">
                <Calendar className="w-4 h-4" />
                <span>
                  {calculateAge(profile.dateOfBirth) !== null 
                    ? `${calculateAge(profile.dateOfBirth)} years old` 
                    : 'Age not available'}
                </span>
              </div>
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 px-6 py-3 rounded-xl border border-blue-100">
                <Heart className="w-4 h-4" />
                <span className="font-medium">Pro Member</span>
              </div>
            </div>
          </div>

          {/* Personal Information */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm p-12 border border-gray-100">
            <h3 className="text-gray-900 mb-12">Personal Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* FULL NAME */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Full Name</label>
                {isEditing ? (
                  <>
                    <input
                      type="text"
                      value={profile.name}
                      onChange={(e) => handleFieldChange('name', e.target.value)}
                      onBlur={() => handleBlur('name')}
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none ${
                        touched.name && errors.name ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {touched.name && errors.name && (
                      <p className="mt-2 text-sm text-red-600">{errors.name}</p>
                    )}
                  </>
                ) : (
                  <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl">
                    <span className="text-gray-900">{profile.name}</span>
                  </div>
                )}
              </div>

              {/* EMAIL (Read-only) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Email Address</label>
                <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl">
                  <span className="text-gray-600">{profile.email}</span>
                </div>
              </div>

              {/* PHONE */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Phone Number</label>
                {isEditing ? (
                  <>
                    <input
                      type="tel"
                      value={profile.phone}
                      onChange={(e) => handleFieldChange('phone', formatPhoneNumber(e.target.value))}
                      onBlur={() => handleBlur('phone')}
                      placeholder="(123) 456-7890"
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none ${
                        touched.phone && errors.phone ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {touched.phone && errors.phone && (
                      <p className="mt-2 text-sm text-red-600">{errors.phone}</p>
                    )}
                  </>
                ) : (
                  <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl">
                    <span className="text-gray-900">{profile.phone || 'Not provided'}</span>
                  </div>
                )}
              </div>

              {/* DATE OF BIRTH */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Date of Birth</label>
                {isEditing ? (
                  <input
                    type="date"
                    value={profile.dateOfBirth}
                    onChange={(e) => setProfile({ ...profile, dateOfBirth: e.target.value })}
                    max={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                ) : (
                  <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl">
                    <span className="text-gray-900">{profile.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString() : 'Not provided'}</span>
                  </div>
                )}
              </div>

              {/* GENDER */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Gender</label>
                {isEditing ? (
                  <select
                    value={profile.gender}
                    onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="">Select gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                ) : (
                  <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl">
                    <span className="text-gray-900">{profile.gender || 'Not provided'}</span>
                  </div>
                )}
              </div>

              {/* BLOOD TYPE */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Blood Type</label>
                {isEditing ? (
                  <select
                    value={profile.bloodType}
                    onChange={(e) => setProfile({ ...profile, bloodType: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="">Select blood type</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                ) : (
                  <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl">
                    <span className="text-gray-900">{profile.bloodType || 'Not provided'}</span>
                  </div>
                )}
              </div>

              {/* HEIGHT */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Height (cm)</label>
                {isEditing ? (
                  <>
                    <input
                      type="number"
                      value={profile.height}
                      onChange={(e) => handleFieldChange('height', e.target.value)}
                      onBlur={() => handleBlur('height')}
                      placeholder="170"
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none ${
                        touched.height && errors.height ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {touched.height && errors.height && (
                      <p className="mt-2 text-sm text-red-600">{errors.height}</p>
                    )}
                  </>
                ) : (
                  <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl">
                    <span className="text-gray-900">{profile.height ? `${profile.height} cm` : 'Not provided'}</span>
                  </div>
                )}
              </div>

              {/* WEIGHT */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Weight (kg)</label>
                {isEditing ? (
                  <>
                    <input
                      type="number"
                      value={profile.weight}
                      onChange={(e) => handleFieldChange('weight', e.target.value)}
                      onBlur={() => handleBlur('weight')}
                      placeholder="70"
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none ${
                        touched.weight && errors.weight ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {touched.weight && errors.weight && (
                      <p className="mt-2 text-sm text-red-600">{errors.weight}</p>
                    )}
                  </>
                ) : (
                  <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl">
                    <span className="text-gray-900">{profile.weight ? `${profile.weight} kg` : 'Not provided'}</span>
                  </div>
                )}
              </div>
            </div>

            {/* ADDRESS */}
            <div className="mt-8">
              <label className="block text-sm font-medium text-gray-700 mb-3">Address</label>
              {isEditing ? (
                <textarea
                  value={profile.address}
                  onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                  placeholder="Enter your address"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                  rows={3}
                />
              ) : (
                <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl">
                  <span className="text-gray-900">{profile.address || 'Not provided'}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Medical Information */}
        <div className="mt-16 bg-white rounded-2xl shadow-sm p-12 border border-gray-100">
          <h3 className="text-gray-900 mb-12">Medical Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {/* MEDICAL CONDITIONS */}
            <div>
              <div className="flex items-center gap-2 mb-8">
                <Heart className="w-5 h-5 text-red-600" />
                <label className="text-sm font-medium text-gray-700">Medical Conditions</label>
              </div>
              <div className="space-y-4">
                {profile.medicalConditions.map((condition, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-xl">
                    <span className="text-red-900 font-medium">{condition}</span>
                    {isEditing && (
                      <button 
                        onClick={() => setProfile({
                          ...profile,
                          medicalConditions: profile.medicalConditions.filter((_, i) => i !== index)
                        })}
                        className="text-red-600 hover:text-red-800 text-xl leading-none"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
                {isEditing && (
                  <div className="flex items-center gap-4">
                    <input
                      type="text"
                      value={newCondition}
                      onChange={(e) => setNewCondition(e.target.value)}
                      placeholder="Add condition"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <button
                      onClick={() => {
                        if (newCondition.trim()) {
                          setProfile({ ...profile, medicalConditions: [...profile.medicalConditions, newCondition.trim()] });
                          setNewCondition('');
                        }
                      }}
                      className="bg-blue-600 text-white px-4 py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors"
                    >
                      Add
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* ALLERGIES */}
            <div>
              <div className="flex items-center gap-2 mb-8">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                <label className="text-sm font-medium text-gray-700">Allergies</label>
              </div>
              <div className="space-y-4">
                {profile.allergies.map((allergy, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                    <span className="text-yellow-900 font-medium">{allergy}</span>
                    {isEditing && (
                      <button 
                        onClick={() => setProfile({
                          ...profile,
                          allergies: profile.allergies.filter((_, i) => i !== index)
                        })}
                        className="text-yellow-600 hover:text-yellow-800 text-xl leading-none"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
                {isEditing && (
                  <div className="flex items-center gap-4">
                    <input
                      type="text"
                      value={newAllergy}
                      onChange={(e) => setNewAllergy(e.target.value)}
                      placeholder="Add allergy"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <button
                      onClick={() => {
                        if (newAllergy.trim()) {
                          setProfile({ ...profile, allergies: [...profile.allergies, newAllergy.trim()] });
                          setNewAllergy('');
                        }
                      }}
                      className="bg-blue-600 text-white px-4 py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors"
                    >
                      Add
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* MEDICATIONS */}
            <div>
              <div className="flex items-center gap-2 mb-8">
                <Pill className="w-5 h-5 text-blue-600" />
                <label className="text-sm font-medium text-gray-700">Current Medications</label>
              </div>
              <div className="space-y-4">
                {profile.medications.map((medication, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-xl">
                    <span className="text-blue-900 font-medium">{medication}</span>
                    {isEditing && (
                      <button 
                        onClick={() => setProfile({
                          ...profile,
                          medications: profile.medications.filter((_, i) => i !== index)
                        })}
                        className="text-blue-600 hover:text-blue-800 text-xl leading-none"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
                {isEditing && (
                  <div className="flex items-center gap-4">
                    <input
                      type="text"
                      value={newMedication}
                      onChange={(e) => setNewMedication(e.target.value)}
                      placeholder="Add medication"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <button
                      onClick={() => {
                        if (newMedication.trim()) {
                          setProfile({ ...profile, medications: [...profile.medications, newMedication.trim()] });
                          setNewMedication('');
                        }
                      }}
                      className="bg-blue-600 text-white px-4 py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors"
                    >
                      Add
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* UNIT PREFERENCE */}
          <div className="mt-10 pt-10 border-t border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-4">Unit Preference</label>
            <div className="flex gap-6">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="units"
                  value="metric"
                  checked={profile.unitPreference === 'metric'}
                  onChange={(e) => setProfile({ ...profile, unitPreference: e.target.value })}
                  disabled={!isEditing}
                  className="w-5 h-5 text-blue-600"
                />
                <span className="text-gray-700">Metric (kg, cm, mg/dL)</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="units"
                  value="imperial"
                  checked={profile.unitPreference === 'imperial'}
                  onChange={(e) => setProfile({ ...profile, unitPreference: e.target.value })}
                  disabled={!isEditing}
                  className="w-5 h-5 text-blue-600"
                />
                <span className="text-gray-700">Imperial (lbs, inches, mmol/L)</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
