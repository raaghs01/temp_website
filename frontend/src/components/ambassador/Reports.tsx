import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Download, Users, Award, CheckCircle } from 'lucide-react';
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
}

interface ReportData {
  totalTasks: number;
  totalPoints: number;
  totalPeopleConnected: number;
  averageTaskTime: string;
  completionRate: number;
  submissions: TaskSubmission[];
  categoryBreakdown: { [key: string]: number };
  monthlyProgress: { month: string; tasks: number; points: number }[];
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
  // Use the new task data service
  const { stats, completions, loading: taskLoading } = useTaskData();
  const filteredData = useFilteredTaskData({});

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
          category: sub.category || 'General',
          priority: sub.priority || 'medium'
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
      completionRate: 100, // Since we only show completed tasks
      submissions,
      categoryBreakdown,
      monthlyProgress: monthlyProgress.sort((a, b) => a.month.localeCompare(b.month))
    };
  };

  useEffect(() => {
    fetchReportData();
  }, []);

  // Update report data when task data changes
  useEffect(() => {
    if (!taskLoading && stats.completedTasks > 0) {
      const enhancedReportData: ReportData = {
        totalTasks: stats.completedTasks,
        totalPoints: stats.totalPoints,
        totalPeopleConnected: stats.totalPeopleConnected,
        averageTaskTime: '2.5 hours',
        completionRate: stats.completionRate,
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
          category: comp.category,
          priority: comp.priority
        })),
        categoryBreakdown: stats.categoryBreakdown,
        monthlyProgress: stats.monthlyProgress
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
      ['Average Task Time', reportData.averageTaskTime],
      ['Completion Rate', `${reportData.completionRate}%`],
      ['', ''],
      ['Category Breakdown', ''],
      ...Object.entries(reportData.categoryBreakdown).map(([category, count]) => [category, count])
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
    const monthlyData = [
      ['Month', 'Tasks Completed', 'Points Earned'],
      ...reportData.monthlyProgress.map(month => [
        month.month,
        month.tasks,
        month.points
      ])
    ];

    const monthlySheet = XLSX.utils.aoa_to_sheet(monthlyData);
    XLSX.utils.book_append_sheet(workbook, monthlySheet, 'Monthly Progress');

    // Task Performance Analytics Sheet
    const performanceData = [
      ['Task Performance Analytics', ''],
      ['Ambassador:', userProfile?.name || 'Ambassador'],
      ['College:', userProfile?.college || 'College'],
      ['Group Leader:', userProfile?.group_leader_name || 'Not assigned'],
      ['', ''],
      ['Category Performance', ''],
      ['Category', 'Tasks Completed', 'Total Points', 'Avg Points per Task', 'Total People Connected', 'Avg People per Task'],
      ...Object.entries(reportData.categoryBreakdown).map(([category, count]) => {
        const categorySubmissions = reportData.submissions.filter(sub => (sub.category || 'General') === category);
        const totalPoints = categorySubmissions.reduce((sum, sub) => sum + sub.points, 0);
        const totalPeople = categorySubmissions.reduce((sum, sub) => sum + (sub.peopleConnected || 0), 0);
        return [
          category,
          count,
          totalPoints,
          count > 0 ? Math.round(totalPoints / count) : 0,
          totalPeople,
          count > 0 ? Math.round(totalPeople / count) : 0
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
        completionRate: reportData.completionRate,
        averageWordCount: enhancedSubmissions.reduce((sum, sub) => sum + sub.analysis.wordCount, 0) / enhancedSubmissions.length,
        tasksWithImages: enhancedSubmissions.filter(sub => sub.analysis.hasImageProof).length,
        excellentPerformances: enhancedSubmissions.filter(sub => sub.analysis.performanceRating === 'Excellent').length
      },
      categoryBreakdown: reportData.categoryBreakdown,
      monthlyProgress: reportData.monthlyProgress,
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
          <p className="text-gray-400">Generate detailed reports and insights about your ambassador activities and performance.</p>
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
                    <p className="text-gray-400 text-sm font-medium">Total Tasks</p>
                    <p className="text-2xl font-bold text-white mt-1">{reportData.totalTasks}</p>
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
                    <p className="text-gray-400 text-sm font-medium">Total Points</p>
                    <p className="text-2xl font-bold text-white mt-1">{reportData.totalPoints}</p>
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
                    <p className="text-gray-400 text-sm font-medium">People Connected</p>
                    <p className="text-2xl font-bold text-white mt-1">{reportData.totalPeopleConnected}</p>
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
                      {/* <th className="text-left py-3 px-4 text-gray-300 font-medium">Date</th> */}
                      {/* <th className="text-left py-3 px-4 text-gray-300 font-medium">Points</th> */}
                      {/* <th className="text-left py-3 px-4 text-gray-300 font-medium">People</th> */}
                      {/* <th className="text-left py-3 px-4 text-gray-300 font-medium">Priority</th> */}
                      <th className="text-left py-3 px-4 text-gray-300 font-medium">Status</th>
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
                            {/* <td className="py-3 px-4 text-gray-300">
                              {new Date(completion.completedAt).toLocaleDateString()}
                            </td> */}
                            {/* <td className="py-3 px-4">
                              <span className="text-yellow-400 font-medium">{completion.points}</span>
                            </td> */}
                            {/* <td className="py-3 px-4">
                              <div className="flex items-center space-x-1">
                                <Users className="h-3 w-3 text-purple-400" />
                                <span className="text-purple-400">{completion.peopleConnected}</span>
                              </div>
                            </td> */}
                            {/* <td className="py-3 px-4">
                              <span className={`text-xs font-medium ${getPriorityColor(completion.priority)}`}>
                                {completion.priority.toUpperCase()}
                              </span>
                            </td> */}
                            <td className="py-3 px-4">
                              <span className="px-2 py-1 bg-green-600 text-green-100 rounded-full text-xs">
                                Completed
                              </span>
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


      </div>
    </div>
  );
};

export default Reports;
