import React, { useMemo } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie, RadialBarChart, RadialBar, Legend
} from 'recharts';
import { format, parseISO, subDays, startOfDay } from 'date-fns';
import { TrendingUp, TrendingDown, Minus, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';

export interface MoodEntry {
  id: string;
  mood: number; // 1-5 scale
  date: string; // ISO date string
  notes?: string;
  factors?: string[];
}

interface MoodChartProps {
  data: MoodEntry[];
  type?: 'line' | 'bar' | 'radial';
  timeRange?: 'week' | 'month' | 'quarter';
  className?: string;
  showTrend?: boolean;
  showAverage?: boolean;
}

const MoodChart: React.FC<MoodChartProps> = ({
  data = [],
  type = 'line',
  timeRange = 'week',
  className = '',
  showTrend = true,
  showAverage = true,
}) => {
  // Process data for different time ranges
  const processedData = useMemo(() => {
    const now = new Date();
    let daysToShow = 7;
    
    if (timeRange === 'month') daysToShow = 30;
    if (timeRange === 'quarter') daysToShow = 90;

    // Create array of dates for the time range
    const dateRange = Array.from({ length: daysToShow }, (_, i) => {
      const date = subDays(now, daysToShow - 1 - i);
      return startOfDay(date);
    });

    // Group mood entries by date and calculate averages
    const groupedData = dateRange.map(date => {
      const dateStr = date.toISOString().split('T')[0];
      const dayEntries = data.filter(entry => 
        entry.date.split('T')[0] === dateStr
      );
      
      const avgMood = dayEntries.length > 0
        ? dayEntries.reduce((sum, entry) => sum + entry.mood, 0) / dayEntries.length
        : null;

      return {
        date: dateStr,
        displayDate: format(date, timeRange === 'week' ? 'EEE' : 'MMM dd'),
        mood: avgMood,
        entries: dayEntries.length,
        hasData: dayEntries.length > 0
      };
    });

    return groupedData;
  }, [data, timeRange]);

  // Calculate trend and average
  const analytics = useMemo(() => {
    const validEntries = processedData.filter(d => d.mood !== null);
    if (validEntries.length === 0) return null;

    const average = validEntries.reduce((sum, d) => sum + (d.mood || 0), 0) / validEntries.length;
    
    // Calculate trend (comparing first half vs second half)
    const half = Math.floor(validEntries.length / 2);
    const firstHalf = validEntries.slice(0, half);
    const secondHalf = validEntries.slice(-half);
    
    const firstAvg = firstHalf.reduce((sum, d) => sum + (d.mood || 0), 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, d) => sum + (d.mood || 0), 0) / secondHalf.length;
    
    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (secondAvg > firstAvg + 0.3) trend = 'up';
    else if (secondAvg < firstAvg - 0.3) trend = 'down';

    return { average, trend };
  }, [processedData]);

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const mood = data.value;
      
      const getMoodEmoji = (mood: number) => {
        if (mood >= 4.5) return '😁 Excellent';
        if (mood >= 3.5) return '😊 Good';
        if (mood >= 2.5) return '😐 Okay';
        if (mood >= 1.5) return '😕 Not Great';
        return '😢 Poor';
      };

      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="font-medium text-gray-900 dark:text-white">{label}</p>
          <p className="text-neon-blue-600 font-semibold">
            {getMoodEmoji(mood)} ({mood.toFixed(1)}/5.0)
          </p>
        </div>
      );
    }
    return null;
  };

  const getMoodColor = (mood: number | null) => {
    if (mood === null) return '#e5e7eb';
    if (mood >= 4) return '#10b981'; // green
    if (mood >= 3) return '#f59e0b'; // yellow
    if (mood >= 2) return '#f97316'; // orange
    return '#ef4444'; // red
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
          domain={[1, 5]}
          axisLine={false}
          tickLine={false}
          tick={{ fill: '#6b7280', fontSize: 12 }}
          tickCount={5}
        />
        <Tooltip content={<CustomTooltip />} />
        <Line 
          type="monotone" 
          dataKey="mood" 
          stroke="#0ea5e9" 
          strokeWidth={3}
          dot={{ r: 6, fill: '#0ea5e9' }}
          connectNulls={false}
        />
      </LineChart>
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
          domain={[0, 5]}
          axisLine={false}
          tickLine={false}
          tick={{ fill: '#6b7280', fontSize: 12 }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="mood" radius={[4, 4, 0, 0]}>
          {processedData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={getMoodColor(entry.mood)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );

  const renderRadialChart = () => {
    if (!analytics) return <div>No data available</div>;
    
    const radialData = [
      { name: 'Mood Level', value: (analytics.average / 5) * 100, fill: getMoodColor(analytics.average) }
    ];

    return (
      <ResponsiveContainer width="100%" height={300}>
        <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="90%" data={radialData}>
          <RadialBar dataKey="value" cornerRadius={10} fill={radialData[0].fill} />
          <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="text-2xl font-bold fill-current">
            {analytics.average.toFixed(1)}
          </text>
          <text x="50%" y="60%" textAnchor="middle" dominantBaseline="middle" className="text-sm fill-gray-500">
            Average Mood
          </text>
        </RadialBarChart>
      </ResponsiveContainer>
    );
  };

  const renderChart = () => {
    switch (type) {
      case 'bar': return renderBarChart();
      case 'radial': return renderRadialChart();
      default: return renderLineChart();
    }
  };

  const getTrendIcon = () => {
    if (!analytics) return null;
    
    switch (analytics.trend) {
      case 'up':
        return <TrendingUp className="w-5 h-5 text-green-500" />;
      case 'down':
        return <TrendingDown className="w-5 h-5 text-red-500" />;
      default:
        return <Minus className="w-5 h-5 text-gray-500" />;
    }
  };

  const getTrendText = () => {
    if (!analytics) return 'No data';
    
    switch (analytics.trend) {
      case 'up': return 'Mood is improving';
      case 'down': return 'Mood needs attention';
      default: return 'Mood is stable';
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700 ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
            Mood Tracking
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Your mood over the past {timeRange === 'week' ? 'week' : timeRange === 'month' ? 'month' : 'quarter'}
          </p>
        </div>
        <div className="flex items-center space-x-2 text-sm">
          <Calendar className="w-4 h-4 text-gray-400" />
          <span className="text-gray-600 dark:text-gray-300">{processedData.length} days</span>
        </div>
      </div>

      {/* Chart */}
      <div className="mb-6">
        {renderChart()}
      </div>

      {/* Analytics */}
      {analytics && (showTrend || showAverage) && (
        <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
          {showAverage && (
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getMoodColor(analytics.average) }}></div>
              <span className="text-sm text-gray-600 dark:text-gray-300">
                Average: <span className="font-medium">{analytics.average.toFixed(1)}/5.0</span>
              </span>
            </div>
          )}
          
          {showTrend && (
            <div className="flex items-center space-x-2">
              {getTrendIcon()}
              <span className="text-sm text-gray-600 dark:text-gray-300">
                {getTrendText()}
              </span>
            </div>
          )}
        </div>
      )}

      {/* No data state */}
      {data.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No mood data available</p>
          <p className="text-sm">Start tracking your mood to see insights here</p>
        </div>
      )}
    </motion.div>
  );
};

export default MoodChart;