import React, { useState, useEffect } from 'react';
import { User } from '../../types';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { User as UserIcon, Award, Calendar, Edit, Save, X, Shield, Star, TrendingUp, Activity, Lock, Settings as SettingsIcon, Bell, HelpCircle, LogOut } from 'lucide-react';
import ConfirmDialog from '../ConfirmDialog';

interface ProfileProps {
  user: User | null;
  refreshUser: () => Promise<void>;
  logout?: () => void;
}

const BACKEND_URL = 'http://127.0.0.1:5000';

const Profile: React.FC<ProfileProps> = ({ user, refreshUser, logout }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    college: user?.college || '',
    email: user?.email || '',
    groupLeaderName: user?.group_leader_name || ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  // Password change modal state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showSignOutDialog, setShowSignOutDialog] = useState(false);
  // Password change handler
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);
    if (!passwordData.oldPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setPasswordError('All fields are required.');
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters.');
      return;
    }
    setPasswordLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Not authenticated');
      const response = await fetch(`${BACKEND_URL}/api/change-password`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          old_password: passwordData.oldPassword,
          new_password: passwordData.newPassword
        })
      });
      if (response.ok) {
        setPasswordSuccess('Password changed successfully!');
        setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });

        // Show success message for 2 seconds before closing modal
        setTimeout(() => {
          setShowPasswordModal(false);
          setPasswordSuccess(null);
          // Also set global success message
          setSuccess('Password updated successfully!');
          // Clear global success message after 5 seconds
          setTimeout(() => setSuccess(null), 5000);
        }, 2000);
      } else {
        const errorData = await response.json();
        setPasswordError(errorData.detail || 'Failed to change password');
      }
    } catch (err) {
      setPasswordError('Error changing password');
    } finally {
      setPasswordLoading(false);
    }
  };
  const handlePasswordInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  const handleSave = async (): Promise<void> => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`${BACKEND_URL}/api/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          college: formData.college,
          group_leader_name: formData.groupLeaderName
        }),
      });

      if (response.ok) {
        setSuccess('Profile updated successfully!');
        setIsEditing(false);
        await refreshUser();
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Failed to update profile');
      }
    } catch (err) {
      setError('Error updating profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = (): void => {
    setFormData({
      name: user?.name || '',
      college: user?.college || '',
      email: user?.email || '',
      groupLeaderName: user?.group_leader_name || ''
    });
    setIsEditing(false);
    setError(null);
    setSuccess(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  useEffect(() => {
    setFormData({
      name: user?.name || '',
      college: user?.college || '',
      email: user?.email || '',
      groupLeaderName: user?.group_leader_name || ''
    });
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-gray-400">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-800">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold">Profile & Settings</h1>
          {/* <div className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm">
            Manage Account
          </div> */}
        </div>

        <div className="flex items-center space-x-4">
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center justify-center px-6 py-3 rounded-md text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-lg"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </button>
          ) : (
            <div className="flex space-x-2">
              <button
                onClick={handleSave}
                disabled={loading}
                className="inline-flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium bg-green-600 hover:bg-green-700 text-white transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Changes
              </button>
              <button
                onClick={handleCancel}
                className="inline-flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium bg-gray-600 hover:bg-gray-700 text-white transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        {/* Error/Success Messages */}
        {error && (
          <div className="mb-6 flex items-center gap-2 p-3 bg-red-900/20 border border-red-500 text-red-400 rounded-lg">
            <Shield className="h-4 w-4 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 flex items-center gap-2 p-3 bg-green-900/20 border border-green-500 text-green-400 rounded-lg">
            <Star className="h-4 w-4 flex-shrink-0" />
            <span className="text-sm">{success}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {/* Profile Card */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center space-x-2">
                  <UserIcon className="h-6 w-6 text-blue-400" />
                  <span>Personal Information</span>
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Manage your profile details and preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Profile Picture Section */}
                <div className="flex items-center space-x-4">
                  <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-white font-bold text-2xl">
                      {user.name?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white">{user.name}</h3>
                    <p className="text-gray-400">{user.email}</p>
                    <div className="mt-1 text-xs text-gray-500 capitalize">{user.role}</div>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Full Name
                    </label>
                    {isEditing ? (
                      <Input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500"
                        placeholder="Enter your full name"
                      />
                    ) : (
                      <div className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white">
                        {user.name}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Email
                    </label>
                    {isEditing ? (
                      <Input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500"
                        placeholder="Enter your email"
                      />
                    ) : (
                      <div className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white">
                        {user.email}
                      </div>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      College/University
                    </label>
                    {isEditing ? (
                      <Input
                        type="text"
                        name="college"
                        value={formData.college}
                        onChange={handleChange}
                        className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500"
                        placeholder="Enter your college/university"
                      />
                    ) : (
                      <div className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white">
                        {user.college || 'Not specified'}
                      </div>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Group Leader Name
                    </label>
                    {isEditing ? (
                      <Input
                        type="text"
                        name="groupLeaderName"
                        value={formData.groupLeaderName}
                        onChange={handleChange}
                        className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500"
                        placeholder="Enter your group leader name"
                      />
                    ) : (
                      <div className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white">
                        {user.group_leader_name || 'Not specified'}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Security Card (moved from Settings) */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center space-x-2">
                  <Shield className="h-6 w-6 text-green-400" />
                  <span>Security</span>
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Protect your account with security features
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-white">Change Password</h4>
                      <p className="text-gray-400 text-sm">Update your account password</p>
                    </div>
                    <button
                      className="text-gray-400 hover:text-green-400 text-sm font-medium transition-colors"
                      onClick={() => setShowPasswordModal(true)}
                    >
                      Update
                    </button>
                  </div> 
                </div>
                <div className="bg-gray-700 rounded-lg p-4">
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-white flex items-center space-x-2">
                        <LogOut className="h-4 w-4 text-red-400" />
                        <span>Sign Out</span>
                      </h4>
                      <p className="text-gray-400 text-sm">Sign out of your account</p>
                    </div>
                    <button
                      className="text-red-400 hover:text-red-300 text-sm font-medium transition-colors"
                      onClick={() => setShowSignOutDialog(true)}
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
                
                {/* Password Change Modal */}
                {showPasswordModal && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
                    <div className="bg-gray-900 border border-gray-700 rounded-lg shadow-lg w-full max-w-md p-6 relative">
                      <button
                        className="absolute top-3 right-3 text-gray-400 hover:text-white"
                        onClick={() => setShowPasswordModal(false)}
                        aria-label="Close"
                      >
                        <X className="h-5 w-5" />
                      </button>
                      <div className="flex items-center space-x-2 mb-4">
                        <Lock className="h-5 w-5 text-green-400" />
                        <span className="text-lg font-semibold text-white">Change Password</span>
                      </div>
                      <form onSubmit={handlePasswordChange} className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">Current Password</label>
                          <input
                            type="password"
                            name="oldPassword"
                            value={passwordData.oldPassword}
                            onChange={handlePasswordInput}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:border-green-500"
                            placeholder="Enter current password"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">New Password</label>
                          <input
                            type="password"
                            name="newPassword"
                            value={passwordData.newPassword}
                            onChange={handlePasswordInput}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:border-green-500"
                            placeholder="Enter new password"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">Confirm New Password</label>
                          <input
                            type="password"
                            name="confirmPassword"
                            value={passwordData.confirmPassword}
                            onChange={handlePasswordInput}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:border-green-500"
                            placeholder="Confirm new password"
                            required
                          />
                        </div>
                        {passwordError && (
                          <div className="text-red-400 text-sm flex items-center gap-2">
                            <Shield className="h-4 w-4 flex-shrink-0" />
                            <span>{passwordError}</span>
                          </div>
                        )}
                        {passwordSuccess && (
                          <div className="text-green-400 text-sm flex items-center gap-2">
                            <Star className="h-4 w-4 flex-shrink-0" />
                            <span>{passwordSuccess}</span>
                          </div>
                        )}
                        <div className="flex justify-end space-x-2 mt-4">
                          <button
                            type="button"
                            className="px-4 py-2 rounded-lg bg-gray-700 text-gray-300 hover:bg-gray-600"
                            onClick={() => setShowPasswordModal(false)}
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 font-medium"
                            disabled={passwordLoading}
                          >
                            {passwordLoading ? 'Updating...' : 'Update Password'}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Preferences Card */}
            {/* <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center space-x-2">
                  <SettingsIcon className="h-6 w-6 text-purple-400" />
                  <span>Preferences</span>
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Customize your account preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-white flex items-center space-x-2">
                        <Bell className="h-4 w-4 text-blue-400" />
                        <span>Email Notifications</span>
                      </h4>
                      <p className="text-gray-400 text-sm">Receive updates about tasks and achievements</p>
                    </div>
                    <button
                      className="w-10 h-6 bg-green-600 rounded-full relative focus:outline-none"
                      onClick={() => alert('Email notifications toggled')}
                    >
                      <div className="w-4 h-4 bg-white rounded-full absolute right-1 top-1"></div>
                    </button>
                  </div>
                </div>

                <div className="bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-white flex items-center space-x-2">
                        <HelpCircle className="h-4 w-4 text-yellow-400" />
                        <span>Help & Support</span>
                      </h4>
                      <p className="text-gray-400 text-sm">Get help and contact support</p>
                    </div>
                    <button
                      className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
                      onClick={() => alert('Help center opened')}
                    >
                      Open
                    </button>
                  </div>
                </div>

                
              </CardContent>
            </Card> */}
          </div>

          {/* Stats Card */}
          <div>
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center space-x-2">
                  <Activity className="h-6 w-6 text-green-400" />
                  <span>Your Stats</span>
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Performance overview
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-400 text-sm">Member Since</span>
                    <Calendar className="h-4 w-4 text-gray-400" />
                  </div>
                  <p className="text-white font-semibold">
                    {new Date().toLocaleDateString()}
                  </p>
                </div>

                <div className="bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-400 text-sm">Role</span>
                    <Shield className="h-4 w-4 text-gray-400" />
                  </div>
                  <p className="text-white font-semibold capitalize">
                    {user.role}
                  </p>
                </div>

                <div className="bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-400 text-sm">Status</span>
                    <Star className="h-4 w-4 text-yellow-400" />
                  </div>
                  <p className="text-green-400 font-semibold">
                    Active
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-6">
          {/* <Card className="bg-gray-800 border-gray-700 max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <Award className="h-6 w-6 text-yellow-400" />
                <span>Achievements</span>
              </CardTitle>
              <CardDescription className="text-gray-400">
                Your accomplishments and badges
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-yellow-600 rounded-full flex items-center justify-center">
                    <Star className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-medium">First Task Completed</p>
                    <p className="text-gray-400 text-sm">Completed your first task</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <TrendingUp className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-medium">Rising Star</p>
                    <p className="text-gray-400 text-sm">Reached top 10 on leaderboard</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card> */}
        </div>
      </div>

      {/* Sign Out Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showSignOutDialog}
        onClose={() => setShowSignOutDialog(false)}
        onConfirm={() => {
          if (logout) {
            logout();
          } else {
            // Fallback if logout function is not provided
            localStorage.removeItem('token');
            window.location.reload();
          }
        }}
        title="Sign Out"
        message="Are you sure you want to sign out? You will need to log in again to access your account."
        confirmText="Sign Out"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
};

export default Profile;
