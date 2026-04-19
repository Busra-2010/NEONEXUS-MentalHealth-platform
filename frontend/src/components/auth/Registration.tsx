import React, { useState } from 'react';
import { Eye, EyeOff, UserCheck, Stethoscope, Users, Shield, CheckCircle, AlertCircle } from 'lucide-react';
import { Input } from '../ui';
import { UserRole } from '../../types';
import { authService, RegistrationRequest } from '../../services/authService';

interface RegistrationData {
  // Personal Info
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  dateOfBirth: string;
  
  // Role-specific fields
  role: UserRole;
  
  // Student fields
  studentId?: string;
  yearOfStudy?: string;
  department?: string;
  
  // Counselor fields
  licenseNumber?: string;
  specialization?: string[];
  experienceYears?: string;
  qualifications?: string[];
  
  // Peer volunteer fields
  volunteerMotivation?: string;
  previousExperience?: string;
  
  // Terms and conditions
  agreeToTerms: boolean;
  agreeToPrivacy: boolean;
  emailNotifications: boolean;
}

interface RegistrationProps {
  onRegister?: (data: RegistrationData) => void;
  onBackToLogin?: () => void;
  isLoading?: boolean;
  error?: string | null;
}

const Registration: React.FC<RegistrationProps> = ({
  onRegister,
  onBackToLogin,
  isLoading = false,
  error
}) => {
  const [step, setStep] = useState(1);
  const [selectedRole, setSelectedRole] = useState<UserRole>('student');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  
  const [formData, setFormData] = useState<RegistrationData>({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    dateOfBirth: '',
    role: 'student',
    agreeToTerms: false,
    agreeToPrivacy: false,
    emailNotifications: true
  });

  const roleConfig = {
    student: {
      icon: UserCheck,
      title: 'Student Registration',
      subtitle: 'Access mental health support and resources',
      color: 'from-neon-blue-500 to-neon-lavender-500',
      borderColor: 'border-neon-blue-200',
      bgColor: 'bg-neon-blue-50'
    },
    counselor: {
      icon: Stethoscope,
      title: 'Counselor Registration',
      subtitle: 'Join as a licensed mental health professional',
      color: 'from-neon-lavender-500 to-neon-mint-500',
      borderColor: 'border-neon-lavender-200',
      bgColor: 'bg-neon-lavender-50'
    },
    peer_volunteer: {
      icon: Users,
      title: 'Peer Volunteer Registration',
      subtitle: 'Support fellow students as a peer volunteer',
      color: 'from-neon-mint-500 to-neon-blue-500',
      borderColor: 'border-neon-mint-200',
      bgColor: 'bg-neon-mint-50'
    },
    admin: {
      icon: Shield,
      title: 'Admin Registration',
      subtitle: 'System administration access',
      color: 'from-purple-500 to-neon-blue-500',
      borderColor: 'border-purple-200',
      bgColor: 'bg-purple-50'
    }
  };

  const specializationOptions = [
    'Anxiety Disorders',
    'Depression',
    'Trauma & PTSD',
    'Eating Disorders',
    'Substance Abuse',
    'Relationship Issues',
    'Academic Stress',
    'Family Therapy',
    'Group Therapy',
    'Crisis Intervention'
  ];

  const departmentOptions = [
    'Computer Science',
    'Engineering',
    'Business Administration',
    'Psychology',
    'Medicine',
    'Arts & Literature',
    'Mathematics',
    'Physics',
    'Chemistry',
    'Biology',
    'Economics',
    'Political Science',
    'History',
    'Other'
  ];

  const currentRole = roleConfig[selectedRole];

  const validateStep = (currentStep: number): boolean => {
    const errors: Record<string, string> = {};

    if (currentStep === 1) {
      if (!formData.fullName.trim()) {
        errors.fullName = 'Full name is required';
      } else if (formData.fullName.trim().length < 2) {
        errors.fullName = 'Full name must be at least 2 characters';
      }

      if (!formData.email.trim()) {
        errors.email = 'Email is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        errors.email = 'Please enter a valid email address';
      }

      if (!formData.password.trim()) {
        errors.password = 'Password is required';
      } else if (formData.password.length < 8) {
        errors.password = 'Password must be at least 8 characters';
      } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
        errors.password = 'Password must contain uppercase, lowercase, and numbers';
      }

      if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match';
      }

      if (!formData.phone.trim()) {
        errors.phone = 'Phone number is required';
      } else if (!/^\+?[\d\s-()]{10,}$/.test(formData.phone.replace(/\s/g, ''))) {
        errors.phone = 'Please enter a valid phone number';
      }

      if (!formData.dateOfBirth) {
        errors.dateOfBirth = 'Date of birth is required';
      } else {
        const age = new Date().getFullYear() - new Date(formData.dateOfBirth).getFullYear();
        if (age < 16) {
          errors.dateOfBirth = 'You must be at least 16 years old';
        }
      }
    }

    if (currentStep === 2) {
      if (selectedRole === 'student') {
        if (!formData.studentId?.trim()) {
          errors.studentId = 'Student ID is required';
        }
        if (!formData.yearOfStudy) {
          errors.yearOfStudy = 'Year of study is required';
        }
        if (!formData.department?.trim()) {
          errors.department = 'Department is required';
        }
      }

      if (selectedRole === 'counselor') {
        if (!formData.licenseNumber?.trim()) {
          errors.licenseNumber = 'License number is required';
        }
        if (!formData.experienceYears) {
          errors.experienceYears = 'Experience is required';
        }
        if (!formData.specialization || formData.specialization.length === 0) {
          errors.specialization = 'At least one specialization is required';
        }
      }

      if (selectedRole === 'peer_volunteer') {
        if (!formData.volunteerMotivation?.trim()) {
          errors.volunteerMotivation = 'Please explain your motivation to volunteer';
        } else if (formData.volunteerMotivation.length < 50) {
          errors.volunteerMotivation = 'Please provide a more detailed explanation (at least 50 characters)';
        }
      }
    }

    if (currentStep === 3) {
      if (!formData.agreeToTerms) {
        errors.agreeToTerms = 'You must agree to the terms and conditions';
      }
      if (!formData.agreeToPrivacy) {
        errors.agreeToPrivacy = 'You must agree to the privacy policy';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    }
  };

  const handlePrevious = () => {
    setStep(step - 1);
    setValidationErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateStep(3)) {
      try {
        const registrationData: RegistrationRequest = {
          ...formData,
          role: selectedRole
        };
        
        const response = await authService.register(registrationData);
        
        if (response.success) {
          // Call the onRegister prop if provided (for parent component handling)
          onRegister?.(formData);
        }
      } catch (error) {
        console.error('Registration failed:', error);
        // The error will be handled by the error state in the parent component
        // or we could set a local error state here
      }
    }
  };

  const handleSpecializationChange = (spec: string) => {
    const current = formData.specialization || [];
    const updated = current.includes(spec)
      ? current.filter(s => s !== spec)
      : [...current, spec];
    
    setFormData({ ...formData, specialization: updated });
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-neon-blue-100 to-neon-lavender-100 rounded-2xl mb-4 shadow-lg">
          <UserCheck className="w-8 h-8 text-neon-blue-600" />
        </div>
        <h2 className="text-2xl font-bold bg-gradient-to-r from-neon-blue-600 to-neon-lavender-600 bg-clip-text text-transparent mb-2">Personal Information</h2>
        <p className="text-gray-600 font-medium">✨ Let's start with your basic details</p>
      </div>

      <Input
        label="Full Name"
        value={formData.fullName}
        onChange={(value) => setFormData({ ...formData, fullName: value })}
        placeholder="Enter your full name"
        error={validationErrors.fullName}
      />

      <Input
        label="Email Address"
        type="email"
        value={formData.email}
        onChange={(value) => setFormData({ ...formData, email: value })}
        placeholder="Enter your email address"
        error={validationErrors.email}
      />

      <div className="relative">
        <Input
          label="Password"
          type={showPassword ? 'text' : 'password'}
          value={formData.password}
          onChange={(value) => setFormData({ ...formData, password: value })}
          placeholder="Create a strong password"
          error={validationErrors.password}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
        >
          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>

      <div className="relative">
        <Input
          label="Confirm Password"
          type={showConfirmPassword ? 'text' : 'password'}
          value={formData.confirmPassword}
          onChange={(value) => setFormData({ ...formData, confirmPassword: value })}
          placeholder="Confirm your password"
          error={validationErrors.confirmPassword}
        />
        <button
          type="button"
          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
          className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
        >
          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>

      <Input
        label="Phone Number"
        type="tel"
        value={formData.phone}
        onChange={(value) => setFormData({ ...formData, phone: value })}
        placeholder="+91 98765 43210"
        error={validationErrors.phone}
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
        <input
          type="date"
          value={formData.dateOfBirth}
          onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
          className={`w-full px-4 py-2.5 rounded-lg border transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 ${
            validationErrors.dateOfBirth 
              ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
              : 'border-gray-200 focus:border-neon-blue-500 focus:ring-neon-blue-200'
          } bg-white text-gray-900`}
        />
        {validationErrors.dateOfBirth && (
          <p className="mt-1 text-sm text-red-600">{validationErrors.dateOfBirth}</p>
        )}
      </div>

      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-2xl border border-blue-200 shadow-lg">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-white" />
            </div>
          </div>
          <div className="text-sm text-blue-800">
            <p className="font-bold mb-3 text-lg">🔐 Password Requirements:</p>
            <ul className="space-y-2">
              <li className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                <span>At least 8 characters long</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
                <span>Contains uppercase and lowercase letters</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
                <span>Contains at least one number</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-neon-mint-100 to-neon-lavender-100 rounded-2xl mb-4 shadow-lg">
          <Users className="w-8 h-8 text-neon-mint-600" />
        </div>
        <h2 className="text-2xl font-bold bg-gradient-to-r from-neon-mint-600 to-neon-lavender-600 bg-clip-text text-transparent mb-2">Role Selection & Details</h2>
        <p className="text-gray-600 font-medium">🎯 Choose your role and provide relevant information</p>
      </div>

      {/* Role Selection */}
      <div className="space-y-4">
        <label className="block text-lg font-bold text-gray-700 mb-4">✨ Select Your Role</label>
        <div className="grid grid-cols-1 gap-4">
          {(Object.keys(roleConfig) as UserRole[]).filter(role => role !== 'admin').map((role) => {
            const config = roleConfig[role];
            const Icon = config.icon;
            
            return (
              <button
                key={role}
                type="button"
                onClick={() => {
                  setSelectedRole(role);
                  setFormData({ ...formData, role });
                }}
                className={`p-6 rounded-2xl border-2 text-left transition-all duration-300 transform hover:scale-105 ${
                  selectedRole === role
                    ? `${config.borderColor} ${config.bgColor} shadow-2xl ring-4 ring-opacity-20 ring-current scale-105`
                    : 'border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50 shadow-lg hover:shadow-xl'
                }`}
              >
                <div className="flex items-center space-x-4">
                  <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${
                    selectedRole === role ? `bg-gradient-to-r ${config.color}` : 'bg-gray-100'
                  }`}>
                    <Icon className={`w-6 h-6 ${selectedRole === role ? 'text-white' : 'text-gray-500'}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className={`font-bold text-lg mb-1 ${
                      selectedRole === role ? 'text-gray-800' : 'text-gray-700'
                    }`}>{config.title}</h3>
                    <p className={`text-sm ${
                      selectedRole === role ? 'text-gray-600' : 'text-gray-500'
                    }`}>{config.subtitle}</p>
                  </div>
                  {selectedRole === role && (
                    <div className="flex-shrink-0">
                      <CheckCircle className="w-8 h-8 text-green-500" />
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Role-specific fields */}
      {selectedRole === 'student' && (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-3xl border-2 border-blue-200 shadow-xl space-y-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
              <UserCheck className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">🎓 Student Information</h3>
          </div>
          
          <Input
            label="🎫 Student ID"
            value={formData.studentId || ''}
            onChange={(value) => setFormData({ ...formData, studentId: value })}
            placeholder="Enter your student ID (e.g., STU2024001)"
            error={validationErrors.studentId}
            required
          />

          <div className="space-y-2">
            <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center space-x-2">
              <span>📅 Year of Study</span>
              <span className="inline-flex items-center justify-center w-5 h-5 bg-red-100 rounded-full">
                <span className="text-red-500 text-xs font-bold">*</span>
              </span>
            </label>
            <select
              value={formData.yearOfStudy || ''}
              onChange={(e) => setFormData({ ...formData, yearOfStudy: e.target.value })}
              className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-300 transform focus:outline-none focus:ring-4 focus:scale-[1.02] font-medium bg-white/90 shadow-sm hover:shadow-md ${
                validationErrors.yearOfStudy 
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-100 bg-red-50/30' 
                  : 'border-gray-200 focus:border-blue-400 focus:ring-blue-100 hover:border-gray-300'
              }`}
            >
              <option value="" className="text-gray-400">✨ Select your year</option>
              <option value="1">🌱 1st Year - Freshman</option>
              <option value="2">🌿 2nd Year - Sophomore</option>
              <option value="3">🌳 3rd Year - Junior</option>
              <option value="4">🌲 4th Year - Senior</option>
              <option value="5">🌴 5th Year - Super Senior</option>
              <option value="masters">🎓 Master's Student</option>
              <option value="phd">👨‍🎓 PhD Candidate</option>
            </select>
            {validationErrors.yearOfStudy && (
              <div className="flex items-center space-x-2 mt-2">
                <AlertCircle className="w-4 h-4 text-red-500" />
                <p className="text-sm text-red-600 font-medium">{validationErrors.yearOfStudy}</p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center space-x-2">
              <span>🏢 Department</span>
              <span className="inline-flex items-center justify-center w-5 h-5 bg-red-100 rounded-full">
                <span className="text-red-500 text-xs font-bold">*</span>
              </span>
            </label>
            <select
              value={formData.department || ''}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-300 transform focus:outline-none focus:ring-4 focus:scale-[1.02] font-medium bg-white/90 shadow-sm hover:shadow-md ${
                validationErrors.department 
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-100 bg-red-50/30' 
                  : 'border-gray-200 focus:border-blue-400 focus:ring-blue-100 hover:border-gray-300'
              }`}
            >
              <option value="" className="text-gray-400">🎯 Choose your department</option>
              {departmentOptions.map((dept) => (
                <option key={dept} value={dept}>📚 {dept}</option>
              ))}
            </select>
            {validationErrors.department && (
              <div className="flex items-center space-x-2 mt-2">
                <AlertCircle className="w-4 h-4 text-red-500" />
                <p className="text-sm text-red-600 font-medium">{validationErrors.department}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {selectedRole === 'counselor' && (
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-3xl border-2 border-purple-200 shadow-xl space-y-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <Stethoscope className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">👨‍⚕️ Professional Details</h3>
          </div>
          
          <Input
            label="🏅 License Number"
            value={formData.licenseNumber || ''}
            onChange={(value) => setFormData({ ...formData, licenseNumber: value })}
            placeholder="Enter your professional license number"
            error={validationErrors.licenseNumber}
            required
          />

          <div className="space-y-2">
            <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center space-x-2">
              <span>⏰ Years of Experience</span>
              <span className="inline-flex items-center justify-center w-5 h-5 bg-red-100 rounded-full">
                <span className="text-red-500 text-xs font-bold">*</span>
              </span>
            </label>
            <select
              value={formData.experienceYears || ''}
              onChange={(e) => setFormData({ ...formData, experienceYears: e.target.value })}
              className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-300 transform focus:outline-none focus:ring-4 focus:scale-[1.02] font-medium bg-white/90 shadow-sm hover:shadow-md ${
                validationErrors.experienceYears 
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-100 bg-red-50/30' 
                  : 'border-gray-200 focus:border-purple-400 focus:ring-purple-100 hover:border-gray-300'
              }`}
            >
              <option value="" className="text-gray-400">🎯 Select your experience level</option>
              <option value="0-1">🌱 0-1 years - New Professional</option>
              <option value="2-5">🌿 2-5 years - Developing Expertise</option>
              <option value="6-10">🌳 6-10 years - Experienced</option>
              <option value="11-15">🌲 11-15 years - Senior Professional</option>
              <option value="15+">🌴 15+ years - Expert Level</option>
            </select>
            {validationErrors.experienceYears && (
              <div className="flex items-center space-x-2 mt-2">
                <AlertCircle className="w-4 h-4 text-red-500" />
                <p className="text-sm text-red-600 font-medium">{validationErrors.experienceYears}</p>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center space-x-2">
              <span>🧠 Specializations</span>
              <span className="inline-flex items-center justify-center w-5 h-5 bg-red-100 rounded-full">
                <span className="text-red-500 text-xs font-bold">*</span>
              </span>
            </label>
            <div className="bg-white/80 p-4 rounded-2xl border-2 border-purple-100 max-h-48 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {specializationOptions.map((spec) => (
                  <label key={spec} className={`flex items-center space-x-3 p-3 rounded-xl border-2 cursor-pointer transition-all duration-200 hover:scale-105 ${
                    formData.specialization?.includes(spec) 
                      ? 'border-purple-300 bg-purple-50 shadow-lg' 
                      : 'border-gray-200 bg-white hover:border-purple-200 hover:bg-purple-50/30'
                  }`}>
                    <input
                      type="checkbox"
                      checked={formData.specialization?.includes(spec) || false}
                      onChange={() => handleSpecializationChange(spec)}
                      className="w-5 h-5 rounded-lg border-2 border-purple-300 text-purple-600 focus:ring-2 focus:ring-purple-200 transition-all"
                    />
                    <div className="flex items-center space-x-2">
                      <span className="w-2 h-2 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full"></span>
                      <span className="text-gray-700 font-medium text-sm">{spec}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
            {validationErrors.specialization && (
              <div className="flex items-center space-x-2 mt-2">
                <AlertCircle className="w-4 h-4 text-red-500" />
                <p className="text-sm text-red-600 font-medium">{validationErrors.specialization}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {selectedRole === 'peer_volunteer' && (
        <div className="bg-gradient-to-br from-green-50 to-teal-50 p-6 rounded-3xl border-2 border-green-200 shadow-xl space-y-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-teal-500 rounded-full flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">🤝 Volunteer Information</h3>
          </div>
          
          <div className="space-y-3">
            <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center space-x-2">
              <span>❤️ Why do you want to be a peer volunteer?</span>
              <span className="inline-flex items-center justify-center w-5 h-5 bg-red-100 rounded-full">
                <span className="text-red-500 text-xs font-bold">*</span>
              </span>
            </label>
            <div className="bg-white/80 p-4 rounded-2xl border-2 border-green-100">
              <textarea
                value={formData.volunteerMotivation || ''}
                onChange={(e) => setFormData({ ...formData, volunteerMotivation: e.target.value })}
                placeholder="🌟 Share your passion for helping fellow students. What drives you to make a difference in others' lives? (Minimum 50 characters)"
                rows={5}
                className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-300 transform focus:outline-none focus:ring-4 focus:scale-[1.01] font-medium bg-white/90 shadow-sm hover:shadow-md resize-none ${
                  validationErrors.volunteerMotivation 
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-100 bg-red-50/30' 
                    : 'border-gray-200 focus:border-green-400 focus:ring-green-100 hover:border-gray-300'
                }`}
              />
              <div className="flex justify-between items-center mt-2">
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-gradient-to-r from-green-400 to-teal-400 rounded-full"></span>
                  <span className="text-xs text-gray-500">Express your genuine desire to help others</span>
                </div>
                <span className={`text-xs font-medium ${
                  (formData.volunteerMotivation?.length || 0) >= 50 ? 'text-green-600' : 'text-gray-400'
                }`}>
                  {formData.volunteerMotivation?.length || 0}/50 min
                </span>
              </div>
            </div>
            {validationErrors.volunteerMotivation && (
              <div className="flex items-center space-x-2 mt-2">
                <AlertCircle className="w-4 h-4 text-red-500" />
                <p className="text-sm text-red-600 font-medium">{validationErrors.volunteerMotivation}</p>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center space-x-2">
              <span>🎆 Previous Experience (Optional)</span>
              <div className="inline-flex items-center justify-center px-2 py-1 bg-blue-100 rounded-full">
                <span className="text-blue-600 text-xs font-bold">OPTIONAL</span>
              </div>
            </label>
            <div className="bg-white/80 p-4 rounded-2xl border-2 border-green-100">
              <textarea
                value={formData.previousExperience || ''}
                onChange={(e) => setFormData({ ...formData, previousExperience: e.target.value })}
                placeholder="📚 Share any previous experience in counseling, volunteering, or helping others. This could include community service, peer support, mentoring, or any relevant activities..."
                rows={4}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-green-400 focus:ring-4 focus:ring-green-100 transition-all duration-300 transform focus:outline-none focus:scale-[1.01] font-medium bg-white/90 shadow-sm hover:shadow-md resize-none hover:border-gray-300"
              />
              <div className="flex items-center space-x-2 mt-2">
                <span className="w-2 h-2 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full"></span>
                <span className="text-xs text-gray-500">Help us understand your background and experience</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-100 to-blue-100 rounded-2xl mb-4 shadow-lg">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-2">Review & Confirm</h2>
        <p className="text-gray-600 font-medium">📝 Please review your information and agree to our terms</p>
      </div>

      {/* Summary */}
      <div className="bg-gradient-to-br from-white via-blue-50 to-purple-50 p-6 rounded-3xl border-2 border-blue-100 shadow-xl">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
            <UserCheck className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">📊 Registration Summary</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white/70 p-4 rounded-2xl border border-blue-200 shadow-lg">
            <div className="flex items-center space-x-2 mb-2">
              <span className="w-3 h-3 bg-gradient-to-r from-pink-400 to-red-400 rounded-full"></span>
              <span className="text-gray-600 font-medium">Full Name:</span>
            </div>
            <p className="font-bold text-lg text-gray-800">{formData.fullName}</p>
          </div>
          <div className="bg-white/70 p-4 rounded-2xl border border-green-200 shadow-lg">
            <div className="flex items-center space-x-2 mb-2">
              <span className="w-3 h-3 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full"></span>
              <span className="text-gray-600 font-medium">Email:</span>
            </div>
            <p className="font-bold text-lg text-gray-800">{formData.email}</p>
          </div>
          <div className="bg-white/70 p-4 rounded-2xl border border-purple-200 shadow-lg">
            <div className="flex items-center space-x-2 mb-2">
              <span className="w-3 h-3 bg-gradient-to-r from-purple-400 to-indigo-400 rounded-full"></span>
              <span className="text-gray-600 font-medium">Role:</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`inline-flex px-3 py-1 rounded-full text-sm font-bold bg-gradient-to-r ${currentRole.color} text-white`}>
                {selectedRole.replace('_', ' ').toUpperCase()}
              </span>
            </div>
          </div>
          <div className="bg-white/70 p-4 rounded-2xl border border-yellow-200 shadow-lg">
            <div className="flex items-center space-x-2 mb-2">
              <span className="w-3 h-3 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full"></span>
              <span className="text-gray-600 font-medium">Phone:</span>
            </div>
            <p className="font-bold text-lg text-gray-800">{formData.phone}</p>
          </div>
        </div>
      </div>

      {/* Terms and Conditions */}
      <div className="bg-gradient-to-br from-white via-green-50 to-blue-50 p-6 rounded-3xl border-2 border-green-100 shadow-xl space-y-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">📜 Terms & Agreements</h3>
        </div>
        
        <div className={`bg-white/80 p-5 rounded-2xl border-2 transition-all duration-200 ${
          validationErrors.agreeToTerms ? 'border-red-300 bg-red-50/50' : 'border-green-200 hover:border-green-300'
        }`}>
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0 mt-1">
              <input
                type="checkbox"
                id="agreeToTerms"
                checked={formData.agreeToTerms}
                onChange={(e) => setFormData({ ...formData, agreeToTerms: e.target.checked })}
                className="w-5 h-5 rounded-lg border-2 border-green-300 text-green-600 focus:ring-2 focus:ring-green-200 transition-all"
              />
            </div>
            <label htmlFor="agreeToTerms" className="text-gray-700 font-medium leading-relaxed">
              ✓ I agree to the{' '}
              <button type="button" className="text-green-600 hover:text-green-700 underline font-bold transition-colors">
                Terms and Conditions
              </button>
              {' '}and understand that my information will be reviewed before account activation.
            </label>
          </div>
          {validationErrors.agreeToTerms && (
            <div className="mt-3 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <p className="text-sm text-red-600 font-medium">{validationErrors.agreeToTerms}</p>
            </div>
          )}
        </div>

        <div className={`bg-white/80 p-5 rounded-2xl border-2 transition-all duration-200 ${
          validationErrors.agreeToPrivacy ? 'border-red-300 bg-red-50/50' : 'border-blue-200 hover:border-blue-300'
        }`}>
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0 mt-1">
              <input
                type="checkbox"
                id="agreeToPrivacy"
                checked={formData.agreeToPrivacy}
                onChange={(e) => setFormData({ ...formData, agreeToPrivacy: e.target.checked })}
                className="w-5 h-5 rounded-lg border-2 border-blue-300 text-blue-600 focus:ring-2 focus:ring-blue-200 transition-all"
              />
            </div>
            <label htmlFor="agreeToPrivacy" className="text-gray-700 font-medium leading-relaxed">
              🔒 I agree to the{' '}
              <button type="button" className="text-blue-600 hover:text-blue-700 underline font-bold transition-colors">
                Privacy Policy
              </button>
              {' '}and consent to the collection and use of my data as described.
            </label>
          </div>
          {validationErrors.agreeToPrivacy && (
            <div className="mt-3 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <p className="text-sm text-red-600 font-medium">{validationErrors.agreeToPrivacy}</p>
            </div>
          )}
        </div>

        <div className="bg-white/80 p-5 rounded-2xl border-2 border-purple-200 hover:border-purple-300 transition-all duration-200">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0 mt-1">
              <input
                type="checkbox"
                id="emailNotifications"
                checked={formData.emailNotifications}
                onChange={(e) => setFormData({ ...formData, emailNotifications: e.target.checked })}
                className="w-5 h-5 rounded-lg border-2 border-purple-300 text-purple-600 focus:ring-2 focus:ring-purple-200 transition-all"
              />
            </div>
            <label htmlFor="emailNotifications" className="text-gray-700 font-medium leading-relaxed">
              📧 I would like to receive email notifications about important updates and features.
            </label>
          </div>
        </div>
      </div>

      {selectedRole === 'counselor' && (
        <div className="bg-gradient-to-r from-yellow-50 via-orange-50 to-amber-50 p-6 rounded-3xl border-2 border-yellow-200 shadow-xl">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-2xl flex items-center justify-center animate-pulse">
                <Stethoscope className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <AlertCircle className="w-5 h-5 text-yellow-600" />
                <h4 className="font-bold text-lg text-yellow-800">👨‍⚕️ Professional Verification Required</h4>
              </div>
              <div className="bg-white/60 p-4 rounded-xl border border-yellow-200">
                <p className="text-yellow-800 font-medium mb-2">⌛ Your credentials will be verified before account activation.</p>
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-red-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                  <span className="text-sm text-yellow-700 font-medium">This may take 2-3 business days.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 relative overflow-hidden">
      {/* Decorative Background Patterns */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-r from-neon-lavender-200 to-pink-200 rounded-full opacity-60 animate-pulse"></div>
        <div className="absolute top-40 right-20 w-20 h-20 bg-gradient-to-r from-neon-mint-200 to-green-200 rounded-full opacity-50 animate-bounce"></div>
        <div className="absolute bottom-32 left-1/4 w-24 h-24 bg-gradient-to-r from-neon-blue-200 to-cyan-200 rounded-full opacity-40"></div>
        <div className="absolute bottom-20 right-1/3 w-16 h-16 bg-gradient-to-r from-yellow-200 to-orange-200 rounded-full opacity-60"></div>
        
        {/* Floating particles */}
        <div className="absolute top-1/3 left-1/2 w-2 h-2 bg-neon-lavender-300 rounded-full animate-ping"></div>
        <div className="absolute top-1/2 right-1/4 w-3 h-3 bg-neon-mint-300 rounded-full animate-pulse"></div>
        <div className="absolute bottom-1/3 left-1/3 w-2 h-2 bg-neon-blue-300 rounded-full animate-bounce"></div>
      </div>
    
    <div className="relative z-10 max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Progress Bar */}
      <div className="flex items-center justify-between bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-white/20">
        <div className="flex items-center space-x-3">
          {[1, 2, 3].map((stepNumber) => (
            <React.Fragment key={stepNumber}>
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 transform ${
                  step >= stepNumber
                    ? `bg-gradient-to-r ${currentRole.color} text-white shadow-lg scale-110 ring-4 ring-white ring-opacity-50`
                    : 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-500 hover:scale-105'
                }`}
              >
                {step > stepNumber ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  stepNumber
                )}
              </div>
              {stepNumber < 3 && (
                <div className="flex-1 h-2 mx-2 rounded-full overflow-hidden bg-gray-200">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      step > stepNumber ? `bg-gradient-to-r ${currentRole.color}` : 'bg-gray-200'
                    }`}
                    style={{ width: step > stepNumber ? '100%' : '0%' }}
                  />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
        <button
          onClick={onBackToLogin}
          className="px-4 py-2 text-sm font-medium text-neon-lavender-600 hover:text-neon-lavender-700 bg-white/50 hover:bg-white/70 rounded-lg transition-all duration-200 backdrop-blur-sm border border-neon-lavender-200"
        >
          ← Back to Login
        </button>
      </div>

      {/* Step Titles */}
      <div className="text-center">
        <div className={`inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-r ${currentRole.color} bg-opacity-20 mb-6 shadow-xl backdrop-blur-sm border border-white/30 transform hover:scale-105 transition-all duration-300`}>
          <currentRole.icon className="w-10 h-10 text-gray-700" />
        </div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-3">{currentRole.title}</h1>
        <p className="text-lg text-gray-600 font-medium">{currentRole.subtitle}</p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-2xl shadow-lg backdrop-blur-sm">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <p className="text-sm font-medium text-red-600">{error}</p>
          </div>
        </div>
      )}

      {/* Form Steps */}
      <div className="bg-white/90 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
        <div className={`h-2 bg-gradient-to-r ${currentRole.color}`}></div>
        <div className="p-8">
          <form onSubmit={handleSubmit}>
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-8 mt-8 border-t border-gradient-to-r from-transparent via-gray-200 to-transparent">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={handlePrevious}
                  className="px-6 py-3 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-700 font-semibold rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg"
                >
                  ← Previous
                </button>
              ) : (
                <div />
              )}

              {step < 3 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className={`px-8 py-3 bg-gradient-to-r ${currentRole.color} text-white font-bold rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl`}
                >
                  Next Step →
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`px-8 py-3 bg-gradient-to-r ${currentRole.color} text-white font-bold rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl min-w-[160px] disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Creating...</span>
                    </div>
                  ) : (
                    '🎉 Create Account'
                  )}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
    </div>
  );
};

export default Registration;