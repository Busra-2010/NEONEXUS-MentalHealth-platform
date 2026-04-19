import React, { useState } from 'react';
import { Search, Plus, TrendingUp, Users, Calendar, MessageCircle, Hash, Filter } from 'lucide-react';
import ForumCategories from '../components/community/ForumCategories';
import CommunityGroups from '../components/community/CommunityGroups';
import CommunityEvents from '../components/community/CommunityEvents';
import CommunitySidebar from '../components/community/CommunitySidebar';
import NewPostModal from '../components/community/NewPostModal';

type CommunityTab = 'forum' | 'groups' | 'events';

const Community: React.FC = () => {
  const [activeTab, setActiveTab] = useState<CommunityTab>('forum');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewPostModal, setShowNewPostModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const tabs = [
    { id: 'forum', label: 'Forum', icon: MessageCircle, description: 'Join discussions and share thoughts' },
    { id: 'groups', label: 'Groups', icon: Users, description: 'Connect with study and support groups' },
    { id: 'events', label: 'Events', icon: Calendar, description: 'Discover workshops and meetups' },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'forum':
        return <ForumCategories searchQuery={searchQuery} selectedCategory={selectedCategory} />;
      case 'groups':
        return <CommunityGroups searchQuery={searchQuery} />;
      case 'events':
        return <CommunityEvents searchQuery={searchQuery} />;
      default:
        return <ForumCategories searchQuery={searchQuery} selectedCategory={selectedCategory} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-neon-lavender-500 via-neon-blue-500 to-neon-mint-500 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center space-x-4 mb-6 lg:mb-0">
              <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center animate-pulse shadow-lg">
                <Users className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">Community Hub</h1>
                <p className="text-blue-100">Connect, share, and support each other on your mental health journey</p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search community..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full sm:w-64 pl-10 pr-4 py-3 bg-white bg-opacity-90 backdrop-blur-sm border border-white/30 rounded-lg focus:ring-2 focus:ring-white/50 focus:border-white/50 focus:bg-white placeholder-gray-600 text-gray-900 shadow-lg"
                />
              </div>
              
              <button
                onClick={() => setShowNewPostModal(true)}
                className="flex items-center justify-center px-6 py-3 bg-white bg-opacity-20 backdrop-blur-sm text-white rounded-lg hover:bg-white hover:bg-opacity-30 border border-white/30 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Post
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as CommunityTab)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors duration-200 ${
                  activeTab === tab.id
                    ? 'border-neon-blue-500 text-neon-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Content Area */}
          <div className="flex-1">
            {/* Category Filter for Forum Tab */}
            {activeTab === 'forum' && (
              <div className="mb-6 bg-white rounded-lg shadow-sm p-4 border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-gray-900 flex items-center">
                    <Filter className="w-4 h-4 mr-2 text-gray-500" />
                    Filter by Category
                  </h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {['all', 'general', 'academics', 'wellness', 'support', 'events', 'resources'].map((category) => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-colors duration-200 ${
                        selectedCategory === category
                          ? 'bg-neon-blue-100 text-neon-blue-700 border border-neon-blue-200'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-transparent'
                      }`}
                    >
                      <Hash className="w-3 h-3 inline mr-1" />
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Tab Content */}
            {renderTabContent()}
          </div>

          {/* Sidebar */}
          <div className="lg:w-80">
            <CommunitySidebar activeTab={activeTab} />
          </div>
        </div>
      </div>

      {/* New Post Modal */}
      {showNewPostModal && (
        <NewPostModal
          isOpen={showNewPostModal}
          onClose={() => setShowNewPostModal(false)}
          defaultCategory={selectedCategory !== 'all' ? selectedCategory : 'general'}
        />
      )}
    </div>
  );
};

export default Community;