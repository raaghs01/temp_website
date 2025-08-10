import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Bell, 
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
  Send,
  Ban,
  UserX
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const BACKEND_URL = 'http://127.0.0.1:8000';

interface AdminDashboardStats {
  total_ambassadors: number;
  active_ambassadors: number;
  total_tasks_assigned: number;
  tasks_completed_today: number;
  total_points_distributed: number;
  pending_approvals: number;
  system_health: number;
  avg_completion_rate: number;
}

interface Ambassador {
  id: string;
  name: string;
  email: string;
  college: string;
  status: 'active' | 'inactive' | 'suspended';
  tasks_completed: number;
  total_points: number;
  rank: number;
  last_active: string;
  completion_rate: number;
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
  const [notifications, setNotifications] = useState(8);
  const [selectedAmbassador, setSelectedAmbassador] = useState<Ambassador | null>(null);
  const [showAmbassadorModal, setShowAmbassadorModal] = useState(false);

  // Sample data for demonstration
  const sampleStats: AdminDashboardStats = {
    total_ambassadors: 145,
    active_ambassadors: 128,
    total_tasks_assigned: 2175,
    tasks_completed_today: 89,
    total_points_distributed: 125600,
    pending_approvals: 23,
    system_health: 96,
    avg_completion_rate: 78.5
  };

