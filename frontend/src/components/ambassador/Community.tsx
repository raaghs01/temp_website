import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, MessageSquare, Share2, Heart, TrendingUp, Calendar, MapPin, Star } from 'lucide-react';

const Community: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-800">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold">Community</h1>
          <div className="bg-green-600 text-white px-3 py-1 rounded-full text-sm">
            Coming Soon
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="bg-gray-800 text-gray-300 px-4 py-2 rounded-lg text-sm">
            <Users className="h-4 w-4 inline mr-2" />
            1,234 Members
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Connect with Fellow Ambassadors</h2>
          <p className="text-gray-400">Share experiences, collaborate on campaigns, and grow together.</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-medium">Total Members</p>
                  <p className="text-2xl font-bold text-white mt-1">1,234</p>
                  <p className="text-green-400 text-xs mt-1">+12% this month</p>
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
                  <p className="text-gray-400 text-sm font-medium">Active Discussions</p>
                  <p className="text-2xl font-bold text-white mt-1">89</p>
                  <p className="text-blue-400 text-xs mt-1">This week</p>
                </div>
                <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                  <MessageSquare className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-medium">Shared Resources</p>
                  <p className="text-2xl font-bold text-white mt-1">156</p>
                  <p className="text-purple-400 text-xs mt-1">Materials available</p>
                </div>
                <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
                  <Share2 className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-medium">Community Rating</p>
                  <p className="text-2xl font-bold text-white mt-1">4.8</p>
                  <p className="text-yellow-400 text-xs mt-1">Out of 5 stars</p>
                </div>
                <div className="w-12 h-12 bg-yellow-600 rounded-lg flex items-center justify-center">
                  <Star className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Discussion Forums */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <MessageSquare className="h-6 w-6 text-blue-400" />
                <span>Discussion Forums</span>
              </CardTitle>
              <CardDescription className="text-gray-400">
                Share tips, strategies, and experiences with fellow ambassadors
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-white">Getting Started Tips</h4>
                    <span className="text-green-400 text-sm">Active</span>
                  </div>
                  <p className="text-gray-400 text-sm mb-3">Share your best practices for new ambassadors</p>
                  <div className="flex items-center space-x-4 text-sm">
                    <span className="text-gray-400">23 replies</span>
                    <span className="text-gray-400">•</span>
                    <span className="text-gray-400">2 hours ago</span>
                  </div>
                </div>
                
                <div className="bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-white">Campaign Strategies</h4>
                    <span className="text-blue-400 text-sm">Hot</span>
                  </div>
                  <p className="text-gray-400 text-sm mb-3">Discuss effective campaign approaches</p>
                  <div className="flex items-center space-x-4 text-sm">
                    <span className="text-gray-400">45 replies</span>
                    <span className="text-gray-400">•</span>
                    <span className="text-gray-400">1 day ago</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Team Collaboration */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <Users className="h-6 w-6 text-green-400" />
                <span>Team Collaboration</span>
              </CardTitle>
              <CardDescription className="text-gray-400">
                Work together on campaigns and projects
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-white">Regional Teams</h4>
                    <span className="text-green-400 text-sm">Open</span>
                  </div>
                  <p className="text-gray-400 text-sm mb-3">Connect with ambassadors in your area</p>
                  <div className="flex items-center space-x-4 text-sm">
                    <span className="text-gray-400">12 teams</span>
                    <span className="text-gray-400">•</span>
                    <span className="text-gray-400">Active</span>
                  </div>
                </div>
                
                <div className="bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-white">Project Groups</h4>
                    <span className="text-purple-400 text-sm">New</span>
                  </div>
                  <p className="text-gray-400 text-sm mb-3">Join specialized project teams</p>
                  <div className="flex items-center space-x-4 text-sm">
                    <span className="text-gray-400">8 projects</span>
                    <span className="text-gray-400">•</span>
                    <span className="text-gray-400">Recruiting</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Resource Sharing */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center space-x-2">
              <Share2 className="h-6 w-6 text-purple-400" />
              <span>Resource Sharing</span>
            </CardTitle>
            <CardDescription className="text-gray-400">
              Access and share materials, templates, and resources
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-700 rounded-lg p-4 text-center">
                <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <MessageSquare className="h-6 w-6 text-white" />
                </div>
                <h4 className="font-medium text-white mb-1">Templates</h4>
                <p className="text-gray-400 text-sm">Campaign templates</p>
                <p className="text-blue-400 text-xs mt-1">24 available</p>
              </div>
              
              <div className="bg-gray-700 rounded-lg p-4 text-center">
                <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <h4 className="font-medium text-white mb-1">Guides</h4>
                <p className="text-gray-400 text-sm">Best practices</p>
                <p className="text-green-400 text-xs mt-1">18 guides</p>
              </div>
              
              <div className="bg-gray-700 rounded-lg p-4 text-center">
                <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
                <h4 className="font-medium text-white mb-1">Events</h4>
                <p className="text-gray-400 text-sm">Upcoming events</p>
                <p className="text-purple-400 text-xs mt-1">6 events</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Coming Soon Notice */}
        <Card className="bg-gradient-to-r from-blue-600 to-purple-600 border-0 mt-8">
          <CardContent className="p-8 text-center">
            <div className="flex items-center justify-center mb-4">
              <Heart className="h-8 w-8 text-white mr-3" />
              <h3 className="text-2xl font-bold text-white">Community Features Coming Soon!</h3>
            </div>
            <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
              We're building an amazing community platform where you can connect, collaborate, and grow together. 
              Stay tuned for the launch of discussion forums, team collaboration tools, and resource sharing features.
            </p>
            <div className="flex items-center justify-center space-x-4">
              <div className="bg-white/20 rounded-lg px-4 py-2">
                <span className="text-white text-sm font-medium">Q1 2024</span>
              </div>
              <div className="bg-white/20 rounded-lg px-4 py-2">
                <span className="text-white text-sm font-medium">Beta Access</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Community;
