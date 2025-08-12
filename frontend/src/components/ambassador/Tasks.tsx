import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, CheckCircle, AlertCircle, Calendar, Award, Clock, FileText, Image as ImageIcon, Send, Eye, Star, Lock, Users, ArrowLeft } from 'lucide-react';

const BACKEND_URL = 'http://127.0.0.1:5000';

interface Task {
  id: string;
  title: string;
  description: string;
  points: number;
  deadline: string;
  // priority: 'high' | 'medium' | 'low';
  status: 'available' | 'in_progress' | 'completed' | 'locked';
  category: string;
  day: number;
  completedAt?: string;
  estimatedTime?: string;
}

interface Submission {
  id: string;
  taskId: string;
  taskTitle: string;
  submissionText: string;
  imageUrl?: string;
  submittedAt: string;
  completedAt?: string;
  status: 'completed';
  points: number;
  peopleConnected?: number;
}

const Tasks: React.FC<{ refreshUser?: () => Promise<void> }> = ({ refreshUser }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [submissionText, setSubmissionText] = useState('');
  const [submissionImage, setSubmissionImage] = useState<File | null>(null);
  const [peopleConnected, setPeopleConnected] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [activeTab, setActiveTab] = useState<'available' | 'completed'>('available');
  const [viewMode, setViewMode] = useState<'list' | 'details'>('list');
  const [viewingTask, setViewingTask] = useState<Task | null>(null);

  // Enhanced sample data
  const sampleTasks: Task[] = Array.from({ length: 15 }, (_, idx) => {
    const day = idx + 1;
    const isAvailable = day <= 2;
    const taskTypes = [
      {
        title: 'Social Media Campaign',
        description: 'Create and share engaging posts about our brand on your social media platforms. Include relevant hashtags, tag our official account, and encourage engagement from your followers.',
        category: 'Marketing',
        estimatedTime: '2-3 hours'
      },
      {
        title: 'Campus Event Promotion',
        description: 'Promote our upcoming campus events by distributing flyers, posting on university notice boards, and spreading awareness through word-of-mouth marketing.',
        category: 'Events',
        estimatedTime: '3-4 hours'
      },
      {
        title: 'Content Creation',
        description: 'Create original content such as blog posts, videos, or infographics that showcase your ambassador experience and highlight our brand values.',
        category: 'Content',
        estimatedTime: '4-5 hours'
      },
      {
        title: 'Student Outreach',
        description: 'Connect with fellow students, organize meetups, and build a community around our brand. Focus on genuine relationship building and value creation.',
        category: 'Networking',
        estimatedTime: '2-3 hours'
      },
      {
        title: 'Feedback Collection',
        description: 'Gather feedback from students about our products/services, conduct surveys, and provide valuable insights to help improve our offerings.',
        category: 'Research',
        estimatedTime: '1-2 hours'
      }
    ];
    
    const taskType = taskTypes[day % taskTypes.length];
    
    return {
      id: String(day),
      title: `${taskType.title} - Day ${day}`,
      description: taskType.description,
      points: 100 + day * 10,
      deadline: `Day ${day}`,
      // priority: (day % 3 === 0 ? 'medium' : day % 2 === 0 ? 'high' : 'low') as 'high' | 'medium' | 'low',
      status: (isAvailable ? 'available' : 'locked') as Task['status'],
      category: taskType.category,
      day,
      estimatedTime: taskType.estimatedTime
    };
  });

  const sampleSubmissions: Submission[] = [
    {
      id: '1',
      taskId: '3',
      taskTitle: 'Student Outreach - Day 3',
      submissionText: 'Successfully connected with 15 students during the campus event. Organized a small meetup and collected valuable feedback about student preferences.',
      submittedAt: '2024-01-10T10:30:00Z',
      completedAt: '2024-01-10T14:45:00Z',
      status: 'completed',
      points: 180,
      peopleConnected: 15
    },
    {
      id: '2',
      taskId: '1',
      taskTitle: 'Social Media Campaign - Day 1',
      submissionText: 'Created and posted 5 engaging posts across Instagram, Twitter, and LinkedIn. Achieved 200+ likes and 50+ shares with proper hashtags and brand mentions.',
      imageUrl: '/sample-post.jpg',
      submittedAt: '2024-01-08T15:45:00Z',
      completedAt: '2024-01-08T18:30:00Z',
      status: 'completed',
      points: 150,
      peopleConnected: 8
    },
    {
      id: '3',
      taskId: '2',
      taskTitle: 'Campus Event Promotion - Day 2',
      submissionText: 'Distributed 100 flyers across 5 different campus locations and posted announcements on 3 university notice boards. Also shared event details in 4 student WhatsApp groups.',
      submittedAt: '2024-01-09T09:15:00Z',
      completedAt: '2024-01-09T16:20:00Z',
      status: 'completed',
      points: 170,
      peopleConnected: 25
    }
  ];

  // Calculated values
  const availableTasks = tasks.filter(task => task.status === 'available').length;
  const completedTasks = submissions.length;
  const successRate = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

  // Data fetching
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setLoading(false);
          return;
        }

        // Fetch tasks
        const tasksResponse = await fetch(`${BACKEND_URL}/api/tasks`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        // Fetch submissions
        const submissionsResponse = await fetch(`${BACKEND_URL}/api/my-submissions`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (tasksResponse.ok && submissionsResponse.ok) {
          const tasksData = await tasksResponse.json();
          const submissionsData = await submissionsResponse.json();

          // Create a map of completed task IDs for quick lookup
          const completedTaskIds = new Set(submissionsData.map((sub: any) => sub.task_id));

          // Sort tasks by day to ensure proper order
          const sortedTasks = tasksData.sort((a: any, b: any) => a.day - b.day);

          // Calculate how many tasks should be available (2 at a time, progressive unlocking)
          const completedCount = completedTaskIds.size;
          const maxAvailableTasks = Math.min(completedCount + 2, sortedTasks.length);

          // Transform backend data to match frontend interface with progressive unlocking
          const transformedTasks = sortedTasks.map((task: any, index: number) => {
            let status: 'available' | 'completed' | 'locked' = 'locked';

            // Determine task status
            if (completedTaskIds.has(task.id)) {
              status = 'completed';
            } else if (index < maxAvailableTasks) {
              status = 'available';
            } else {
              status = 'locked';
            }

            return {
              id: task.id,
              title: task.title,
              description: task.description,
              points: task.points_reward,
              deadline: `Day ${task.day}`,
              // priority: task.priority || 'medium',
              status,
              category: task.category || 'General',
              day: task.day,
              estimatedTime: task.estimated_time || '2-3 hours'
            };
          });

          const transformedSubmissions = submissionsData.map((sub: any) => ({
            id: sub.id,
            taskId: sub.task_id,
            taskTitle: sub.task_title || 'Task',
            submissionText: sub.status_text,
            imageUrl: sub.proof_image ? `data:image/jpeg;base64,${sub.proof_image}` : undefined,
            submittedAt: sub.submission_date,
            completedAt: sub.completion_date || sub.submission_date,
            status: 'completed',
            points: sub.points_earned,
            peopleConnected: sub.people_connected
          }));

          setTasks(transformedTasks);
          setSubmissions(transformedSubmissions);
        } else {
          console.error('Failed to fetch data from backend');
          setTasks(sampleTasks);
          setSubmissions(sampleSubmissions);
        }
      } catch (error) {
        console.error('Error fetching tasks:', error);
        setTasks(sampleTasks);
        setSubmissions(sampleSubmissions);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Event handlers
  const handleTaskSelect = (task: Task) => {
    if (task.status === 'available') {
      setSelectedTask(task);
      setViewMode('details'); // Switch to details view immediately
      setViewingTask(task); // Set the viewing task to show submission form
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSubmissionImage(file);
    }
  };

  const handleSubmitTask = async () => {
    if (!selectedTask || !submissionText.trim()) {
      alert('Please provide submission details.');
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Authentication required. Please log in again.');
        return;
      }

      let response;
      
      if (submissionImage) {
        const formData = new FormData();
        formData.append('task_id', selectedTask.id);
        formData.append('status_text', submissionText);
        formData.append('people_connected', peopleConnected.toString());
        formData.append('image', submissionImage);

        response = await fetch(`${BACKEND_URL}/api/submit-task-with-image`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData,
        });
      } else {
        response = await fetch(`${BACKEND_URL}/api/submit-task`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            task_id: selectedTask.id,
            status_text: submissionText,
            people_connected: peopleConnected
          }),
        });
      }

      if (response.ok) {
        const result = await response.json();
        const completionTime = new Date().toISOString();
        
        const newSubmission: Submission = {
          id: Date.now().toString(),
          taskId: selectedTask.id,
          taskTitle: selectedTask.title,
          submissionText,
          imageUrl: submissionImage ? URL.createObjectURL(submissionImage) : undefined,
          submittedAt: completionTime,
          completedAt: completionTime,
          status: 'completed',
          points: result.points_earned || selectedTask.points,
          peopleConnected: peopleConnected
        };

        setSubmissions(prev => [newSubmission, ...prev]);
        setTasks(prev => prev.map(task => 
          task.id === selectedTask.id 
            ? { ...task, status: 'completed' as const, completedAt: completionTime }
            : task
        ));
        
        setSelectedTask(null);
        setSubmissionText('');
        setSubmissionImage(null);
        setPeopleConnected(0);
        setViewMode('list');
        setViewingTask(null);

        alert(`Task submitted successfully! You earned ${result.points_earned || selectedTask.points} points.`);
      } else {
        const errorData = await response.json();
        alert(`Error submitting task: ${errorData.detail || 'Please try again.'}`);
      }
    } catch (error) {
      console.error('Error submitting task:', error);
      alert('Error submitting task. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewTask = (task: Task) => {
    setViewingTask(task);
    setViewMode('details');
  };

  const handleBackToList = () => {
    setViewMode('list');
    setViewingTask(null);
    setSelectedTask(null);
    setSubmissionText('');
    setSubmissionImage(null);
    setPeopleConnected(0);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'text-green-400';
      case 'completed': return 'text-blue-400';
      case 'locked': return 'text-gray-500';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available':
        return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'completed':
        return <Star className="h-4 w-4 text-blue-400" />;
      case 'locked':
        return <Lock className="h-4 w-4 text-gray-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Tasks</h1>
            <p className="text-gray-400 mt-1">Complete tasks to earn points and climb the leaderboard</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-medium">Total Tasks</p>
                  <p className="text-2xl font-bold text-white mt-1">{tasks.length}</p>
                  <p className="text-blue-400 text-xs mt-1">Available to complete</p>
                </div>
                <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                  <FileText className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-medium">Completed</p>
                  <p className="text-2xl font-bold text-white mt-1">{completedTasks}</p>
                  <p className="text-green-400 text-xs mt-1">Successfully finished</p>
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
                  <p className="text-gray-400 text-sm font-medium">Success Rate</p>
                  <p className="text-2xl font-bold text-white mt-1">{successRate}%</p>
                  <p className="text-purple-400 text-xs mt-1">Task completion rate</p>
                </div>
                <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
                  <Star className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center space-x-1 mb-6 bg-gray-800 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('available')}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'available'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            Available Tasks ({tasks.filter(t => t.status === 'available' || t.status === 'completed').length})
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'completed'
                ? 'bg-green-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            Completed Tasks ({submissions.length})
          </button>
        </div>



        {/* Available Tasks Section */}
        {activeTab === 'available' && (
          <div className="space-y-6">
            {viewMode === 'list' ? (
              <>
                {/* Tasks Grid - More Broadly Visible */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  {tasks
                    .filter(task =>
                      (task.status === 'available' || task.status === 'completed')
                    )
                    .map((task) => (
                    <Card
                      key={task.id}
                      className={`transition-all duration-200 hover:shadow-lg ${
                        task.status === 'completed'
                          ? 'bg-green-900 border-green-600 hover:border-green-500'
                          : 'bg-gray-800 border-gray-700 cursor-pointer hover:border-blue-500'
                      } ${
                        selectedTask?.id === task.id ? 'ring-2 ring-blue-500 border-blue-500' : ''
                      }`}
                      onClick={() => task.status === 'available' && handleTaskSelect(task)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <CardTitle className="text-white text-lg">{task.title}</CardTitle>
                              {task.status === 'completed' && (
                                <CheckCircle className="h-5 w-5 text-green-400" />
                              )}
                            </div>
                            <div className="flex items-center space-x-4 text-sm">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                task.status === 'completed' ? 'bg-green-800 text-green-200' :
                                // task.priority === 'high' ? 'bg-red-900 text-red-300' :
                                // task.priority === 'medium' ? 'bg-yellow-900 text-yellow-300' :
                                'bg-blue-900 text-blue-300'
                              }`}>
                                {task.status === 'completed' ? 'Completed' : `incompleted`}
                              </span>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                task.status === 'completed' ? 'bg-green-800 text-green-200' : 'bg-blue-900 text-blue-300'
                              }`}>
                                {task.category}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`text-2xl font-bold ${
                              task.status === 'completed' ? 'text-green-400' : 'text-yellow-400'
                            }`}>
                              {task.points}
                            </div>
                            <div className="text-xs text-gray-400">points</div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <p className={`text-sm mb-4 leading-relaxed line-clamp-3 ${
                          task.status === 'completed' ? 'text-green-200' : 'text-gray-300'
                        }`}>
                          {task.description}
                        </p>
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center space-x-4">
                            <div className={`flex items-center space-x-1 ${
                              task.status === 'completed' ? 'text-green-300' : 'text-gray-400'
                            }`}>
                              <Clock className="h-4 w-4" />
                              <span>{task.estimatedTime}</span>
                            </div>
                            <div className={`flex items-center space-x-1 ${
                              task.status === 'completed' ? 'text-green-300' : 'text-gray-400'
                            }`}>
                              <Calendar className="h-4 w-4" />
                              <span>{task.deadline}</span>
                            </div>
                          </div>
                          {task.status === 'available' && (
                            <div className="flex items-center space-x-2">
                              <Button
                                size="sm"
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleTaskSelect(task);
                                }}
                              >
                                Start Task
                              </Button>
                            </div>
                          )}
                          {task.status === 'completed' && (
                            <div className="flex items-center space-x-2">
                              <span className="text-green-400 font-medium text-sm">✓ Completed</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Upcoming Locked Tasks */}
                {tasks.filter(task => task.status === 'locked').length > 0 && (
                  <div className="mt-8">
                    <h3 className="text-lg font-semibold text-white mb-4">
                      🔒 Upcoming Tasks (Complete previous tasks to unlock)
                    </h3>
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                      {tasks
                        .filter(task => task.status === 'locked')
                        .slice(0, 4) // Show only next 4 locked tasks
                        .map((task) => (
                        <Card
                          key={task.id}
                          className="bg-gray-900 border-gray-600 opacity-60"
                        >
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-2">
                                  <CardTitle className="text-gray-400 text-lg">{task.title}</CardTitle>
                                  <span className="text-gray-500">🔒</span>
                                </div>
                                <div className="flex items-center space-x-4 text-sm">
                                  <span className="px-2 py-1 bg-gray-800 text-gray-400 rounded-full text-xs font-medium">
                                    Locked
                                  </span>
                                  <span className="px-2 py-1 bg-gray-800 text-gray-400 rounded-full text-xs font-medium">
                                    {task.category}
                                  </span>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-2xl font-bold text-gray-500">{task.points}</div>
                                <div className="text-xs text-gray-500">points</div>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="pt-0">
                            <p className="text-gray-500 text-sm mb-4 leading-relaxed line-clamp-2">
                              {task.description}
                            </p>
                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center space-x-4">
                                <div className="flex items-center space-x-1 text-gray-500">
                                  <Clock className="h-4 w-4" />
                                  <span>{task.estimatedTime}</span>
                                </div>
                                <div className="flex items-center space-x-1 text-gray-500">
                                  <Calendar className="h-4 w-4" />
                                  <span>{task.deadline}</span>
                                </div>
                              </div>
                              <span className="text-gray-500 text-sm">Complete previous tasks to unlock</span>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              /* Task Details View */
              <div className="space-y-6">
                {/* Back Button */}
                <div className="flex items-center space-x-4">
                  <Button
                    variant="outline"
                    onClick={handleBackToList}
                    className="border-gray-700 text-gray-300 hover:bg-gray-800"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Tasks
                  </Button>
                </div>

                {/* Task Details Card */}
                {viewingTask && (
                  <Card className="bg-gray-800 border-gray-700">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-white text-2xl mb-4">{viewingTask.title}</CardTitle>
                          <div className="flex items-center space-x-4 mb-4">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                              // viewingTask.priority === 'high' ? 'bg-red-900 text-red-300' :
                              // viewingTask.priority === 'medium' ? 'bg-yellow-900 text-yellow-300' :
                              'bg-green-900 text-green-300'
                            }`}>
                              {/* {viewingTask.priority} priority */}
                            </span>
                            <span className="px-3 py-1 bg-blue-900 text-blue-300 rounded-full text-sm font-medium">
                              {viewingTask.category}
                            </span>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                              viewingTask.status === 'available' ? 'bg-green-900 text-green-300' :
                              viewingTask.status === 'completed' ? 'bg-blue-900 text-blue-300' :
                              'bg-gray-900 text-gray-300'
                            }`}>
                              {viewingTask.status.replace('_', ' ')}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-4xl font-bold text-yellow-400 mb-1">{viewingTask.points}</div>
                          <div className="text-sm text-gray-400">points reward</div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Description */}
                      <div className="bg-gray-700 rounded-lg p-6">
                        <h3 className="text-white font-semibold mb-3">Task Description</h3>
                        <p className="text-gray-300 leading-relaxed">{viewingTask.description}</p>
                      </div>

                      {/* Task Details Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-gray-700 rounded-lg p-4">
                          <p className="text-gray-400 text-sm mb-1">Day</p>
                          <p className="text-white font-semibold">{viewingTask.day}</p>
                        </div>
                        <div className="bg-gray-700 rounded-lg p-4">
                          <p className="text-gray-400 text-sm mb-1">Estimated Time</p>
                          <p className="text-white font-semibold">{viewingTask.estimatedTime}</p>
                        </div>
                        <div className="bg-gray-700 rounded-lg p-4">
                          <p className="text-gray-400 text-sm mb-1">Deadline</p>
                          <p className="text-white font-semibold">{viewingTask.deadline}</p>
                        </div>
                        <div className="bg-gray-700 rounded-lg p-4">
                          <p className="text-gray-400 text-sm mb-1">Category</p>
                          <p className="text-white font-semibold">{viewingTask.category}</p>
                        </div>
                      </div>

                      {/* Guidelines */}
                      <div className="bg-gray-700 rounded-lg p-6">
                        <h3 className="text-white font-semibold mb-3">Task Guidelines</h3>
                        <ul className="list-disc list-inside text-gray-300 space-y-2">
                          <li>Follow brand voice and use approved assets.</li>
                          <li>Include required hashtags and tag the official account.</li>
                          <li>Ensure your submission is original and high quality.</li>
                          <li>Submit before the end of the day.</li>
                          <li>Provide clear proof of completion (screenshots, links, etc.).</li>
                          <li>Track the number of people you connected with during this task.</li>
                        </ul>
                      </div>

                      {/* Task Submission Form */}
                      {selectedTask && selectedTask.id === viewingTask.id && (
                        <div className="bg-gray-700 rounded-lg p-6">
                          <h3 className="text-white font-semibold mb-4 flex items-center">
                            <Send className="h-5 w-5 text-blue-400 mr-2" />
                            Submit Your Work
                          </h3>

                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-300 mb-2">
                                Submission Details
                              </label>
                              <textarea
                                value={submissionText}
                                onChange={(e) => setSubmissionText(e.target.value)}
                                placeholder="Describe your work, include links, screenshots, or any relevant details..."
                                className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                rows={4}
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-300 mb-2">
                                Upload Image (Optional)
                              </label>
                              <div className="border-2 border-dashed border-gray-500 rounded-lg p-4 text-center">
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={handleImageUpload}
                                  className="hidden"
                                  id="image-upload-details"
                                />
                                <label htmlFor="image-upload-details" className="cursor-pointer">
                                  <ImageIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                                  <p className="text-gray-400 text-sm">
                                    {submissionImage ? submissionImage.name : 'Click to upload image'}
                                  </p>
                                </label>
                              </div>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-300 mb-2">
                                People Connected (Optional)
                              </label>
                              <Input
                                type="number"
                                value={peopleConnected}
                                onChange={(e) => setPeopleConnected(parseInt(e.target.value) || 0)}
                                placeholder="Number of people you connected with"
                                className="bg-gray-600 border-gray-500 text-white"
                                min="0"
                              />
                            </div>

                            <div className="flex justify-between gap-4 pt-4">
                              <Button
                                variant="outline"
                                onClick={handleBackToList}
                                className="border-gray-500 text-gray-300 hover:bg-gray-600"
                              >
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back to Tasks
                              </Button>
                              <Button
                                onClick={handleSubmitTask}
                                disabled={!submissionText.trim() || submitting}
                                className="bg-green-600 hover:bg-green-700 disabled:opacity-50"
                              >
                                {submitting ? (
                                  <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    Submitting...
                                  </>
                                ) : (
                                  <>
                                    <Send className="h-4 w-4 mr-2" />
                                    Submit Task
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Action Buttons - Only show if not selected for submission */}
                      {(!selectedTask || selectedTask.id !== viewingTask.id) && (
                        <div className="flex justify-end gap-4 pt-4">
                          <Button
                            variant="outline"
                            onClick={handleBackToList}
                            className="border-gray-700 text-gray-300 hover:bg-gray-800"
                          >
                            Back to List
                          </Button>
                          <Button
                            onClick={() => {
                              if (viewingTask && viewingTask.status !== 'locked') {
                                setSelectedTask(viewingTask);
                              }
                            }}
                            className="bg-blue-600 hover:bg-blue-700"
                            disabled={viewingTask?.status === 'locked'}
                          >
                            Start This Task
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            )}


          </div>
        )}

        {/* Completed Tasks Section */}
        {activeTab === 'completed' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4">
              {submissions.length > 0 ? (
                submissions.map((submission) => (
                  <Card key={submission.id} className="bg-gray-800 border-gray-700">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-white mb-2">{submission.taskTitle}</h3>
                          <div className="flex items-center space-x-4 mb-3">
                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-900 text-green-300">
                              completed
                            </span>
                            <span className="text-yellow-400 font-medium">{submission.points} points</span>
                            {submission.peopleConnected && submission.peopleConnected > 0 && (
                              <span className="text-blue-400 text-sm flex items-center space-x-1">
                                <Users className="h-4 w-4" />
                                <span>{submission.peopleConnected} people connected</span>
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-400 mb-1">Submitted</div>
                          <div className="text-white font-medium">
                            {new Date(submission.submittedAt).toLocaleDateString()}
                          </div>
                          <div className="text-gray-400 text-sm">
                            {new Date(submission.submittedAt).toLocaleTimeString()}
                          </div>
                          {submission.completedAt && (
                            <>
                              <div className="text-sm text-gray-400 mb-1 mt-2">Completed</div>
                              <div className="text-green-400 font-medium">
                                {new Date(submission.completedAt).toLocaleDateString()}
                              </div>
                              <div className="text-gray-400 text-sm">
                                {new Date(submission.completedAt).toLocaleTimeString()}
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="bg-gray-700 rounded-lg p-4 mb-4">
                        <h4 className="text-white font-medium mb-2">Submission Details</h4>
                        <p className="text-gray-300 text-sm leading-relaxed">{submission.submissionText}</p>
                      </div>

                      {submission.imageUrl && (
                        <div className="bg-gray-700 rounded-lg p-4">
                          <h4 className="text-white font-medium mb-2">Proof Image</h4>
                          <img
                            src={submission.imageUrl}
                            alt="Submission proof"
                            className="max-w-full h-auto rounded-lg border border-gray-600"
                          />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card className="bg-gray-800 border-gray-700">
                  <CardContent className="p-12 text-center">
                    <CheckCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">No Completed Tasks Yet</h3>
                    <p className="text-gray-400">
                      Complete your first task to see it here with completion details
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}


      </div>
    </div>
  );
};

export default Tasks;
