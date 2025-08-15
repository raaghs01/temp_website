import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Clock, FileText, Image as ImageIcon, Send, Star, Lock, Users, ArrowLeft, Download, X, ChevronLeft, ChevronRight, Eye } from 'lucide-react';

const BACKEND_URL = 'http://127.0.0.1:5000';

interface Task {
  id: string;
  title: string;
  description: string;
  points: number;
  deadline: string;
  // priority: 'high' | 'medium' | 'low';
  status: 'available' | 'in_progress' | 'completed' | 'locked';
  // category: string;
  day: number;
  completedAt?: string;
  // estimatedTime?: string;
}

interface ProofFile {
  filename: string;
  content_type: string;
  size: number;
  data: string; // base64 encoded
}

interface Submission {
  id: string;
  taskId: string;
  taskTitle: string;
  submissionText: string;
  imageUrl?: string; // for backward compatibility
  proofFiles?: ProofFile[]; // new multiple files support
  submittedAt: string;
  // completedAt?: string;
  status: 'completed';
  points: number;
  peopleConnected?: number;
}

const Tasks: React.FC<{ refreshUser?: () => Promise<void> }> = ({ refreshUser }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [submissionText, setSubmissionText] = useState('');
  const [submissionFiles, setSubmissionFiles] = useState<File[]>([]);
  const [peopleConnected, setPeopleConnected] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [activeTab, setActiveTab] = useState<'available' | 'completed'>('available');
  const [viewMode, setViewMode] = useState<'list' | 'details'>('list');
  const [viewingTask, setViewingTask] = useState<Task | null>(null);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string>('');
  const [showProofModal, setShowProofModal] = useState(false);
  const [selectedProofFiles, setSelectedProofFiles] = useState<ProofFile[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Get user registration date for deadline calculations
  const getUserRegistrationDate = () => {
    const registrationDate = localStorage.getItem('userRegistrationDate');
    if (registrationDate) {
      return new Date(registrationDate);
    }
    // Fallback to current date if not found
    const fallbackDate = new Date();
    localStorage.setItem('userRegistrationDate', fallbackDate.toISOString());
    return fallbackDate;
  };

  // Calculate days since registration
  const getDaysSinceRegistration = () => {
    const registrationDate = getUserRegistrationDate();
    const currentDate = new Date();
    const diffTime = Math.abs(currentDate.getTime() - registrationDate.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays; // Day 0 is registration day, Day 1 is the next day
  };

  // Check if task is past deadline
  const isTaskPastDeadline = (taskDay: number) => {
    const daysSinceRegistration = getDaysSinceRegistration();
    // Tasks expire 2 days after they become available
    // Day 1-2 tasks expire on day 3, Day 3 task expires on day 5, etc.
    return daysSinceRegistration > taskDay + 1;
  };

  // Enhanced sample data with 15 tasks
  const sampleTasks: Task[] = [
    // Day 0: Orientation Task
    {
      id: '0',
      title: 'Complete Orientation',
      description: 'Watch the orientation video and read the company documents. This will help you understand our mission and how to be an effective ambassador.',
      points: 100,
      deadline: 'Day 0',
      status: (localStorage.getItem('orientationCompleted') === 'true' ? 'completed' : 'available') as Task['status'],
      day: 0
    },
    // Generate other tasks starting from Day 1 to Day 15
    ...Array.from({ length: 15 }, (_, idx) => {
      const day = idx + 1; // Start from Day 1 for promotional tasks
      const daysSinceRegistration = getDaysSinceRegistration();

      // Task availability logic:
      // Day 1-2: Available from day 1
      // Day 3: Available from day 3
      // Day 4: Available from day 4, etc.
      let isAvailable = false;
      if (day <= 2) {
        isAvailable = daysSinceRegistration >= 1;
      } else {
        isAvailable = daysSinceRegistration >= day;
      }

      // Check if task is past deadline
      const isPastDeadline = isTaskPastDeadline(day);

      const taskTypes = [
        {
          title: 'Social Media Campaign',
          description: 'Create and share engaging posts about our brand on your social media platforms. Include relevant hashtags, tag our official account, and encourage engagement from your followers.'
        },
        {
          title: 'Campus Event Promotion',
          description: 'Promote our upcoming campus events by distributing flyers, posting on university notice boards, and spreading awareness through word-of-mouth marketing.'
        },
        {
          title: 'Content Creation',
          description: 'Create original content such as blog posts, videos, or infographics that showcase your ambassador experience and highlight our brand values.'
        },
        {
          title: 'Student Outreach',
          description: 'Connect with fellow students, organize meetups, and build a community around our brand. Focus on genuine relationship building and value creation.'
        },
        {
          title: 'Feedback Collection',
          description: 'Gather feedback from students about our products/services, conduct surveys, and provide valuable insights to help improve our offerings.'
        },
        {
          title: 'Workshop Organization',
          description: 'Organize educational workshops or seminars related to your field of study. Invite fellow students and create valuable learning experiences.'
        },
        {
          title: 'Brand Ambassador Recruitment',
          description: 'Identify and recruit potential brand ambassadors from your network. Help expand our ambassador program with quality candidates.'
        },
        {
          title: 'Product Review & Testing',
          description: 'Test our latest products/services and provide detailed reviews. Share your honest feedback and user experience insights.'
        },
        {
          title: 'Community Building',
          description: 'Build and nurture online communities around our brand. Engage with followers and create meaningful discussions.'
        },
        {
          title: 'Partnership Development',
          description: 'Identify potential partnership opportunities with student organizations, clubs, or local businesses that align with our brand values.'
        }
      ];

      const taskType = taskTypes[(day - 1) % taskTypes.length];

      // Determine status
      let status: Task['status'] = 'locked';
      if (isPastDeadline && isAvailable) {
        status = 'locked'; // Past deadline
      } else if (isAvailable) {
        status = 'available';
      } else {
        status = 'locked';
      }

      return {
        id: String(day),
        title: `${taskType.title} - Day ${day}`,
        description: taskType.description,
        points: 100 + day * 10,
        deadline: isPastDeadline ? 'Deadline Reached' : `Day ${day}`,
        status,
        day
      };
    })
  ];

  const sampleSubmissions: Submission[] = [
    {
      id: '1',
      taskId: '3',
      taskTitle: 'Student Outreach - Day 3',
      submissionText: 'Successfully connected with 15 students during the campus event. Organized a small meetup and collected valuable feedback about student preferences.',
      submittedAt: '2024-01-10T10:30:00Z',
      // completedAt: '2024-01-10T14:45:00Z',
      status: 'completed',
      points: 180,
      peopleConnected: 15
    },
    {
      id: '2',
      taskId: '1',
      taskTitle: 'Social Media Campaign - Day 0',
      submissionText: 'Created and posted 5 engaging posts across Instagram, Twitter, and LinkedIn. Achieved 200+ likes and 50+ shares with proper hashtags and brand mentions.',
      imageUrl: '/sample-post.jpg',
      submittedAt: '2024-01-08T15:45:00Z',
      // completedAt: '2024-01-08T18:30:00Z',
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
      // completedAt: '2024-01-09T16:20:00Z',
      status: 'completed',
      points: 170,
      peopleConnected: 25
    }
  ];

  // Calculated values
  const availableTasks = tasks.filter(task => task.status === 'available').length;
  const completedTasks = submissions.length;
  const successRate = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

  // Enhanced task availability logic - unlock next 2 days based on completed tasks
  const getAvailableTasks = () => {
    const completedDays = new Set(
      submissions
        .filter(sub => sub.status === 'completed')
        .map(sub => {
          const task = tasks.find(t => t.id === sub.taskId);
          return task ? task.day : -1;
        })
        .filter(day => day >= 0)
    );

    const highestCompletedDay = completedDays.size > 0 ? Math.max(...Array.from(completedDays)) : -1;
    const daysSinceRegistration = getDaysSinceRegistration();
    
    return tasks.map(task => {
      if (task.status === 'completed') return task;
      
      // Special handling for Day 0 (orientation)
      if (task.day === 0) {
        return {
          ...task,
          status: localStorage.getItem('orientationCompleted') === 'true' ? 'completed' : 'available'
        };
      }
      
      // Progressive unlocking: unlock up to 2 days ahead of highest completed
      const maxAvailableDay = Math.max(daysSinceRegistration, highestCompletedDay + 2);
      const isAvailable = task.day <= maxAvailableDay && !isTaskPastDeadline(task.day);
      
      return {
        ...task,
        status: isAvailable ? 'available' : 'locked'
      };
    });
  };

  // Restore orientation completion from localStorage and update task statuses
  useEffect(() => {
    // Only run this effect after tasks have been loaded
    if (tasks.length === 0) return;
    const orientationCompleted = localStorage.getItem('orientationCompleted');
    const orientationCompletedAt = localStorage.getItem('orientationCompletedAt');

    if (orientationCompleted === 'true' && orientationCompletedAt) {
      // Add orientation submission if it doesn't already exist
      setSubmissions(prevSubmissions => {
        const orientationExists = prevSubmissions.some(sub => sub.taskId === '0');
        if (!orientationExists) {
          const orientationSubmission: Submission = {
            id: 'orientation-' + Date.now(),
            taskId: '0',
            taskTitle: 'Complete Orientation',
            submissionText: 'Orientation video watched and completed',
            submittedAt: orientationCompletedAt,
            status: 'completed',
            points: 100
          };
          return [...prevSubmissions, orientationSubmission];
        }
        return prevSubmissions;
      });

      // Update orientation task status
      setTasks(prevTasks =>
        prevTasks.map(task =>
          task.day === 0 && task.title === 'Complete Orientation'
            ? { ...task, status: 'completed' as Task['status'] }
            : task
        )
      );
    }

    // Update all task statuses based on current time and deadlines
    setTasks(prevTasks =>
      prevTasks.map(task => {
        if (task.day === 0) return task; // Skip orientation task

        const daysSinceRegistration = getDaysSinceRegistration();
        const isPastDeadline = isTaskPastDeadline(task.day);

        // Don't change completed tasks
        if (task.status === 'completed') return task;

        // Apply deadline constraints
        let isAvailable = false;
        if (task.day <= 2) {
          // Day 1-2 tasks: Available from day 1, expire on day 3
          isAvailable = daysSinceRegistration >= 1 && !isPastDeadline;
        } else {
          // Day 3+ tasks: Available on their respective day, expire 2 days later
          isAvailable = daysSinceRegistration >= task.day && !isPastDeadline;
        }

        return {
          ...task,
          status: isAvailable ? 'available' : 'locked',
          deadline: isPastDeadline ? 'Deadline Reached' : `Day ${task.day}`
        };
      })
    );
  }, [tasks.length]); // Run when tasks are loaded

  // Periodic check to update task statuses (every minute)
  useEffect(() => {
    const interval = setInterval(() => {
      setTasks(prevTasks =>
        prevTasks.map(task => {
          if (task.day === 0 || task.status === 'completed') return task;

          const daysSinceRegistration = getDaysSinceRegistration();
          const isPastDeadline = isTaskPastDeadline(task.day);

          let isAvailable = false;
          if (task.day <= 2) {
            isAvailable = daysSinceRegistration >= task.day && !isPastDeadline;
          } else {
            isAvailable = daysSinceRegistration >= task.day && !isPastDeadline;
          }

          return {
            ...task,
            status: isAvailable ? 'available' : 'locked',
            deadline: isPastDeadline ? 'Deadline Reached' : `Day ${task.day}`
          };
        })
      );
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  // Data fetching
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.log('No token found, using sample tasks');
          setTasks(sampleTasks);
          setSubmissions(sampleSubmissions);
          setLoading(false);
          return;
        }

        // Fetch tasks - Remove Content-Type header for GET requests
        const tasksResponse = await fetch(`${BACKEND_URL}/api/tasks`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        // Fetch submissions - Remove Content-Type header for GET requests
        const submissionsResponse = await fetch(`${BACKEND_URL}/api/my-submissions`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (tasksResponse.ok && submissionsResponse.ok) {
          const tasksData = await tasksResponse.json();
          const submissionsData = await submissionsResponse.json();

          console.log(`✓ Successfully fetched ${tasksData.length} tasks from database`);
          console.log('Tasks:', tasksData.map((t: any) => `${t.title} (Day ${t.day})`));

          // Create a map of completed task IDs for quick lookup
          const completedTaskIds = new Set(submissionsData.map((sub: any) => sub.task_id));

          // Sort tasks by day to ensure proper order
          const sortedTasks = tasksData.sort((a: any, b: any) => a.day - b.day);

          // Get days since registration for deadline calculations
          const daysSinceRegistration = getDaysSinceRegistration();
          console.log(`Days since registration: ${daysSinceRegistration}`);

          // Transform backend data to match frontend interface with deadline constraints
          const transformedTasks = sortedTasks.map((task: any, index: number) => {
            let status: 'available' | 'completed' | 'locked' = 'locked';

            // Check if task is completed
            if (completedTaskIds.has(task.id)) {
              status = 'completed';
            } else {
              // Apply deadline constraints
              const taskDay = task.day;
              const isPastDeadline = isTaskPastDeadline(taskDay);

              // Task availability logic based on registration date
              let isAvailable = false;
              if (taskDay <= 2) {
                // Day 1-2 tasks: Available from their respective day, expire 2 days later
                isAvailable = daysSinceRegistration >= taskDay && !isPastDeadline;
              } else {
                // Day 3+ tasks: Available on their respective day, expire 2 days later
                isAvailable = daysSinceRegistration >= taskDay && !isPastDeadline;
              }

              status = isAvailable ? 'available' : 'locked';
            }

            // Special handling for orientation task (Day 0)
            if (task.day === 0 && localStorage.getItem('orientationCompleted') === 'true') {
              status = 'completed';
            }

            const transformedTask = {
              id: task.id,
              title: task.title,
              description: task.description,
              points: task.points_reward,
              deadline: isTaskPastDeadline(task.day) && status !== 'completed' ? 'Deadline Reached' : `Day ${task.day}`,
              status,
              day: task.day
            };

            // Debug task status
            if (task.day === 9) {
              console.log(`Day 9 task "${task.title}" status: ${status} (daysSinceRegistration: ${daysSinceRegistration}, taskDay: ${task.day})`);
            }

            return transformedTask;
          });

          const transformedSubmissions = submissionsData.map((sub: any) => ({
            id: sub.id,
            taskId: sub.task_id,
            taskTitle: sub.task_title || 'Task',
            submissionText: sub.status_text,
            imageUrl: sub.proof_image ? `data:image/jpeg;base64,${sub.proof_image}` : undefined,
            proofFiles: sub.proof_files || [],
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
          console.error('Tasks response status:', tasksResponse.status);
          console.error('Submissions response status:', submissionsResponse.status);

          if (tasksResponse.status === 401 || submissionsResponse.status === 401) {
            console.error('Authentication failed - token may be invalid or expired');
            // Clear invalid token
            localStorage.removeItem('token');
            // Redirect to login or refresh page
            window.location.reload();
            return;
          }

          setTasks(sampleTasks);
          setSubmissions(sampleSubmissions);
        }
      } catch (error) {
        console.error('Error fetching tasks:', error);
        console.error('Using sample tasks due to error');
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
      // Special handling for orientation task
      if (task.day === 0 && task.title === 'Complete Orientation') {
        setShowVideoModal(true);
        return;
      }

      setSelectedTask(task);
      setViewMode('details'); // Switch to details view immediately
      setViewingTask(task); // Set the viewing task to show submission form
    }
  };

  const handleCompleteOrientation = async () => {
    try {
      // Close the modal first
      setShowVideoModal(false);

      // Store completion in localStorage for persistence
      localStorage.setItem('orientationCompleted', 'true');
      localStorage.setItem('orientationCompletedAt', new Date().toISOString());

      // Update the task status to completed
      setTasks(prevTasks =>
        prevTasks.map(task =>
          task.day === 0 && task.title === 'Complete Orientation'
            ? { ...task, status: 'completed' as Task['status'] }
            : task
        )
      );

      // Add to submissions
      const newSubmission: Submission = {
        id: Date.now().toString(),
        taskId: '0',
        taskTitle: 'Complete Orientation',
        submissionText: 'Orientation video watched and completed',
        submittedAt: new Date().toISOString(),
        // completedAt: new Date().toISOString(),
        status: 'completed',
        points: 100
      };

      setSubmissions(prevSubmissions => [...prevSubmissions, newSubmission]);

      // Optional: Make API call to save completion
      // await fetch(`${BACKEND_URL}/api/tasks/0/complete`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ submissionText: 'Orientation completed' })
      // });

    } catch (error) {
      console.error('Error completing orientation:', error);
    }
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

    // Client-side validation
    const maxFiles = 5;
    const maxSizePerFile = 8 * 1024 * 1024; // 8MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];

    if (submissionFiles.length > maxFiles) {
      alert(`Maximum ${maxFiles} files allowed.`);
      return;
    }

    for (const file of submissionFiles) {
      if (file.size > maxSizePerFile) {
        alert(`File "${file.name}" is too large. Maximum size is 8MB per file.`);
        return;
      }
      if (!allowedTypes.includes(file.type)) {
        alert(`File "${file.name}" has unsupported type. Only images and PDFs are allowed.`);
        return;
      }
    }

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

      const response = await fetch(`${BACKEND_URL}/api/submit-task-with-files`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        const completionTime = new Date().toISOString();
        
        // Create proof files array from submitted files
        const proofFiles: ProofFile[] = await Promise.all(
          submissionFiles.map(async (file) => {
            const base64 = await new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onload = () => {
                const result = reader.result as string;
                resolve(result.split(',')[1]); // Remove data:type;base64, prefix
              };
              reader.readAsDataURL(file);
            });

            return {
              filename: file.name,
              content_type: file.type,
              size: file.size,
              data: base64
            };
          })
        );

        const newSubmission: Submission = {
          id: Date.now().toString(),
          taskId: selectedTask.id,
          taskTitle: selectedTask.title,
          submissionText,
          imageUrl: submissionFiles.length > 0 ? URL.createObjectURL(submissionFiles[0]) : undefined,
          proofFiles: proofFiles,
          submittedAt: completionTime,
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
        setSubmissionFiles([]);
        setPeopleConnected(0);
        setViewMode('list');
        setViewingTask(null);

        // Handle different possible response field names
        const filesCount = result.saved_files?.length || result.files_uploaded || submissionFiles.length;
        const filesText = filesCount > 1 ? ` with ${filesCount} files` : ' with 1 file';
        alert(`Task submitted successfully${filesText}! You earned ${result.points_earned || selectedTask.points} points.`);
      } else {
        // Handle non-JSON error responses gracefully
        let errorMessage = 'Please try again.';
        try {
          const errorData = await response.json();
          errorMessage = errorData.detail || errorMessage;
        } catch {
          // If response is not JSON, use status text
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

  const handleViewTask = (task: Task) => {
    setViewingTask(task);
    setViewMode('details');
  };

  const handleBackToList = () => {
    setViewMode('list');
    setViewingTask(null);
    setSelectedTask(null);
    setSubmissionText('');
    setSubmissionFiles([]);
    setPeopleConnected(0);
  };

  const handleViewProofFiles = (proofFiles: ProofFile[]) => {
    setSelectedProofFiles(proofFiles);
    setCurrentImageIndex(0);
    setShowProofModal(true);
  };

  const getFileIcon = (contentType: string) => {
    if (contentType.startsWith('image/')) {
      return <ImageIcon className="h-6 w-6 text-blue-400" />;
    } else if (contentType === 'application/pdf') {
      return <FileText className="h-6 w-6 text-red-400" />;
    } else {
      return <FileText className="h-6 w-6 text-gray-400" />;
    }
  };

  const downloadFile = (file: ProofFile) => {
    const link = document.createElement('a');
    link.href = `data:${file.content_type};base64,${file.data}`;
    link.download = file.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
        // return <Clock className="h-4 w-4 text-gray-400" />;
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
                    .filter(task => task.status === 'available' || task.status === 'completed')
                    .map((task) => (
                    <Card
                      key={task.id}
                      className={`transition-all duration-200 hover:shadow-lg cursor-pointer ${
                        task.status === 'completed'
                          ? 'bg-green-900 border-green-600 hover:border-green-500'
                          : 'bg-gray-800 border-gray-700 hover:border-blue-500'
                      } ${
                        selectedTask?.id === task.id ? 'ring-2 ring-blue-500 border-blue-500' : ''
                      }`}
                      onClick={() => {
                        if (task.status === 'available') {
                          handleTaskSelect(task);
                        } else if (task.status === 'completed') {
                          // For completed tasks, just show them as selected for visual feedback
                          setSelectedTask(task);
                        }
                      }}
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
                                task.deadline === 'Deadline Reached' ? 'bg-red-800 text-red-200' :
                                'bg-blue-900 text-blue-300'
                              }`}>
                                {task.status === 'completed' ? 'Completed' :
                                 task.deadline === 'Deadline Reached' ? 'Deadline Reached' :
                                 'Available'}
                              </span>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                task.deadline === 'Deadline Reached' ? 'bg-red-900 text-red-300' :
                                task.status === 'completed' ? 'bg-green-800 text-green-200' :
                                'bg-gray-800 text-gray-300'
                              }`}>
                                {task.deadline}
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
                              {/* <Clock className="h-4 w-4" /> */}
                              {/* <span>{task.estimatedTime}</span> */}
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
                      🔒 Upcoming Tasks & Expired Tasks
                    </h3>
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                      {tasks
                        .filter(task => task.status === 'locked')
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
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    task.deadline === 'Deadline Reached' ? 'bg-red-800 text-red-300' : 'bg-gray-800 text-gray-400'
                                  }`}>
                                    {task.deadline === 'Deadline Reached' ? 'Expired' : 'Locked'}
                                  </span>
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    task.deadline === 'Deadline Reached' ? 'bg-red-900 text-red-400' : 'bg-gray-800 text-gray-400'
                                  }`}>
                                    {task.deadline}
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
                                  {/* <Clock className="h-4 w-4" /> */}
                                  {/* <span>{task.estimatedTime}</span> */}
                                </div>

                              </div>
                              <span className={`text-sm ${
                                task.deadline === 'Deadline Reached' ? 'text-red-400' : 'text-gray-500'
                              }`}>
                                {task.deadline === 'Deadline Reached' ? 'Deadline has passed' : 'Complete previous tasks to unlock'}
                              </span>
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
                              {/* {viewingTask.category} */}
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
                                Upload Files (Required) * <span className="text-xs text-gray-400">(Max 5 files, 8MB each)</span>
                              </label>
                              <div className="border-2 border-dashed border-gray-500 rounded-lg p-4 text-center">
                                <input
                                  type="file"
                                  accept="image/*,.pdf"
                                  multiple
                                  onChange={handleFileUpload}
                                  className="hidden"
                                  id="file-upload-details"
                                />
                                <label htmlFor="file-upload-details" className="cursor-pointer">
                                  <ImageIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                                  <p className="text-gray-400 text-sm">
                                    Click to upload files (Images & PDFs)
                                  </p>
                                  <p className="text-gray-500 text-xs mt-1">
                                    Max 5 files, 8MB each
                                  </p>
                                </label>
                              </div>

                              {/* Display uploaded files */}
                              {submissionFiles.length > 0 && (
                                <div className="mt-3 space-y-2">
                                  <p className="text-sm text-gray-300">
                                    Uploaded files ({submissionFiles.length}/5):
                                  </p>
                                  {submissionFiles.map((file, index) => (
                                    <div key={index} className="flex items-center justify-between bg-gray-600 rounded p-2">
                                      <div className="flex items-center space-x-2">
                                        <span className="text-sm text-gray-300">{file.name}</span>
                                        <span className="text-xs text-gray-400">
                                          ({(file.size / 1024 / 1024).toFixed(1)} MB)
                                        </span>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => removeFile(index)}
                                        className="text-red-400 hover:text-red-300 text-sm"
                                      >
                                        Remove
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
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
                                disabled={!submissionText.trim() || submissionFiles.length === 0 || submitting}
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
              {/* Show submissions */}
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
                          {/* Commented out completed date section
                          <div className="text-sm text-gray-400 mb-1 mt-2">Completed</div>
                          <div className="text-green-400 font-medium">
                            {new Date(submission.completedAt).toLocaleDateString()}
                          </div>
                          <div className="text-gray-400 text-sm">
                            {new Date(submission.completedAt).toLocaleTimeString()}
                          </div>
                          */}
                        </div>
                      </div>

                      <div className="bg-gray-700 rounded-lg p-4 mb-4">
                        <h4 className="text-white font-medium mb-2">Submission Details</h4>
                        <p className="text-gray-300 text-sm leading-relaxed">{submission.submissionText}</p>
                      </div>

                      {(submission.proofFiles && submission.proofFiles.length > 0) || submission.imageUrl ? (
                        <div className="bg-gray-700 rounded-lg p-4">
                          <h4 className="text-white font-medium mb-2">Proof Files</h4>
                          <div
                            className="inline-flex items-center space-x-2 cursor-pointer hover:bg-gray-600 p-2 rounded-lg transition-colors"
                            onClick={() => {
                              if (submission.proofFiles && submission.proofFiles.length > 0) {
                                handleViewProofFiles(submission.proofFiles);
                              } else if (submission.imageUrl) {
                                // Fallback for old single image format
                                setSelectedImageUrl(submission.imageUrl);
                                setShowImageModal(true);
                              }
                            }}
                          >
                            <Eye className="h-6 w-6 text-blue-400" />
                            <span className="text-blue-400 text-sm hover:text-blue-300">
                              {submission.proofFiles && submission.proofFiles.length > 0
                                ? `View proof files (${submission.proofFiles.length})`
                                : 'Click to view proof image'
                              }
                            </span>
                          </div>
                        </div>
                      ) : null}
                    </CardContent>
                  </Card>
                ))
              ) : null}

              {/* Show "No completed tasks" message only if submissions are empty */}
              {submissions.length === 0 && (
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

        {/* Orientation Video Modal */}
        <div className={`${showVideoModal ? 'fixed' : 'hidden'} inset-0 z-50 flex items-center justify-center`}
             role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/70" onClick={() => setShowVideoModal(false)}></div>
          <div className="relative w-full max-w-3xl mx-4 bg-gray-900 rounded-lg border border-gray-700 shadow-xl">
            <div className="flex items-center justify-between p-4 border-b border-gray-800">
              <h3 className="text-lg font-semibold text-white">Orientation Video</h3>
              <button
                onClick={() => setShowVideoModal(false)}
                className="text-gray-400 hover:text-white"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <div className="p-4">
              <div className="w-full rounded-lg overflow-hidden bg-black">
                <video controls className="w-full h-64 md:h-96">
                  <source src="https://www.w3schools.com/html/mov_bbb.mp4" type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>
              <p className="text-gray-300 text-sm mt-3">
                Watch this brief orientation to get started. After completing, you will understand our mission and how to be an effective ambassador.
              </p>
              <div className="mt-4 flex justify-end gap-2">
                <Button
                  onClick={() => setShowVideoModal(false)}
                  variant="outline"
                  className="border-gray-700 text-gray-300 hover:bg-gray-800"
                >
                  Close
                </Button>
                <Button
                  onClick={() => {
                    handleCompleteOrientation();
                  }}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Mark as Watched
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Image Modal */}
        {showImageModal && selectedImageUrl && (
          <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true">
            <div className="absolute inset-0 bg-black/80" onClick={() => setShowImageModal(false)}></div>
            <div className="relative max-w-4xl max-h-[90vh] mx-4 bg-gray-900 rounded-lg border border-gray-700 shadow-xl overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-gray-800">
                <h3 className="text-lg font-semibold text-white">Proof Image</h3>
                <button
                  onClick={() => setShowImageModal(false)}
                  className="text-gray-400 hover:text-white text-xl"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>
              <div className="p-4">
                <img
                  src={selectedImageUrl}
                  alt="Submission proof"
                  className="max-w-full max-h-[70vh] object-contain mx-auto rounded-lg"
                />
              </div>
            </div>
          </div>
        )}

        {/* Proof Files Modal */}
        {showProofModal && selectedProofFiles.length > 0 && (
          <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true">
            <div className="absolute inset-0 bg-black/80" onClick={() => setShowProofModal(false)}></div>
            <div className="relative w-full max-w-6xl max-h-[90vh] mx-4 bg-gray-900 rounded-lg border border-gray-700 shadow-xl overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-gray-800">
                <h3 className="text-lg font-semibold text-white">
                  Proof Files ({selectedProofFiles.length})
                </h3>
                <button
                  onClick={() => setShowProofModal(false)}
                  className="text-gray-400 hover:text-white text-xl"
                  aria-label="Close"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="p-6 max-h-[80vh] overflow-y-auto">
                {/* Images Section */}
                {(() => {
                  const images = selectedProofFiles.filter(file => file.content_type.startsWith('image/'));
                  const pdfs = selectedProofFiles.filter(file => file.content_type === 'application/pdf');

                  return (
                    <div className="space-y-6">
                      {images.length > 0 && (
                        <div>
                          <h4 className="text-white font-medium mb-4 flex items-center">
                            <ImageIcon className="h-5 w-5 mr-2 text-blue-400" />
                            Images ({images.length})
                          </h4>

                          {images.length === 1 ? (
                            // Single image - show full size
                            <div className="bg-gray-800 rounded-lg p-4">
                              <div className="flex items-center justify-between mb-3">
                                <span className="text-gray-300 text-sm">{images[0].filename}</span>
                                <button
                                  onClick={() => downloadFile(images[0])}
                                  className="text-blue-400 hover:text-blue-300 text-sm flex items-center"
                                >
                                  <Download className="h-4 w-4 mr-1" />
                                  Download
                                </button>
                              </div>
                              <img
                                src={`data:${images[0].content_type};base64,${images[0].data}`}
                                alt={images[0].filename}
                                className="max-w-full max-h-[60vh] object-contain mx-auto rounded-lg"
                              />
                            </div>
                          ) : (
                            // Multiple images - show with navigation
                            <div className="bg-gray-800 rounded-lg p-4">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center space-x-4">
                                  <button
                                    onClick={() => setCurrentImageIndex(Math.max(0, currentImageIndex - 1))}
                                    disabled={currentImageIndex === 0}
                                    className="text-blue-400 hover:text-blue-300 disabled:text-gray-500 disabled:cursor-not-allowed"
                                  >
                                    <ChevronLeft className="h-6 w-6" />
                                  </button>
                                  <span className="text-gray-300 text-sm">
                                    {currentImageIndex + 1} of {images.length}: {images[currentImageIndex].filename}
                                  </span>
                                  <button
                                    onClick={() => setCurrentImageIndex(Math.min(images.length - 1, currentImageIndex + 1))}
                                    disabled={currentImageIndex === images.length - 1}
                                    className="text-blue-400 hover:text-blue-300 disabled:text-gray-500 disabled:cursor-not-allowed"
                                  >
                                    <ChevronRight className="h-6 w-6" />
                                  </button>
                                </div>
                                <button
                                  onClick={() => downloadFile(images[currentImageIndex])}
                                  className="text-blue-400 hover:text-blue-300 text-sm flex items-center"
                                >
                                  <Download className="h-4 w-4 mr-1" />
                                  Download
                                </button>
                              </div>
                              <img
                                src={`data:${images[currentImageIndex].content_type};base64,${images[currentImageIndex].data}`}
                                alt={images[currentImageIndex].filename}
                                className="max-w-full max-h-[50vh] object-contain mx-auto rounded-lg"
                              />

                              {/* Thumbnail navigation */}
                              <div className="flex justify-center mt-4 space-x-2 overflow-x-auto pb-2">
                                {images.map((image, index) => (
                                  <button
                                    key={index}
                                    onClick={() => setCurrentImageIndex(index)}
                                    className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 ${
                                      index === currentImageIndex ? 'border-blue-400' : 'border-gray-600'
                                    }`}
                                  >
                                    <img
                                      src={`data:${image.content_type};base64,${image.data}`}
                                      alt={`Thumbnail ${index + 1}`}
                                      className="w-full h-full object-cover"
                                    />
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* PDFs Section */}
                      {pdfs.length > 0 && (
                        <div>
                          <h4 className="text-white font-medium mb-4 flex items-center">
                            <FileText className="h-5 w-5 mr-2 text-red-400" />
                            PDF Documents ({pdfs.length})
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {pdfs.map((pdf, index) => (
                              <div key={index} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                                <div className="flex items-center space-x-3 mb-3">
                                  <FileText className="h-8 w-8 text-red-400" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-white text-sm font-medium truncate">{pdf.filename}</p>
                                    <p className="text-gray-400 text-xs">
                                      {(pdf.size / 1024).toFixed(1)} KB
                                    </p>
                                  </div>
                                </div>
                                <button
                                  onClick={() => downloadFile(pdf)}
                                  className="w-full bg-red-600 hover:bg-red-700 text-white text-sm py-2 px-4 rounded-lg flex items-center justify-center transition-colors"
                                >
                                  <Download className="h-4 w-4 mr-2" />
                                  Download PDF
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Tasks;
