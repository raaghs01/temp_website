import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Medal, Award, Crown, TrendingUp, Users, Star, Target, Calendar, Eye, BarChart3, PieChart, LineChart, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

const BACKEND_URL = 'http://127.0.0.1:8000';

interface LeaderboardEntry {
  id: string;
  rank: number;
  name: string;
  college: string;
  points: number;
  tasks_completed: number;
  people_referred: number;
  avatar: string;
  trend: 'up' | 'down' | 'stable';
  last_activity: string;
}

const Leaderboard: React.FC = () => {
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [period, setPeriod] = useState<'weekly' | 'monthly' | 'all_time'>('weekly');
  const [loading, setLoading] = useState(true);
  const [userRank, setUserRank] = useState<number>(0);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [modalEntry, setModalEntry] = useState<LeaderboardEntry | null>(null);

  // If opened with #analytics, scroll to that section after mount
  useEffect(() => {
    const hash = window.location.hash;
    if (hash === '#analytics') {
      setTimeout(() => {
        const id = hash.replace('#', '');
        const el = document.getElementById(id);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }, 0);
    }
  }, []);

  // Sample data
  const sampleLeaderboard: LeaderboardEntry[] = [
    {
      id: '1',
      rank: 1,
      name: 'Sarah Johnson',
      college: 'MIT',
      points: 2850,
      tasks_completed: 24,
      people_referred: 12,
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
      people_referred: 10,
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
      people_referred: 8,
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
      people_referred: 7,
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
      people_referred: 6,
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
      people_referred: 5,
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
      people_referred: 4,
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
      people_referred: 3,
      avatar: 'AT',
      trend: 'down',
      last_activity: '3 days ago'
    }
  ];

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        setLeaderboardData(sampleLeaderboard);
        setUserRank(15); // Simulate user rank
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
        setLeaderboardData(sampleLeaderboard);
        setUserRank(15);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [period]);

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
                  <p className="text-2xl font-bold text-white mt-1">#{userRank}</p>
                  <p className="text-purple-400 text-xs mt-1">Keep climbing!</p>
                </div>
                <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
                  <Star className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

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
                <div className="bg-gray-800 rounded-lg p-3">
                  <p className="text-gray-400">People Referred</p>
                  <p className="text-white font-medium">{modalEntry?.people_referred}</p>
                </div>
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

        {/* Analytics Section (inlined from Analytics.tsx) */}
        <div id="analytics" className="mt-12">
          {/* Welcome Section */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-2">Performance Analytics</h2>
            <p className="text-gray-400">Track your growth, analyze campaign effectiveness, and optimize your ambassador strategy.</p>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm font-medium">Total Reach</p>
                    <p className="text-2xl font-bold text-white mt-1">12.5K</p>
                    <p className="text-green-400 text-xs mt-1">+23% this month</p>
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
                    <p className="text-gray-400 text-sm font-medium">Engagement Rate</p>
                    <p className="text-2xl font-bold text-white mt-1">8.7%</p>
                    <p className="text-green-400 text-xs mt-1">+5.2% vs last month</p>
                  </div>
                  <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm font-medium">Conversion Rate</p>
                    <p className="text-2xl font-bold text-white mt-1">3.2%</p>
                    <p className="text-purple-400 text-xs mt-1">Above average</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
                    <Target className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm font-medium">ROI</p>
                    <p className="text-2xl font-bold text-white mt-1">4.8x</p>
                    <p className="text-yellow-400 text-xs mt-1">Excellent return</p>
                  </div>
                  <div className="w-12 h-12 bg-yellow-600 rounded-lg flex items-center justify-center">
                    <Award className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Performance Trends */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center space-x-2">
                  <LineChart className="h-6 w-6 text-blue-400" />
                  <span>Performance Trends</span>
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Your growth over the last 30 days
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-gray-700 rounded-lg p-4">
                  <LeaderboardLineChart />
                </div>
              </CardContent>
            </Card>

            {/* Campaign Distribution */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center space-x-2">
                  <PieChart className="h-6 w-6 text-green-400" />
                  <span>Campaign Distribution</span>
                </CardTitle>
                <CardDescription className="text-gray-400">
                  How your efforts are distributed across campaigns
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-gray-700 rounded-lg p-4 flex items-center justify-center">
                  <DonutChart
                    data={[
                      { label: 'Social Media', value: 45, color: '#60A5FA' },
                      { label: 'Campus Outreach', value: 30, color: '#34D399' },
                      { label: 'Events', value: 25, color: '#A78BFA' },
                    ]}
                    size={180}
                    thickness={24}
                  />
                  <div className="ml-6 space-y-2">
                    <LegendItem color="#60A5FA" label="Social Media" value="45%" />
                    <LegendItem color="#34D399" label="Campus Outreach" value="30%" />
                    <LegendItem color="#A78BFA" label="Events" value="25%" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Top Performing Campaigns */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center space-x-2">
                  <BarChart3 className="h-6 w-6 text-purple-400" />
                  <span>Top Campaigns</span>
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Your best performing campaigns
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-gray-700 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-white">Social Media Blitz</h4>
                      <span className="text-green-400 text-sm font-medium">+45%</span>
                    </div>
                    <div className="w-full bg-gray-600 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: '85%' }}></div>
                    </div>
                    <p className="text-gray-400 text-xs mt-1">2,450 engagements</p>
                  </div>
                  
                  <div className="bg-gray-700 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-white">Campus Outreach</h4>
                      <span className="text-blue-400 text-sm font-medium">+32%</span>
                    </div>
                    <div className="w-full bg-gray-600 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full" style={{ width: '72%' }}></div>
                    </div>
                    <p className="text-gray-400 text-xs mt-1">1,890 engagements</p>
                  </div>
                  
                  <div className="bg-gray-700 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-white">Event Promotion</h4>
                      <span className="text-purple-400 text-sm font-medium">+28%</span>
                    </div>
                    <div className="w-full bg-gray-600 rounded-full h-2">
                      <div className="bg-purple-500 h-2 rounded-full" style={{ width: '65%' }}></div>
                    </div>
                    <p className="text-gray-400 text-xs mt-1">1,234 engagements</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Audience Insights */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center space-x-2">
                  <Users className="h-6 w-6 text-blue-400" />
                  <span>Audience Insights</span>
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Your audience demographics and behavior
                </CardDescription>
              </CardHeader>
              <CardContent>
                <HorizontalBars
                  data={[
                    { label: 'Age 18-24', value: 45, color: '#60A5FA' },
                    { label: 'Age 25-34', value: 32, color: '#34D399' },
                    { label: 'Age 35+', value: 23, color: '#A78BFA' },
                  ]}
                />
              </CardContent>
            </Card>

            {/* Time Analysis */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center space-x-2">
                  <Calendar className="h-6 w-6 text-green-400" />
                  <span>Peak Hours</span>
                </CardTitle>
                <CardDescription className="text-gray-400">
                  When your audience is most active
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PeakHoursChart
                  data={[
                    { label: '9-11 AM', value: 35 },
                    { label: '12-2 PM', value: 65 },
                    { label: '6-9 PM', value: 90 },
                  ]}
                />
              </CardContent>
            </Card>
          </div>

          {/* Coming Soon Notice */}
          <Card className="bg-gradient-to-r from-purple-600 to-blue-600 border-0">
            <CardContent className="p-8 text-center">
              <div className="flex items-center justify-center mb-4">
                <Zap className="h-8 w-8 text-white mr-3" />
                <h3 className="text-2xl font-bold text-white">Advanced Analytics Coming Soon!</h3>
              </div>
              <p className="text-purple-100 mb-6 max-w-2xl mx-auto">
                Get ready for powerful analytics tools that will help you track performance, 
                analyze campaign effectiveness, and optimize your ambassador strategy with 
                real-time insights and predictive analytics.
              </p>
              <div className="flex items-center justify-center space-x-4">
                <div className="bg-white/20 rounded-lg px-4 py-2">
                  <span className="text-white text-sm font-medium">Q2 2024</span>
                </div>
                <div className="bg-white/20 rounded-lg px-4 py-2">
                  <span className="text-white text-sm font-medium">AI-Powered Insights</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;

// Inline lightweight SVG components for charts
const LeaderboardLineChart: React.FC = () => {
  const points = [20, 32, 28, 50, 46, 60, 55];
  const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const width = 600;
  const height = 220;
  const padding = 32;
  const step = (width - padding * 2) / (points.length - 1);
  const maxVal = Math.max(...points);
  const minVal = Math.min(...points);
  const scaleY = (v: number) => padding + (height - padding * 2) * (1 - (v - minVal) / (maxVal - minVal || 1));
  const poly = points.map((v, i) => `${padding + i * step},${scaleY(v)}`).join(' ');
  const [hover, setHover] = React.useState<number | null>(null);
  const yTicks = 4;
  const tickVals = Array.from({ length: yTicks + 1 }, (_, i) => Math.round(minVal + (i * (maxVal - minVal)) / yTicks));

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
      {tickVals.map(t => (
        <g key={`grid-${t}`}>
          <line x1={padding} y1={scaleY(t)} x2={width - padding} y2={scaleY(t)} stroke="#374151" strokeDasharray="4 4" />
          <text x={padding - 8} y={scaleY(t) + 4} fontSize="10" textAnchor="end" fill="#9CA3AF">{t}</text>
        </g>
      ))}
      <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#4B5563" strokeWidth={2} />
      <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#4B5563" strokeWidth={2} />
      {labels.map((l, i) => (
        <text key={l} x={padding + i * step} y={height - padding + 16} fontSize="10" textAnchor="middle" fill="#9CA3AF">{l}</text>
      ))}
      <polyline points={`${poly} ${width - padding},${height - padding} ${padding},${height - padding}`} fill="url(#leaderGradient)" opacity={0.3} />
      <polyline points={poly} fill="none" stroke="#60A5FA" strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" />
      {points.map((v, i) => (
        <g key={i} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
          <circle cx={padding + i * step} cy={scaleY(v)} r={4} fill={hover === i ? '#FFFFFF' : '#93C5FD'} stroke="#60A5FA" strokeWidth={hover === i ? 2 : 0} />
          {hover === i && (
            <g>
              <rect x={padding + i * step - 28} y={scaleY(v) - 40} width={56} height={22} rx={4} fill="#111827" stroke="#1F2937" />
              <text x={padding + i * step} y={scaleY(v) - 25} textAnchor="middle" fontSize="10" fill="#E5E7EB">{labels[i]}: {v}</text>
            </g>
          )}
        </g>
      ))}
      <defs>
        <linearGradient id="leaderGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#60A5FA" stopOpacity={0.6} />
          <stop offset="100%" stopColor="#60A5FA" stopOpacity={0} />
        </linearGradient>
      </defs>
    </svg>
  );
};

const DonutChart: React.FC<{ data: { label: string; value: number; color: string }[]; size?: number; thickness?: number }> = ({ data, size = 180, thickness = 24 }) => {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const cx = size / 2;
  const cy = size / 2;
  const r = (size - thickness) / 2;
  let cumulative = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {data.map((d, i) => {
        const start = (cumulative / total) * Math.PI * 2;
        const end = ((cumulative + d.value) / total) * Math.PI * 2;
        cumulative += d.value;
        const large = end - start > Math.PI ? 1 : 0;
        const x1 = cx + r * Math.cos(start);
        const y1 = cy + r * Math.sin(start);
        const x2 = cx + r * Math.cos(end);
        const y2 = cy + r * Math.sin(end);
        return (
          <g key={i}>
            <path d={`M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`} stroke={d.color} strokeWidth={thickness} fill="none" />
          </g>
        );
      })}
      <circle cx={cx} cy={cy} r={r - thickness / 2} fill="#111827" />
    </svg>
  );
};

const LegendItem: React.FC<{ color: string; label: string; value: string }> = ({ color, label, value }) => (
  <div className="flex items-center space-x-2">
    <span className="inline-block w-3 h-3 rounded" style={{ backgroundColor: color }} />
    <span className="text-gray-200 text-sm">{label}</span>
    <span className="text-gray-400 text-xs">{value}</span>
  </div>
);

const HorizontalBars: React.FC<{ data: { label: string; value: number; color: string }[] }> = ({ data }) => {
  const max = Math.max(...data.map(d => d.value)) || 1;
  return (
    <div className="space-y-3">
      {data.map((d) => (
        <div key={d.label} className="bg-gray-700 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-300 text-sm">{d.label}</span>
            <span className="text-white text-sm font-medium">{d.value}%</span>
          </div>
          <div className="w-full bg-gray-600 rounded-full h-2">
            <div className="h-2 rounded-full" style={{ width: `${Math.round((d.value / max) * 100)}%`, backgroundColor: d.color }} />
          </div>
        </div>
      ))}
    </div>
  );
};

const PeakHoursChart: React.FC<{ data: { label: string; value: number }[] }> = ({ data }) => {
  const width = 600;
  const height = 200;
  const padding = 40;
  const barWidth = (width - padding * 2) / data.length - 20;
  const max = Math.max(...data.map(d => d.value)) || 1;
  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}> 
      {data.map((d, i) => {
        const h = ((d.value / max) * (height - padding * 2)) || 0;
        const x = padding + i * (barWidth + 20);
        const y = height - padding - h;
        const color = i === 2 ? '#34D399' : i === 1 ? '#F59E0B' : '#EF4444';
        return (
          <g key={d.label}>
            <rect x={x} y={y} width={barWidth} height={h} rx={6} fill={color} />
            <text x={x + barWidth / 2} y={height - padding + 16} textAnchor="middle" fontSize="10" fill="#9CA3AF">{d.label}</text>
          </g>
        );
      })}
      <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#4B5563" strokeWidth={2} />
    </svg>
  );
};
