import React, { useState } from 'react';
import { BookOpen, Play, FileText, Star, Clock, Download, Eye, Filter, Search } from 'lucide-react';
import { Navigation, Card, Button, Input } from '../components/ui';
import { User as UserType, Resource, ResourceCategory } from '../types';

interface ResourcesProps {
  user?: UserType;
  onLogout?: () => void;
}

const Resources: React.FC<ResourcesProps> = ({
  user,
  onLogout,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ResourceCategory | 'All'>('All');
  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'hi' | 'ur' | 'ks' | 'doi' | 'all'>('all');

  // Mock resources data
  const resources: Resource[] = [
    {
      id: 1,
      title: 'Managing Exam Stress',
      titleTranslations: { 
        hi: 'परीक्षा तनाव प्रबंधन', 
        en: 'Managing Exam Stress',
        ur: 'امتحان کا دباؤ منظم کرنا'
      },
      description: 'Learn effective techniques to manage exam-related stress and anxiety. This video covers breathing exercises, time management, and positive thinking strategies.',
      type: 'video',
      category: 'Stress Relief',
      language: 'en',
      url: '/resources/videos/exam-stress.mp4',
      thumbnailUrl: '/resources/thumbnails/exam-stress.jpg',
      durationMinutes: 15,
      tags: ['exams', 'stress', 'anxiety', 'students'],
      difficultyLevel: 'beginner',
      isFeatured: true,
      isActive: true,
      viewCount: 1250,
      rating: 4.7,
      ratingCount: 89,
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z'
    },
    {
      id: 2,
      title: 'Sleep Hygiene for Students',
      titleTranslations: { 
        hi: 'छात्रों के लिए नींद की स्वच्छता', 
        en: 'Sleep Hygiene for Students',
        ur: 'طلباء کے لیے نیند کی حفظان صحت'
      },
      description: 'गुणवत्तापूर्ण नींद के लिए आवश्यक तकनीकें और सुझाव। बेहतर नींद पैटर्न कैसे बनाएं।',
      type: 'audio',
      category: 'Sleep',
      language: 'hi',
      url: '/resources/audio/sleep-hygiene-hindi.mp3',
      thumbnailUrl: '/resources/thumbnails/sleep.jpg',
      durationMinutes: 12,
      tags: ['sleep', 'hygiene', 'health', 'rest'],
      difficultyLevel: 'beginner',
      isFeatured: true,
      isActive: true,
      viewCount: 890,
      rating: 4.5,
      ratingCount: 67,
      createdAt: '2024-01-10T14:30:00Z',
      updatedAt: '2024-01-10T14:30:00Z'
    },
    {
      id: 3,
      title: 'Academic Pressure Coping Strategies',
      description: 'Comprehensive guide to managing academic pressure and expectations. Includes practical exercises and mindset shifts.',
      type: 'pdf',
      category: 'Academic Pressure',
      language: 'en',
      url: '/resources/pdfs/academic-pressure-guide.pdf',
      thumbnailUrl: '/resources/thumbnails/academic.jpg',
      pageCount: 24,
      tags: ['academic', 'pressure', 'coping', 'strategies'],
      difficultyLevel: 'intermediate',
      isFeatured: false,
      isActive: true,
      viewCount: 2100,
      downloadCount: 456,
      rating: 4.8,
      ratingCount: 124,
      createdAt: '2024-01-05T09:15:00Z',
      updatedAt: '2024-01-05T09:15:00Z'
    },
    {
      id: 4,
      title: 'Mindfulness Meditation Guide',
      description: 'Step-by-step guide to mindfulness meditation practices. Perfect for beginners looking to reduce anxiety and improve focus.',
      type: 'article',
      category: 'Self-Care',
      language: 'en',
      thumbnailUrl: '/resources/thumbnails/mindfulness.jpg',
      tags: ['mindfulness', 'meditation', 'anxiety', 'focus'],
      difficultyLevel: 'beginner',
      isFeatured: true,
      isActive: true,
      viewCount: 1876,
      rating: 4.6,
      ratingCount: 92,
      createdAt: '2024-01-12T16:20:00Z',
      updatedAt: '2024-01-12T16:20:00Z'
    },
    {
      id: 5,
      title: 'Dealing with Social Anxiety',
      description: 'Practical exercises and techniques for managing social anxiety in college settings. Includes role-playing scenarios.',
      type: 'worksheet',
      category: 'Anxiety',
      language: 'en',
      thumbnailUrl: '/resources/thumbnails/social-anxiety.jpg',
      tags: ['social', 'anxiety', 'college', 'exercises'],
      difficultyLevel: 'intermediate',
      isFeatured: false,
      isActive: true,
      viewCount: 1654,
      downloadCount: 398,
      rating: 4.4,
      ratingCount: 78,
      createdAt: '2024-01-08T11:45:00Z',
      updatedAt: '2024-01-08T11:45:00Z'
    },
    {
      id: 6,
      title: 'Understanding Depression',
      titleTranslations: { 
        hi: 'अवसाद को समझना', 
        en: 'Understanding Depression',
        ur: 'ڈپریشن کو سمجھنا'
      },
      description: 'अवसाद के लक्षण, कारण और उपचार के बारे में विस्तृत जानकारी। मानसिक स्वास्थ्य की देखभाल के तरीके।',
      type: 'video',
      category: 'Depression',
      language: 'hi',
      url: '/resources/videos/depression-hindi.mp4',
      thumbnailUrl: '/resources/thumbnails/depression.jpg',
      durationMinutes: 22,
      tags: ['depression', 'mental health', 'symptoms', 'treatment'],
      difficultyLevel: 'intermediate',
      isFeatured: false,
      isActive: true,
      viewCount: 987,
      rating: 4.9,
      ratingCount: 156,
      createdAt: '2024-01-03T13:10:00Z',
      updatedAt: '2024-01-03T13:10:00Z'
    },
    {
      id: 7,
      title: 'तनाव मैनेजमेंट',
      titleTranslations: { 
        ks: 'تناو منظم کرُن', 
        en: 'Stress Management',
        hi: 'तनाव प्रबंधन',
        ur: 'تناو کا انتظام'
      },
      description: 'تناو کم کرن کی تکنیک اور مانسک سکون کے طریقے۔ یہ ویڈیو سانس کی تکنیک اور ذہن کو آرام دینے کے طریقے بتاتا ہے۔',
      type: 'video',
      category: 'Stress Relief',
      language: 'ks',
      url: '/resources/videos/stress-management-kashmiri.mp4',
      thumbnailUrl: '/resources/thumbnails/stress-ks.jpg',
      durationMinutes: 18,
      tags: ['stress', 'meditation', 'breathing', 'kashmiri'],
      difficultyLevel: 'beginner',
      isFeatured: true,
      isActive: true,
      viewCount: 756,
      rating: 4.6,
      ratingCount: 43,
      createdAt: '2024-01-20T08:30:00Z',
      updatedAt: '2024-01-20T08:30:00Z'
    },
    {
      id: 8,
      title: 'मानसिक स्वास्थ्य देखभाल',
      titleTranslations: { 
        doi: 'मानसिक सिہت दी دیखभाल', 
        en: 'Mental Health Care',
        hi: 'मानसिक स्वास्थ्य देखभाल',
        ur: 'ذہنی صحت کی دیکھ بھال'
      },
      description: 'मन دی سہت کئی رکھن دے खاطر ضروری گلاں۔ ییہ آڈیو تناو, گھبراہट اور اداسی نाल نिपटन دے طریقے بتाउندا ہے۔',
      type: 'audio',
      category: 'Self-Care',
      language: 'doi',
      url: '/resources/audio/mental-health-dogri.mp3',
      thumbnailUrl: '/resources/thumbnails/mental-health-doi.jpg',
      durationMinutes: 25,
      tags: ['mental health', 'self-care', 'wellness', 'dogri'],
      difficultyLevel: 'intermediate',
      isFeatured: false,
      isActive: true,
      viewCount: 432,
      rating: 4.3,
      ratingCount: 28,
      createdAt: '2024-01-18T15:45:00Z',
      updatedAt: '2024-01-18T15:45:00Z'
    }
  ];

  const categories: (ResourceCategory | 'All')[] = [
    'All', 'Stress Relief', 'Sleep', 'Academic Pressure', 'Anxiety', 'Depression', 'Self-Care'
  ];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return Play;
      case 'audio': return Play;
      case 'pdf': return FileText;
      case 'article': return BookOpen;
      case 'worksheet': return FileText;
      default: return BookOpen;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'video': return 'text-red-600 bg-red-100';
      case 'audio': return 'text-green-600 bg-green-100';
      case 'pdf': return 'text-blue-600 bg-blue-100';
      case 'article': return 'text-purple-600 bg-purple-100';
      case 'worksheet': return 'text-orange-600 bg-orange-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const filteredResources = resources.filter(resource => {
    const matchesSearch = resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resource.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resource.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'All' || resource.category === selectedCategory;
    const matchesLanguage = selectedLanguage === 'all' || resource.language === selectedLanguage;

    return matchesSearch && matchesCategory && matchesLanguage;
  });

  const featuredResources = resources.filter(resource => resource.isFeatured);

  const ResourceCard: React.FC<{ resource: Resource; featured?: boolean }> = ({ resource, featured = false }) => {
    const Icon = getTypeIcon(resource.type);
    const colorClass = getTypeColor(resource.type);

    return (
      <Card padding="md" className={`hover:shadow-lg transition-all duration-200 ${featured ? 'border-neon-blue-200 bg-gradient-to-br from-white to-neon-blue-50' : ''}`}>
        <div className="flex flex-col h-full">
          {/* Thumbnail */}
          <div className="relative mb-4 overflow-hidden rounded-lg">
            {resource.thumbnailUrl ? (
              <div className="w-full h-40 relative">
                <img 
                  src={resource.thumbnailUrl} 
                  alt={resource.title}
                  className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                  onError={(e) => {
                    // Fallback to gradient background with icon if image fails to load
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const fallback = target.nextElementSibling as HTMLDivElement;
                    if (fallback) fallback.style.display = 'flex';
                  }}
                />
                <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 rounded-lg hidden items-center justify-center absolute inset-0">
                  <Icon className="w-12 h-12 text-gray-500" />
                </div>
              </div>
            ) : (
              <div className="w-full h-40 bg-gradient-to-br from-gray-200 to-gray-300 rounded-lg flex items-center justify-center">
                <Icon className="w-12 h-12 text-gray-500" />
              </div>
            )}
            
            {/* Type Badge */}
            <div className={`absolute top-2 left-2 px-2 py-1 rounded-full ${colorClass}`}>
              <span className="text-xs font-medium capitalize">{resource.type}</span>
            </div>
            
            {/* Featured Badge */}
            {resource.isFeatured && (
              <div className="absolute top-2 right-2 px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full">
                <Star className="w-3 h-3 fill-current" />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 flex flex-col">
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold text-gray-900 line-clamp-2 flex-1">
                {resource.titleTranslations?.[selectedLanguage as keyof typeof resource.titleTranslations] || resource.title}
              </h3>
            </div>

            <p className="text-sm text-gray-600 mb-3 line-clamp-3 flex-1">
              {resource.description}
            </p>

            {/* Tags */}
            <div className="flex flex-wrap gap-1 mb-3">
              {resource.tags.slice(0, 3).map((tag, index) => (
                <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                  {tag}
                </span>
              ))}
            </div>

            {/* Meta Info */}
            <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
              <div className="flex items-center space-x-3">
                {resource.durationMinutes && (
                  <div className="flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>{resource.durationMinutes}m</span>
                  </div>
                )}
                {resource.pageCount && (
                  <div className="flex items-center space-x-1">
                    <FileText className="w-3 h-3" />
                    <span>{resource.pageCount} pages</span>
                  </div>
                )}
                <div className="flex items-center space-x-1">
                  <Eye className="w-3 h-3" />
                  <span>{resource.viewCount}</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-1">
                <Star className="w-3 h-3 text-yellow-500 fill-current" />
                <span>{resource.rating}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex space-x-2">
              <Button size="sm" className="flex-1">
                {resource.type === 'pdf' || resource.type === 'worksheet' ? (
                  <>
                    <Download className="w-3 h-3 mr-1" />
                    Download
                  </>
                ) : (
                  <>
                    <Play className="w-3 h-3 mr-1" />
                    {resource.type === 'video' ? 'Watch' : resource.type === 'audio' ? 'Listen' : 'Read'}
                  </>
                )}
              </Button>
              <Button size="sm" variant="outline">
                <Star className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation 
        userRole="student"
        userName={user?.profile?.fullName || 'Student'}
        onLogout={onLogout}
      />

      <div className="max-w-7xl mx-auto py-6 px-4">
        {/* Header */}
        <div className="bg-gradient-to-r from-neon-blue-500 to-neon-mint-500 rounded-xl p-6 text-white mb-8">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Resource Hub</h1>
              <p className="text-blue-100">Educational content to support your mental wellness journey</p>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          {/* Search */}
          <div className="lg:col-span-2">
            <div className="relative">
              <Input
                placeholder="Search resources..."
                value={searchTerm}
                onChange={setSearchTerm}
                className="pl-10"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as ResourceCategory | 'All')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neon-blue-200"
            >
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          {/* Language Filter */}
          <div>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value as 'en' | 'hi' | 'ur' | 'ks' | 'doi' | 'all')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neon-blue-200"
            >
              <option value="all">All Languages</option>
              <option value="en">English</option>
              <option value="hi">हिन्दी</option>
              <option value="ur">اردو</option>
              <option value="ks">कॉशुर</option>
              <option value="doi">डोगरी</option>
            </select>
          </div>
        </div>

        {/* Featured Resources */}
        {selectedCategory === 'All' && !searchTerm && (
          <div className="mb-12">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Featured Resources</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredResources.map(resource => (
                <ResourceCard key={resource.id} resource={resource} featured />
              ))}
            </div>
          </div>
        )}

        {/* All Resources */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              {searchTerm ? `Search Results (${filteredResources.length})` : 'All Resources'}
            </h2>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Filter className="w-4 h-4" />
              <span>{filteredResources.length} resources found</span>
            </div>
          </div>

          {filteredResources.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredResources.map(resource => (
                <ResourceCard key={resource.id} resource={resource} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">No resources found</h3>
              <p className="text-gray-500 mb-4">Try adjusting your search terms or filters</p>
              <Button onClick={() => {
                setSearchTerm('');
                setSelectedCategory('All');
                setSelectedLanguage('all');
              }}>
                Clear Filters
              </Button>
            </div>
          )}
        </div>

        {/* Resource Categories Overview */}
        <Card padding="lg" className="bg-gradient-to-br from-neon-lavender-50 to-neon-blue-50 border-neon-lavender-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Resource Categories</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.filter(cat => cat !== 'All').map((category, index) => {
              const count = resources.filter(r => r.category === category).length;
              return (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category as ResourceCategory)}
                  className="p-3 text-center bg-white rounded-lg border border-gray-200 hover:border-neon-blue-300 hover:shadow-md transition-all"
                >
                  <div className="font-medium text-gray-900 text-sm mb-1">{category}</div>
                  <div className="text-xs text-gray-500">{count} resources</div>
                </button>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Resources;