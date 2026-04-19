import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LucideIcon } from 'lucide-react';

interface QuickAction {
  title: string;
  description: string;
  icon: LucideIcon;
  color: string;
  path: string;
  urgent: boolean;
}

interface QuickActionsGridProps {
  actions: QuickAction[];
}

const QuickActionsGrid: React.FC<QuickActionsGridProps> = ({ actions }) => {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {actions.map((action, index) => (
        <button
          key={index}
          onClick={() => navigate(action.path)}
          className={`p-4 rounded-xl border transition-all duration-200 text-left group relative ${
            action.urgent
              ? 'border-red-200 bg-red-50 hover:border-red-300 hover:shadow-md hover:bg-red-100'
              : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
          }`}
        >
          {action.urgent && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
          )}
          <div className="flex items-start space-x-3">
            <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${action.color} flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform duration-200`}>
              <action.icon className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className={`font-medium mb-1 ${action.urgent ? 'text-red-800' : 'text-gray-900'}`}>
                {action.title}
                {action.urgent && (
                  <span className="ml-1 text-xs bg-red-200 text-red-700 px-2 py-0.5 rounded-full">Important</span>
                )}
              </h3>
              <p className={`text-sm ${action.urgent ? 'text-red-700' : 'text-gray-600'}`}>
                {action.description}
              </p>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
};

export default QuickActionsGrid;
