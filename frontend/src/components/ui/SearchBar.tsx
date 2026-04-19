import React, { useState, useMemo } from 'react';
import { Search, X, Filter, Clock } from 'lucide-react';
import useDebounce from '../../hooks/useDebounce';
import { motion, AnimatePresence } from 'framer-motion';

export interface SearchResult {
  id: string;
  title: string;
  description?: string;
  type: string;
  category?: string;
  url?: string;
  metadata?: Record<string, any>;
}

interface SearchBarProps {
  placeholder?: string;
  onSearch?: (query: string, filters?: SearchFilters) => void;
  onResultSelect?: (result: SearchResult) => void;
  results?: SearchResult[];
  loading?: boolean;
  className?: string;
  showFilters?: boolean;
  recentSearches?: string[];
  onClearRecent?: () => void;
}

export interface SearchFilters {
  type?: string;
  category?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

const SearchBar: React.FC<SearchBarProps> = ({
  placeholder = "Search...",
  onSearch,
  onResultSelect,
  results = [],
  loading = false,
  className = "",
  showFilters = false,
  recentSearches = [],
  onClearRecent,
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({});
  
  // Debounce search query
  const debouncedQuery = useDebounce(query, 300);
  
  // Trigger search when debounced query changes
  React.useEffect(() => {
    if (debouncedQuery.trim() || Object.keys(filters).length > 0) {
      onSearch?.(debouncedQuery, filters);
    }
  }, [debouncedQuery, filters, onSearch]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setIsOpen(true);
  };

  const handleClear = () => {
    setQuery('');
    setIsOpen(false);
    setFilters({});
    onSearch?.('', {});
  };

  const handleResultClick = (result: SearchResult) => {
    onResultSelect?.(result);
    setIsOpen(false);
    if (result.url) {
      // Navigate to result URL if provided
      window.location.href = result.url;
    }
  };

  const handleRecentSearch = (searchTerm: string) => {
    setQuery(searchTerm);
    onSearch?.(searchTerm, filters);
    setIsOpen(false);
  };

  const filteredResults = useMemo(() => {
    if (!query.trim()) return results;
    
    return results.filter(result => 
      result.title.toLowerCase().includes(query.toLowerCase()) ||
      result.description?.toLowerCase().includes(query.toLowerCase())
    );
  }, [results, query]);

  const getTypeIcon = (type: string) => {
    // You can customize icons based on result type
    switch (type) {
      case 'resource':
        return '📚';
      case 'post':
        return '💬';
      case 'user':
        return '👤';
      case 'appointment':
        return '📅';
      default:
        return '🔍';
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          className="
            block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg
            focus:ring-2 focus:ring-neon-blue-500 focus:border-transparent
            dark:bg-gray-800 dark:border-gray-600 dark:text-white
            dark:placeholder-gray-400
            placeholder-gray-500 transition-all duration-200
          "
          placeholder={placeholder}
        />
        
        <div className="absolute inset-y-0 right-0 flex items-center">
          {showFilters && (
            <button
              onClick={() => setShowFilterMenu(!showFilterMenu)}
              className={`
                p-2 rounded-md transition-colors mr-1
                ${showFilterMenu 
                  ? 'text-neon-blue-600 bg-neon-blue-50 dark:bg-neon-blue-900/20' 
                  : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                }
              `}
            >
              <Filter className="h-4 w-4" />
            </button>
          )}
          
          {query && (
            <button
              onClick={handleClear}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-md transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Search Results Dropdown */}
      <AnimatePresence>
        {isOpen && (query.trim() || recentSearches.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="
              absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800
              border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg
              max-h-96 overflow-y-auto z-50
            "
          >
            {/* Loading State */}
            {loading && (
              <div className="p-4 text-center text-gray-500">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-neon-blue-600 mx-auto"></div>
                <p className="mt-2 text-sm">Searching...</p>
              </div>
            )}

            {/* Recent Searches */}
            {!query.trim() && recentSearches.length > 0 && (
              <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    Recent Searches
                  </h3>
                  {onClearRecent && (
                    <button
                      onClick={onClearRecent}
                      className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                    >
                      Clear
                    </button>
                  )}
                </div>
                {recentSearches.map((searchTerm, index) => (
                  <button
                    key={index}
                    onClick={() => handleRecentSearch(searchTerm)}
                    className="
                      block w-full text-left px-2 py-1 text-sm text-gray-600 dark:text-gray-400
                      hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors
                    "
                  >
                    {searchTerm}
                  </button>
                ))}
              </div>
            )}

            {/* Search Results */}
            {query.trim() && (
              <>
                {filteredResults.length === 0 && !loading ? (
                  <div className="p-4 text-center text-gray-500">
                    <p>No results found for "{query}"</p>
                  </div>
                ) : (
                  <div className="py-2">
                    {filteredResults.map(result => (
                      <button
                        key={result.id}
                        onClick={() => handleResultClick(result)}
                        className="
                          w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700
                          transition-colors flex items-start space-x-3
                        "
                      >
                        <span className="text-lg mt-0.5">{getTypeIcon(result.type)}</span>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 dark:text-white truncate">
                            {result.title}
                          </h4>
                          {result.description && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                              {result.description}
                            </p>
                          )}
                          <div className="flex items-center mt-1 space-x-2">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                              {result.type}
                            </span>
                            {result.category && (
                              <span className="text-xs text-gray-400">
                                {result.category}
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filter Menu */}
      <AnimatePresence>
        {showFilterMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="
              absolute top-full right-0 mt-2 w-64 bg-white dark:bg-gray-800
              border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg
              p-4 z-50
            "
          >
            <h3 className="font-medium text-gray-900 dark:text-white mb-3">Filters</h3>
            
            {/* Type Filter */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Content Type
              </label>
              <select
                value={filters.type || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value || undefined }))}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">All Types</option>
                <option value="resource">Resources</option>
                <option value="post">Forum Posts</option>
                <option value="user">Users</option>
                <option value="appointment">Appointments</option>
              </select>
            </div>

            {/* Category Filter */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Category
              </label>
              <select
                value={filters.category || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value || undefined }))}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">All Categories</option>
                <option value="mental-health">Mental Health</option>
                <option value="academic">Academic Support</option>
                <option value="wellness">Wellness</option>
                <option value="crisis">Crisis Support</option>
              </select>
            </div>

            {/* Clear Filters */}
            <button
              onClick={() => setFilters({})}
              className="w-full text-sm text-neon-blue-600 dark:text-neon-blue-400 hover:underline"
            >
              Clear All Filters
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Click outside to close */}
      {(isOpen || showFilterMenu) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setIsOpen(false);
            setShowFilterMenu(false);
          }}
        />
      )}
    </div>
  );
};

export default SearchBar;