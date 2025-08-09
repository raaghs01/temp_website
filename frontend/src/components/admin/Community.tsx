import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Users, 
  MessageSquare, 
  Send, 
  Pin,
  Flag,
  Ban,
  Eye,
  Trash2,
  Search,
  Filter,
  Plus,
  Globe,
  Lock,
  Unlock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface CommunityPost {
  id: string;
  author_id: string;
  author_name: string;
  author_email: string;
  author_college: string;
  title: string;
  content: string;
  timestamp: string;
  likes: number;
  comments: number;
  status: 'active' | 'flagged' | 'hidden' | 'pinned';
  category: 'general' | 'help' | 'events' | 'achievements' | 'feedback';
  visibility: 'public' | 'ambassadors_only' | 'admin_only';
  reported_count: number;
}

interface CommunityStats {
  total_posts: number;
  active_discussions: number;
  flagged_posts: number;
  total_participants: number;
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  created_by: string;
  created_at: string;
  priority: 'low' | 'medium' | 'high';
  target_audience: 'all' | 'ambassadors' | 'admins';
  status: 'active' | 'scheduled' | 'expired';
}

const Community: React.FC = () => {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [stats, setStats] = useState<CommunityStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'general' | 'help' | 'events' | 'achievements' | 'feedback'>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'active' | 'flagged' | 'hidden' | 'pinned'>('all');
  const [selectedPost, setSelectedPost] = useState<CommunityPost | null>(null);
  const [showPostModal, setShowPostModal] = useState(false);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'posts' | 'announcements'>('posts');

  const sampleStats: CommunityStats = {
    total_posts: 342,
    active_discussions: 23,
    flagged_posts: 5,
    total_participants: 128
  };

  const samplePosts: CommunityPost[] = [
    {
      id: 'post_001',
      author_id: 'amb_001',
      author_name: 'Ananya Sharma',
      author_email: 'ananya@college.edu',
      author_college: 'IIT Delhi',
      title: 'Tips for Social Media Campaign Success',
      content: 'Hey everyone! I wanted to share some strategies that have worked well for my recent social media campaigns. Here are the key points: 1. Know your audience 2. Use relevant hashtags 3. Post consistently...',
      timestamp: '2024-01-15 13:45:00',
      likes: 15,
      comments: 8,
      status: 'pinned',
      category: 'help',
      visibility: 'public',
      reported_count: 0
    },
    {
      id: 'post_002',
      author_id: 'amb_002',
      author_name: 'Rahul Kumar',
      author_email: 'rahul@college.edu',
      author_college: 'IIT Bombay',
      title: 'Campus Event Planning Guide',
      content: 'Planning a tech event on campus can be challenging. Here\'s what I learned from organizing our recent workshop: venue booking, speaker coordination, and marketing strategies...',
      timestamp: '2024-01-15 12:30:00',
      likes: 12,
      comments: 5,
      status: 'active',
      category: 'events',
      visibility: 'ambassadors_only',
      reported_count: 0
    },
    {
      id: 'post_003',
      author_id: 'amb_003',
      author_name: 'Priya Patel',
      author_email: 'priya@college.edu',
      author_college: 'IIT Madras',
      title: 'Reached 1000 Points Milestone!',
      content: 'Just hit 1000 points! Thank you to everyone who supported me. Special thanks to the admin team for the amazing tasks and opportunities.',
      timestamp: '2024-01-15 11:15:00',
      likes: 25,
      comments: 12,
      status: 'active',
      category: 'achievements',
      visibility: 'public',
      reported_count: 0
    },
    {
      id: 'post_004',
      author_id: 'amb_004',
      author_name: 'Arjun Singh',
      author_email: 'arjun@college.edu',
      author_college: 'IIT Kanpur',
      title: 'Issues with Task Submission Portal',
      content: 'Is anyone else having trouble uploading files to the task submission portal? It keeps showing an error message.',
      timestamp: '2024-01-15 10:20:00',
      likes: 3,
      comments: 7,
      status: 'flagged',
      category: 'help',
      visibility: 'ambassadors_only',
      reported_count: 2
    },
    {
      id: 'post_005',
      author_id: 'amb_005',
      author_name: 'Sneha Reddy',
      author_email: 'sneha@college.edu',
      author_college: 'IIT Hyderabad',
      title: 'Suggestion for New Task Categories',
      content: 'I think we should have more creative tasks like video content creation and podcast participation. What do you all think?',
      timestamp: '2024-01-15 09:45:00',
      likes: 8,
      comments: 15,
      status: 'active',
      category: 'feedback',
      visibility: 'public',
      reported_count: 0
    }
  ];

  const sampleAnnouncements: Announcement[] = [
    {
      id: 'ann_001',
      title: 'New Task Categories Available',
      content: 'We\'ve added new task categories including video content creation and podcast participation. Check them out in your dashboard!',
      created_by: 'Admin Team',
      created_at: '2024-01-15 14:00:00',
      priority: 'high',
      target_audience: 'all',
      status: 'active'
    },
    {
      id: 'ann_002',
      title: 'Monthly Leaderboard Winners',
      content: 'Congratulations to our top performers this month! Check the leaderboard for full rankings and rewards.',
      created_by: 'Admin Team',
      created_at: '2024-01-14 16:30:00',
      priority: 'medium',
      target_audience: 'ambassadors',
      status: 'active'
    },
    {
      id: 'ann_003',
      title: 'System Maintenance Scheduled',
      content: 'Scheduled maintenance on January 20th from 2:00 AM to 4:00 AM UTC. Some features may be temporarily unavailable.',
      created_by: 'Tech Team',
      created_at: '2024-01-13 10:00:00',
      priority: 'high',
      target_audience: 'all',
      status: 'scheduled'
    }
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 1000));
        setStats(sampleStats);
        setPosts(samplePosts);
        setAnnouncements(sampleAnnouncements);
      } catch (error) {
        console.error('Error fetching community data:', error);
        setStats(sampleStats);
        setPosts(samplePosts);
        setAnnouncements(sampleAnnouncements);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-400 bg-green-900/20';
      case 'flagged': return 'text-red-400 bg-red-900/20';
      case 'hidden': return 'text-gray-400 bg-gray-900/20';
      case 'pinned': return 'text-purple-400 bg-purple-900/20';
      default: return 'text-gray-400 bg-gray-900/20';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'general': return 'text-blue-400 bg-blue-900/20';
      case 'help': return 'text-yellow-400 bg-yellow-900/20';
      case 'events': return 'text-green-400 bg-green-900/20';
      case 'achievements': return 'text-purple-400 bg-purple-900/20';
      case 'feedback': return 'text-orange-400 bg-orange-900/20';
      default: return 'text-gray-400 bg-gray-900/20';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-400 bg-red-900/20';
      case 'medium': return 'text-yellow-400 bg-yellow-900/20';
      case 'low': return 'text-green-400 bg-green-900/20';
      default: return 'text-gray-400 bg-gray-900/20';
    }
  };

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.author_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || post.category === selectedCategory;
    const matchesStatus = selectedStatus === 'all' || post.status === selectedStatus;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handlePostAction = (post: CommunityPost, action: string) => {
    switch (action) {
      case 'view':
        setSelectedPost(post);
        setShowPostModal(true);
        break;
      case 'pin':
        setPosts(posts.map(p => 
          p.id === post.id ? { ...p, status: p.status === 'pinned' ? 'active' : 'pinned' } : p
        ));
        break;
      case 'hide':
        setPosts(posts.map(p => 
          p.id === post.id ? { ...p, status: 'hidden' } : p
        ));
        break;
      case 'flag':
        setPosts(posts.map(p => 
          p.id === post.id ? { ...p, status: 'flagged' } : p
        ));
        break;
      case 'delete':
        if (confirm(`Are you sure you want to delete "${post.title}"?`)) {
          setPosts(posts.filter(p => p.id !== post.id));
        }
        break;
      default:
        break;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-xl text-gray-400">Loading community...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-800">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold">Community Management</h1>
          <span className="px-3 py-1 bg-purple-600 text-white text-sm rounded-full">Moderation</span>
        </div>
        
        <div className="flex items-center space-x-4">
          <Button 
            onClick={() => setShowAnnouncementModal(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Announcement
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-medium">Total Posts</p>
                  <p className="text-2xl font-bold text-white mt-1">{stats?.total_posts}</p>
                  <p className="text-blue-400 text-xs mt-1">Community content</p>
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
                  <p className="text-gray-400 text-sm font-medium">Active Discussions</p>
                  <p className="text-2xl font-bold text-white mt-1">{stats?.active_discussions}</p>
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
                  <p className="text-gray-400 text-sm font-medium">Flagged Posts</p>
                  <p className="text-2xl font-bold text-white mt-1">{stats?.flagged_posts}</p>
                  <p className="text-red-400 text-xs mt-1">Need review</p>
                </div>
                <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center">
                  <Flag className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-medium">Participants</p>
                  <p className="text-2xl font-bold text-white mt-1">{stats?.total_participants}</p>
                  <p className="text-purple-400 text-xs mt-1">Active members</p>
                </div>
                <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
                  <Users className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-2 mb-6">
          <button
            onClick={() => setActiveTab('posts')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'posts'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Posts & Discussions
          </button>
          <button
            onClick={() => setActiveTab('announcements')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'announcements'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Announcements
          </button>
        </div>

        {/* Posts Tab */}
        {activeTab === 'posts' && (
          <>
            {/* Filters */}
            <Card className="bg-gray-800 border-gray-700 mb-6">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                  <div className="flex flex-wrap gap-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-300 text-sm">Category:</span>
                      <select 
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value as any)}
                        className="bg-gray-700 border-gray-600 text-white rounded px-3 py-1 text-sm"
                      >
                        <option value="all">All Categories</option>
                        <option value="general">General</option>
                        <option value="help">Help</option>
                        <option value="events">Events</option>
                        <option value="achievements">Achievements</option>
                        <option value="feedback">Feedback</option>
                      </select>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-300 text-sm">Status:</span>
                      <select 
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value as any)}
                        className="bg-gray-700 border-gray-600 text-white rounded px-3 py-1 text-sm"
                      >
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="pinned">Pinned</option>
                        <option value="flagged">Flagged</option>
                        <option value="hidden">Hidden</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <Input
                      placeholder="Search posts..."
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

            {/* Posts List */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Community Posts</CardTitle>
                <CardDescription className="text-gray-400">
                  Moderate and manage community discussions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredPosts.map((post) => (
                    <div key={post.id} className="p-4 bg-gray-700 rounded-lg">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h4 className="text-white font-medium">{post.title}</h4>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${getCategoryColor(post.category)}`}>
                              {post.category}
                            </span>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(post.status)}`}>
                              {post.status}
                            </span>
                            {post.visibility === 'public' ? (
                              <Globe className="h-4 w-4 text-blue-400" />
                            ) : post.visibility === 'ambassadors_only' ? (
                              <Lock className="h-4 w-4 text-yellow-400" />
                            ) : (
                              <Unlock className="h-4 w-4 text-red-400" />
                            )}
                          </div>
                          <p className="text-gray-300 text-sm mb-2 line-clamp-2">{post.content}</p>
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <span>by {post.author_name} from {post.author_college}</span>
                            <span>{post.timestamp}</span>
                            <span>{post.likes} likes</span>
                            <span>{post.comments} comments</span>
                            {post.reported_count > 0 && (
                              <span className="text-red-400">{post.reported_count} reports</span>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2 ml-4">
                          <button
                            onClick={() => handlePostAction(post, 'view')}
                            className="p-1 text-blue-400 hover:text-blue-300"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handlePostAction(post, 'pin')}
                            className="p-1 text-purple-400 hover:text-purple-300"
                          >
                            <Pin className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handlePostAction(post, 'flag')}
                            className="p-1 text-yellow-400 hover:text-yellow-300"
                          >
                            <Flag className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handlePostAction(post, 'hide')}
                            className="p-1 text-gray-400 hover:text-gray-300"
                          >
                            <Ban className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handlePostAction(post, 'delete')}
                            className="p-1 text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Announcements Tab */}
        {activeTab === 'announcements' && (
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">System Announcements</CardTitle>
              <CardDescription className="text-gray-400">
                Manage official announcements and notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {announcements.map((announcement) => (
                  <div key={announcement.id} className="p-4 bg-gray-700 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="text-white font-medium">{announcement.title}</h4>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(announcement.priority)}`}>
                            {announcement.priority}
                          </span>
                          <span className="px-2 py-1 rounded text-xs font-medium bg-blue-900/20 text-blue-400">
                            {announcement.target_audience}
                          </span>
                        </div>
                        <p className="text-gray-300 text-sm mb-2">{announcement.content}</p>
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span>by {announcement.created_by}</span>
                          <span>{announcement.created_at}</span>
                          <span className="capitalize">{announcement.status}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-4">
                        <button className="p-1 text-blue-400 hover:text-blue-300">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button className="p-1 text-red-400 hover:text-red-300">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Post Detail Modal */}
        {showPostModal && selectedPost && (
          <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true">
            <div className="absolute inset-0 bg-black/70" onClick={() => setShowPostModal(false)}></div>
            <div className="relative w-full max-w-2xl mx-4 bg-gray-900 rounded-lg border border-gray-700 shadow-xl">
              <div className="flex items-center justify-between p-6 border-b border-gray-800">
                <h3 className="text-lg font-semibold text-white">Post Details</h3>
                <button
                  onClick={() => setShowPostModal(false)}
                  className="text-gray-400 hover:text-white"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="text-white font-medium text-lg">{selectedPost.title}</h4>
                    <div className="flex items-center space-x-3 mt-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getCategoryColor(selectedPost.category)}`}>
                        {selectedPost.category}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedPost.status)}`}>
                        {selectedPost.status}
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-gray-300">{selectedPost.content}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-400 text-sm">Author</p>
                      <p className="text-white">{selectedPost.author_name}</p>
                      <p className="text-gray-400 text-sm">{selectedPost.author_email}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">College</p>
                      <p className="text-white">{selectedPost.author_college}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Posted</p>
                      <p className="text-white">{selectedPost.timestamp}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Engagement</p>
                      <p className="text-white">{selectedPost.likes} likes, {selectedPost.comments} comments</p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <Button
                    onClick={() => setShowPostModal(false)}
                    variant="outline"
                    className="border-gray-700 text-gray-300 hover:bg-gray-800"
                  >
                    Close
                  </Button>
                  <Button className="bg-purple-600 hover:bg-purple-700">
                    <Pin className="h-4 w-4 mr-2" />
                    Pin Post
                  </Button>
                  <Button className="bg-red-600 hover:bg-red-700">
                    <Flag className="h-4 w-4 mr-2" />
                    Flag Content
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

export default Community;
