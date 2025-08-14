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
  Filter,
  Save,
  X,
  Copy
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface Task {
  id: string;
  title: string;
  description: string;
  day: number;
  points: number;
  status: 'active' | 'draft';
  created_by: string;
  created_at: string;
  updated_at?: string;
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
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'draft'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Form state for creating/editing tasks
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    day: 1,
    points: 100,
    status: 'active' as 'active' | 'draft'
  });

  // Sample data - similar to ambassador portal tasks
  const sampleTasks: Task[] = [
    {
      id: 'task_001',
      title: 'Social Media Campaign - Week 3',
      description: 'Create and share 5 posts about our latest product features across Instagram, LinkedIn, and Twitter. Include proper hashtags and tag the company.',
      day: 15,
      points: 150,
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
      status: 'active',
      created_by: 'admin@test.com',
      created_at: '2024-01-05'
    },
    {
      id: 'task_004',
      title: 'Referral Program Launch',
      description: 'Promote the new referral program to your network and get at least 5 sign-ups.',
      day: 25,
      points: 250,
      status: 'draft',
      created_by: 'admin@test.com',
      created_at: '2024-01-08'
    },
    {
      id: 'task_005',
      title: 'LinkedIn Content Creation',
      description: 'Write and publish 3 professional posts on LinkedIn about career opportunities in tech.',
      day: 5,
      points: 120,
      status: 'active',
      created_by: 'admin@test.com',
      created_at: '2024-01-15'
    },
    {
      id: 'task_006',
      title: 'Student Survey Distribution',
      description: 'Distribute and collect responses for the student satisfaction survey in your college.',
      day: 12,
      points: 180,
      status: 'active',
      created_by: 'admin@test.com',
      created_at: '2024-01-18'
    }
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 1000));
        setTasks(sampleTasks);
      } catch (error) {
        console.error('Error fetching tasks:', error);
        setTasks(sampleTasks);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);





  const filteredTasks = tasks.filter(task => {
    const matchesStatus = filterStatus === 'all' || task.status === filterStatus;
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Reset form data
  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      day: 1,
      points: 100,
      status: 'active'
    });
  };

  // Handle form input changes
  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle creating a new task
  const handleCreateTask = () => {
    if (!formData.title.trim() || !formData.description.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    const newTask: Task = {
      id: `task_${Date.now()}`,
      title: formData.title,
      description: formData.description,
      day: formData.day,
      points: formData.points,
      status: formData.status,
      created_by: 'admin@test.com',
      created_at: new Date().toISOString().split('T')[0],
      updated_at: new Date().toISOString().split('T')[0]
    };

    setTasks([...tasks, newTask]);
    setShowCreateModal(false);
    resetForm();
  };

  // Handle editing a task
  const handleEditTask = () => {
    if (!formData.title.trim() || !formData.description.trim() || !editingTask) {
      alert('Please fill in all required fields');
      return;
    }

    const updatedTask: Task = {
      ...editingTask,
      title: formData.title,
      description: formData.description,
      day: formData.day,
      points: formData.points,
      status: formData.status,
      updated_at: new Date().toISOString().split('T')[0]
    };

    setTasks(tasks.map(t => t.id === editingTask.id ? updatedTask : t));
    setShowEditModal(false);
    setEditingTask(null);
    resetForm();
  };

  const handleTaskAction = (task: Task, action: string) => {
    switch (action) {
      case 'view':
        setSelectedTask(task);
        setShowTaskModal(true);
        break;
      case 'edit':
        setEditingTask(task);
        setFormData({
          title: task.title,
          description: task.description,
          day: task.day,
          points: task.points,
          status: task.status
        });
        setShowEditModal(true);
        break;
      case 'delete':
        if (confirm(`Are you sure you want to delete "${task.title}"?`)) {
          setTasks(tasks.filter(t => t.id !== task.id));
        }
        break;
      case 'duplicate':
        const newTask = {
          ...task,
          id: `task_${Date.now()}`,
          title: `${task.title} (Copy)`,
          status: 'draft' as const,
          created_at: new Date().toISOString().split('T')[0],
          updated_at: new Date().toISOString().split('T')[0]
        };
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
          <h1 className="text-2xl font-bold">Task Management</h1>
          <span className="px-3 py-1 bg-purple-600 text-white text-sm rounded-full">Admin Control</span>
        </div>

        <div className="flex items-center space-x-4">
          <Button
            onClick={() => {
              resetForm();
              setShowCreateModal(true);
            }}
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-medium">Total Tasks</p>
                  <p className="text-2xl font-bold text-white mt-1">{tasks.length}</p>
                  <p className="text-blue-400 text-xs mt-1">All created tasks</p>
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
                  <p className="text-green-400 text-xs mt-1">Available to ambassadors</p>
                </div>
                <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-medium">Draft Tasks</p>
                  <p className="text-2xl font-bold text-white mt-1">{tasks.filter(t => t.status === 'draft').length}</p>
                  <p className="text-yellow-400 text-xs mt-1">Not yet published</p>
                </div>
                <div className="w-12 h-12 bg-yellow-600 rounded-lg flex items-center justify-center">
                  <Clock className="h-6 w-6 text-white" />
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
                {(['all', 'active', 'draft'] as const).map((status) => (
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
            <CardTitle className="text-white">Task Management</CardTitle>
            <CardDescription className="text-gray-400">Create and manage tasks for ambassadors</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-3 px-4 text-gray-300 font-medium">Task</th>
                    <th className="text-left py-3 px-4 text-gray-300 font-medium">Day</th>
                    <th className="text-left py-3 px-4 text-gray-300 font-medium">Points</th>
                    <th className="text-left py-3 px-4 text-gray-300 font-medium">Status</th>
                    <th className="text-left py-3 px-4 text-gray-300 font-medium">Created</th>
                    <th className="text-left py-3 px-4 text-gray-300 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTasks.map((task) => (
                    <tr key={task.id} className="border-b border-gray-700 hover:bg-gray-750">
                      <td className="py-3 px-4">
                        <div>
                          <p className="text-white font-medium">{task.title}</p>
                          <p className="text-gray-400 text-sm line-clamp-2">{task.description}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium">
                          Day {task.day}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-yellow-400 font-bold">{task.points}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${
                          task.status === 'active' ? 'bg-green-600 text-white' : 'bg-yellow-600 text-white'
                        }`}>
                          {task.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-300 text-sm">
                        {task.created_at}
                        {task.updated_at && task.updated_at !== task.created_at && (
                          <div className="text-xs text-gray-500">Updated: {task.updated_at}</div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleTaskAction(task, 'view')}
                            className="p-1 text-blue-400 hover:text-blue-300"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleTaskAction(task, 'edit')}
                            className="p-1 text-yellow-400 hover:text-yellow-300"
                            title="Edit Task"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleTaskAction(task, 'duplicate')}
                            className="p-1 text-green-400 hover:text-green-300"
                            title="Duplicate Task"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleTaskAction(task, 'delete')}
                            className="p-1 text-red-400 hover:text-red-300"
                            title="Delete Task"
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
                  <X className="h-6 w-6" />
                </button>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="text-white font-medium text-lg">{selectedTask.title}</h4>
                    <p className="text-gray-400 mt-2">{selectedTask.description}</p>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-gray-400 text-sm">Day</p>
                      <p className="text-white">Day {selectedTask.day}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Points</p>
                      <p className="text-white">{selectedTask.points}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Status</p>
                      <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${
                        selectedTask.status === 'active' ? 'bg-green-600 text-white' : 'bg-yellow-600 text-white'
                      }`}>
                        {selectedTask.status}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-400 text-sm">Created</p>
                      <p className="text-white">{selectedTask.created_at}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Last Updated</p>
                      <p className="text-white">{selectedTask.updated_at || selectedTask.created_at}</p>
                    </div>
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
                  <Button
                    onClick={() => {
                      setShowTaskModal(false);
                      handleTaskAction(selectedTask, 'edit');
                    }}
                    className="bg-yellow-600 hover:bg-yellow-700"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Task
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Create Task Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true">
            <div className="absolute inset-0 bg-black/70" onClick={() => setShowCreateModal(false)}></div>
            <div className="relative w-full max-w-2xl mx-4 bg-gray-900 rounded-lg border border-gray-700 shadow-xl max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b border-gray-800">
                <h3 className="text-lg font-semibold text-white">Create New Task</h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-white"
                  aria-label="Close"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Task Title *</label>
                    <Input
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      placeholder="Enter task title"
                      className="bg-gray-800 border-gray-600 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Description *</label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      placeholder="Enter detailed task description"
                      rows={4}
                      className="bg-gray-800 border-gray-600 text-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Day</label>
                      <Input
                        type="number"
                        value={formData.day}
                        onChange={(e) => handleInputChange('day', parseInt(e.target.value) || 1)}
                        min="1"
                        max="30"
                        className="bg-gray-800 border-gray-600 text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Points</label>
                      <Input
                        type="number"
                        value={formData.points}
                        onChange={(e) => handleInputChange('points', parseInt(e.target.value) || 100)}
                        min="50"
                        max="500"
                        step="50"
                        className="bg-gray-800 border-gray-600 text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => handleInputChange('status', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="draft">Draft</option>
                      <option value="active">Active</option>
                    </select>
                  </div>


                </div>
              </div>

              <div className="p-6 border-t border-gray-800 flex justify-end gap-3">
                <Button
                  onClick={() => setShowCreateModal(false)}
                  variant="outline"
                  className="border-gray-700 text-gray-300 hover:bg-gray-800"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateTask}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Create Task
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Task Modal */}
        {showEditModal && editingTask && (
          <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true">
            <div className="absolute inset-0 bg-black/70" onClick={() => setShowEditModal(false)}></div>
            <div className="relative w-full max-w-2xl mx-4 bg-gray-900 rounded-lg border border-gray-700 shadow-xl max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b border-gray-800">
                <h3 className="text-lg font-semibold text-white">Edit Task</h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-white"
                  aria-label="Close"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Task Title *</label>
                    <Input
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      placeholder="Enter task title"
                      className="bg-gray-800 border-gray-600 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Description *</label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      placeholder="Enter detailed task description"
                      rows={4}
                      className="bg-gray-800 border-gray-600 text-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Day</label>
                      <Input
                        type="number"
                        value={formData.day}
                        onChange={(e) => handleInputChange('day', parseInt(e.target.value) || 1)}
                        min="1"
                        max="30"
                        className="bg-gray-800 border-gray-600 text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Points</label>
                      <Input
                        type="number"
                        value={formData.points}
                        onChange={(e) => handleInputChange('points', parseInt(e.target.value) || 100)}
                        min="50"
                        max="500"
                        step="50"
                        className="bg-gray-800 border-gray-600 text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => handleInputChange('status', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="draft">Draft</option>
                      <option value="active">Active</option>
                    </select>
                  </div>


                </div>
              </div>

              <div className="p-6 border-t border-gray-800 flex justify-end gap-3">
                <Button
                  onClick={() => setShowEditModal(false)}
                  variant="outline"
                  className="border-gray-700 text-gray-300 hover:bg-gray-800"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleEditTask}
                  className="bg-yellow-600 hover:bg-yellow-700"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Tasks;
