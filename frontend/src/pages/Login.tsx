import React, { useState } from 'react';
import { Heart, Eye, EyeOff, UserCheck, Stethoscope, Shield, Users } from 'lucide-react';
import { Input } from '../components/ui';
import { LoginForm, UserRole } from '../types';
import Registration from '../components/auth/Registration';

interface RegistrationData {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  dateOfBirth: string;
  role: UserRole;
  studentId?: string;
  yearOfStudy?: string;
  department?: string;
  licenseNumber?: string;
  specialization?: string[];
  experienceYears?: string;
  volunteerMotivation?: string;
  previousExperience?: string;
  agreeToTerms: boolean;
  agreeToPrivacy: boolean;
  emailNotifications: boolean;
}

interface LoginPageProps {
  onLogin?: (credentials: LoginForm & { role: UserRole }) => void;
  onRegister?: (data: RegistrationData) => void;
  isLoading?: boolean;
  error?: string | null;
  registrationError?: string | null;
}

const LoginPage: React.FC<LoginPageProps> = ({
  onLogin,
  onRegister,
  isLoading = false,
  error,
  registrationError
}) => {
  const [formData, setFormData] = useState<LoginForm>({
    email: '',
    password: '',
    remember: false
  });
  const [selectedRole, setSelectedRole] = useState<'student' | 'counselor' | 'peer_volunteer' | 'admin'>('student');
  const [showPassword, setShowPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isRegistrationMode, setIsRegistrationMode] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  const roleConfig = {
    student: {
      icon: UserCheck,
      title: 'Student Login',
      subtitle: 'Access mental health support and resources',
      color: 'from-neon-blue-500 to-neon-lavender-500',
      borderColor: 'border-neon-blue-200'
    },
    counselor: {
      icon: Stethoscope,
      title: 'Counselor Login',
      subtitle: 'Manage sessions and support students',
      color: 'from-neon-lavender-500 to-neon-mint-500',
      borderColor: 'border-neon-lavender-200'
    },
    peer_volunteer: {
      icon: Users,
      title: 'Peer Volunteer Login',
      subtitle: 'Support fellow students as a peer volunteer',
      color: 'from-neon-mint-500 to-neon-blue-500',
      borderColor: 'border-neon-mint-200'
    },
    admin: {
      icon: Shield,
      title: 'Admin Login',
      subtitle: 'System administration and analytics',
      color: 'from-purple-500 to-neon-blue-500',
      borderColor: 'border-purple-200'
    }
  };

  const currentRole = roleConfig[selectedRole];

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!formData.password.trim()) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onLogin?.({ ...formData, role: selectedRole });
    }
  };


  const handleRegistration = (data: RegistrationData) => {
    onRegister?.(data);
    setRegistrationSuccess(true);
    // Switch back to login mode after 3 seconds
    setTimeout(() => {
      setIsRegistrationMode(false);
      setRegistrationSuccess(false);
    }, 3000);
  };

  const switchToRegistration = () => {
    setIsRegistrationMode(true);
    setValidationErrors({});
  };

  const switchToLogin = () => {
    setIsRegistrationMode(false);
    setValidationErrors({});
    setRegistrationSuccess(false);
  };

  // Registration Success Message
  if (registrationSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-100 via-emerald-50 to-teal-100 relative overflow-hidden">
        {/* Success Background Animation */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-10 left-10 w-64 h-64 bg-gradient-to-br from-green-300/20 to-emerald-300/20 rounded-full animate-bounce blur-2xl"></div>
          <div className="absolute bottom-10 right-10 w-48 h-48 bg-gradient-to-br from-teal-300/25 to-cyan-300/25 rounded-full animate-pulse blur-xl"></div>
          <div className="absolute top-1/3 right-1/4 w-32 h-32 bg-gradient-to-r from-yellow-200 to-green-200 rounded-full opacity-60 animate-ping"></div>
          {/* Celebration particles */}
          <div className="absolute top-1/4 left-1/3 w-4 h-4 bg-green-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
          <div className="absolute top-2/3 right-1/3 w-3 h-3 bg-emerald-400 rounded-full animate-ping" style={{animationDelay: '0.5s'}}></div>
          <div className="absolute bottom-1/3 left-1/4 w-5 h-5 bg-teal-400 rounded-full animate-pulse" style={{animationDelay: '0.8s'}}></div>
        </div>
        
        <div className="relative z-10 min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full space-y-8">
            <div className="text-center bg-white/80 backdrop-blur-lg rounded-3xl p-8 shadow-2xl border border-white/30">
              <div className="flex justify-center mb-6">
                <div className="w-24 h-24 bg-gradient-to-r from-green-500 to-emerald-600 rounded-3xl flex items-center justify-center shadow-2xl animate-bounce">
                  <Heart className="w-12 h-12 text-white" />
                </div>
              </div>
              
              <h1 className="text-4xl font-black bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-4">
                🎉 Success!
              </h1>
              <p className="text-lg font-medium text-gray-700 mb-6">
                Your account has been created successfully!
              </p>
              
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-2xl border-2 border-green-200 shadow-lg">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">✓</span>
                  </div>
                  <p className="font-bold text-green-800">Welcome to NEONEXUS!</p>
                </div>
                <p className="text-sm text-green-700">
                  Please check your email for verification instructions and then you can sign in.
                </p>
              </div>
              
              <div className="mt-6 flex justify-center space-x-2">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-bounce"></div>
                <div className="w-3 h-3 bg-emerald-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-3 h-3 bg-teal-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Registration Mode  
  if (isRegistrationMode) {
    return (
      <div className="min-h-screen">
        <Registration 
          onRegister={handleRegistration}
          onBackToLogin={switchToLogin}
          isLoading={isLoading}
          error={registrationError}
        />
      </div>
    );
  }

  // Login Mode
  return (
    <div className="min-h-screen bg-gradient-to-br from-neon-blue-100 via-neon-lavender-50 to-neon-mint-100 relative">
      {/* Enhanced Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Primary floating orbs */}
        <div className="absolute top-20 left-20 w-72 h-72 bg-gradient-to-br from-neon-blue-300/30 to-neon-lavender-300/30 rounded-full animate-float blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-64 h-64 bg-gradient-to-br from-neon-mint-300/40 to-neon-blue-300/40 rounded-full animate-float-reverse blur-2xl"></div>
        <div className="absolute top-1/3 right-1/4 w-48 h-48 bg-gradient-to-r from-neon-lavender-200 to-pink-200 rounded-full opacity-70 animate-slow-ping"></div>
        
        {/* Secondary floating elements */}
        <div className="absolute top-1/2 left-1/3 w-32 h-32 bg-gradient-to-r from-purple-200/40 to-pink-200/40 rounded-full animate-float-slow blur-xl"></div>
        <div className="absolute bottom-1/3 left-1/4 w-40 h-40 bg-gradient-to-br from-cyan-200/30 to-blue-200/30 rounded-full animate-float-reverse-slow blur-2xl"></div>
        
        {/* Animated particles */}
        <div className="absolute top-1/4 left-1/5 w-4 h-4 bg-neon-blue-400/60 rounded-full animate-sparkle"></div>
        <div className="absolute top-3/4 right-1/5 w-3 h-3 bg-neon-lavender-400/60 rounded-full animate-sparkle-delayed"></div>
        <div className="absolute bottom-1/4 left-1/2 w-5 h-5 bg-neon-mint-400/60 rounded-full animate-sparkle-slow"></div>
        
        {/* Gradient waves */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-wave"></div>
      </div>
      
      {/* Custom CSS animations */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-30px) scale(1.05); }
        }
        @keyframes float-reverse {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(20px) scale(0.95); }
        }
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(5deg); }
        }
        @keyframes float-reverse-slow {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(10px) rotate(-3deg); }
        }
        @keyframes sparkle {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.5); }
        }
        @keyframes sparkle-delayed {
          0%, 100% { opacity: 0.4; transform: scale(1) rotate(0deg); }
          50% { opacity: 1; transform: scale(1.3) rotate(180deg); }
        }
        @keyframes sparkle-slow {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.2); }
        }
        @keyframes slow-ping {
          0% { transform: scale(1); opacity: 1; }
          75%, 100% { transform: scale(1.2); opacity: 0; }
        }
        @keyframes wave {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-float-reverse { animation: float-reverse 8s ease-in-out infinite; }
        .animate-float-slow { animation: float-slow 10s ease-in-out infinite; }
        .animate-float-reverse-slow { animation: float-reverse-slow 12s ease-in-out infinite; }
        .animate-sparkle { animation: sparkle 3s ease-in-out infinite; }
        .animate-sparkle-delayed { animation: sparkle-delayed 4s ease-in-out infinite 1s; }
        .animate-sparkle-slow { animation: sparkle-slow 5s ease-in-out infinite 2s; }
        .animate-slow-ping { animation: slow-ping 3s ease-out infinite; }
        .animate-wave { animation: wave 15s linear infinite; }
        
        @keyframes heartbeat {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        @keyframes gradient-x {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes fade-in-down {
          0% { opacity: 0; transform: translateY(-20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes fade-in-up {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes fade-in {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        @keyframes fade-in-scale {
          0% { opacity: 0; transform: scale(0.8); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes selected-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.5); }
          50% { box-shadow: 0 0 30px rgba(59, 130, 246, 0.8); }
        }
        @keyframes slide-up {
          0% { opacity: 0; transform: translateY(30px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes morph {
          0%, 100% { border-radius: 50%; }
          50% { border-radius: 20%; }
        }
        @keyframes wiggle {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(5deg); }
          75% { transform: rotate(-5deg); }
        }
        @keyframes type {
          0% { width: 0; }
          100% { width: 100%; }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        @keyframes gradient-pulse {
          0%, 100% { background-size: 100% 100%; }
          50% { background-size: 120% 120%; }
        }
        @keyframes rainbow-border {
          0% { border-color: #ff0000; }
          16.66% { border-color: #ff8000; }
          33.33% { border-color: #ffff00; }
          50% { border-color: #00ff00; }
          66.66% { border-color: #0080ff; }
          83.33% { border-color: #8000ff; }
          100% { border-color: #ff0080; }
        }
        @keyframes text-shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes bounce-in {
          0% { opacity: 0; transform: scale(0.3); }
          50% { opacity: 1; transform: scale(1.05); }
          70% { transform: scale(0.9); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes glow {
          0%, 100% { box-shadow: 0 0 10px rgba(139, 92, 246, 0.5); }
          50% { box-shadow: 0 0 20px rgba(139, 92, 246, 0.8); }
        }
        
        .animate-heartbeat { animation: heartbeat 2s ease-in-out infinite; }
        .animate-gradient-x { background-size: 200% 200%; animation: gradient-x 3s ease infinite; }
        .animate-fade-in-down { animation: fade-in-down 0.6s ease-out; }
        .animate-fade-in-up { animation: fade-in-up 0.6s ease-out; }
        .animate-fade-in { animation: fade-in 0.8s ease-out; }
        .animate-fade-in-scale { animation: fade-in-scale 0.5s ease-out; }
        .animate-selected-glow { animation: selected-glow 2s ease-in-out infinite; }
        .animate-slide-up { animation: slide-up 0.7s ease-out; }
        .animate-morph { animation: morph 4s ease-in-out infinite; }
        .animate-wiggle { animation: wiggle 2s ease-in-out infinite; }
        .animate-type { animation: type 2s steps(40, end); }
        .animate-shake { animation: shake 0.5s ease-in-out; }
        .animate-gradient-pulse { animation: gradient-pulse 2s ease-in-out infinite; }
        .animate-rainbow-border { animation: rainbow-border 3s linear infinite; }
        .animate-text-shimmer { 
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
          background-size: 200% 100%;
          animation: text-shimmer 1.5s ease-in-out infinite;
        }
        .animate-bounce-in { animation: bounce-in 0.6s ease-out; }
        .animate-glow { animation: glow 2s ease-in-out infinite; }
      `}</style>
      
      <div className="relative z-10 min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          {/* Header */}
          <div className="text-center animate-fade-in-down">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-gradient-to-r from-neon-blue-500 to-neon-lavender-500 rounded-3xl flex items-center justify-center shadow-2xl animate-heartbeat">
                <Heart className="w-10 h-10 text-white animate-pulse" />
              </div>
            </div>
            
            <h1 className="text-5xl font-black bg-gradient-to-r from-neon-blue-600 via-neon-lavender-600 to-neon-mint-600 bg-clip-text text-transparent mb-2 animate-gradient-x">
              NEONEXUS
            </h1>
            <p className="mt-2 text-lg font-bold text-gray-700 animate-fade-in">
              Digital Mental Health Support Platform
            </p>
          </div>

          {/* Role Selection */}
          <div className="bg-white/70 backdrop-blur-lg rounded-3xl p-6 shadow-2xl border-2 border-white/40 animate-fade-in-up">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-6 h-6 bg-gradient-to-r from-pink-400 to-purple-400 rounded-full animate-pulse"></div>
              <label className="text-lg font-black text-gray-800">
                Choose your role
              </label>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(roleConfig).map(([role, config], index) => {
                const IconComponent = config.icon;
                const isSelected = selectedRole === role;
                return (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setSelectedRole(role as typeof selectedRole)}
                    className={`p-4 rounded-2xl border-2 transition-all duration-500 transform hover:scale-110 hover:-rotate-1 animate-fade-in-scale ${
                      isSelected 
                        ? `bg-gradient-to-r ${config.color} text-white border-transparent shadow-2xl animate-selected-glow` 
                        : 'bg-white/50 text-gray-700 border-gray-200 hover:border-gray-300 shadow-lg hover:bg-white/70'
                    }`}
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="flex flex-col items-center space-y-2">
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                        isSelected ? 'bg-white/20 animate-bounce' : 'bg-gradient-to-r from-gray-100 to-gray-200'
                      }`}>
                        <IconComponent className={`w-5 h-5 transition-all duration-300 ${isSelected ? 'text-white animate-pulse' : 'text-gray-600'}`} />
                      </div>
                      <span className={`text-sm font-bold transition-all duration-300 ${isSelected ? 'text-white' : 'text-gray-700'}`}>
                        {role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Login Form */}
          <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl border-2 border-white/50 p-8 animate-slide-up">
            {/* Role Header */}
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <div className={`w-16 h-16 bg-gradient-to-r ${currentRole.color} rounded-3xl flex items-center justify-center shadow-2xl animate-morph`}>
                  {React.createElement(currentRole.icon, { className: "w-8 h-8 text-white animate-wiggle" })}
                </div>
              </div>
              <h2 className="text-3xl font-black bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-2 animate-type">
                {currentRole.title}
              </h2>
              <p className="text-gray-600 font-bold animate-fade-in">
                {currentRole.subtitle}
              </p>
            </div>

            {/* Error Display */}
            {error && (
              <div className="mb-6 p-4 bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-200 rounded-2xl shadow-lg animate-shake">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-red-400 rounded-full animate-pulse"></div>
                  <p className="text-red-600 font-bold">{error}</p>
                </div>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <Input
                label="Email Address"
                type="email"
                value={formData.email}
                onChange={(value) => setFormData({ ...formData, email: value })}
                placeholder="Enter your email"
                required
                error={validationErrors.email}
              />

              <div className="relative">
                <Input
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(value) => setFormData({ ...formData, password: value })}
                  placeholder="Enter your password"
                  required
                  error={validationErrors.password}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-2xl border-2 border-blue-200 shadow-inner animate-fade-in-up">
                <div className="flex items-center justify-between">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.remember}
                      onChange={(e) => setFormData({ ...formData, remember: e.target.checked })}
                      className="w-4 h-4 text-neon-blue-500 bg-white border-2 border-gray-300 rounded focus:ring-neon-blue-200 focus:ring-2 transition-all duration-300 hover:scale-110"
                    />
                    <span className="text-sm font-bold text-gray-700">Remember me</span>
                  </label>

                  <button 
                    type="button"
                    className="text-sm font-bold text-neon-blue-600 hover:text-neon-blue-700 transition-all duration-300 hover:scale-105"
                  >
                    Forgot password?
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-4 px-6 rounded-2xl font-bold text-white transition-all duration-500 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r ${currentRole.color} animate-gradient-pulse hover:animate-rainbow-border`}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span className="animate-pulse">Signing in...</span>
                  </div>
                ) : (
                  <span className="animate-text-shimmer">Sign In</span>
                )}
              </button>
            </form>

            <div className="mt-8 text-center">
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-2xl border border-purple-200 animate-fade-in-up">
                <p className="text-gray-600 font-medium mb-3">
                  New to NEONEXUS?
                </p>
                <button 
                  onClick={switchToRegistration}
                  className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl animate-glow"
                >
                  <span>Create an account</span>
                </button>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center bg-white/70 backdrop-blur-sm rounded-3xl p-6 border-2 border-white/40 shadow-2xl animate-fade-in-up">
            <div className="flex justify-center space-x-3 mb-4">
              <div className="w-3 h-3 bg-gradient-to-r from-red-400 to-pink-400 rounded-full animate-bounce"></div>
              <div className="w-3 h-3 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              <div className="w-3 h-3 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
              <div className="w-3 h-3 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full animate-bounce" style={{animationDelay: '0.6s'}}></div>
              <div className="w-3 h-3 bg-gradient-to-r from-purple-400 to-violet-400 rounded-full animate-bounce" style={{animationDelay: '0.8s'}}></div>
            </div>
            
            <div className="bg-gradient-to-r from-pink-50 to-purple-50 p-4 rounded-2xl border-2 border-pink-200 mb-4">
              <p className="text-lg font-black bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 bg-clip-text text-transparent animate-gradient-x">
                Made with ❤️ for student mental health
              </p>
            </div>
            
            <div className="flex justify-center items-center space-x-2">
              <p className="text-sm font-bold text-gray-700 animate-fade-in">
                Supporting universities across India
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
