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
  RefreshCw,
  CheckCircle,
  Eye,
  X,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import * as XLSX from 'xlsx';

const BACKEND_URL = 'http://127.0.0.1:5001';

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
  task_id: string;
  task_title: string;
  task_day: number;
  user_id: string;
  user_name: string;
  user_email: string;
  user_college: string;
  group_leader_name: string;
  status_text: string;
  people_connected: number;
  points_earned: number;
  submission_date: string;
  is_completed: boolean;
  submission_text?: string;
  image_url?: string;
  created_at?: string;
  updated_at?: string;
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
  const [submissions, setSubmissions] = useState<TaskSubmission[]>([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState<TaskSubmission[]>([]);
  const [ambassadors, setAmbassadors] = useState<Ambassador[]>([]);
  const [selectedUser, setSelectedUser] = useState<Ambassador | null>(null);
  const [selectedUserSubmissions, setSelectedUserSubmissions] = useState<TaskSubmission[]>([]);
  const [showUserSubmissionsModal, setShowUserSubmissionsModal] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  // Fetch real data from backend
  const fetchRealData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      if (!token) {
        console.error('No authentication token found');
        setMetrics({ total_ambassadors: 0, active_ambassadors: 0, total_submissions: 0, total_points: 0 });
        setAmbassadors([]);
        setGroupLeaders([]);
        setSubmissions([]);
        setFilteredSubmissions([]);
        return;
      }

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      // Fetch ambassadors
      const ambassadorsResponse = await fetch(`${BACKEND_URL}/api/admin/reports/ambassadors`, { headers });
      if (!ambassadorsResponse.ok) {
        throw new Error(`Ambassadors API failed: ${ambassadorsResponse.status}`);
      }

      const ambassadorsData = await ambassadorsResponse.json();
      console.log('Fetched ambassadors for reports:', ambassadorsData);

      // Transform ambassadors data to match our interface
      const transformedAmbassadors: Ambassador[] = ambassadorsData.map((amb: any) => ({
        id: amb.id || amb.user_id,
        name: amb.name,
        email: amb.email,
        college: amb.college,
        group_leader_name: amb.group_leader_name || 'No Group Leader',
        total_points: amb.total_points || 0,
        rank_position: amb.rank_position,
        current_day: amb.current_day || amb.campaign_days || 0,
        total_referrals: amb.total_referrals || 0,
        events_hosted: amb.events_hosted || 0,
        students_reached: amb.students_reached || 0,
        revenue_generated: amb.revenue_generated || 0,
        social_media_posts: amb.social_media_posts || 0,
        engagement_rate: amb.engagement_rate || 0,
        followers_growth: amb.followers_growth || 0,
        campaign_days: amb.campaign_days || 0,
        status: amb.status || 'active',
        last_activity: amb.last_activity || amb.join_date || 'Unknown',
        join_date: amb.join_date || 'Unknown'
      }));

      setAmbassadors(transformedAmbassadors);

      // Extract unique group leaders
      const leaders = Array.from(new Set(transformedAmbassadors.map(amb => amb.group_leader_name).filter(Boolean))) as string[];
      setGroupLeaders(leaders);

      // Fetch submissions with current filters
      await fetchSubmissions();

      console.log('Reports data fetched successfully');
    } catch (error) {
      console.error('Error fetching real data:', error);
      // Set empty data on error
      setMetrics({ total_ambassadors: 0, active_ambassadors: 0, total_submissions: 0, total_points: 0 });
      setAmbassadors([]);
      setGroupLeaders([]);
      setSubmissions([]);
      setFilteredSubmissions([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubmissions = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      // Build query parameters
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

      const submissionsResponse = await fetch(`${BACKEND_URL}/api/admin/reports/submissions?${params}`, { headers });
      if (!submissionsResponse.ok) {
        throw new Error(`Submissions API failed: ${submissionsResponse.status}`);
      }

      const submissionsData = await submissionsResponse.json();
      console.log('Fetched submissions:', submissionsData);

      // Transform submissions data to match our interface
      const transformedSubmissions: TaskSubmission[] = submissionsData.map((sub: any) => ({
        id: sub.id,
        task_id: sub.task_id,
        task_title: sub.task_title || `Day ${sub.task_day || sub.day} Task`,
        task_day: sub.task_day || sub.day || 1,
        user_id: sub.user_id,
        user_name: sub.user_name || sub.name,
        user_email: sub.user_email || sub.email,
        user_college: sub.user_college || sub.college,
        group_leader_name: sub.group_leader_name || 'No Group Leader',
        status_text: sub.status_text || sub.status || 'completed',
        people_connected: sub.people_connected || 0,
        points_earned: sub.points_earned || sub.points || 0,
        submission_date: sub.submission_date || sub.created_at || sub.submitted_at,
        is_completed: sub.is_completed !== false,
        image_url: sub.image_url || sub.proof_image || null,
        submission_text: sub.submission_text || sub.status_text
      }));

      setSubmissions(transformedSubmissions);
      setFilteredSubmissions(transformedSubmissions);

      // Filter ambassadors by selected group leader
      const filteredAmbassadors = selectedGroupLeader === 'all'
        ? ambassadors
        : ambassadors.filter(amb => amb.group_leader_name === selectedGroupLeader);

      // Update metrics based on real data
      const totalPoints = transformedSubmissions.reduce((sum, sub) => sum + sub.points_earned, 0);
      const totalPeopleConnected = transformedSubmissions.reduce((sum, sub) => sum + sub.people_connected, 0);
      const activeAmbassadors = filteredAmbassadors.filter(amb => amb.status === 'active');

      setMetrics({
        total_ambassadors: filteredAmbassadors.length,
        active_ambassadors: activeAmbassadors.length,
        total_submissions: transformedSubmissions.length,
        total_points: totalPoints
      });

      // Update report data
      const monthlyProgress = generateMonthlyProgress(transformedSubmissions);

      setReportData({
        totalAmbassadors: filteredAmbassadors.length,
        totalTasks: transformedSubmissions.length,
        totalPoints: totalPoints,
        totalPeopleConnected: totalPeopleConnected,
        averageTaskTime: '2.5 hours', // Static for now
        completionRate: filteredAmbassadors.length > 0 ? (transformedSubmissions.length / (filteredAmbassadors.length * 30)) * 100 : 0,
        submissions: transformedSubmissions,
        monthlyProgress: monthlyProgress,
        ambassadors: filteredAmbassadors
      });

      console.log('Submissions data processed successfully');
    } catch (error) {
      console.error('Error fetching submissions:', error);
      // Don't generate sample data here, let the main function handle it
    }
  };

  // Helper function to generate monthly progress from submissions
  const generateMonthlyProgress = (submissions: TaskSubmission[]) => {
    const monthlyData: { [key: string]: { tasks: number; points: number } } = {};

    submissions.forEach(sub => {
      const date = new Date(sub.submission_date);
      const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { tasks: 0, points: 0 };
      }

      monthlyData[monthKey].tasks += 1;
      monthlyData[monthKey].points += sub.points_earned;
    });

    return Object.entries(monthlyData)
      .map(([month, data]) => ({ month, ...data }))
      .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime())
      .slice(-6); // Last 6 months
  };





  useEffect(() => {
    fetchRealData();
  }, []);

  useEffect(() => {
    if (submissions.length > 0) {
      fetchSubmissions();
    }
  }, [selectedGroupLeader, dateRange]);

  // Auto-refresh functionality
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        console.log('Auto-refreshing reports data...');
        fetchRealData();
      }, 30000); // Refresh every 30 seconds
      setRefreshInterval(interval);
    } else {
      if (refreshInterval) {
        clearInterval(refreshInterval);
        setRefreshInterval(null);
      }
    }

    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [autoRefresh]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, []);







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
      // ['Average Task Time', reportData.averageTaskTime],
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
        const submissionDate = new Date(sub.submission_date);
        const weekOfYear = Math.ceil((submissionDate.getTime() - new Date(submissionDate.getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000));
        const quarter = Math.ceil((submissionDate.getMonth() + 1) / 3);

        return [
          sub.user_name,
          sub.user_college,
          sub.group_leader_name,
          sub.task_id,
          sub.task_title,
          'Medium',
          submissionDate.toLocaleDateString(),
          submissionDate.toLocaleTimeString(),
          submissionDate.toLocaleDateString(),
          submissionDate.toLocaleTimeString(),
          sub.points_earned,
          sub.people_connected || 0,
          // sub.is_completed ? 'Completed' : 'Pending',
          sub.status_text,
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
        sub.group_leader_name,
        sub.task_id,
        sub.task_title,
        new Date(sub.submission_date).toLocaleDateString(),
        sub.points_earned,
        sub.people_connected || 0,
        // sub.is_completed ? 'Completed' : 'Pending'
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
          <div className="flex items-center space-x-2 text-gray-400">
            <FileText className="h-5 w-5" />
            <span>Comprehensive Analytics</span>
          </div>
        </div>

        {/* <div className="flex items-center space-x-4">
          <Button
            onClick={exportDetailedExcelReport}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <Download className="h-4 w-4 mr-2" />
            Detailed Excel Report
          </Button>
          <Button
            onClick={downloadExcelReport}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <Download className="h-4 w-4 mr-2" />
            Standard Excel Report
          </Button>
          <Button
            onClick={fetchRealData}
            variant="outline"
            className="border-gray-600 text-gray-300"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Data
          </Button>
          <Button
            onClick={() => setAutoRefresh(!autoRefresh)}
            variant="outline"
            className={`border-gray-600 ${autoRefresh ? 'text-green-400 border-green-600' : 'text-gray-300'}`}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            Auto Refresh {autoRefresh ? 'ON' : 'OFF'}
          </Button>
        </div> */}
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
        {/* {reportData && (
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
        )} */}

        {/* Ambassador Submissions Summary Table */}
        {filteredSubmissions.length > 0 && (() => {
          // Group submissions by user
          const userSubmissionsMap = new Map<string, {
            user: any;
            submissions: TaskSubmission[];
            totalPoints: number;
            totalPeople: number;
            completedTasks: number;
            pendingTasks: number;
          }>();

          filteredSubmissions.forEach(submission => {
            const userId = submission.user_id;
            if (!userSubmissionsMap.has(userId)) {
              userSubmissionsMap.set(userId, {
                user: {
                  id: userId,
                  name: submission.user_name,
                  email: submission.user_email,
                  college: submission.user_college,
                  group_leader_name: submission.group_leader_name
                },
                submissions: [],
                totalPoints: 0,
                totalPeople: 0,
                completedTasks: 0,
                pendingTasks: 0
              });
            }

            const userData = userSubmissionsMap.get(userId)!;
            userData.submissions.push(submission);
            userData.totalPoints += submission.points_earned || 0;
            userData.totalPeople += submission.people_connected || 0;
            if (submission.is_completed) {
              userData.completedTasks++;
            } else {
              userData.pendingTasks++;
            }
          });

          const userSummaries = Array.from(userSubmissionsMap.values());

          return (
            <Card className="bg-gray-800 border-gray-700 mb-8">
              <CardHeader>
                <CardTitle className="text-white flex items-center space-x-2">
                  <Users className="h-6 w-6 text-blue-400" />
                  <span>Ambassador Submissions Summary</span>
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Each ambassador shown once with total tasks completed and submission details
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="text-left py-3 px-4 text-gray-400 font-medium">Ambassador</th>
                        <th className="text-left py-3 px-4 text-gray-400 font-medium">College</th>
                        <th className="text-left py-3 px-4 text-gray-400 font-medium">Group Leader</th>
                        <th className="text-center py-3 px-4 text-gray-400 font-medium">Total Tasks</th>
                        {/* <th className="text-center py-3 px-4 text-gray-400 font-medium">Completed</th> */}
                        <th className="text-center py-3 px-4 text-gray-400 font-medium">Total Points</th>
                        <th className="text-center py-3 px-4 text-gray-400 font-medium">People Connected</th>
                        <th className="text-center py-3 px-4 text-gray-400 font-medium">View Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {userSummaries.slice(0, 50).map((userSummary) => (
                        <tr key={userSummary.user.id} className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors">
                          <td className="py-3 px-4">
                            <div className="font-medium text-white">{userSummary.user.name}</div>
                            <div className="text-xs text-gray-400">{userSummary.user.email}</div>
                          </td>
                          <td className="py-3 px-4 text-gray-300">
                            {userSummary.user.college}
                          </td>
                          <td className="py-3 px-4 text-gray-300">
                            {userSummary.user.group_leader_name || 'No Group Leader'}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium">
                              {userSummary.submissions.length}
                            </span>
                          </td>
                          {/* <td className="py-3 px-4 text-center"> */}
                            {/* <div className="flex flex-col items-center">
                              <span className="text-green-400 font-bold">{userSummary.completedTasks}</span>
                              {userSummary.pendingTasks > 0 && (
                                <span className="text-yellow-400 text-xs">({userSummary.pendingTasks} pending)</span>
                              )}
                            </div> */}
                          {/* </td> */}
                          <td className="py-3 px-4 text-center">
                            <span className="text-yellow-400 font-bold">{userSummary.totalPoints}</span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="text-purple-400 font-medium">{userSummary.totalPeople}</span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <Button
                              onClick={() => {
                                setSelectedUser(userSummary.user);
                                setSelectedUserSubmissions(userSummary.submissions);
                                setShowUserSubmissionsModal(true);
                              }}
                              variant="ghost"
                              size="sm"
                              className="text-blue-400 hover:text-blue-300 hover:bg-blue-400/10"
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Details
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {userSummaries.length > 50 && (
                    <div className="mt-4 text-center text-gray-400">
                      Showing first 50 of {userSummaries.length} ambassadors. Download Excel report for complete data.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })()}

        {/* Ambassador List with Details Button */}
        {/* {reportData && reportData.ambassadors.length > 0 && (
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
        )} */}

        {/* User Submissions Modal */}
        {showUserSubmissionsModal && selectedUser && selectedUserSubmissions && (
          <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true">
            <div className="absolute inset-0 bg-black/70" onClick={() => setShowUserSubmissionsModal(false)}></div>
            <div className="relative w-full max-w-7xl mx-4 bg-gray-900 rounded-lg border border-gray-700 shadow-xl max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b border-gray-800">
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    {selectedUser.name} - All Submission Details
                  </h3>
                  <p className="text-gray-400 text-sm">
                    {selectedUser.college} • {selectedUser.group_leader_name || 'No Group Leader'}
                  </p>
                </div>
                <button
                  onClick={() => setShowUserSubmissionsModal(false)}
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
                    <div className="text-2xl font-bold text-green-400">{selectedUserSubmissions.length}</div>
                    <p className="text-gray-400 text-sm">Total Submissions</p>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-yellow-400">
                      {selectedUserSubmissions.reduce((sum, sub) => sum + (sub.points_earned || 0), 0)}
                    </div>
                    <p className="text-gray-400 text-sm">Total Points</p>
                  </div>
                  {/* <div className="bg-gray-800 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-purple-400">
                      {selectedUserSubmissions.reduce((sum, sub) => sum + (sub.people_connected || 0), 0)}
                    </div>
                    <p className="text-gray-400 text-sm">People Connected</p>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-blue-400">
                      {selectedUserSubmissions.filter(sub => sub.is_completed).length}
                    </div>
                    <p className="text-gray-400 text-sm">Completed Tasks</p>
                  </div> */}
                </div>

                {/* Detailed Submissions */}
                <div className="space-y-6">
                  <h4 className="text-white font-semibold text-lg">All Submissions ({selectedUserSubmissions.length})</h4>

                  {selectedUserSubmissions.map((submission) => (
                    <div key={submission.id} className="bg-gray-800 rounded-lg border border-gray-700">
                      <div className="p-4 border-b border-gray-700">
                        <div className="flex items-center justify-between">
                          <div>
                            <h5 className="text-white font-medium">{submission.task_title}</h5>
                            <p className="text-gray-400 text-sm">Day {submission.task_day} • {new Date(submission.submission_date).toLocaleString()}</p>
                          </div>
                          <div className="flex items-center space-x-4">
                            <span className="text-yellow-400 font-bold">{submission.points_earned} pts</span>
                            <span className="text-purple-400 font-medium">{submission.people_connected} people</span>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              submission.is_completed
                                ? 'bg-green-600 text-white'
                                : 'bg-yellow-600 text-white'
                            }`}>
                              {submission.is_completed ? 'Completed' : 'Pending'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="p-4">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          {/* Submission Details */}
                          <div>
                            <h6 className="text-gray-400 text-sm font-medium mb-2">Submission Details</h6>
                            {submission.submission_text ? (
                              <div className="bg-gray-700 rounded-lg p-3">
                                <p className="text-white text-sm whitespace-pre-wrap">{submission.submission_text}</p>
                              </div>
                            ) : (
                              <div className="bg-gray-700 rounded-lg p-3">
                                <p className="text-gray-400 text-sm">{submission.status_text || 'No submission details available'}</p>
                              </div>
                            )}

                            <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                              <div>
                                <span className="text-gray-400">Task ID:</span>
                                <p className="text-white font-mono text-xs">{submission.task_id}</p>
                              </div>
                              <div>
                                <span className="text-gray-400">Status:</span>
                                <p className="text-white">{submission.status_text}</p>
                              </div>
                            </div>
                          </div>

                          {/* Submitted Image */}
                          <div>
                            <h6 className="text-gray-400 text-sm font-medium mb-2">Submitted Image</h6>
                            {submission.image_url ? (
                              <img src={submission.image_url} alt="Submitted" className="max-h-40 rounded" />
                            ) : (
                              <div className="text-gray-400">No image submitted</div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {selectedUserSubmissions.length === 0 && (
                    <div className="bg-gray-800 rounded-lg p-8 text-center">
                      <p className="text-gray-400">No submissions found for this ambassador.</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-6 border-t border-gray-800 flex justify-end">
                <Button
                  onClick={() => setShowUserSubmissionsModal(false)}
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
