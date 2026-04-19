import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, AlertTriangle, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface OfflineIndicatorProps {
  className?: string;
}

const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({ className = '' }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showToast, setShowToast] = useState(false);
  const [lastOnlineTime, setLastOnlineTime] = useState<Date>(new Date());

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowToast(true);
      setLastOnlineTime(new Date());
      
      // Hide toast after 3 seconds
      setTimeout(() => setShowToast(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowToast(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check connection periodically
    const checkConnection = async () => {
      try {
        const response = await fetch('/api/health', { 
          method: 'HEAD',
          cache: 'no-cache',
          signal: AbortSignal.timeout(5000)
        });
        
        if (response.ok && !isOnline) {
          setIsOnline(true);
          setShowToast(true);
          setLastOnlineTime(new Date());
          setTimeout(() => setShowToast(false), 3000);
        }
      } catch {
        if (isOnline) {
          setIsOnline(false);
          setShowToast(true);
        }
      }
    };

    const intervalId = setInterval(checkConnection, 30000); // Check every 30 seconds

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(intervalId);
    };
  }, [isOnline]);

  const formatLastOnline = () => {
    const now = new Date();
    const diffMs = now.getTime() - lastOnlineTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return lastOnlineTime.toLocaleDateString();
  };

  return (
    <>
      {/* Connection Status Indicator */}
      <div className={`flex items-center space-x-2 ${className}`}>
        {isOnline ? (
          <div className="flex items-center text-green-600 dark:text-green-400">
            <Wifi className="w-4 h-4 mr-1" />
            <span className="text-sm font-medium">Online</span>
          </div>
        ) : (
          <div className="flex items-center text-red-600 dark:text-red-400">
            <WifiOff className="w-4 h-4 mr-1" />
            <span className="text-sm font-medium">Offline</span>
          </div>
        )}
      </div>

      {/* Toast Notifications */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: -50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -50, x: '-50%' }}
            transition={{ duration: 0.3, type: 'spring' }}
            className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50"
          >
            {isOnline ? (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 shadow-lg backdrop-blur-sm">
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                  <div>
                    <h3 className="font-semibold text-green-800 dark:text-green-200">
                      Back Online!
                    </h3>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      Connection restored. All features are now available.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 shadow-lg backdrop-blur-sm">
                <div className="flex items-center">
                  <AlertTriangle className="w-5 h-5 text-red-500 mr-3" />
                  <div>
                    <h3 className="font-semibold text-red-800 dark:text-red-200">
                      Connection Lost
                    </h3>
                    <p className="text-sm text-red-700 dark:text-red-300">
                      Working offline. Some features may be limited.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Persistent Offline Banner */}
      <AnimatePresence>
        {!isOnline && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="fixed top-0 left-0 right-0 bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800 px-4 py-2 z-40"
          >
            <div className="flex items-center justify-between max-w-7xl mx-auto">
              <div className="flex items-center">
                <WifiOff className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mr-2" />
                <span className="text-sm text-yellow-800 dark:text-yellow-200">
                  You're offline. Last connected {formatLastOnline()}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-yellow-600 dark:text-yellow-400">
                  Limited functionality
                </span>
                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default OfflineIndicator;