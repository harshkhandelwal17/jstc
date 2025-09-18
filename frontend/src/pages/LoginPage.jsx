import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { 
  Eye, 
  EyeOff, 
  Mail, 
  Lock,
  GraduationCap, 
  Users,
  DollarSign,
  Award,
  ArrowRight,
  CheckCircle,
  BookOpen,
  TrendingUp
} from 'lucide-react';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    
    try {
      await login(formData.email, formData.password);
      toast.success('Login successful!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      icon: Users,
      title: 'Student Management',
      description: 'Complete student lifecycle management with enrollment, tracking, and progress monitoring.'
    },
    {
      icon: DollarSign,
      title: 'Fee Management',
      description: 'Automated fee collection, receipt generation, and financial tracking.'
    },
    {
      icon: Award,
      title: 'Result Management',
      description: 'Exam result publishing, grade calculation, and back subject tracking.'
    },
    {
      icon: TrendingUp,
      title: 'Analytics & Reports',
      description: 'Comprehensive reporting and analytics for better decision making.'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="flex min-h-screen">
        
        {/* Left Side - Branding & Features */}
        <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 bg-gradient-to-br from-blue-600 via-blue-700 to-purple-800 relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}></div>
          </div>
          
          <div className="relative z-10 flex flex-col justify-center px-12 py-12 text-white">
            <div className="max-w-md">
              <div className="flex items-center mb-8">
                <div className="flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl mr-4">
                  <GraduationCap className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">Coaching Institute</h1>
                  <p className="text-blue-100">Management System</p>
                </div>
              </div>
              
              <div className="mb-8">
                <h2 className="text-2xl font-bold mb-4">
                  Streamline Your Institute Operations
                </h2>
                <p className="text-xl text-blue-100 leading-relaxed">
                  Complete solution for PGDCA & DCA course management with automated fee tracking, result management, and comprehensive analytics.
                </p>
              </div>
              
              <div className="space-y-6">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-start space-x-4">
                    <div className="flex items-center justify-center w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex-shrink-0">
                      <feature.icon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white mb-1">{feature.title}</h3>
                      <p className="text-sm text-blue-100">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-12 p-6 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20">
                <h3 className="font-semibold text-white mb-4">Course Offerings</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">PGDCA</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">DCA</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="flex-1 flex flex-col justify-center px-6 py-12 lg:px-20 xl:px-24">
          <div className="mx-auto w-full max-w-sm lg:w-96">
            
            {/* Mobile Logo */}
            <div className="lg:hidden flex items-center justify-center mb-8">
              <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl mr-4">
                <GraduationCap className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Coaching Institute</h1>
                <p className="text-gray-600">Management System</p>
              </div>
            </div>
            
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900">Welcome Back!</h2>
              <p className="mt-2 text-lg text-gray-600">
                Sign in to access your dashboard
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`block w-full pl-10 pr-3 py-3 border rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${
                      errors.email ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="Enter your email"
                  />
                </div>
                {errors.email && (
                  <p className="mt-2 text-sm text-red-600">{errors.email}</p>
                )}
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className={`block w-full pl-10 pr-12 py-3 border rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${
                      errors.password ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-2 text-sm text-red-600">{errors.password}</p>
                )}
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                    Remember me
                  </label>
                </div>

                <div className="text-sm">
                  <a
                    href="#"
                    className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
                  >
                    Forgot password?
                  </a>
                </div>
              </div>

              {/* Submit Button */}
              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl windows8-button-fix"
                >
                  {loading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                      Signing in...
                    </div>
                  ) : (
                    <div className="flex items-center">
                      Sign in to Dashboard
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  )}
                </button>
              </div>
            </form>            
            {/* Features for Mobile */}
            <div className="lg:hidden mt-12">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Features</h3>
              <div className="grid grid-cols-2 gap-4">
                {features.slice(0, 4).map((feature, index) => (
                  <div key={index} className="text-center p-4 bg-gray-50 rounded-lg">
                    <feature.icon className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <h4 className="text-sm font-medium text-gray-900">{feature.title}</h4>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="mt-8 text-center">
              <p className="text-xs text-gray-500">
                © 2025 JSTC Coaching Institute . All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage; 