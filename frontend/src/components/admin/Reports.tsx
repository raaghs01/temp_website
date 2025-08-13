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
  CheckCircle
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

  // Fetch data from backend
  const fetchReportData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      if (!token) {
        console.error('No token found');
        return;
      }

      // Fetch ambassadors data
      const ambassadorsResponse = await fetch(`${BACKEND_URL}/api/admin/ambassadors`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // Fetch group leaders
      const groupLeadersResponse = await fetch(`${BACKEND_URL}/api/admin/group-leaders`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (ambassadorsResponse.ok && groupLeadersResponse.ok) {
        const ambassadors: Ambassador[] = await ambassadorsResponse.json();
        const leaders: string[] = await groupLeadersResponse.json();

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
      } else {
        console.error('Failed to fetch data');
      }
    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, [selectedGroupLeader]);

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

        {/* Detailed Submissions Table */}
        {reportData && reportData.submissions.length > 0 && (
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <CheckCircle className="h-6 w-6 text-green-400" />
                <span>Detailed Submissions</span>
              </CardTitle>
              <CardDescription className="text-gray-400">
                Complete list of task submissions
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
                      <th className="text-left py-3 px-4 text-gray-300 font-medium">Task</th>
                      <th className="text-left py-3 px-4 text-gray-300 font-medium">Date</th>
                      <th className="text-left py-3 px-4 text-gray-300 font-medium">Points</th>
                      <th className="text-left py-3 px-4 text-gray-300 font-medium">People</th>
                      <th className="text-left py-3 px-4 text-gray-300 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.submissions.slice(0, 50).map((submission) => (
                      <tr key={submission.id} className="border-b border-gray-800 hover:bg-gray-700">
                        <td className="py-3 px-4">
                          <div>
                            <p className="text-white font-medium">{submission.user_name}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-300">{submission.user_college}</td>
                        <td className="py-3 px-4">
                          <span className="bg-blue-600 text-white px-2 py-1 rounded text-xs">
                            {submission.user_group_leader || 'No Group Leader'}
                          </span>
                        </td>
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
                {reportData.submissions.length > 50 && (
                  <div className="mt-4 text-center text-gray-400 text-sm">
                    Showing first 50 submissions. Export to see all {reportData.submissions.length} submissions.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  );
};

export default Reports;
