import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import './App.css';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff, AlertCircle, CheckCircle, Search, Bell, User, ChevronDown, BarChart3, FileText, ShoppingBag, Users, TrendingUp, Target, MessageSquare, Settings, Star, History, LogOut, Home, Award, Calendar, Activity } from 'lucide-react';

const BACKEND_URL = 'http://127.0.0.1:8000';
const API = `${BACKEND_URL}/api`;

// Debug logging
console.log('BACKEND_URL:', BACKEND_URL);
console.log('API:', API);

// Types
interface User {
  id: string;
  name: string;
  email: string;
  college: string;
  role: 'ambassador' | 'admin';
  total_points: number;
  rank_position: number;
  current_day: number;
  total_referrals: number;
}

interface Ambassador {
  id: string;
  name: string;
  email: string;
  college: string;
  total_points: number;
  rank_position: number;
  current_day: number;
  total_referrals: number;
  events_hosted: number;
  students_reached: number;
  revenue_generated: number;
  social_media_posts: number;
  engagement_rate: number;
  followers_growth: number;
  campaign_days: number;
  status: 'active' | 'inactive';
  last_activity: string;
  join_date: string;
}

interface AdminStats {
  total_ambassadors: number;
  active_ambassadors: number;
  total_revenue: number;
  total_events: number;
  total_students_reached: number;
  average_engagement_rate: number;
  top_performing_college: string;
  monthly_growth: number;
}

interface Task {
  id: string;
  day: number;
  title: string;
  description: string;
  task_type: string;
  points_reward: number;
  is_active: boolean;
}

interface Submission {
  id: string;
  task_id: string;
  user_id: string;
  day: number;
  status_text: string;
  people_connected: number;
  points_earned: number;
  proof_image?: string;
  submission_date: string;
  is_completed: boolean;
}

interface LeaderboardEntry {
  name: string;
  college: string;
  total_points: number;
  total_referrals: number;
  rank: number;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, userData: User) => void;
  logout: () => void;
  loading: boolean;
  refreshUser: () => Promise<void>;
}

