import React, { useState, useMemo } from 'react';
import { MessageCircle, Users, Clock, ArrowUp, ArrowDown, Pin, Eye, Heart, Reply } from 'lucide-react';
import ForumPost from './ForumPost';

interface ForumCategoriesProps {
  searchQuery: string;
  selectedCategory: string;
}

interface Post {
  id: string;
  title: string;
  content: string;
  author: {
    name: string;
    avatar: string;
    role: 'student' | 'peer_volunteer' | 'counselor';
    badge?: string;
  };
  category: string;
  tags: string[];
  votes: {
    up: number;
    down: number;
    userVote?: 'up' | 'down' | null;
  };
  replies: number;
  views: number;
  createdAt: string;
  lastActivity: string;
  isPinned: boolean;
  isLocked: boolean;
  hasImage?: boolean;
}

const ForumCategories: React.FC<ForumCategoriesProps> = ({ searchQuery, selectedCategory }) => {
  const [sortBy, setSortBy] = useState<'newest' | 'popular' | 'trending'>('newest');
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  // Mock data for forum posts
  const mockPosts: Post[] = [
    {
      id: '1',
      title: 'Tips for Managing Study Stress During Finals Week',
      content: 'Finals week is approaching and I wanted to share some strategies that have helped me manage stress and anxiety during this challenging time...',
      author: {
        name: 'Sahil Koul',
        avatar: '/api/placeholder/40/40',
        role: 'student',
        badge: 'Top Contributor'
      },
      category: 'academics',
      tags: ['stress', 'finals', 'study-tips'],
      votes: { up: 24, down: 2, userVote: null },
      replies: 18,
      views: 156,
      createdAt: '2024-01-15T10:30:00Z',
      lastActivity: '2024-01-15T14:20:00Z',
      isPinned: true,
      isLocked: false,
      hasImage: true
    },
    {
      id: '2',
      title: 'Looking for Study Buddy for Psychology Course',
      content: 'Hi everyone! I\'m taking PSY101 this semester and looking for someone to study with. We could meet at the library or form a small study group...',
      author: {
        name: 'Arjun Pandita',
        avatar: '/api/placeholder/40/40',
        role: 'student'
      },
      category: 'academics',
      tags: ['study-group', 'psychology', 'partner'],
      votes: { up: 8, down: 0, userVote: 'up' },
      replies: 5,
      views: 43,
      createdAt: '2024-01-14T16:45:00Z',
      lastActivity: '2024-01-15T09:10:00Z',
      isPinned: false,
      isLocked: false
    },
    {
      id: '3',
      title: 'Daily Gratitude Thread - Share What You\'re Thankful For',
      content: 'Let\'s start each day by sharing something we\'re grateful for. Research shows that practicing gratitude can improve mental health and overall well-being...',
      author: {
        name: 'Dr. Sunaina Dhar',
        avatar: '/api/placeholder/40/40',
        role: 'counselor',
        badge: 'Licensed Counselor'
      },
      category: 'wellness',
      tags: ['gratitude', 'daily-practice', 'positivity'],
      votes: { up: 45, down: 1, userVote: null },
      replies: 32,
      views: 289,
      createdAt: '2024-01-13T08:00:00Z',
      lastActivity: '2024-01-15T13:45:00Z',
      isPinned: true,
      isLocked: false
    },
    {
      id: '4',
      title: 'Anxiety Before Job Interviews - Need Advice',
      content: 'I have a job interview next week and I\'m feeling really anxious about it. The thought of being judged makes my heart race. Has anyone experienced similar feelings?',
      author: {
        name: 'Rohan Razdan',
        avatar: '/api/placeholder/40/40',
        role: 'student'
      },
      category: 'support',
      tags: ['anxiety', 'job-interview', 'advice'],
      votes: { up: 15, down: 0, userVote: null },
      replies: 12,
      views: 87,
      createdAt: '2024-01-14T20:30:00Z',
      lastActivity: '2024-01-15T11:15:00Z',
      isPinned: false,
      isLocked: false
    },
    {
      id: '5',
      title: 'Mental Health Resources on Campus - Updated List',
      content: 'I\'ve compiled an updated list of all mental health resources available on campus, including counseling services, support groups, and crisis hotlines...',
      author: {
        name: 'Tanvi Wani',
        avatar: '/api/placeholder/40/40',
        role: 'peer_volunteer',
        badge: 'Peer Volunteer'
      },
      category: 'resources',
      tags: ['resources', 'campus', 'mental-health'],
      votes: { up: 38, down: 0, userVote: null },
      replies: 8,
      views: 234,
      createdAt: '2024-01-12T14:00:00Z',
      lastActivity: '2024-01-15T10:30:00Z',
      isPinned: true,
      isLocked: false,
      hasImage: true
    }
  ];

  const filteredPosts = useMemo(() => {
    let filtered = mockPosts;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(post => post.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(post => 
        post.title.toLowerCase().includes(query) ||
        post.content.toLowerCase().includes(query) ||
        post.tags.some(tag => tag.toLowerCase().includes(query)) ||
        post.author.name.toLowerCase().includes(query)
      );
    }

    // Sort posts
    switch (sortBy) {
      case 'popular':
        return filtered.sort((a, b) => (b.votes.up - b.votes.down) - (a.votes.up - a.votes.down));
      case 'trending':
        return filtered.sort((a, b) => b.replies - a.replies);
      case 'newest':
      default:
        return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
  }, [mockPosts, selectedCategory, searchQuery, sortBy]);

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'counselor': return 'text-green-600 bg-green-50';
      case 'peer_volunteer': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'academics': return 'bg-blue-100 text-blue-800';
      case 'wellness': return 'bg-green-100 text-green-800';
      case 'support': return 'bg-purple-100 text-purple-800';
      case 'resources': return 'bg-orange-100 text-orange-800';
      case 'events': return 'bg-pink-100 text-pink-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (selectedPost) {
    return (
      <ForumPost 
        post={selectedPost} 
        onBack={() => setSelectedPost(null)} 
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Sort Options */}
      <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-gray-900">Discussion Posts</h3>
          <div className="flex space-x-2">
            {[
              { id: 'newest', label: 'Newest' },
              { id: 'popular', label: 'Most Voted' },
              { id: 'trending', label: 'Most Replied' }
            ].map((option) => (
              <button
                key={option.id}
                onClick={() => setSortBy(option.id as typeof sortBy)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors duration-200 ${
                  sortBy === option.id
                    ? 'bg-neon-blue-100 text-neon-blue-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Posts List */}
      <div className="space-y-4">
        {filteredPosts.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center border border-gray-200">
            <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No posts found</h3>
            <p className="text-gray-500">
              {searchQuery ? 'Try adjusting your search terms' : 'Be the first to start a discussion in this category'}
            </p>
          </div>
        ) : (
          filteredPosts.map((post) => (
            <div
              key={post.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200"
            >
              <div className="p-6">
                <div className="flex items-start space-x-4">
                  {/* Author Avatar */}
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-gradient-to-r from-neon-blue-400 to-neon-lavender-400 rounded-full flex items-center justify-center">
                      <span className="text-white font-medium">
                        {post.author.name.charAt(0)}
                      </span>
                    </div>
                  </div>

                  {/* Post Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          {post.isPinned && (
                            <Pin className="w-4 h-4 text-green-500" />
                          )}
                          <button
                            onClick={() => setSelectedPost(post)}
                            className="text-lg font-semibold text-gray-900 hover:text-neon-blue-600 transition-colors duration-200"
                          >
                            {post.title}
                          </button>
                        </div>

                        <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(post.author.role)}`}>
                            {post.author.name}
                          </span>
                          {post.author.badge && (
                            <span className="text-xs text-neon-blue-600 font-medium">
                              {post.author.badge}
                            </span>
                          )}
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(post.category)}`}>
                            #{post.category}
                          </span>
                          <span>{formatTimeAgo(post.createdAt)}</span>
                        </div>

                        <p className="text-gray-600 mb-3 line-clamp-2">
                          {post.content}
                        </p>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-1 mb-3">
                          {post.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>

                      {post.hasImage && (
                        <div className="ml-4 w-16 h-16 bg-gray-100 rounded-lg flex-shrink-0"></div>
                      )}
                    </div>

                    {/* Post Stats */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <div className="flex items-center space-x-6">
                        <div className="flex items-center space-x-1">
                          <button className="flex items-center space-x-1 text-gray-500 hover:text-green-600 transition-colors duration-200">
                            <ArrowUp className="w-4 h-4" />
                            <span className="text-sm">{post.votes.up}</span>
                          </button>
                          <button className="flex items-center space-x-1 text-gray-500 hover:text-red-600 transition-colors duration-200">
                            <ArrowDown className="w-4 h-4" />
                            <span className="text-sm">{post.votes.down}</span>
                          </button>
                        </div>

                        <div className="flex items-center space-x-1 text-gray-500">
                          <Reply className="w-4 h-4" />
                          <span className="text-sm">{post.replies} replies</span>
                        </div>

                        <div className="flex items-center space-x-1 text-gray-500">
                          <Eye className="w-4 h-4" />
                          <span className="text-sm">{post.views} views</span>
                        </div>
                      </div>

                      <div className="text-xs text-gray-400">
                        Last activity {formatTimeAgo(post.lastActivity)}
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

export default ForumCategories;