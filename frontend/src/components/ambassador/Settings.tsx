import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings as SettingsIcon, User, Bell, Shield, Lock, Key, HelpCircle, MessageSquare, LogOut, Eye, Download, Globe } from 'lucide-react';
import { useTheme } from '@/App';
import { Sun, Moon } from 'lucide-react';

interface SettingsProps {
  logout: () => void;
}

const Settings: React.FC<SettingsProps> = ({ logout }) => {
  const { theme, toggleTheme } = useTheme();
  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-800">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold">Settings</h1>
          <button
            onClick={toggleTheme}
            className={`flex items-center space-x-2 px-3 py-1 rounded-lg border border-gray-700 ${theme === 'dark' ? 'bg-gray-800 text-white hover:bg-gray-700' : 'bg-gray-200 text-gray-900 hover:bg-gray-300'} transition-colors ml-4`}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="h-5 w-5 text-yellow-400" /> : <Moon className="h-5 w-5 text-blue-500" />}
            <span className="text-sm">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Account Settings</h2>
          <p className="text-gray-400">Manage your account preferences, security settings, and privacy controls.</p>
        </div>

        {/* Settings Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-1 gap-6 mb-8">
          {/* Account Settings */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <User className="h-6 w-6 text-blue-400" />
                <span>Account Settings</span>
              </CardTitle>
              <CardDescription className="text-gray-400">
                Manage your personal information and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-white">Profile Information</h4>
                    <p className="text-gray-400 text-sm">Update your personal details</p>
                  </div>
                  <button
                    className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
                    onClick={() => alert('Edit Profile Information clicked')}
                  >
                    Edit
                  </button>
                </div>
              </div>
              
              <div className="bg-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-white">Notification Preferences</h4>
                    <p className="text-gray-400 text-sm">Manage your notification settings</p>
                  </div>
                  <button
                    className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
                    onClick={() => alert('Configure Notification Preferences clicked')}
                  >
                    Configure
                  </button>
                </div>
              </div>
              
              <div className="bg-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-white">Privacy Settings</h4>
                    <p className="text-gray-400 text-sm">Control your privacy and data</p>
                  </div>
                  <button
                    className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
                    onClick={() => alert('Manage Privacy Settings clicked')}
                  >
                    Manage
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Additional Settings */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Preferences */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <SettingsIcon className="h-6 w-6 text-purple-400" />
                <span>Preferences</span>
              </CardTitle>
              <CardDescription className="text-gray-400">
                Customize your experience
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-gray-700 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300 text-sm">Dark Mode</span>
                  <button
                    className="w-10 h-6 bg-blue-600 rounded-full relative focus:outline-none"
                    onClick={() => alert('Toggle Dark Mode clicked')}
                  >
                    <div className="w-4 h-4 bg-white rounded-full absolute right-1 top-1"></div>
                  </button>
                </div>
              </div>
              
              <div className="bg-gray-700 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300 text-sm">Email Notifications</span>
                  <button
                    className="w-10 h-6 bg-green-600 rounded-full relative focus:outline-none"
                    onClick={() => alert('Toggle Email Notifications clicked')}
                  >
                    <div className="w-4 h-4 bg-white rounded-full absolute right-1 top-1"></div>
                  </button>
                </div>
              </div>
              
              <div className="bg-gray-700 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300 text-sm">Push Notifications</span>
                  <button
                    className="w-10 h-6 bg-gray-600 rounded-full relative focus:outline-none"
                    onClick={() => alert('Toggle Push Notifications clicked')}
                  >
                    <div className="w-4 h-4 bg-white rounded-full absolute left-1 top-1"></div>
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Data & Privacy */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <Eye className="h-6 w-6 text-yellow-400" />
                <span>Data & Privacy</span>
              </CardTitle>
              <CardDescription className="text-gray-400">
                Manage your data and privacy
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-white">Download Data</h4>
                    <p className="text-gray-400 text-sm">Export your personal data</p>
                  </div>
                  <button
                    className="text-yellow-400 hover:text-yellow-300 text-sm font-medium transition-colors"
                    onClick={() => alert('Download Data clicked')}
                  >
                    <Download className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              <div className="bg-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-white">Privacy Policy</h4>
                    <p className="text-gray-400 text-sm">Read our privacy policy</p>
                  </div>
                  <button
                    className="text-yellow-400 hover:text-yellow-300 text-sm font-medium transition-colors"
                    onClick={() => alert('View Privacy Policy clicked')}
                  >
                    <Globe className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              <div className="bg-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-white">Delete Account</h4>
                    <p className="text-gray-400 text-sm">Permanently delete your account</p>
                  </div>
                  <button
                    className="text-red-400 hover:text-red-300 text-sm font-medium transition-colors"
                    onClick={() => alert('Delete Account clicked')}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Support */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <HelpCircle className="h-6 w-6 text-blue-400" />
                <span>Support</span>
              </CardTitle>
              <CardDescription className="text-gray-400">
                Get help and support
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-white">Help Center</h4>
                    <p className="text-gray-400 text-sm">Get help and find answers</p>
                  </div>
                  <button
                    className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
                    onClick={() => alert('Visit Help Center clicked')}
                  >
                    Visit
                  </button>
                </div>
              </div>
              
              <div className="bg-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-white">Contact Support</h4>
                    <p className="text-gray-400 text-sm">Reach out to our team</p>
                  </div>
                  <button
                    className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
                    onClick={() => alert('Contact Support clicked')}
                  >
                    Contact
                  </button>
                </div>
              </div>
              
              <div className="bg-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-white">Feedback</h4>
                    <p className="text-gray-400 text-sm">Share your thoughts with us</p>
                  </div>
                  <button
                    className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
                    onClick={() => alert('Submit Feedback clicked')}
                  >
                    Submit
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
  {/* Sign Out Section removed. Sign out button will be in Sidebar. */}
      </div>
    </div>
  );
};

export default Settings;
