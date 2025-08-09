import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Plus, 
  Users, 
  Calendar, 
  CheckCircle, 
  Clock,
  AlertTriangle,
  Eye,
  Edit,
  Trash2,
  Send,
  Filter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface TaskAssignment {
  id: string;
  title: string;
  description: string;
  day: number;
  points: number;
  priority: 'low' | 'medium' | 'high';
  deadline: string;
  assigned_to: number;
  completed_by: number;
  status: 'active' | 'completed' | 'overdue' | 'draft';
  created_by: string;
  created_at: string;
}

interface Ambassador {
  id: string;
  name: string;
  email: string;
  college: string;
  current_day: number;
  total_points: number;
  status: 'active' | 'inactive' | 'suspended';
}

const Tasks: React.FC<{ refreshUser: () => Promise<void> }> = ({ refreshUser }) => {
  const [tasks, setTasks] = useState<TaskAssignment[]>([]);
  const [ambassadors, setAmbassadors] = useState<Ambassador[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskAssignment | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'completed' | 'overdue'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Sample data
  const sampleTasks: TaskAssignment[] = [
    {
      id: 'task_001',
      title: 'Social Media Campaign - Week 3',
      description: 'Create and share 5 posts about our latest product features across Instagram, LinkedIn, and Twitter. Include proper hashtags and tag the company.',
      day: 15,
      points: 150,
      priority: 'high',
      deadline: '2024-01-20',
      assigned_to: 145,
      completed_by: 89,
      status: 'active',
      created_by: 'admin@test.com',
      created_at: '2024-01-10'
    },
    {
      id: 'task_002',
      title: 'Campus Event Organization',
      description: 'Organize a tech talk or workshop on campus. Document the event with photos and attendance numbers.',
      day: 20,
      points: 200,
      priority: 'medium',
      deadline: '2024-01-25',
      assigned_to: 120,
      completed_by: 95,
      status: 'active',
      created_by: 'admin@test.com',
      created_at: '2024-01-12'
    },
    {
      id: 'task_003',
      title: 'Product Feedback Collection',
      description: 'Collect feedback from 10 students about our mobile app. Use the provided survey form.',
      day: 10,
      points: 100,
      priority: 'low',
      deadline: '2024-01-15',
      assigned_to: 100,
      completed_by: 100,
      status: 'completed',
      created_by: 'admin@test.com',
      created_at: '2024-01-05'
    },
    {
      id: 'task_004',
      title: 'Referral Program Launch',
      description: 'Promote the new referral program to your network and get at least 5 sign-ups.',
      day: 25,
      points: 250,
      priority: 'high',
      deadline: '2024-01-12',
      assigned_to: 80,
      completed_by: 25,
      status: 'overdue',
      created_by: 'admin@test.com',
      created_at: '2024-01-08'
    }
  ];

  const sampleAmbassadors: Ambassador[] = [
    {
      id: 'amb_001',
      name: 'Ananya Sharma',
      email: 'ananya@college.edu',
      college: 'IIT Delhi',
      current_day: 18,
      total_points: 2250,
      status: 'active'
    },
    {
      id: 'amb_002',
      name: 'Rahul Kumar',
      email: 'rahul@college.edu',
      college: 'IIT Bombay',
      current_day: 16,
      total_points: 2100,
      status: 'active'
    }
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 1000));
        setTasks(sampleTasks);
        setAmbassadors(sampleAmbassadors);
      } catch (error) {
        console.error('Error fetching tasks:', error);
        setTasks(sampleTasks);
        setAmbassadors(sampleAmbassadors);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-400 bg-red-900/20';
      case 'medium': return 'text-yellow-400 bg-yellow-900/20';
      case 'low': return 'text-green-400 bg-green-900/20';
      default: return 'text-gray-400 bg-gray-900/20';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-blue-400';
      case 'completed': return 'text-green-400';
      case 'overdue': return 'text-red-400';
      case 'draft': return 'text-gray-400';
      default: return 'text-gray-400';
    }
  };

  const filteredTasks = tasks.filter(task => {
    const matchesStatus = filterStatus === 'all' || task.status === filterStatus;
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleTaskAction = (task: TaskAssignment, action: string) => {
    switch (action) {
      case 'view':
        setSelectedTask(task);
        setShowTaskModal(true);
        break;
      case 'edit':
        alert(`Editing task: ${task.title}`);
        break;
      case 'delete':
        if (confirm(`Are you sure you want to delete "${task.title}"?`)) {
          setTasks(tasks.filter(t => t.id !== task.id));
        }
        break;
      case 'duplicate':
        const newTask = { ...task, id: `task_${Date.now()}`, title: `${task.title} (Copy)` };
        setTasks([...tasks, newTask]);
        break;
      default:
        break;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-xl text-gray-400">Loading ambassador management...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-800">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold">Ambassador Management</h1>
          <span className="px-3 py-1 bg-purple-600 text-white text-sm rounded-full">Task Control</span>
        </div>
        
        <div className="flex items-center space-x-4">
          <Button 
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Task
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-medium">Total Tasks</p>
                  <p className="text-2xl font-bold text-white mt-1">{tasks.length}</p>
                  <p className="text-blue-400 text-xs mt-1">All assignments</p>
                </div>
                <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-medium">Active Tasks</p>
                  <p className="text-2xl font-bold text-white mt-1">{tasks.filter(t => t.status === 'active').length}</p>
                  <p className="text-green-400 text-xs mt-1">Currently running</p>
                </div>
                <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                  <Clock className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-medium">Completed</p>
                  <p className="text-2xl font-bold text-white mt-1">{tasks.filter(t => t.status === 'completed').length}</p>
                  <p className="text-green-400 text-xs mt-1">Finished tasks</p>
                </div>
                <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-medium">Overdue</p>
                  <p className="text-2xl font-bold text-white mt-1">{tasks.filter(t => t.status === 'overdue').length}</p>
                  <p className="text-red-400 text-xs mt-1">Need attention</p>
                </div>
                <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="bg-gray-800 border-gray-700 mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <div className="flex flex-wrap gap-2">
                {(['all', 'active', 'completed', 'overdue'] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      filterStatus === status
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ))}
              </div>
              <div className="flex items-center space-x-4">
                <Input
                  placeholder="Search tasks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64 bg-gray-700 border-gray-600 text-white"
                />
                <Button variant="outline" className="border-gray-600 text-gray-300">
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tasks Table */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Task Assignments</CardTitle>
            <CardDescription className="text-gray-400">Manage all ambassador tasks and assignments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-3 px-4 text-gray-300 font-medium">Task</th>
                    <th className="text-left py-3 px-4 text-gray-300 font-medium">Day</th>
                    <th className="text-left py-3 px-4 text-gray-300 font-medium">Priority</th>
                    <th className="text-left py-3 px-4 text-gray-300 font-medium">Progress</th>
                    <th className="text-left py-3 px-4 text-gray-300 font-medium">Deadline</th>
                    <th className="text-left py-3 px-4 text-gray-300 font-medium">Status</th>
                    <th className="text-left py-3 px-4 text-gray-300 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTasks.map((task) => (
                    <tr key={task.id} className="border-b border-gray-700 hover:bg-gray-750">
                      <td className="py-3 px-4">
                        <div>
                          <p className="text-white font-medium">{task.title}</p>
                          <p className="text-gray-400 text-sm">{task.points} points</p>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-300">Day {task.day}</td>
                      <td className="py-3 px-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <div className="flex-1 bg-gray-600 rounded-full h-2">
                            <div 
                              className="bg-blue-500 h-2 rounded-full"
                              style={{ width: `${(task.completed_by / task.assigned_to) * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-gray-300 text-sm">
                            {task.completed_by}/{task.assigned_to}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-300">{task.deadline}</td>
                      <td className="py-3 px-4">
                        <span className={`capitalize ${getStatusColor(task.status)}`}>
                          {task.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleTaskAction(task, 'view')}
                            className="p-1 text-blue-400 hover:text-blue-300"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleTaskAction(task, 'edit')}
                            className="p-1 text-yellow-400 hover:text-yellow-300"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleTaskAction(task, 'delete')}
                            className="p-1 text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Task Detail Modal */}
        {showTaskModal && selectedTask && (
          <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true">
            <div className="absolute inset-0 bg-black/70" onClick={() => setShowTaskModal(false)}></div>
            <div className="relative w-full max-w-2xl mx-4 bg-gray-900 rounded-lg border border-gray-700 shadow-xl">
              <div className="flex items-center justify-between p-6 border-b border-gray-800">
                <h3 className="text-lg font-semibold text-white">Task Details</h3>
                <button
                  onClick={() => setShowTaskModal(false)}
                  className="text-gray-400 hover:text-white"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="text-white font-medium text-lg">{selectedTask.title}</h4>
                    <p className="text-gray-400 mt-2">{selectedTask.description}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-400 text-sm">Day</p>
                      <p className="text-white">Day {selectedTask.day}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Points</p>
                      <p className="text-white">{selectedTask.points}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Priority</p>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(selectedTask.priority)}`}>
                        {selectedTask.priority}
                      </span>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Deadline</p>
                      <p className="text-white">{selectedTask.deadline}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-gray-400 text-sm mb-2">Progress</p>
                    <div className="flex items-center space-x-4">
                      <div className="flex-1 bg-gray-600 rounded-full h-3">
                        <div 
                          className="bg-blue-500 h-3 rounded-full"
                          style={{ width: `${(selectedTask.completed_by / selectedTask.assigned_to) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-white font-medium">
                        {Math.round((selectedTask.completed_by / selectedTask.assigned_to) * 100)}%
                      </span>
                    </div>
                    <p className="text-gray-400 text-sm mt-1">
                      {selectedTask.completed_by} of {selectedTask.assigned_to} ambassadors completed
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <Button
                    onClick={() => setShowTaskModal(false)}
                    variant="outline"
                    className="border-gray-700 text-gray-300 hover:bg-gray-800"
                  >
                    Close
                  </Button>
                  <Button className="bg-yellow-600 hover:bg-yellow-700">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Task
                  </Button>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Send className="h-4 w-4 mr-2" />
                    Send Reminder
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Tasks;
