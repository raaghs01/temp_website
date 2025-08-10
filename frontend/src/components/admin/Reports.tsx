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
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ReportData {
  id: string;
  title: string;
  description: string;
  type: 'performance' | 'engagement' | 'financial' | 'activity';
  generated_date: string;
  period: string;
  file_size: string;
  status: 'ready' | 'generating' | 'failed';
}

interface SystemMetrics {
  total_reports: number;
  reports_this_month: number;
  automated_reports: number;
  data_processed: string;
}

const Reports: React.FC = () => {
  const [reports, setReports] = useState<ReportData[]>([]);
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<'all' | 'performance' | 'engagement' | 'financial' | 'activity'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showGenerateModal, setShowGenerateModal] = useState(false);

  const sampleMetrics: SystemMetrics = {
    total_reports: 156,
    reports_this_month: 24,
    automated_reports: 12,
    data_processed: '2.4 GB'
  };

  const sampleReports: ReportData[] = [
    {
      id: 'rpt_001',
      title: 'Monthly Performance Summary',
      description: 'Comprehensive analysis of ambassador performance, task completion rates, and point distribution',
      type: 'performance',
      generated_date: '2024-01-15',
      period: 'January 2024',
      file_size: '2.3 MB',
      status: 'ready'
    },
    {
      id: 'rpt_002',
      title: 'Engagement Analytics Report',
      description: 'User engagement metrics, activity patterns, and retention analysis',
      type: 'engagement',
      generated_date: '2024-01-14',
      period: 'Last 30 days',
      file_size: '1.8 MB',
      status: 'ready'
    },
    {
      id: 'rpt_003',
      title: 'Points & Rewards Analysis',
      description: 'Financial overview of points distribution, reward redemptions, and cost analysis',
      type: 'financial',
      generated_date: '2024-01-13',
      period: 'Q4 2023',
      file_size: '3.1 MB',
      status: 'ready'
    },
    {
      id: 'rpt_004',
      title: 'System Activity Logs',
      description: 'Detailed system activity, user actions, and security events',
      type: 'activity',
      generated_date: '2024-01-12',
      period: 'Last 7 days',
      file_size: '4.7 MB',
      status: 'ready'
    },
    {
      id: 'rpt_005',
      title: 'College Performance Comparison',
      description: 'Comparative analysis of performance across different colleges and institutions',
      type: 'performance',
      generated_date: 'Processing...',
      period: 'Last 6 months',
      file_size: '--',
      status: 'generating'
    }
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 1000));
        setMetrics(sampleMetrics);
        setReports(sampleReports);
      } catch (error) {
        console.error('Error fetching reports:', error);
        setMetrics(sampleMetrics);
        setReports(sampleReports);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'performance': return 'text-blue-400 bg-blue-900/20';
      case 'engagement': return 'text-green-400 bg-green-900/20';
      case 'financial': return 'text-yellow-400 bg-yellow-900/20';
      case 'activity': return 'text-purple-400 bg-purple-900/20';
      default: return 'text-gray-400 bg-gray-900/20';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready': return 'text-green-400';
      case 'generating': return 'text-yellow-400';
      case 'failed': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const filteredReports = reports.filter(report => {
    const matchesType = selectedType === 'all' || report.type === selectedType;
    const matchesSearch = report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });

  const handleDownload = (report: ReportData) => {
    if (report.status === 'ready') {
      alert(`Downloading ${report.title}...`);
    }
  };

  const generateReport = (type: string, period: string) => {
    const newReport: ReportData = {
      id: `rpt_${Date.now()}`,
      title: `Custom ${type.charAt(0).toUpperCase() + type.slice(1)} Report`,
      description: `Generated ${type} report for ${period}`,
      type: type as any,
      generated_date: 'Processing...',
      period: period,
      file_size: '--',
      status: 'generating'
    };
    setReports([newReport, ...reports]);
    setShowGenerateModal(false);
    
    // Simulate report generation
    setTimeout(() => {
      setReports(prev => prev.map(r => 
        r.id === newReport.id 
          ? { ...r, status: 'ready', generated_date: new Date().toISOString().split('T')[0], file_size: '2.1 MB' }
          : r
      ));
    }, 3000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-xl text-gray-400">Loading reports...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-800">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold">System Reports</h1>
        </div>
        
        <div className="flex items-center space-x-4">
          <Button 
            onClick={() => setShowGenerateModal(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <FileText className="h-4 w-4 mr-2" />
            Generate Report
          </Button>
          <Button variant="outline" className="border-gray-600 text-gray-300">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
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
                  <p className="text-gray-400 text-sm font-medium">Total Reports</p>
                  <p className="text-2xl font-bold text-white mt-1">{metrics?.total_reports}</p>
                  <p className="text-blue-400 text-xs mt-1">All time</p>
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
                  <p className="text-gray-400 text-sm font-medium">This Month</p>
                  <p className="text-2xl font-bold text-white mt-1">{metrics?.reports_this_month}</p>
                  <p className="text-green-400 text-xs mt-1">Generated reports</p>
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
                  <p className="text-gray-400 text-sm font-medium">Automated</p>
                  <p className="text-2xl font-bold text-white mt-1">{metrics?.automated_reports}</p>
                  <p className="text-purple-400 text-xs mt-1">Scheduled reports</p>
                </div>
                <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-medium">Data Processed</p>
                  <p className="text-2xl font-bold text-white mt-1">{metrics?.data_processed}</p>
                  <p className="text-yellow-400 text-xs mt-1">Total volume</p>
                </div>
                <div className="w-12 h-12 bg-yellow-600 rounded-lg flex items-center justify-center">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="bg-gray-800 border-gray-700 mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <div className="flex flex-wrap gap-2">
                {(['all', 'performance', 'engagement', 'financial', 'activity'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setSelectedType(type)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedType === type
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>
              <div className="flex items-center space-x-4">
                <Input
                  placeholder="Search reports..."
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

        {/* Reports List */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Generated Reports</CardTitle>
            <CardDescription className="text-gray-400">Download and manage system reports</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredReports.map((report) => (
                <div key={report.id} className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="text-white font-medium">{report.title}</h4>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getTypeColor(report.type)}`}>
                        {report.type}
                      </span>
                      <span className={`capitalize ${getStatusColor(report.status)}`}>
                        {report.status}
                      </span>
                    </div>
                    <p className="text-gray-400 text-sm mb-2">{report.description}</p>
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>Period: {report.period}</span>
                      <span>Generated: {report.generated_date}</span>
                      <span>Size: {report.file_size}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    {report.status === 'generating' && (
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-yellow-400"></div>
                    )}
                    {report.status === 'ready' && (
                      <Button
                        onClick={() => handleDownload(report)}
                        className="bg-blue-600 hover:bg-blue-700"
                        size="sm"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Generate Report Modal */}
        {showGenerateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true">
            <div className="absolute inset-0 bg-black/70" onClick={() => setShowGenerateModal(false)}></div>
            <div className="relative w-full max-w-md mx-4 bg-gray-900 rounded-lg border border-gray-700 shadow-xl">
              <div className="flex items-center justify-between p-6 border-b border-gray-800">
                <h3 className="text-lg font-semibold text-white">Generate New Report</h3>
                <button
                  onClick={() => setShowGenerateModal(false)}
                  className="text-gray-400 hover:text-white"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Report Type</label>
                    <select className="w-full bg-gray-700 border-gray-600 text-white rounded-lg p-2">
                      <option value="performance">Performance Report</option>
                      <option value="engagement">Engagement Report</option>
                      <option value="financial">Financial Report</option>
                      <option value="activity">Activity Report</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Time Period</label>
                    <select className="w-full bg-gray-700 border-gray-600 text-white rounded-lg p-2">
                      <option value="last-7-days">Last 7 days</option>
                      <option value="last-30-days">Last 30 days</option>
                      <option value="last-3-months">Last 3 months</option>
                      <option value="last-6-months">Last 6 months</option>
                      <option value="last-year">Last year</option>
                    </select>
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <Button
                    onClick={() => setShowGenerateModal(false)}
                    variant="outline"
                    className="border-gray-700 text-gray-300 hover:bg-gray-800"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={() => generateReport('performance', 'Last 30 days')}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Generate Report
                  </Button>
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
