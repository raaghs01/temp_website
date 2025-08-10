import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Calendar, 
  MapPin, 
  Users, 
  Clock,
  Plus,
  Edit,
  Trash2,
  Eye,
  Send,
  CheckCircle,
  XCircle,
  Filter,
  Search
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Event {
  id: string;
  title: string;
  description: string;
  type: 'webinar' | 'workshop' | 'networking' | 'competition' | 'meetup';
  date: string;
  time: string;
  duration: string;
  location: string;
  venue_type: 'online' | 'offline' | 'hybrid';
  max_participants: number;
  registered_participants: number;
  status: 'draft' | 'published' | 'ongoing' | 'completed' | 'cancelled';
  organizer: string;
  registration_deadline: string;
  created_by: string;
  created_at: string;
  tags: string[];
  requirements: string[];
  agenda?: string[];
}

interface EventStats {
  total_events: number;
  upcoming_events: number;
  ongoing_events: number;
  total_participants: number;
}

const Events: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [stats, setStats] = useState<EventStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | 'webinar' | 'workshop' | 'networking' | 'competition' | 'meetup'>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'draft' | 'published' | 'ongoing' | 'completed' | 'cancelled'>('all');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const sampleStats: EventStats = {
    total_events: 28,
    upcoming_events: 12,
    ongoing_events: 3,
    total_participants: 456
  };

  const sampleEvents: Event[] = [
    {
      id: 'evt_001',
      title: 'AI & Machine Learning Workshop',
      description: 'Comprehensive workshop covering the fundamentals of AI and Machine Learning with hands-on projects and real-world applications.',
      type: 'workshop',
      date: '2024-01-25',
      time: '14:00',
      duration: '3 hours',
      location: 'Virtual Event',
      venue_type: 'online',
      max_participants: 100,
      registered_participants: 75,
      status: 'published',
      organizer: 'Dr. Sarah Johnson',
      registration_deadline: '2024-01-23',
      created_by: 'admin@test.com',
      created_at: '2024-01-10',
      tags: ['AI', 'Machine Learning', 'Technology', 'Workshop'],
      requirements: ['Basic programming knowledge', 'Laptop with Python installed'],
      agenda: [
        'Introduction to AI and ML concepts',
        'Hands-on coding session',
        'Building your first ML model',
        'Q&A and networking'
      ]
    },
    {
      id: 'evt_002',
      title: 'Campus Ambassador Networking Mixer',
      description: 'Monthly networking event for campus ambassadors to share experiences, best practices, and build connections.',
      type: 'networking',
      date: '2024-01-22',
      time: '18:00',
      duration: '2 hours',
      location: 'Mumbai, India',
      venue_type: 'offline',
      max_participants: 50,
      registered_participants: 42,
      status: 'published',
      organizer: 'Events Team',
      registration_deadline: '2024-01-20',
      created_by: 'admin@test.com',
      created_at: '2024-01-08',
      tags: ['Networking', 'Campus', 'Ambassadors', 'Community'],
      requirements: ['Active ambassador status', 'Valid ID for venue entry'],
      agenda: [
        'Welcome and introductions',
        'Experience sharing session',
        'Group activities and games',
        'Closing remarks and photos'
      ]
    },
    {
      id: 'evt_003',
      title: 'Product Innovation Challenge',
      description: 'A 48-hour hackathon where teams compete to create innovative solutions using our platform APIs.',
      type: 'competition',
      date: '2024-01-28',
      time: '09:00',
      duration: '48 hours',
      location: 'Bangalore Tech Park',
      venue_type: 'offline',
      max_participants: 200,
      registered_participants: 156,
      status: 'published',
      organizer: 'Tech Team',
      registration_deadline: '2024-01-26',
      created_by: 'admin@test.com',
      created_at: '2024-01-05',
      tags: ['Hackathon', 'Innovation', 'Competition', 'Technology'],
      requirements: ['Team of 2-4 members', 'Programming experience', 'Own laptops'],
      agenda: [
        'Opening ceremony and problem statement',
        'Hacking begins',
        'Mentor check-ins',
        'Final presentations and judging',
        'Award ceremony'
      ]
    },
    {
      id: 'evt_004',
      title: 'Digital Marketing Masterclass',
      description: 'Learn advanced digital marketing strategies, social media optimization, and campaign management.',
      type: 'webinar',
      date: '2024-01-30',
      time: '16:00',
      duration: '90 minutes',
      location: 'Zoom Webinar',
      venue_type: 'online',
      max_participants: 500,
      registered_participants: 234,
      status: 'published',
      organizer: 'Marketing Team',
      registration_deadline: '2024-01-29',
      created_by: 'admin@test.com',
      created_at: '2024-01-12',
      tags: ['Marketing', 'Digital', 'Strategy', 'Webinar'],
      requirements: ['No prior experience needed', 'Notebook for taking notes'],
      agenda: [
        'Introduction to digital marketing',
        'Social media strategies',
        'Campaign optimization techniques',
        'Live Q&A session'
      ]
    },
    {
      id: 'evt_005',
      title: 'Startup Pitch Competition',
      description: 'Opportunity for student entrepreneurs to pitch their startup ideas to industry experts and investors.',
      type: 'competition',
      date: '2024-02-05',
      time: '10:00',
      duration: '4 hours',
      location: 'Delhi Innovation Hub',
      venue_type: 'hybrid',
      max_participants: 80,
      registered_participants: 23,
      status: 'draft',
      organizer: 'Business Team',
      registration_deadline: '2024-02-03',
      created_by: 'admin@test.com',
      created_at: '2024-01-15',
      tags: ['Startup', 'Pitch', 'Competition', 'Entrepreneurship'],
      requirements: ['Business plan or pitch deck', 'University student status'],
      agenda: [
        'Registration and networking breakfast',
        'Pitch presentations (5 min each)',
        'Investor panel feedback',
        'Awards and closing ceremony'
      ]
    }
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 1000));
        setStats(sampleStats);
        setEvents(sampleEvents);
      } catch (error) {
        console.error('Error fetching events:', error);
        setStats(sampleStats);
        setEvents(sampleEvents);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'webinar': return 'text-blue-400 bg-blue-900/20';
      case 'workshop': return 'text-green-400 bg-green-900/20';
      case 'networking': return 'text-purple-400 bg-purple-900/20';
      case 'competition': return 'text-red-400 bg-red-900/20';
      case 'meetup': return 'text-yellow-400 bg-yellow-900/20';
      default: return 'text-gray-400 bg-gray-900/20';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'text-green-400';
      case 'draft': return 'text-gray-400';
      case 'ongoing': return 'text-blue-400';
      case 'completed': return 'text-purple-400';
      case 'cancelled': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getVenueIcon = (venueType: string) => {
    switch (venueType) {
      case 'online': return '🌐';
      case 'offline': return '📍';
      case 'hybrid': return '🔄';
      default: return '📍';
    }
  };

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.organizer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'all' || event.type === selectedType;
    const matchesStatus = selectedStatus === 'all' || event.status === selectedStatus;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const handleEventAction = (event: Event, action: string) => {
    switch (action) {
      case 'view':
        setSelectedEvent(event);
        setShowEventModal(true);
        break;
      case 'edit':
        alert(`Editing event: ${event.title}`);
        break;
      case 'delete':
        if (confirm(`Are you sure you want to delete "${event.title}"?`)) {
          setEvents(events.filter(e => e.id !== event.id));
        }
        break;
      case 'publish':
        setEvents(events.map(e => 
          e.id === event.id ? { ...e, status: 'published' } : e
        ));
        break;
      case 'cancel':
        if (confirm(`Are you sure you want to cancel "${event.title}"?`)) {
          setEvents(events.map(e => 
            e.id === event.id ? { ...e, status: 'cancelled' } : e
          ));
        }
        break;
      default:
        break;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-xl text-gray-400">Loading events...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-800">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold">Event Management</h1>
        </div>
        
        <div className="flex items-center space-x-4">
          <Button 
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Event
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
                  <Calendar className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-medium">Upcoming Events</p>
                  <p className="text-2xl font-bold text-white mt-1">{stats?.upcoming_events}</p>
                  <p className="text-green-400 text-xs mt-1">Scheduled</p>
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
                  <p className="text-gray-400 text-sm font-medium">Ongoing Events</p>
                  <p className="text-2xl font-bold text-white mt-1">{stats?.ongoing_events}</p>
                  <p className="text-yellow-400 text-xs mt-1">Live now</p>
                </div>
                <div className="w-12 h-12 bg-yellow-600 rounded-lg flex items-center justify-center">
                  <Users className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-medium">Total Participants</p>
                  <p className="text-2xl font-bold text-white mt-1">{stats?.total_participants}</p>
                  <p className="text-purple-400 text-xs mt-1">Registered</p>
                </div>
                <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
                  <Users className="h-6 w-6 text-white" />
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
                    <option value="webinar">Webinars</option>
                    <option value="workshop">Workshops</option>
                    <option value="networking">Networking</option>
                    <option value="competition">Competitions</option>
                    <option value="meetup">Meetups</option>
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
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="ongoing">Ongoing</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
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

        {/* Events List */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Event Calendar</CardTitle>
            <CardDescription className="text-gray-400">
              Manage all events and registrations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {filteredEvents.map((event) => (
                <div key={event.id} className="p-6 bg-gray-700 rounded-lg">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="text-white font-bold text-lg">{event.title}</h4>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getTypeColor(event.type)}`}>
                          {event.type}
                        </span>
                        <span className={`capitalize ${getStatusColor(event.status)}`}>
                          {event.status}
                        </span>
                      </div>
                      <p className="text-gray-300 mb-3">{event.description}</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-blue-400" />
                          <span className="text-gray-300">{event.date} at {event.time}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-green-400" />
                          <span className="text-gray-300">{event.duration}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-4 w-4 text-purple-400" />
                          <span className="text-gray-300">{getVenueIcon(event.venue_type)} {event.location}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Users className="h-4 w-4 text-yellow-400" />
                          <span className="text-gray-300">
                            {event.registered_participants}/{event.max_participants} registered
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4 mt-3 text-xs text-gray-500">
                        <span>Organizer: {event.organizer}</span>
                        <span>Registration deadline: {event.registration_deadline}</span>
                        <span>Created: {event.created_at}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-6">
                      <button
                        onClick={() => handleEventAction(event, 'view')}
                        className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-900/20 rounded"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleEventAction(event, 'edit')}
                        className="p-2 text-yellow-400 hover:text-yellow-300 hover:bg-yellow-900/20 rounded"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      {event.status === 'draft' && (
                        <button
                          onClick={() => handleEventAction(event, 'publish')}
                          className="p-2 text-green-400 hover:text-green-300 hover:bg-green-900/20 rounded"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </button>
                      )}
                      {(event.status === 'published' || event.status === 'ongoing') && (
                        <button
                          onClick={() => handleEventAction(event, 'cancel')}
                          className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded"
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleEventAction(event, 'delete')}
                        className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  
                  {/* Progress bar for registrations */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-400 text-sm">Registration Progress</span>
                      <span className="text-gray-400 text-sm">
                        {Math.round((event.registered_participants / event.max_participants) * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-600 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(event.registered_participants / event.max_participants) * 100}%` }}
                      ></div>
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
            <div className="relative w-full max-w-4xl mx-4 bg-gray-900 rounded-lg border border-gray-700 shadow-xl max-h-[90vh] overflow-y-auto">
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
                <div className="space-y-6">
                  <div>
                    <h4 className="text-white font-bold text-xl mb-2">{selectedEvent.title}</h4>
                    <div className="flex items-center space-x-3 mb-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getTypeColor(selectedEvent.type)}`}>
                        {selectedEvent.type}
                      </span>
                      <span className={`capitalize ${getStatusColor(selectedEvent.status)}`}>
                        {selectedEvent.status}
                      </span>
                    </div>
                    <p className="text-gray-300">{selectedEvent.description}</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h5 className="text-white font-medium mb-3">Event Details</h5>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-blue-400" />
                          <span className="text-gray-300">{selectedEvent.date} at {selectedEvent.time}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-green-400" />
                          <span className="text-gray-300">Duration: {selectedEvent.duration}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-4 w-4 text-purple-400" />
                          <span className="text-gray-300">{getVenueIcon(selectedEvent.venue_type)} {selectedEvent.location}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Users className="h-4 w-4 text-yellow-400" />
                          <span className="text-gray-300">
                            {selectedEvent.registered_participants}/{selectedEvent.max_participants} participants
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h5 className="text-white font-medium mb-3">Organization</h5>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-gray-400">Organizer:</span>
                          <span className="text-white ml-2">{selectedEvent.organizer}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Registration Deadline:</span>
                          <span className="text-white ml-2">{selectedEvent.registration_deadline}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Created By:</span>
                          <span className="text-white ml-2">{selectedEvent.created_by}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Created:</span>
                          <span className="text-white ml-2">{selectedEvent.created_at}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {selectedEvent.requirements.length > 0 && (
                    <div>
                      <h5 className="text-white font-medium mb-3">Requirements</h5>
                      <ul className="list-disc list-inside space-y-1 text-gray-300 text-sm">
                        {selectedEvent.requirements.map((req, index) => (
                          <li key={index}>{req}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {selectedEvent.agenda && selectedEvent.agenda.length > 0 && (
                    <div>
                      <h5 className="text-white font-medium mb-3">Agenda</h5>
                      <ul className="list-decimal list-inside space-y-1 text-gray-300 text-sm">
                        {selectedEvent.agenda.map((item, index) => (
                          <li key={index}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div>
                    <h5 className="text-white font-medium mb-3">Tags</h5>
                    <div className="flex flex-wrap gap-2">
                      {selectedEvent.tags.map((tag, index) => (
                        <span key={index} className="px-2 py-1 bg-gray-700 text-gray-300 rounded text-sm">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <Button
                    onClick={() => setShowEventModal(false)}
                    variant="outline"
                    className="border-gray-700 text-gray-300 hover:bg-gray-800"
                  >
                    Close
                  </Button>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Send className="h-4 w-4 mr-2" />
                    Send Notification
                  </Button>
                  <Button className="bg-green-600 hover:bg-green-700">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Event
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

export default Events;
