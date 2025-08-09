import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, Bell, Send, Users, Star, Clock, Search, Filter, Plus, Heart, TrendingUp } from 'lucide-react';

const Messages: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-800">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold">Messages</h1>
          <div className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm">
            Coming Soon
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="bg-gray-800 text-gray-300 px-4 py-2 rounded-lg text-sm">
            <MessageSquare className="h-4 w-4 inline mr-2" />
            3 Unread
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Messaging Center</h2>
          <p className="text-gray-400">Stay connected with your team and receive important updates and notifications.</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-medium">Total Messages</p>
                  <p className="text-2xl font-bold text-white mt-1">156</p>
                  <p className="text-blue-400 text-xs mt-1">This month</p>
                </div>
                <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                  <MessageSquare className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-medium">Unread Messages</p>
                  <p className="text-2xl font-bold text-white mt-1">3</p>
                  <p className="text-yellow-400 text-xs mt-1">Require attention</p>
                </div>
                <div className="w-12 h-12 bg-yellow-600 rounded-lg flex items-center justify-center">
                  <Bell className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-medium">Active Chats</p>
                  <p className="text-2xl font-bold text-white mt-1">8</p>
                  <p className="text-green-400 text-xs mt-1">Ongoing conversations</p>
                </div>
                <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                  <Users className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-medium">Response Time</p>
                  <p className="text-2xl font-bold text-white mt-1">2.3h</p>
                  <p className="text-purple-400 text-xs mt-1">Average</p>
                </div>
                <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
                  <Clock className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Message Types Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Direct Messages */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <MessageSquare className="h-6 w-6 text-blue-400" />
                <span>Direct Messages</span>
              </CardTitle>
              <CardDescription className="text-gray-400">
                Chat with team members and ambassadors
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-white">Team Chat</h4>
                    <span className="text-green-400 text-sm">Online</span>
                  </div>
                  <p className="text-gray-400 text-sm mb-3">General team discussions and updates</p>
                  <div className="flex items-center space-x-4 text-sm">
                    <span className="text-gray-400">12 members</span>
                    <span className="text-gray-400">•</span>
                    <span className="text-gray-400">Last message: 5 min ago</span>
                  </div>
                </div>
                
                <div className="bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-white">Support Chat</h4>
                    <span className="text-yellow-400 text-sm">2 unread</span>
                  </div>
                  <p className="text-gray-400 text-sm mb-3">Get help from support team</p>
                  <div className="flex items-center space-x-4 text-sm">
                    <span className="text-gray-400">3 members</span>
                    <span className="text-gray-400">•</span>
                    <span className="text-gray-400">Last message: 1 hour ago</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Announcements */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <Bell className="h-6 w-6 text-green-400" />
                <span>Announcements</span>
              </CardTitle>
              <CardDescription className="text-gray-400">
                Important updates and notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-white">System Updates</h4>
                    <span className="text-blue-400 text-sm">New</span>
                  </div>
                  <p className="text-gray-400 text-sm mb-3">Platform updates and maintenance</p>
                  <div className="flex items-center space-x-4 text-sm">
                    <span className="text-gray-400">Broadcast</span>
                    <span className="text-gray-400">•</span>
                    <span className="text-gray-400">2 hours ago</span>
                  </div>
                </div>
                
                <div className="bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-white">Campaign Alerts</h4>
                    <span className="text-purple-400 text-sm">Hot</span>
                  </div>
                  <p className="text-gray-400 text-sm mb-3">New campaigns and opportunities</p>
                  <div className="flex items-center space-x-4 text-sm">
                    <span className="text-gray-400">All ambassadors</span>
                    <span className="text-gray-400">•</span>
                    <span className="text-gray-400">1 day ago</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Message Features */}
        <Card className="bg-gray-800 border-gray-700 mb-8">
          <CardHeader>
            <CardTitle className="text-white flex items-center space-x-2">
              <Send className="h-6 w-6 text-purple-400" />
              <span>Message Features</span>
            </CardTitle>
            <CardDescription className="text-gray-400">
              Advanced messaging capabilities coming soon
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-700 rounded-lg p-4 text-center">
                <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <MessageSquare className="h-6 w-6 text-white" />
                </div>
                <h4 className="font-medium text-white mb-1">Real-time Chat</h4>
                <p className="text-gray-400 text-sm">Instant messaging</p>
                <p className="text-blue-400 text-xs mt-1">Live updates</p>
              </div>
              
              <div className="bg-gray-700 rounded-lg p-4 text-center">
                <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <h4 className="font-medium text-white mb-1">Group Chats</h4>
                <p className="text-gray-400 text-sm">Team collaboration</p>
                <p className="text-green-400 text-xs mt-1">Multiple participants</p>
              </div>
              
              <div className="bg-gray-700 rounded-lg p-4 text-center">
                <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Bell className="h-6 w-6 text-white" />
                </div>
                <h4 className="font-medium text-white mb-1">Smart Notifications</h4>
                <p className="text-gray-400 text-sm">Intelligent alerts</p>
                <p className="text-purple-400 text-xs mt-1">Priority-based</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="bg-gray-800 border-gray-700 mb-8">
          <CardHeader>
            <CardTitle className="text-white flex items-center space-x-2">
              <Plus className="h-6 w-6 text-yellow-400" />
              <span>Quick Actions</span>
            </CardTitle>
            <CardDescription className="text-gray-400">
              Common messaging tasks and shortcuts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-gray-700 rounded-lg p-4 text-center">
                <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Search className="h-6 w-6 text-white" />
                </div>
                <h4 className="font-medium text-white mb-1">Search Messages</h4>
                <p className="text-gray-400 text-sm">Find conversations</p>
              </div>
              
              <div className="bg-gray-700 rounded-lg p-4 text-center">
                <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Filter className="h-6 w-6 text-white" />
                </div>
                <h4 className="font-medium text-white mb-1">Filter Messages</h4>
                <p className="text-gray-400 text-sm">Organize by type</p>
              </div>
              
              <div className="bg-gray-700 rounded-lg p-4 text-center">
                <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Star className="h-6 w-6 text-white" />
                </div>
                <h4 className="font-medium text-white mb-1">Star Messages</h4>
                <p className="text-gray-400 text-sm">Mark as important</p>
              </div>
              
              <div className="bg-gray-700 rounded-lg p-4 text-center">
                <div className="w-12 h-12 bg-yellow-600 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <h4 className="font-medium text-white mb-1">Message Analytics</h4>
                <p className="text-gray-400 text-sm">Track engagement</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Coming Soon Notice */}
        <Card className="bg-gradient-to-r from-blue-600 to-purple-600 border-0">
          <CardContent className="p-8 text-center">
            <div className="flex items-center justify-center mb-4">
              <Heart className="h-8 w-8 text-white mr-3" />
              <h3 className="text-2xl font-bold text-white">Advanced Messaging Coming Soon!</h3>
            </div>
            <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
              Get ready for a powerful messaging system that will keep you connected with your team, 
              provide real-time notifications, and offer advanced features like message search, 
              file sharing, and smart notifications.
            </p>
            <div className="flex items-center justify-center space-x-4">
              <div className="bg-white/20 rounded-lg px-4 py-2">
                <span className="text-white text-sm font-medium">Q1 2024</span>
              </div>
              <div className="bg-white/20 rounded-lg px-4 py-2">
                <span className="text-white text-sm font-medium">Real-time Chat</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Messages;
