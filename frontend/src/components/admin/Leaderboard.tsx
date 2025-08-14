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
  growth_trend: 'up' | 'down' | 'stable';
  weekly_change: number;
}

interface LeaderboardStats {
  total_ambassadors: number;
  active_this_week: number;
  total_points_awarded: number;
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
    total_points_awarded: 125600
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
          console.error('No authentication token found');
          setStats(sampleStats);
          setAmbassadors(sampleAmbassadors);
          // Extract group leaders from sample data
          const leaders = Array.from(new Set(sampleAmbassadors.map(amb => amb.group_leader_name)));
          setGroupLeaders(leaders);
          setLoading(false);
          return;
        }

        const headers = {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        };

        // Fetch ambassadors data
        const ambassadorsResponse = await fetch(`${BACKEND_URL}/api/admin/ambassadors`, { headers });

        if (!ambassadorsResponse.ok) {
          throw new Error(`Ambassadors API failed: ${ambassadorsResponse.status}`);
        }

        const ambassadorsData = await ambassadorsResponse.json();
        console.log('Fetched ambassadors for leaderboard:', ambassadorsData);

        // Fetch submissions to calculate more accurate stats
        const submissionsResponse = await fetch(`${BACKEND_URL}/api/admin/submissions`, { headers });
        let submissionsData: any[] = [];

        if (submissionsResponse.ok) {
          submissionsData = await submissionsResponse.json();
          console.log('Fetched submissions for leaderboard stats:', submissionsData);
        }

        // Transform ambassador data to match our interface
        const transformedAmbassadors: Ambassador[] = ambassadorsData.map((amb: any) => {
          // Calculate tasks completed from submissions
          const userSubmissions = submissionsData.filter((sub: any) => sub.user_id === amb.id || sub.user_id === amb.user_id);
          const tasksCompleted = userSubmissions.length;

          // Calculate completion rate based on campaign days
          const campaignDays = amb.campaign_days || amb.current_day || 0;
          const completionRate = campaignDays > 0 ? Math.min(100, (tasksCompleted / campaignDays) * 100) : 0;

          // Determine growth trend based on points
          let growthTrend: 'up' | 'down' | 'stable' = 'stable';
          if (amb.total_points > 1000) growthTrend = 'up';
          else if (amb.total_points < 500) growthTrend = 'down';

          return {
            id: amb.id || amb.user_id,
            name: amb.name,
            email: amb.email,
            college: amb.college,
            group_leader_name: amb.group_leader_name || 'No Group Leader',
            rank: 0, // Will be set after sorting
            points: amb.total_points || 0,
            tasks_completed: tasksCompleted,
            people_referred: amb.total_referrals || 0,
            last_activity: amb.last_activity || amb.join_date || 'Unknown',
            status: (amb.status === 'active' || !amb.status) ? 'active' : (amb.status === 'suspended' ? 'suspended' : 'inactive'),
            growth_trend: growthTrend,
            weekly_change: Math.floor(Math.random() * 30) - 15 // Mock data for weekly change - would need historical data
          };
        });

        // Sort by points (descending) and assign ranks
        transformedAmbassadors.sort((a, b) => b.points - a.points);
        transformedAmbassadors.forEach((amb, index) => {
          amb.rank = index + 1;
        });

        setAmbassadors(transformedAmbassadors);

        // Extract unique group leaders
        const leaders = Array.from(new Set(transformedAmbassadors.map(amb => amb.group_leader_name).filter(Boolean)));
        setGroupLeaders(leaders);

        // Calculate real stats
        const activeAmbassadors = transformedAmbassadors.filter(amb => amb.status === 'active');

        // Calculate active this week (ambassadors with submissions in the last 7 days)
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);

        // Get unique user IDs who have submitted in the last week
        const activeUserIds = new Set();
        submissionsData.forEach((submission: any) => {
          // Try multiple date fields and formats
          const dateFields = [submission.submitted_at, submission.created_at, submission.submission_date];
          for (const dateField of dateFields) {
            if (dateField) {
              try {
                const submissionDate = new Date(dateField);
                if (!isNaN(submissionDate.getTime()) && submissionDate >= weekAgo) {
                  activeUserIds.add(submission.user_id);
                  break; // Found a valid recent date, no need to check other fields
                }
              } catch (error) {
                // Continue to next date field if this one fails to parse
                continue;
              }
            }
          }
        });

        // Count ambassadors who have been active this week
        let activeThisWeek = transformedAmbassadors.filter(amb =>
          activeUserIds.has(amb.id) || activeUserIds.has(amb.id.toString())
        );

        // Fallback: if no recent submissions found, count active ambassadors
        if (activeThisWeek.length === 0 && submissionsData.length === 0) {
          activeThisWeek = transformedAmbassadors.filter(amb => amb.status === 'active');
        }

        const calculatedStats: LeaderboardStats = {
          total_ambassadors: transformedAmbassadors.length,
          active_this_week: activeThisWeek.length,
          total_points_awarded: transformedAmbassadors.reduce((sum, amb) => sum + amb.points, 0)
        };

        setStats(calculatedStats);
        console.log('Leaderboard data updated successfully');
        console.log('Active this week count:', activeThisWeek.length);
        console.log('Active user IDs:', Array.from(activeUserIds));
        console.log('Recent submissions:', submissionsData.filter((sub: any) => {
          if (sub.submitted_at) {
            const submissionDate = new Date(sub.submitted_at);
            return submissionDate >= weekAgo;
          }
          return false;
        }));
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
