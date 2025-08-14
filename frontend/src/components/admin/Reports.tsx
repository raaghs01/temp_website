import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Download,
  FileText,
  Calendar,
  TrendingUp,
  Users,
  Award,
  BarChart3,
  PieChart,
  Filter,
  RefreshCw,
  CheckCircle,
  Eye,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import * as XLSX from 'xlsx';

const BACKEND_URL = 'http://127.0.0.1:5000';

interface Ambassador {
  id: string;
  name: string;
  email: string;
  college: string;
  group_leader_name: string;
  total_points: number;
  rank_position?: number;
  current_day: number;
  total_referrals: number;
  events_hosted: number;
  students_reached: number;
  revenue_generated: number;
  social_media_posts: number;
  engagement_rate: number;
  followers_growth: number;
  campaign_days: number;
  status: string;
  last_activity: string;
  join_date: string;
}

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
  user_id: string;
  user_name: string;
  user_college: string;
  user_group_leader: string;
}

interface ReportData {
  totalAmbassadors: number;
  totalTasks: number;
  totalPoints: number;
  totalPeopleConnected: number;
  averageTaskTime: string;
  completionRate: number;
  submissions: TaskSubmission[];
  monthlyProgress: { month: string; tasks: number; points: number }[];
  ambassadors: Ambassador[];
}

interface SystemMetrics {
  total_ambassadors: number;
  active_ambassadors: number;
  total_submissions: number;
  total_points: number;
}

