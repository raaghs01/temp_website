import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, TrendingUp, Target, Activity, Users, Award, Calendar, PieChart, LineChart, Zap } from 'lucide-react';

const Analytics: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-800">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold">Analytics</h1>
          <div className="bg-purple-600 text-white px-3 py-1 rounded-full text-sm">
            Coming Soon
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="bg-gray-800 text-gray-300 px-4 py-2 rounded-lg text-sm">
            <Activity className="h-4 w-4 inline mr-2" />
            Real-time Data
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Performance Analytics</h2>
          <p className="text-gray-400">Track your growth, analyze campaign effectiveness, and optimize your ambassador strategy.</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-medium">Total Reach</p>
                  <p className="text-2xl font-bold text-white mt-1">12.5K</p>
                  <p className="text-green-400 text-xs mt-1">+23% this month</p>
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
                  <p className="text-gray-400 text-sm font-medium">Engagement Rate</p>
                  <p className="text-2xl font-bold text-white mt-1">8.7%</p>
                  <p className="text-green-400 text-xs mt-1">+5.2% vs last month</p>
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
                  <p className="text-gray-400 text-sm font-medium">Conversion Rate</p>
                  <p className="text-2xl font-bold text-white mt-1">3.2%</p>
                  <p className="text-purple-400 text-xs mt-1">Above average</p>
                </div>
                <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
                  <Target className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-medium">ROI</p>
                  <p className="text-2xl font-bold text-white mt-1">4.8x</p>
                  <p className="text-yellow-400 text-xs mt-1">Excellent return</p>
                </div>
                <div className="w-12 h-12 bg-yellow-600 rounded-lg flex items-center justify-center">
                  <Award className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Performance Trends */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <LineChart className="h-6 w-6 text-blue-400" />
                <span>Performance Trends</span>
              </CardTitle>
              <CardDescription className="text-gray-400">
                Your growth over the last 30 days
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-gray-700 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <LineChart className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-400">Chart visualization would go here</p>
                  <p className="text-gray-500 text-sm mt-1">Line chart showing performance trends</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Campaign Distribution */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <PieChart className="h-6 w-6 text-green-400" />
                <span>Campaign Distribution</span>
              </CardTitle>
              <CardDescription className="text-gray-400">
                How your efforts are distributed across campaigns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-gray-700 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <PieChart className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-400">Chart visualization would go here</p>
                  <p className="text-gray-500 text-sm mt-1">Pie chart showing campaign distribution</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Top Performing Campaigns */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <BarChart3 className="h-6 w-6 text-purple-400" />
                <span>Top Campaigns</span>
              </CardTitle>
              <CardDescription className="text-gray-400">
                Your best performing campaigns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-gray-700 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-white">Social Media Blitz</h4>
                    <span className="text-green-400 text-sm font-medium">+45%</span>
                  </div>
                  <div className="w-full bg-gray-600 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: '85%' }}></div>
                  </div>
                  <p className="text-gray-400 text-xs mt-1">2,450 engagements</p>
                </div>
                
                <div className="bg-gray-700 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-white">Campus Outreach</h4>
                    <span className="text-blue-400 text-sm font-medium">+32%</span>
                  </div>
                  <div className="w-full bg-gray-600 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: '72%' }}></div>
                  </div>
                  <p className="text-gray-400 text-xs mt-1">1,890 engagements</p>
                </div>
                
                <div className="bg-gray-700 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-white">Event Promotion</h4>
                    <span className="text-purple-400 text-sm font-medium">+28%</span>
                  </div>
                  <div className="w-full bg-gray-600 rounded-full h-2">
                    <div className="bg-purple-500 h-2 rounded-full" style={{ width: '65%' }}></div>
                  </div>
                  <p className="text-gray-400 text-xs mt-1">1,234 engagements</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Audience Insights */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <Users className="h-6 w-6 text-blue-400" />
                <span>Audience Insights</span>
              </CardTitle>
              <CardDescription className="text-gray-400">
                Your audience demographics and behavior
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-gray-700 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-400 text-sm">Age 18-24</span>
                    <span className="text-white font-medium">45%</span>
                  </div>
                  <div className="w-full bg-gray-600 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: '45%' }}></div>
                  </div>
                </div>
                
                <div className="bg-gray-700 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-400 text-sm">Age 25-34</span>
                    <span className="text-white font-medium">32%</span>
                  </div>
                  <div className="w-full bg-gray-600 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: '32%' }}></div>
                  </div>
                </div>
                
                <div className="bg-gray-700 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-400 text-sm">Age 35+</span>
                    <span className="text-white font-medium">23%</span>
                  </div>
                  <div className="w-full bg-gray-600 rounded-full h-2">
                    <div className="bg-purple-500 h-2 rounded-full" style={{ width: '23%' }}></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Time Analysis */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <Calendar className="h-6 w-6 text-green-400" />
                <span>Peak Hours</span>
              </CardTitle>
              <CardDescription className="text-gray-400">
                When your audience is most active
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-gray-700 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-400 text-sm">6-9 PM</span>
                    <span className="text-white font-medium">High</span>
                  </div>
                  <div className="w-full bg-gray-600 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: '90%' }}></div>
                  </div>
                </div>
                
                <div className="bg-gray-700 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-400 text-sm">12-2 PM</span>
                    <span className="text-white font-medium">Medium</span>
                  </div>
                  <div className="w-full bg-gray-600 rounded-full h-2">
                    <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '65%' }}></div>
                  </div>
                </div>
                
                <div className="bg-gray-700 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-400 text-sm">9-11 AM</span>
                    <span className="text-white font-medium">Low</span>
                  </div>
                  <div className="w-full bg-gray-600 rounded-full h-2">
                    <div className="bg-red-500 h-2 rounded-full" style={{ width: '35%' }}></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Coming Soon Notice */}
        <Card className="bg-gradient-to-r from-purple-600 to-blue-600 border-0">
          <CardContent className="p-8 text-center">
            <div className="flex items-center justify-center mb-4">
              <Zap className="h-8 w-8 text-white mr-3" />
              <h3 className="text-2xl font-bold text-white">Advanced Analytics Coming Soon!</h3>
            </div>
            <p className="text-purple-100 mb-6 max-w-2xl mx-auto">
              Get ready for powerful analytics tools that will help you track performance, 
              analyze campaign effectiveness, and optimize your ambassador strategy with 
              real-time insights and predictive analytics.
            </p>
            <div className="flex items-center justify-center space-x-4">
              <div className="bg-white/20 rounded-lg px-4 py-2">
                <span className="text-white text-sm font-medium">Q2 2024</span>
              </div>
              <div className="bg-white/20 rounded-lg px-4 py-2">
                <span className="text-white text-sm font-medium">AI-Powered Insights</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Analytics;