// Auth Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      fetchUserProfile();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchUserProfile = async (): Promise<void> => {
    try {
      const response = await axios.get<User>(`${API}/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(response.data);
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = (token: string, userData: User): void => {
    localStorage.setItem('token', token);
    setToken(token);
    setUser(userData);
  };

  const logout = (): void => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading, refreshUser: fetchUserProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

// Login Component
const LoginForm: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [userRole, setUserRole] = useState<'ambassador' | 'admin'>('ambassador');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    college: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const { login } = useAuth();

  const validateForm = (): boolean => {
    setError('');
    setSuccess('');

    // Check for empty required fields
    const missingFields: string[] = [];
    
    if (!formData.email.trim()) {
      missingFields.push('Email');
    }
    
    if (!formData.password) {
      missingFields.push('Password');
    }

    // For registration, check additional fields based on role
    if (!isLogin) {
      if (userRole === 'ambassador') {
        if (!formData.name.trim()) {
          missingFields.push('Full Name');
        }
        if (!formData.college.trim()) {
          missingFields.push('College/University');
        }
      }
      
      if (!confirmPassword) {
        missingFields.push('Confirm Password');
      }
    }

    // If there are missing fields, show specific error
    if (missingFields.length > 0) {
      setError(`Please fill in the following required fields: ${missingFields.join(', ')}`);
      return false;
    }

    // Email validation for both login and registration
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      setError('Please enter a valid email address.');
      return false;
    }

    // Additional validation for registration
    if (!isLogin) {
      if (formData.password !== confirmPassword) {
        setError('Passwords do not match.');
        return false;
      }

      if (formData.password.length < 6) {
        setError('Password must be at least 6 characters long.');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const endpoint = isLogin ? '/login' : '/register';
      const fullUrl = `${API}${endpoint}`;
      const requestData = {
        ...formData,
        role: userRole
      };
      console.log('Making request to:', fullUrl);
      console.log('Request data:', requestData);
      
      const response = await axios.post<{ token: string; user: User }>(fullUrl, requestData);
      
      login(response.data.token, response.data.user);
      setSuccess(isLogin ? 'Login successful!' : 'Account created successfully!');
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 
                          error.response?.data?.message || 
                          error.message || 
                          'An error occurred. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setConfirmPassword(e.target.value);
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleModeSwitch = (): void => {
    setIsLogin(!isLogin);
    setError('');
    setSuccess('');
    setConfirmPassword('');
    setShowPassword(false);
    setShowConfirmPassword(false);
    // Clear form data when switching modes
    setFormData({
      email: '',
      password: '',
      name: '',
      college: ''
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-gray-900 mb-2">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </CardTitle>
          <CardDescription className="text-gray-600">
            {isLogin ? 'Sign in to your account' : 'Join us and start your journey'}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg">
              <CheckCircle className="h-4 w-4 flex-shrink-0" />
              <span className="text-sm">{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Role Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Login As <span className="text-red-500">*</span>
              </label>
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => setUserRole('ambassador')}
                  className={`flex-1 py-2 px-4 rounded-lg border transition-colors ${
                    userRole === 'ambassador'
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  College Ambassador
                </button>
                <button
                  type="button"
                  onClick={() => setUserRole('admin')}
                  className={`flex-1 py-2 px-4 rounded-lg border transition-colors ${
                    userRole === 'admin'
                      ? 'bg-purple-500 text-white border-purple-500'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  DS Team
                </button>
              </div>
              <p className="text-xs text-gray-500">
                {userRole === 'ambassador' 
                  ? 'College ambassadors can register with additional profile information.' 
                  : 'DS Team members can access admin features.'}
              </p>
            </div>

            {!isLogin && userRole === 'ambassador' && (
              <>
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg mb-4">
                  <p className="text-sm text-blue-700">
                    <strong>College Ambassador Registration:</strong> Please provide your full name and college/university for your ambassador profile.
                  </p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="Enter your full name"
                    className={`w-full ${!formData.name.trim() && error.includes('Full Name') ? 'border-red-500 focus:border-red-500' : ''}`}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    College/University <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    name="college"
                    value={formData.college}
                    onChange={handleChange}
                    required
                    placeholder="Enter your college/university"
                    className={`w-full ${!formData.college.trim() && error.includes('College/University') ? 'border-red-500 focus:border-red-500' : ''}`}
                  />
                </div>
              </>
            )}

            {!isLogin && userRole === 'admin' && (
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg mb-4">
                <p className="text-sm text-purple-700">
                  <strong>DS Team Registration:</strong> You only need to provide email and password for admin access.
                </p>
              </div>
            )}
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Email <span className="text-red-500">*</span>
              </label>
              <Input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="Enter your email"
                className={`w-full ${!formData.email.trim() && error.includes('Email') ? 'border-red-500 focus:border-red-500' : ''}`}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  placeholder="Enter your password"
                  className={`w-full pr-10 ${!formData.password && error.includes('Password') ? 'border-red-500 focus:border-red-500' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {!isLogin && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={handleConfirmPasswordChange}
                    required
                    placeholder="Confirm your password"
                    className={`w-full pr-10 ${!confirmPassword && error.includes('Confirm Password') ? 'border-red-500 focus:border-red-500' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  {isLogin ? 'Signing In...' : 'Creating Account...'}
                </div>
              ) : (
                isLogin ? 'Sign In' : 'Sign Up'
              )}
            </Button>
          </form>

          <div className="text-center pt-4">
            <button
              type="button"
              onClick={handleModeSwitch}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors"
            >
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Sidebar Component
interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  user: User | null;
  logout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, user, logout }) => {
  const ambassadorTabs = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'tasks', label: 'Tasks', icon: FileText },
    { id: 'leaderboard', label: 'Leaderboard', icon: Award },
    { id: 'community', label: 'Community', icon: Users },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'reports', label: 'Reports', icon: TrendingUp },
    { id: 'messages', label: 'Messages', icon: MessageSquare },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'events', label: 'Events', icon: Calendar },
    { id: 'history', label: 'History', icon: History }
  ];

  const adminTabs = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'ambassadors', label: 'Ambassadors', icon: Users },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'reports', label: 'Reports', icon: TrendingUp },
    { id: 'messages', label: 'Messages', icon: MessageSquare },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  console.log('Sidebar - User role:', user?.role);
  console.log('Sidebar - Using admin tabs:', user?.role === 'admin');
  
  const tabs = user?.role === 'admin' ? adminTabs : ambassadorTabs;

  return (
    <div className="w-64 bg-gray-900 shadow-lg h-screen fixed left-0 top-0">
      <div className="p-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-lg font-bold text-white">DS Studios</h1>
            <p className="text-xs text-gray-400">
              {user?.role === 'admin' ? 'DC Admin Portal' : 'College Ambassador'}
            </p>
          </div>
          <div className="flex space-x-1">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          </div>
        </div>
        
        <nav className="space-y-1">
          {tabs.map((tab) => {
            const IconComponent = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800'
                }`}
              >
                <IconComponent className="w-5 h-5 mr-3" />
                {tab.label}
              </button>
            );
          })}
        </nav>

        {user && (
          <div className="mt-8 p-4 bg-gray-800 rounded-lg">
            <div className="flex items-center mb-3">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="ml-3">
                <p className="font-semibold text-white">{user.name}</p>
                <p className="text-sm text-gray-400">
                  {user?.role === 'admin' ? 'DC Admin' : user.college}
                </p>
              </div>
            </div>
            {user?.role !== 'admin' && (
              <div className="text-sm text-gray-400">
                <p>Points: {user.total_points}</p>
                <p>Rank: #{user.rank_position}</p>
              </div>
            )}
            <Button
              onClick={logout}
              variant="destructive"
              size="sm"
              className="w-full mt-3"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

// Dashboard Overview Component
interface DashboardOverviewProps {
  user: User | null;
  refreshUser: () => Promise<void>;
}

const DashboardOverview: React.FC<DashboardOverviewProps> = ({ user, refreshUser }) => {
  const [stats, setStats] = useState({
    current_day: 0,
    total_tasks_completed: 0,
    total_points: 0,
    total_referrals: 0,
    rank_position: 0,
    completion_percentage: 0,
    next_task: null,
    user_name: '',
    college: ''
  });

  const fetchDashboardStats = async (): Promise<void> => {
    try {
      const response = await axios.get(`${API}/dashboard-stats`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const handleTaskComplete = (): void => {
    refreshUser();
    fetchDashboardStats();
  };

  const getRankDisplay = (rank: number): string => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  if (!user) return null;

  return (
    <div className="p-8 bg-gray-900 min-h-screen">
      {/* Top Bar */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Dashboard</h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search here..."
              className="w-80 pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <button className="p-2 text-gray-400 hover:text-white">
            <Bell className="w-5 h-5" />
          </button>
          <button className="p-2 text-gray-400 hover:text-white">
            <User className="w-5 h-5" />
          </button>
          <button className="p-2 text-gray-400 hover:text-white">
            <ChevronDown className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Ambassador Performance Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Campus Outreach</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-700 p-4 rounded-lg">
                <Users className="w-8 h-8 text-blue-400 mb-2" />
                <p className="text-gray-300 text-sm">Students Reached</p>
                <p className="text-gray-300 text-sm">247</p>
              </div>
              <div className="bg-gray-700 p-4 rounded-lg">
                <FileText className="w-8 h-8 text-green-400 mb-2" />
                <p className="text-gray-300 text-sm">Events Hosted</p>
                <p className="text-gray-300 text-sm">12</p>
              </div>
              <div className="bg-gray-700 p-4 rounded-lg">
                <ShoppingBag className="w-8 h-8 text-purple-400 mb-2" />
                <p className="text-gray-300 text-sm">Products Sold</p>
                <p className="text-gray-300 text-sm">89</p>
              </div>
              <div className="bg-gray-700 p-4 rounded-lg">
                <BarChart3 className="w-8 h-8 text-orange-400 mb-2" />
                <p className="text-gray-300 text-sm">Revenue Generated</p>
                <p className="text-gray-300 text-sm">$2,450</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Social Media Impact</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-700 p-4 rounded-lg">
                <Target className="w-8 h-8 text-red-400 mb-2" />
                <p className="text-gray-300 text-sm">Instagram Posts</p>
                <p className="text-gray-300 text-sm">34</p>
              </div>
              <div className="bg-gray-700 p-4 rounded-lg">
                <TrendingUp className="w-8 h-8 text-yellow-400 mb-2" />
                <p className="text-gray-300 text-sm">Engagement Rate</p>
                <p className="text-gray-300 text-sm">8.7%</p>
              </div>
              <div className="bg-gray-700 p-4 rounded-lg">
                <Activity className="w-8 h-8 text-indigo-400 mb-2" />
                <p className="text-gray-300 text-sm">Followers Growth</p>
                <p className="text-gray-300 text-sm">+156</p>
              </div>
              <div className="bg-gray-700 p-4 rounded-lg">
                <Calendar className="w-8 h-8 text-pink-400 mb-2" />
                <p className="text-gray-300 text-sm">Campaign Days</p>
                <p className="text-gray-300 text-sm">28</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Weekly Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex space-x-2">
                <div className="w-4 h-8 bg-blue-500 rounded"></div>
                <div className="w-4 h-12 bg-blue-500 rounded"></div>
                <div className="w-4 h-6 bg-blue-500 rounded"></div>
                <div className="w-4 h-10 bg-blue-500 rounded"></div>
                <div className="w-4 h-8 bg-blue-500 rounded"></div>
                <div className="w-4 h-14 bg-blue-500 rounded"></div>
                <div className="w-4 h-9 bg-blue-500 rounded"></div>
              </div>
              <div className="flex space-x-4 text-sm text-gray-400">
                <span>• This Week</span>
                <span>• Last Week</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress and Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Task Completion</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-300">#</span>
                <span className="text-gray-300">Task</span>
                <span className="text-gray-300">Status</span>
                <span className="text-gray-300">Progress</span>
              </div>
              <div className="space-y-3">
                <div className="flex items-center space-x-4">
                  <span className="text-gray-300">01</span>
                  <span className="text-gray-300">Campus Event</span>
                  <span className="text-gray-300">In Progress</span>
                  <div className="flex-1 bg-gray-700 rounded-full h-2">
                    <div className="bg-orange-500 h-2 rounded-full" style={{ width: '46%' }}></div>
                  </div>
                  <span className="text-gray-300">46%</span>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-gray-300">02</span>
                  <span className="text-gray-300">Social Media</span>
                  <span className="text-gray-300">Planning</span>
                  <div className="flex-1 bg-gray-700 rounded-full h-2">
                    <div className="bg-blue-400 h-2 rounded-full" style={{ width: '17%' }}></div>
                  </div>
                  <span className="text-gray-300">17%</span>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-gray-300">03</span>
                  <span className="text-gray-300">Product Demo</span>
                  <span className="text-gray-300">Scheduled</span>
                  <div className="flex-1 bg-gray-700 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: '19%' }}></div>
                  </div>
                  <span className="text-gray-300">19%</span>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-gray-300">04</span>
                  <span className="text-gray-300">Feedback Collection</span>
                  <span className="text-gray-300">Active</span>
                  <div className="flex-1 bg-gray-700 rounded-full h-2">
                    <div className="bg-purple-500 h-2 rounded-full" style={{ width: '29%' }}></div>
                  </div>
                  <span className="text-gray-300">29%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Engagement Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative h-32">
              <div className="absolute inset-0 bg-gradient-to-r from-pink-500/20 to-blue-500/20 rounded"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-green-400/20 to-blue-400/20 rounded"></div>
              <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-400 to-transparent"></div>
            </div>
            <div className="flex space-x-4 text-sm text-gray-400 mt-4">
              <span>• Instagram</span>
              <span>• TikTok</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Goal Achievement</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="relative w-32 h-32 mx-auto mb-4">
                <svg className="w-32 h-32 transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    className="text-gray-700"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray="352"
                    strokeDashoffset="70"
                    className="text-blue-400"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">80%</span>
                </div>
              </div>
              <p className="text-gray-300 text-sm">Monthly Target</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Revenue Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative h-32">
              <div className="absolute inset-0">
                <div className="h-full w-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded"></div>
                <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-400 to-transparent"></div>
                <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-gray-400">
                  <span>Jan</span>
                  <span>Feb</span>
                  <span>Mar</span>
                  <span>Apr</span>
                  <span>May</span>
                  <span>Jun</span>
                  <span>Jul</span>
                  <span>Aug</span>
                  <span>Sep</span>
                  <span>Oct</span>
                  <span>Nov</span>
                  <span>Dec</span>
                </div>
              </div>
            </div>
            <div className="flex space-x-4 text-sm text-gray-400 mt-4">
              <span>• Sales Performance</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Tasks View Component
interface TasksViewProps {
  refreshUser: () => Promise<void>;
}

const TasksView: React.FC<TasksViewProps> = ({ refreshUser }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasksAndSubmissions = async (): Promise<void> => {
    try {
      const [tasksResponse, submissionsResponse] = await Promise.all([
        axios.get<Task[]>(`${API}/tasks`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }),
        axios.get<Submission[]>(`${API}/my-submissions`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        })
      ]);
      setTasks(tasksResponse.data);
      setSubmissions(submissionsResponse.data);
    } catch (error) {
      console.error('Failed to fetch tasks and submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasksAndSubmissions();
  }, []);

  const handleTaskComplete = (): void => {
    refreshUser();
    fetchTasksAndSubmissions();
  };

  const isTaskCompleted = (taskId: string): boolean => {
    return submissions.some(submission => submission.task_id === taskId);
  };

  if (loading) {
    return (
      <div className="p-8 bg-gray-900 min-h-screen">
        <div className="text-center text-gray-400">Loading tasks...</div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-gray-900 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Available Tasks</h1>
        <p className="text-gray-400">Complete tasks to earn points and climb the leaderboard</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onComplete={handleTaskComplete}
            isCompleted={isTaskCompleted(task.id)}
          />
        ))}
      </div>
    </div>
  );
};

// Leaderboard View Component
const LeaderboardView: React.FC = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLeaderboard = async (): Promise<void> => {
    try {
      const response = await axios.get<LeaderboardEntry[]>(`${API}/leaderboard`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setLeaderboard(response.data);
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  if (loading) {
    return (
      <div className="p-8 bg-gray-900 min-h-screen">
        <div className="text-center text-gray-400">Loading leaderboard...</div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-gray-900 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Leaderboard</h1>
        <p className="text-gray-400">See how you rank among other participants</p>
      </div>

      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-0">
          <div className="px-6 py-4 bg-gray-700 border-b border-gray-600">
            <div className="grid grid-cols-4 gap-4 font-semibold text-gray-300">
              <div>Rank</div>
              <div>Name</div>
              <div>College</div>
              <div>Points</div>
            </div>
          </div>
          
          <div className="divide-y divide-gray-600">
            {leaderboard.map((entry, index) => (
              <div key={entry.name} className="px-6 py-4 hover:bg-gray-700">
                <div className="grid grid-cols-4 gap-4 items-center">
                  <div className="flex items-center">
                    {index === 0 && <span className="text-2xl mr-2">🥇</span>}
                    {index === 1 && <span className="text-2xl mr-2">🥈</span>}
                    {index === 2 && <span className="text-2xl mr-2">🥉</span>}
                    <span className="font-semibold text-white">#{entry.rank}</span>
                  </div>
                  <div className="font-medium text-white">{entry.name}</div>
                  <div className="text-gray-300">{entry.college}</div>
                  <div className="font-semibold text-blue-400">{entry.total_points} pts</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Community View Component
const CommunityView: React.FC = () => {
  return (
    <div className="p-8 bg-gray-900 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Community</h1>
        <p className="text-gray-400">Connect with other participants</p>
      </div>

      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Coming Soon</h2>
          <p className="text-gray-300">Community features are under development.</p>
        </CardContent>
      </Card>
    </div>
  );
};

// Analytics View Component
const AnalyticsView: React.FC = () => {
  return (
    <div className="p-8 bg-gray-900 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Analytics</h1>
        <p className="text-gray-400">Detailed performance metrics and insights</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Ambassador Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Event Success Rate</span>
                <span className="text-blue-400 font-semibold">92%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Students Engaged</span>
                <span className="text-green-400 font-semibold">247</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Revenue Generated</span>
                <span className="text-purple-400 font-semibold">$2,450</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Social Media Reach</span>
                <span className="text-orange-400 font-semibold">1,234</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Growth Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="h-32 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded"></div>
              <div className="flex justify-between text-sm text-gray-400">
                <span>Monthly Growth</span>
                <span>+34%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Reports View Component
const ReportsView: React.FC = () => {
  return (
    <div className="p-8 bg-gray-900 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Reports</h1>
        <p className="text-gray-400">Generate and view detailed reports</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Weekly Report</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-300 mb-4">Summary of your weekly activities</p>
            <Button className="w-full">Generate Report</Button>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Event Report</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-300 mb-4">Detailed event performance analysis</p>
            <Button className="w-full">Generate Report</Button>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Revenue Report</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-300 mb-4">Sales and revenue breakdown</p>
            <Button className="w-full">Generate Report</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Messages View Component
const MessagesView: React.FC = () => {
  return (
    <div className="p-8 bg-gray-900 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Messages</h1>
        <p className="text-gray-400">Communicate with DS Studios team</p>
      </div>

      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-4 p-4 bg-gray-700 rounded-lg">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                DS
              </div>
              <div className="flex-1">
                <h3 className="text-white font-medium">DS Studios Team</h3>
                <p className="text-gray-300 text-sm">Great work on the campus event! Keep it up!</p>
              </div>
              <span className="text-xs text-gray-400">2h ago</span>
            </div>
            <div className="flex items-center space-x-4 p-4 bg-gray-700 rounded-lg">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-semibold">
                S
              </div>
              <div className="flex-1">
                <h3 className="text-white font-medium">Support Team</h3>
                <p className="text-gray-300 text-sm">New marketing materials available for download</p>
              </div>
              <span className="text-xs text-gray-400">1d ago</span>
            </div>
            <div className="flex items-center space-x-4 p-4 bg-gray-700 rounded-lg">
              <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                M
              </div>
              <div className="flex-1">
                <h3 className="text-white font-medium">Marketing Team</h3>
                <p className="text-gray-300 text-sm">Your social media campaign is performing well!</p>
              </div>
              <span className="text-xs text-gray-400">3d ago</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Settings View Component
interface SettingsViewProps {
  logout: () => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ logout }) => {
  return (
    <div className="p-8 bg-gray-900 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
        <p className="text-gray-400">Manage your account preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Account Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Email Notifications</span>
              <div className="w-12 h-6 bg-gray-600 rounded-full relative">
                <div className="w-4 h-4 bg-white rounded-full absolute top-1 left-1"></div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Push Notifications</span>
              <div className="w-12 h-6 bg-blue-500 rounded-full relative">
                <div className="w-4 h-4 bg-white rounded-full absolute top-1 right-1"></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Privacy Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Profile Visibility</span>
              <select className="bg-gray-700 border-gray-600 text-white rounded px-3 py-1">
                <option>Public</option>
                <option>Private</option>
              </select>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-white">Account Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={logout}
              variant="destructive"
              className="w-full flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Events View Component
const EventsView: React.FC = () => {
  return (
    <div className="p-8 bg-gray-900 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Events</h1>
        <p className="text-gray-400">Manage and track your campus events</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Product Launch</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-gray-300 text-sm">Date: March 15, 2024</p>
              <p className="text-gray-300 text-sm">Location: Main Campus</p>
              <p className="text-gray-300 text-sm">Status: Planning</p>
              <div className="mt-4">
                <Button className="w-full">View Details</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Social Media Workshop</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-gray-300 text-sm">Date: March 22, 2024</p>
              <p className="text-gray-300 text-sm">Location: Library</p>
              <p className="text-gray-300 text-sm">Status: Confirmed</p>
              <div className="mt-4">
                <Button className="w-full">View Details</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Campus Demo Day</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-gray-300 text-sm">Date: April 5, 2024</p>
              <p className="text-gray-300 text-sm">Location: Student Center</p>
              <p className="text-gray-300 text-sm">Status: Scheduled</p>
              <div className="mt-4">
                <Button className="w-full">View Details</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// History View Component
const HistoryView: React.FC = () => {
  return (
    <div className="p-8 bg-gray-900 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">History</h1>
        <p className="text-gray-400">View your activity history</p>
      </div>

      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-4 p-4 bg-gray-700 rounded-lg">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white">
                ✓
              </div>
              <div className="flex-1">
                <h3 className="text-white font-medium">Event Completed</h3>
                <p className="text-gray-300 text-sm">Campus Product Launch - 89 students attended</p>
              </div>
              <span className="text-xs text-gray-400">2 hours ago</span>
            </div>
            <div className="flex items-center space-x-4 p-4 bg-gray-700 rounded-lg">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white">
                📱
              </div>
              <div className="flex-1">
                <h3 className="text-white font-medium">Social Media Post</h3>
                <p className="text-gray-300 text-sm">Instagram story reached 234 students</p>
              </div>
              <span className="text-xs text-gray-400">1 day ago</span>
            </div>
            <div className="flex items-center space-x-4 p-4 bg-gray-700 rounded-lg">
              <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center text-white">
                💰
              </div>
              <div className="flex-1">
                <h3 className="text-white font-medium">Revenue Generated</h3>
                <p className="text-gray-300 text-sm">Product sales - $450 in revenue</p>
              </div>
              <span className="text-xs text-gray-400">3 days ago</span>
            </div>
            <div className="flex items-center space-x-4 p-4 bg-gray-700 rounded-lg">
              <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white">
                📊
              </div>
              <div className="flex-1">
                <h3 className="text-white font-medium">Report Submitted</h3>
                <p className="text-gray-300 text-sm">Weekly performance report sent to DS Studios</p>
              </div>
              <span className="text-xs text-gray-400">1 week ago</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Ambassadors View Component
const AmbassadorsView: React.FC = () => {
  const [ambassadors, setAmbassadors] = useState<Ambassador[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAmbassadors = async (): Promise<void> => {
    try {
      const response = await axios.get<Ambassador[]>(`${API}/admin/ambassadors`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setAmbassadors(response.data);
    } catch (error) {
      console.error('Failed to fetch ambassadors:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAmbassadors();
  }, []);

  if (loading) {
    return (
      <div className="p-8 bg-gray-900 min-h-screen">
        <div className="text-center text-gray-400">Loading ambassadors...</div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-gray-900 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Ambassadors</h1>
        <p className="text-gray-400">Manage all college ambassadors</p>
      </div>

      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-0">
          <div className="px-6 py-4 bg-gray-700 border-b border-gray-600">
            <div className="grid grid-cols-8 gap-4 font-semibold text-gray-300">
              <div>Name</div>
              <div>College</div>
              <div>Status</div>
              <div>Events</div>
              <div>Students</div>
              <div>Revenue</div>
              <div>Engagement</div>
              <div>Actions</div>
            </div>
          </div>
          
          <div className="divide-y divide-gray-600">
            {ambassadors.map((ambassador) => (
              <div key={ambassador.id} className="px-6 py-4 hover:bg-gray-700">
                <div className="grid grid-cols-8 gap-4 items-center">
                  <div className="font-medium text-white">{ambassador.name}</div>
                  <div className="text-gray-300">{ambassador.college}</div>
                  <div>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      ambassador.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {ambassador.status}
                    </span>
                  </div>
                  <div className="text-gray-300">{ambassador.events_hosted}</div>
                  <div className="text-gray-300">{ambassador.students_reached}</div>
                  <div className="text-gray-300">${ambassador.revenue_generated}</div>
                  <div className="text-gray-300">{ambassador.engagement_rate}%</div>
                  <div>
                    <Button size="sm" variant="outline">View Details</Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Admin Analytics View Component
const AdminAnalyticsView: React.FC = () => {
  return (
    <div className="p-8 bg-gray-900 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Analytics</h1>
        <p className="text-gray-400">Comprehensive performance analytics</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Performance Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Total Ambassadors</span>
                <span className="text-blue-400 font-semibold">24</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Active Ambassadors</span>
                <span className="text-green-400 font-semibold">18</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Total Revenue</span>
                <span className="text-purple-400 font-semibold">$45,230</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Avg Engagement</span>
                <span className="text-orange-400 font-semibold">7.8%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Growth Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="h-32 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded"></div>
              <div className="flex justify-between text-sm text-gray-400">
                <span>Monthly Growth</span>
                <span>+28%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Admin Reports View Component
const AdminReportsView: React.FC = () => {
  return (
    <div className="p-8 bg-gray-900 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Reports</h1>
        <p className="text-gray-400">Generate and view comprehensive reports</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Ambassador Report</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-300 mb-4">Detailed ambassador performance analysis</p>
            <Button className="w-full">Generate Report</Button>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Revenue Report</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-300 mb-4">Sales and revenue breakdown by college</p>
            <Button className="w-full">Generate Report</Button>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Event Report</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-300 mb-4">Event performance and attendance analysis</p>
            <Button className="w-full">Generate Report</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Admin Messages View Component
const AdminMessagesView: React.FC = () => {
  return (
    <div className="p-8 bg-gray-900 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Messages</h1>
        <p className="text-gray-400">Communicate with ambassadors</p>
      </div>

      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-4 p-4 bg-gray-700 rounded-lg">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                A
              </div>
              <div className="flex-1">
                <h3 className="text-white font-medium">Ambassador Support</h3>
                <p className="text-gray-300 text-sm">Need help with event planning</p>
              </div>
              <span className="text-xs text-gray-400">1h ago</span>
            </div>
            <div className="flex items-center space-x-4 p-4 bg-gray-700 rounded-lg">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-semibold">
                M
              </div>
              <div className="flex-1">
                <h3 className="text-white font-medium">Marketing Team</h3>
                <p className="text-gray-300 text-sm">New campaign materials ready</p>
              </div>
              <span className="text-xs text-gray-400">3h ago</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Admin Settings View Component
interface AdminSettingsViewProps {
  logout: () => void;
}

const AdminSettingsView: React.FC<AdminSettingsViewProps> = ({ logout }) => {
  return (
    <div className="p-8 bg-gray-900 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
        <p className="text-gray-400">Manage system settings and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">System Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Email Notifications</span>
              <div className="w-12 h-6 bg-gray-600 rounded-full relative">
                <div className="w-4 h-4 bg-white rounded-full absolute top-1 left-1"></div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Auto Reports</span>
              <div className="w-12 h-6 bg-blue-500 rounded-full relative">
                <div className="w-4 h-4 bg-white rounded-full absolute top-1 right-1"></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Access Control</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Admin Access</span>
              <select className="bg-gray-700 border-gray-600 text-white rounded px-3 py-1">
                <option>Full Access</option>
                <option>Limited Access</option>
              </select>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-white">Account Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={logout}
              variant="destructive"
              className="w-full flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Admin Events View Component
const AdminEventsView: React.FC = () => {
  return (
    <div className="p-8 bg-gray-900 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Events</h1>
        <p className="text-gray-400">Monitor all ambassador events</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Product Launch - MIT</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-gray-300 text-sm">Date: March 15, 2024</p>
              <p className="text-gray-300 text-sm">Ambassador: Sarah Johnson</p>
              <p className="text-gray-300 text-sm">Status: Completed</p>
              <p className="text-gray-300 text-sm">Attendance: 89 students</p>
              <div className="mt-4">
                <Button className="w-full">View Details</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Workshop - Stanford</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-gray-300 text-sm">Date: March 22, 2024</p>
              <p className="text-gray-300 text-sm">Ambassador: Mike Chen</p>
              <p className="text-gray-300 text-sm">Status: Scheduled</p>
              <p className="text-gray-300 text-sm">Expected: 120 students</p>
              <div className="mt-4">
                <Button className="w-full">View Details</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Demo Day - Harvard</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-gray-300 text-sm">Date: April 5, 2024</p>
              <p className="text-gray-300 text-sm">Ambassador: Lisa Wang</p>
              <p className="text-gray-300 text-sm">Status: Planning</p>
              <p className="text-gray-300 text-sm">Expected: 150 students</p>
              <div className="mt-4">
                <Button className="w-full">View Details</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Admin History View Component
const AdminHistoryView: React.FC = () => {
  return (
    <div className="p-8 bg-gray-900 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">History</h1>
        <p className="text-gray-400">View system activity history</p>
      </div>

      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-4 p-4 bg-gray-700 rounded-lg">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white">
                ✓
              </div>
              <div className="flex-1">
                <h3 className="text-white font-medium">New Ambassador Added</h3>
                <p className="text-gray-300 text-sm">Sarah Johnson from MIT joined the program</p>
              </div>
              <span className="text-xs text-gray-400">2 hours ago</span>
            </div>
            <div className="flex items-center space-x-4 p-4 bg-gray-700 rounded-lg">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white">
                📊
              </div>
              <div className="flex-1">
                <h3 className="text-white font-medium">Report Generated</h3>
                <p className="text-gray-300 text-sm">Monthly performance report created</p>
              </div>
              <span className="text-xs text-gray-400">1 day ago</span>
            </div>
            <div className="flex items-center space-x-4 p-4 bg-gray-700 rounded-lg">
              <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center text-white">
                💰
              </div>
              <div className="flex-1">
                <h3 className="text-white font-medium">Revenue Milestone</h3>
                <p className="text-gray-300 text-sm">Total revenue reached $50,000</p>
              </div>
              <span className="text-xs text-gray-400">3 days ago</span>
            </div>
            <div className="flex items-center space-x-4 p-4 bg-gray-700 rounded-lg">
              <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white">
                📧
              </div>
              <div className="flex-1">
                <h3 className="text-white font-medium">Bulk Message Sent</h3>
                <p className="text-gray-300 text-sm">Announcement sent to all ambassadors</p>
              </div>
              <span className="text-xs text-gray-400">1 week ago</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Admin Dashboard Component
const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<AdminStats>({
    total_ambassadors: 0,
    active_ambassadors: 0,
    total_revenue: 0,
    total_events: 0,
    total_students_reached: 0,
    average_engagement_rate: 0,
    top_performing_college: '',
    monthly_growth: 0
  });

  const fetchAdminStats = async (): Promise<void> => {
    try {
      const response = await axios.get<AdminStats>(`${API}/admin/stats`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch admin stats:', error);
    }
  };

  useEffect(() => {
    fetchAdminStats();
  }, []);

  return (
    <div className="p-8 bg-gray-900 min-h-screen">
      {/* Top Bar */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">DC Admin Portal</h1>
          <p className="text-gray-400">Manage and monitor ambassador program</p>
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search ambassadors..."
              className="w-80 pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <button className="p-2 text-gray-400 hover:text-white">
            <Bell className="w-5 h-5" />
          </button>
          <button className="p-2 text-gray-400 hover:text-white">
            <User className="w-5 h-5" />
          </button>
          <button className="p-2 text-gray-400 hover:text-white">
            <ChevronDown className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Users className="w-8 h-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Total Ambassadors</p>
                <p className="text-2xl font-bold text-white">{stats.total_ambassadors}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Active Ambassadors</p>
                <p className="text-2xl font-bold text-white">{stats.active_ambassadors}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <BarChart3 className="w-8 h-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Program Revenue</p>
                <p className="text-2xl font-bold text-white">${stats.total_revenue.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-orange-100 rounded-lg">
                <Calendar className="w-8 h-8 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Campus Events</p>
                <p className="text-2xl font-bold text-white">{stats.total_events}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Program Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Students Reached</span>
                <span className="text-blue-400 font-semibold">{stats.total_students_reached.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Avg Engagement Rate</span>
                <span className="text-green-400 font-semibold">{stats.average_engagement_rate}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Monthly Growth</span>
                <span className="text-purple-400 font-semibold">+{stats.monthly_growth}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Top Performing College</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-white font-semibold">{stats.top_performing_college}</h3>
              <p className="text-gray-400 text-sm">Highest performing college</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">System Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-gray-300 text-sm">New ambassador registered</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-gray-300 text-sm">Campus event completed</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span className="text-gray-300 text-sm">Revenue milestone achieved</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gray-800 border-gray-700 hover:bg-gray-700 transition-colors cursor-pointer">
          <CardContent className="p-6 text-center">
            <Users className="w-8 h-8 text-blue-400 mx-auto mb-2" />
            <h3 className="text-white font-medium">Manage Ambassadors</h3>
            <p className="text-gray-400 text-sm">View and manage all ambassadors</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700 hover:bg-gray-700 transition-colors cursor-pointer">
          <CardContent className="p-6 text-center">
            <BarChart3 className="w-8 h-8 text-green-400 mx-auto mb-2" />
            <h3 className="text-white font-medium">View Analytics</h3>
            <p className="text-gray-400 text-sm">Detailed performance metrics</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700 hover:bg-gray-700 transition-colors cursor-pointer">
          <CardContent className="p-6 text-center">
            <TrendingUp className="w-8 h-8 text-purple-400 mx-auto mb-2" />
            <h3 className="text-white font-medium">Generate Reports</h3>
            <p className="text-gray-400 text-sm">Create comprehensive reports</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700 hover:bg-gray-700 transition-colors cursor-pointer">
          <CardContent className="p-6 text-center">
            <MessageSquare className="w-8 h-8 text-orange-400 mx-auto mb-2" />
            <h3 className="text-white font-medium">Send Messages</h3>
            <p className="text-gray-400 text-sm">Communicate with ambassadors</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Profile View Component
interface ProfileViewProps {
  user: User | null;
  refreshUser: () => Promise<void>;
}

const ProfileView: React.FC<ProfileViewProps> = ({ user, refreshUser }) => {
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    college: user?.college || ''
  });

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    try {
      await axios.put(`${API}/profile`, formData);
      refreshUser();
      setEditing(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  if (!user) return null;

  return (
    <div className="p-8 bg-gray-900 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Profile</h1>
        <p className="text-gray-400">Manage your account settings</p>
      </div>

      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-6">
          <div className="flex items-center mb-6">
            <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="ml-6">
              <h2 className="text-2xl font-bold text-white">{user.name}</h2>
              <p className="text-gray-300">{user.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Account Information</h3>
              <div className="space-y-2">
                <p className="text-gray-300"><span className="font-medium text-white">Email:</span> {user.email}</p>
                <p className="text-gray-300"><span className="font-medium text-white">College:</span> {user.college}</p>
                <p className="text-gray-300"><span className="font-medium text-white">Points:</span> {user.total_points}</p>
                <p className="text-gray-300"><span className="font-medium text-white">Rank:</span> #{user.rank_position}</p>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Statistics</h3>
              <div className="space-y-2">
                <p className="text-gray-300"><span className="font-medium text-white">Current Day:</span> {user.current_day}</p>
                <p className="text-gray-300"><span className="font-medium text-white">Total Referrals:</span> {user.total_referrals}</p>
                <p className="text-gray-300"><span className="font-medium text-white">Total Points:</span> {user.total_points}</p>
              </div>
            </div>
          </div>

          {editing ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Name
                </label>
                <Input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full bg-gray-700 border-gray-600 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  College
                </label>
                <Input
                  type="text"
                  name="college"
                  value={formData.college}
                  onChange={handleChange}
                  className="w-full bg-gray-700 border-gray-600 text-white"
                />
              </div>
              <div className="flex space-x-3">
                <Button type="submit">
                  Save Changes
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditing(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <Button onClick={() => setEditing(true)}>
              Edit Profile
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Task Card Component
interface TaskCardProps {
  task: Task;
  onComplete: () => void;
  isCompleted: boolean;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onComplete, isCompleted }) => {
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    status_text: '',
    people_connected: 0
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('task_id', task.id);
      formDataToSend.append('status_text', formData.status_text);
      formDataToSend.append('people_connected', formData.people_connected.toString());
      
      if (selectedFile) {
        formDataToSend.append('image', selectedFile);
      }

      await axios.post(`${API}/submit-task-with-image`, formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
      });

      onComplete();
      setShowForm(false);
      setFormData({ status_text: '', people_connected: 0 });
      setSelectedFile(null);
    } catch (error) {
      console.error('Failed to submit task:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
    const value = e.target.type === 'number' ? parseInt(e.target.value) : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">{task.title}</h3>
            <p className="text-gray-300 text-sm mb-2">{task.description}</p>
            <div className="flex items-center space-x-4 text-sm text-gray-400">
              <span>Day: {task.day}</span>
              <span>Type: {task.task_type}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-400">{task.points_reward}</div>
            <div className="text-sm text-gray-400">points</div>
          </div>
        </div>

        {isCompleted ? (
          <div className="bg-green-900 border border-green-700 text-green-300 px-4 py-2 rounded-md">
            ✓ Task completed
          </div>
        ) : showForm ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Description
              </label>
              <textarea
                name="status_text"
                value={formData.status_text}
                onChange={handleChange}
                required
                rows={3}
                className="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-700 text-white placeholder-gray-400"
                placeholder="Describe how you completed this task..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                People Connected
              </label>
              <Input
                type="number"
                name="people_connected"
                value={formData.people_connected}
                onChange={(e) => setFormData({ ...formData, people_connected: parseInt(e.target.value) || 0 })}
                min="0"
                placeholder="How many people did you connect?"
                className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
              />
              <p className="text-xs text-gray-400 mt-1">+10 points per person connected</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Upload Proof (Optional)
              </label>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="bg-gray-700 border-gray-600 text-white"
              />
              <p className="text-xs text-gray-400 mt-1">
                Upload screenshot or photo as proof (+25 bonus points)
              </p>
            </div>

            <Button
              type="submit"
              disabled={submitting}
              className="w-full"
            >
              {submitting ? 'Submitting...' : `Submit Task (${task.points_reward}+ points)`}
            </Button>
          </form>
        ) : (
          <Button
            onClick={() => setShowForm(true)}
            className="w-full"
          >
            Complete Task
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

// Main Dashboard Component
const Dashboard: React.FC = () => {
  const { user, logout, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderContent = (): React.ReactNode => {
    console.log('Current user:', user);
    console.log('User role:', user?.role);
    console.log('Role comparison:', user?.role === 'admin');
    
    if (user?.role === 'admin') {
      switch (activeTab) {
        case 'dashboard':
          return <AdminDashboard />;
        case 'ambassadors':
          return <AmbassadorsView />;
        case 'analytics':
          return <AdminAnalyticsView />;
        case 'reports':
          return <AdminReportsView />;
        case 'messages':
          return <AdminMessagesView />;
        case 'settings':
          return <AdminSettingsView logout={logout} />;
        default:
          return <AdminDashboard />;
      }
    } else {
      switch (activeTab) {
        case 'dashboard':
          return <DashboardOverview user={user} refreshUser={refreshUser} />;
        case 'tasks':
          return <TasksView refreshUser={refreshUser} />;
        case 'leaderboard':
          return <LeaderboardView />;
        case 'community':
          return <CommunityView />;
        case 'profile':
          return <ProfileView user={user} refreshUser={refreshUser} />;
        case 'analytics':
          return <AnalyticsView />;
        case 'reports':
          return <ReportsView />;
        case 'messages':
          return <MessagesView />;
        case 'settings':
          return <SettingsView logout={logout} />;
        case 'events':
          return <EventsView />;
        case 'history':
          return <HistoryView />;
        default:
          return <DashboardOverview user={user} refreshUser={refreshUser} />;
      }
    }
  };

  return (
    <div className="flex bg-gray-900 min-h-screen">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} user={user} logout={logout} />
      <div className="ml-64 flex-1">
        {renderContent()}
      </div>
    </div>
  );
};

// Main App Component
const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-xl text-gray-400">Loading...</div>
      </div>
    );
  }

  return user ? <Dashboard /> : <LoginForm />;
};

export default App; 