import React, { useState } from 'react';
import { X, Bold, Italic, List, Link2, Image, Smile, Hash, AlertCircle } from 'lucide-react';

interface NewPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultCategory?: string;
}

const NewPostModal: React.FC<NewPostModalProps> = ({ isOpen, onClose, defaultCategory = 'general' }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState(defaultCategory);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [errors, setErrors] = useState<{ title?: string; content?: string; category?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = [
    { id: 'general', label: 'General Discussion', description: 'General topics and conversations' },
    { id: 'academics', label: 'Academic Support', description: 'Study tips, coursework, and academic challenges' },
    { id: 'wellness', label: 'Mental Wellness', description: 'Mental health tips, self-care, and wellness strategies' },
    { id: 'support', label: 'Peer Support', description: 'Seeking and offering emotional support' },
    { id: 'resources', label: 'Resources', description: 'Helpful resources and tools' },
    { id: 'events', label: 'Campus Events', description: 'Upcoming events and activities' }
  ];

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const newTag = tagInput.trim().toLowerCase();
      if (newTag && !tags.includes(newTag) && tags.length < 5) {
        setTags([...tags, newTag]);
        setTagInput('');
      }
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const validateForm = () => {
    const newErrors: { title?: string; content?: string; category?: string } = {};

    if (!title.trim()) {
      newErrors.title = 'Title is required';
    } else if (title.trim().length < 10) {
      newErrors.title = 'Title must be at least 10 characters long';
    }

    if (!content.trim()) {
      newErrors.content = 'Content is required';
    } else if (content.trim().length < 20) {
      newErrors.content = 'Content must be at least 20 characters long';
    }

    if (!category) {
      newErrors.category = 'Please select a category';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      console.log('New post:', {
        title: title.trim(),
        content: content.trim(),
        category,
        tags,
        isAnonymous
      });
      
      setIsSubmitting(false);
      handleClose();
    }, 1000);
  };

  const handleClose = () => {
    setTitle('');
    setContent('');
    setCategory(defaultCategory);
    setTags([]);
    setTagInput('');
    setIsAnonymous(false);
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Create New Post</h2>
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Category Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Category <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`p-4 rounded-lg border text-left transition-all duration-200 ${
                      category === cat.id
                        ? 'border-neon-blue-500 bg-neon-blue-50 text-neon-blue-700'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="font-medium text-sm mb-1">{cat.label}</div>
                    <div className="text-xs text-gray-500">{cat.description}</div>
                  </button>
                ))}
              </div>
              {errors.category && (
                <p className="mt-2 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.category}
                </p>
              )}
            </div>

            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What would you like to discuss?"
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-neon-blue-500 focus:border-transparent ${
                  errors.title ? 'border-red-300' : 'border-gray-300'
                }`}
                maxLength={200}
              />
              <div className="flex justify-between mt-1">
                {errors.title ? (
                  <p className="text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.title}
                  </p>
                ) : (
                  <p className="text-sm text-gray-500">Make your title descriptive and engaging</p>
                )}
                <span className="text-sm text-gray-400">{title.length}/200</span>
              </div>
            </div>

            {/* Content */}
            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                Content <span className="text-red-500">*</span>
              </label>
              
              {/* Formatting Toolbar */}
              <div className="flex items-center space-x-2 p-3 bg-gray-50 border border-gray-300 rounded-t-lg">
                <button type="button" className="p-2 text-gray-600 hover:bg-gray-200 rounded transition-colors duration-200">
                  <Bold className="w-4 h-4" />
                </button>
                <button type="button" className="p-2 text-gray-600 hover:bg-gray-200 rounded transition-colors duration-200">
                  <Italic className="w-4 h-4" />
                </button>
                <button type="button" className="p-2 text-gray-600 hover:bg-gray-200 rounded transition-colors duration-200">
                  <List className="w-4 h-4" />
                </button>
                <button type="button" className="p-2 text-gray-600 hover:bg-gray-200 rounded transition-colors duration-200">
                  <Link2 className="w-4 h-4" />
                </button>
                <button type="button" className="p-2 text-gray-600 hover:bg-gray-200 rounded transition-colors duration-200">
                  <Image className="w-4 h-4" />
                </button>
                <button type="button" className="p-2 text-gray-600 hover:bg-gray-200 rounded transition-colors duration-200">
                  <Smile className="w-4 h-4" />
                </button>
              </div>

              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Share your thoughts, ask questions, or start a discussion..."
                className={`w-full px-4 py-3 border-x border-b border-gray-300 rounded-b-lg resize-none focus:ring-2 focus:ring-neon-blue-500 focus:border-transparent ${
                  errors.content ? 'border-red-300' : ''
                }`}
                rows={8}
                maxLength={5000}
              />
              <div className="flex justify-between mt-1">
                {errors.content ? (
                  <p className="text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.content}
                  </p>
                ) : (
                  <p className="text-sm text-gray-500">Be respectful and constructive in your post</p>
                )}
                <span className="text-sm text-gray-400">{content.length}/5000</span>
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags (Optional)
              </label>
              <div className="flex flex-wrap gap-2 mb-3">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-neon-blue-100 text-neon-blue-800"
                  >
                    <Hash className="w-3 h-3 mr-1" />
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-2 text-neon-blue-600 hover:text-neon-blue-800"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                placeholder="Add tags (press Enter or comma to add)"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-neon-blue-500 focus:border-transparent"
                disabled={tags.length >= 5}
              />
              <p className="text-sm text-gray-500 mt-1">
                Add up to 5 tags to help others find your post. Press Enter or comma to add.
              </p>
            </div>

            {/* Privacy Options */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="anonymous"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="w-4 h-4 text-neon-blue-600 border-gray-300 rounded focus:ring-neon-blue-500"
                />
                <label htmlFor="anonymous" className="text-sm text-gray-700">
                  Post anonymously
                </label>
              </div>
              <p className="text-xs text-gray-500 mt-2 ml-7">
                Your name will not be visible to other users, but moderators can still see your identity.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 bg-gray-50 border-t border-gray-200">
            <div className="text-sm text-gray-500">
              By posting, you agree to our community guidelines
            </div>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={handleClose}
                className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 bg-gradient-to-r from-neon-blue-600 to-neon-lavender-600 text-white rounded-lg hover:from-neon-blue-700 hover:to-neon-lavender-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {isSubmitting ? 'Publishing...' : 'Publish Post'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewPostModal;