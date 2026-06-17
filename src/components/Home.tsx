import { Link } from 'react-router-dom';
import { Activity, Upload, TrendingUp, Shield, Zap, Users, ArrowRight, CheckCircle } from 'lucide-react';

export default function Home() {
  const features = [
    {
      icon: Upload,
      title: 'Upload Lab Reports',
      description: 'Simply upload your medical lab reports in PDF or image format',
    },
    {
      icon: Zap,
      title: 'AI-Powered Analysis',
      description: 'Get instant insights powered by advanced AI technology',
    },
    {
      icon: TrendingUp,
      title: 'Track Trends',
      description: 'Monitor your health metrics over time with interactive charts',
    },
    {
      icon: Shield,
      title: 'Secure & Private',
      description: 'Your health data is encrypted and protected',
    },
  ];

  const benefits = [
    'Understand complex medical terminology',
    'Identify abnormal values at a glance',
    'Track health trends over time',
    'Get personalized health insights',
    'Share reports with your doctor easily',
    'Stay informed about your health',
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-purple-100">
      {/* Navbar */}
      <nav className="bg-white/90 backdrop-blur-md shadow-md border-b border-gray-300 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-10 py-3.5">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2.5">
              <Activity className="w-7 h-7 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">LabInsight AI</span>
            </Link>
            <div className="flex items-center gap-3">
              <Link
                to="/signin"
                className="px-5 py-2.5 text-gray-800 hover:text-gray-900 font-medium transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/get-started"
                className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors shadow-md"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-10 py-14">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 bg-blue-200 text-blue-800 px-4 py-2 rounded-full mb-5 border border-blue-300">
            <Zap className="w-4 h-4" />
            <span className="text-sm font-medium">AI-Powered Lab Report Analysis</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-5 leading-tight">
            Understand Your Lab Reports<br />
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              In Seconds
            </span>
          </h1>
          <p className="text-lg text-gray-700 mb-7 max-w-2xl mx-auto leading-relaxed">
            Get instant, AI-powered insights from your medical lab reports. Track trends, 
            identify abnormalities, and take control of your health journey.
          </p>
          <div className="flex items-center justify-center gap-5">
            <Link
              to="/get-started"
              className="flex items-center gap-2 px-7 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors shadow-lg"
            >
              Get Started Free
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/signin"
              className="px-7 py-3 border-2 border-gray-400 text-gray-800 rounded-xl font-medium hover:bg-gray-100 transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-14">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white rounded-xl shadow-md p-7 border border-gray-200 hover:shadow-lg transition-shadow"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mb-4">
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-sm text-gray-700">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* Benefits Section */}
        <div className="bg-white rounded-2xl shadow-xl p-10 border border-gray-200 mb-14">
          <div className="text-center mb-9">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose LabInsight AI?</h2>
            <p className="text-lg text-gray-700 max-w-xl mx-auto">
              Empower yourself with clear, actionable health insights
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-green-200 rounded-full flex items-center justify-center mt-0.5">
                  <CheckCircle className="w-4 h-4 text-green-700" />
                </div>
                <span className="text-base text-gray-800">{benefit}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-2xl p-10 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Ready to Take Control of Your Health?</h2>
          <p className="text-lg text-blue-50 mb-7 max-w-xl mx-auto">
            Join thousands of users who trust LabInsight AI for their health insights
          </p>
          <Link
            to="/get-started"
            className="inline-flex items-center gap-2 px-9 py-3.5 bg-white text-blue-600 rounded-xl font-medium hover:bg-blue-50 transition-colors shadow-xl"
          >
            Start Your Free Trial
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-10 mt-14">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-5">
            <div className="flex items-center gap-2.5">
              <Activity className="w-6 h-6 text-blue-500" />
              <span className="text-lg font-semibold text-white">LabInsight AI</span>
            </div>
            <div className="flex items-center gap-7 text-sm">
              <Link to="#" className="hover:text-white transition-colors">Privacy Policy</Link>
              <Link to="#" className="hover:text-white transition-colors">Terms of Service</Link>
              <Link to="#" className="hover:text-white transition-colors">Contact Us</Link>
            </div>
            <div className="text-sm">
              © 2024 LabInsight AI. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}