import React, { useState } from 'react';
import { Calendar, Users, FileText, AlertTriangle, Clock, Star, TrendingUp, Phone, Video, MapPin } from 'lucide-react';
import { Navigation, Card, Button, LoadingSpinner, ToastContainer, FadeIn } from '../components/ui';
import { User as UserType, Appointment, CounselorMetric } from '../types';
import { useToast } from '../hooks/useToast';

interface CounselorDashboardProps {
  user?: UserType;
  onLogout?: () => void;
}

const CounselorDashboard: React.FC<CounselorDashboardProps> = ({
  user,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'appointments' | 'clients' | 'analytics'>('overview');
  const [isAvailable, setIsAvailable] = useState(true);
  const toast = useToast();

  // Mock counselor data
  const counselorStats = {
    totalClients: 89,
    sessionsThisWeek: 23,
    averageRating: 4.9,
    responseTime: '1.2 hours',
    completionRate: 94,
    crisisInterventions: 3
  };

  const todayAppointments = [
    {
      id: '1',
      studentId: 101,
      studentName: 'Anonymous Student A',
      appointmentDate: '2024-01-15',
      appointmentTime: '10:00',
      durationMinutes: 60,
      status: 'confirmed' as const,
      meetingType: 'video' as const,
      isAnonymous: true,
      notes: 'First session - anxiety assessment',
      rating: undefined
    },
    {
      id: '2',
      studentId: 102,
      studentName: 'Anonymous Student B',
      appointmentDate: '2024-01-15',
      appointmentTime: '14:00',
      durationMinutes: 60,
      status: 'confirmed' as const,
      meetingType: 'audio' as const,
      isAnonymous: true,
      notes: 'Follow-up session for depression treatment'
    },
    {
      id: '3',
      studentId: 103,
      studentName: 'Anonymous Student C',
      appointmentDate: '2024-01-15',
      appointmentTime: '16:30',
      durationMinutes: 60,
      status: 'scheduled' as const,
      meetingType: 'in_person' as const,
      isAnonymous: false,
      notes: 'Academic stress management'
    }
  ];

  const crisisAlerts = [
    {
      id: 1,
      studentId: 'Anonymous Student X',
      severity: 'high',
      timestamp: '2 hours ago',
      trigger: 'Crisis keywords detected in chat',
      status: 'pending'
    },
    {
      id: 2,
      studentId: 'Anonymous Student Y',
      severity: 'medium',
      timestamp: '5 hours ago',
      trigger: 'Low mood scores (1/5) for 3 consecutive days',
      status: 'reviewed'
    }
  ];

  const clientProgress = [
    {
      id: 1,
      studentName: 'Student A',
      sessions: 8,
      lastSession: '2 days ago',
      progress: 'Improving',
      moodTrend: 'up',
      nextAppointment: '2024-01-17 10:00'
    },
    {
      id: 2,
      studentName: 'Student B',
      sessions: 3,
      lastSession: '1 week ago',
      progress: 'Stable',
      moodTrend: 'stable',
      nextAppointment: '2024-01-18 14:00'
    }
  ];

  const getMeetingIcon = (type: string) => {
    switch (type) {
      case 'video': return Video;
      case 'audio': return Phone;
      case 'in_person': return MapPin;
      default: return Video;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleToggleAvailability = () => {
    setIsAvailable(!isAvailable);
    toast.info(
      isAvailable ? 'Marked as Unavailable' : 'Marked as Available',
      isAvailable ? 'New appointments will be paused' : 'You can receive new appointments'
    );
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <Card padding="md" className="text-center">
          <Users className="w-8 h-8 text-neon-blue-500 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">{counselorStats.totalClients}</div>
          <div className="text-sm text-gray-600">Total Clients</div>
        </Card>
        
        <Card padding="md" className="text-center">
          <Calendar className="w-8 h-8 text-neon-lavender-500 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">{counselorStats.sessionsThisWeek}</div>
          <div className="text-sm text-gray-600">Sessions This Week</div>
        </Card>
        
        <Card padding="md" className="text-center">
          <Star className="w-8 h-8 text-neon-mint-500 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">{counselorStats.averageRating}</div>
          <div className="text-sm text-gray-600">Average Rating</div>
        </Card>
        
        <Card padding="md" className="text-center">
          <Clock className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">{counselorStats.responseTime}</div>
          <div className="text-sm text-gray-600">Avg Response</div>
        </Card>
        
        <Card padding="md" className="text-center">
          <TrendingUp className="w-8 h-8 text-green-500 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">{counselorStats.completionRate}%</div>
          <div className="text-sm text-gray-600">Completion Rate</div>
        </Card>
        
        <Card padding="md" className="text-center">
          <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">{counselorStats.crisisInterventions}</div>
          <div className="text-sm text-gray-600">Crisis Interventions</div>
        </Card>
      </div>

      {/* Crisis Alerts */}
      <Card padding="md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Crisis Alerts</h3>
          <Button variant="outline" size="sm">View All</Button>
        </div>
        
        <div className="space-y-3">
          {crisisAlerts.map((alert) => (
            <FadeIn key={alert.id} delay={100}>
              <div className={`p-3 rounded-lg border ${getSeverityColor(alert.severity)}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-medium">{alert.studentId}</span>
                      <span className="text-xs opacity-75">{alert.timestamp}</span>
                    </div>
                    <p className="text-sm">{alert.trigger}</p>
                  </div>
                  <Button size="sm" variant="outline">
                    Review
                  </Button>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </Card>

      {/* Today's Schedule */}
      <Card padding="md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Today's Schedule</h3>
        <div className="space-y-3">
          {todayAppointments.slice(0, 3).map((appointment) => {
            const MeetingIcon = getMeetingIcon(appointment.meetingType);
            return (
              <div key={appointment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <MeetingIcon className="w-5 h-5 text-gray-500" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{appointment.appointmentTime}</div>
                    <div className="text-sm text-gray-600">{appointment.studentName}</div>
                    <div className="text-xs text-gray-500">{appointment.notes}</div>
                  </div>
                </div>
                <Button size="sm">Join Session</Button>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );

  const renderAppointments = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">All Appointments</h3>
        <div className="flex items-center space-x-4">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            isAvailable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {isAvailable ? '🟢 Available' : '🔴 Unavailable'}
          </span>
          <Button
            variant={isAvailable ? 'outline' : 'primary'}
            onClick={handleToggleAvailability}
          >
            {isAvailable ? 'Mark Unavailable' : 'Mark Available'}
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {todayAppointments.map((appointment) => {
          const MeetingIcon = getMeetingIcon(appointment.meetingType);
          return (
            <FadeIn key={appointment.id} delay={100}>
              <Card padding="md" className="hover:shadow-lg transition-all duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <MeetingIcon className="w-6 h-6 text-neon-blue-500" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-semibold text-gray-900">{appointment.studentName}</span>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          appointment.status === 'confirmed' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {appointment.status}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 mb-1">
                        {appointment.appointmentTime} • {appointment.durationMinutes} minutes
                      </div>
                      <div className="text-xs text-gray-500">{appointment.notes}</div>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">Reschedule</Button>
                    <Button size="sm">Start Session</Button>
                  </div>
                </div>
              </Card>
            </FadeIn>
          );
        })}
      </div>
    </div>
  );

  const renderClients = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Client Progress</h3>
      
      <div className="grid gap-4">
        {clientProgress.map((client) => (
          <FadeIn key={client.id} delay={100}>
            <Card padding="md" className="hover:shadow-lg transition-all duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-neon-blue-400 to-neon-lavender-400 rounded-full flex items-center justify-center">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{client.studentName}</h4>
                    <div className="text-sm text-gray-600">
                      {client.sessions} sessions • Last: {client.lastSession}
                    </div>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-xs text-gray-500">Progress:</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        client.progress === 'Improving' 
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {client.progress}
                      </span>
                      <span className="text-xs text-gray-500">
                        Mood: {client.moodTrend === 'up' ? '📈' : '📊'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">
                    <FileText className="w-4 h-4 mr-1" />
                    Notes
                  </Button>
                  <Button size="sm">View Progress</Button>
                </div>
              </div>
            </Card>
          </FadeIn>
        ))}
      </div>
    </div>
  );

  const tabs = [
    { id: 'overview', label: 'Overview', icon: TrendingUp },
    { id: 'appointments', label: 'Appointments', icon: Calendar },
    { id: 'clients', label: 'Clients', icon: Users },
    { id: 'analytics', label: 'Analytics', icon: FileText }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation 
        userRole="counselor"
        userName={user?.profile?.fullName || 'Dr. Counselor'}
        onLogout={onLogout}
      />

      <div className="max-w-7xl mx-auto py-6 px-4">
        {/* Header */}
        <div className="bg-gradient-to-r from-neon-lavender-500 to-neon-mint-500 rounded-xl p-6 text-white mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Counselor Dashboard</h1>
              <p className="text-blue-100 mt-1">
                Welcome back, {user?.profile?.fullName?.split(' ')[0]}! You have {todayAppointments.length} appointments today.
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{crisisAlerts.length}</div>
              <div className="text-blue-100">Crisis alerts</div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <nav className="flex space-x-8 border-b border-gray-200">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-neon-lavender-500 text-neon-lavender-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="mb-8">
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'appointments' && renderAppointments()}
          {activeTab === 'clients' && renderClients()}
          {activeTab === 'analytics' && (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Analytics Dashboard</h3>
              <p className="text-gray-600">Detailed analytics and reports coming soon...</p>
            </div>
          )}
        </div>
      </div>

      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
    </div>
  );
};

export default CounselorDashboard;