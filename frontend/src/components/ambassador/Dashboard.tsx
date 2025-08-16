import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Users, Award, Calendar, CheckCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTaskData } from '../../hooks/useTaskData';

const BACKEND_URL = 'http://127.0.0.1:5001';

interface DashboardStats {
  current_day: number;
  total_tasks_completed: number;
  total_points: number;
  rank: number;
  total_referrals: number;
  completion_percentage: number;
  total_available_tasks: number;
  days_since_registration: number;
  next_task?: {
    id: string;
    title: string;
    description: string;
    points_reward: number;
  };
}

const Dashboard: React.FC<{ user: any; refreshUser: () => Promise<void> }> = ({ user }) => {
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const { stats } = useTaskData();
  const [showVideoModal, setShowVideoModal] = useState(false);

  // Default empty stats
  const defaultStats: DashboardStats = {
    current_day: 1,
    total_tasks_completed: 0,
    total_points: 0,
    rank: 0,
    total_referrals: 0,
    completion_percentage: 0,
    total_available_tasks: 0,
    days_since_registration: 1,
    next_task: undefined
  };

  // Add this helper function
  const getCurrentDay = () => {
    // Use the backend's current_day for consistency
    return dashboardStats?.current_day || 1;
  };

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.error('No authentication token found');
          setDashboardStats(defaultStats);
          setLoading(false);
          return;
        }

        const response = await fetch(`${BACKEND_URL}/api/dashboard-stats`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          console.log('Dashboard stats received:', data);
          setDashboardStats(data);
        } else {
          console.error('Failed to fetch dashboard stats:', response.status, response.statusText);
          const errorText = await response.text();
          console.error('Error details:', errorText);
          setDashboardStats(defaultStats);
        }
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        setDashboardStats(defaultStats);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardStats();
  }, []);



  const navigateToLeaderboardAnalytics = (): void => {
    const navigationEvent = new CustomEvent('navigate', {
      detail: { tab: 'leaderboard', hash: '#analytics' }
    });
    window.dispatchEvent(navigationEvent);
  };

  const navigateToTasks = (): void => {
    const navigationEvent = new CustomEvent('navigate', {
      detail: { tab: 'tasks' }
    });
    window.dispatchEvent(navigationEvent);
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
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-800">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold">Dashboard</h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Welcome back, {user?.name || 'Ambassador'}!</h2>
          <p className="text-gray-400">Here's what's happening with your ambassador program today.</p>
        </div>

        {/* Enhanced Stats Grid with Task Completion Data */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gray-800 border-gray-700 hover:bg-gray-750 transition-colors">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-medium">Current Day</p>
                  <p className="text-2xl font-bold text-white mt-1">{getCurrentDay()}</p>
                  <p className="text-green-400 text-xs mt-1">Days since registration</p>
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
                  <p className="text-2xl font-bold text-white mt-1">{dashboardStats?.total_tasks_completed || 0}</p>
                  <p className="text-blue-400 text-xs mt-1">Total completed</p>
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
                  <p className="text-green-400 text-xs mt-1">Avg {dashboardStats?.total_tasks_completed ? Math.round(dashboardStats.total_points / dashboardStats.total_tasks_completed) : 0} per task</p>
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
                  <p className="text-2xl font-bold text-white mt-1">#{dashboardStats?.rank || 'N/A'}</p>
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
          <Card className="bg-gray-800 border-gray-700 flex flex-col">
            <CardHeader>
              <CardTitle className="text-white">Your Progress</CardTitle>
              <CardDescription className="text-gray-400">Track your ambassador journey</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="space-y-6 h-full flex flex-col">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-300">Tasks Progress</span>
                    <span className="text-sm font-medium text-white">{dashboardStats?.total_tasks_completed || 0} / {dashboardStats?.total_available_tasks || 0}</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${dashboardStats?.completion_percentage || 0}%` }}
                    ></div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-700 rounded-lg p-4 text-center">
                    <Users className="h-8 w-8 text-blue-400 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-white">{dashboardStats?.total_referrals || 0}</p>
                    <p className="text-gray-400 text-sm">People Connected</p>
                  </div>

                  <div className="bg-gray-700 rounded-lg p-4 text-center">
                    <CheckCircle className="h-8 w-8 text-green-400 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-white">{dashboardStats?.total_tasks_completed || 0}</p>
                    <p className="text-gray-400 text-sm">Tasks Completed</p>
                  </div>
                </div>

                {/* Additional Progress Metrics */}
                <div className="border-t border-gray-600 pt-4 mt-auto">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <p className="text-lg font-bold text-white">{dashboardStats?.total_available_tasks || 0}</p>
                      <p className="text-gray-400 text-xs">Available Tasks</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-white">{dashboardStats?.total_tasks_completed ? Math.round(dashboardStats.total_points / dashboardStats.total_tasks_completed) : 0}</p>
                      <p className="text-gray-400 text-xs">Avg Points/Task</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Analytics Chart */}
          <Card className="bg-gray-800 border-gray-700 flex flex-col">
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
            <CardContent className="flex-1">
              <div className="h-full bg-gray-700 rounded-lg p-4 min-h-[320px] flex flex-col">
                {/* Performance chart with real data */}
                <PerformanceChart completions={stats.recentCompletions} monthlyProgress={stats.monthlyProgress} />
              </div>
            </CardContent>
          </Card>
        </div>



        {/* Recent Task Completions */}
        {stats.recentCompletions.length > 0 && (
          <Card className="bg-gray-800 border-gray-700 mb-8">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <Clock className="h-6 w-6 text-blue-400" />
                <span>Recent Task Completions</span>
              </CardTitle>
              <CardDescription className="text-gray-400">
                Your latest completed tasks and achievements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.recentCompletions.slice(0, 3).map((completion) => (
                  <div
                    key={completion.id}
                    className="flex items-center justify-between p-4 bg-gray-700 rounded-lg hover:bg-gray-650 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                        <CheckCircle className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h4 className="text-white font-medium">{completion.taskTitle}</h4>
                        <p className="text-gray-400 text-sm">
                          Day {completion.day}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center space-x-2">
                        <span className="text-yellow-400 font-medium">+{completion.points}</span>
                        <Award className="h-4 w-4 text-yellow-400" />
                      </div>
                      <p className="text-gray-400 text-xs">
                        {new Date(completion.completedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              {stats.recentCompletions.length > 3 && (
                <div className="mt-4 text-center">
                  <Button
                    variant="outline"
                    className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
                    onClick={navigateToTasks}
                  >
                    View All Completions
                  </Button>
                </div>
              )}
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

// Performance chart component with real data
interface PerformanceChartProps {
  completions: any[];
  monthlyProgress: { month: string; tasks: number; points: number }[];
}

const PerformanceChart: React.FC<PerformanceChartProps> = ({ completions }) => {
  // Generate last 7 days data from completions
  const generateWeeklyData = () => {
    const today = new Date();
    const weekData = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
      const dateStr = date.toISOString().split('T')[0];

      // Count completions for this day
      const dayCompletions = completions.filter(comp => {
        const compDate = new Date(comp.completedAt).toISOString().split('T')[0];
        return compDate === dateStr;
      });

      const totalPoints = dayCompletions.reduce((sum, comp) => sum + comp.points, 0);

      weekData.push({
        label: dayName,
        tasks: dayCompletions.length,
        points: totalPoints
      });
    }

    return weekData;
  };

  const weeklyData = generateWeeklyData();
  const labels = weeklyData.map(d => d.label);
  const points = weeklyData.map(d => d.points);

  // Chart dimensions
  const width = 600;
  const height = 180;
  const padding = 32;
  const step = (width - padding * 2) / (points.length - 1);
  const maxVal = Math.max(...points, 1); // Ensure at least 1 to avoid divide by zero
  const minVal = Math.min(...points, 0);

  const scaleY = (value: number) => {
    if (maxVal === minVal) return height / 2;
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
    <div className="w-full h-full flex flex-col">
      {/* Chart Header with Summary */}
      <div className="flex justify-between items-center mb-4">
        <div className="text-sm text-gray-300">
          Last 7 Days Performance
        </div>
        <div className="text-xs text-gray-400">
          Total: {points.reduce((sum, p) => sum + p, 0)} points
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center">
        <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="max-w-full">
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
          fill="url(#performanceGradient)"
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
          const dayData = weeklyData[i];
          return (
            <g key={i} onMouseEnter={() => setHoverIndex(i)} onMouseLeave={() => setHoverIndex(null)}>
              <circle cx={cx} cy={cy} r={4} fill={isActive ? '#FFFFFF' : '#93C5FD'} stroke="#60A5FA" strokeWidth={isActive ? 2 : 0} />
              <circle cx={cx} cy={cy} r={12} fill="transparent" />
              {isActive && (
                <g>
                  <rect x={cx - 35} y={cy - 50} rx={4} width={70} height={35} fill="#111827" stroke="#1F2937" />
                  <text x={cx} y={cy - 35} textAnchor="middle" fontSize="9" fill="#E5E7EB">{labels[i]}</text>
                  <text x={cx} y={cy - 25} textAnchor="middle" fontSize="9" fill="#60A5FA">{v} points</text>
                  <text x={cx} y={cy - 15} textAnchor="middle" fontSize="9" fill="#9CA3AF">{dayData.tasks} tasks</text>
                </g>
              )}
            </g>
          );
        })}

        {/* Gradient defs */}
        <defs>
          <linearGradient id="performanceGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#60A5FA" stopOpacity={0.6} />
            <stop offset="100%" stopColor="#60A5FA" stopOpacity={0} />
          </linearGradient>
        </defs>
        </svg>
      </div>

      {/* Performance Summary */}
      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-xs text-gray-400">Avg Daily</p>
          <p className="text-sm font-semibold text-white">{(points.reduce((sum, p) => sum + p, 0) / 7).toFixed(0)} pts</p>
        </div>
        <div>
          <p className="text-xs text-gray-400">Best Day</p>
          <p className="text-sm font-semibold text-green-400">{Math.max(...points)} pts</p>
        </div>
        <div>
          <p className="text-xs text-gray-400">Tasks/Week</p>
          <p className="text-sm font-semibold text-blue-400">{weeklyData.reduce((sum, d) => sum + d.tasks, 0)}</p>
        </div>
      </div>
    </div>
  );
};
