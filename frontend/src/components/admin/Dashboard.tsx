import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  TrendingUp,
  Users,
  Award,
  Calendar,
  CheckCircle,
  Eye,
  Settings,
  UserCheck,
  AlertTriangle,
  Activity,
  BarChart3,
  FileText,
  Ban,
  UserX
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const BACKEND_URL = 'http://127.0.0.1:5000';

interface AdminDashboardStats {
  total_ambassadors: number;
  active_ambassadors: number;
  total_tasks_assigned: number;
  tasks_completed_today: number;
  total_tasks_submitted: number;
  tasks_submitted_this_week: number;
  total_points_distributed: number;
  pending_approvals: number;
  system_health: number;
}

interface Ambassador {
  id: string;
  name: string;
  email: string;
  college: string;
  group_leader_name: string;
  status: 'active' | 'inactive' | 'suspended';
  tasks_completed: number;
  total_points: number;
  rank: number;
  last_active: string;
}

interface TaskAssignment {
  id: string;
  title: string;
  assigned_to: number;
  completed_by: number;
  deadline: string;
  priority: 'low' | 'medium' | 'high';
  status: 'active' | 'completed' | 'overdue';
}

const Dashboard: React.FC<{ user: any; refreshUser: () => Promise<void> }> = ({ user, refreshUser }) => {
  const [dashboardStats, setDashboardStats] = useState<AdminDashboardStats | null>(null);
  const [ambassadors, setAmbassadors] = useState<Ambassador[]>([]);
  const [recentTasks, setRecentTasks] = useState<TaskAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedAmbassador, setSelectedAmbassador] = useState<Ambassador | null>(null);
  const [showAmbassadorModal, setShowAmbassadorModal] = useState(false);

  // Sample data for demonstration
  const sampleStats: AdminDashboardStats = {
    total_ambassadors: 145,
    active_ambassadors: 128,
    total_tasks_assigned: 2175,
    tasks_completed_today: 89,
    total_tasks_submitted: 1847,
    tasks_submitted_this_week: 456,
    total_points_distributed: 125600,
    pending_approvals: 23,
    system_health: 96
  };

  const sampleAmbassadors: Ambassador[] = [
    {
      id: 'amb_001',
      name: 'Ananya Sharma',
      email: 'ananya@college.edu',
      college: 'IIT Delhi',
      group_leader_name: 'Dr. Rajesh Kumar',
      status: 'active',
      tasks_completed: 45,
      total_points: 2250,
      rank: 1,
      last_active: '2 hours ago'
    },
    {
      id: 'amb_002',
      name: 'Rahul Kumar',
      email: 'rahul@college.edu',
      college: 'IIT Bombay',
      group_leader_name: 'Prof. Meera Singh',
      status: 'active',
      tasks_completed: 42,
      total_points: 2100,
      rank: 2,
      last_active: '5 hours ago'
    },
    {
      id: 'amb_003',
      name: 'Priya Patel',
      email: 'priya@college.edu',
      college: 'IIT Madras',
      group_leader_name: 'Dr. Amit Sharma',
      status: 'inactive',
      tasks_completed: 15,
      total_points: 750,
      rank: 45,
      last_active: '2 days ago'
    },
    {
      id: 'amb_004',
      name: 'Arjun Singh',
      email: 'arjun@college.edu',
      college: 'IIT Kanpur',
      group_leader_name: 'Prof. Sunita Patel',
      status: 'active',
      tasks_completed: 38,
      total_points: 1900,
      rank: 3,
      last_active: '1 hour ago'
    },
    {
      id: 'amb_005',
      name: 'Sneha Reddy',
      email: 'sneha@college.edu',
      college: 'IIT Hyderabad',
      group_leader_name: 'Dr. Kavya Nair',
      status: 'suspended',
      tasks_completed: 8,
      total_points: 400,
      rank: 78,
      last_active: '1 week ago'
    }
  ];

  const sampleTasks: TaskAssignment[] = [
    {
      id: 'task_001',
      title: 'Social Media Campaign - Week 3',
      assigned_to: 145,
      completed_by: 89,
      deadline: '2024-01-15',
      priority: 'high',
      status: 'active'
    },
    {
      id: 'task_002',
      title: 'Campus Event Promotion',
      assigned_to: 120,
      completed_by: 95,
      deadline: '2024-01-18',
      priority: 'medium',
      status: 'active'
    },
    {
      id: 'task_003',
      title: 'Product Feedback Collection',
      assigned_to: 100,
      completed_by: 100,
      deadline: '2024-01-10',
      priority: 'low',
      status: 'completed'
    }
  ];

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.error('No authentication token found');
          setDashboardStats(sampleStats);
          setAmbassadors(sampleAmbassadors);
          setRecentTasks(sampleTasks);
          setLoading(false);
          return;
        }

        const headers = {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        };

        // Fetch ambassadors data first
        const ambassadorsResponse = await fetch(`${BACKEND_URL}/api/admin/ambassadors`, { headers });

        if (!ambassadorsResponse.ok) {
          throw new Error(`Ambassadors API failed: ${ambassadorsResponse.status}`);
        }

        const ambassadorsData = await ambassadorsResponse.json();
        console.log('Fetched ambassadors data:', ambassadorsData);

        // Fetch submissions data for more accurate stats
        const submissionsResponse = await fetch(`${BACKEND_URL}/api/admin/submissions`, { headers });
        let submissionsData = [];

        if (submissionsResponse.ok) {
          submissionsData = await submissionsResponse.json();
          console.log('Fetched submissions data:', submissionsData);
        }

        // Calculate real stats from the data
        const activeAmbassadors = ambassadorsData.filter((amb: any) => amb.status === 'active' || !amb.status);
        const totalPoints = ambassadorsData.reduce((sum: number, amb: any) => sum + (amb.total_points || 0), 0);
        const totalSubmissions = submissionsData.length;

        // Calculate today's submissions (last 24 hours)
        const today = new Date();
        const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
        const todaySubmissions = submissionsData.filter((sub: any) => {
          const subDate = new Date(sub.submission_date || sub.created_at);
          return subDate >= yesterday;
        });

        // Calculate this week's submissions
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        const weekSubmissions = submissionsData.filter((sub: any) => {
          const subDate = new Date(sub.submission_date || sub.created_at);
          return subDate >= weekAgo;
        });

        const transformedStats: AdminDashboardStats = {
          total_ambassadors: ambassadorsData.length,
          active_ambassadors: activeAmbassadors.length,
          total_tasks_assigned: ambassadorsData.length * 30, // Assuming 30 days campaign
          tasks_completed_today: todaySubmissions.length,
          total_tasks_submitted: totalSubmissions,
          tasks_submitted_this_week: weekSubmissions.length,
          total_points_distributed: totalPoints,
          pending_approvals: submissionsData.filter((sub: any) => sub.status_text === 'pending' || sub.status_text === 'submitted').length,
          system_health: 98 // Static for now
        };

        // Transform ambassadors data - get top 5 by points
        const sortedAmbassadors = ambassadorsData
          .sort((a: any, b: any) => (b.total_points || 0) - (a.total_points || 0))
          .slice(0, 5);

        const transformedAmbassadors = sortedAmbassadors.map((amb: any, index: number) => ({
          id: amb.id || amb.user_id,
          name: amb.name,
          email: amb.email,
          college: amb.college,
          group_leader_name: amb.group_leader_name || 'No Group Leader',
          status: amb.status === 'active' ? 'active' : (amb.status === 'inactive' ? 'inactive' : 'active'),
          tasks_completed: amb.tasks_completed || 0, // Use real tasks_completed from API
          total_points: amb.total_points || 0,
          rank: index + 1,
          last_active: amb.last_login || amb.registration_date || 'Recently'
        }));

        setDashboardStats(transformedStats);
        setAmbassadors(transformedAmbassadors);
        setRecentTasks(sampleTasks); // Keep sample tasks for now - would need task assignments API

        console.log('Dashboard data updated successfully');
      } catch (error) {
        console.error('Error fetching admin dashboard data:', error);
        // Fallback to sample data on error
        setDashboardStats(sampleStats);
        setAmbassadors(sampleAmbassadors);
        setRecentTasks(sampleTasks);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, []);



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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-400';
      case 'inactive': return 'text-yellow-400';
      case 'suspended': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-400 bg-red-900/20';
      case 'medium': return 'text-yellow-400 bg-yellow-900/20';
      case 'low': return 'text-green-400 bg-green-900/20';
      default: return 'text-gray-400 bg-gray-900/20';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-xl text-gray-400">Loading admin dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Admin Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-800">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Welcome, {user?.name || 'Admin'}!</h2>
          <p className="text-gray-400">Monitor and manage your ambassador network from this central dashboard.</p>
        </div>

        {/* System Stats Grid - All Metrics in One Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gray-800 border-gray-700 hover:bg-gray-750 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-xs font-medium">Total Ambassadors</p>
                  <p className="text-xl font-bold text-white mt-1">{dashboardStats?.total_ambassadors || 0}</p>
                  <p className="text-blue-400 text-xs mt-1">{dashboardStats?.active_ambassadors || 0} active</p>
                </div>
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Users className="h-5 w-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700 hover:bg-gray-750 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-xs font-medium">Tasks Today</p>
                  <p className="text-xl font-bold text-white mt-1">{dashboardStats?.tasks_completed_today || 0}</p>
                  <p className="text-green-400 text-xs mt-1">+15% from yesterday</p>
                </div>
                <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700 hover:bg-gray-750 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-xs font-medium">Total Tasks</p>
                  <p className="text-xl font-bold text-white mt-1">{dashboardStats?.total_tasks_submitted?.toLocaleString() || 0}</p>
                  <p className="text-purple-400 text-xs mt-1">All time total</p>
                </div>
                <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                  <FileText className="h-5 w-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* <Card className="bg-gray-800 border-gray-700 hover:bg-gray-750 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-xs font-medium">Tasks This Week</p>
                  <p className="text-xl font-bold text-white mt-1">{dashboardStats?.tasks_submitted_this_week || 0}</p>
                  <p className="text-cyan-400 text-xs mt-1">Last 7 days</p>
                </div>
                <div className="w-10 h-10 bg-cyan-600 rounded-lg flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card> */}

          <Card className="bg-gray-800 border-gray-700 hover:bg-gray-750 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-xs font-medium">Points Distributed</p>
                  <p className="text-xl font-bold text-white mt-1">{dashboardStats?.total_points_distributed?.toLocaleString() || 0}</p>
                  <p className="text-yellow-400 text-xs mt-1">All time total</p>
                </div>
                <div className="w-10 h-10 bg-yellow-600 rounded-lg flex items-center justify-center">
                  <Award className="h-5 w-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>


        </div>



        {/* Ambassador Management Table */}
        <Card className="bg-gray-800 border-gray-700 mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white">Ambassador Management</CardTitle>
                <CardDescription className="text-gray-400">Monitor and control ambassador activities</CardDescription>
              </div>
              {/* <Button className="bg-blue-600 hover:bg-blue-700">
                <UserCheck className="h-4 w-4 mr-2" />
                Add Ambassador
              </Button> */}
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-3 px-4 text-gray-300 font-medium">Ambassador</th>
                    <th className="text-left py-3 px-4 text-gray-300 font-medium">Group Leader</th>
                    <th className="text-left py-3 px-4 text-gray-300 font-medium">Status</th>
                    <th className="text-left py-3 px-4 text-gray-300 font-medium">Tasks</th>
                    <th className="text-left py-3 px-4 text-gray-300 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {ambassadors.slice(0, 5).map((ambassador) => (
                    <tr key={ambassador.id} className="border-b border-gray-700 hover:bg-gray-750">
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-sm font-bold">
                            {ambassador.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <p className="text-white font-medium">{ambassador.name}</p>
                            <p className="text-gray-400 text-sm">{ambassador.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="bg-purple-600 text-white px-2 py-1 rounded text-xs font-medium">
                          {ambassador.group_leader_name}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`capitalize ${getStatusColor(ambassador.status)}`}>
                          {ambassador.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-300">{ambassador.tasks_completed}</td>
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
            <div className="relative w-full max-w-2xl mx-4 bg-gray-900 rounded-lg border border-gray-700 shadow-xl">
              <div className="flex items-center justify-between p-6 border-b border-gray-800">
                <h3 className="text-lg font-semibold text-white">Ambassador Details</h3>
                <button
                  onClick={() => setShowAmbassadorModal(false)}
                  className="text-gray-400 hover:text-white"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-white font-medium mb-4">Personal Information</h4>
                    <div className="space-y-3">
                      <div>
                        <p className="text-gray-400 text-sm">Name</p>
                        <p className="text-white">{selectedAmbassador.name}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Email</p>
                        <p className="text-white">{selectedAmbassador.email}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">College</p>
                        <p className="text-white">{selectedAmbassador.college}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Status</p>
                        <span className={`capitalize ${getStatusColor(selectedAmbassador.status)}`}>
                          {selectedAmbassador.status}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-white font-medium mb-4">Performance Metrics</h4>
                    <div className="space-y-3">
                      <div>
                        <p className="text-gray-400 text-sm">Tasks Completed</p>
                        <p className="text-white">{selectedAmbassador.tasks_completed}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Total Points</p>
                        <p className="text-white">{selectedAmbassador.total_points.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Current Rank</p>
                        <p className="text-white">#{selectedAmbassador.rank}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Last Active</p>
                        <p className="text-white">{selectedAmbassador.last_active}</p>
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

export default Dashboard;
