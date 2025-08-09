import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, CheckCircle, AlertCircle, Calendar, Award, Clock, FileText, Image as ImageIcon, Send, Eye, Star, Lock } from 'lucide-react';

const BACKEND_URL = 'http://127.0.0.1:8000';

interface Task {
  id: string;
  title: string;
  description: string;
  points: number;
  deadline: string;
  priority: 'high' | 'medium' | 'low';
  status: 'available' | 'in_progress' | 'completed' | 'locked';
  category: string;
  day: number;
}

interface Submission {
  id: string;
  taskId: string;
  taskTitle: string;
  submissionText: string;
  imageUrl?: string;
  submittedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  points: number;
}

const Tasks: React.FC<{ refreshUser?: () => Promise<void> }> = ({ refreshUser }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [submissionText, setSubmissionText] = useState('');
  const [submissionImage, setSubmissionImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [modalTask, setModalTask] = useState<Task | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  // Sample data
  const sampleTasks: Task[] = Array.from({ length: 15 }, (_, idx) => {
    const day = idx + 1;
    const isAvailable = day <= 2; // only first 2 tasks available
    return {
      id: String(day),
      title: `Day ${day} Task`,
      description:
        day % 3 === 1
          ? 'Create and share a post about our brand. Include hashtags and tag our official account.'
          : day % 3 === 2
          ? 'Promote our upcoming campus event by distributing flyers and posting on university notice boards.'
          : 'Create a short video or blog post about your ambassador experience.',
      points: 100 + day * 10,
      deadline: `Day ${day}`,
      priority: (day % 3 === 0 ? 'medium' : day % 2 === 0 ? 'high' : 'low') as 'high' | 'medium' | 'low',
      status: (isAvailable ? 'available' : 'locked') as Task['status'],
      category: day % 3 === 0 ? 'Content' : day % 3 === 1 ? 'Marketing' : 'Events',
      day
    };
  });

  const sampleSubmissions: Submission[] = [
    {
      id: '1',
      taskId: '3',
      taskTitle: 'Referral Program',
      submissionText: 'Successfully referred 3 students. They have shown interest and are in the onboarding process.',
      submittedAt: '2024-01-10T10:30:00Z',
      status: 'approved',
      points: 180
    },
    {
      id: '2',
      taskId: '1',
      taskTitle: 'Social Media Campaign',
      submissionText: 'Posted 3 engaging posts with proper hashtags and brand mentions.',
      imageUrl: '/sample-post.jpg',
      submittedAt: '2024-01-08T15:45:00Z',
      status: 'pending',
      points: 150
    }
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        setTasks(sampleTasks);
        setSubmissions(sampleSubmissions);
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

  const handleTaskSelect = (task: Task) => {
    if (task.status === 'locked') {
      alert('This task will unlock later. Only two tasks are available at a time.');
      return;
    }
    setSelectedTask(task);
    setSubmissionText('');
    setSubmissionImage(null);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSubmissionImage(file);
    }
  };

  const handleSubmitTask = async () => {
    if (!selectedTask || !submissionText.trim()) {
      alert('Please select a task and provide submission details.');
      return;
    }

    setSubmitting(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const newSubmission: Submission = {
        id: Date.now().toString(),
        taskId: selectedTask.id,
        taskTitle: selectedTask.title,
        submissionText,
        imageUrl: submissionImage ? URL.createObjectURL(submissionImage) : undefined,
        submittedAt: new Date().toISOString(),
        status: 'pending',
        points: selectedTask.points
      };

      setSubmissions(prev => [newSubmission, ...prev]);
      setTasks(prev => prev.map(task => 
        task.id === selectedTask.id 
          ? { ...task, status: 'completed' as const }
          : task
      ));

      // Unlock the next locked task if available, ensuring only two available at a time
      setTasks(prev => {
        const availableCount = prev.filter(t => t.status === 'available' || t.status === 'in_progress').length;
        if (availableCount >= 2) {
          const nextLocked = prev
            .slice()
            .sort((a, b) => a.day - b.day)
            .find(t => t.status === 'locked');
          if (nextLocked) {
            return prev.map(t => (t.id === nextLocked.id ? { ...t, status: 'available' as const } : t));
          }
        }
        return prev;
      });
      
      setSelectedTask(null);
      setSubmissionText('');
      setSubmissionImage(null);
      
      alert('Task submitted successfully! Your submission is under review.');
    } catch (error) {
      alert('Error submitting task. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewTask = (task: Task) => {
    setModalTask(task);
    setShowTaskModal(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-400';
      case 'in_progress': return 'text-blue-400';
      case 'available': return 'text-gray-400';
      case 'locked': return 'text-gray-500';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'in_progress': return <Clock className="h-4 w-4 text-blue-400" />;
      case 'available': return <Award className="h-4 w-4 text-yellow-400" />;
      case 'locked': return <Lock className="h-4 w-4 text-gray-500" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-xl text-gray-400">Loading tasks...</div>
      </div>
    );
  }

  const completedTasks = tasks.filter(task => task.status === 'completed').length;
  const totalTasks = tasks.length;
  const successRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header with Task Count and New Task Button */}
      <div className="flex items-center justify-between p-6 border-b border-gray-800">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold">Tasks</h1>
          <div className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm">
            {tasks.length} Total
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        {/* Stats Overview (Total Tasks, Completed, Success Rate) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-medium">Total Tasks</p>
                  <p className="text-2xl font-bold text-white mt-1">{totalTasks}</p>
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

        {/* Tasks Grid (Available Tasks and Task Submission) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Available Tasks Card */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Available Tasks</CardTitle>
              <CardDescription className="text-gray-400">
                Select a task to submit your work
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-[480px] overflow-y-auto pr-2">
                {tasks
                  .slice()
                  .sort((a, b) => a.day - b.day)
                  .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                  .map((task) => (
                  <div 
                    key={task.id}
                    className={`bg-gray-700 rounded-lg p-4 cursor-pointer transition-colors ${
                      selectedTask?.id === task.id ? 'ring-2 ring-blue-500' : 'hover:bg-gray-600'
                    }`}
                    onClick={() => handleTaskSelect(task)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-white">{task.title}</h4>
                      <div className="flex items-center space-x-2">
                        <span className={`text-xs ${getStatusColor(task.status)}`}>
                          {task.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                    <p className="text-gray-400 text-sm mb-3 line-clamp-2">{task.description}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-sm">
                        <span className="text-yellow-400">{task.points} points</span>
                        <span className="text-gray-400">Day: {task.day}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewTask(task);
                          }}
                          variant="ghost"
                          size="sm"
                          className="text-blue-400 hover:text-blue-300"
                          disabled={task.status === 'locked'}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {getStatusIcon(task.status)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {/* Pagination Controls */}
              <div className="mt-4 flex items-center justify-between">
                <Button
                  variant="outline"
                  className="border-gray-700 text-gray-300 hover:bg-gray-800"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-gray-400">
                  Page {currentPage} of {Math.max(1, Math.ceil(tasks.length / pageSize))}
                </span>
                <Button
                  variant="outline"
                  className="border-gray-700 text-gray-300 hover:bg-gray-800"
                  onClick={() => setCurrentPage((p) => Math.min(Math.ceil(tasks.length / pageSize), p + 1))}
                  disabled={currentPage >= Math.ceil(tasks.length / pageSize)}
                >
                  Next
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Task Submission Card */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Task Submission</CardTitle>
              <CardDescription className="text-gray-400">
                Submit your completed work
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedTask ? (
                <div className="space-y-4">
                  <div className="bg-gray-700 rounded-lg p-4">
                    <h4 className="font-medium text-white mb-2">{selectedTask.title}</h4>
                    <p className="text-gray-400 text-sm mb-3">{selectedTask.description}</p>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-yellow-400">{selectedTask.points} points</span>
                      <span className="text-gray-400">Due: {selectedTask.deadline}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Submission Details
                      </label>
                      <textarea
                        value={submissionText}
                        onChange={(e) => setSubmissionText(e.target.value)}
                        placeholder="Describe your work, include links, screenshots, or any relevant details..."
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        rows={4}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Upload Image (Optional)
                      </label>
                      <div className="border-2 border-dashed border-gray-600 rounded-lg p-4 text-center">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                          id="image-upload"
                        />
                        <label htmlFor="image-upload" className="cursor-pointer">
                          <ImageIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-gray-400 text-sm">
                            {submissionImage ? submissionImage.name : 'Click to upload image'}
                          </p>
                        </label>
                      </div>
                    </div>
                    
                    <Button
                      onClick={handleSubmitTask}
                      disabled={!submissionText.trim() || submitting}
                      className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50"
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
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-400">Select a task from the left to submit your work</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Task Details Modal */}
        <div className={`${showTaskModal ? 'fixed' : 'hidden'} inset-0 z-50 flex items-center justify-center`} role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/70" onClick={() => setShowTaskModal(false)}></div>
          <div className="relative w-full max-w-2xl mx-4 bg-gray-900 rounded-lg border border-gray-700 shadow-xl">
            <div className="flex items-center justify-between p-4 border-b border-gray-800">
              <h3 className="text-lg font-semibold text-white">{modalTask?.title}</h3>
              <button
                onClick={() => setShowTaskModal(false)}
                className="text-gray-400 hover:text-white"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="bg-gray-800 rounded-lg p-4">
                <p className="text-gray-300 text-sm leading-6">{modalTask?.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-gray-800 rounded-lg p-3">
                  <p className="text-gray-400">Day</p>
                  <p className="text-white font-medium">{modalTask?.day}</p>
                </div>
                <div className="bg-gray-800 rounded-lg p-3">
                  <p className="text-gray-400">Points</p>
                  <p className="text-yellow-400 font-medium">{modalTask?.points}</p>
                </div>
                <div className="bg-gray-800 rounded-lg p-3">
                  <p className="text-gray-400">Category</p>
                  <p className="text-white font-medium">{modalTask?.category}</p>
                </div>
              </div>
              <div>
                <p className="text-gray-300 text-sm font-semibold mb-2">Guidelines</p>
                <ul className="list-disc list-inside text-gray-400 text-sm space-y-1">
                  <li>Follow brand voice and use approved assets.</li>
                  <li>Include required hashtags and tag the official account.</li>
                  <li>Ensure your submission is original and high quality.</li>
                  <li>Submit before the end of the day.</li>
                </ul>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setShowTaskModal(false)}
                  className="border-gray-700 text-gray-300 hover:bg-gray-800"
                >
                  Close
                </Button>
                <Button
                  onClick={() => {
                    if (modalTask && modalTask.status !== 'locked') {
                      setSelectedTask(modalTask);
                    }
                    setShowTaskModal(false);
                  }}
                  className="bg-blue-600 hover:bg-blue-700"
                  disabled={modalTask?.status === 'locked'}
                >
                  Start Task
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Tasks;
