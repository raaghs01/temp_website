import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, TrendingUp, Download, Calendar, BarChart3, PieChart, Activity, Filter, Search, Eye } from 'lucide-react';

const Reports: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-800">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold">Reports</h1>
          <div className="bg-orange-600 text-white px-3 py-1 rounded-full text-sm">
            Coming Soon
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="bg-gray-800 text-gray-300 px-4 py-2 rounded-lg text-sm">
            <FileText className="h-4 w-4 inline mr-2" />
            Auto-generated
          </div>
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-medium">Total Reports</p>
                  <p className="text-2xl font-bold text-white mt-1">24</p>
                  <p className="text-blue-400 text-xs mt-1">This month</p>
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
                  <p className="text-gray-400 text-sm font-medium">Scheduled Reports</p>
                  <p className="text-2xl font-bold text-white mt-1">8</p>
                  <p className="text-green-400 text-xs mt-1">Auto-generated</p>
                </div>
                <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-medium">Export Formats</p>
                  <p className="text-2xl font-bold text-white mt-1">5</p>
                  <p className="text-purple-400 text-xs mt-1">PDF, CSV, Excel</p>
                </div>
                <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
                  <Download className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-medium">Data Points</p>
                  <p className="text-2xl font-bold text-white mt-1">2.4K</p>
                  <p className="text-yellow-400 text-xs mt-1">Tracked metrics</p>
                </div>
                <div className="w-12 h-12 bg-yellow-600 rounded-lg flex items-center justify-center">
                  <Activity className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Report Types Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Activity Reports */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <Activity className="h-6 w-6 text-blue-400" />
                <span>Activity Reports</span>
              </CardTitle>
              <CardDescription className="text-gray-400">
                Track your daily activities and task completion progress
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-white">Daily Activity Summary</h4>
                    <span className="text-green-400 text-sm">Available</span>
                  </div>
                  <p className="text-gray-400 text-sm mb-3">Track your daily tasks and achievements</p>
                  <div className="flex items-center space-x-4 text-sm">
                    <span className="text-gray-400">Last updated: 2 hours ago</span>
                    <span className="text-blue-400">PDF</span>
                  </div>
                </div>
                
                <div className="bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-white">Weekly Progress Report</h4>
                    <span className="text-blue-400 text-sm">Scheduled</span>
                  </div>
                  <p className="text-gray-400 text-sm mb-3">Weekly overview of your performance</p>
                  <div className="flex items-center space-x-4 text-sm">
                    <span className="text-gray-400">Next: Sunday 9:00 AM</span>
                    <span className="text-green-400">Auto</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Performance Reports */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <TrendingUp className="h-6 w-6 text-green-400" />
                <span>Performance Reports</span>
              </CardTitle>
              <CardDescription className="text-gray-400">
                Analyze your metrics and campaign effectiveness
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-white">Campaign Performance</h4>
                    <span className="text-green-400 text-sm">Available</span>
                  </div>
                  <p className="text-gray-400 text-sm mb-3">Detailed analysis of campaign results</p>
                  <div className="flex items-center space-x-4 text-sm">
                    <span className="text-gray-400">Last updated: 1 day ago</span>
                    <span className="text-purple-400">Excel</span>
                  </div>
                </div>
                
                <div className="bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-white">ROI Analysis</h4>
                    <span className="text-yellow-400 text-sm">Processing</span>
                  </div>
                  <p className="text-gray-400 text-sm mb-3">Return on investment calculations</p>
                  <div className="flex items-center space-x-4 text-sm">
                    <span className="text-gray-400">ETA: 30 minutes</span>
                    <span className="text-blue-400">PDF</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Report Templates */}
        <Card className="bg-gray-800 border-gray-700 mb-8">
          <CardHeader>
            <CardTitle className="text-white flex items-center space-x-2">
              <FileText className="h-6 w-6 text-purple-400" />
              <span>Report Templates</span>
            </CardTitle>
            <CardDescription className="text-gray-400">
              Pre-built report templates for different use cases
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-700 rounded-lg p-4 text-center">
                <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
                <h4 className="font-medium text-white mb-1">Executive Summary</h4>
                <p className="text-gray-400 text-sm">High-level overview</p>
                <p className="text-blue-400 text-xs mt-1">Monthly</p>
              </div>
              
              <div className="bg-gray-700 rounded-lg p-4 text-center">
                <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <PieChart className="h-6 w-6 text-white" />
                </div>
                <h4 className="font-medium text-white mb-1">Detailed Analysis</h4>
                <p className="text-gray-400 text-sm">In-depth metrics</p>
                <p className="text-green-400 text-xs mt-1">Weekly</p>
              </div>
              
              <div className="bg-gray-700 rounded-lg p-4 text-center">
                <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <h4 className="font-medium text-white mb-1">Trend Report</h4>
                <p className="text-gray-400 text-sm">Performance trends</p>
                <p className="text-purple-400 text-xs mt-1">Quarterly</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Export Options */}
        <Card className="bg-gray-800 border-gray-700 mb-8">
          <CardHeader>
            <CardTitle className="text-white flex items-center space-x-2">
              <Download className="h-6 w-6 text-green-400" />
              <span>Export Options</span>
            </CardTitle>
            <CardDescription className="text-gray-400">
              Download reports in various formats for sharing and analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-gray-700 rounded-lg p-4 text-center">
                <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <h4 className="font-medium text-white mb-1">PDF</h4>
                <p className="text-gray-400 text-sm">Print-ready format</p>
                <p className="text-red-400 text-xs mt-1">Most popular</p>
              </div>
              
              <div className="bg-gray-700 rounded-lg p-4 text-center">
                <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <h4 className="font-medium text-white mb-1">CSV</h4>
                <p className="text-gray-400 text-sm">Data analysis</p>
                <p className="text-green-400 text-xs mt-1">Spreadsheet ready</p>
              </div>
              
              <div className="bg-gray-700 rounded-lg p-4 text-center">
                <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <h4 className="font-medium text-white mb-1">Excel</h4>
                <p className="text-gray-400 text-sm">Advanced formatting</p>
                <p className="text-blue-400 text-xs mt-1">Charts included</p>
              </div>
              
              <div className="bg-gray-700 rounded-lg p-4 text-center">
                <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <h4 className="font-medium text-white mb-1">JSON</h4>
                <p className="text-gray-400 text-sm">API integration</p>
                <p className="text-purple-400 text-xs mt-1">Developer friendly</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Coming Soon Notice */}
        <Card className="bg-gradient-to-r from-orange-600 to-red-600 border-0">
          <CardContent className="p-8 text-center">
            <div className="flex items-center justify-center mb-4">
              <Eye className="h-8 w-8 text-white mr-3" />
              <h3 className="text-2xl font-bold text-white">Advanced Reports Coming Soon!</h3>
            </div>
            <p className="text-orange-100 mb-6 max-w-2xl mx-auto">
              Get ready for comprehensive reporting tools that will provide deep insights into your 
              ambassador performance, automated report generation, and customizable dashboards 
              for better decision-making.
            </p>
            <div className="flex items-center justify-center space-x-4">
              <div className="bg-white/20 rounded-lg px-4 py-2">
                <span className="text-white text-sm font-medium">Q2 2024</span>
              </div>
              <div className="bg-white/20 rounded-lg px-4 py-2">
                <span className="text-white text-sm font-medium">Custom Dashboards</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Reports;
