import React, { useState } from 'react';
import { TrendingUp, Users, Calendar, MessageCircle, Star, Clock, ArrowRight, Hash, Crown, Award, Heart, Flame } from 'lucide-react';

interface CommunitySidebarProps {
  activeTab: 'forum' | 'groups' | 'events';
}

interface TrendingTopic {
  id: string;
  tag: string;
  postCount: number;
  trend: 'up' | 'down' | 'stable';
}

interface ActiveUser {
  id: string;
  name: string;
  role: 'student' | 'peer_volunteer' | 'counselor';
  badge?: string;
  avatar: string;
  recentActivity: string;
  contributionScore: number;
}

interface QuickStat {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const CommunitySidebar: React.FC<CommunitySidebarProps> = ({ activeTab }) => {
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month'>('week');

  const trendingTopics: TrendingTopic[] = [
    { id: '1', tag: 'finals-stress', postCount: 45, trend: 'up' },
    { id: '2', tag: 'study-tips', postCount: 32, trend: 'up' },
    { id: '3', tag: 'anxiety', postCount: 28, trend: 'stable' },
    { id: '4', tag: 'mindfulness', postCount: 24, trend: 'up' },
    { id: '5', tag: 'time-management', postCount: 19, trend: 'down' },
    { id: '6', tag: 'depression', postCount: 16, trend: 'stable' },
    { id: '7', tag: 'peer-support', postCount: 14, trend: 'up' },
  ];

  const activeUsers: ActiveUser[] = [
    {
      id: '1',
      name: 'Sahil Koul',
      role: 'student',
      badge: 'Top Contributor',
      avatar: '/api/placeholder/32/32',
      recentActivity: 'Created helpful post in #academics',
      contributionScore: 1250
    },
    {
      id: '2',
      name: 'Dr. Sunaina Dhar',
      role: 'counselor',
      badge: 'Licensed Counselor',
      avatar: '/api/placeholder/32/32',
      recentActivity: 'Answered question in #support',
      contributionScore: 980
    },
    {
      id: '3',
      name: 'Tanvi Wani',
      role: 'peer_volunteer',
      badge: 'Peer Volunteer',
      avatar: '/api/placeholder/32/32',
      recentActivity: 'Organized study group',
      contributionScore: 875
    },
    {
      id: '4',
      name: 'Rohan Razdan',
      role: 'student',
      avatar: '/api/placeholder/32/32',
      recentActivity: 'Shared wellness resources',
      contributionScore: 650
    },
    {
      id: '5',
      name: 'Ishika Kher',
      role: 'student',
      avatar: '/api/placeholder/32/32',
      recentActivity: 'Participated in discussion',
      contributionScore: 520
    }
  ];

