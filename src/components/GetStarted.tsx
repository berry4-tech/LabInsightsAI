import { Link, useNavigate } from 'react-router-dom';
import { Activity, Chrome } from 'lucide-react';
import { useState } from 'react';
import { FaGithub } from 'react-icons/fa';
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "./firebase";
import { signupSchema, validateField, validateForm, hasErrors } from './utils/validation';
import { API_BASE } from './config';
import { toast } from 'sonner';
import { setAuthItem } from './utils/authStorage';

interface GetStartedProps {
  onSignUp: () => void;
}

export default function GetStarted({ onSignUp }: GetStartedProps) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  
  // Validation state
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Handle field change with real-time validation for password
  const handleChange = (field: string, value: string) => {
    const newFormData = { ...formData, [field]: value };
    setFormData(newFormData);
    
    // Real-time validation for password and confirmPassword fields
    if (field === 'password' || field === 'confirmPassword') {
      if (touched[field]) {
        const error = validateField(
          value,
          signupSchema[field as keyof typeof signupSchema],
          newFormData
        );
        setErrors({ ...errors, [field]: error });
      }
    } else {
      // Clear error when user starts typing for other fields
      if (errors[field]) {
        setErrors({ ...errors, [field]: null });
      }
    }
  };

  // Handle field blur for real-time validation
  const handleBlur = (field: string) => {
    setTouched({ ...touched, [field]: true });
    const error = validateField(
      formData[field as keyof typeof formData],
      signupSchema[field as keyof typeof signupSchema],
      formData
    );
    setErrors({ ...errors, [field]: error });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all fields on submit
    const validationErrors = validateForm(formData, signupSchema);
    setErrors(validationErrors);
    setTouched({
      name: true,
      email: true,
      password: true,
      confirmPassword: true,
    });

    // If there are validation errors, don't submit
    if (hasErrors(validationErrors)) {
      return;
    }

    // Check terms agreement
    if (!agreedToTerms) {
      toast.warning("Please agree to the Terms of Service and Privacy Policy");
      return;
    }

    // Call backend signup API
    try {
      const response = await fetch(`${API_BASE}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Signup failed");
        return;
      }

      // Store the token and user's email (signup defaults to remember me = true)
      if (data.token) {
        setAuthItem("authToken", data.token, true);
      }
      setAuthItem("userEmail", formData.email, true);
      
      toast.success("Account created successfully!");
      onSignUp();
      navigate("/profile");
    } catch (error) {
      console.error("Signup error", error);
      toast.error("Server error — backend not reachable");
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // Call the new Google auth endpoint that returns a token
      const response = await fetch(`${API_BASE}/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: user.displayName,
          email: user.email,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Google sign-in failed");
        return;
      }

      // Store token and email (Google signup defaults to remember me = true)
      if (data.token) {
        setAuthItem("authToken", data.token, true);
      }
      setAuthItem("userEmail", user.email || "", true);
      
      toast.success("Signed in with Google!");
      onSignUp();
      navigate("/profile");

    } catch (err) {
      console.error(err);
      toast.error("Google sign-in failed");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-12">
          <Link to="/" className="inline-flex items-center gap-3 mb-8">
            <Activity className="w-10 h-10 text-blue-600" />
            <span className="text-2xl font-semibold text-gray-900">LabInsight AI</span>
          </Link>
        </div>

        {/* Sign Up Card */}
        <div className="bg-white rounded-2xl shadow-xl p-10 border border-gray-100">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-3">Create Account</h1>
            <p className="text-gray-600">Start your journey to better health insights</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* FULL NAME */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                onBlur={() => handleBlur('name')}
                placeholder="John Doe"
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all ${
                  touched.name && errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                required
              />
              {touched.name && errors.name && (
                <p className="mt-2 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            {/* EMAIL */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                onBlur={() => handleBlur('email')}
                placeholder="you@example.com"
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all ${
                  touched.email && errors.email ? 'border-red-500' : 'border-gray-300'
                }`}
                required
              />
              {touched.email && errors.email && (
                <p className="mt-2 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            {/* PASSWORD */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                onBlur={() => handleBlur('password')}
                placeholder="Create a strong password"
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all ${
                  touched.password && errors.password ? 'border-red-500' : 'border-gray-300'
                }`}
                required
              />
              {touched.password && errors.password && (
                <p className="mt-2 text-sm text-red-600">{errors.password}</p>
              )}
              {/* Password requirements hint */}
              {touched.password && !errors.password && formData.password.length >= 8 && (
                <p className="mt-2 text-sm text-green-600">✓ Password meets requirements</p>
              )}
              {(!touched.password || (touched.password && errors.password)) && (
                <p className="mt-2 text-xs text-gray-500">
                  Must be 8+ characters with uppercase, lowercase, and number
                </p>
              )}
            </div>

            {/* CONFIRM PASSWORD */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => handleChange('confirmPassword', e.target.value)}
                onBlur={() => handleBlur('confirmPassword')}
                placeholder="Re-enter your password"
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all ${
                  touched.confirmPassword && errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                }`}
                required
              />
              {touched.confirmPassword && errors.confirmPassword && (
                <p className="mt-2 text-sm text-red-600">{errors.confirmPassword}</p>
              )}
            </div>

            {/* TERMS CHECKBOX */}
            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-0.5"
                required
              />
              <label className="text-sm text-gray-600">
                I agree to the{' '}
                <Link to="#" className="text-blue-600 hover:text-blue-700">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link to="#" className="text-blue-600 hover:text-blue-700">
                  Privacy Policy
                </Link>
              </label>
            </div>

            {/* SUBMIT BUTTON */}
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-medium hover:bg-blue-700 transition-colors"
            >
              Create Account
            </button>
          </form>

          {/* SOCIAL LOGIN */}
          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4">
              <button
                onClick={handleGoogleSignIn}
                className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <Chrome className="w-5 h-5" />
                <span className="text-sm font-medium text-gray-700">Google</span>
              </button>

              <button className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors">
                <FaGithub className="w-5 h-5" />
                <span className="text-sm font-medium text-gray-700">GitHub</span>
              </button>
            </div>
          </div>

          <p className="mt-8 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/signin" className="text-blue-600 font-medium hover:text-blue-700">
              Sign in
            </Link>
          </p>
        </div>

        <div className="mt-8 text-center">
          <div className="flex items-center justify-center gap-6 text-sm text-gray-500">
            <Link to="#" className="hover:text-gray-700">Privacy Policy</Link>
            <span>•</span>
            <Link to="#" className="hover:text-gray-700">Terms of Service</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
