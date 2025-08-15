import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FileText, Download, Users, Award, CheckCircle, Filter, X, Eye } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useTaskData, useFilteredTaskData } from '../../hooks/useTaskData';

const BACKEND_URL = 'http://127.0.0.1:5000';

interface TaskSubmission {
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
  category?: string;
  priority?: string;
  files?: Array<{
    filename: string;
    url: string;
    created_at?: string;
  }>;
}

interface ReportData {
  totalTasks: number;
  totalPoints: number;
  totalPeopleConnected: number;
  averageTaskTime: string;
  // completionRate: number;
  submissions: TaskSubmission[];
  // categoryBreakdown: { [key: string]: number };
  // monthlyProgress: { month: string; tasks: number; points: number }[];
}

interface UserProfile {
  name: string;
  college: string;
  email: string;
  role: string;
  group_leader_name?: string;
}

const Reports: React.FC = () => {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [groupLeaders, setGroupLeaders] = useState<string[]>([]);
  const [selectedGroupLeader, setSelectedGroupLeader] = useState<string>('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [allSubmissions, setAllSubmissions] = useState<TaskSubmission[]>([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState<TaskSubmission[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<TaskSubmission | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Use the new task data service
  const { stats, completions, loading: taskLoading } = useTaskData();
  const filteredData = useFilteredTaskData({});

  // Fetch group leaders from backend
  const fetchGroupLeaders = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        // Add sample group leaders as fallback
        setGroupLeaders(['Nehal', 'Ansh', 'Priya', 'Rahul', 'Sneha']);
        return;
      }

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      // Try the new group-leaders endpoint first
      try {
        const response = await fetch(`${BACKEND_URL}/api/group-leaders`, { headers });
        if (response.ok) {
          const data = await response.json();
          setGroupLeaders(data.group_leaders || []);
          return;
        }
      } catch (error) {
        console.log('Group leaders endpoint not accessible, trying leaderboard...');
      }

      // Fallback to leaderboard endpoint
      try {
        const response = await fetch(`${BACKEND_URL}/api/leaderboard?limit=100`, { headers });
        if (response.ok) {
          const ambassadors = await response.json();
          const leaders = Array.from(new Set(ambassadors.map((amb: any) => amb.group_leader_name).filter(Boolean))) as string[];
          setGroupLeaders(leaders);
          return;
        }
      } catch (error) {
        console.log('Leaderboard endpoint not accessible');
      }

      // Final fallback - add sample group leaders
      setGroupLeaders(['Nehal', 'Ansh', 'Priya', 'Rahul', 'Sneha']);
    } catch (error) {
      console.error('Error fetching group leaders:', error);
      // Add sample group leaders as fallback
      setGroupLeaders(['Nehal', 'Ansh', 'Priya', 'Rahul', 'Sneha']);
    }
  };

  // Fetch all submissions for filtering
  const fetchAllSubmissions = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      // Build query parameters for admin submissions
      const params = new URLSearchParams();
      if (selectedGroupLeader !== 'all') {
        params.append('group_leader', selectedGroupLeader);
      }
      if (dateRange.start) {
        params.append('start_date', dateRange.start);
      }
      if (dateRange.end) {
        params.append('end_date', dateRange.end);
      }

      const response = await fetch(`${BACKEND_URL}/api/admin/submissions?${params}`, { headers });
      if (response.ok) {
        const submissions = await response.json();
        const formattedSubmissions = submissions.map((sub: any) => ({
          id: sub.id,
          taskId: sub.task_id,
          taskTitle: sub.task_title || 'Task',
          submissionText: sub.status_text,
          submittedAt: sub.submission_date,
          completedAt: sub.submission_date,
          status: 'completed' as const,
          points: sub.points_earned,
          peopleConnected: sub.people_connected,
          category: 'General',
          priority: 'medium'
        }));
        setAllSubmissions(formattedSubmissions);
        setFilteredSubmissions(formattedSubmissions);
      }
    } catch (error) {
      console.error('Error fetching all submissions:', error);
    }
  };

  // Fetch report data from backend
  const fetchReportData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      if (!token) {
        console.error('No token found');
        return;
      }

      // Fetch user profile
      const profileResponse = await fetch(`${BACKEND_URL}/api/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // Fetch submissions
      const response = await fetch(`${BACKEND_URL}/api/my-submissions`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok && profileResponse.ok) {
        const profileData = await profileResponse.json();
        setUserProfile({
          name: profileData.name || 'Ambassador',
          college: profileData.college || 'College',
          email: profileData.email || '',
          role: profileData.role || 'ambassador',
          group_leader_name: profileData.group_leader_name || ''
        });
        const data = await response.json();
        let submissions: TaskSubmission[] = data.map((sub: any) => ({
          id: sub.id,
          taskId: sub.task_id,
          taskTitle: sub.task_title || 'Task',
          submissionText: sub.status_text,
          imageUrl: sub.proof_image ? `data:image/jpeg;base64,${sub.proof_image}` : undefined,
          submittedAt: sub.submission_date,
          completedAt: sub.completion_date || sub.submission_date,
          status: 'completed' as const,
          points: sub.points_earned,
          peopleConnected: sub.people_connected,
          // category: sub.category || 'General',
          // priority: sub.priority || 'medium'
        }));

        // If no real submissions, add sample data for demonstration
        if (submissions.length === 0) {
          submissions = [
            {
              id: '1',
              taskId: '3',
              taskTitle: 'Student Outreach - Day 3',
              submissionText: 'Successfully connected with 15 students during the campus event. Organized a small meetup and collected valuable feedback about student preferences.',
              submittedAt: '2024-01-10T10:30:00Z',
              completedAt: '2024-01-10T14:45:00Z',
              status: 'completed',
              points: 180,
              peopleConnected: 15,
              category: 'Outreach',
              priority: 'high'
            },
            {
              id: '2',
              taskId: '1',
              taskTitle: 'Social Media Campaign - Day 0',
              submissionText: 'Created and posted 5 engaging posts across Instagram, Twitter, and LinkedIn. Achieved 200+ likes and 50+ shares with proper hashtags and brand mentions.',
              imageUrl: '/sample-post.jpg',
              submittedAt: '2024-01-08T15:45:00Z',
              completedAt: '2024-01-08T18:30:00Z',
              status: 'completed',
              points: 150,
              peopleConnected: 8,
              category: 'Social Media',
              priority: 'medium'
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
              peopleConnected: 25,
              category: 'Events',
              priority: 'high'
            }
          ];
        }

        // Process data for reports
        const processedData = processReportData(submissions);
        setReportData(processedData);
      }
    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Process submissions into report data
  const processReportData = (submissions: TaskSubmission[]): ReportData => {
    const totalTasks = submissions.length;
    const totalPoints = submissions.reduce((sum, sub) => sum + sub.points, 0);
    const totalPeopleConnected = submissions.reduce((sum, sub) => sum + (sub.peopleConnected || 0), 0);

    // Calculate category breakdown
    const categoryBreakdown: { [key: string]: number } = {};
    submissions.forEach(sub => {
      const category = sub.category || 'General';
      categoryBreakdown[category] = (categoryBreakdown[category] || 0) + 1;
    });

    // Calculate monthly progress
    const monthlyProgress: { month: string; tasks: number; points: number }[] = [];
    const monthlyData: { [key: string]: { tasks: number; points: number } } = {};

    submissions.forEach(sub => {
      const date = new Date(sub.submittedAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;


      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { tasks: 0, points: 0 };
      }
      monthlyData[monthKey].tasks += 1;
      monthlyData[monthKey].points += sub.points;
    });

    Object.entries(monthlyData).forEach(([key, data]) => {
      const [year, month] = key.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1);
      const monthName = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
      monthlyProgress.push({
        month: monthName,
        tasks: data.tasks,
        points: data.points
      });
    });

    return {
      totalTasks,
      totalPoints,
      totalPeopleConnected,
      averageTaskTime: '2.5 hours', // This could be calculated if we had start times
      // completionRate: 100, // Since we only show completed tasks
      submissions,
      // categoryBreakdown,
      // monthlyProgress: monthlyProgress.sort((a, b) => a.month.localeCompare(b.month))
    };
  };

  useEffect(() => {
    fetchReportData();
    fetchGroupLeaders();
  }, []);

  useEffect(() => {
    // Fetch filtered submissions for admin users, or apply client-side filtering for regular users
    if (userProfile?.role === 'admin') {
      fetchAllSubmissions();
    } else {
      // For regular users, apply client-side filtering to their own submissions
      if (reportData?.submissions) {
        let filtered = reportData.submissions;

        // Filter by date range if specified
        if (dateRange.start || dateRange.end) {
          filtered = filtered.filter(sub => {
            const subDate = new Date(sub.submittedAt);
            const startDate = dateRange.start ? new Date(dateRange.start) : null;
            const endDate = dateRange.end ? new Date(dateRange.end) : null;

            if (startDate && subDate < startDate) return false;
            if (endDate && subDate > endDate) return false;
            return true;
          });
        }

        setFilteredSubmissions(filtered);
      }
    }
  }, [selectedGroupLeader, dateRange, userProfile, reportData]);

  // Filter change handlers
  const handleGroupLeaderChange = (value: string) => {
    setSelectedGroupLeader(value);
  };

  const handleDateRangeChange = (field: 'start' | 'end', value: string) => {
    setDateRange(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const clearFilters = () => {
    setSelectedGroupLeader('all');
    setDateRange({ start: '', end: '' });
  };

  // View submission details
  const viewSubmissionDetails = (submission: TaskSubmission) => {
    setSelectedSubmission(submission);
    setShowDetailsModal(true);
  };

  // Update report data when task data changes
  useEffect(() => {
    if (!taskLoading && stats.completedTasks > 0) {
      const enhancedReportData: ReportData = {
        totalTasks: stats.completedTasks,
        totalPoints: stats.totalPoints,
        totalPeopleConnected: stats.totalPeopleConnected,
        averageTaskTime: '2.5 hours',
        // completionRate: stats.completionRate,
        submissions: completions.map(comp => ({
          id: comp.id,
          taskId: comp.taskId,
          taskTitle: comp.taskTitle,
          submissionText: comp.submissionText,
          imageUrl: comp.imageUrl,
          submittedAt: comp.submittedAt,
          completedAt: comp.completedAt,
          status: 'completed' as const,
          points: comp.points,
          peopleConnected: comp.peopleConnected,
          category: comp.category
        })),
        // categoryBreakdown: stats.categoryBreakdown,
        // monthlyProgress: stats.monthlyProgress
      };
      setReportData(enhancedReportData);
    }
  }, [taskLoading, stats, completions]);

  const exportOptions = [
    {
      name: 'Excel',
      description: 'Ultra-comprehensive multi-sheet report with deep submission analysis',
      color: 'bg-green-600',
      status: 'Most Detailed',
      details: '4 sheets: Summary with ambassador info, 27-column detailed submissions with text analysis, monthly progress, performance analytics'
    },
    {
      name: 'CSV',
      description: 'Enhanced task data with submission analysis and performance metrics',
      color: 'bg-blue-600',
      status: 'Analysis Ready',
      details: 'Includes ambassador info, submission text analysis, word counts, activity detection, social platform tracking, point breakdowns, and performance ratings'
    },
    {
      name: 'JSON',
      description: 'Complete structured data with advanced submission analytics',
      color: 'bg-purple-600',
      status: 'Developer Friendly',
      details: 'Full submission data with text analysis, activity detection, performance ratings, and point breakdowns in structured JSON format'
    }
  ];

  // Export functions
  const exportToExcel = () => {
    if (!reportData) return;

    const workbook = XLSX.utils.book_new();

    // Summary Sheet with ambassador information
    const summaryData = [
      ['Ambassador Activity Report', ''],
      ['Generated on:', new Date().toLocaleDateString()],
      ['', ''],
      ['Ambassador Information', ''],
      ['Name:', userProfile?.name || 'Ambassador'],
      ['College:', userProfile?.college || 'College'],
      ['Email:', userProfile?.email || ''],
      ['Group Leader:', userProfile?.group_leader_name || 'Not assigned'],
      ['', ''],
      ['Summary Statistics', ''],
      ['Total Tasks Completed', reportData.totalTasks],
      ['Total Points Earned', reportData.totalPoints],
      ['Total People Connected', reportData.totalPeopleConnected],
      // ['Average Task Time', reportData.averageTaskTime],
      // ['Completion Rate', `${reportData.completionRate}%`],
      // ['', ''],
      // ['Category Breakdown', ''],
      // ...Object.entries(reportData.categoryBreakdown).map(([category, count]) => [category, count])
    ];

    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

    // Detailed Submissions Sheet with comprehensive information
    const submissionsData = [
      // Header row with all details
      [
        'Ambassador Name',
        'College Name',
        'Group Leader',
        'Task ID',
        'Task Title',
        'Category',
        'Priority',
        'Day',
        'Submission Date',
        'Submission Time',
        'Completion Date',
        'Completion Time',
        'Points Earned',
        'People Connected',
        'Has Image Proof',
        'Image Bonus Points',
        'Base Points',
        'Connection Bonus Points',
        'Submission Status',
        'Full Submission Text',
        'Submission Word Count',
        'Key Activities Mentioned',
        'Social Media Platforms Used',
        'Time to Complete (if available)',
        'Week of Year',
        'Month',
        'Quarter',
        'Performance Rating'
      ],
      // Data rows with detailed information
      ...reportData.submissions.map(sub => {
        const submissionDate = new Date(sub.submittedAt);
        const completionDate = sub.completedAt ? new Date(sub.completedAt) : submissionDate;
        const weekOfYear = Math.ceil((submissionDate.getTime() - new Date(submissionDate.getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000));
        const quarter = Math.ceil((submissionDate.getMonth() + 1) / 3);

        // Enhanced submission analysis
        const submissionText = sub.submissionText || '';
        const wordCount = submissionText.split(/\s+/).filter(word => word.length > 0).length;

        // Extract key activities and platforms mentioned
        const keyActivities: string[] = [];
        const socialPlatforms: string[] = [];

        const activityKeywords = ['posted', 'shared', 'created', 'organized', 'connected', 'reached', 'engaged', 'promoted', 'distributed', 'presented'];
        const platformKeywords = ['instagram', 'facebook', 'twitter', 'linkedin', 'youtube', 'tiktok', 'snapchat', 'whatsapp'];

        activityKeywords.forEach(keyword => {
          if (submissionText.toLowerCase().includes(keyword)) {
            keyActivities.push(keyword);
          }
        });

        platformKeywords.forEach(platform => {
          if (submissionText.toLowerCase().includes(platform)) {
            socialPlatforms.push(platform);
          }
        });

        // Calculate point breakdown
        const peopleConnected = sub.peopleConnected || 0;
        const hasImage = sub.imageUrl ? true : false;
        const basePoints = Math.max(50, sub.points - (peopleConnected * 10) - (hasImage ? 25 : 0));
        const connectionBonus = peopleConnected * 10;
        const imageBonus = hasImage ? 25 : 0;

        // Performance rating based on multiple factors
        let performanceRating = 'Good';
        if (wordCount >= 100 && peopleConnected >= 5 && hasImage) {
          performanceRating = 'Excellent';
        } else if (wordCount >= 50 && (peopleConnected >= 3 || hasImage)) {
          performanceRating = 'Very Good';
        } else if (wordCount < 20 && peopleConnected === 0 && !hasImage) {
          performanceRating = 'Needs Improvement';
        }

        return [
          userProfile?.name || 'Ambassador',
          userProfile?.college || 'College',
          userProfile?.group_leader_name || 'Not assigned',
          sub.taskId,
          sub.taskTitle,
          sub.category || 'General',
          sub.priority || 'Medium',
          sub.taskId, // Using taskId as day reference
          submissionDate.toLocaleDateString(),
          submissionDate.toLocaleTimeString(),
          completionDate.toLocaleDateString(),
          completionDate.toLocaleTimeString(),
          sub.points,
          peopleConnected,
          hasImage ? 'Yes' : 'No',
          imageBonus,
          basePoints,
          connectionBonus,
          sub.status,
          submissionText,
          wordCount,
          keyActivities.join(', ') || 'None detected',
          socialPlatforms.join(', ') || 'None mentioned',
          sub.completedAt && sub.submittedAt ?
            `${Math.round((completionDate.getTime() - submissionDate.getTime()) / (1000 * 60))} minutes` :
            'N/A',
          weekOfYear,
          submissionDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
          `Q${quarter} ${submissionDate.getFullYear()}`,
          performanceRating
        ];
      })
    ];

    const submissionsSheet = XLSX.utils.aoa_to_sheet(submissionsData);

    // Auto-size columns for better readability
    const columnWidths = [
      { wch: 20 }, // Ambassador Name
      { wch: 25 }, // College Name
      { wch: 20 }, // Group Leader
      { wch: 10 }, // Task ID
      { wch: 30 }, // Task Title
      { wch: 15 }, // Category
      { wch: 10 }, // Priority
      { wch: 8 },  // Day
      { wch: 12 }, // Submission Date
      { wch: 12 }, // Submission Time
      { wch: 12 }, // Completion Date
      { wch: 12 }, // Completion Time
      { wch: 12 }, // Points Earned
      { wch: 15 }, // People Connected
      { wch: 12 }, // Has Image Proof
      { wch: 15 }, // Image Bonus Points
      { wch: 12 }, // Base Points
      { wch: 18 }, // Connection Bonus Points
      { wch: 12 }, // Status
      { wch: 60 }, // Full Submission Text
      { wch: 15 }, // Submission Word Count
      { wch: 25 }, // Key Activities Mentioned
      { wch: 25 }, // Social Media Platforms Used
      { wch: 20 }, // Time to Complete
      { wch: 12 }, // Week of Year
      { wch: 20 }, // Month
      { wch: 15 }, // Quarter
      { wch: 18 }  // Performance Rating
    ];
    submissionsSheet['!cols'] = columnWidths;

    XLSX.utils.book_append_sheet(workbook, submissionsSheet, 'Detailed Task Submissions');

    // Monthly Progress Sheet
    // const monthlyData = [
    //   // ['Month', 'Tasks Completed', 'Points Earned'],
    //   // ...reportData.monthlyProgress.map(month => [
    //   //   month.month,
    //   //   month.tasks,
    //   //   month.points
    //   // ])
    // ];

    // const monthlySheet = XLSX.utils.aoa_to_sheet(monthlyData);
    // XLSX.utils.book_append_sheet(workbook, monthlySheet, 'Monthly Progress');

    // Task Performance Analytics Sheet
    const performanceData = [
      ['Task Performance Analytics', ''],
      ['Ambassador:', userProfile?.name || 'Ambassador'],
      ['College:', userProfile?.college || 'College'],
      ['Group Leader:', userProfile?.group_leader_name || 'Not assigned'],
      ['', ''],
      ['Category Performance', ''],
      ['Category', 'Tasks Completed', 'Total Points', 'Avg Points per Task', 'Total People Connected', 'Avg People per Task'],
      ...Object.entries(reportData).map(([category, count]) => {
        const categorySubmissions = reportData.submissions.filter(sub => (sub.category || 'General') === category);
        const totalPoints = categorySubmissions.reduce((sum, sub) => sum + sub.points, 0);
        const totalPeople = categorySubmissions.reduce((sum, sub) => sum + (sub.peopleConnected || 0), 0);
        return [
          category,
          count,
          totalPoints,
          // count > 0 ? Math.round(totalPoints / count) : 0,
          totalPeople,
          // count > 0 ? Math.round(totalPeople / count) : 0
        ];
      }),
      ['', ''],
      ['Weekly Performance', ''],
      ['Week', 'Tasks Completed', 'Points Earned', 'People Connected'],
      ...(() => {
        const weeklyStats: { [key: string]: { tasks: number, points: number, people: number } } = {};
        reportData.submissions.forEach(sub => {
          const date = new Date(sub.submittedAt);
          const weekOfYear = Math.ceil((date.getTime() - new Date(date.getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000));
          const weekKey = `Week ${weekOfYear} ${date.getFullYear()}`;

          if (!weeklyStats[weekKey]) {
            weeklyStats[weekKey] = { tasks: 0, points: 0, people: 0 };
          }
          weeklyStats[weekKey].tasks += 1;
          weeklyStats[weekKey].points += sub.points;
          weeklyStats[weekKey].people += sub.peopleConnected || 0;
        });

        return Object.entries(weeklyStats).map(([week, stats]) => [
          week,
          stats.tasks,
          stats.points,
          stats.people
        ]);
      })(),
      ['', ''],
      ['Top Performing Tasks', ''],
      ['Task Title', 'Points Earned', 'People Connected', 'Category'],
      ...reportData.submissions
        .sort((a, b) => b.points - a.points)
        .slice(0, 10)
        .map(sub => [
          sub.taskTitle,
          sub.points,
          sub.peopleConnected || 0,
          sub.category || 'General'
        ])
    ];

    const performanceSheet = XLSX.utils.aoa_to_sheet(performanceData);

    // Auto-size columns for performance sheet
    const performanceColumnWidths = [
      { wch: 25 }, // Category/Week/Task
      { wch: 15 }, // Tasks/Points
      { wch: 15 }, // Points/People
      { wch: 18 }, // Avg Points
      { wch: 20 }, // Total People
      { wch: 18 }  // Avg People
    ];
    performanceSheet['!cols'] = performanceColumnWidths;

    XLSX.utils.book_append_sheet(workbook, performanceSheet, 'Performance Analytics');

    // Export the file with detailed naming
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const fileName = `Ambassador_Detailed_Report_${timestamp}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  const exportToCSV = () => {
    if (!reportData) return;

    const csvData = [
      [
        'Ambassador Name',
        'College Name',
        'Group Leader',
        'Task ID',
        'Task Title',
        'Category',
        'Priority',
        'Submission Date',
        'Submission Time',
        'Completion Date',
        'Points Earned',
        'People Connected',
        'Has Image Proof',
        'Image Bonus Points',
        'Base Points',
        'Connection Bonus Points',
        'Status',
        'Full Submission Text',
        'Word Count',
        'Key Activities',
        'Social Platforms',
        'Week of Year',
        'Month',
        'Quarter',
        'Performance Rating'
      ],
      ...reportData.submissions.map(sub => {
        const submissionDate = new Date(sub.submittedAt);
        const completionDate = sub.completedAt ? new Date(sub.completedAt) : submissionDate;
        const weekOfYear = Math.ceil((submissionDate.getTime() - new Date(submissionDate.getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000));
        const quarter = Math.ceil((submissionDate.getMonth() + 1) / 3);

        // Enhanced submission analysis for CSV
        const submissionText = sub.submissionText || '';
        const wordCount = submissionText.split(/\s+/).filter(word => word.length > 0).length;

        const keyActivities: string[] = [];
        const socialPlatforms: string[] = [];

        const activityKeywords = ['posted', 'shared', 'created', 'organized', 'connected', 'reached', 'engaged', 'promoted', 'distributed', 'presented'];
        const platformKeywords = ['instagram', 'facebook', 'twitter', 'linkedin', 'youtube', 'tiktok', 'snapchat', 'whatsapp'];

        activityKeywords.forEach(keyword => {
          if (submissionText.toLowerCase().includes(keyword)) {
            keyActivities.push(keyword);
          }
        });

        platformKeywords.forEach(platform => {
          if (submissionText.toLowerCase().includes(platform)) {
            socialPlatforms.push(platform);
          }
        });

        const peopleConnected = sub.peopleConnected || 0;
        const hasImage = sub.imageUrl ? true : false;
        const basePoints = Math.max(50, sub.points - (peopleConnected * 10) - (hasImage ? 25 : 0));
        const connectionBonus = peopleConnected * 10;
        const imageBonus = hasImage ? 25 : 0;

        let performanceRating = 'Good';
        if (wordCount >= 100 && peopleConnected >= 5 && hasImage) {
          performanceRating = 'Excellent';
        } else if (wordCount >= 50 && (peopleConnected >= 3 || hasImage)) {
          performanceRating = 'Very Good';
        } else if (wordCount < 20 && peopleConnected === 0 && !hasImage) {
          performanceRating = 'Needs Improvement';
        }

        return [
          userProfile?.name || 'Ambassador',
          userProfile?.college || 'College',
          userProfile?.group_leader_name || 'Not assigned',
          sub.taskId,
          sub.taskTitle,
          sub.category || 'General',
          sub.priority || 'Medium',
          submissionDate.toLocaleDateString(),
          submissionDate.toLocaleTimeString(),
          completionDate.toLocaleDateString(),
          sub.points,
          peopleConnected,
          hasImage ? 'Yes' : 'No',
          imageBonus,
          basePoints,
          connectionBonus,
          sub.status,
          `"${submissionText.replace(/"/g, '""')}"`,
          wordCount,
          keyActivities.join(', ') || 'None detected',
          socialPlatforms.join(', ') || 'None mentioned',
          weekOfYear,
          submissionDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
          `Q${quarter} ${submissionDate.getFullYear()}`,
          performanceRating
        ];
      })
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Ambassador_Detailed_Report_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const exportToJSON = () => {
    if (!reportData) return;

    // Enhanced submissions with detailed analysis
    const enhancedSubmissions = reportData.submissions.map(sub => {
      const submissionText = sub.submissionText || '';
      const wordCount = submissionText.split(/\s+/).filter(word => word.length > 0).length;

      const keyActivities: string[] = [];
      const socialPlatforms: string[] = [];

      const activityKeywords = ['posted', 'shared', 'created', 'organized', 'connected', 'reached', 'engaged', 'promoted', 'distributed', 'presented'];
      const platformKeywords = ['instagram', 'facebook', 'twitter', 'linkedin', 'youtube', 'tiktok', 'snapchat', 'whatsapp'];

      activityKeywords.forEach(keyword => {
        if (submissionText.toLowerCase().includes(keyword)) {
          keyActivities.push(keyword);
        }
      });

      platformKeywords.forEach(platform => {
        if (submissionText.toLowerCase().includes(platform)) {
          socialPlatforms.push(platform);
        }
      });

      const peopleConnected = sub.peopleConnected || 0;
      const hasImage = sub.imageUrl ? true : false;
      const basePoints = Math.max(50, sub.points - (peopleConnected * 10) - (hasImage ? 25 : 0));
      const connectionBonus = peopleConnected * 10;
      const imageBonus = hasImage ? 25 : 0;

      let performanceRating = 'Good';
      if (wordCount >= 100 && peopleConnected >= 5 && hasImage) {
        performanceRating = 'Excellent';
      } else if (wordCount >= 50 && (peopleConnected >= 3 || hasImage)) {
        performanceRating = 'Very Good';
      } else if (wordCount < 20 && peopleConnected === 0 && !hasImage) {
        performanceRating = 'Needs Improvement';
      }

      return {
        ...sub,
        analysis: {
          wordCount,
          keyActivities,
          socialPlatforms,
          pointsBreakdown: {
            basePoints,
            connectionBonus,
            imageBonus,
            totalPoints: sub.points
          },
          performanceRating,
          hasImageProof: hasImage
        }
      };
    });

    const jsonData = {
      generatedOn: new Date().toISOString(),
      ambassadorInfo: {
        name: userProfile?.name || 'Ambassador',
        college: userProfile?.college || 'College',
        email: userProfile?.email || '',
        groupLeader: userProfile?.group_leader_name || 'Not assigned'
      },
      summary: {
        totalTasks: reportData.totalTasks,
        totalPoints: reportData.totalPoints,
        totalPeopleConnected: reportData.totalPeopleConnected,
        averageTaskTime: reportData.averageTaskTime,
        // completionRate: reportData.completionRate,
        averageWordCount: enhancedSubmissions.reduce((sum, sub) => sum + sub.analysis.wordCount, 0) / enhancedSubmissions.length,
        tasksWithImages: enhancedSubmissions.filter(sub => sub.analysis.hasImageProof).length,
        excellentPerformances: enhancedSubmissions.filter(sub => sub.analysis.performanceRating === 'Excellent').length
      },
      // categoryBreakdown: reportData.categoryBreakdown,
      // monthlyProgress: reportData.monthlyProgress,
      submissions: enhancedSubmissions
    };

    const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Ambassador_Report_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const handleExport = (format: string) => {

    switch (format.toLowerCase()) {
      case 'excel':
        exportToExcel();
        break;
      case 'csv':
        exportToCSV();
        break;
      case 'json':
        exportToJSON();
        break;
      default:
        console.log(`Export format ${format} not implemented yet`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-800">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold">Reports</h1>
        </div>

        <div className="flex items-center space-x-4">
          <Button
            onClick={() => fetchReportData()}
            className="bg-blue-600 hover:bg-blue-700"
            disabled={loading}
          >
            {loading ? 'Refreshing...' : 'Refresh Data'}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Reports & Insights</h2>
          <p className="text-gray-400">
            Generate detailed reports and insights about your ambassador activities and performance.
          </p>
        </div>



        {/* Stats Overview */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="bg-gray-800 border-gray-700">
                <CardContent className="p-6">
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-700 rounded mb-2"></div>
                    <div className="h-8 bg-gray-700 rounded mb-1"></div>
                    <div className="h-3 bg-gray-700 rounded"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : reportData ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm font-medium">
                      {(selectedGroupLeader !== 'all' || dateRange.start || dateRange.end) ? 'Filtered Tasks' : 'Total Tasks'}
                    </p>
                    <p className="text-2xl font-bold text-white mt-1">
                      {(selectedGroupLeader !== 'all' || dateRange.start || dateRange.end) && filteredSubmissions.length > 0
                        ? filteredSubmissions.length
                        : reportData.totalTasks}
                    </p>
                    <p className="text-blue-400 text-xs mt-1">Completed</p>
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
                    <p className="text-gray-400 text-sm font-medium">
                      {(selectedGroupLeader !== 'all' || dateRange.start || dateRange.end) ? 'Filtered Points' : 'Total Points'}
                    </p>
                    <p className="text-2xl font-bold text-white mt-1">
                      {(selectedGroupLeader !== 'all' || dateRange.start || dateRange.end) && filteredSubmissions.length > 0
                        ? filteredSubmissions.reduce((sum, sub) => sum + sub.points, 0)
                        : reportData.totalPoints}
                    </p>
                    <p className="text-yellow-400 text-xs mt-1">Earned</p>
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
                  <div>
                    <p className="text-gray-400 text-sm font-medium">
                      {(selectedGroupLeader !== 'all' || dateRange.start || dateRange.end) ? 'Filtered People' : 'People Connected'}
                    </p>
                    <p className="text-2xl font-bold text-white mt-1">
                      {(selectedGroupLeader !== 'all' || dateRange.start || dateRange.end) && filteredSubmissions.length > 0
                        ? filteredSubmissions.reduce((sum, sub) => sum + (sub.peopleConnected || 0), 0)
                        : reportData.totalPeopleConnected}
                    </p>
                    <p className="text-green-400 text-xs mt-1">Network growth</p>
                  </div>
                  <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-400">No data available. Complete some tasks to generate reports.</p>
          </div>
        )}

        {/* Filters section commented out */}

        {/* Enhanced Task Submissions Table */}
        {filteredData.completions.length > 0 && (
          <Card className="bg-gray-800 border-gray-700 mb-8">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <CheckCircle className="h-6 w-6 text-green-400" />
                <span>Task Submissions</span>
              </CardTitle>
              <CardDescription className="text-gray-400">
                Detailed view of all your completed task submissions with enhanced analytics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-3 px-4 text-gray-300 font-medium">Day</th>
                      <th className="text-left py-3 px-4 text-gray-300 font-medium">Task</th>
                      <th className="text-left py-3 px-4 text-gray-300 font-medium">Status</th>
                      <th className="text-center py-3 px-4 text-gray-300 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.completions
                      .map(completion => {
                        return (
                          <tr key={completion.id} className="border-b border-gray-700 hover:bg-gray-750">
                            <td className="py-3 px-4">
                              <span className="bg-blue-600 text-blue-100 px-2 py-1 rounded-full text-xs font-medium">
                                Day {completion.day}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <div>
                                <p className="text-white font-medium">{completion.taskTitle}</p>
                                <p className="text-gray-400 text-xs truncate max-w-xs">
                                  {completion.submissionText || 'No description'}
                                </p>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-1 bg-green-600 text-green-100 rounded-full text-xs">
                                Completed
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <Button
                                onClick={() => viewSubmissionDetails({
                                  id: completion.id,
                                  taskId: completion.taskId,
                                  taskTitle: completion.taskTitle,
                                  submissionText: completion.submissionText,
                                  imageUrl: completion.imageUrl,
                                  submittedAt: completion.submittedAt,
                                  completedAt: completion.completedAt,
                                  status: 'completed',
                                  points: completion.points,
                                  peopleConnected: completion.peopleConnected,
                                  category: completion.category
                                })}
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-blue-400 hover:text-blue-300 hover:bg-blue-900/20"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
                {filteredData.completions.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-400">No submissions found. Complete some tasks to see data here.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filtered Submissions Table - Show when filters are applied */}
        {(selectedGroupLeader !== 'all' || dateRange.start || dateRange.end) && filteredSubmissions.length > 0 && (
          <Card className="bg-gray-800 border-gray-700 mb-6">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <CheckCircle className="h-6 w-6 text-green-400" />
                <span>All Submissions</span>
              </CardTitle>
              <CardDescription className="text-gray-400">
                Detailed view of all task submissions
                {selectedGroupLeader !== 'all' && ` from ${selectedGroupLeader}'s team`}
                {(dateRange.start || dateRange.end) && ' within selected date range'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-3 px-2 text-gray-400 font-medium">Ambassador</th>
                      <th className="text-left py-3 px-2 text-gray-400 font-medium">College</th>
                      <th className="text-left py-3 px-2 text-gray-400 font-medium">Task</th>
                      <th className="text-center py-3 px-2 text-gray-400 font-medium">Points</th>
                      <th className="text-center py-3 px-2 text-gray-400 font-medium">People Connected</th>
                      <th className="text-left py-3 px-2 text-gray-400 font-medium">Submission Date</th>
                      <th className="text-center py-3 px-2 text-gray-400 font-medium">Status</th>
                      <th className="text-center py-3 px-2 text-gray-400 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSubmissions.slice(0, 20).map((submission) => (
                      <tr key={submission.id} className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors">
                        <td className="py-3 px-2">
                          <div className="font-medium text-white">{submission.submissionText.split(' ')[0] || 'Ambassador'}</div>
                        </td>
                        <td className="py-3 px-2 text-gray-300">College</td>
                        <td className="py-3 px-2">
                          <div className="font-medium text-white">{submission.taskTitle}</div>
                          <div className="text-xs text-gray-400">ID: {submission.taskId.slice(0, 8)}...</div>
                        </td>
                        <td className="py-3 px-2 text-center">
                          <span className="text-yellow-400 font-bold">{submission.points}</span>
                        </td>
                        <td className="py-3 px-2 text-center">
                          <span className="text-purple-400 font-medium">{submission.peopleConnected || 0}</span>
                        </td>
                        <td className="py-3 px-2 text-gray-300">
                          {new Date(submission.submittedAt).toLocaleDateString()}
                          <div className="text-xs text-gray-400">
                            {new Date(submission.submittedAt).toLocaleTimeString()}
                          </div>
                        </td>
                        <td className="py-3 px-2 text-center">
                          <span className="bg-green-600 text-white px-2 py-1 rounded text-xs font-medium">
                            {submission.status}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-center">
                          <Button
                            onClick={() => viewSubmissionDetails(submission)}
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-blue-400 hover:text-blue-300 hover:bg-blue-900/20"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredSubmissions.length > 20 && (
                  <div className="mt-4 text-center text-gray-400">
                    Showing first 20 of {filteredSubmissions.length} submissions. Use export for complete data.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Detailed Export Information */}
        {reportData && (
          <Card className="bg-gray-800 border-gray-700 mb-6">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <FileText className="h-6 w-6 text-blue-400" />
                <span>Detailed Export Information</span>
              </CardTitle>
              <CardDescription className="text-gray-400">
                Your reports now include advanced submission analysis with text insights and performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-white font-medium mb-3">📊 Enhanced Excel Report Includes:</h4>
                  <ul className="text-gray-300 text-sm space-y-2">
                    <li>• <strong>Summary Sheet:</strong> Ambassador info, key statistics and category breakdown</li>
                    <li>• <strong>Detailed Submissions:</strong> 27 columns with advanced text analysis</li>
                    <li>• <strong>Monthly Progress:</strong> Timeline of your ambassador journey</li>
                    <li>• <strong>Performance Analytics:</strong> Category performance, weekly stats, top tasks</li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-white font-medium mb-3">🔍 Advanced Submission Analysis:</h4>
                  <ul className="text-gray-300 text-sm space-y-2">
                    <li>• <strong>Text Analysis:</strong> Word count and key activity detection</li>
                    <li>• <strong>Social Platform Tracking:</strong> Automatic detection of platforms used</li>
                    <li>• <strong>Point Breakdown:</strong> Base points, connection bonus, image bonus</li>
                    <li>• <strong>Performance Rating:</strong> Excellent, Very Good, Good, Needs Improvement</li>
                    <li>• <strong>Activity Keywords:</strong> Posted, shared, created, organized, etc.</li>
                    <li>• <strong>Platform Detection:</strong> Instagram, LinkedIn, Twitter, Facebook, etc.</li>
                    <li>• <strong>Complete Submission Text:</strong> Full detailed descriptions</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Export Options */}
        {reportData && (
          <Card className="bg-gray-800 border-gray-700 mb-8">
            <CardHeader>
              <CardTitle className="text-white flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Download className="h-6 w-6 text-green-400" />
                  <span>Export Report</span>
                </div>
                <div className="text-sm text-gray-400">
                  {reportData.submissions.length} submissions ready for export
                </div>
              </CardTitle>
              <CardDescription className="text-gray-400">
                Download your ambassador activity report in various formats
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {exportOptions.map((option) => (
                  <Card key={option.name} className="bg-gray-700 border-gray-600 hover:border-gray-500 transition-colors cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className={`w-10 h-10 ${option.color} rounded-lg flex items-center justify-center`}>
                          <Download className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h4 className="text-white font-medium">{option.name}</h4>
                          <p className="text-gray-400 text-sm">{option.description}</p>
                        </div>
                      </div>
                      <div className="mb-3">
                        <p className="text-xs text-gray-500">{option.details}</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-green-400 font-medium">{option.status}</span>
                        <Button
                          onClick={() => handleExport(option.name)}
                          size="sm"
                          className={`${option.color} hover:opacity-90 text-white`}
                          disabled={!reportData || reportData.submissions.length === 0}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Export
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {reportData.submissions.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-400">No data available for export. Complete some tasks first!</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Submission Details Modal */}
        {showDetailsModal && selectedSubmission && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                {/* Modal Header */}
                <div className="flex items-center justify-between mb-6 border-b border-gray-700 pb-4">
                  <h3 className="text-2xl font-bold text-white">Task Submission Details</h3>
                  <Button
                    onClick={() => setShowDetailsModal(false)}
                    variant="ghost"
                    size="sm"
                    className="text-gray-400 hover:text-white"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>

                {/* Task Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-lg font-semibold text-white mb-2">Task Information</h4>
                      <div className="bg-gray-700 rounded-lg p-4 space-y-3">
                        <div>
                          <span className="text-gray-400 text-sm">Task Title:</span>
                          <p className="text-white font-medium">{selectedSubmission.taskTitle}</p>
                        </div>
                        <div>
                          <span className="text-gray-400 text-sm">Task ID:</span>
                          <p className="text-white font-mono text-sm">{selectedSubmission.taskId}</p>
                        </div>
                        <div>
                          <span className="text-gray-400 text-sm">Category:</span>
                          <p className="text-white">{selectedSubmission.category || 'General'}</p>
                        </div>
                        <div>
                          <span className="text-gray-400 text-sm">Priority:</span>
                          <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                            selectedSubmission.priority === 'high' ? 'bg-red-600 text-red-100' :
                            selectedSubmission.priority === 'medium' ? 'bg-yellow-600 text-yellow-100' :
                            'bg-green-600 text-green-100'
                          }`}>
                            {selectedSubmission.priority?.toUpperCase() || 'NORMAL'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="text-lg font-semibold text-white mb-2">Submission Metrics</h4>
                      <div className="bg-gray-700 rounded-lg p-4 space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Points Earned:</span>
                          <span className="text-yellow-400 font-bold text-lg">{selectedSubmission.points}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">People Connected:</span>
                          <span className="text-purple-400 font-medium">{selectedSubmission.peopleConnected || 0}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Status:</span>
                          <span className="bg-green-600 text-green-100 px-2 py-1 rounded-full text-xs font-medium">
                            {selectedSubmission.status}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-400 text-sm">Submitted:</span>
                          <p className="text-white">
                            {new Date(selectedSubmission.submittedAt).toLocaleString()}
                          </p>
                        </div>
                        {selectedSubmission.completedAt && (
                          <div>
                            <span className="text-gray-400 text-sm">Completed:</span>
                            <p className="text-white">
                              {new Date(selectedSubmission.completedAt).toLocaleString()}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Submission Text */}
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-white mb-3">Submission Description</h4>
                  <div className="bg-gray-700 rounded-lg p-4">
                    <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                      {selectedSubmission.submissionText || 'No description provided.'}
                    </p>
                    <div className="mt-3 pt-3 border-t border-gray-600">
                      <span className="text-gray-400 text-sm">
                        Word count: {selectedSubmission.submissionText?.split(/\s+/).filter(word => word.length > 0).length || 0} words
                      </span>
                    </div>
                  </div>
                </div>

                {/* Images and Files */}
                {(selectedSubmission.imageUrl || (selectedSubmission.files && selectedSubmission.files.length > 0)) && (
                  <div className="mb-6">
                    <h4 className="text-lg font-semibold text-white mb-3">Uploaded Files</h4>
                    <div className="bg-gray-700 rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {/* Show files from Supabase if available */}
                        {selectedSubmission.files && selectedSubmission.files.length > 0 ? (
                          selectedSubmission.files.map((file, index) => {
                            const isImage = file.filename.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/);
                            const isPDF = file.filename.toLowerCase().endsWith('.pdf');
                            
                            return (
                              <div key={index} className="relative group">
                                {isImage ? (
                                  <img
                                    src={file.url}
                                    alt={file.filename}
                                    className="w-full h-40 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                                    onClick={() => window.open(file.url, '_blank')}
                                  />
                                ) : (
                                  <div 
                                    className="w-full h-40 bg-gray-600 rounded-lg cursor-pointer hover:bg-gray-500 transition-colors flex flex-col items-center justify-center"
                                    onClick={() => window.open(file.url, '_blank')}
                                  >
                                    <FileText className="h-12 w-12 text-gray-300 mb-2" />
                                    <span className="text-gray-300 text-sm text-center px-2 break-words">
                                      {file.filename}
                                    </span>
                                    {isPDF && (
                                      <span className="text-xs text-blue-400 mt-1">PDF</span>
                                    )}
                                  </div>
                                )}
                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 rounded-lg flex items-center justify-center">
                                  <Eye className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                                <div className="mt-2">
                                  <p className="text-gray-400 text-xs text-center truncate">{file.filename}</p>
                                  {file.created_at && (
                                    <p className="text-gray-500 text-xs text-center">
                                      {new Date(file.created_at).toLocaleDateString()}
                                    </p>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        ) : selectedSubmission.imageUrl ? (
                          // Fallback to old imageUrl format
                          <div className="relative group">
                            <img
                              src={selectedSubmission.imageUrl}
                              alt="Submission evidence"
                              className="w-full h-40 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                              onClick={() => window.open(selectedSubmission.imageUrl, '_blank')}
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 rounded-lg flex items-center justify-center">
                              <Eye className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          </div>
                        ) : null}
                      </div>
                      <div className="mt-4 flex justify-between items-center">
                        <p className="text-gray-400 text-sm">Click on files to view in full size</p>
                        {selectedSubmission.files && selectedSubmission.files.length > 0 && (
                          <span className="text-blue-400 text-sm font-medium">
                            {selectedSubmission.files.length} file{selectedSubmission.files.length !== 1 ? 's' : ''} uploaded
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Analysis and Keywords */}
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-white mb-3">Submission Analysis</h4>
                  <div className="bg-gray-700 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h5 className="text-white font-medium mb-2">Detected Activities:</h5>
                        <div className="flex flex-wrap gap-2">
                          {['posted', 'shared', 'created', 'organized', 'connected'].map(activity => {
                            const isDetected = selectedSubmission.submissionText?.toLowerCase().includes(activity);
                            return (
                              <span
                                key={activity}
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  isDetected 
                                    ? 'bg-green-600 text-green-100' 
                                    : 'bg-gray-600 text-gray-300'
                                }`}
                              >
                                {activity}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                      <div>
                        <h5 className="text-white font-medium mb-2">Social Platforms:</h5>
                        <div className="flex flex-wrap gap-2">
                          {['instagram', 'facebook', 'linkedin', 'twitter', 'youtube'].map(platform => {
                            const isDetected = selectedSubmission.submissionText?.toLowerCase().includes(platform);
                            return (
                              <span
                                key={platform}
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  isDetected 
                                    ? 'bg-blue-600 text-blue-100' 
                                    : 'bg-gray-600 text-gray-300'
                                }`}
                              >
                                {platform}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-700">
                  <Button
                    onClick={() => setShowDetailsModal(false)}
                    variant="outline"
                    className="border-gray-600 text-gray-300 hover:bg-gray-700"
                  >
                    Close
                  </Button>
                  {(selectedSubmission.files && selectedSubmission.files.length > 0) || selectedSubmission.imageUrl ? (
                    <Button
                      onClick={() => {
                        if (selectedSubmission.files && selectedSubmission.files.length > 0) {
                          // Open all files in new tabs
                          selectedSubmission.files.forEach(file => {
                            window.open(file.url, '_blank');
                          });
                        } else if (selectedSubmission.imageUrl) {
                          window.open(selectedSubmission.imageUrl, '_blank');
                        }
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Files {selectedSubmission.files && selectedSubmission.files.length > 1 ? `(${selectedSubmission.files.length})` : ''}
                    </Button>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Reports;