  const getQuickStats = (): QuickStat[] => {
    switch (activeTab) {
      case 'forum':
        return [
          { label: 'Active Posts', value: '127', icon: MessageCircle, color: 'text-blue-600' },
          { label: 'Daily Discussions', value: '23', icon: TrendingUp, color: 'text-green-600' },
          { label: 'New Members', value: '8', icon: Users, color: 'text-purple-600' },
          { label: 'Helpful Answers', value: '45', icon: Heart, color: 'text-pink-600' }
        ];
      case 'groups':
        return [
          { label: 'Active Groups', value: '34', icon: Users, color: 'text-blue-600' },
          { label: 'Study Sessions', value: '12', icon: Calendar, color: 'text-green-600' },
          { label: 'Support Circles', value: '8', icon: Heart, color: 'text-purple-600' },
          { label: 'New Meetups', value: '6', icon: Star, color: 'text-orange-600' }
        ];
      case 'events':
        return [
          { label: 'This Week', value: '15', icon: Calendar, color: 'text-blue-600' },
          { label: 'Registered', value: '180', icon: Users, color: 'text-green-600' },
          { label: 'Workshops', value: '7', icon: Star, color: 'text-purple-600' },
          { label: 'Free Events', value: '12', icon: Heart, color: 'text-pink-600' }
        ];
      default:
        return [];
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'counselor': return 'text-green-600 bg-green-50 border-green-200';
      case 'peer_volunteer': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-3 h-3 text-green-500" />;
      case 'down': return <TrendingUp className="w-3 h-3 text-red-500 rotate-180" />;
      default: return <div className="w-3 h-3 bg-gray-300 rounded-full" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
        <div className="grid grid-cols-2 gap-4">
          {getQuickStats().map((stat, index) => (
            <div key={index} className="text-center">
              <div className={`text-2xl font-bold ${stat.color}`}>
                {stat.value}
              </div>
              <div className="text-sm text-gray-500 flex items-center justify-center mt-1">
                <stat.icon className="w-3 h-3 mr-1" />
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Trending Topics */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Flame className="w-5 h-5 mr-2 text-orange-500" />
            Trending
          </h3>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as typeof timeRange)}
            className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:ring-2 focus:ring-neon-blue-500 focus:border-transparent"
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
        </div>
        
        <div className="space-y-3">
          {trendingTopics.slice(0, 7).map((topic, index) => (
            <div key={topic.id} className="flex items-center justify-between hover:bg-gray-50 p-2 rounded-lg transition-colors duration-200 cursor-pointer">
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-6 h-6 bg-neon-blue-100 text-neon-blue-700 rounded-full text-xs font-bold">
                  {index + 1}
                </div>
                <div className="flex items-center space-x-2">
                  <Hash className="w-3 h-3 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">
                    {topic.tag}
                  </span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-500">
                  {topic.postCount}
                </span>
                {getTrendIcon(topic.trend)}
              </div>
            </div>
          ))}
        </div>
        
        <button className="w-full mt-4 text-sm text-neon-blue-600 hover:text-neon-blue-800 font-medium flex items-center justify-center">
          View all trending topics
          <ArrowRight className="w-3 h-3 ml-1" />
        </button>
      </div>

      {/* Active Contributors */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Crown className="w-5 h-5 mr-2 text-yellow-500" />
          Top Contributors
        </h3>
        
        <div className="space-y-4">
          {activeUsers.slice(0, 5).map((user, index) => (
            <div key={user.id} className="flex items-start space-x-3 hover:bg-gray-50 p-2 rounded-lg transition-colors duration-200 cursor-pointer">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-r from-neon-blue-400 to-neon-lavender-400 rounded-full flex items-center justify-center">
                  <span className="text-white font-medium text-sm">
                    {user.name.charAt(0)}
                  </span>
                </div>
                {index < 3 && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center">
                    <Award className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getRoleColor(user.role)}`}>
                    {user.name}
                  </span>
                  {user.badge && (
                    <span className="text-xs text-neon-blue-600 font-medium">
                      {user.badge}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 truncate">
                  {user.recentActivity}
                </p>
                <div className="flex items-center mt-1">
                  <div className="flex items-center space-x-1">
                    <Star className="w-3 h-3 text-yellow-500" />
                    <span className="text-xs text-gray-600 font-medium">
                      {user.contributionScore}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <button className="w-full mt-4 text-sm text-neon-blue-600 hover:text-neon-blue-800 font-medium flex items-center justify-center">
          View leaderboard
          <ArrowRight className="w-3 h-3 ml-1" />
        </button>
      </div>

      {/* Upcoming Events (shown only on forum and groups tabs) */}
      {activeTab !== 'events' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Calendar className="w-5 h-5 mr-2 text-purple-500" />
            Upcoming Events
          </h3>
          
          <div className="space-y-3">
            {[
              {
                id: '1',
                title: 'Stress Management Workshop',
                date: 'Today 2:00 PM',
                location: 'Student Center',
                type: 'Workshop',
                spots: 8
              },
              {
                id: '2',
                title: 'Study Skills Masterclass',
                date: 'Tomorrow 6:00 PM',
                location: 'Library',
                type: 'Academic',
                spots: 15
              },
              {
                id: '3',
                title: 'Peer Support Training',
                date: 'Sat 10:00 AM',
                location: 'Room 205',
                type: 'Training',
                spots: 13
              }
            ].map((event) => (
              <div key={event.id} className="border border-gray-200 rounded-lg p-3 hover:border-neon-blue-300 transition-colors duration-200 cursor-pointer">
                <h4 className="font-medium text-sm text-gray-900 mb-1 line-clamp-1">
                  {event.title}
                </h4>
                <div className="flex items-center text-xs text-gray-500 space-x-2 mb-2">
                  <Clock className="w-3 h-3" />
                  <span>{event.date}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">{event.location}</span>
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                    {event.spots} spots left
                  </span>
                </div>
              </div>
            ))}
          </div>
          
          <button className="w-full mt-4 text-sm text-neon-blue-600 hover:text-neon-blue-800 font-medium flex items-center justify-center">
            View all events
            <ArrowRight className="w-3 h-3 ml-1" />
          </button>
        </div>
      )}

      {/* Resource Links */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Links</h3>
        
        <div className="space-y-2">
          {[
            { label: 'Community Guidelines', href: '#' },
            { label: 'Crisis Support', href: '#', urgent: true },
            { label: 'Report Issue', href: '#' },
            { label: 'Mental Health Resources', href: '#' },
            { label: 'Academic Support', href: '#' },
            { label: 'Campus Services', href: '#' }
          ].map((link, index) => (
            <a
              key={index}
              href={link.href}
              className={`block text-sm hover:text-neon-blue-600 transition-colors duration-200 ${
                link.urgent 
                  ? 'text-red-600 font-medium' 
                  : 'text-gray-600'
              }`}
            >
              {link.label}
              {link.urgent && <span className="ml-1">🆘</span>}
            </a>
          ))}
        </div>
      </div>

      {/* Help Section */}
      <div className="bg-gradient-to-r from-neon-blue-50 to-neon-lavender-50 rounded-lg border border-neon-blue-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Need Help?</h3>
        <p className="text-sm text-gray-600 mb-4">
          Our community is here to support you. Don't hesitate to reach out.
        </p>
        <div className="space-y-2">
          <button className="w-full px-4 py-2 bg-neon-blue-600 text-white rounded-lg hover:bg-neon-blue-700 transition-colors duration-200 text-sm font-medium">
            Start a Discussion
          </button>
          <button className="w-full px-4 py-2 bg-white text-neon-blue-600 border border-neon-blue-300 rounded-lg hover:bg-neon-blue-50 transition-colors duration-200 text-sm font-medium">
            Find Support Groups
          </button>
        </div>
      </div>
    </div>
  );
};

export default CommunitySidebar;