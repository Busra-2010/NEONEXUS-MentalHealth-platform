import React, { useState } from 'react';
import { ArrowLeft, ArrowUp, ArrowDown, Reply, Share, Bookmark, Flag, Clock, Eye, MessageCircle, Send, Heart, Smile } from 'lucide-react';

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

interface Comment {
  id: string;
  content: string;
  author: {
    name: string;
    avatar: string;
    role: 'student' | 'peer_volunteer' | 'counselor';
    badge?: string;
  };
  votes: {
    up: number;
    down: number;
    userVote?: 'up' | 'down' | null;
  };
  createdAt: string;
  replies: Comment[];
  isHelpful?: boolean;
}

interface ForumPostProps {
  post: Post;
  onBack: () => void;
}

const ForumPost: React.FC<ForumPostProps> = ({ post, onBack }) => {
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [userVote, setUserVote] = useState<'up' | 'down' | null>(post.votes.userVote || null);
  const [isBookmarked, setIsBookmarked] = useState(false);

  // Mock comments data
  const [comments, setComments] = useState<Comment[]>([
    {
      id: '1',
      content: 'This is really helpful! I\'ve been struggling with study stress too. The breathing exercises you mentioned work well for me.',
      author: {
        name: 'Ishika Kher',
        avatar: '/api/placeholder/32/32',
        role: 'student'
      },
      votes: { up: 8, down: 0, userVote: null },
      createdAt: '2024-01-15T11:00:00Z',
      replies: [
        {
          id: '1-1',
          content: 'I agree! Progressive muscle relaxation has been a game-changer for me during finals.',
          author: {
            name: 'Aaditya Bhat',
            avatar: '/api/placeholder/32/32',
            role: 'student'
          },
          votes: { up: 3, down: 0, userVote: null },
          createdAt: '2024-01-15T11:30:00Z',
          replies: []
        }
      ]
    },
    {
      id: '2',
      content: 'Thank you for sharing these strategies. As a peer volunteer, I often recommend similar techniques to students I work with. The Pomodoro technique is especially effective.',
      author: {
        name: 'Tanvi Wani',
        avatar: '/api/placeholder/32/32',
        role: 'peer_volunteer',
        badge: 'Peer Volunteer'
      },
      votes: { up: 12, down: 0, userVote: null },
      createdAt: '2024-01-15T12:15:00Z',
      replies: [],
      isHelpful: true
    },
    {
      id: '3',
      content: 'Great post! I\'d also recommend checking out the campus counseling center. They have workshops on stress management during finals week.',
      author: {
        name: 'Dr. Kamala Tickoo',
        avatar: '/api/placeholder/32/32',
        role: 'counselor',
        badge: 'Licensed Counselor'
      },
      votes: { up: 15, down: 0, userVote: null },
      createdAt: '2024-01-15T13:00:00Z',
      replies: [],
      isHelpful: true
    }
  ]);

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
      case 'counselor': return 'text-green-600 bg-green-50 border-green-200';
      case 'peer_volunteer': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
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

  const handleVote = (type: 'up' | 'down') => {
    if (userVote === type) {
      setUserVote(null);
    } else {
      setUserVote(type);
    }
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const comment: Comment = {
      id: Date.now().toString(),
      content: newComment,
      author: {
        name: 'You',
        avatar: '/api/placeholder/32/32',
        role: 'student'
      },
      votes: { up: 0, down: 0, userVote: null },
      createdAt: new Date().toISOString(),
      replies: []
    };

    setComments([...comments, comment]);
    setNewComment('');
  };

  const handleReplySubmit = (e: React.FormEvent, parentId: string) => {
    e.preventDefault();
    if (!replyContent.trim()) return;

    const reply: Comment = {
      id: `${parentId}-${Date.now()}`,
      content: replyContent,
      author: {
        name: 'You',
        avatar: '/api/placeholder/32/32',
        role: 'student'
      },
      votes: { up: 0, down: 0, userVote: null },
      createdAt: new Date().toISOString(),
      replies: []
    };

    setComments(comments.map(comment => 
      comment.id === parentId 
        ? { ...comment, replies: [...comment.replies, reply] }
        : comment
    ));
    setReplyContent('');
    setReplyingTo(null);
  };

  const renderComment = (comment: Comment, isReply = false) => (
    <div key={comment.id} className={`${isReply ? 'ml-12' : ''}`}>
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-start space-x-3">
          <div className="w-8 h-8 bg-gradient-to-r from-neon-blue-400 to-neon-lavender-400 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white text-sm font-medium">
              {comment.author.name.charAt(0)}
            </span>
          </div>

          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getRoleColor(comment.author.role)}`}>
                {comment.author.name}
              </span>
              {comment.author.badge && (
                <span className="text-xs text-neon-blue-600 font-medium">
                  {comment.author.badge}
                </span>
              )}
              {comment.isHelpful && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  <Heart className="w-3 h-3 mr-1" />
                  Helpful
                </span>
              )}
              <span className="text-xs text-gray-500">{formatTimeAgo(comment.createdAt)}</span>
            </div>

            <p className="text-gray-700 mb-3">{comment.content}</p>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <button className="flex items-center space-x-1 text-gray-500 hover:text-green-600 transition-colors duration-200">
                  <ArrowUp className="w-4 h-4" />
                  <span className="text-sm">{comment.votes.up}</span>
                </button>
                <button className="flex items-center space-x-1 text-gray-500 hover:text-red-600 transition-colors duration-200">
                  <ArrowDown className="w-4 h-4" />
                  <span className="text-sm">{comment.votes.down}</span>
                </button>
              </div>

              <button
                onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                className="flex items-center space-x-1 text-gray-500 hover:text-neon-blue-600 transition-colors duration-200"
              >
                <Reply className="w-4 h-4" />
                <span className="text-sm">Reply</span>
              </button>

              <button className="flex items-center space-x-1 text-gray-500 hover:text-red-600 transition-colors duration-200">
                <Flag className="w-4 h-4" />
                <span className="text-sm">Report</span>
              </button>
            </div>

            {replyingTo === comment.id && (
              <form onSubmit={(e) => handleReplySubmit(e, comment.id)} className="mt-4">
                <div className="flex space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-neon-blue-400 to-neon-lavender-400 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-sm font-medium">Y</span>
                  </div>
                  <div className="flex-1">
                    <textarea
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      placeholder="Write a reply..."
                      className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-neon-blue-500 focus:border-transparent"
                      rows={3}
                    />
                    <div className="flex justify-between items-center mt-2">
                      <div className="flex space-x-2">
                        <button type="button" className="p-2 text-gray-400 hover:text-gray-600 rounded-lg">
                          <Smile className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          type="button"
                          onClick={() => {
                            setReplyingTo(null);
                            setReplyContent('');
                          }}
                          className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={!replyContent.trim()}
                          className="px-4 py-2 bg-neon-blue-600 text-white rounded-lg hover:bg-neon-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                        >
                          Reply
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Nested Replies */}
      {comment.replies.length > 0 && (
        <div className="mt-4 space-y-4">
          {comment.replies.map(reply => renderComment(reply, true))}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors duration-200"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to discussions</span>
      </button>

      {/* Post Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
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

            {/* Post Header */}
            <div className="flex-1">
              <div className="flex items-center space-x-4 mb-3">
                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getRoleColor(post.author.role)}`}>
                  {post.author.name}
                </span>
                {post.author.badge && (
                  <span className="text-sm text-neon-blue-600 font-medium">
                    {post.author.badge}
                  </span>
                )}
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(post.category)}`}>
                  #{post.category}
                </span>
                <span className="text-sm text-gray-500">{formatTimeAgo(post.createdAt)}</span>
              </div>

              <h1 className="text-2xl font-bold text-gray-900 mb-4">{post.title}</h1>

              <div className="prose max-w-none text-gray-700 mb-6">
                <p>{post.content}</p>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-6">
                {post.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full hover:bg-gray-200 cursor-pointer transition-colors duration-200"
                  >
                    #{tag}
                  </span>
                ))}
              </div>

              {/* Post Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="flex items-center space-x-6">
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleVote('up')}
                      className={`flex items-center space-x-1 p-2 rounded-lg transition-colors duration-200 ${
                        userVote === 'up' 
                          ? 'text-green-600 bg-green-50' 
                          : 'text-gray-500 hover:text-green-600 hover:bg-green-50'
                      }`}
                    >
                      <ArrowUp className="w-5 h-5" />
                      <span className="font-medium">{post.votes.up + (userVote === 'up' ? 1 : 0)}</span>
                    </button>
                    <button
                      onClick={() => handleVote('down')}
                      className={`flex items-center space-x-1 p-2 rounded-lg transition-colors duration-200 ${
                        userVote === 'down' 
                          ? 'text-red-600 bg-red-50' 
                          : 'text-gray-500 hover:text-red-600 hover:bg-red-50'
                      }`}
                    >
                      <ArrowDown className="w-5 h-5" />
                      <span className="font-medium">{post.votes.down + (userVote === 'down' ? 1 : 0)}</span>
                    </button>
                  </div>

                  <div className="flex items-center space-x-1 text-gray-500">
                    <MessageCircle className="w-5 h-5" />
                    <span>{comments.length} comments</span>
                  </div>

                  <div className="flex items-center space-x-1 text-gray-500">
                    <Eye className="w-5 h-5" />
                    <span>{post.views} views</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setIsBookmarked(!isBookmarked)}
                    className={`p-2 rounded-lg transition-colors duration-200 ${
                      isBookmarked 
                        ? 'text-yellow-600 bg-yellow-50' 
                        : 'text-gray-500 hover:text-yellow-600 hover:bg-yellow-50'
                    }`}
                  >
                    <Bookmark className="w-5 h-5" />
                  </button>
                  <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-200">
                    <Share className="w-5 h-5" />
                  </button>
                  <button className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200">
                    <Flag className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Comments Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">
            Comments ({comments.length})
          </h3>

          {/* New Comment Form */}
          <form onSubmit={handleCommentSubmit} className="mb-8">
            <div className="flex space-x-4">
              <div className="w-10 h-10 bg-gradient-to-r from-neon-blue-400 to-neon-lavender-400 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-medium">Y</span>
              </div>
              <div className="flex-1">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Share your thoughts..."
                  className="w-full p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-neon-blue-500 focus:border-transparent"
                  rows={4}
                />
                <div className="flex justify-between items-center mt-3">
                  <div className="flex space-x-2">
                    <button type="button" className="p-2 text-gray-400 hover:text-gray-600 rounded-lg">
                      <Smile className="w-5 h-5" />
                    </button>
                  </div>
                  <button
                    type="submit"
                    disabled={!newComment.trim()}
                    className="flex items-center space-x-2 px-6 py-2 bg-neon-blue-600 text-white rounded-lg hover:bg-neon-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                  >
                    <Send className="w-4 h-4" />
                    <span>Comment</span>
                  </button>
                </div>
              </div>
            </div>
          </form>

          {/* Comments List */}
          <div className="space-y-6">
            {comments.map(comment => renderComment(comment))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForumPost;