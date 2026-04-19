import React, { useState } from 'react';
import { Calendar, Clock, MapPin, Users, BookmarkPlus, Share, ExternalLink, Filter, Plus, Star, Tag } from 'lucide-react';

interface CommunityEventsProps {
  searchQuery: string;
}

interface Event {
  id: string;
  title: string;
  description: string;
  type: 'workshop' | 'seminar' | 'support' | 'wellness' | 'social' | 'academic';
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  isOnline: boolean;
  capacity: number;
  registeredCount: number;
  isRegistered: boolean;
  isFree: boolean;
  price?: number;
  tags: string[];
  organizer: {
    name: string;
    role: 'student' | 'peer_volunteer' | 'counselor' | 'admin';
    department?: string;
  };
  image: string;
  registrationDeadline?: string;
  requirements?: string[];
  isBookmarked?: boolean;
}

const CommunityEvents: React.FC<CommunityEventsProps> = ({ searchQuery }) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'upcoming' | 'today' | 'registered'>('all');
  const [eventTypeFilter, setEventTypeFilter] = useState<'all' | Event['type']>('all');

  const mockEvents: Event[] = [
    {
      id: '1',
      title: 'Mindfulness and Stress Management Workshop',
      description: 'Learn practical techniques for managing stress and anxiety through mindfulness practices. This interactive workshop will cover breathing exercises, progressive muscle relaxation, and meditation techniques.',
      type: 'wellness',
      date: '2024-01-18',
      startTime: '14:00',
      endTime: '16:00',
      location: 'Student Wellness Center',
      isOnline: false,
      capacity: 30,
      registeredCount: 18,
      isRegistered: true,
      isFree: true,
      tags: ['mindfulness', 'stress-management', 'wellness'],
      organizer: {
        name: 'Dr. Meera Koul',
        role: 'counselor',
        department: 'Student Counseling Services'
      },
      image: '/api/placeholder/400/250',
      registrationDeadline: '2024-01-17T12:00:00Z',
      requirements: ['No prior experience required'],
      isBookmarked: true
    },
    {
      id: '2',
      title: 'Study Skills Masterclass',
      description: 'Improve your academic performance with proven study techniques. We\'ll cover note-taking strategies, time management, and effective study methods for different learning styles.',
      type: 'academic',
      date: '2024-01-16',
      startTime: '18:00',
      endTime: '20:00',
      location: 'Library Auditorium',
      isOnline: false,
      capacity: 50,
      registeredCount: 35,
      isRegistered: false,
      isFree: true,
      tags: ['study-skills', 'academic', 'productivity'],
      organizer: {
        name: 'Academic Success Center',
        role: 'admin',
        department: 'Academic Affairs'
      },
      image: '/api/placeholder/400/250',
      registrationDeadline: '2024-01-16T08:00:00Z'
    },
    {
      id: '3',
      title: 'Peer Support Training Session',
      description: 'Join our comprehensive training program to become a certified peer volunteer. Learn active listening, crisis intervention basics, and how to provide emotional support to fellow students.',
      type: 'support',
      date: '2024-01-20',
      startTime: '10:00',
      endTime: '15:00',
      location: 'Student Center Room 205',
      isOnline: false,
      capacity: 25,
      registeredCount: 12,
      isRegistered: false,
      isFree: true,
      tags: ['peer-support', 'training', 'volunteer'],
      organizer: {
        name: 'Tanvi Wani',
        role: 'peer_volunteer',
        department: 'Peer Support Program'
      },
      image: '/api/placeholder/400/250',
      registrationDeadline: '2024-01-19T17:00:00Z',
      requirements: ['Commitment to volunteer for at least one semester', 'Basic interview required']
    },
    {
      id: '4',
      title: 'Virtual Career Anxiety Workshop',
      description: 'Overcome career-related stress and anxiety with expert guidance. This online workshop covers interview preparation, networking anxiety, and building confidence in professional settings.',
      type: 'workshop',
      date: '2024-01-19',
      startTime: '16:00',
      endTime: '17:30',
      location: 'Online via Zoom',
      isOnline: true,
      capacity: 100,
      registeredCount: 67,
      isRegistered: true,
      isFree: true,
      tags: ['career', 'anxiety', 'professional-development'],
      organizer: {
        name: 'Career Services',
        role: 'admin',
        department: 'Career Development'
      },
      image: '/api/placeholder/400/250',
      isBookmarked: false
    },
    {
      id: '5',
      title: 'Mental Health First Aid Certification',
      description: 'Get certified in Mental Health First Aid. This comprehensive course teaches you how to identify, understand, and respond to mental health crises and substance use challenges.',
      type: 'seminar',
      date: '2024-01-22',
      startTime: '09:00',
      endTime: '17:00',
      location: 'Health Sciences Building',
      isOnline: false,
      capacity: 40,
      registeredCount: 28,
      isRegistered: false,
      isFree: false,
      price: 25,
      tags: ['mental-health', 'certification', 'first-aid'],
      organizer: {
        name: 'Campus Health Services',
        role: 'admin',
        department: 'Health & Wellness'
      },
      image: '/api/placeholder/400/250',
      registrationDeadline: '2024-01-20T23:59:00Z',
      requirements: ['Must attend full 8-hour session', 'Valid student ID required']
    },
    {
      id: '6',
      title: 'Coffee Chat: Building Campus Connections',
      description: 'Casual meetup to connect with other students over coffee. Share experiences, make friends, and build a supportive network on campus. Light refreshments provided.',
      type: 'social',
      date: '2024-01-17',
      startTime: '15:00',
      endTime: '16:30',
      location: 'Campus Café',
      isOnline: false,
      capacity: 20,
      registeredCount: 14,
      isRegistered: false,
      isFree: true,
      tags: ['networking', 'social', 'connections'],
      organizer: {
        name: 'Student Activities Board',
        role: 'admin',
        department: 'Student Life'
      },
      image: '/api/placeholder/400/250'
    }
  ];

  const filteredEvents = mockEvents.filter(event => {
    const matchesSearch = searchQuery === '' || 
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const eventDate = new Date(event.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let matchesTimeFilter = true;
    switch (activeFilter) {
      case 'today':
        matchesTimeFilter = eventDate.toDateString() === today.toDateString();
        break;
      case 'upcoming':
        matchesTimeFilter = eventDate >= today;
        break;
      case 'registered':
        matchesTimeFilter = event.isRegistered;
        break;
    }
    
    const matchesTypeFilter = eventTypeFilter === 'all' || event.type === eventTypeFilter;
    
    return matchesSearch && matchesTimeFilter && matchesTypeFilter;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString([], { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  const formatTime = (time: string) => {
    const [hour, minute] = time.split(':');
    const date = new Date();
    date.setHours(parseInt(hour), parseInt(minute));
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'workshop': return 'bg-blue-100 text-blue-800';
      case 'seminar': return 'bg-purple-100 text-purple-800';
      case 'support': return 'bg-green-100 text-green-800';
      case 'wellness': return 'bg-teal-100 text-teal-800';
      case 'social': return 'bg-pink-100 text-pink-800';
      case 'academic': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'counselor': return 'text-green-600';
      case 'peer_volunteer': return 'text-blue-600';
      case 'admin': return 'text-purple-600';
      default: return 'text-gray-600';
    }
  };

  const isEventToday = (dateString: string) => {
    const eventDate = new Date(dateString);
    const today = new Date();
    return eventDate.toDateString() === today.toDateString();
  };

  const isRegistrationClosed = (deadlineString?: string) => {
    if (!deadlineString) return false;
    return new Date(deadlineString) < new Date();
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Time:</span>
              {[
                { id: 'all', label: 'All Events' },
                { id: 'today', label: 'Today' },
                { id: 'upcoming', label: 'Upcoming' },
                { id: 'registered', label: 'My Events' }
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

            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">Type:</span>
              {[
                { id: 'all', label: 'All' },
                { id: 'workshop', label: 'Workshops' },
                { id: 'wellness', label: 'Wellness' },
                { id: 'academic', label: 'Academic' },
                { id: 'support', label: 'Support' }
              ].map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setEventTypeFilter(filter.id as typeof eventTypeFilter)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors duration-200 ${
                    eventTypeFilter === filter.id
                      ? 'bg-neon-lavender-100 text-neon-lavender-700'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
          
          <button className="flex items-center space-x-2 px-4 py-2 bg-neon-blue-600 text-white rounded-lg hover:bg-neon-blue-700 transition-colors duration-200">
            <Plus className="w-4 h-4" />
            <span>Create Event</span>
          </button>
        </div>
      </div>

      {/* Events List */}
      <div className="space-y-4">
        {filteredEvents.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center border border-gray-200">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No events found</h3>
            <p className="text-gray-500">
              {searchQuery ? 'Try adjusting your search terms' : 'Check back later for new events'}
            </p>
          </div>
        ) : (
          filteredEvents.map((event) => (
            <div
              key={event.id}
              className={`bg-white rounded-lg shadow-sm border overflow-hidden hover:shadow-md transition-shadow duration-200 ${
                isEventToday(event.date) ? 'border-neon-blue-300 bg-neon-blue-50' : 'border-gray-200'
              }`}
            >
              <div className="p-6">
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Event Image */}
                  <div className="lg:w-48 lg:flex-shrink-0">
                    <div className="h-32 lg:h-full bg-gradient-to-r from-neon-blue-400 to-neon-lavender-400 rounded-lg relative overflow-hidden">
                      <div className="absolute inset-0 bg-black bg-opacity-20"></div>
                      <div className="absolute top-2 left-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(event.type)}`}>
                          {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
                        </span>
                      </div>
                      {isEventToday(event.date) && (
                        <div className="absolute top-2 right-2">
                          <span className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold animate-pulse">
                            TODAY
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Event Content */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-xl font-semibold text-gray-900 line-clamp-2">
                        {event.title}
                      </h3>
                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          className={`p-2 rounded-lg transition-colors duration-200 ${
                            event.isBookmarked 
                              ? 'text-yellow-600 bg-yellow-50 hover:bg-yellow-100' 
                              : 'text-gray-400 hover:text-yellow-600 hover:bg-yellow-50'
                          }`}
                        >
                          <BookmarkPlus className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200">
                          <Share className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <p className="text-gray-600 mb-4 line-clamp-2">
                      {event.description}
                    </p>

                    {/* Event Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="space-y-2">
                        <div className="flex items-center text-sm text-gray-600">
                          <Calendar className="w-4 h-4 mr-2" />
                          <span className="font-medium">{formatDate(event.date)}</span>
                          <span className="ml-2">
                            {formatTime(event.startTime)} - {formatTime(event.endTime)}
                          </span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <MapPin className="w-4 h-4 mr-2" />
                          <span>{event.location}</span>
                          {event.isOnline && (
                            <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">
                              Online
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center text-sm text-gray-600">
                          <Users className="w-4 h-4 mr-2" />
                          <span>
                            {event.registeredCount}/{event.capacity} registered
                          </span>
                        </div>
                        <div className="text-sm text-gray-600">
                          <span className={`font-medium ${getRoleColor(event.organizer.role)}`}>
                            {event.organizer.name}
                          </span>
                          {event.organizer.department && (
                            <span className="text-gray-500"> · {event.organizer.department}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1 mb-4">
                      {event.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full flex items-center"
                        >
                          <Tag className="w-3 h-3 mr-1" />
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* Price and Registration */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="text-lg font-semibold">
                          {event.isFree ? (
                            <span className="text-green-600">Free</span>
                          ) : (
                            <span className="text-gray-900">${event.price}</span>
                          )}
                        </div>
                        {event.registrationDeadline && (
                          <div className="text-sm text-gray-500">
                            Registration deadline: {new Date(event.registrationDeadline).toLocaleDateString()}
                          </div>
                        )}
                      </div>

                      <div className="flex space-x-3">
                        {event.isRegistered ? (
                          <div className="flex space-x-2">
                            <span className="px-4 py-2 bg-green-50 text-green-700 border border-green-200 rounded-lg text-sm font-medium">
                              ✓ Registered
                            </span>
                            <button className="px-4 py-2 bg-neon-blue-600 text-white rounded-lg hover:bg-neon-blue-700 transition-colors duration-200 text-sm font-medium flex items-center">
                              <ExternalLink className="w-4 h-4 mr-2" />
                              Join Event
                            </button>
                          </div>
                        ) : (
                          <div className="flex space-x-2">
                            <button className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors duration-200 text-sm font-medium">
                              View Details
                            </button>
                            <button
                              disabled={
                                event.registeredCount >= event.capacity ||
                                isRegistrationClosed(event.registrationDeadline)
                              }
                              className="px-4 py-2 bg-neon-blue-600 text-white rounded-lg hover:bg-neon-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200 text-sm font-medium"
                            >
                              {event.registeredCount >= event.capacity 
                                ? 'Full'
                                : isRegistrationClosed(event.registrationDeadline)
                                ? 'Registration Closed'
                                : 'Register'
                              }
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CommunityEvents;