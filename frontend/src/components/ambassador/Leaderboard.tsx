import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Medal, Award, Crown, TrendingUp, Users, Star, Target, Eye, CheckCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTaskData } from '../../hooks/useTaskData';

const BACKEND_URL = 'http://127.0.0.1:5000';

interface LeaderboardEntry {
  id: string;
  rank: number;
  name: string;
  college: string;
  points: number;
  tasks_completed: number;
  // people_referred: number;
  avatar: string;
  trend: 'up' | 'down' | 'stable';
  last_activity: string;
}

interface LeaderboardProps {
  user?: any;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ user }) => {
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [period, setPeriod] = useState<'weekly' | 'monthly' | 'all_time'>('weekly');
  const [loading, setLoading] = useState(true);
  const [userRank, setUserRank] = useState<number>(0);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [modalEntry, setModalEntry] = useState<LeaderboardEntry | null>(null);
  const { stats, completions, loading: taskLoading } = useTaskData();



  // Sample data
  const sampleLeaderboard: LeaderboardEntry[] = [
    {
      id: '1',
      rank: 1,
      name: 'Sarah Johnson',
      college: 'MIT',
      points: 2850,
      tasks_completed: 24,
      // people_referred: 12,
      avatar: 'SJ',
      trend: 'up',
      last_activity: '2 hours ago'
    },
    {
      id: '2',
      rank: 2,
      name: 'Michael Chen',
      college: 'Stanford',
      points: 2720,
      tasks_completed: 22,
      // people_referred: 10,
      avatar: 'MC',
      trend: 'up',
      last_activity: '1 hour ago'
    },
    {
      id: '3',
      rank: 3,
      name: 'Emily Rodriguez',
      college: 'Harvard',
      points: 2580,
      tasks_completed: 20,
      // people_referred: 8,      
      avatar: 'ER',
      trend: 'stable',
      last_activity: '3 hours ago'
    },
    {
      id: '4',
      rank: 4,
      name: 'David Kim',
      college: 'UC Berkeley',
      points: 2450,
      tasks_completed: 19,
      // people_referred: 7,
      avatar: 'DK',
      trend: 'down',
      last_activity: '5 hours ago'
    },
    {
      id: '5',
      rank: 5,
      name: 'Lisa Wang',
      college: 'Yale',
      points: 2320,
      tasks_completed: 18,
      // people_referred: 6,
      avatar: 'LW',
      trend: 'up',
      last_activity: '1 day ago'
    },
    {
      id: '6',
      rank: 6,
      name: 'James Wilson',
      college: 'Princeton',
      points: 2180,
      tasks_completed: 17,
      // people_referred: 5,
      avatar: 'JW',
      trend: 'stable',
      last_activity: '2 days ago'
    },
    {
      id: '7',
      rank: 7,
      name: 'Maria Garcia',
      college: 'Columbia',
      points: 2050,
      tasks_completed: 16,
      // people_referred: 4,
      avatar: 'MG',
      trend: 'up',
      last_activity: '1 day ago'
    },
    {
      id: '8',
      rank: 8,
      name: 'Alex Thompson',
      college: 'Duke',
      points: 1920,
      tasks_completed: 15,
      // people_referred: 3,
      avatar: 'AT',
      trend: 'down',
      last_activity: '3 days ago'
    }
  ];

  // Function to fetch user's current rank from backend
  const fetchUserRank = async () => {
    if (!user) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`${BACKEND_URL}/api/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const userData = await response.json();
        if (userData.rank_position && userData.rank_position > 0) {
          setUserRank(userData.rank_position);
        }
      }
    } catch (error) {
      console.error('Error fetching user rank:', error);
    }
  };

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setLoading(false);
          return;
        }

        const response = await fetch(`${BACKEND_URL}/api/leaderboard?limit=20`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();

          // Transform backend data to match frontend interface
          const transformedData = data.map((entry: any, index: number) => ({
            id: (index + 1).toString(),
            rank: entry.rank,
            name: entry.name,
            college: entry.college,
            points: entry.total_points,
            tasks_completed: Math.floor(entry.total_points / 100), // Estimate based on points
            // people_referred: entry.total_referrals,
            avatar: entry.name.split(' ').map((n: string) => n[0]).join('').toUpperCase(),
            trend: 'stable', // Default trend - could be enhanced with historical data
            last_activity: 'Recently active'
          }));

          setLeaderboardData(transformedData);

          // Find current user's rank using actual user data
          let currentUserRank = 0;
          if (user) {
            // First try to use the rank_position from user data if available
            if (user.rank_position && user.rank_position > 0) {
              currentUserRank = user.rank_position;
            } else {
              // Fallback: find user in leaderboard data by ID or name
              const userInLeaderboard = transformedData.findIndex((entry: any) =>
                entry.name === user.name || entry.id === user.id
              ) + 1;
              currentUserRank = userInLeaderboard || 0;
            }
          }

          // If we still don't have a rank, try to calculate it based on user's points
          if (currentUserRank === 0 && user?.total_points) {
            // Count how many users have more points than current user
            const usersWithMorePoints = transformedData.filter((entry: any) =>
              entry.points > user.total_points
            ).length;
            currentUserRank = usersWithMorePoints + 1;
          }

          setUserRank(currentUserRank || 0);
        } else {
          console.error('Failed to fetch leaderboard');
          setLeaderboardData(sampleLeaderboard);
          // Use user's rank_position if available, otherwise fallback
          setUserRank(user?.rank_position || 15);
        }
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
        setLeaderboardData(sampleLeaderboard);
        // Use user's rank_position if available, otherwise fallback
        setUserRank(user?.rank_position || 15);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
    // Also fetch user rank separately to ensure it's up to date
    fetchUserRank();
  }, [period, user]);

  const handlePeriodChange = (newPeriod: 'weekly' | 'monthly' | 'all_time') => {
    setPeriod(newPeriod);
    setLoading(true);
    // Simulate loading for period change
    setTimeout(() => setLoading(false), 500);
  };

  const handleViewProfile = (entry: LeaderboardEntry) => {
    setModalEntry(entry);
    setShowProfileModal(true);
  };

  const handleShareLeaderboard = () => {
    alert('Sharing leaderboard...\n\nThis would typically open a share dialog or copy a link to the clipboard.');
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="h-5 w-5 text-yellow-400" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
    if (rank === 3) return <Award className="h-5 w-5 text-orange-400" />;
    return <span className="text-lg font-bold text-gray-400">#{rank}</span>;
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return 'bg-yellow-600 text-white';
    if (rank === 2) return 'bg-gray-600 text-white';
    if (rank === 3) return 'bg-orange-600 text-white';
    return 'bg-gray-700 text-gray-300';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-400" />;
      case 'down': return <TrendingUp className="h-4 w-4 text-red-400 transform rotate-180" />;
      default: return <div className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-xl text-gray-400">Loading leaderboard...</div>
      </div>
    );
  }

  const topScore = Math.max(...leaderboardData.map(entry => entry.points));
  const averageScore = Math.round(leaderboardData.reduce((sum, entry) => sum + entry.points, 0) / leaderboardData.length);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header with Leaderboard Title and Period Filters */}
      <div className="flex items-center justify-between p-6 border-b border-gray-800">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold">Leaderboard</h1>
        </div>
        
        <div className="flex items-center space-x-4">
          <Button 
            onClick={handleShareLeaderboard}
            variant="default"
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Share Leaderboard
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        {/* Period Filters */}
        <div className="flex items-center space-x-2 mb-6">
          <Button
            onClick={() => handlePeriodChange('weekly')}
            variant={period === 'weekly' ? 'default' : 'outline'}
            className={period === 'weekly' ? 'bg-blue-600' : 'border-gray-600 text-gray-300 hover:bg-gray-800'}
          >
            Weekly
          </Button>
          <Button
            onClick={() => handlePeriodChange('monthly')}
            variant={period === 'monthly' ? 'default' : 'outline'}
            className={period === 'monthly' ? 'bg-blue-600' : 'border-gray-600 text-gray-300 hover:bg-gray-800'}
          >
            Monthly
          </Button>
          <Button
            onClick={() => handlePeriodChange('all_time')}
            variant={period === 'all_time' ? 'default' : 'outline'}
            className={period === 'all_time' ? 'bg-blue-600' : 'border-gray-600 text-gray-300 hover:bg-gray-800'}
          >
            All Time
          </Button>
        </div>

        {/* Stats Overview (Total Participants, Top Score, Average Score, Your Rank) */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-medium">Total Participants</p>
                  <p className="text-2xl font-bold text-white mt-1">{leaderboardData.length}</p>
                  <p className="text-blue-400 text-xs mt-1">Active ambassadors</p>
                </div>
                <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Users className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-medium">Top Score</p>
                  <p className="text-2xl font-bold text-white mt-1">{topScore}</p>
                  <p className="text-yellow-400 text-xs mt-1">Highest points</p>
                </div>
                <div className="w-12 h-12 bg-yellow-600 rounded-lg flex items-center justify-center">
                  <Trophy className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-medium">Average Score</p>
                  <p className="text-2xl font-bold text-white mt-1">{averageScore}</p>
                  <p className="text-green-400 text-xs mt-1">Per participant</p>
                </div>
                <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                  <Target className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-medium">Your Rank</p>
                  <p className="text-2xl font-bold text-white mt-1">
                    {userRank > 0 ? `#${userRank}` : 'Unranked'}
                  </p>
                  <p className="text-purple-400 text-xs mt-1">
                    {userRank > 0 ? 'Keep climbing!' : 'Complete tasks to get ranked!'}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
                  <Star className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* User Performance Summary */}
        {user && (
          <Card className="bg-gradient-to-r from-purple-600 to-blue-600 border-0 mb-8">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                    <span className="text-2xl font-bold text-white">
                      {user.name?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">{user.name}</h3>
                    <p className="text-purple-100">{user.college}</p>
                    <div className="flex items-center space-x-4 mt-2">
                      <span className="text-purple-200 text-sm">
                        {user.total_points || 0} points
                      </span>
                      <span className="text-purple-200 text-sm">•</span>
                      <span className="text-purple-200 text-sm">
                        {userRank > 0 ? `Rank #${userRank}` : 'Not ranked yet'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-white">
                    {userRank > 0 ? `#${userRank}` : '—'}
                  </div>
                  <p className="text-purple-200 text-sm">
                    {userRank > 0 ? 'Current Rank' : 'Complete tasks to rank'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Task Completion Metrics */}
        {!taskLoading && stats.completedTasks > 0 && (
          <Card className="bg-gray-800 border-gray-700 mb-8">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <CheckCircle className="h-6 w-6 text-green-400" />
                <span>Your Task Performance</span>
              </CardTitle>
              <CardDescription className="text-gray-400">
                Your personal task completion statistics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
                    <CheckCircle className="h-8 w-8 text-white" />
                  </div>
                  <p className="text-2xl font-bold text-white">{stats.completedTasks}</p>
                  <p className="text-gray-400 text-sm">Tasks Completed</p>
                  <p className="text-green-400 text-xs mt-1">{stats.completionRate.toFixed(1)}% completion rate</p>
                </div>

                <div className="text-center">
                  <div className="w-16 h-16 bg-yellow-600 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Star className="h-8 w-8 text-white" />
                  </div>
                  <p className="text-2xl font-bold text-white">{stats.totalPoints}</p>
                  <p className="text-gray-400 text-sm">Total Points</p>
                  <p className="text-yellow-400 text-xs mt-1">Avg {stats.averagePointsPerTask.toFixed(0)} per task</p>
                </div>

                <div className="text-center">
                  <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Users className="h-8 w-8 text-white" />
                  </div>
                  <p className="text-2xl font-bold text-white">{stats.totalPeopleConnected}</p>
                  <p className="text-gray-400 text-sm">People Connected</p>
                  <p className="text-purple-400 text-xs mt-1">Network expansion</p>
                </div>
              </div>

              {/* Recent Completions */}
              {stats.recentCompletions.length > 0 && (
                <div>
                  <h4 className="text-white font-medium mb-3 flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-blue-400" />
                    <span>Recent Completions</span>
                  </h4>
                  <div className="space-y-2">
                    {stats.recentCompletions.slice(0, 3).map((completion) => (
                      <div
                        key={completion.id}
                        className="flex items-center justify-between p-3 bg-gray-700 rounded-lg"
                      >
                        <div>
                          <p className="text-white text-sm font-medium">{completion.taskTitle}</p>
                          <p className="text-gray-400 text-xs">
                            Day {completion.day} • {new Date(completion.completedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-yellow-400 font-medium">+{completion.points}</p>
                          <p className="text-gray-400 text-xs">{completion.peopleConnected} connected</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Leaderboard Table Card */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Top Performers</CardTitle>
            <CardDescription className="text-gray-400">
              {period === 'weekly' ? 'This week\'s top performers' : 
               period === 'monthly' ? 'This month\'s top performers' : 
               'All-time top performers'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {leaderboardData.slice(0, 5).map((entry) => (
                <div 
                  key={entry.id}
                  className="flex items-center justify-between p-4 bg-gray-700 rounded-lg hover:bg-gray-650 transition-colors"
                >
                  {/* Left content: keep name and college */}
                  <div className="flex items-center space-x-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getRankBadge(entry.rank)}`}>
                      {getRankIcon(entry.rank)}
                    </div>
                    <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-sm">{entry.avatar}</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-white">{entry.name}</h4>
                      <p className="text-gray-400 text-sm">{entry.college}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-6">
                    <div className="text-right">
                      <p className="text-2xl font-bold text-white">{entry.points}</p>
                      <p className="text-gray-400 text-sm">points</p>
                    </div>

                    <Button
                      onClick={() => handleViewProfile(entry)}
                      variant="ghost"
                      size="sm"
                      className="text-blue-400 hover:text-blue-300"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Profile Details Modal */}
        <div className={`${showProfileModal ? 'fixed' : 'hidden'} inset-0 z-50 flex items-center justify-center`} role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/70" onClick={() => setShowProfileModal(false)}></div>
          <div className="relative w-full max-w-2xl mx-4 bg-gray-900 rounded-lg border border-gray-700 shadow-xl">
            <div className="flex items-center justify-between p-4 border-b border-gray-800">
              <h3 className="text-lg font-semibold text-white">{modalEntry?.name}</h3>
              <button
                onClick={() => setShowProfileModal(false)}
                className="text-gray-400 hover:text-white"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">{modalEntry?.avatar}</span>
                </div>
                <div>
                  <p className="text-white font-medium">{modalEntry?.name}</p>
                  <p className="text-gray-400 text-sm">{modalEntry?.college}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div className="bg-gray-800 rounded-lg p-3">
                  <p className="text-gray-400">Rank</p>
                  <p className="text-white font-medium">#{modalEntry?.rank}</p>
                </div>
                <div className="bg-gray-800 rounded-lg p-3">
                  <p className="text-gray-400">Points</p>
                  <p className="text-white font-medium">{modalEntry?.points}</p>
                </div>
                <div className="bg-gray-800 rounded-lg p-3">
                  <p className="text-gray-400">Tasks Completed</p>
                  <p className="text-white font-medium">{modalEntry?.tasks_completed}</p>
                </div>
                {/* <div className="bg-gray-800 rounded-lg p-3">
                  // {/* <p className="text-gray-400">People Referred</p> */}
                   {/* <p className="text-white font-medium">{modalEntry?.people_referred}</p> */}
                {/* </div> */} 
                <div className="bg-gray-800 rounded-lg p-3">
                  <p className="text-gray-400">Trend</p>
                  <div className="flex items-center space-x-2">
                    {modalEntry && getTrendIcon(modalEntry.trend)}
                    <span className="text-gray-300 capitalize">{modalEntry?.trend}</span>
                  </div>
                </div>
                <div className="bg-gray-800 rounded-lg p-3">
                  <p className="text-gray-400">Last Activity</p>
                  <p className="text-white font-medium">{modalEntry?.last_activity}</p>
                </div>
              </div>
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowProfileModal(false)}
                  className="border-gray-700 text-gray-300 hover:bg-gray-800"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>



      </div>
    </div>
  );
};

export default Leaderboard;