  const sampleAmbassadors: Ambassador[] = [
    {
      id: 'amb_001',
      name: 'Ananya Sharma',
      email: 'ananya@college.edu',
      college: 'IIT Delhi',
      status: 'active',
      tasks_completed: 45,
      total_points: 2250,
      rank: 1,
      last_active: '2 hours ago',
      completion_rate: 94
    },
    {
      id: 'amb_002',
      name: 'Rahul Kumar',
      email: 'rahul@college.edu',
      college: 'IIT Bombay',
      status: 'active',
      tasks_completed: 42,
      total_points: 2100,
      rank: 2,
      last_active: '5 hours ago',
      completion_rate: 88
    },
    {
      id: 'amb_003',
      name: 'Priya Patel',
      email: 'priya@college.edu',
      college: 'IIT Madras',
      status: 'inactive',
      tasks_completed: 15,
      total_points: 750,
      rank: 45,
      last_active: '2 days ago',
      completion_rate: 45
    },
    {
      id: 'amb_004',
      name: 'Arjun Singh',
      email: 'arjun@college.edu',
      college: 'IIT Kanpur',
      status: 'active',
      tasks_completed: 38,
      total_points: 1900,
      rank: 3,
      last_active: '1 hour ago',
      completion_rate: 85
    },
    {
      id: 'amb_005',
      name: 'Sneha Reddy',
      email: 'sneha@college.edu',
      college: 'IIT Hyderabad',
      status: 'suspended',
      tasks_completed: 8,
      total_points: 400,
      rank: 78,
      last_active: '1 week ago',
      completion_rate: 25
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
        await new Promise(resolve => setTimeout(resolve, 1000));
        setDashboardStats(sampleStats);
        setAmbassadors(sampleAmbassadors);
        setRecentTasks(sampleTasks);
      } catch (error) {
        console.error('Error fetching admin dashboard data:', error);
        setDashboardStats(sampleStats);
        setAmbassadors(sampleAmbassadors);
        setRecentTasks(sampleTasks);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, []);

  const handleNotificationClick = () => {
    setNotifications(0);
    alert('Admin notifications cleared!');
  };

  const handleAmbassadorAction = (ambassador: Ambassador, action: string) => {
    switch (action) {
      case 'view':
        setSelectedAmbassador(ambassador);
        setShowAmbassadorModal(true);
        break;
      case 'suspend':
        alert(`Suspending ${ambassador.name}`);
        break;
      case 'activate':
        alert(`Activating ${ambassador.name}`);
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
          <h2 className="text-3xl font-bold mb-2">Welcome, {user?.name || 'Admin'}!</h2>
          <p className="text-gray-400">Monitor and manage your ambassador network from this central dashboard.</p>
        </div>

        {/* System Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gray-800 border-gray-700 hover:bg-gray-750 transition-colors">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-medium">Total Ambassadors</p>
                  <p className="text-2xl font-bold text-white mt-1">{dashboardStats?.total_ambassadors || 0}</p>
                  <p className="text-blue-400 text-xs mt-1">{dashboardStats?.active_ambassadors || 0} active</p>
                </div>
                <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Users className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700 hover:bg-gray-750 transition-colors">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-medium">Tasks Completed Today</p>
                  <p className="text-2xl font-bold text-white mt-1">{dashboardStats?.tasks_completed_today || 0}</p>
                  <p className="text-green-400 text-xs mt-1">+15% from yesterday</p>
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
                  <p className="text-gray-400 text-sm font-medium">Points Distributed</p>
                  <p className="text-2xl font-bold text-white mt-1">{dashboardStats?.total_points_distributed?.toLocaleString() || 0}</p>
                  <p className="text-yellow-400 text-xs mt-1">All time total</p>
                </div>
                <div className="w-12 h-12 bg-yellow-600 rounded-lg flex items-center justify-center">
                  <Award className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Analytics and Management Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* System Analytics */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">System Performance</CardTitle>
              <CardDescription className="text-gray-400">Overall ambassador network analytics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-300">Average Completion Rate</span>
                    <span className="text-sm font-medium text-white">{dashboardStats?.avg_completion_rate || 0}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-green-500 to-blue-500 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${dashboardStats?.avg_completion_rate || 0}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-700 rounded-lg p-4 text-center">
                    <AlertTriangle className="h-8 w-8 text-yellow-400 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-white">{dashboardStats?.pending_approvals || 0}</p>
                    <p className="text-gray-400 text-sm">Pending Approvals</p>
                  </div>
                  
                  <div className="bg-gray-700 rounded-lg p-4 text-center">
                    <FileText className="h-8 w-8 text-blue-400 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-white">{dashboardStats?.total_tasks_assigned || 0}</p>
                    <p className="text-gray-400 text-sm">Total Tasks</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Performance Chart */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Network Performance Trends</CardTitle>
              <CardDescription className="text-gray-400">Weekly completion rates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-gray-700 rounded-lg p-4">
                <AdminAnalyticsChart />
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
              <Button className="bg-blue-600 hover:bg-blue-700">
                <UserCheck className="h-4 w-4 mr-2" />
                Add Ambassador
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-3 px-4 text-gray-300 font-medium">Ambassador</th>
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
                        <p className="text-gray-400 text-sm">Completion Rate</p>
                        <p className="text-white">{selectedAmbassador.completion_rate}%</p>
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

export default Dashboard;

// Admin Analytics Chart Component
const AdminAnalyticsChart: React.FC = () => {
  const labels = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
  const completionRates = [65, 72, 78, 85];
  const activeUsers = [120, 125, 132, 128];
  
  const width = 600;
  const height = 180;
  const padding = 32;
  const step = (width - padding * 2) / (labels.length - 1);
  
  const maxCompletion = Math.max(...completionRates);
  const minCompletion = Math.min(...completionRates);
  const maxActive = Math.max(...activeUsers);
  const minActive = Math.min(...activeUsers);
  
  const scaleY1 = (value: number) => {
    if (maxCompletion === minCompletion) return height / 2;
    return padding + (height - padding * 2) * (1 - (value - minCompletion) / (maxCompletion - minCompletion));
  };
  
  const scaleY2 = (value: number) => {
    if (maxActive === minActive) return height / 2;
    return padding + (height - padding * 2) * (1 - (value - minActive) / (maxActive - minActive));
  };

  const completionPoints = completionRates
    .map((v, i) => `${padding + i * step},${scaleY1(v)}`)
    .join(' ');
    
  const activePoints = activeUsers
    .map((v, i) => `${padding + i * step},${scaleY2(v)}`)
    .join(' ');

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
      {/* Grid lines */}
      <defs>
        <linearGradient id="completionGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#10B981" stopOpacity={0.6} />
          <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
        </linearGradient>
        <linearGradient id="activeGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.6} />
          <stop offset="100%" stopColor="#3B82F6" stopOpacity={0} />
        </linearGradient>
      </defs>
      
      {/* Axes */}
      <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#4B5563" strokeWidth={2} />
      <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#4B5563" strokeWidth={2} />

      {/* X labels */}
      {labels.map((label, i) => (
        <text key={label} x={padding + i * step} y={height - padding + 16} textAnchor="middle" fontSize="10" fill="#9CA3AF">
          {label}
        </text>
      ))}

      {/* Completion rate line */}
      <polyline
        points={`${completionPoints} ${width - padding},${height - padding} ${padding},${height - padding}`}
        fill="url(#completionGradient)"
        stroke="none"
        opacity={0.3}
      />
      <polyline points={completionPoints} fill="none" stroke="#10B981" strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" />

      {/* Active users line */}
      <polyline points={activePoints} fill="none" stroke="#3B82F6" strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" strokeDasharray="5,5" />

      {/* Points */}
      {completionRates.map((v, i) => (
        <circle key={`completion-${i}`} cx={padding + i * step} cy={scaleY1(v)} r={4} fill="#10B981" stroke="#065F46" strokeWidth={2} />
      ))}
      
      {activeUsers.map((v, i) => (
        <circle key={`active-${i}`} cx={padding + i * step} cy={scaleY2(v)} r={4} fill="#3B82F6" stroke="#1E40AF" strokeWidth={2} />
      ))}

      {/* Legend */}
      <g transform="translate(450, 30)">
        <circle cx={0} cy={0} r={3} fill="#10B981" />
        <text x={10} y={4} fontSize="10" fill="#9CA3AF">Completion Rate</text>
        <circle cx={0} cy={15} r={3} fill="#3B82F6" />
        <text x={10} y={19} fontSize="10" fill="#9CA3AF">Active Users</text>
      </g>
    </svg>
  );
};
