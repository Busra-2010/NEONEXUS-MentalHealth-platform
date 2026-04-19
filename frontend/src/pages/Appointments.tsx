import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, User, Star, MapPin, Video, Phone, Shield, CheckCircle } from 'lucide-react';
import { Navigation, Card, Button, LoadingSpinner, ToastContainer } from '../components/ui';
import { User as UserType, CounselorProfile, TimeSlot } from '../types';
import { useToast } from '../hooks/useToast';

interface AppointmentsProps {
  user?: UserType;
  onLogout?: () => void;
}

const Appointments: React.FC<AppointmentsProps> = ({
  user,
  onLogout,
}) => {
  const navigate = useNavigate();
  const [selectedCounselor, setSelectedCounselor] = useState<CounselorProfile | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [meetingType, setMeetingType] = useState<'video' | 'audio' | 'in_person'>('video');
  const [isAnonymous, setIsAnonymous] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>('');
  const [showBookingForm, setShowBookingForm] = useState<boolean>(false);
  const [isBooking, setIsBooking] = useState<boolean>(false);
  const toast = useToast();

  // Mock counselors data
  const counselors: CounselorProfile[] = [
    {
      fullName: 'Dr. Priya Sharma',
      licenseNumber: 'PSY123456',
      specialization: ['Anxiety', 'Depression', 'Academic Stress'],
      experienceYears: 8,
      qualifications: ['PhD Psychology', 'Licensed Clinical Psychologist'],
      languages: ['English', 'Hindi'],
      bio: 'Specializes in helping students overcome anxiety and academic pressure. Uses evidence-based cognitive behavioral therapy approaches.',
      avatarUrl: '',
      isAvailable: true,
      rating: 4.8,
      totalSessions: 245
    },
    {
      fullName: 'Dr. Rajesh Kumar',
      licenseNumber: 'PSY789012',
      specialization: ['Depression', 'Relationship Issues', 'Life Transitions'],
      experienceYears: 12,
      qualifications: ['PhD Clinical Psychology', 'Certified CBT Therapist'],
      languages: ['English', 'Hindi', 'Urdu'],
      bio: 'Experienced in working with young adults facing depression and major life changes. Compassionate and non-judgmental approach.',
      avatarUrl: '',
      isAvailable: true,
      rating: 4.9,
      totalSessions: 320
    },
    {
      fullName: 'Dr. Aasha Akhtar',
      licenseNumber: 'PSY345678',
      specialization: ['Trauma', 'PTSD', 'Mindfulness'],
      experienceYears: 10,
      qualifications: ['PhD Psychology', 'Trauma Specialist', 'Mindfulness Instructor'],
      languages: ['English', 'Hindi', 'Urdu'],
      bio: 'Specializes in trauma-informed care and mindfulness-based interventions. Helps students develop resilience and coping strategies.',
      avatarUrl: '',
      isAvailable: true,
      rating: 4.7,
      totalSessions: 190
    }
  ];

  // Mock time slots
  const timeSlots: TimeSlot[] = [
    { time: '09:00', available: true, date: 'Today' },
    { time: '10:30', available: false, date: 'Today' },
    { time: '14:00', available: true, date: 'Today' },
    { time: '15:30', available: true, date: 'Today' },
    { time: '17:00', available: true, date: 'Today' },
    { time: '09:00', available: true, date: 'Tomorrow' },
    { time: '11:00', available: true, date: 'Tomorrow' },
    { time: '14:30', available: true, date: 'Tomorrow' },
    { time: '16:00', available: false, date: 'Tomorrow' },
  ];

  const handleBookAppointment = async () => {
    if (!selectedCounselor || !selectedDate || !selectedTime) {
      toast.error('Missing Information', 'Please select a date and time for your appointment.');
      return;
    }

    setIsBooking(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success(
        'Appointment Booked!', 
        `Your session with ${selectedCounselor.fullName} is confirmed for ${selectedDate} at ${selectedTime}.`
      );
      
      setShowBookingForm(false);
      setSelectedCounselor(null);
      setSelectedDate('');
      setSelectedTime('');
      setNotes('');
    } catch (error) {
      toast.error('Booking Failed', 'Something went wrong. Please try again.');
    } finally {
      setIsBooking(false);
    }
  };

  const CounselorCard: React.FC<{ counselor: CounselorProfile }> = ({ counselor }) => (
    <Card padding="md" className="hover:shadow-lg transition-all duration-200">
      <div className="flex items-start space-x-4">
        <div className="w-16 h-16 bg-gradient-to-r from-neon-blue-400 to-neon-lavender-400 rounded-full flex items-center justify-center flex-shrink-0">
          <User className="w-8 h-8 text-white" />
        </div>
        
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-900">{counselor.fullName}</h3>
            <div className="flex items-center space-x-1">
              <Star className="w-4 h-4 text-yellow-500 fill-current" />
              <span className="text-sm font-medium text-gray-700">{counselor.rating}</span>
              <span className="text-xs text-gray-500">({counselor.totalSessions} sessions)</span>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 mb-3">
            {counselor.specialization.map((spec, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-neon-mint-100 text-neon-mint-700 rounded-full text-xs font-medium"
              >
                {spec}
              </span>
            ))}
          </div>
          
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{counselor.bio}</p>
          
            <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 text-xs text-gray-500">
              <span>{counselor.experienceYears} years exp</span>
              <span>•</span>
              <span>Languages: {counselor.languages.join(', ')}</span>
              <span>•</span>
              <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">FREE Session</span>
            </div>
            
            <Button
              size="sm"
              onClick={() => {
                setSelectedCounselor(counselor);
                setShowBookingForm(true);
              }}
              disabled={!counselor.isAvailable}
            >
              {counselor.isAvailable ? 'Book Session' : 'Unavailable'}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );

  const BookingModal = (): React.JSX.Element | null => {
    if (!showBookingForm || !selectedCounselor) {
      return null;
    }

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <Card padding="lg" className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Book Session</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowBookingForm(false);
                setSelectedCounselor(null);
              }}
            >
              ✕
            </Button>
          </div>

          {/* Counselor Info */}
          <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg mb-6">
            <div className="w-12 h-12 bg-gradient-to-r from-neon-blue-400 to-neon-lavender-400 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{selectedCounselor.fullName}</h3>
              <p className="text-sm text-gray-600">{selectedCounselor.specialization.join(', ')}</p>
            </div>
          </div>

          {/* Date Selection */}
          <div className="mb-6">
            <h4 className="font-medium text-gray-900 mb-3">Select Date & Time</h4>
            <div className="grid grid-cols-2 gap-4">
              {['Today', 'Tomorrow'].map((date) => (
                <div key={date}>
                  <h5 className="font-medium text-gray-700 mb-2">{date}</h5>
                  <div className="grid grid-cols-2 gap-2">
                    {timeSlots
                      .filter(slot => slot.date === date)
                      .map((slot, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            setSelectedDate(date);
                            setSelectedTime(slot.time);
                          }}
                          disabled={!slot.available}
                          className={`p-2 text-sm rounded-lg border transition-all ${
                            selectedDate === date && selectedTime === slot.time
                              ? 'bg-neon-blue-500 text-white border-neon-blue-500'
                              : slot.available
                              ? 'bg-white hover:bg-gray-50 border-gray-200'
                              : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                          }`}
                        >
                          {slot.time}
                        </button>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Meeting Type */}
          <div className="mb-6">
            <h4 className="font-medium text-gray-900 mb-3">Meeting Type</h4>
            <div className="grid grid-cols-3 gap-3">
              {[
                { type: 'video' as const, icon: Video, label: 'Video Call' },
                { type: 'audio' as const, icon: Phone, label: 'Audio Call' },
                { type: 'in_person' as const, icon: MapPin, label: 'In Person' }
              ].map(({ type, icon: Icon, label }) => (
                <button
                  key={type}
                  onClick={() => setMeetingType(type)}
                  className={`flex flex-col items-center p-3 rounded-lg border transition-all ${
                    meetingType === type
                      ? 'bg-neon-mint-50 border-neon-mint-500 text-neon-mint-700'
                      : 'bg-white hover:bg-gray-50 border-gray-200'
                  }`}
                >
                  <Icon className="w-5 h-5 mb-1" />
                  <span className="text-xs font-medium">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Anonymous Option */}
          <div className="mb-6">
            <label className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="rounded border-blue-300 text-neon-blue-500 focus:ring-neon-blue-200"
              />
              <Shield className="w-5 h-5 text-blue-600" />
              <div>
                <span className="font-medium text-blue-800">Anonymous Session</span>
                <p className="text-sm text-blue-600">Your identity will be kept confidential</p>
              </div>
            </label>
          </div>

          {/* Notes */}
          <div className="mb-6">
            <h4 className="font-medium text-gray-900 mb-2">Notes (Optional)</h4>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-neon-blue-200 focus:border-neon-blue-500"
              placeholder="Briefly describe what you'd like to discuss..."
            />
          </div>

          {/* Actions */}
          <div className="flex space-x-3">
            <Button
              onClick={handleBookAppointment}
              disabled={!selectedDate || !selectedTime || isBooking}
              className="flex-1"
            >
              {isBooking ? (
                <LoadingSpinner size="sm" className="mr-2" />
              ) : (
                <CheckCircle className="w-4 h-4 mr-2" />
              )}
              {isBooking ? 'Booking...' : 'Confirm Booking'}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowBookingForm(false);
                setSelectedCounselor(null);
              }}
            >
              Cancel
            </Button>
          </div>
        </Card>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation 
        userRole="student"
        userName={user?.profile?.fullName || 'Student'}
        onLogout={onLogout}
      />

      <div className="max-w-6xl mx-auto py-6 px-4">
        {/* Header */}
        <div className="bg-gradient-to-r from-neon-mint-500 to-neon-blue-500 rounded-xl p-6 text-white mb-8">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <Calendar className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Free Counseling Sessions</h1>
              <p className="text-blue-100">Book confidential sessions with our qualified counselors at no cost</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Available Counselors */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Available Counselors</h2>
              <div className="space-y-4">
                {counselors.map((counselor, index) => (
                  <CounselorCard key={index} counselor={counselor} />
                ))}
              </div>
            </div>

            {/* Upcoming Appointments */}
            <Card padding="lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Upcoming Sessions</h3>
              
              <div className="space-y-4">
                {/* Mock upcoming appointment */}
                <div className="flex items-center justify-between p-4 bg-neon-mint-50 border border-neon-mint-200 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-neon-mint-500 rounded-full flex items-center justify-center">
                      <Clock className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Dr. Priya Sharma</p>
                      <p className="text-sm text-gray-600">Tomorrow at 3:00 PM • Video Call</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline">Reschedule</Button>
                    <Button size="sm" variant="primary">Join Session</Button>
                  </div>
                </div>

                <div className="text-center py-8 text-gray-500">
                  <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No other upcoming sessions</p>
                  <p className="text-sm">Book a session with one of our counselors above</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Info */}
            <Card padding="md">
              <h3 className="font-semibold text-gray-900 mb-4">Session Information</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Duration:</span>
                  <span className="font-medium">60 minutes</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Response Time:</span>
                  <span className="font-medium">Within 24 hours</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Cancellation:</span>
                  <span className="font-medium">Up to 2 hours before</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Cost:</span>
                  <span className="font-medium text-green-600">FREE</span>
                </div>
              </div>
            </Card>

            {/* Privacy Notice */}
            <Card padding="md" className="bg-blue-50 border-blue-200">
              <div className="text-center">
                <Shield className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <h4 className="font-medium text-blue-800 mb-2">100% Confidential</h4>
                <p className="text-sm text-blue-700">
                  All sessions are completely confidential and protected by counselor-client privilege.
                </p>
              </div>
            </Card>

            {/* Emergency Contacts */}
            <Card padding="md" className="bg-red-50 border-red-200">
              <h4 className="font-medium text-red-800 mb-3">Need Immediate Help?</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-red-700">Emergency:</span>
                  <span className="font-semibold text-red-600">102</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-red-700">Mental Health Helpline:</span>
                  <span className="font-semibold text-red-600">1800-233-3330</span>
                </div>
              </div>
            </Card>

            {/* Other Resources */}
            <Card padding="md">
              <h4 className="font-medium text-gray-900 mb-3">Other Resources</h4>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => navigate('/chat')}
                >
                  AI Chat Support
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => navigate('/resources')}
                >
                  Self-Help Resources
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => navigate('/forum')}
                >
                  Peer Support Forum
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>

      <BookingModal />
      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
    </div>
  );
};

export default Appointments;