const Reports: React.FC = () => {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [groupLeaders, setGroupLeaders] = useState<string[]>([]);
  const [selectedGroupLeader, setSelectedGroupLeader] = useState<string>('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [selectedUser, setSelectedUser] = useState<Ambassador | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [userSubmissions, setUserSubmissions] = useState<TaskSubmission[]>([]);

  // Sample data for demonstration
  const generateSampleData = () => {
    const sampleAmbassadors: Ambassador[] = [
      {
        id: '1',
        name: 'Ananya Sharma',
        email: 'ananya@college.edu',
        college: 'Delhi University',
        group_leader_name: 'Dr. Rajesh Kumar',
        total_points: 2850,
        rank_position: 1,
        current_day: 15,
        total_referrals: 12,
        events_hosted: 3,
        students_reached: 145,
        revenue_generated: 25000,
        social_media_posts: 28,
        engagement_rate: 92.5,
        followers_growth: 180,
        campaign_days: 15,
        status: 'active',
        last_activity: '2024-01-15',
        join_date: '2024-01-01'
      },
      {
        id: '2',
        name: 'Rahul Kumar',
        email: 'rahul@college.edu',
        college: 'Mumbai University',
        group_leader_name: 'Prof. Meera Singh',
        total_points: 2650,
        rank_position: 2,
        current_day: 14,
        total_referrals: 10,
        events_hosted: 2,
        students_reached: 128,
        revenue_generated: 22000,
        social_media_posts: 25,
        engagement_rate: 88.3,
        followers_growth: 165,
        campaign_days: 14,
        status: 'active',
        last_activity: '2024-01-14',
        join_date: '2024-01-02'
      },
      {
        id: '3',
        name: 'Priya Patel',
        email: 'priya@college.edu',
        college: 'Gujarat University',
        group_leader_name: 'Dr. Rajesh Kumar',
        total_points: 2400,
        rank_position: 3,
        current_day: 13,
        total_referrals: 8,
        events_hosted: 2,
        students_reached: 112,
        revenue_generated: 18500,
        social_media_posts: 22,
        engagement_rate: 85.7,
        followers_growth: 142,
        campaign_days: 13,
        status: 'active',
        last_activity: '2024-01-13',
        join_date: '2024-01-03'
      },
      {
        id: '4',
        name: 'Arjun Singh',
        email: 'arjun@college.edu',
        college: 'Bangalore University',
        group_leader_name: 'Prof. Meera Singh',
        total_points: 2200,
        rank_position: 4,
        current_day: 12,
        total_referrals: 7,
        events_hosted: 1,
        students_reached: 98,
        revenue_generated: 16000,
        social_media_posts: 20,
        engagement_rate: 82.1,
        followers_growth: 125,
        campaign_days: 12,
        status: 'active',
        last_activity: '2024-01-12',
        join_date: '2024-01-04'
      },
      {
        id: '5',
        name: 'Sneha Reddy',
        email: 'sneha@college.edu',
        college: 'Hyderabad University',
        group_leader_name: 'Dr. Amit Verma',
        total_points: 2000,
        rank_position: 5,
        current_day: 11,
        total_referrals: 6,
        events_hosted: 1,
        students_reached: 85,
        revenue_generated: 14500,
        social_media_posts: 18,
        engagement_rate: 79.4,
        followers_growth: 108,
        campaign_days: 11,
        status: 'active',
        last_activity: '2024-01-11',
        join_date: '2024-01-05'
      },
      {
        id: '6',
        name: 'Vikram Joshi',
        email: 'vikram@college.edu',
        college: 'Pune University',
        group_leader_name: 'Dr. Rajesh Kumar',
        total_points: 1850,
        rank_position: 6,
        current_day: 10,
        total_referrals: 5,
        events_hosted: 1,
        students_reached: 72,
        revenue_generated: 12500,
        social_media_posts: 16,
        engagement_rate: 76.8,
        followers_growth: 95,
        campaign_days: 10,
        status: 'active',
        last_activity: '2024-01-10',
        join_date: '2024-01-06'
      },
      {
        id: '7',
        name: 'Kavya Nair',
        email: 'kavya@college.edu',
        college: 'Kerala University',
        group_leader_name: 'Prof. Meera Singh',
        total_points: 1650,
        rank_position: 7,
        current_day: 9,
        total_referrals: 4,
        events_hosted: 1,
        students_reached: 58,
        revenue_generated: 10500,
        social_media_posts: 14,
        engagement_rate: 73.2,
        followers_growth: 82,
        campaign_days: 9,
        status: 'active',
        last_activity: '2024-01-09',
        join_date: '2024-01-07'
      },
      {
        id: '8',
        name: 'Rohit Gupta',
        email: 'rohit@college.edu',
        college: 'Jaipur University',
        group_leader_name: 'Dr. Amit Verma',
        total_points: 1450,
        rank_position: 8,
        current_day: 8,
        total_referrals: 3,
        events_hosted: 0,
        students_reached: 45,
        revenue_generated: 8500,
        social_media_posts: 12,
        engagement_rate: 69.5,
        followers_growth: 68,
        campaign_days: 8,
        status: 'inactive',
        last_activity: '2024-01-08',
        join_date: '2024-01-08'
      }
    ];

    const sampleGroupLeaders = ['Dr. Rajesh Kumar', 'Prof. Meera Singh', 'Dr. Amit Verma'];

    return { ambassadors: sampleAmbassadors, groupLeaders: sampleGroupLeaders };
  };

  // Fetch data from backend with fallback to sample data
  const fetchReportData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      let ambassadors: Ambassador[] = [];
      let leaders: string[] = [];

      if (token) {
        try {
          // Try to fetch from backend
          const ambassadorsResponse = await fetch(`${BACKEND_URL}/api/admin/ambassadors`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          const groupLeadersResponse = await fetch(`${BACKEND_URL}/api/admin/group-leaders`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          if (ambassadorsResponse.ok && groupLeadersResponse.ok) {
            ambassadors = await ambassadorsResponse.json();
            leaders = await groupLeadersResponse.json();
          } else {
            throw new Error('API calls failed');
          }
        } catch (apiError) {
          console.log('API calls failed, using sample data:', apiError);
          const sampleData = generateSampleData();
          ambassadors = sampleData.ambassadors;
          leaders = sampleData.groupLeaders;
        }
      } else {
        // No token, use sample data
        const sampleData = generateSampleData();
        ambassadors = sampleData.ambassadors;
        leaders = sampleData.groupLeaders;
      }

      setGroupLeaders(leaders);

      // Filter ambassadors by selected group leader
      const filteredAmbassadors = selectedGroupLeader === 'all'
        ? ambassadors
        : ambassadors.filter(amb => amb.group_leader_name === selectedGroupLeader);

      // Calculate metrics
      const totalTasks = filteredAmbassadors.reduce((sum, amb) => sum + amb.campaign_days, 0);
      const totalPoints = filteredAmbassadors.reduce((sum, amb) => sum + amb.total_points, 0);
      const totalPeopleConnected = filteredAmbassadors.reduce((sum, amb) => sum + amb.students_reached, 0);

      // Create mock submissions data based on ambassador data
      const submissions: TaskSubmission[] = [];
      filteredAmbassadors.forEach(ambassador => {
        // Create mock submissions for each ambassador based on their campaign days
        for (let day = 1; day <= ambassador.campaign_days; day++) {
          const submissionDate = new Date();
          submissionDate.setDate(submissionDate.getDate() - (ambassador.campaign_days - day));

          submissions.push({
            id: `sub_${ambassador.id}_${day}`,
            taskId: `task_${day}`,
            taskTitle: `Day ${day} Task`,
            submissionText: `Task completion for day ${day} by ${ambassador.name}`,
            submittedAt: submissionDate.toISOString(),
            completedAt: submissionDate.toISOString(),
            status: 'completed',
            points: Math.floor(ambassador.total_points / Math.max(ambassador.campaign_days, 1)),
            peopleConnected: Math.floor(ambassador.students_reached / Math.max(ambassador.campaign_days, 1)),
            category: 'General',
            priority: 'medium',
            user_id: ambassador.id,
            user_name: ambassador.name,
            user_college: ambassador.college,
            user_group_leader: ambassador.group_leader_name
          });
        }
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

      Object.entries(monthlyData).forEach(([month, data]) => {
        monthlyProgress.push({
          month,
          tasks: data.tasks,
          points: data.points
        });
      });

      const processedReportData: ReportData = {
        totalAmbassadors: filteredAmbassadors.length,
        totalTasks: totalTasks,
        totalPoints: totalPoints,
        totalPeopleConnected: totalPeopleConnected,
        averageTaskTime: '2.5 hours',
        completionRate: 100,
        submissions: submissions,
        monthlyProgress: monthlyProgress.sort((a, b) => a.month.localeCompare(b.month)),
        ambassadors: filteredAmbassadors
      };

      setReportData(processedReportData);

      // Set metrics
      setMetrics({
        total_ambassadors: ambassadors.length,
        active_ambassadors: ambassadors.filter(amb => amb.status === 'active').length,
        total_submissions: submissions.length,
        total_points: ambassadors.reduce((sum, amb) => sum + amb.total_points, 0)
      });
    } catch (error) {
      console.error('Error fetching report data:', error);
      // Use sample data as fallback
      const sampleData = generateSampleData();
      const ambassadors = sampleData.ambassadors;
      const leaders = sampleData.groupLeaders;

      setGroupLeaders(leaders);

      const filteredAmbassadors = selectedGroupLeader === 'all'
        ? ambassadors
        : ambassadors.filter(amb => amb.group_leader_name === selectedGroupLeader);

      const totalTasks = filteredAmbassadors.reduce((sum, amb) => sum + amb.campaign_days, 0);
      const totalPoints = filteredAmbassadors.reduce((sum, amb) => sum + amb.total_points, 0);
      const totalPeopleConnected = filteredAmbassadors.reduce((sum, amb) => sum + amb.students_reached, 0);

      const submissions: TaskSubmission[] = [];
      filteredAmbassadors.forEach(ambassador => {
        for (let day = 1; day <= ambassador.campaign_days; day++) {
          const submissionDate = new Date();
          submissionDate.setDate(submissionDate.getDate() - (ambassador.campaign_days - day));

          submissions.push({
            id: `sub_${ambassador.id}_${day}`,
            taskId: `task_${day}`,
            taskTitle: `Day ${day} Task`,
            submissionText: `Task completion for day ${day} by ${ambassador.name}`,
            submittedAt: submissionDate.toISOString(),
            completedAt: submissionDate.toISOString(),
            status: 'completed',
            points: Math.floor(ambassador.total_points / Math.max(ambassador.campaign_days, 1)),
            peopleConnected: Math.floor(ambassador.students_reached / Math.max(ambassador.campaign_days, 1)),
            category: 'General',
            priority: 'medium',
            user_id: ambassador.id,
            user_name: ambassador.name,
            user_college: ambassador.college,
            user_group_leader: ambassador.group_leader_name
          });
        }
      });

      const processedReportData: ReportData = {
        totalAmbassadors: filteredAmbassadors.length,
        totalTasks: totalTasks,
        totalPoints: totalPoints,
        totalPeopleConnected: totalPeopleConnected,
        averageTaskTime: '2.5 hours',
        completionRate: 100,
        submissions: submissions,
        monthlyProgress: [],
        ambassadors: filteredAmbassadors
      };

      setReportData(processedReportData);
      setMetrics({
        total_ambassadors: ambassadors.length,
        active_ambassadors: ambassadors.filter(amb => amb.status === 'active').length,
        total_submissions: submissions.length,
        total_points: ambassadors.reduce((sum, amb) => sum + amb.total_points, 0)
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, [selectedGroupLeader]);

  // Handle viewing user details
  const handleViewUserDetails = (user: Ambassador) => {
    setSelectedUser(user);

    // Get all submissions for this user
    const submissions = reportData?.submissions.filter(sub => sub.user_id === user.id) || [];
    setUserSubmissions(submissions);
    setShowUserModal(true);
  };

  // Export functions
  const exportToExcel = () => {
    if (!reportData) return;

    const workbook = XLSX.utils.book_new();

    // Summary Sheet
    const summaryData = [
      ['Admin Ambassador Report', ''],
      ['Generated on:', new Date().toLocaleDateString()],
      ['Group Leader Filter:', selectedGroupLeader === 'all' ? 'All Group Leaders' : selectedGroupLeader],
      ['Date Range:', dateRange.start && dateRange.end ? `${dateRange.start} to ${dateRange.end}` : 'All Time'],
      ['', ''],
      ['Summary Statistics', ''],
      ['Total Ambassadors', reportData.totalAmbassadors],
      ['Total Tasks Completed', reportData.totalTasks],
      ['Total Points Earned', reportData.totalPoints],
      ['Total People Connected', reportData.totalPeopleConnected],
      ['Average Task Time', reportData.averageTaskTime],
      ['Completion Rate', `${reportData.completionRate}%`],
      ['', ''],
      ['Ambassador Overview', ''],
      ['Name', 'College', 'Group Leader', 'Total Points', 'Tasks Completed', 'People Reached', 'Status'],
      ...reportData.ambassadors.map(amb => [
        amb.name,
        amb.college,
        amb.group_leader_name,
        amb.total_points,
        amb.campaign_days,
        amb.students_reached,
        amb.status
      ])
    ];

    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

    // Detailed Submissions Sheet
    const submissionsData = [
      [
        'Ambassador Name',
        'College',
        'Group Leader',
        'Task ID',
        'Task Title',
        'Priority',
        'Submission Date',
        'Submission Time',
        'Completion Date',
        'Completion Time',
        'Points Earned',
        'People Connected',
        'Submission Status',
        'Full Submission Text',
        'Week of Year',
        'Month',
        'Quarter'
      ],
      ...reportData.submissions.map(sub => {
        const submissionDate = new Date(sub.submittedAt);
        const completionDate = sub.completedAt ? new Date(sub.completedAt) : submissionDate;
        const weekOfYear = Math.ceil((submissionDate.getTime() - new Date(submissionDate.getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000));
        const quarter = Math.ceil((submissionDate.getMonth() + 1) / 3);

        return [
          sub.user_name,
          sub.user_college,
          sub.user_group_leader,
          sub.taskId,
          sub.taskTitle,
          sub.priority || 'Medium',
          submissionDate.toLocaleDateString(),
          submissionDate.toLocaleTimeString(),
          completionDate.toLocaleDateString(),
          completionDate.toLocaleTimeString(),
          sub.points,
          sub.peopleConnected || 0,
          sub.status,
          sub.submissionText,
          weekOfYear,
          submissionDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
          `Q${quarter} ${submissionDate.getFullYear()}`
        ];
      })
    ];

    const submissionsSheet = XLSX.utils.aoa_to_sheet(submissionsData);
    XLSX.utils.book_append_sheet(workbook, submissionsSheet, 'Detailed Submissions');

    // Monthly Progress Sheet
    const monthlyData = [
      ['Monthly Progress Analysis', ''],
      ['Month', 'Tasks Completed', 'Points Earned', 'Average Points per Task'],
      ...reportData.monthlyProgress.map(month => [
        month.month,
        month.tasks,
        month.points,
        month.tasks > 0 ? Math.round(month.points / month.tasks) : 0
      ])
    ];

    const monthlySheet = XLSX.utils.aoa_to_sheet(monthlyData);
    XLSX.utils.book_append_sheet(workbook, monthlySheet, 'Monthly Progress');

    // Group Leader Performance Sheet
    const groupLeaderStats: { [key: string]: { ambassadors: number; totalPoints: number; totalTasks: number; totalPeople: number } } = {};

    reportData.ambassadors.forEach(amb => {
      const leader = amb.group_leader_name || 'No Group Leader';
      if (!groupLeaderStats[leader]) {
        groupLeaderStats[leader] = { ambassadors: 0, totalPoints: 0, totalTasks: 0, totalPeople: 0 };
      }
      groupLeaderStats[leader].ambassadors += 1;
      groupLeaderStats[leader].totalPoints += amb.total_points;
      groupLeaderStats[leader].totalTasks += amb.campaign_days;
      groupLeaderStats[leader].totalPeople += amb.students_reached;
    });

    const groupLeaderData = [
      ['Group Leader Performance Analysis', ''],
      ['Group Leader', 'Ambassadors', 'Total Points', 'Total Tasks', 'Total People Reached', 'Avg Points per Ambassador', 'Avg Tasks per Ambassador'],
      ...Object.entries(groupLeaderStats).map(([leader, stats]) => [
        leader,
        stats.ambassadors,
        stats.totalPoints,
        stats.totalTasks,
        stats.totalPeople,
        stats.ambassadors > 0 ? Math.round(stats.totalPoints / stats.ambassadors) : 0,
        stats.ambassadors > 0 ? Math.round(stats.totalTasks / stats.ambassadors) : 0
      ])
    ];

    const groupLeaderSheet = XLSX.utils.aoa_to_sheet(groupLeaderData);
    XLSX.utils.book_append_sheet(workbook, groupLeaderSheet, 'Group Leader Performance');

    // Auto-size columns for all sheets
    [summarySheet, submissionsSheet, monthlySheet, groupLeaderSheet].forEach(sheet => {
      const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1');
      const columnWidths = [];
      for (let col = range.s.c; col <= range.e.c; col++) {
        let maxWidth = 10;
        for (let row = range.s.r; row <= range.e.r; row++) {
          const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
          const cell = sheet[cellAddress];
          if (cell && cell.v) {
            const cellLength = cell.v.toString().length;
            maxWidth = Math.max(maxWidth, cellLength);
          }
        }
        columnWidths.push({ wch: Math.min(maxWidth + 2, 50) });
      }
      sheet['!cols'] = columnWidths;
    });

    // Generate and download file
    const fileName = selectedGroupLeader === 'all'
      ? `Admin_Ambassador_Report_All_Groups_${new Date().toISOString().split('T')[0]}.xlsx`
      : `Admin_Ambassador_Report_${selectedGroupLeader.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;

    XLSX.writeFile(workbook, fileName);
  };

  const exportToCSV = () => {
    if (!reportData) return;

    const csvData = [
      ['Ambassador Name', 'College', 'Group Leader', 'Task ID', 'Task Title', 'Submission Date', 'Points', 'People Connected', 'Status'],
      ...reportData.submissions.map(sub => [
        sub.user_name,
        sub.user_college,
        sub.user_group_leader,
        sub.taskId,
        sub.taskTitle,
        new Date(sub.submittedAt).toLocaleDateString(),
        sub.points,
        sub.peopleConnected || 0,
        sub.status
      ])
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;

    const fileName = selectedGroupLeader === 'all'
      ? `Admin_Ambassador_Report_All_Groups_${new Date().toISOString().split('T')[0]}.csv`
      : `Admin_Ambassador_Report_${selectedGroupLeader.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;

    link.download = fileName;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const exportToJSON = () => {
    if (!reportData) return;

    const jsonData = {
      generated_on: new Date().toISOString(),
      group_leader_filter: selectedGroupLeader,
      date_range: dateRange,
      summary: {
        totalAmbassadors: reportData.totalAmbassadors,
        totalTasks: reportData.totalTasks,
        totalPoints: reportData.totalPoints,
        totalPeopleConnected: reportData.totalPeopleConnected,
        completionRate: reportData.completionRate
      },
      ambassadors: reportData.ambassadors,
      submissions: reportData.submissions,
      monthlyProgress: reportData.monthlyProgress
    };

    const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;

    const fileName = selectedGroupLeader === 'all'
      ? `Admin_Ambassador_Report_All_Groups_${new Date().toISOString().split('T')[0]}.json`
      : `Admin_Ambassador_Report_${selectedGroupLeader.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;

    link.download = fileName;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-xl text-gray-400">Loading reports...</div>
      </div>
    );
  }

  const exportOptions = [
    {
      name: 'Excel',
      description: 'Comprehensive multi-sheet report with ambassador analysis',
      color: 'bg-green-600',
      status: 'Most Detailed',
      details: '4 sheets: Summary, detailed submissions, monthly progress, group leader performance'
    },
    {
      name: 'CSV',
      description: 'Ambassador task data ready for analysis',
      color: 'bg-blue-600',
      status: 'Analysis Ready',
      details: 'Includes ambassador info, submission details, and performance metrics'
    },
    {
      name: 'JSON',
      description: 'Complete structured data with all ambassador information',
      color: 'bg-purple-600',
      status: 'Developer Friendly',
      details: 'Full ambassador and submission data in structured JSON format'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-800">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold">Ambassador Reports</h1>
        </div>

        <div className="flex items-center space-x-4">
          <Button
            onClick={fetchReportData}
            variant="outline"
            className="border-gray-600 text-gray-300"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Data
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
                  <p className="text-gray-400 text-sm font-medium">Total Ambassadors</p>
                  <p className="text-2xl font-bold text-white mt-1">{metrics?.total_ambassadors || 0}</p>
                  <p className="text-blue-400 text-xs mt-1">All ambassadors</p>
                </div>
                <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Users className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-medium">Active Ambassadors</p>
                  <p className="text-2xl font-bold text-white mt-1">{metrics?.active_ambassadors || 0}</p>
                  <p className="text-green-400 text-xs mt-1">Currently active</p>
                </div>
                <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-medium">Total Submissions</p>
                  <p className="text-2xl font-bold text-white mt-1">{metrics?.total_submissions || 0}</p>
                  <p className="text-purple-400 text-xs mt-1">Task submissions</p>
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
                  <p className="text-gray-400 text-sm font-medium">Total Points</p>
                  <p className="text-2xl font-bold text-white mt-1">{metrics?.total_points || 0}</p>
                  <p className="text-yellow-400 text-xs mt-1">Points earned</p>
                </div>
                <div className="w-12 h-12 bg-yellow-600 rounded-lg flex items-center justify-center">
                  <Award className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="bg-gray-800 border-gray-700 mb-6">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Group Leader</label>
                <select
                  value={selectedGroupLeader}
                  onChange={(e) => setSelectedGroupLeader(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Group Leaders</option>
                  {groupLeaders.map(leader => (
                    <option key={leader} value={leader}>{leader}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Start Date</label>
                <Input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">End Date</label>
                <Input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Export Options */}
        <Card className="bg-gray-800 border-gray-700 mb-8">
          <CardHeader>
            <CardTitle className="text-white flex items-center space-x-2">
              <Download className="h-6 w-6 text-blue-400" />
              <span>Export Ambassador Reports</span>
            </CardTitle>
            <CardDescription className="text-gray-400">
              Download comprehensive ambassador performance reports
              {selectedGroupLeader !== 'all' && ` for ${selectedGroupLeader}'s team`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {exportOptions.map((option) => (
                <div key={option.name} className="bg-gray-700 rounded-lg p-6 hover:bg-gray-600 transition-colors">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 ${option.color} rounded-lg flex items-center justify-center`}>
                      <FileText className="h-6 w-6 text-white" />
                    </div>
                    <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded-full">
                      {option.status}
                    </span>
                  </div>
                  <h3 className="text-white font-semibold text-lg mb-2">{option.name}</h3>
                  <p className="text-gray-300 text-sm mb-3">{option.description}</p>
                  <p className="text-gray-400 text-xs mb-4">{option.details}</p>
                  <Button
                    onClick={() => {
                      if (option.name === 'Excel') exportToExcel();
                      else if (option.name === 'CSV') exportToCSV();
                      else if (option.name === 'JSON') exportToJSON();
                    }}
                    className={`w-full ${option.color} hover:opacity-90`}
                    disabled={!reportData}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export {option.name}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Ambassador Summary */}
        {reportData && (
          <Card className="bg-gray-800 border-gray-700 mb-8">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <Users className="h-6 w-6 text-green-400" />
                <span>Ambassador Summary</span>
              </CardTitle>
              <CardDescription className="text-gray-400">
                Overview of ambassador performance
                {selectedGroupLeader !== 'all' && ` under ${selectedGroupLeader}`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div className="bg-gray-700 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-400">{reportData.totalAmbassadors}</div>
                  <p className="text-gray-400 text-sm">Ambassadors</p>
                </div>
                <div className="bg-gray-700 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-400">{reportData.totalTasks}</div>
                  <p className="text-gray-400 text-sm">Tasks Completed</p>
                </div>
                <div className="bg-gray-700 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-yellow-400">{reportData.totalPoints}</div>
                  <p className="text-gray-400 text-sm">Total Points</p>
                </div>
                <div className="bg-gray-700 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-purple-400">{reportData.totalPeopleConnected}</div>
                  <p className="text-gray-400 text-sm">People Connected</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Ambassador List with Details Button */}
        {reportData && reportData.ambassadors.length > 0 && (
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <Users className="h-6 w-6 text-blue-400" />
                <span>Ambassador Details</span>
              </CardTitle>
              <CardDescription className="text-gray-400">
                View detailed submissions for each ambassador
                {selectedGroupLeader !== 'all' && ` from ${selectedGroupLeader}'s team`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-3 px-4 text-gray-300 font-medium">Ambassador</th>
                      <th className="text-left py-3 px-4 text-gray-300 font-medium">College</th>
                      <th className="text-left py-3 px-4 text-gray-300 font-medium">Group Leader</th>
                      <th className="text-left py-3 px-4 text-gray-300 font-medium">Tasks</th>
                      <th className="text-left py-3 px-4 text-gray-300 font-medium">Points</th>
                      <th className="text-left py-3 px-4 text-gray-300 font-medium">People</th>
                      <th className="text-left py-3 px-4 text-gray-300 font-medium">Status</th>
                      <th className="text-left py-3 px-4 text-gray-300 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.ambassadors.map((ambassador) => (
                      <tr key={ambassador.id} className="border-b border-gray-800 hover:bg-gray-700">
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-sm font-bold">
                              {ambassador.name.split(' ').map(n => n[0]).join('')}
                            </div>
                            <div>
                              <p className="text-white font-medium">{ambassador.name}</p>
                              <p className="text-gray-400 text-xs">{ambassador.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-300">{ambassador.college}</td>
                        <td className="py-3 px-4">
                          <span className="bg-purple-600 text-white px-2 py-1 rounded text-xs">
                            {ambassador.group_leader_name || 'No Group Leader'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-green-400 font-bold">{ambassador.campaign_days}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-yellow-400 font-bold">{ambassador.total_points}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-purple-400 font-bold">{ambassador.students_reached}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded text-xs capitalize ${
                            ambassador.status === 'active' ? 'bg-green-600 text-white' :
                            ambassador.status === 'inactive' ? 'bg-yellow-600 text-white' :
                            'bg-red-600 text-white'
                          }`}>
                            {ambassador.status}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <Button
                            onClick={() => handleViewUserDetails(ambassador)}
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Details
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* User Submissions Modal */}
        {showUserModal && selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true">
            <div className="absolute inset-0 bg-black/70" onClick={() => setShowUserModal(false)}></div>
            <div className="relative w-full max-w-6xl mx-4 bg-gray-900 rounded-lg border border-gray-700 shadow-xl max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b border-gray-800">
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    {selectedUser.name} - Submission Details
                  </h3>
                  <p className="text-gray-400 text-sm">
                    {selectedUser.college} • {selectedUser.group_leader_name}
                  </p>
                </div>
                <button
                  onClick={() => setShowUserModal(false)}
                  className="text-gray-400 hover:text-white"
                  aria-label="Close"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                {/* User Summary */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-gray-800 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-green-400">{selectedUser.campaign_days}</div>
                    <p className="text-gray-400 text-sm">Tasks Completed</p>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-yellow-400">{selectedUser.total_points}</div>
                    <p className="text-gray-400 text-sm">Total Points</p>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-purple-400">{selectedUser.students_reached}</div>
                    <p className="text-gray-400 text-sm">People Reached</p>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-blue-400">{selectedUser.total_referrals}</div>
                    <p className="text-gray-400 text-sm">Referrals</p>
                  </div>
                </div>

                {/* Submissions Table */}
                <div className="bg-gray-800 rounded-lg">
                  <div className="p-4 border-b border-gray-700">
                    <h4 className="text-white font-semibold">All Submissions ({userSubmissions.length})</h4>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-700">
                          <th className="text-left py-3 px-4 text-gray-300 font-medium">Task</th>
                          <th className="text-left py-3 px-4 text-gray-300 font-medium">Submission Date</th>
                          <th className="text-left py-3 px-4 text-gray-300 font-medium">Content</th>
                          <th className="text-left py-3 px-4 text-gray-300 font-medium">Points</th>
                          <th className="text-left py-3 px-4 text-gray-300 font-medium">People Connected</th>
                          <th className="text-left py-3 px-4 text-gray-300 font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {userSubmissions.map((submission) => (
                          <tr key={submission.id} className="border-b border-gray-800 hover:bg-gray-700">
                            <td className="py-3 px-4">
                              <div>
                                <p className="text-white font-medium">{submission.taskTitle}</p>
                                <p className="text-gray-400 text-xs">ID: {submission.taskId}</p>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-gray-300">
                              {new Date(submission.submittedAt).toLocaleDateString()}
                            </td>
                            <td className="py-3 px-4">
                              <div className="max-w-xs">
                                <p className="text-gray-300 text-sm truncate" title={submission.submissionText}>
                                  {submission.submissionText}
                                </p>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <span className="text-yellow-400 font-bold">{submission.points}</span>
                            </td>
                            <td className="py-3 px-4">
                              <span className="text-purple-400 font-bold">{submission.peopleConnected || 0}</span>
                            </td>
                            <td className="py-3 px-4">
                              <span className="bg-green-600 text-white px-2 py-1 rounded text-xs capitalize">
                                {submission.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {userSubmissions.length === 0 && (
                      <div className="p-8 text-center text-gray-400">
                        No submissions found for this ambassador.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-gray-800 flex justify-end">
                <Button
                  onClick={() => setShowUserModal(false)}
                  variant="outline"
                  className="border-gray-700 text-gray-300 hover:bg-gray-800"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Reports;
