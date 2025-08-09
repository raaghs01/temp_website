import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, TrendingUp, Users, Award, Calendar, CheckCircle, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';

const BACKEND_URL = 'http://127.0.0.1:8000';

interface DashboardStats {
  current_day_tasks: number;
  tasks_completed: number;
  total_points: number;
  current_rank: string;
  completion_rate: number;
  people_connected: number;
  next_task?: {
    id: string;
    title: string;
    description: string;
    points: number;
    priority: string;
    day: number;
  };
}

const Dashboard: React.FC<{ user: any; refreshUser: () => Promise<void> }> = ({ user, refreshUser }) => {
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState(3);
  const [showVideoModal, setShowVideoModal] = useState(false);

  // Sample data for demonstration
  const sampleStats: DashboardStats = {
    current_day_tasks: 5,
    tasks_completed: 12,
    total_points: 850,
    current_rank: "Top 10%",
    completion_rate: 75,
    people_connected: 45,
    next_task: {
      id: "task_001",
      title: "Complete Orientation",
      description: "Watch the orientation video and read the company documents. This will help you understand our mission and how to be an effective ambassador.",
      points: 100,
      priority: "High Priority",
      day: 0
    }
  };

  useEffect(() => {
    // Simulate API call
    const fetchDashboardStats = async () => {
      try {
        // Simulate loading
        await new Promise(resolve => setTimeout(resolve, 1000));
        setDashboardStats(sampleStats);
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        setDashboardStats(sampleStats); // Fallback to sample data
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardStats();
  }, []);

  const handleStartTask = () => {
    setShowVideoModal(true);
  };

  const navigateToLeaderboardAnalytics = (): void => {
    const navigationEvent = new CustomEvent('navigate', {
      detail: { tab: 'leaderboard', hash: '#analytics' }
    });
    window.dispatchEvent(navigationEvent);
  };

  const handleNotificationClick = () => {
    setNotifications(0);
    alert('Notifications cleared!');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-xl text-gray-400">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header with Notifications */}
      <div className="flex items-center justify-between p-6 border-b border-gray-800">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold">Dashboard</h1>
        </div>
        
        <div className="flex items-center space-x-4">
          <button 
            onClick={handleNotificationClick}
            className="relative p-2 text-gray-400 hover:text-white transition-colors"
          >
            <Bell className="h-6 w-6" />
            {notifications > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {notifications}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Welcome back, {user?.name || 'Ambassador'}!</h2>
          <p className="text-gray-400">Here's what's happening with your ambassador program today.</p>
        </div>

        {/* Stats Grid (Current Day, Tasks Completed, Total Points, Current Rank) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gray-800 border-gray-700 hover:bg-gray-750 transition-colors">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-medium">Current Day</p>
                  <p className="text-2xl font-bold text-white mt-1">{dashboardStats?.current_day_tasks || 0}</p>
                  <p className="text-green-400 text-xs mt-1">+12% from last week</p>
                </div>
                <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700 hover:bg-gray-750 transition-colors">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-medium">Tasks Completed</p>
                  <p className="text-2xl font-bold text-white mt-1">{dashboardStats?.tasks_completed || 0}</p>
                  <p className="text-green-400 text-xs mt-1">+8% from last week</p>
                </div>
                <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700 hover:bg-gray-750 transition-colors">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-medium">Total Points</p>
                  <p className="text-2xl font-bold text-white mt-1">{dashboardStats?.total_points || 0}</p>
                  <p className="text-green-400 text-xs mt-1">+15% from last week</p>
                </div>
                <div className="w-12 h-12 bg-yellow-600 rounded-lg flex items-center justify-center">
                  <Award className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700 hover:bg-gray-750 transition-colors">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-medium">Current Rank</p>
                  <p className="text-2xl font-bold text-white mt-1">{dashboardStats?.current_rank || 'N/A'}</p>
                  <p className="text-blue-400 text-xs mt-1">Among all ambassadors</p>
                </div>
                <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Progress and Analytics Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Progress Section with gradient bar and stats */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Your Progress</CardTitle>
              <CardDescription className="text-gray-400">Track your ambassador journey</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-300">Completion Rate</span>
                    <span className="text-sm font-medium text-white">{dashboardStats?.completion_rate || 0}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${dashboardStats?.completion_rate || 0}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-700 rounded-lg p-4 text-center">
                    <Users className="h-8 w-8 text-blue-400 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-white">{dashboardStats?.people_connected || 0}</p>
                    <p className="text-gray-400 text-sm">People Connected</p>
                  </div>
                  
                  <div className="bg-gray-700 rounded-lg p-4 text-center">
                    <CheckCircle className="h-8 w-8 text-green-400 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-white">{dashboardStats?.tasks_completed || 0}</p>
                    <p className="text-gray-400 text-sm">Tasks Completed</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Analytics Chart Placeholder */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white">Performance Analytics</CardTitle>
                  <CardDescription className="text-gray-400">Your weekly performance</CardDescription>
                </div>
                <button
                  onClick={navigateToLeaderboardAnalytics}
                  className="text-sm text-blue-400 hover:text-blue-300 underline"
                >
                  More
                </button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-gray-700 rounded-lg p-4">
                {/* Simple inline SVG line chart (no extra deps) */}
                <SimpleLineChart />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Next Task Section */}
        {dashboardStats?.next_task && (
          <Card className="bg-gradient-to-r from-purple-600 to-blue-600 border-0">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-2">{dashboardStats.next_task.title}</h3>
                  <p className="text-purple-100 mb-4">{dashboardStats.next_task.description}</p>
                  <div className="flex items-center space-x-4 text-sm">
                    <span className="text-purple-200">Day {dashboardStats.next_task.day} • {dashboardStats.next_task.points} points</span>
                    <div className="flex items-center space-x-1 text-yellow-300">
                      <Eye className="h-4 w-4" />
                      <span>{dashboardStats.next_task.priority}</span>
                    </div>
                  </div>
                </div>
                <Button 
                  onClick={handleStartTask}
                  className="bg-white text-purple-600 hover:bg-gray-100 font-medium"
                >
                  Start Task
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Video Modal */}
        <div className={`${showVideoModal ? 'fixed' : 'hidden'} inset-0 z-50 flex items-center justify-center`}
             role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/70" onClick={() => setShowVideoModal(false)}></div>
          <div className="relative w-full max-w-3xl mx-4 bg-gray-900 rounded-lg border border-gray-700 shadow-xl">
            <div className="flex items-center justify-between p-4 border-b border-gray-800">
              <h3 className="text-lg font-semibold text-white">Orientation Video</h3>
              <button
                onClick={() => setShowVideoModal(false)}
                className="text-gray-400 hover:text-white"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <div className="p-4">
              <div className="w-full rounded-lg overflow-hidden bg-black">
                <video controls className="w-full h-64 md:h-96">
                  <source src="https://www.w3schools.com/html/mov_bbb.mp4" type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>
              <p className="text-gray-300 text-sm mt-3">
                Watch this brief orientation to get started. After completing, you will understand our mission and how to be an effective ambassador.
              </p>
              <div className="mt-4 flex justify-end gap-2">
                <Button
                  onClick={() => setShowVideoModal(false)}
                  variant="outline"
                  className="border-gray-700 text-gray-300 hover:bg-gray-800"
                >
                  Close
                </Button>
                <Button
                  onClick={() => setShowVideoModal(false)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Mark as Watched
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

// Lightweight inline chart component (kept at bottom of file for locality)
const SimpleLineChart: React.FC = () => {
  // Static demo data with x-axis labels (Mon-Sun)
  const labels: string[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const points: number[] = [20, 35, 30, 50, 45, 60, 55];
  const width = 600;
  const height = 180;
  const padding = 32;
  const step = (width - padding * 2) / (points.length - 1);
  const maxVal = Math.max(...points);
  const minVal = Math.min(...points);
  const scaleY = (value: number) => {
    if (maxVal === minVal) return height / 2; // avoid divide by zero
    return padding + (height - padding * 2) * (1 - (value - minVal) / (maxVal - minVal));
  };

  // Build polyline points string
  const polyPoints = points
    .map((v, i) => `${padding + i * step},${scaleY(v)}`)
    .join(' ');

  // Y-axis ticks
  const ticks = 4;
  const yTicks: number[] = Array.from({ length: ticks + 1 }, (_, i) =>
    Math.round(minVal + (i * (maxVal - minVal)) / ticks)
  );

  // Tooltip index
  const [hoverIndex, setHoverIndex] = React.useState<number | null>(null);

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
      {/* Gridlines and Y labels */}
      {yTicks.map((t) => {
        const y = scaleY(t);
        return (
          <g key={`grid-${t}`}>
            <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="#374151" strokeDasharray="4 4" strokeWidth={1} />
            <text x={padding - 8} y={y + 4} textAnchor="end" fontSize="10" fill="#9CA3AF">{t}</text>
          </g>
        );
      })}

      {/* Axes */}
      <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#4B5563" strokeWidth={2} />
      <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#4B5563" strokeWidth={2} />

      {/* X labels */}
      {labels.map((label, i) => (
        <text key={label} x={padding + i * step} y={height - padding + 16} textAnchor="middle" fontSize="10" fill="#9CA3AF">
          {label}
        </text>
      ))}

      {/* Area fill */}
      <polyline
        points={`${polyPoints} ${width - padding},${height - padding} ${padding},${height - padding}`}
        fill="url(#gradient)"
        stroke="none"
        opacity={0.3}
      />

      {/* Line */}
      <polyline points={polyPoints} fill="none" stroke="#60A5FA" strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" />

      {/* Points + tooltip */}
      {points.map((v, i) => {
        const cx = padding + i * step;
        const cy = scaleY(v);
        const isActive = hoverIndex === i;
        return (
          <g key={i} onMouseEnter={() => setHoverIndex(i)} onMouseLeave={() => setHoverIndex(null)}>
            <circle cx={cx} cy={cy} r={4} fill={isActive ? '#FFFFFF' : '#93C5FD'} stroke="#60A5FA" strokeWidth={isActive ? 2 : 0} />
            <circle cx={cx} cy={cy} r={12} fill="transparent" />
            {isActive && (
              <g>
                <rect x={cx - 28} y={cy - 40} rx={4} width={56} height={24} fill="#111827" stroke="#1F2937" />
                <text x={cx} y={cy - 25} textAnchor="middle" fontSize="10" fill="#E5E7EB">{labels[i]}: {v}</text>
              </g>
            )}
          </g>
        );
      })}

      {/* Gradient defs */}
      <defs>
        <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#60A5FA" stopOpacity={0.6} />
          <stop offset="100%" stopColor="#60A5FA" stopOpacity={0} />
        </linearGradient>
      </defs>
    </svg>
  );
};
