import React, { useMemo } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie, AreaChart, Area
} from 'recharts';
import { Users, MessageSquare, Calendar, TrendingUp, Activity } from 'lucide-react';
import { motion } from 'framer-motion';

export interface AnalyticsData {
  date: string;
  users: number;
  sessions: number;
  posts: number;
  appointments: number;
  moodCheckins: number;
}

interface AnalyticsChartProps {
  data: AnalyticsData[];
  type?: 'line' | 'area' | 'bar';
  metric?: 'users' | 'sessions' | 'posts' | 'appointments' | 'moodCheckins';
  className?: string;
  showComparison?: boolean;
  title?: string;
}

const AnalyticsChart: React.FC<AnalyticsChartProps> = ({
  data = [],
  type = 'area',
  metric = 'users',
  className = '',
  showComparison = false,
  title,
}) => {
  const processedData = useMemo(() => {
    return data.map(item => ({
      ...item,
      displayDate: new Date(item.date).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      })
    }));
  }, [data]);

  const getMetricInfo = (metric: string) => {
    const configs = {
      users: {
        label: 'Active Users',
        color: '#0ea5e9',
        icon: Users,
        format: (value: number) => value.toLocaleString()
      },
      sessions: {
        label: 'Counseling Sessions',
        color: '#10b981',
        icon: MessageSquare,
        format: (value: number) => value.toLocaleString()
      },
      posts: {
        label: 'Forum Posts',
        color: '#f59e0b',
        icon: MessageSquare,
        format: (value: number) => value.toLocaleString()
      },
      appointments: {
        label: 'Appointments',
        color: '#8b5cf6',
        icon: Calendar,
        format: (value: number) => value.toLocaleString()
      },
      moodCheckins: {
        label: 'Mood Check-ins',
        color: '#ef4444',
        icon: Activity,
        format: (value: number) => value.toLocaleString()
      }
    };
    
    return configs[metric as keyof typeof configs] || configs.users;
  };

  const metricInfo = getMetricInfo(metric);

  // Calculate trend
  const trend = useMemo(() => {
    if (data.length < 2) return null;
    
    const current = data[data.length - 1][metric];
    const previous = data[data.length - 2][metric];
    const change = ((current - previous) / previous) * 100;
    
    return {
      value: change,
      isPositive: change >= 0,
      formatted: `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`
    };
  }, [data, metric]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const value = data.value;
      
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="font-medium text-gray-900 dark:text-white">{label}</p>
          <p className="font-semibold" style={{ color: metricInfo.color }}>
            {metricInfo.label}: {metricInfo.format(value)}
          </p>
        </div>
      );
    }
    return null;
  };

  const renderLineChart = () => (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={processedData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis 
          dataKey="displayDate" 
          axisLine={false}
          tickLine={false}
          tick={{ fill: '#6b7280', fontSize: 12 }}
        />
        <YAxis 
          axisLine={false}
          tickLine={false}
          tick={{ fill: '#6b7280', fontSize: 12 }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Line 
          type="monotone" 
          dataKey={metric} 
          stroke={metricInfo.color}
          strokeWidth={3}
          dot={{ r: 6, fill: metricInfo.color }}
        />
      </LineChart>
    </ResponsiveContainer>
  );

  const renderAreaChart = () => (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={processedData}>
        <defs>
          <linearGradient id={`gradient-${metric}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={metricInfo.color} stopOpacity={0.3}/>
            <stop offset="95%" stopColor={metricInfo.color} stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis 
          dataKey="displayDate" 
          axisLine={false}
          tickLine={false}
          tick={{ fill: '#6b7280', fontSize: 12 }}
        />
        <YAxis 
          axisLine={false}
          tickLine={false}
          tick={{ fill: '#6b7280', fontSize: 12 }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area 
          type="monotone" 
          dataKey={metric} 
          stroke={metricInfo.color}
          strokeWidth={2}
          fill={`url(#gradient-${metric})`}
        />
      </AreaChart>
    </ResponsiveContainer>
  );

  const renderBarChart = () => (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={processedData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis 
          dataKey="displayDate" 
          axisLine={false}
          tickLine={false}
          tick={{ fill: '#6b7280', fontSize: 12 }}
        />
        <YAxis 
          axisLine={false}
          tickLine={false}
          tick={{ fill: '#6b7280', fontSize: 12 }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey={metric} fill={metricInfo.color} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );

  const renderChart = () => {
    switch (type) {
      case 'line': return renderLineChart();
      case 'bar': return renderBarChart();
      default: return renderAreaChart();
    }
  };

  const IconComponent = metricInfo.icon;
  const currentValue = data.length > 0 ? data[data.length - 1][metric] : 0;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700 ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div 
            className="p-2 rounded-lg"
            style={{ backgroundColor: `${metricInfo.color}20` }}
          >
            <IconComponent 
              className="w-5 h-5" 
              style={{ color: metricInfo.color }}
            />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {title || metricInfo.label}
            </h3>
            <div className="flex items-center space-x-2">
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                {metricInfo.format(currentValue)}
              </span>
              {trend && (
                <div className={`flex items-center text-sm ${
                  trend.isPositive ? 'text-green-600' : 'text-red-600'
                }`}>
                  <TrendingUp 
                    className={`w-4 h-4 mr-1 ${
                      trend.isPositive ? '' : 'rotate-180'
                    }`}
                  />
                  {trend.formatted}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="mb-4">
        {renderChart()}
      </div>

      {/* Comparison metrics */}
      {showComparison && data.length > 1 && (
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">Today</p>
              <p className="font-semibold text-gray-900 dark:text-white">
                {metricInfo.format(data[data.length - 1]?.[metric] || 0)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">Yesterday</p>
              <p className="font-semibold text-gray-900 dark:text-white">
                {metricInfo.format(data[data.length - 2]?.[metric] || 0)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">Average</p>
              <p className="font-semibold text-gray-900 dark:text-white">
                {metricInfo.format(Math.round(
                  data.reduce((sum, item) => sum + item[metric], 0) / data.length
                ))}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* No data state */}
      {data.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <IconComponent className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No analytics data available</p>
          <p className="text-sm">Data will appear as users interact with the platform</p>
        </div>
      )}
    </motion.div>
  );
};

export default AnalyticsChart;