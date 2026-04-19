import React, { useState } from 'react';
import { 
  BarChart3, Users, Shield, AlertTriangle, Settings, Database, 
  TrendingUp, Activity, Globe, Clock, FileText, CheckCircle 
} from 'lucide-react';
import { Navigation, Card, Button, LoadingSpinner, ToastContainer, FadeIn } from '../components/ui';
import { User as UserType, DashboardAnalytics } from '../types';
import { useToast } from '../hooks/useToast';

interface AdminDashboardProps {
  user?: UserType;
  onLogout?: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({
  user,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'analytics' | 'resources' | 'settings'>('overview');
  const toast = useToast();

  // Mock admin data
  const systemStats = {
    totalUsers: 2847,
    activeUsers: 1923,
    newUsersToday: 47,
    totalSessions: 15284,
    crisisInterventions: 23,
    systemUptime: '99.9%',
    storageUsed: '67%',
    serverLoad: '34%'
  };

  const platformAnalytics: DashboardAnalytics = {
    overview: {
      totalUsers: 2847,
      activeUsers: 1923,
      totalSessions: 15284,
      averageSessionTime: '24.5 min'
    },
    mentalHealthTrends: {
      currentWeek: {
        moodCheckIns: 892,
        screeningCompleted: 156,
        counselorSessions: 234,
        crisisInterventions: 23
      },
      moodDistribution: {
        'Very Sad': 12,
        'Sad': 23,
        'Okay': 35,
        'Good': 45,
        'Great': 38
      }
    },
    resourceUsage: {
      mostViewedCategory: 'Stress Relief',
      totalResourceViews: 45230,
      averageRating: 4.6,
      topResources: [
        { title: 'Managing Exam Stress', views: 2845 },
        { title: 'Sleep Hygiene Guide', views: 2134 },
        { title: 'Anxiety Coping Strategies', views: 1892 }
      ]
    },
    appointments: {
      totalBooked: 1024,
      completed: 856,
      canceled: 98,
      noShow: 70,
      averageRating: 4.8
    },
    forumActivity: {
      totalPosts: 3456,
      totalReplies: 8934,
      activeDiscussions: 234,
      peerVolunteers: 45
    }
  };

  const recentCrisisAlerts = [
    {
      id: 1,
      userId: 'User #2847',
      severity: 'high',
      timestamp: '15 min ago',
      trigger: 'Suicidal ideation detected',
      status: 'escalated',
      counselor: 'Dr. Sarah Smith'
    },
    {
      id: 2,
      userId: 'User #1923',
      severity: 'medium',
      timestamp: '2 hours ago',
      trigger: 'Repeated low mood scores',
      status: 'monitoring',
      counselor: 'Dr. Raj Kumar'
    },
    {
      id: 3,
      userId: 'User #3045',
      severity: 'high',
      timestamp: '5 hours ago',
      trigger: 'Crisis keywords in chat',
      status: 'resolved',
      counselor: 'Dr. Priya Sharma'
    }
  ];

  const systemHealth = [
    { component: 'Web Server', status: 'healthy', uptime: '99.9%', lastCheck: '2 min ago' },
    { component: 'Database', status: 'healthy', uptime: '99.8%', lastCheck: '1 min ago' },
    { component: 'Chat Service', status: 'warning', uptime: '98.2%', lastCheck: '30 sec ago' },
    { component: 'AI Service', status: 'healthy', uptime: '99.5%', lastCheck: '1 min ago' },
    { component: 'Video Calls', status: 'healthy', uptime: '99.7%', lastCheck: '45 sec ago' }
  ];

  const userManagement = [
    {
      id: 1,
      name: 'Ananya Sharma',
      email: 'ananya.s@university.edu',
      role: 'student',
      status: 'active',
      joinDate: '2024-01-10',
      lastLogin: '2 hours ago'
    },
    {
      id: 2,
      name: 'Dr. Rajesh Kumar',
      email: 'rajesh.kumar@neonexus.com',
      role: 'counselor',
      status: 'active',
      joinDate: '2023-09-15',
      lastLogin: '30 min ago'
    },
    {
      id: 3,
      name: 'Arjun Patel',
      email: 'arjun.p@university.edu',
      role: 'peer_volunteer',
      status: 'active',
      joinDate: '2024-01-05',
      lastLogin: '1 hour ago'
    }
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* System Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card padding="md" className="text-center">
          <Users className="w-8 h-8 text-neon-blue-500 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">{systemStats.totalUsers.toLocaleString()}</div>
          <div className="text-sm text-gray-600">Total Users</div>
          <div className="text-xs text-green-600 mt-1">+{systemStats.newUsersToday} today</div>
        </Card>
        
        <Card padding="md" className="text-center">
          <Activity className="w-8 h-8 text-neon-lavender-500 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">{systemStats.activeUsers.toLocaleString()}</div>
          <div className="text-sm text-gray-600">Active Users</div>
          <div className="text-xs text-gray-500 mt-1">Last 24h</div>
        </Card>
        
        <Card padding="md" className="text-center">
          <BarChart3 className="w-8 h-8 text-neon-mint-500 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">{systemStats.totalSessions.toLocaleString()}</div>
          <div className="text-sm text-gray-600">Total Sessions</div>
          <div className="text-xs text-gray-500 mt-1">All time</div>
        </Card>
        
        <Card padding="md" className="text-center">
          <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">{systemStats.crisisInterventions}</div>
          <div className="text-sm text-gray-600">Crisis Interventions</div>
          <div className="text-xs text-red-600 mt-1">This week</div>
        </Card>
      </div>

      {/* System Health */}
      <Card padding="md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">System Health</h3>
          <span className="text-sm text-green-600 font-medium">All Systems Operational</span>
        </div>
        
        <div className="space-y-3">
          {systemHealth.map((system) => (
            <div key={system.component} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${
                  system.status === 'healthy' ? 'bg-green-500' : 
                  system.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                }`} />
                <span className="font-medium text-gray-900">{system.component}</span>
              </div>
              <div className="text-right">
                <div className={`text-sm font-medium ${getStatusColor(system.status)}`}>
                  {system.uptime} uptime
                </div>
                <div className="text-xs text-gray-500">
                  Last check: {system.lastCheck}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Crisis Alerts */}
      <Card padding="md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Recent Crisis Alerts</h3>
          <Button variant="outline" size="sm">View All</Button>
        </div>
        
        <div className="space-y-3">
          {recentCrisisAlerts.map((alert) => (
            <FadeIn key={alert.id} delay={100}>
              <div className={`p-3 rounded-lg border ${getSeverityColor(alert.severity)}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-medium">{alert.userId}</span>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        alert.status === 'resolved' ? 'bg-green-100 text-green-800' :
                        alert.status === 'escalated' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {alert.status}
                      </span>
                      <span className="text-xs opacity-75">{alert.timestamp}</span>
                    </div>
                    <p className="text-sm mb-1">{alert.trigger}</p>
                    <p className="text-xs text-gray-600">Assigned to: {alert.counselor}</p>
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
    </div>
  );

  const renderAnalytics = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Platform Analytics</h3>
      
      {/* Mental Health Trends */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card padding="md" className="text-center">
          <div className="text-2xl font-bold text-gray-900">{platformAnalytics.mentalHealthTrends.currentWeek.moodCheckIns}</div>
          <div className="text-sm text-gray-600">Mood Check-ins</div>
          <div className="text-xs text-gray-500">This week</div>
        </Card>
        
        <Card padding="md" className="text-center">
          <div className="text-2xl font-bold text-gray-900">{platformAnalytics.mentalHealthTrends.currentWeek.screeningCompleted}</div>
          <div className="text-sm text-gray-600">Screenings</div>
          <div className="text-xs text-gray-500">This week</div>
        </Card>
        
        <Card padding="md" className="text-center">
          <div className="text-2xl font-bold text-gray-900">{platformAnalytics.mentalHealthTrends.currentWeek.counselorSessions}</div>
          <div className="text-sm text-gray-600">Counselor Sessions</div>
          <div className="text-xs text-gray-500">This week</div>
        </Card>
        
        <Card padding="md" className="text-center">
          <div className="text-2xl font-bold text-gray-900">{platformAnalytics.resourceUsage.totalResourceViews.toLocaleString()}</div>
          <div className="text-sm text-gray-600">Resource Views</div>
          <div className="text-xs text-gray-500">All time</div>
        </Card>
      </div>

      {/* Top Resources */}
      <Card padding="md">
        <h4 className="font-semibold text-gray-900 mb-4">Most Viewed Resources</h4>
        <div className="space-y-3">
          {platformAnalytics.resourceUsage.topResources.map((resource, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="font-medium text-gray-900">{resource.title}</span>
              <span className="text-sm text-gray-600">{resource.views.toLocaleString()} views</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Mood Distribution */}
      <Card padding="md">
        <h4 className="font-semibold text-gray-900 mb-4">Mood Distribution (This Week)</h4>
        <div className="space-y-3">
          {Object.entries(platformAnalytics.mentalHealthTrends.moodDistribution).map(([mood, percentage]) => (
            <div key={mood} className="flex items-center justify-between">
              <span className="text-gray-700">{mood}</span>
              <div className="flex items-center space-x-3">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-neon-blue-500 h-2 rounded-full" 
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="text-sm text-gray-600 w-10">{percentage}%</span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );

  const renderUsers = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">User Management</h3>
        <Button>Add New User</Button>
      </div>
      
      <Card padding="md">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-900">User</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Role</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Last Login</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody>
              {userManagement.map((user) => (
                <tr key={user.id} className="border-b border-gray-100">
                  <td className="py-3 px-4">
                    <div>
                      <div className="font-medium text-gray-900">{user.name}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      user.role === 'student' ? 'bg-blue-100 text-blue-800' :
                      user.role === 'counselor' ? 'bg-purple-100 text-purple-800' :
                      user.role === 'peer_volunteer' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {user.role.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {user.lastLogin}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">Edit</Button>
                      <Button variant="outline" size="sm">Suspend</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
    { id: 'resources', label: 'Resources', icon: FileText },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation 
        userRole="admin"
        userName={user?.profile?.fullName || 'Admin'}
        onLogout={onLogout}
      />

      <div className="max-w-7xl mx-auto py-6 px-4">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-neon-blue-600 rounded-xl p-6 text-white mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Admin Dashboard</h1>
              <p className="text-blue-100 mt-1">
                NEONEXUS Platform Management - Welcome back, {user?.profile?.fullName?.split(' ')[0]}!
              </p>
            </div>
            <div className="text-right">
              <div className="flex items-center space-x-4">
                <div>
                  <div className="text-2xl font-bold">{systemStats.systemUptime}</div>
                  <div className="text-blue-100">System Uptime</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{recentCrisisAlerts.filter(a => a.status === 'pending').length}</div>
                  <div className="text-blue-100">Pending Alerts</div>
                </div>
              </div>
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
                      ? 'border-purple-500 text-purple-600'
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
          {activeTab === 'users' && renderUsers()}
          {activeTab === 'analytics' && renderAnalytics()}
          {activeTab === 'resources' && (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Resource Management</h3>
              <p className="text-gray-600">Manage platform resources, categories, and content...</p>
            </div>
          )}
          {activeTab === 'settings' && (
            <div className="text-center py-12">
              <Settings className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">System Settings</h3>
              <p className="text-gray-600">Configure platform settings and preferences...</p>
            </div>
          )}
        </div>
      </div>

      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
    </div>
  );
};

export default AdminDashboard;