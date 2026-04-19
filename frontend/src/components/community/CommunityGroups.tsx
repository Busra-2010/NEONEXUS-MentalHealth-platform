import React, { useState } from 'react';
import { Users, MapPin, Clock, Calendar, Plus, Search, Filter, UserPlus, Star, Lock, Globe } from 'lucide-react';

interface CommunityGroupsProps {
  searchQuery: string;
}

interface Group {
  id: string;
  name: string;
  description: string;
  type: 'study' | 'support' | 'hobby' | 'wellness';
  privacy: 'public' | 'private';
  memberCount: number;
  maxMembers?: number;
  location?: string;
  schedule?: string;
  tags: string[];
  image: string;
  isJoined: boolean;
  rating: number;
  nextMeeting?: string;
  organizer: {
    name: string;
    role: 'student' | 'peer_volunteer' | 'counselor';
  };
}

const CommunityGroups: React.FC<CommunityGroupsProps> = ({ searchQuery }) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'study' | 'support' | 'hobby' | 'wellness'>('all');
  const [showJoinedOnly, setShowJoinedOnly] = useState(false);

  const mockGroups: Group[] = [
    {
      id: '1',
      name: 'Psychology Study Group',
      description: 'Weekly study sessions for PSY101 students. We meet to discuss course material, share notes, and prepare for exams together.',
      type: 'study',
      privacy: 'public',
      memberCount: 8,
      maxMembers: 12,
      location: 'Library Room 204',
      schedule: 'Wednesdays 7:00 PM',
      tags: ['psychology', 'study', 'psy101'],
      image: '/api/placeholder/300/200',
      isJoined: true,
      rating: 4.8,
      nextMeeting: '2024-01-17T19:00:00Z',
      organizer: {
        name: 'Sahil Koul',
        role: 'student'
      }
    },
    {
      id: '2',
      name: 'Anxiety Support Circle',
      description: 'A safe space for students dealing with anxiety. We share coping strategies, practice mindfulness, and support each other through challenges.',
      type: 'support',
      privacy: 'private',
      memberCount: 15,
      maxMembers: 20,
      location: 'Student Center Room 301',
      schedule: 'Tuesdays 6:00 PM',
      tags: ['anxiety', 'support', 'mindfulness'],
      image: '/api/placeholder/300/200',
      isJoined: false,
      rating: 4.9,
      nextMeeting: '2024-01-16T18:00:00Z',
      organizer: {
        name: 'Dr. Sunaina Dhar',
        role: 'counselor'
      }
    },
    {
      id: '3',
      name: 'Morning Meditation Group',
      description: 'Start your day with mindfulness! Join us for guided meditation sessions every morning. All experience levels welcome.',
      type: 'wellness',
      privacy: 'public',
      memberCount: 25,
      location: 'Campus Quad',
      schedule: 'Daily 7:30 AM',
      tags: ['meditation', 'mindfulness', 'wellness'],
      image: '/api/placeholder/300/200',
      isJoined: true,
      rating: 4.7,
      nextMeeting: '2024-01-16T07:30:00Z',
      organizer: {
        name: 'Tanvi Wani',
        role: 'peer_volunteer'
      }
    },
    {
      id: '4',
      name: 'Computer Science Study Buddies',
      description: 'Collaborative learning for CS courses. We work on assignments together, share resources, and prepare for technical interviews.',
      type: 'study',
      privacy: 'public',
      memberCount: 18,
      maxMembers: 25,
      location: 'Engineering Building Lab 3',
      schedule: 'Mon, Wed, Fri 4:00 PM',
      tags: ['computer-science', 'programming', 'study'],
      image: '/api/placeholder/300/200',
      isJoined: false,
      rating: 4.6,
      nextMeeting: '2024-01-15T16:00:00Z',
      organizer: {
        name: 'Rohan Razdan',
        role: 'student'
      }
    },
    {
      id: '5',
      name: 'Creative Writing Circle',
      description: 'Share your stories, poems, and creative works in a supportive environment. We provide feedback and encouragement for all writers.',
      type: 'hobby',
      privacy: 'public',
      memberCount: 12,
      maxMembers: 15,
      location: 'Arts Building Room 105',
      schedule: 'Thursdays 5:00 PM',
      tags: ['writing', 'creative', 'literature'],
      image: '/api/placeholder/300/200',
      isJoined: false,
      rating: 4.5,
      nextMeeting: '2024-01-18T17:00:00Z',
      organizer: {
        name: 'Ishika Kher',
        role: 'student'
      }
    },
    {
      id: '6',
      name: 'Depression Support Network',
      description: 'A confidential support group for students experiencing depression. Led by licensed counselors with peer support.',
      type: 'support',
      privacy: 'private',
      memberCount: 10,
      maxMembers: 12,
      location: 'Counseling Center',
      schedule: 'Fridays 3:00 PM',
      tags: ['depression', 'support', 'mental-health'],
      image: '/api/placeholder/300/200',
      isJoined: false,
      rating: 4.9,
      nextMeeting: '2024-01-19T15:00:00Z',
      organizer: {
        name: 'Dr. Kamala Tickoo',
        role: 'counselor'
      }
    }
  ];

  const filteredGroups = mockGroups.filter(group => {
    const matchesSearch = searchQuery === '' || 
      group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      group.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      group.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesFilter = activeFilter === 'all' || group.type === activeFilter;
    const matchesJoined = !showJoinedOnly || group.isJoined;
    
    return matchesSearch && matchesFilter && matchesJoined;
  });

  const formatNextMeeting = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return `Tomorrow at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString([], { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit', 
        minute: '2-digit' 
      });
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'study': return 'bg-blue-100 text-blue-800';
      case 'support': return 'bg-purple-100 text-purple-800';
      case 'wellness': return 'bg-green-100 text-green-800';
      case 'hobby': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'counselor': return 'text-green-600';
      case 'peer_volunteer': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex flex-wrap items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filter by type:</span>
            {[
              { id: 'all', label: 'All Groups' },
              { id: 'study', label: 'Study Groups' },
              { id: 'support', label: 'Support Groups' },
              { id: 'wellness', label: 'Wellness' },
              { id: 'hobby', label: 'Hobbies' }
            ].map((filter) => (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id as typeof activeFilter)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors duration-200 ${
                  activeFilter === filter.id
                    ? 'bg-neon-blue-100 text-neon-blue-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
          
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={showJoinedOnly}
                onChange={(e) => setShowJoinedOnly(e.target.checked)}
                className="w-4 h-4 text-neon-blue-600 border-gray-300 rounded focus:ring-neon-blue-500"
              />
              <span>Show only joined groups</span>
            </label>
            
            <button className="flex items-center space-x-2 px-4 py-2 bg-neon-blue-600 text-white rounded-lg hover:bg-neon-blue-700 transition-colors duration-200">
              <Plus className="w-4 h-4" />
              <span>Create Group</span>
            </button>
          </div>
        </div>
      </div>

      {/* Groups Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredGroups.length === 0 ? (
          <div className="col-span-full bg-white rounded-lg shadow-sm p-12 text-center border border-gray-200">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No groups found</h3>
            <p className="text-gray-500">
              {searchQuery ? 'Try adjusting your search terms' : 'Be the first to create a group in this category'}
            </p>
          </div>
        ) : (
          filteredGroups.map((group) => (
            <div
              key={group.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200"
            >
              {/* Group Image */}
              <div className="h-32 bg-gradient-to-r from-neon-blue-400 to-neon-lavender-400 relative">
                <div className="absolute inset-0 bg-black bg-opacity-20"></div>
                <div className="absolute top-4 left-4 flex space-x-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(group.type)}`}>
                    {group.type.charAt(0).toUpperCase() + group.type.slice(1)}
                  </span>
                  {group.privacy === 'private' && (
                    <span className="bg-gray-800 bg-opacity-70 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center">
                      <Lock className="w-3 h-3 mr-1" />
                      Private
                    </span>
                  )}
                </div>
                <div className="absolute top-4 right-4">
                  <div className="bg-white bg-opacity-90 px-2 py-1 rounded-full flex items-center space-x-1">
                    <Star className="w-3 h-3 text-yellow-500 fill-current" />
                    <span className="text-xs font-medium">{group.rating}</span>
                  </div>
                </div>
              </div>

              {/* Group Content */}
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
                    {group.name}
                  </h3>
                  <div className="flex items-center text-sm text-gray-500">
                    <Users className="w-4 h-4 mr-1" />
                    {group.memberCount}
                    {group.maxMembers && `/${group.maxMembers}`}
                  </div>
                </div>

                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {group.description}
                </p>

                {/* Group Details */}
                <div className="space-y-2 mb-4">
                  {group.location && (
                    <div className="flex items-center text-sm text-gray-500">
                      <MapPin className="w-4 h-4 mr-2" />
                      {group.location}
                    </div>
                  )}
                  {group.schedule && (
                    <div className="flex items-center text-sm text-gray-500">
                      <Clock className="w-4 h-4 mr-2" />
                      {group.schedule}
                    </div>
                  )}
                  {group.nextMeeting && (
                    <div className="flex items-center text-sm text-gray-600 font-medium">
                      <Calendar className="w-4 h-4 mr-2" />
                      Next: {formatNextMeeting(group.nextMeeting)}
                    </div>
                  )}
                </div>

                {/* Organizer */}
                <div className="flex items-center justify-between mb-4">
                  <div className="text-sm text-gray-500">
                    Organized by{' '}
                    <span className={`font-medium ${getRoleColor(group.organizer.role)}`}>
                      {group.organizer.name}
                    </span>
                  </div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1 mb-4">
                  {group.tags.slice(0, 3).map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                    >
                      #{tag}
                    </span>
                  ))}
                  {group.tags.length > 3 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                      +{group.tags.length - 3} more
                    </span>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3">
                  {group.isJoined ? (
                    <div className="flex space-x-2 w-full">
                      <button className="flex-1 px-4 py-2 bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100 transition-colors duration-200 text-sm font-medium">
                        Joined
                      </button>
                      <button className="px-4 py-2 bg-neon-blue-600 text-white rounded-lg hover:bg-neon-blue-700 transition-colors duration-200 text-sm font-medium">
                        View Details
                      </button>
                    </div>
                  ) : (
                    <div className="flex space-x-2 w-full">
                      <button className="flex-1 flex items-center justify-center px-4 py-2 bg-neon-blue-600 text-white rounded-lg hover:bg-neon-blue-700 transition-colors duration-200 text-sm font-medium">
                        <UserPlus className="w-4 h-4 mr-2" />
                        {group.privacy === 'private' ? 'Request to Join' : 'Join Group'}
                      </button>
                      <button className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors duration-200 text-sm font-medium">
                        View Details
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Quick Stats */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Community Stats</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-neon-blue-600">{mockGroups.length}</div>
            <div className="text-sm text-gray-500">Total Groups</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {mockGroups.filter(g => g.isJoined).length}
            </div>
            <div className="text-sm text-gray-500">Your Groups</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {mockGroups.reduce((sum, g) => sum + g.memberCount, 0)}
            </div>
            <div className="text-sm text-gray-500">Total Members</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {mockGroups.filter(g => g.nextMeeting && new Date(g.nextMeeting) > new Date()).length}
            </div>
            <div className="text-sm text-gray-500">Upcoming Meetings</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommunityGroups;