import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { Sun, Moon } from 'lucide-react';
// Theme Context
type Theme = 'dark' | 'light';
interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
};

const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(
    (localStorage.getItem('theme') as Theme) || 'dark'
  );
  useEffect(() => {
    document.documentElement.classList.remove('dark', 'light');
    document.documentElement.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);
  const toggleTheme = () => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
import './App.css';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import * as Ambassador from '@/components/ambassador';
import * as Admin from '@/components/admin';
// Role-based sidebar imports handled below
import { User } from '@/types';

const BACKEND_URL = 'http://127.0.0.1:5000';
const API = `${BACKEND_URL}/api`;

// Debug logging
console.log('BACKEND_URL:', BACKEND_URL);
console.log('API:', API);

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
    college: '',
    groupLeaderName: ''
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
        if (!formData.groupLeaderName.trim()) {
          missingFields.push('Group Leader Name');
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
      const requestData = isLogin ? {
        ...formData,
        role: userRole
      } : {
        email: formData.email,
        password: formData.password,
        name: formData.name,
        college: formData.college,
        group_leader_name: formData.groupLeaderName,
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
      college: '',
      groupLeaderName: ''
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
                    <strong>College Ambassador Registration:</strong> Please provide your full name, college/university, and group leader name for your ambassador profile.
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
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Group Leader Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    name="groupLeaderName"
                    value={formData.groupLeaderName}
                    onChange={handleChange}
                    required
                    placeholder="Enter your group leader's name"
                    className={`w-full ${!formData.groupLeaderName.trim() && error.includes('Group Leader Name') ? 'border-red-500 focus:border-red-500' : ''}`}
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

// Main Dashboard Component
const Dashboard: React.FC = () => {
  const { user, logout, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  // Lightweight global navigation bridge (no router):
  // Listen for CustomEvent 'navigate' from child components
  useEffect(() => {
    const handleNavigate = (e: Event) => {
      const custom = e as CustomEvent<{ tab?: string; hash?: string }>;
      const nextTab = custom.detail?.tab;
      const hash = custom.detail?.hash;
      if (nextTab) {
        setActiveTab(nextTab);
        if (hash) {
          // Update location hash and attempt scroll after render
          window.location.hash = hash;
          setTimeout(() => {
            const id = hash.replace('#', '');
            const el = document.getElementById(id);
            if (el) {
              el.scrollIntoView({ behavior: 'smooth' });
            }
          }, 0);
        }
      }
    };

    window.addEventListener('navigate', handleNavigate as EventListener);
    return () => window.removeEventListener('navigate', handleNavigate as EventListener);
  }, []);

  const renderContent = (): React.ReactNode => {
    console.log('Current user:', user);
    console.log('User role:', user?.role);
    console.log('Role comparison:', user?.role === 'admin');
    
    if (user?.role === 'admin') {
      switch (activeTab) {
        case 'dashboard':
          return <Admin.Dashboard user={user} refreshUser={refreshUser} />;
        case 'ambassadors':
          return <Admin.Tasks refreshUser={refreshUser} />;
        case 'leaderboard':
          return <Admin.Leaderboard />;
        case 'analytics':
          return <Admin.Analytics />;
        case 'reports':
          return <Admin.Reports />;
        case 'messages':
          return <Admin.Messages />;
        case 'settings':
          return <Admin.Settings logout={logout} />;
        case 'events':
          return <Admin.Events />;
        case 'history':
          return <Admin.History />;
        case 'profile':
          return <Admin.Profile user={user} refreshUser={refreshUser} logout={logout} />;
        default:
          return <Admin.Dashboard user={user} refreshUser={refreshUser} />;
      }
    } else {
      switch (activeTab) {
        case 'dashboard':
          return <Ambassador.Dashboard user={user} refreshUser={refreshUser} />;
        case 'tasks':
          return <Ambassador.Tasks refreshUser={refreshUser} />;
        case 'leaderboard':
          return <Ambassador.Leaderboard user={user} />;
        // case 'community':
        //   return <Community />;
        case 'profile':
          return <Ambassador.Profile user={user} refreshUser={refreshUser} logout={logout} />;
        // case 'analytics':
        //   return <Analytics />;
        case 'reports':
          return <Ambassador.Reports />;
        // case 'messages':
        //   return <Messages />;


        case 'history':
          return <Ambassador.History />;
        default:
          return <Ambassador.Dashboard user={user} refreshUser={refreshUser} />;
      }
    }
  };

  // Determine which sidebar to use based on user role
  const SidebarComponent = user?.role === 'admin' ? Admin.Sidebar : Ambassador.Sidebar;

  return (
    <div className="dashboard-layout">
      <SidebarComponent activeTab={activeTab} setActiveTab={setActiveTab} user={user} logout={logout} />
      <div className="main-content-container">
        {renderContent()}
      </div>
    </div>
  );
};

// Main App Component
const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
};

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const { theme, toggleTheme } = useTheme();

  if (loading) {
    return (
      <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-white'} flex items-center justify-center`}>
        <div className={`text-xl ${theme === 'dark' ? 'text-gray-400' : 'text-gray-700'}`}>Loading...</div>
      </div>
    );
  }

  // Theme toggle button for all pages (top right)
  return (
    <div className={theme === 'dark' ? 'bg-gray-900 text-white min-h-screen' : 'bg-white text-gray-900 min-h-screen'}>
      <div className="w-full flex justify-end items-center p-4 border-b border-gray-800 sticky top-0 z-50 bg-inherit">
        <button
          onClick={toggleTheme}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg border border-gray-700 ${theme === 'dark' ? 'bg-gray-800 text-white hover:bg-gray-700' : 'bg-gray-200 text-gray-900 hover:bg-gray-300'} transition-colors`}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun className="h-5 w-5 text-yellow-400" /> : <Moon className="h-5 w-5 text-blue-500" />}
          <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
        </button>
      </div>
      {user ? <Dashboard /> : <LoginForm />}
    </div>
  );
};

export default App; 