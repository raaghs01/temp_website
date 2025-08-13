import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Trophy,
  Users,
  Award,
  TrendingUp,
  Eye,
  Ban,
  UserCheck,
  Send,
  Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Ambassador {
  id: string;
  name: string;
  email: string;
  college: string;
  group_leader_name: string;
  avatar?: string;
  rank: number;
  points: number;
  tasks_completed: number;
  people_referred: number;
  last_activity: string;
  status: 'active' | 'inactive' | 'suspended';
  completion_rate: number;
  growth_trend: 'up' | 'down' | 'stable';
  weekly_change: number;
}

interface LeaderboardStats {
  total_ambassadors: number;
  active_this_week: number;
  total_points_awarded: number;
  avg_completion_rate: number;
}

const BACKEND_URL = 'http://127.0.0.1:5000';

const Leaderboard: React.FC = () => {
  const [ambassadors, setAmbassadors] = useState<Ambassador[]>([]);
  const [stats, setStats] = useState<LeaderboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'weekly' | 'monthly' | 'alltime'>('monthly');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'suspended'>('all');
  const [groupLeaderFilter, setGroupLeaderFilter] = useState<string>('all');
  const [groupLeaders, setGroupLeaders] = useState<string[]>([]);
  const [selectedAmbassador, setSelectedAmbassador] = useState<Ambassador | null>(null);
  const [showAmbassadorModal, setShowAmbassadorModal] = useState(false);

  // Sample data
  const sampleStats: LeaderboardStats = {
    total_ambassadors: 145,
    active_this_week: 128,
    total_points_awarded: 125600,
    avg_completion_rate: 78.5
  };

  const sampleAmbassadors: Ambassador[] = [
    {
      id: 'amb_001',
      name: 'Ananya Sharma',
      email: 'ananya@college.edu',
      college: 'IIT Delhi',
      group_leader_name: 'Dr. Rajesh Kumar',
      rank: 1,
      points: 2250,
      tasks_completed: 45,
      people_referred: 12,
      last_activity: '2 hours ago',
      status: 'active',
      completion_rate: 94,
      growth_trend: 'up',
      weekly_change: 15
    },
    {
      id: 'amb_002',
      name: 'Rahul Kumar',
      email: 'rahul@college.edu',
      college: 'IIT Bombay',
      group_leader_name: 'Prof. Meera Singh',
      rank: 2,
      points: 2100,
      tasks_completed: 42,
      people_referred: 10,
      last_activity: '5 hours ago',
      status: 'active',
      completion_rate: 88,
      growth_trend: 'up',
      weekly_change: 8
    },
    {
      id: 'amb_003',
      name: 'Priya Patel',
      email: 'priya@college.edu',
      college: 'IIT Madras',
      group_leader_name: 'Dr. Rajesh Kumar',
      rank: 3,
      points: 1950,
      tasks_completed: 38,
      people_referred: 8,
      last_activity: '1 day ago',
      status: 'active',
      completion_rate: 85,
      growth_trend: 'stable',
      weekly_change: 2
    },
    {
      id: 'amb_004',
      name: 'Arjun Singh',
      email: 'arjun@college.edu',
      college: 'IIT Kanpur',
      group_leader_name: 'Prof. Meera Singh',
      rank: 4,
      points: 1800,
      tasks_completed: 35,
      people_referred: 6,
      last_activity: '3 hours ago',
      status: 'active',
      completion_rate: 82,
      growth_trend: 'down',
      weekly_change: -5
    },
    {
      id: 'amb_005',
      name: 'Sneha Reddy',
      email: 'sneha@college.edu',
      college: 'IIT Hyderabad',
      group_leader_name: 'Dr. Amit Sharma',
      rank: 5,
      points: 1650,
      tasks_completed: 32,
      people_referred: 7,
      last_activity: '1 hour ago',
      status: 'active',
      completion_rate: 79,
      growth_trend: 'up',
      weekly_change: 12
    },
    {
      id: 'amb_006',
      name: 'Vikram Joshi',
      email: 'vikram@college.edu',
      college: 'IIT Roorkee',
      group_leader_name: 'Dr. Amit Sharma',
      rank: 6,
      points: 1500,
      tasks_completed: 28,
      people_referred: 5,
      last_activity: '2 days ago',
      status: 'inactive',
      completion_rate: 65,
      growth_trend: 'down',
      weekly_change: -10
    },
    {
      id: 'amb_007',
      name: 'Kavya Nair',
      email: 'kavya@college.edu',
      college: 'IIT Guwahati',
      group_leader_name: 'Prof. Sunita Patel',
      rank: 7,
      points: 1350,
      tasks_completed: 25,
      people_referred: 4,
      last_activity: '1 week ago',
      status: 'suspended',
      completion_rate: 45,
      growth_trend: 'down',
      weekly_change: -20
    }
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');

        if (!token) {
          console.error('No token found');
          setStats(sampleStats);
          setAmbassadors(sampleAmbassadors);
          // Extract group leaders from sample data
          const leaders = Array.from(new Set(sampleAmbassadors.map(amb => amb.group_leader_name)));
          setGroupLeaders(leaders);
          return;
        }

        // Fetch ambassadors data
        const ambassadorsResponse = await fetch(`${BACKEND_URL}/api/admin/ambassadors`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        // Fetch group leaders
        const groupLeadersResponse = await fetch(`${BACKEND_URL}/api/admin/group-leaders`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (ambassadorsResponse.ok && groupLeadersResponse.ok) {
          const ambassadorsData = await ambassadorsResponse.json();
          const groupLeadersData = await groupLeadersResponse.json();

          // Transform ambassador data to match our interface
          const transformedAmbassadors: Ambassador[] = ambassadorsData.map((amb: any, index: number) => ({
            id: amb.id,
            name: amb.name,
            email: amb.email,
            college: amb.college,
            group_leader_name: amb.group_leader_name || 'No Group Leader',
            rank: amb.rank_position || index + 1,
            points: amb.total_points || 0,
            tasks_completed: amb.campaign_days || 0,
            people_referred: amb.total_referrals || 0,
            last_activity: amb.last_activity || amb.join_date || 'Unknown',
            status: amb.status === 'active' ? 'active' : 'inactive',
            completion_rate: Math.min(100, Math.max(0, (amb.total_points || 0) / Math.max(1, amb.campaign_days || 1) * 2)),
            growth_trend: amb.total_points > 100 ? 'up' : amb.total_points > 50 ? 'stable' : 'down',
            weekly_change: Math.floor(Math.random() * 20) - 10 // Mock data for weekly change
          }));

          // Sort by points (descending) and assign ranks
          transformedAmbassadors.sort((a, b) => b.points - a.points);
          transformedAmbassadors.forEach((amb, index) => {
            amb.rank = index + 1;
          });

          setAmbassadors(transformedAmbassadors);
          setGroupLeaders(groupLeadersData);

          // Calculate stats
          const activeAmbassadors = transformedAmbassadors.filter(amb => amb.status === 'active');
          const calculatedStats: LeaderboardStats = {
            total_ambassadors: transformedAmbassadors.length,
            active_this_week: activeAmbassadors.length,
            total_points_awarded: transformedAmbassadors.reduce((sum, amb) => sum + amb.points, 0),
            avg_completion_rate: transformedAmbassadors.reduce((sum, amb) => sum + amb.completion_rate, 0) / Math.max(1, transformedAmbassadors.length)
          };

          setStats(calculatedStats);
        } else {
          console.error('Failed to fetch data');
          setStats(sampleStats);
          setAmbassadors(sampleAmbassadors);
          // Extract group leaders from sample data
          const leaders = Array.from(new Set(sampleAmbassadors.map(amb => amb.group_leader_name)));
          setGroupLeaders(leaders);
        }
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
        setStats(sampleStats);
        setAmbassadors(sampleAmbassadors);
        // Extract group leaders from sample data
        const leaders = Array.from(new Set(sampleAmbassadors.map(amb => amb.group_leader_name)));
        setGroupLeaders(leaders);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedPeriod]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-400 bg-green-900/20';
      case 'inactive': return 'text-yellow-400 bg-yellow-900/20';
      case 'suspended': return 'text-red-400 bg-red-900/20';
      default: return 'text-gray-400 bg-gray-900/20';
    }
  };

  const getTrendIcon = (trend: string, change: number) => {
    if (trend === 'up') return <TrendingUp className="h-4 w-4 text-green-400" />;
    if (trend === 'down') return <TrendingUp className="h-4 w-4 text-red-400 rotate-180" />;
    return <div className="h-4 w-4 bg-gray-400 rounded-full" />;
  };

  const filteredAmbassadors = ambassadors.filter(ambassador => {
    const matchesSearch = ambassador.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ambassador.college.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ambassador.group_leader_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || ambassador.status === statusFilter;
    const matchesGroupLeader = groupLeaderFilter === 'all' || ambassador.group_leader_name === groupLeaderFilter;
    return matchesSearch && matchesStatus && matchesGroupLeader;
  });

  const handleAmbassadorAction = async (ambassador: Ambassador, action: string) => {
    const token = localStorage.getItem('token');

    switch (action) {
      case 'view':
        setSelectedAmbassador(ambassador);
        setShowAmbassadorModal(true);
        break;
      case 'suspend':
        if (confirm(`Are you sure you want to suspend ${ambassador.name}?`)) {
          try {
            const response = await fetch(`${BACKEND_URL}/api/admin/suspend-user`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                user_id: ambassador.id,
                status: 'suspended'
              })
            });

            if (response.ok) {
              setAmbassadors(ambassadors.map(a =>
                a.id === ambassador.id ? { ...a, status: 'suspended' as const } : a
              ));
              alert(`${ambassador.name} has been suspended successfully.`);
            } else {
              const errorData = await response.json();
              alert(`Failed to suspend user: ${errorData.detail || 'Unknown error'}`);
            }
          } catch (error) {
            console.error('Error suspending user:', error);
            alert('Failed to suspend user. Please try again.');
          }
        }
        break;
      case 'activate':
        try {
          const response = await fetch(`${BACKEND_URL}/api/admin/activate-user`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              user_id: ambassador.id,
              status: 'active'
            })
          });

          if (response.ok) {
            setAmbassadors(ambassadors.map(a =>
              a.id === ambassador.id ? { ...a, status: 'active' as const } : a
            ));
            alert(`${ambassador.name} has been activated successfully.`);
          } else {
            const errorData = await response.json();
            alert(`Failed to activate user: ${errorData.detail || 'Unknown error'}`);
          }
        } catch (error) {
          console.error('Error activating user:', error);
          alert('Failed to activate user. Please try again.');
        }
        break;
      case 'message':
        alert(`Sending message to ${ambassador.name}`);
        break;
      default:
        break;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-xl text-gray-400">Loading leaderboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-800">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold">Ambassador Leaderboard</h1>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex space-x-2">
            {(['weekly', 'monthly', 'alltime'] as const).map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedPeriod === period
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {period === 'alltime' ? 'All Time' : period.charAt(0).toUpperCase() + period.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-medium">Total Ambassadors</p>
                  <p className="text-2xl font-bold text-white mt-1">{stats?.total_ambassadors}</p>
                  <p className="text-blue-400 text-xs mt-1">Registered users</p>
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
                  <p className="text-gray-400 text-sm font-medium">Active This Week</p>
                  <p className="text-2xl font-bold text-white mt-1">{stats?.active_this_week}</p>
                  <p className="text-green-400 text-xs mt-1">Weekly engagement</p>
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
                  <p className="text-gray-400 text-sm font-medium">Points Awarded</p>
                  <p className="text-2xl font-bold text-white mt-1">{stats?.total_points_awarded?.toLocaleString()}</p>
                  <p className="text-yellow-400 text-xs mt-1">Total distributed</p>
                </div>
                <div className="w-12 h-12 bg-yellow-600 rounded-lg flex items-center justify-center">
                  <Award className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-gray-400 text-sm font-medium">Avg Completion Rate</p>
                  <p className="text-2xl font-bold text-white mt-1">{stats?.avg_completion_rate?.toFixed(1)}%</p>
                  <p className="text-purple-400 text-xs mt-1">Network performance</p>

                  {/* Progress Bar */}
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-400">Performance Level</span>
                      <span className="text-xs text-gray-300">
                        {stats?.avg_completion_rate && stats.avg_completion_rate >= 80 ? 'Excellent' :
                         stats?.avg_completion_rate && stats.avg_completion_rate >= 60 ? 'Good' :
                         stats?.avg_completion_rate && stats.avg_completion_rate >= 40 ? 'Average' : 'Needs Improvement'}
                      </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${
                          stats?.avg_completion_rate && stats.avg_completion_rate >= 80 ? 'bg-gradient-to-r from-green-500 to-emerald-400' :
                          stats?.avg_completion_rate && stats.avg_completion_rate >= 60 ? 'bg-gradient-to-r from-blue-500 to-cyan-400' :
                          stats?.avg_completion_rate && stats.avg_completion_rate >= 40 ? 'bg-gradient-to-r from-yellow-500 to-orange-400' :
                          'bg-gradient-to-r from-red-500 to-pink-400'
                        }`}
                        style={{ width: `${Math.min(100, stats?.avg_completion_rate || 0)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
                <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center ml-4">
                  <Trophy className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="bg-gray-800 border-gray-700 mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col gap-4">
              {/* Status Filter Buttons */}
              <div className="flex flex-wrap gap-2">
                {(['all', 'active', 'inactive', 'suspended'] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      statusFilter === status
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ))}
              </div>

              {/* Search and Group Leader Filter */}
              <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                  <div className="flex items-center space-x-2">
                    <label className="text-sm font-medium text-gray-300 whitespace-nowrap">Group Leader:</label>
                    <select
                      value={groupLeaderFilter}
                      onChange={(e) => setGroupLeaderFilter(e.target.value)}
                      className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[200px]"
                    >
                      <option value="all">All Group Leaders</option>
                      {groupLeaders.map(leader => (
                        <option key={leader} value={leader}>{leader}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center">
                  <Input
                    placeholder="Search ambassadors..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-64 bg-gray-700 border-gray-600 text-white"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Leaderboard Table */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Ambassador Rankings</CardTitle>
            <CardDescription className="text-gray-400">Comprehensive view of all ambassador performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-3 px-4 text-gray-300 font-medium">Rank</th>
                    <th className="text-left py-3 px-4 text-gray-300 font-medium">Ambassador</th>
                    <th className="text-left py-3 px-4 text-gray-300 font-medium">Group Leader</th>
                    <th className="text-left py-3 px-4 text-gray-300 font-medium">Status</th>
                    <th className="text-left py-3 px-4 text-gray-300 font-medium">Trend</th>
                    <th className="text-left py-3 px-4 text-gray-300 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAmbassadors.map((ambassador) => (
                    <tr key={ambassador.id} className="border-b border-gray-700 hover:bg-gray-750">
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          {ambassador.rank <= 3 && (
                            <Trophy className={`h-5 w-5 mr-2 ${
                              ambassador.rank === 1 ? 'text-yellow-400' :
                              ambassador.rank === 2 ? 'text-gray-300' : 'text-yellow-600'
                            }`} />
                          )}
                          <span className="text-white font-bold">#{ambassador.rank}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-sm font-bold">
                            {ambassador.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <p className="text-white font-medium">{ambassador.name}</p>
                            <p className="text-gray-400 text-sm">{ambassador.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          <span className="bg-purple-600 text-white px-2 py-1 rounded text-xs font-medium">
                            {ambassador.group_leader_name}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(ambassador.status)}`}>
                          {ambassador.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          {getTrendIcon(ambassador.growth_trend, ambassador.weekly_change)}
                          <span className={`text-sm ${
                            ambassador.weekly_change > 0 ? 'text-green-400' : 
                            ambassador.weekly_change < 0 ? 'text-red-400' : 'text-gray-400'
                          }`}>
                            {ambassador.weekly_change > 0 ? '+' : ''}{ambassador.weekly_change}%
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleAmbassadorAction(ambassador, 'view')}
                            className="p-1 text-blue-400 hover:text-blue-300"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          {ambassador.status === 'active' ? (
                            <button
                              onClick={() => handleAmbassadorAction(ambassador, 'suspend')}
                              className="p-1 text-red-400 hover:text-red-300"
                            >
                              <Ban className="h-4 w-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleAmbassadorAction(ambassador, 'activate')}
                              className="p-1 text-green-400 hover:text-green-300"
                            >
                              <UserCheck className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Ambassador Detail Modal */}
        {showAmbassadorModal && selectedAmbassador && (
          <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true">
            <div className="absolute inset-0 bg-black/70" onClick={() => setShowAmbassadorModal(false)}></div>
            <div className="relative w-full max-w-3xl mx-4 bg-gray-900 rounded-lg border border-gray-700 shadow-xl">
              <div className="flex items-center justify-between p-6 border-b border-gray-800">
                <h3 className="text-lg font-semibold text-white">Ambassador Profile</h3>
                <button
                  onClick={() => setShowAmbassadorModal(false)}
                  className="text-gray-400 hover:text-white"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="flex items-center space-x-4 mb-6">
                      <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-xl font-bold">
                        {selectedAmbassador.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <h4 className="text-white font-bold text-xl">{selectedAmbassador.name}</h4>
                        <p className="text-gray-400">{selectedAmbassador.email}</p>
                        <p className="text-gray-400">{selectedAmbassador.college}</p>
                        <div className="mt-2">
                          <span className="bg-purple-600 text-white px-2 py-1 rounded text-xs font-medium">
                            {selectedAmbassador.group_leader_name}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <p className="text-gray-400 text-sm">Current Rank</p>
                        <p className="text-white text-2xl font-bold">#{selectedAmbassador.rank}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Status</p>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedAmbassador.status)}`}>
                          {selectedAmbassador.status}
                        </span>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Last Activity</p>
                        <p className="text-white">{selectedAmbassador.last_activity}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-white font-medium mb-4">Performance Metrics</h4>
                    <div className="space-y-4">
                      <div>
                        <p className="text-gray-400 text-sm">Total Points</p>
                        <p className="text-white text-xl font-bold">{selectedAmbassador.points.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Tasks Completed</p>
                        <p className="text-white text-xl font-bold">{selectedAmbassador.tasks_completed}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">People Referred</p>
                        <p className="text-white text-xl font-bold">{selectedAmbassador.people_referred}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Completion Rate</p>
                        <div className="flex items-center space-x-3">
                          <div className="flex-1 bg-gray-600 rounded-full h-3">
                            <div 
                              className="bg-blue-500 h-3 rounded-full"
                              style={{ width: `${selectedAmbassador.completion_rate}%` }}
                            ></div>
                          </div>
                          <span className="text-white font-medium">{selectedAmbassador.completion_rate}%</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Weekly Change</p>
                        <div className="flex items-center space-x-2">
                          {getTrendIcon(selectedAmbassador.growth_trend, selectedAmbassador.weekly_change)}
                          <span className={`font-medium ${
                            selectedAmbassador.weekly_change > 0 ? 'text-green-400' : 
                            selectedAmbassador.weekly_change < 0 ? 'text-red-400' : 'text-gray-400'
                          }`}>
                            {selectedAmbassador.weekly_change > 0 ? '+' : ''}{selectedAmbassador.weekly_change}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <Button
                    onClick={() => setShowAmbassadorModal(false)}
                    variant="outline"
                    className="border-gray-700 text-gray-300 hover:bg-gray-800"
                  >
                    Close
                  </Button>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Send className="h-4 w-4 mr-2" />
                    Send Message
                  </Button>
                  {selectedAmbassador.status === 'active' ? (
                    <Button className="bg-red-600 hover:bg-red-700">
                      <Ban className="h-4 w-4 mr-2" />
                      Suspend
                    </Button>
                  ) : (
                    <Button className="bg-green-600 hover:bg-green-700">
                      <UserCheck className="h-4 w-4 mr-2" />
                      Activate
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;
