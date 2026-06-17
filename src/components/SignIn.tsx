import { Link, useNavigate } from 'react-router-dom';
import { Activity, Mail, Lock, Github } from 'lucide-react';
import { FcGoogle } from 'react-icons/fc';
import { useState } from 'react';
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "./firebase";
import { loginSchema, validateField, validateForm, hasErrors } from './utils/validation';
import { API_BASE } from './config';
import { toast } from 'sonner';
import { setAuthItem } from './utils/authStorage';

interface SignInProps {
  onSignIn: () => void;
  onAdminSignIn: () => void;
  onDoctorSignIn?: () => void;
}

export default function SignIn({ onSignIn, onAdminSignIn, onDoctorSignIn }: SignInProps) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Validation state
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Handle field blur for real-time validation
  const handleBlur = (field: string, value: string) => {
    setTouched({ ...touched, [field]: true });
    const error = validateField(value, loginSchema[field as keyof typeof loginSchema]);
    setErrors({ ...errors, [field]: error });
  };

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
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

      // Store token and email (Google login defaults to remember me = true)
      if (data.token) {
        setAuthItem("authToken", data.token, true);
      }
      setAuthItem("userEmail", user.email || "", true);
      
      toast.success("Signed in with Google!");
      onSignIn();
      navigate("/view-reports");

    } catch (err) {
      console.error(err);
      toast.error("Google sign-in failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all fields on submit
    const formValues = { email, password };
    const validationErrors = validateForm(formValues, loginSchema);
    setErrors(validationErrors);
    setTouched({ email: true, password: true });

    // If there are validation errors, don't submit
    if (hasErrors(validationErrors)) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Invalid credentials");
        setIsLoading(false);
        return;
      }

      // Store token based on "Remember me" preference
      const storage = rememberMe ? localStorage : sessionStorage;
      
      if (data.token) {
        storage.setItem("authToken", data.token);
      }

      // Role-based routing
      const role = data.role || 'user';

      if (role === 'admin') {
        storage.setItem("adminEmail", email);
        onAdminSignIn();
        navigate("/admin/dashboard");
      } else if (role === 'doctor') {
        storage.setItem("doctorEmail", email);
        storage.setItem("doctorToken", data.token);
        if (onDoctorSignIn) {
          onDoctorSignIn();
        }
        navigate("/doctor/dashboard");
      } else {
        // Default: regular user
        storage.setItem("userEmail", email);
        onSignIn();
        navigate("/view-reports");
      }

    } catch (error) {
      console.error("Login error", error);
      toast.error("Server error — backend not reachable");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      
      {/* Navbar */}
      <nav className="bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-5">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3">
              <Activity className="w-8 h-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">LabInsight AI</span>
            </Link>
            <Link
              to="/"
              className="px-6 py-2.5 text-gray-700 hover:text-gray-900 font-medium transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </nav>

      {/* Sign In Form */}
      <div className="flex items-center justify-center px-6 py-20">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-12 border border-gray-100">

            <div className="text-center mb-10">
              <h1 className="text-3xl font-bold text-gray-900 mb-3">Welcome Back</h1>
              <p className="text-lg text-gray-600">Sign in to your account</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* EMAIL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Email Address</label>
                <div className="relative">
                  <Mail className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={() => handleBlur('email', email)}
                    placeholder="you@example.com"
                    className={`w-full pl-12 pr-4 py-3.5 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none ${
                      touched.email && errors.email ? 'border-red-500' : 'border-gray-300'
                    }`}
                    required
                    disabled={isLoading}
                  />
                </div>
                {touched.email && errors.email && (
                  <p className="mt-2 text-sm text-red-600">{errors.email}</p>
                )}
              </div>

              {/* PASSWORD */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Password</label>
                <div className="relative">
                  <Lock className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onBlur={() => handleBlur('password', password)}
                    placeholder="••••••••"
                    className={`w-full pl-12 pr-4 py-3.5 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none ${
                      touched.password && errors.password ? 'border-red-500' : 'border-gray-300'
                    }`}
                    required
                    disabled={isLoading}
                  />
                </div>
                {touched.password && errors.password && (
                  <p className="mt-2 text-sm text-red-600">{errors.password}</p>
                )}
              </div>

              {/* REMEMBER ME + FORGOT */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Remember me</span>
                </label>
                <a href="#" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                  Forgot password?
                </a>
              </div>

              {/* SIGN IN BUTTON */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3.5 rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </button>
            </form>

            {/* SOCIAL LOGIN */}
            <div className="mt-8">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500">Or continue with</span>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-4">
                <button
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                  className="flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  <FcGoogle className="w-5 h-5" />
                  <span className="font-medium text-gray-700">Google</span>
                </button>

                <button 
                  disabled={isLoading}
                  className="flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  <Github className="w-5 h-5" />
                  <span className="font-medium text-gray-700">GitHub</span>
                </button>
              </div>
            </div>

            <p className="mt-8 text-center text-gray-600">
              Don't have an account?{' '}
              <Link to="/get-started" className="text-blue-600 hover:text-blue-700 font-medium">
                Sign up
              </Link>
            </p>

          </div>
        </div>
      </div>
    </div>
  );
}
