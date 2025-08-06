import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import './App.css';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Types
interface User {
  id: number;
  name: string;
  email: string;
  college: string;
  points: number;
  rank: number;
  total_users: number;
}

interface Task {
  id: number;
  title: string;
  description: string;
  points_reward: number;
  category: string;
  deadline: string;
}

interface Submission {
  id: number;
  task_id: number;
  user_id: number;
  description: string;
  people_connected: number;
  proof_url?: string;
  submitted_at: string;
  status: string;
}

interface LeaderboardEntry {
  id: number;
  name: string;
  college: string;
  points: number;
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

    if (!formData.email || !formData.password) {
      setError('Please fill in all required fields.');
      return false;
    }

    if (!isLogin) {
      if (!formData.name || !formData.college) {
        setError('Please fill in all required fields.');
        return false;
      }

      if (formData.password !== confirmPassword) {
        setError('Passwords do not match.');
        return false;
      }

      if (formData.password.length < 6) {
        setError('Password must be at least 6 characters long.');
        return false;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        setError('Please enter a valid email address.');
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
      const response = await axios.post<{ token: string; user: User }>(`${API}${endpoint}`, formData);
      
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

  const handleModeSwitch = (): void => {
    setIsLogin(!isLogin);
    setError('');
    setSuccess('');
    setConfirmPassword('');
    setShowPassword(false);
    setShowConfirmPassword(false);
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
            {!isLogin && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Full Name *
                  </label>
                  <Input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="Enter your full name"
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    College/University *
                  </label>
                  <Input
                    type="text"
                    name="college"
                    value={formData.college}
                    onChange={handleChange}
                    required
                    placeholder="Enter your college/university"
                    className="w-full"
                  />
                </div>
              </>
            )}
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Email *
              </label>
              <Input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="Enter your email"
                className="w-full"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Password *
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  placeholder="Enter your password"
                  className="w-full pr-10"
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
                  Confirm Password *
                </label>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="Confirm your password"
                    className="w-full pr-10"
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
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'tasks', label: 'Tasks', icon: '📝' },
    { id: 'leaderboard', label: 'Leaderboard', icon: '🏆' },
    { id: 'community', label: 'Community', icon: '👥' },
    { id: 'profile', label: 'Profile', icon: '👤' }
  ];

