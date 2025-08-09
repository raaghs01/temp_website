import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  History as HistoryIcon, 
  Clock, 
  User, 
  Activity,
  Search,
  Filter,
  Download,
  Eye,
  AlertTriangle,
  CheckCircle,
  Info,
  XCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface SystemEvent {
  id: string;
  timestamp: string;
  event_type: 'user_action' | 'system_action' | 'security_event' | 'error_event' | 'admin_action';
  category: string;
  description: string;
  user_id?: string;
  user_name?: string;
  user_email?: string;
  ip_address?: string;
  details: Record<string, any>;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'completed' | 'failed' | 'pending';
}

interface ActivityStats {
  total_events: number;
  events_today: number;
  critical_events: number;
  failed_actions: number;
}

const History: React.FC = () => {
  const [events, setEvents] = useState<SystemEvent[]>([]);
  const [stats, setStats] = useState<ActivityStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | 'user_action' | 'system_action' | 'security_event' | 'error_event' | 'admin_action'>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<'all' | 'low' | 'medium' | 'high' | 'critical'>('all');
  const [selectedEvent, setSelectedEvent] = useState<SystemEvent | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);

  const sampleStats: ActivityStats = {
    total_events: 1247,
    events_today: 89,
    critical_events: 3,
    failed_actions: 12
  };

  const sampleEvents: SystemEvent[] = [
    {
      id: 'evt_001',
      timestamp: '2024-01-15 14:30:22',
      event_type: 'admin_action',
      category: 'User Management',
      description: 'Admin suspended ambassador account',
      user_id: 'admin_001',
      user_name: 'Admin User',
      user_email: 'admin@test.com',
      ip_address: '192.168.1.100',
      details: {
        target_user: 'ambassador@college.edu',
        reason: 'Policy violation',
        action: 'suspend_account'
      },
      severity: 'medium',
      status: 'completed'
    },
    {
      id: 'evt_002',
      timestamp: '2024-01-15 14:25:15',
      event_type: 'user_action',
      category: 'Authentication',
      description: 'User login successful',
      user_id: 'amb_001',
      user_name: 'Ananya Sharma',
      user_email: 'ananya@college.edu',
      ip_address: '203.0.113.45',
      details: {
        login_method: 'email_password',
        device: 'Chrome on Windows',
        location: 'Delhi, India'
      },
      severity: 'low',
      status: 'completed'
    },
    {
      id: 'evt_003',
      timestamp: '2024-01-15 14:20:08',
      event_type: 'system_action',
      category: 'Task Management',
      description: 'Automated task assignment completed',
      details: {
        task_id: 'task_001',
        assigned_count: 145,
        completion_rate: '89%',
        automated: true
      },
      severity: 'low',
      status: 'completed'
    },
    {
      id: 'evt_004',
      timestamp: '2024-01-15 14:15:33',
      event_type: 'security_event',
      category: 'Security',
      description: 'Multiple failed login attempts detected',
      ip_address: '198.51.100.42',
      details: {
        attempts: 5,
        target_email: 'test@example.com',
        blocked: true,
        threat_level: 'medium'
      },
      severity: 'high',
      status: 'completed'
    },
    {
      id: 'evt_005',
      timestamp: '2024-01-15 14:10:18',
      event_type: 'error_event',
      category: 'System Error',
      description: 'Database connection timeout',
      details: {
        error_code: 'DB_TIMEOUT_001',
        duration: '30s',
        affected_users: 12,
        auto_recovery: true
      },
      severity: 'critical',
      status: 'failed'
    },
    {
      id: 'evt_006',
      timestamp: '2024-01-15 14:05:42',
      event_type: 'user_action',
      category: 'Task Submission',
      description: 'Ambassador submitted task for review',
      user_id: 'amb_002',
      user_name: 'Rahul Kumar',
      user_email: 'rahul@college.edu',
      ip_address: '203.0.113.67',
      details: {
        task_id: 'task_015',
        task_title: 'Social Media Campaign',
        submission_type: 'file_upload',
        file_count: 3
      },
      severity: 'low',
      status: 'completed'
    },
    {
      id: 'evt_007',
      timestamp: '2024-01-15 14:00:11',
      event_type: 'admin_action',
      category: 'System Configuration',
      description: 'System settings updated',
      user_id: 'admin_001',
      user_name: 'Admin User',
      user_email: 'admin@test.com',
      ip_address: '192.168.1.100',
      details: {
        section: 'notifications',
        changes: ['email_notifications: true', 'alert_threshold: 85'],
        previous_values: ['email_notifications: false', 'alert_threshold: 90']
      },
      severity: 'medium',
      status: 'completed'
    }
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 1000));
        setStats(sampleStats);
        setEvents(sampleEvents);
      } catch (error) {
        console.error('Error fetching history:', error);
        setStats(sampleStats);
        setEvents(sampleEvents);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getEventIcon = (type: string, severity: string) => {
    if (severity === 'critical') return <XCircle className="h-5 w-5 text-red-400" />;
    if (severity === 'high') return <AlertTriangle className="h-5 w-5 text-orange-400" />;
    
    switch (type) {
      case 'user_action': return <User className="h-5 w-5 text-blue-400" />;
      case 'admin_action': return <User className="h-5 w-5 text-purple-400" />;
      case 'system_action': return <Activity className="h-5 w-5 text-green-400" />;
      case 'security_event': return <AlertTriangle className="h-5 w-5 text-yellow-400" />;
      case 'error_event': return <XCircle className="h-5 w-5 text-red-400" />;
      default: return <Info className="h-5 w-5 text-gray-400" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-400 bg-red-900/20';
      case 'high': return 'text-orange-400 bg-orange-900/20';
      case 'medium': return 'text-yellow-400 bg-yellow-900/20';
      case 'low': return 'text-green-400 bg-green-900/20';
      default: return 'text-gray-400 bg-gray-900/20';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-400';
      case 'failed': return 'text-red-400';
      case 'pending': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (event.user_name && event.user_name.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = selectedType === 'all' || event.event_type === selectedType;
    const matchesSeverity = selectedSeverity === 'all' || event.severity === selectedSeverity;
    
    return matchesSearch && matchesType && matchesSeverity;
  });

  const handleEventClick = (event: SystemEvent) => {
    setSelectedEvent(event);
    setShowEventModal(true);
  };

  const exportHistory = () => {
    alert('Exporting activity history...');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-xl text-gray-400">Loading activity history...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-800">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold">System Activity</h1>
          <span className="px-3 py-1 bg-purple-600 text-white text-sm rounded-full">Audit Trail</span>
        </div>
        
        <div className="flex items-center space-x-4">
          <Button onClick={exportHistory} className="bg-blue-600 hover:bg-blue-700">
            <Download className="h-4 w-4 mr-2" />
            Export History
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
                  <p className="text-gray-400 text-sm font-medium">Total Events</p>
                  <p className="text-2xl font-bold text-white mt-1">{stats?.total_events}</p>
                  <p className="text-blue-400 text-xs mt-1">All time</p>
                </div>
                <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                  <HistoryIcon className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-medium">Events Today</p>
                  <p className="text-2xl font-bold text-white mt-1">{stats?.events_today}</p>
                  <p className="text-green-400 text-xs mt-1">Last 24 hours</p>
                </div>
                <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                  <Clock className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-medium">Critical Events</p>
                  <p className="text-2xl font-bold text-white mt-1">{stats?.critical_events}</p>
                  <p className="text-red-400 text-xs mt-1">Require attention</p>
                </div>
                <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-medium">Failed Actions</p>
                  <p className="text-2xl font-bold text-white mt-1">{stats?.failed_actions}</p>
                  <p className="text-yellow-400 text-xs mt-1">Need investigation</p>
                </div>
                <div className="w-12 h-12 bg-yellow-600 rounded-lg flex items-center justify-center">
                  <XCircle className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="bg-gray-800 border-gray-700 mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              <div className="flex flex-wrap gap-2">
                <div className="flex items-center space-x-2">
                  <span className="text-gray-300 text-sm">Type:</span>
                  <select 
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value as any)}
                    className="bg-gray-700 border-gray-600 text-white rounded px-3 py-1 text-sm"
                  >
                    <option value="all">All Types</option>
                    <option value="user_action">User Actions</option>
                    <option value="admin_action">Admin Actions</option>
                    <option value="system_action">System Actions</option>
                    <option value="security_event">Security Events</option>
                    <option value="error_event">Error Events</option>
                  </select>
                </div>
                
                <div className="flex items-center space-x-2">
                  <span className="text-gray-300 text-sm">Severity:</span>
                  <select 
                    value={selectedSeverity}
                    onChange={(e) => setSelectedSeverity(e.target.value as any)}
                    className="bg-gray-700 border-gray-600 text-white rounded px-3 py-1 text-sm"
                  >
                    <option value="all">All Levels</option>
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <Input
                  placeholder="Search events..."
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

        {/* Activity Timeline */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Activity Timeline</CardTitle>
            <CardDescription className="text-gray-400">
              Comprehensive log of all system activities and user actions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredEvents.map((event) => (
                <div 
                  key={event.id} 
                  className="flex items-start space-x-4 p-4 bg-gray-700 rounded-lg hover:bg-gray-650 cursor-pointer transition-colors"
                  onClick={() => handleEventClick(event)}
                >
                  <div className="flex-shrink-0 mt-1">
                    {getEventIcon(event.event_type, event.severity)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="text-white font-medium">{event.description}</h4>
                        <div className="flex items-center space-x-4 mt-1">
                          <span className="text-gray-400 text-sm">{event.category}</span>
                          {event.user_name && (
                            <span className="text-gray-400 text-sm">by {event.user_name}</span>
                          )}
                          {event.ip_address && (
                            <span className="text-gray-400 text-sm">from {event.ip_address}</span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3 ml-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(event.severity)}`}>
                          {event.severity}
                        </span>
                        <span className={`capitalize ${getStatusColor(event.status)}`}>
                          {event.status}
                        </span>
                        <button className="text-blue-400 hover:text-blue-300">
                          <Eye className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-gray-500 text-sm">{event.timestamp}</span>
                      <span className="text-gray-500 text-sm capitalize">
                        {event.event_type.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Event Detail Modal */}
        {showEventModal && selectedEvent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true">
            <div className="absolute inset-0 bg-black/70" onClick={() => setShowEventModal(false)}></div>
            <div className="relative w-full max-w-2xl mx-4 bg-gray-900 rounded-lg border border-gray-700 shadow-xl">
              <div className="flex items-center justify-between p-6 border-b border-gray-800">
                <h3 className="text-lg font-semibold text-white">Event Details</h3>
                <button
                  onClick={() => setShowEventModal(false)}
                  className="text-gray-400 hover:text-white"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    {getEventIcon(selectedEvent.event_type, selectedEvent.severity)}
                    <h4 className="text-white font-medium text-lg">{selectedEvent.description}</h4>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-400 text-sm">Timestamp</p>
                      <p className="text-white">{selectedEvent.timestamp}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Category</p>
                      <p className="text-white">{selectedEvent.category}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Event Type</p>
                      <p className="text-white capitalize">{selectedEvent.event_type.replace('_', ' ')}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Severity</p>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getSeverityColor(selectedEvent.severity)}`}>
                        {selectedEvent.severity}
                      </span>
                    </div>
                    {selectedEvent.user_name && (
                      <>
                        <div>
                          <p className="text-gray-400 text-sm">User</p>
                          <p className="text-white">{selectedEvent.user_name}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-sm">Email</p>
                          <p className="text-white">{selectedEvent.user_email}</p>
                        </div>
                      </>
                    )}
                    {selectedEvent.ip_address && (
                      <div>
                        <p className="text-gray-400 text-sm">IP Address</p>
                        <p className="text-white">{selectedEvent.ip_address}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-gray-400 text-sm">Status</p>
                      <span className={`capitalize ${getStatusColor(selectedEvent.status)}`}>
                        {selectedEvent.status}
                      </span>
                    </div>
                  </div>

                  {Object.keys(selectedEvent.details).length > 0 && (
                    <div>
                      <p className="text-gray-400 text-sm mb-2">Additional Details</p>
                      <div className="bg-gray-800 rounded-lg p-4">
                        <pre className="text-gray-300 text-sm whitespace-pre-wrap">
                          {JSON.stringify(selectedEvent.details, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-6 flex justify-end">
                  <Button
                    onClick={() => setShowEventModal(false)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Close
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

export default History;
