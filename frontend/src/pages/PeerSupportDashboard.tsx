import React, { useState } from 'react';
import { Users, MessageCircle, AlertTriangle, Clock, Heart, Award, TrendingUp, CheckCircle } from 'lucide-react';
import { Navigation, Card, Button, LoadingSpinner, ToastContainer, FadeIn } from '../components/ui';
import { User as UserType, PeerVolunteer } from '../types';
import { useToast } from '../hooks/useToast';

interface PeerSupportDashboardProps {
  user?: UserType;
  onLogout?: () => void;
}

const PeerSupportDashboard: React.FC<PeerSupportDashboardProps> = ({
  user,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<'queue' | 'sessions' | 'resources' | 'analytics'>('queue');
  const [isOnline, setIsOnline] = useState(true);
  const toast = useToast();

  // Mock data for peer support
  const peerStats = {
    studentsHelped: 47,
    sessionsToday: 8,
    averageRating: 4.8,
    responseTime: '2.3 min',
    hoursVolunteered: 156,
    badgesEarned: 12
  };

  const supportQueue = [
    {
      id: 1,
      studentName: 'Anonymous Student #1',
      issue: 'Academic Stress',
      urgency: 'medium',
      waitTime: '5 min',
      mood: 2,
      description: 'Struggling with upcoming exams and feeling overwhelmed'
    },
    {
      id: 2,
      studentName: 'Anonymous Student #2',
      issue: 'Social Anxiety',
      urgency: 'high',
      waitTime: '12 min',
      mood: 2,
      description: 'Having difficulty making friends in new semester'
    },
    {
      id: 3,
      studentName: 'Anonymous Student #3',
      issue: 'Time Management',
      urgency: 'low',
      waitTime: '3 min',
      mood: 3,
      description: 'Need help organizing study schedule'
    }
  ];

  const activeSessions = [
    {
      id: 1,
      studentName: 'Anonymous Student #A',
      duration: '15 min',
      issue: 'Relationship Issues',
      status: 'active'
    },
    {
      id: 2,
      studentName: 'Anonymous Student #B',
      duration: '28 min',
      issue: 'Career Anxiety',
      status: 'active'
    }
  ];

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleAcceptSupport = (studentId: number) => {
    toast.success('Session Started', 'You are now connected with the student');
  };

  const handleToggleOnlineStatus = () => {
    setIsOnline(!isOnline);
    toast.info(
      isOnline ? 'Going Offline' : 'Coming Online',
      isOnline ? 'You won\'t receive new support requests' : 'You\'re now available for support'
    );
  };

  const renderQueue = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Support Queue</h3>
        <div className="flex items-center space-x-4">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            isOnline ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
          }`}>
            {isOnline ? '🟢 Online' : '⚪ Offline'}
          </span>
          <Button
            variant={isOnline ? 'outline' : 'primary'}
            onClick={handleToggleOnlineStatus}
          >
            {isOnline ? 'Go Offline' : 'Go Online'}
          </Button>
        </div>
      </div>

      {supportQueue.length === 0 ? (
        <Card padding="lg" className="text-center">
          <Heart className="w-16 h-16 text-neon-mint-400 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">No Students in Queue</h4>
          <p className="text-gray-600">Great job! All students have been helped.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {supportQueue.map((request) => (
            <FadeIn key={request.id} delay={100}>
              <Card padding="md" className="hover:shadow-lg transition-all duration-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="font-semibold text-gray-900">{request.studentName}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs border ${getUrgencyColor(request.urgency)}`}>
                        {request.urgency.charAt(0).toUpperCase() + request.urgency.slice(1)}
                      </span>
                      <span className="text-sm text-gray-500">Mood: {request.mood}/5</span>
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                      <span className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        Waiting: {request.waitTime}
                      </span>
                      <span className="flex items-center">
                        <AlertTriangle className="w-4 h-4 mr-1" />
                        {request.issue}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-700 mb-4">{request.description}</p>
                  </div>
                  
                  <Button
                    onClick={() => handleAcceptSupport(request.id)}
                    className="ml-4"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Accept
                  </Button>
                </div>
              </Card>
            </FadeIn>
          ))}
        </div>
      )}
    </div>
  );

  const renderActiveSessions = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Active Sessions</h3>
      
      {activeSessions.length === 0 ? (
        <Card padding="lg" className="text-center">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">No Active Sessions</h4>
          <p className="text-gray-600">Start helping students from the support queue.</p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {activeSessions.map((session) => (
            <Card key={session.id} padding="md" className="border-l-4 border-neon-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-gray-900">{session.studentName}</h4>
                  <p className="text-sm text-gray-600">{session.issue}</p>
                  <div className="flex items-center mt-2 text-sm text-gray-500">
                    <Clock className="w-4 h-4 mr-1" />
                    Duration: {session.duration}
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">
                    End Session
                  </Button>
                  <Button size="sm">
                    Continue Chat
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  const renderAnalytics = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Your Impact</h3>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <Card padding="md" className="text-center">
          <Users className="w-8 h-8 text-neon-blue-500 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">{peerStats.studentsHelped}</div>
          <div className="text-sm text-gray-600">Students Helped</div>
        </Card>
        
        <Card padding="md" className="text-center">
          <MessageCircle className="w-8 h-8 text-neon-lavender-500 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">{peerStats.sessionsToday}</div>
          <div className="text-sm text-gray-600">Sessions Today</div>
        </Card>
        
        <Card padding="md" className="text-center">
          <Award className="w-8 h-8 text-neon-mint-500 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">{peerStats.averageRating}</div>
          <div className="text-sm text-gray-600">Average Rating</div>
        </Card>
        
        <Card padding="md" className="text-center">
          <Clock className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">{peerStats.responseTime}</div>
          <div className="text-sm text-gray-600">Avg Response</div>
        </Card>
        
        <Card padding="md" className="text-center">
          <Heart className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">{peerStats.hoursVolunteered}</div>
          <div className="text-sm text-gray-600">Hours Volunteered</div>
        </Card>
        
        <Card padding="md" className="text-center">
          <TrendingUp className="w-8 h-8 text-green-500 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">{peerStats.badgesEarned}</div>
          <div className="text-sm text-gray-600">Badges Earned</div>
        </Card>
      </div>

      {/* Recent Achievements */}
      <Card padding="md">
        <h4 className="font-semibold text-gray-900 mb-4">Recent Achievements</h4>
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span className="text-sm text-gray-700">Helped 10 students this week</span>
            <span className="text-xs text-gray-500">2 days ago</span>
          </div>
          <div className="flex items-center space-x-3">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span className="text-sm text-gray-700">Maintained 4.8+ rating for a month</span>
            <span className="text-xs text-gray-500">1 week ago</span>
          </div>
          <div className="flex items-center space-x-3">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span className="text-sm text-gray-700">Completed Crisis Intervention Training</span>
            <span className="text-xs text-gray-500">2 weeks ago</span>
          </div>
        </div>
      </Card>
    </div>
  );

  const tabs = [
    { id: 'queue', label: 'Support Queue', icon: Users },
    { id: 'sessions', label: 'Active Sessions', icon: MessageCircle },
    { id: 'resources', label: 'Resources', icon: Heart },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation 
        userRole="peer_volunteer"
        userName={user?.profile?.fullName || 'Peer Volunteer'}
        onLogout={onLogout}
      />

      <div className="max-w-7xl mx-auto py-6 px-4">
        {/* Header */}
        <div className="bg-gradient-to-r from-neon-mint-500 to-neon-blue-500 rounded-xl p-6 text-white mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Peer Support Dashboard</h1>
              <p className="text-blue-100 mt-1">
                Welcome back, {user?.profile?.fullName?.split(' ')[0]}! Help make a difference today.
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{supportQueue.length}</div>
              <div className="text-blue-100">Students waiting</div>
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
                      ? 'border-neon-blue-500 text-neon-blue-600'
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
          {activeTab === 'queue' && renderQueue()}
          {activeTab === 'sessions' && renderActiveSessions()}
          {activeTab === 'resources' && (
            <div className="text-center py-12">
              <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Resource Library</h3>
              <p className="text-gray-600">Helpful resources and guides coming soon...</p>
            </div>
          )}
          {activeTab === 'analytics' && renderAnalytics()}
        </div>
      </div>

      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
    </div>
  );
};

export default PeerSupportDashboard;