  return (
    <div className="w-64 bg-white shadow-lg h-screen fixed left-0 top-0">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Anushka's Site</h1>
        
        <nav className="space-y-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span className="mr-3">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>

        {user && (
          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center mb-3">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="ml-3">
                <p className="font-semibold text-gray-900">{user.name}</p>
                <p className="text-sm text-gray-600">{user.college}</p>
              </div>
            </div>
            <div className="text-sm text-gray-600">
              <p>Points: {user.points}</p>
              <p>Rank: #{user.rank} of {user.total_users}</p>
            </div>
            <Button
              onClick={logout}
              variant="destructive"
              size="sm"
              className="w-full mt-3"
            >
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
    totalTasks: 0,
    completedTasks: 0,
    totalPoints: 0,
    averagePoints: 0
  });

  const fetchDashboardStats = async (): Promise<void> => {
    try {
      const response = await axios.get(`${API}/dashboard-stats`);
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

  const getTotalUsers = (): number => {
    return user?.total_users || 0;
  };

  if (!user) return null;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back, {user.name}! 👋</h1>
        <p className="text-gray-600">Here's your progress overview</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <span className="text-2xl">🏆</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Current Rank</p>
                <p className="text-2xl font-bold text-gray-900">{getRankDisplay(user.rank)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <span className="text-2xl">⭐</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Points</p>
                <p className="text-2xl font-bold text-gray-900">{user.points}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <span className="text-2xl">📊</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed Tasks</p>
                <p className="text-2xl font-bold text-gray-900">{stats.completedTasks}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-orange-100 rounded-lg">
                <span className="text-2xl">👥</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{getTotalUsers()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center p-4 bg-gray-50 rounded-lg">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600">✓</span>
              </div>
              <div className="ml-4">
                <p className="font-medium text-gray-900">Task completed</p>
                <p className="text-sm text-gray-600">You earned 50 points</p>
              </div>
              <div className="ml-auto text-sm text-gray-500">2 hours ago</div>
            </div>
          </div>
        </CardContent>
      </Card>
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
        axios.get<Task[]>(`${API}/tasks`),
        axios.get<Submission[]>(`${API}/submissions`)
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

  const isTaskCompleted = (taskId: number): boolean => {
    return submissions.some(submission => submission.task_id === taskId);
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center text-gray-600">Loading tasks...</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Available Tasks</h1>
        <p className="text-gray-600">Complete tasks to earn points and climb the leaderboard</p>
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
      const response = await axios.get<LeaderboardEntry[]>(`${API}/leaderboard`);
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
      <div className="p-8">
        <div className="text-center text-gray-600">Loading leaderboard...</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Leaderboard</h1>
        <p className="text-gray-600">See how you rank among other participants</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="px-6 py-4 bg-gray-50 border-b">
            <div className="grid grid-cols-4 gap-4 font-semibold text-gray-700">
              <div>Rank</div>
              <div>Name</div>
              <div>College</div>
              <div>Points</div>
            </div>
          </div>
          
          <div className="divide-y divide-gray-200">
            {leaderboard.map((entry, index) => (
              <div key={entry.id} className="px-6 py-4 hover:bg-gray-50">
                <div className="grid grid-cols-4 gap-4 items-center">
                  <div className="flex items-center">
                    {index === 0 && <span className="text-2xl mr-2">🥇</span>}
                    {index === 1 && <span className="text-2xl mr-2">🥈</span>}
                    {index === 2 && <span className="text-2xl mr-2">🥉</span>}
                    <span className="font-semibold">#{entry.rank}</span>
                  </div>
                  <div className="font-medium text-gray-900">{entry.name}</div>
                  <div className="text-gray-600">{entry.college}</div>
                  <div className="font-semibold text-blue-600">{entry.points} pts</div>
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
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Community</h1>
        <p className="text-gray-600">Connect with other participants</p>
      </div>

      <Card>
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Coming Soon</h2>
          <p className="text-gray-600">Community features are under development.</p>
        </CardContent>
      </Card>
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
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile</h1>
        <p className="text-gray-600">Manage your account settings</p>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center mb-6">
            <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="ml-6">
              <h2 className="text-2xl font-bold text-gray-900">{user.name}</h2>
              <p className="text-gray-600">{user.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Account Information</h3>
              <div className="space-y-2">
                <p><span className="font-medium">Email:</span> {user.email}</p>
                <p><span className="font-medium">College:</span> {user.college}</p>
                <p><span className="font-medium">Points:</span> {user.points}</p>
                <p><span className="font-medium">Rank:</span> #{user.rank} of {user.total_users}</p>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Statistics</h3>
              <div className="space-y-2">
                <p><span className="font-medium">Total Tasks:</span> 0</p>
                <p><span className="font-medium">Completed Tasks:</span> 0</p>
                <p><span className="font-medium">Average Points:</span> 0</p>
              </div>
            </div>
          </div>

          {editing ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <Input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  College
                </label>
                <Input
                  type="text"
                  name="college"
                  value={formData.college}
                  onChange={handleChange}
                  className="w-full"
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
    description: '',
    people_connected: 0
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('task_id', task.id.toString());
      formDataToSend.append('description', formData.description);
      formDataToSend.append('people_connected', formData.people_connected.toString());
      
      if (selectedFile) {
        formDataToSend.append('proof', selectedFile);
      }

      await axios.post(`${API}/submissions`, formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      onComplete();
      setShowForm(false);
      setFormData({ description: '', people_connected: 0 });
      setSelectedFile(null);
    } catch (error) {
      console.error('Failed to submit task:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{task.title}</h3>
            <p className="text-gray-600 text-sm mb-2">{task.description}</p>
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span>Category: {task.category}</span>
              <span>Deadline: {new Date(task.deadline).toLocaleDateString()}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600">{task.points_reward}</div>
            <div className="text-sm text-gray-500">points</div>
          </div>
        </div>

        {isCompleted ? (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-2 rounded-md">
            ✓ Task completed
          </div>
        ) : showForm ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Describe how you completed this task..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                People Connected
              </label>
              <Input
                type="number"
                name="people_connected"
                value={formData.people_connected}
                onChange={(e) => setFormData({ ...formData, people_connected: parseInt(e.target.value) || 0 })}
                min="0"
                placeholder="How many people did you connect?"
              />
              <p className="text-xs text-gray-500 mt-1">+10 points per person connected</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Upload Proof (Optional)
              </label>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              />
              <p className="text-xs text-gray-500 mt-1">
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
      default:
        return <DashboardOverview user={user} refreshUser={refreshUser} />;
    }
  };

  return (
    <div className="flex bg-gray-50 min-h-screen">
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  return user ? <Dashboard /> : <LoginForm />;
};

export default App; 