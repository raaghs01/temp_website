import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock, MapPin, Users, Star, TrendingUp, Heart, Award, MessageSquare, Share2 } from 'lucide-react';

const Events: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-800">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold">Events</h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Events & Campaigns</h2>
          <p className="text-gray-400">Discover upcoming events, campaigns, and opportunities to connect with your community.</p>
        </div>

        {/* Stats Overview */}
        {/* <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-medium">Upcoming Events</p>
                  <p className="text-2xl font-bold text-white mt-1">12</p>
                  <p className="text-blue-400 text-xs mt-1">Next 30 days</p>
                </div>
                <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-medium">Active Campaigns</p>
                  <p className="text-2xl font-bold text-white mt-1">8</p>
                  <p className="text-green-400 text-xs mt-1">Currently running</p>
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
                  <p className="text-gray-400 text-sm font-medium">Total Attendees</p>
                  <p className="text-2xl font-bold text-white mt-1">2.1K</p>
                  <p className="text-purple-400 text-xs mt-1">This month</p>
                </div>
                <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
                  <Users className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-medium">Event Rating</p>
                  <p className="text-2xl font-bold text-white mt-1">4.6</p>
                  <p className="text-yellow-400 text-xs mt-1">Out of 5 stars</p>
                </div>
                <div className="w-12 h-12 bg-yellow-600 rounded-lg flex items-center justify-center">
                  <Star className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div> */}

        {/* Featured Events */}
        <Card className="bg-gray-800 border-gray-700 mb-8">
          <CardHeader>
            <CardTitle className="text-white flex items-center space-x-2">
              <Calendar className="h-6 w-6 text-pink-400" />
              <span>Featured Events</span>
            </CardTitle>
            <CardDescription className="text-gray-400">
              Highlighted events and campaigns you won't want to miss
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">Campus Ambassador Summit</h3>
                    <p className="text-blue-100 text-sm mb-3">
                      Join fellow ambassadors for networking, workshops, and exclusive insights from industry leaders.
                    </p>
                    <div className="flex items-center space-x-4 text-sm text-blue-200">
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>Dec 15, 2024</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <MapPin className="h-4 w-4" />
                        <span>Virtual Event</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-blue-200" />
                    <span className="text-blue-200 text-sm">450 registered</span>
                  </div>
                  <button className="bg-white text-blue-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors">
                    Register Now
                  </button>
                </div>
              </div>

              <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-lg p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">Social Media Challenge</h3>
                    <p className="text-green-100 text-sm mb-3">
                      Create viral content and win prizes while promoting our brand across social platforms.
                    </p>
                    <div className="flex items-center space-x-4 text-sm text-green-200">
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>Ongoing</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Award className="h-4 w-4" />
                        <span>$5K Prize Pool</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-4 w-4 text-green-200" />
                    <span className="text-green-200 text-sm">1.2K participants</span>
                  </div>
                  <button className="bg-white text-green-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors">
                    Join Challenge
                  </button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Event Categories */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Upcoming Events */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <Calendar className="h-6 w-6 text-blue-400" />
                <span>Upcoming Events</span>
              </CardTitle>
              <CardDescription className="text-gray-400">
                Events happening in the next 30 days
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-white">Networking Mixer</h4>
                    <span className="text-green-400 text-sm">Dec 8</span>
                  </div>
                  <p className="text-gray-400 text-sm mb-3">Connect with fellow ambassadors</p>
                  <div className="flex items-center space-x-4 text-sm">
                    <span className="text-gray-400">Virtual</span>
                    <span className="text-gray-400">•</span>
                    <span className="text-gray-400">120 attending</span>
                  </div>
                </div>
                
                <div className="bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-white">Workshop Series</h4>
                    <span className="text-blue-400 text-sm">Dec 12</span>
                  </div>
                  <p className="text-gray-400 text-sm mb-3">Skill-building sessions</p>
                  <div className="flex items-center space-x-4 text-sm">
                    <span className="text-gray-400">In-person</span>
                    <span className="text-gray-400">•</span>
                    <span className="text-gray-400">85 registered</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Active Campaigns */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <TrendingUp className="h-6 w-6 text-green-400" />
                <span>Active Campaigns</span>
              </CardTitle>
              <CardDescription className="text-gray-400">
                Ongoing campaigns you can participate in
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-white">Brand Awareness</h4>
                    <span className="text-green-400 text-sm">Active</span>
                  </div>
                  <p className="text-gray-400 text-sm mb-3">Spread the word about our products</p>
                  <div className="flex items-center space-x-4 text-sm">
                    <span className="text-gray-400">2 weeks left</span>
                    <span className="text-gray-400">•</span>
                    <span className="text-gray-400">340 participants</span>
                  </div>
                </div>
                
                <div className="bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-white">Referral Program</h4>
                    <span className="text-blue-400 text-sm">Hot</span>
                  </div>
                  <p className="text-gray-400 text-sm mb-3">Earn rewards for referrals</p>
                  <div className="flex items-center space-x-4 text-sm">
                    <span className="text-gray-400">1 month left</span>
                    <span className="text-gray-400">•</span>
                    <span className="text-gray-400">567 participants</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Networking Opportunities */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <Users className="h-6 w-6 text-purple-400" />
                <span>Networking</span>
              </CardTitle>
              <CardDescription className="text-gray-400">
                Connect with other ambassadors
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-white">Regional Meetups</h4>
                    <span className="text-purple-400 text-sm">Monthly</span>
                  </div>
                  <p className="text-gray-400 text-sm mb-3">Local ambassador gatherings</p>
                  <div className="flex items-center space-x-4 text-sm">
                    <span className="text-gray-400">12 cities</span>
                    <span className="text-gray-400">•</span>
                    <span className="text-gray-400">Active</span>
                  </div>
                </div>
                
                <div className="bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-white">Mentorship Program</h4>
                    <span className="text-green-400 text-sm">Open</span>
                  </div>
                  <p className="text-gray-400 text-sm mb-3">Connect with experienced ambassadors</p>
                  <div className="flex items-center space-x-4 text-sm">
                    <span className="text-gray-400">45 mentors</span>
                    <span className="text-gray-400">•</span>
                    <span className="text-gray-400">120 mentees</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Event Features */}
        {/* <Card className="bg-gray-800 border-gray-700 mb-8">
          <CardHeader>
            <CardTitle className="text-white flex items-center space-x-2">
              <Star className="h-6 w-6 text-yellow-400" />
              <span>Event Features</span>
            </CardTitle>
            <CardDescription className="text-gray-400">
              What makes our events special
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-700 rounded-lg p-4 text-center">
                <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <MessageSquare className="h-6 w-6 text-white" />
                </div>
                <h4 className="font-medium text-white mb-1">Interactive Sessions</h4>
                <p className="text-gray-400 text-sm">Engage with speakers and peers</p>
                <p className="text-blue-400 text-xs mt-1">Live Q&A included</p>
              </div>
              
              <div className="bg-gray-700 rounded-lg p-4 text-center">
                <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Share2 className="h-6 w-6 text-white" />
                </div>
                <h4 className="font-medium text-white mb-1">Resource Sharing</h4>
                <p className="text-gray-400 text-sm">Access exclusive materials</p>
                <p className="text-green-400 text-xs mt-1">Premium content</p>
              </div>
              
              <div className="bg-gray-700 rounded-lg p-4 text-center">
                <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Award className="h-6 w-6 text-white" />
                </div>
                <h4 className="font-medium text-white mb-1">Recognition</h4>
                <p className="text-gray-400 text-sm">Get recognized for participation</p>
                <p className="text-purple-400 text-xs mt-1">Certificates & badges</p>
              </div>
            </div>
          </CardContent>
        </Card> */}

        {/* Coming Soon Notice */}
        <Card className="bg-gradient-to-r from-pink-600 to-purple-600 border-0">
          <CardContent className="p-8 text-center">
            <div className="flex items-center justify-center mb-4">
              <Heart className="h-8 w-8 text-white mr-3" />
              <h3 className="text-2xl font-bold text-white">Amazing Events Coming Soon!</h3>
            </div>
            <p className="text-pink-100 mb-6 max-w-2xl mx-auto">
              Get ready for an exciting lineup of events, workshops, and networking opportunities 
              that will help you grow your skills, expand your network, and advance your 
              ambassador career.
            </p>
            <div className="flex items-center justify-center space-x-4">
              <div className="bg-white/20 rounded-lg px-4 py-2">
                <span className="text-white text-sm font-medium">Q1 2024</span>
              </div>
              <div className="bg-white/20 rounded-lg px-4 py-2">
                <span className="text-white text-sm font-medium">Virtual & In-Person</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Events;
