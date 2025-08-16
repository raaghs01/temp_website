import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Clock, FileText, Image as ImageIcon, Send, Star, Lock, Users, ArrowLeft, Download, X, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { useTheme } from '@/App';
import { User } from '@/types';

const BACKEND_URL = 'http://127.0.0.1:5001';

interface Task {
  id: string;
  title: string;
  description: string;
  points: number;
  deadline?: string;
  status: 'available' | 'completed' | 'locked';
  day: number;
}

interface Submission {
  id: string;
  taskId: string;
  taskTitle: string;
  submissionText: string;
  submittedAt: string;
  status: 'completed';
  points: number;
  peopleConnected?: number;
}

const Tasks: React.FC<{ refreshUser?: () => Promise<void>; user?: User | null }> = ({ refreshUser, user }) => {
  const { theme } = useTheme();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [submissionText, setSubmissionText] = useState('');
  const [submissionFiles, setSubmissionFiles] = useState<File[]>([]);
  const [peopleConnected, setPeopleConnected] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const [showOrientationVideo, setShowOrientationVideo] = useState(false);
  const [stats, setStats] = useState({
    total_tasks_completed: 0,
    total_available_tasks: 0,
    success_rate: 0,
    current_day: 1,
    days_since_registration: 1
  });

  // Get user registration date from user profile instead of localStorage
  const getUserRegistrationDate = () => {
    // Try to get from user profile first (most accurate)
    if (user?.registration_date) {
      return new Date(user.registration_date);
    }
    
    // Fallback to localStorage if user profile not available
    const storedDate = localStorage.getItem('userRegistrationDate');
    if (storedDate) {
      return new Date(storedDate);
    }
    
    // Final fallback to current date
    return new Date();
  };

  const fetchTasks = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token found');
        return;
      }

      console.log('Fetching tasks...');
      console.log('User registration date:', user?.registration_date);

      // Fetch ALL tasks (available + completed + locked)
      const allTasksResponse = await fetch(`${BACKEND_URL}/api/all-tasks`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!allTasksResponse.ok) {
        throw new Error(`Failed to fetch all tasks: ${allTasksResponse.status}`);
      }

      const allTasksData = await allTasksResponse.json();
      console.log('All tasks data:', allTasksData);
      console.log('Available tasks:', allTasksData.filter((t: Task) => t.status === 'available'));
      
      setTasks(allTasksData);

      // Fetch dashboard stats
      const statsResponse = await fetch(`${BACKEND_URL}/api/dashboard-stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats({
          total_tasks_completed: statsData.total_tasks_completed || 0,
          total_available_tasks: statsData.total_available_tasks || 0,
          success_rate: statsData.completion_percentage || 0,
          current_day: statsData.current_day || 1,
          days_since_registration: statsData.current_day || 1 // Use current_day for consistency
        });
      }

      // Fetch user submissions
      const submissionsResponse = await fetch(`${BACKEND_URL}/api/my-submissions`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (submissionsResponse.ok) {
        const submissionsData = await submissionsResponse.json();
        setSubmissions(submissionsData);
      }

    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  // Group tasks by status and day
  const availableTasks = tasks.filter((task: Task) => task.status === 'available');
  const completedTasks = tasks.filter((task: Task) => task.status === 'completed');
  const lockedTasks = tasks.filter((task: Task) => task.status === 'locked');

  // Sort tasks by day
  const sortedAvailableTasks = availableTasks.sort((a, b) => a.day - b.day);
  const sortedCompletedTasks = completedTasks.sort((a, b) => a.day - b.day);
  const sortedLockedTasks = lockedTasks.sort((a, b) => a.day - b.day);

  const getDayLabel = (day: number) => {
    if (day === 0) return 'Orientation';
    return `Day ${day}`;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const fileArray = Array.from(files);
      const maxFiles = 5;
      const maxSizePerFile = 8 * 1024 * 1024; // 8MB
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];

      // Check if adding these files would exceed the limit
      if (submissionFiles.length + fileArray.length > maxFiles) {
        alert(`Maximum ${maxFiles} files allowed. You currently have ${submissionFiles.length} files.`);
        return;
      }

      // Validate each file
      const validFiles: File[] = [];
      for (const file of fileArray) {
        if (file.size > maxSizePerFile) {
          alert(`File "${file.name}" is too large. Maximum size is 8MB per file.`);
          continue;
        }
        if (!allowedTypes.includes(file.type)) {
          alert(`File "${file.name}" has unsupported type. Only images and PDFs are allowed.`);
          continue;
        }
        validFiles.push(file);
      }

      if (validFiles.length > 0) {
        setSubmissionFiles(prev => [...prev, ...validFiles]);
      }
    }
  };

  const removeFile = (index: number) => {
    setSubmissionFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmitTask = async () => {
    if (!selectedTask || !submissionText.trim()) {
      alert('Please provide submission details.');
      return;
    }

    if (submissionFiles.length === 0) {
      alert('Please upload at least one file (PDF or image).');
      return;
    }

    console.log('Submitting task:', selectedTask);
    console.log('User registration date:', user?.registration_date);
    console.log('Current day should be:', user?.current_day);

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Authentication required. Please log in again.');
        return;
      }

      const formData = new FormData();
      formData.append('task_id', selectedTask.id);
      formData.append('status_text', submissionText);
      formData.append('people_connected', peopleConnected.toString());

      // Append all files to the form data
      submissionFiles.forEach((file) => {
        formData.append('files', file);
      });

      console.log('Sending request to:', `${BACKEND_URL}/api/submit-task-with-files`);
      console.log('Task ID:', selectedTask.id);
      console.log('Task Day:', selectedTask.day);

      const response = await fetch(`${BACKEND_URL}/api/submit-task-with-files`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });

      console.log('Response status:', response.status);
      const responseText = await response.text();
      console.log('Response text:', responseText);

      if (response.ok) {
        const result = JSON.parse(responseText);
        
        // Refresh tasks after successful submission
        await fetchTasks();
        
        setSelectedTask(null);
        setSubmissionText('');
        setSubmissionFiles([]);
        setPeopleConnected(0);
        setShowSubmissionModal(false);

        const filesCount = result.saved_files?.length || submissionFiles.length;
        const filesText = filesCount > 1 ? ` with ${filesCount} files` : ' with 1 file';
        alert(`Task submitted successfully${filesText}! You earned ${result.points_earned || selectedTask.points} points.`);
      } else {
        console.error('Submission failed:', responseText);
        let errorMessage = 'Please try again.';
        try {
          const errorData = await response.json();
          errorMessage = errorData.detail || errorMessage;
        } catch {
          errorMessage = response.statusText || errorMessage;
        }
        alert(`Error submitting task: ${errorMessage}`);
      }
    } catch (error) {
      console.error('Error submitting task:', error);
      alert('Error submitting task. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkOrientationAsRead = async (task: Task) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Authentication required. Please log in again.');
        return;
      }

      console.log('Marking orientation as read for task:', { id: task.id, title: task.title, day: task.day });

      // For Day 0 orientation, submit with minimal data
      const formData = new FormData();
      formData.append('task_id', task.id);
      formData.append('status_text', 'Orientation completed - marked as read');
      formData.append('people_connected', '0');

      const response = await fetch(`${BACKEND_URL}/api/submit-task-with-files`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        await fetchTasks(); // Refresh tasks
        if (refreshUser) await refreshUser(); // Refresh user data
        alert(`Orientation completed! You earned ${result.points_earned || task.points} points.`);
      } else {
        const errorData = await response.json();
        alert(`Failed to mark orientation as read: ${errorData.detail || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error marking orientation as read:', error);
      alert('Error marking orientation as read. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className={`mt-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Loading tasks...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Tasks
            </h1>
            <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              Complete tasks to earn points and climb the leaderboard
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className={`p-6 rounded-xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Total Tasks
                </h3>
                <p className="text-3xl font-bold text-blue-500">{stats.total_available_tasks}</p>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  Available to complete
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <span className="text-2xl">📋</span>
              </div>
            </div>
          </div>

          <div className={`p-6 rounded-xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Completed
                </h3>
                <p className="text-3xl font-bold text-green-500">{stats.total_tasks_completed}</p>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  Successfully finished
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <span className="text-2xl">✅</span>
              </div>
            </div>
          </div>

          <div className={`p-6 rounded-xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Success Rate
                </h3>
                <p className="text-3xl font-bold text-purple-500">{stats.success_rate}%</p>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  Task completion rate
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <span className="text-2xl">⭐</span>
              </div>
            </div>
          </div>
        </div>

        {/* Current Day Info */}
        <div className={`p-4 rounded-lg mb-6 ${theme === 'dark' ? 'bg-blue-900/20 border border-blue-800' : 'bg-blue-50 border border-blue-200'}`}>
          <p className={`text-sm ${theme === 'dark' ? 'text-blue-300' : 'text-blue-700'}`}>
            📅 You are currently on <strong>Day {stats.current_day}</strong> of your ambassador journey 
            ({stats.current_day} days since registration)
          </p>
        </div>

        {/* Available Tasks */}
        {sortedAvailableTasks.length > 0 && (
          <div className="mb-8">
            <div className={`inline-flex items-center px-4 py-2 rounded-lg mb-4 ${theme === 'dark' ? 'bg-blue-900' : 'bg-blue-500'}`}>
              <span className="text-white font-semibold">Available Tasks ({sortedAvailableTasks.length})</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {sortedAvailableTasks.map((task) => (
                <TaskCard 
                  key={task.id} 
                  task={task} 
                  theme={theme}
                  onTaskClick={setSelectedTask}
                  onOrientationClick={() => setShowOrientationVideo(true)}
                  dayLabel={getDayLabel(task.day)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Completed Tasks */}
        {sortedCompletedTasks.length > 0 && (
          <div className="mb-8">
            <div className={`inline-flex items-center px-4 py-2 rounded-lg mb-4 ${theme === 'dark' ? 'bg-green-900' : 'bg-green-500'}`}>
              <span className="text-white font-semibold">Completed Tasks ({sortedCompletedTasks.length})</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {sortedCompletedTasks.map((task) => (
                <TaskCard 
                  key={task.id} 
                  task={task} 
                  theme={theme}
                  onTaskClick={setSelectedTask}
                  onOrientationClick={() => setShowOrientationVideo(true)}
                  dayLabel={getDayLabel(task.day)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Locked Tasks */}
        {sortedLockedTasks.length > 0 && (
          <div className="mb-8">
            <div className={`inline-flex items-center px-4 py-2 rounded-lg mb-4 ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-500'}`}>
              <span className="text-white font-semibold">Locked Tasks ({sortedLockedTasks.length})</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {sortedLockedTasks.map((task) => (
                <TaskCard 
                  key={task.id} 
                  task={task} 
                  theme={theme}
                  onTaskClick={() => {}} // Locked tasks can't be clicked
                  onOrientationClick={() => {}} // Locked tasks can't be clicked
                  dayLabel={getDayLabel(task.day)}
                />
              ))}
            </div>
          </div>
        )}

        {sortedAvailableTasks.length === 0 && sortedCompletedTasks.length === 0 && sortedLockedTasks.length === 0 && (
          <div className={`text-center py-12 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            <span className="text-4xl mb-4 block">📋</span>
            <p className="text-lg">No tasks found.</p>
            <p>Check back later for new assignments!</p>
          </div>
        )}
      </div>

      {/* Orientation Video Modal */}
      {showOrientationVideo && (
        <OrientationVideoModal
          isOpen={showOrientationVideo}
          onClose={() => setShowOrientationVideo(false)}
          onComplete={() => {
            setShowOrientationVideo(false);
            // For Day 0 orientation, directly mark as completed without submission modal
            console.log('Looking for orientation task in:', tasks.map((t: Task) => ({ title: t.title, day: t.day, status: t.status, id: t.id })));
            const orientationTask = tasks.find((t: Task) => t.day === 0 && t.status === 'available');
            console.log('Found orientation task:', orientationTask);
            if (orientationTask) {
              handleMarkOrientationAsRead(orientationTask);
            } else {
              console.error('No Day 0 orientation task found!');
              alert('Error: Could not find orientation task to complete.');
            }
          }}
          theme={theme}
        />
      )}

      {/* Task Submission Modal */}
      {selectedTask && (
        <TaskSubmissionModal
          task={selectedTask}
          isOpen={!!selectedTask}
          onClose={() => {
            setSelectedTask(null);
            setSubmissionText('');
            setPeopleConnected(0);
            setSubmissionFiles([]);
            setShowSubmissionModal(false);
          }}
          onSubmit={handleSubmitTask}
          submissionText={submissionText}
          setSubmissionText={setSubmissionText}
          peopleConnected={peopleConnected}
          setPeopleConnected={setPeopleConnected}
          submissionFiles={submissionFiles}
          setSubmissionFiles={setSubmissionFiles}
          handleFileUpload={handleFileUpload}
          removeFile={removeFile}
          submitting={submitting}
          theme={theme}
          dayLabel={getDayLabel(selectedTask.day)}
        />
      )}
    </div>
  );
};

const TaskCard: React.FC<{ 
  task: Task, 
  theme: string, 
  onTaskClick: (task: Task) => void, 
  onOrientationClick: () => void,
  dayLabel: string 
}> = ({ task, theme, onTaskClick, onOrientationClick, dayLabel }) => {
  const handleClick = () => {
    if (task.status === 'available') {
      if (task.title === 'Complete Orientation') {
        onOrientationClick();
      } else {
        onTaskClick(task);
      }
    }
  };

  const getStatusDisplay = () => {
    switch (task.status) {
      case 'completed':
        return { text: '✓ Completed', bgColor: 'bg-green-100 text-green-800', cardBg: 'bg-green-50' };
      case 'available':
        return { text: 'Available', bgColor: 'bg-blue-100 text-blue-800', cardBg: '' };
      case 'locked':
        return { text: '🔒 Locked', bgColor: 'bg-gray-100 text-gray-600', cardBg: 'bg-gray-50' };
      default:
        return { text: 'Unknown', bgColor: 'bg-gray-100 text-gray-600', cardBg: 'bg-gray-50' };
    }
  };

  const getStatusIcon = () => {
    switch (task.status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'available':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'locked':
        return <Lock className="h-4 w-4 text-gray-400" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const statusDisplay = getStatusDisplay();

  return (
    <div 
      onClick={handleClick} 
      className={`p-4 rounded-lg transition-all border
        ${theme === 'dark' ? 'bg-gray-800' : `bg-white ${statusDisplay.cardBg}`} 
        shadow-md hover:shadow-lg
        ${task.status === 'available' ? 'cursor-pointer border-blue-200' : task.status === 'locked' ? 'opacity-60 border-gray-200' : 'border-green-200'}
        ${task.status === 'completed' ? 'bg-green-50' : ''}
      `}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm text-gray-500">
          {dayLabel}
        </div>
        <div className={`text-xs rounded-full px-3 py-1 font-semibold ${statusDisplay.bgColor}`}>
          {statusDisplay.text}
        </div>
      </div>
      <div className={`text-lg font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'} ${task.status === 'locked' ? 'text-gray-500' : ''}`}>
        {task.title}
      </div>
      <div className={`text-sm mb-4 line-clamp-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} ${task.status === 'locked' ? 'text-gray-400' : ''}`}>
        {task.description}
      </div>
      <div className="flex items-center justify-between text-sm text-gray-500">
        <div>
          💰 {task.points} points
        </div>
        <div className="flex items-center">
          {getStatusIcon()}
        </div>
      </div>
    </div>
  );
};

// Modal component for task submission
const TaskSubmissionModal: React.FC<{
  task: Task;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  submissionText: string;
  setSubmissionText: (text: string) => void;
  peopleConnected: number;
  setPeopleConnected: (num: number) => void;
  submissionFiles: File[];
  setSubmissionFiles: (files: File[]) => void;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  removeFile: (index: number) => void;
  submitting: boolean;
  theme: string;
  dayLabel: string;
}> = ({
  task,
  isOpen,
  onClose,
  onSubmit,
  submissionText,
  setSubmissionText,
  peopleConnected,
  setPeopleConnected,
  submissionFiles,
  handleFileUpload,
  removeFile,
  submitting,
  theme,
  dayLabel
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className={`w-full max-w-lg p-6 rounded-xl shadow-lg ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold">{task.title}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="mb-2 text-sm text-gray-500">{dayLabel} • {task.points} points</div>
        <div className="mb-4 text-sm">{task.description}</div>
        
        <form onSubmit={e => { e.preventDefault(); onSubmit(); }}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Submission Details</label>
            <textarea
              value={submissionText}
              onChange={(e) => setSubmissionText(e.target.value)}
              placeholder="Describe your completion of this task..."
              className={`w-full p-3 border rounded-lg ${
                theme === 'dark' 
                  ? 'bg-gray-800 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
              rows={4}
              required
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">People Connected</label>
            <input
              type="number"
              value={peopleConnected}
              onChange={(e) => setPeopleConnected(parseInt(e.target.value) || 0)}
              min="0"
              className={`w-full p-3 border rounded-lg ${
                theme === 'dark' 
                  ? 'bg-gray-800 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
              placeholder="Number of people you connected with"
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Upload Files (Required)</label>
            <input
              type="file"
              onChange={handleFileUpload}
              multiple
              accept="image/*,.pdf"
              className={`w-full p-3 border rounded-lg ${
                theme === 'dark' 
                  ? 'bg-gray-800 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            />
            <p className="text-xs text-gray-500 mt-1">Upload images or PDFs (max 5 files, 8MB each)</p>
            
            {submissionFiles.length > 0 && (
              <div className="mt-2 space-y-2">
                {submissionFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-100 rounded">
                    <span className="text-sm">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="flex gap-4">
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting || !submissionText.trim() || submissionFiles.length === 0}
              className="flex-1"
            >
              {submitting ? 'Submitting...' : 'Submit Task'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Modal component for orientation video
const OrientationVideoModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  theme: string;
}> = ({ isOpen, onClose, onComplete, theme }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className={`w-full max-w-4xl max-h-[90vh] overflow-auto p-6 rounded-xl shadow-lg ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold">DC Studios Orientation</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="mb-6">
          <div className={`aspect-video bg-gray-200 rounded-lg flex items-center justify-center mb-4 ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`}>
            <div className="text-center">
              <div className="text-4xl mb-2">📹</div>
              <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                Orientation Video Placeholder
              </p>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                (Video will be embedded here)
              </p>
            </div>
          </div>
          
          <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'}`}>
            <h4 className="font-semibold mb-2">Welcome to DC Studios Ambassador Program!</h4>
            <div className="space-y-2 text-sm">
              <p>🎯 <strong>Mission:</strong> Connect with students and promote DC Studios services</p>
              <p>🌟 <strong>Goal:</strong> Build awareness about our tech solutions and internship opportunities</p>
              <p>📈 <strong>Growth:</strong> Develop your leadership and communication skills</p>
              <p>🤝 <strong>Community:</strong> Join a network of passionate student ambassadors</p>
            </div>
          </div>
          
          <div className={`mt-4 p-4 rounded-lg ${theme === 'dark' ? 'bg-blue-900/20 border border-blue-800' : 'bg-blue-50 border border-blue-200'}`}>
            <h4 className="font-semibold mb-2">Key Documents to Review:</h4>
            <ul className={`text-sm space-y-1 ${theme === 'dark' ? 'text-blue-300' : 'text-blue-700'}`}>
              <li>• Ambassador Guidelines and Best Practices</li>
              <li>• DC Studios Service Portfolio</li>
              <li>• Communication Templates and Resources</li>
              <li>• Code of Conduct and Policies</li>
            </ul>
          </div>
        </div>
        
        <div className="flex gap-4">
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1"
          >
            Close
          </Button>
          <Button
            onClick={onComplete}
            className="flex-1"
          >
            Mark as Read
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Tasks;
