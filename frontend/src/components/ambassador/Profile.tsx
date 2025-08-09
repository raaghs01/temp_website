import React, { useState, useEffect } from 'react';
import { User } from '../../types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { User as UserIcon, Award, Calendar, Edit, Save, X, Shield, Star, TrendingUp, Activity } from 'lucide-react';

interface ProfileProps {
  user: User | null;
  refreshUser: () => Promise<void>;
}

const BACKEND_URL = 'http://127.0.0.1:8000';

const Profile: React.FC<ProfileProps> = ({ user, refreshUser }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    college: user?.college || '',
    email: user?.email || ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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
        body: JSON.stringify(formData),
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
      email: user?.email || ''
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
      email: user?.email || ''
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
          <h1 className="text-2xl font-bold">Profile</h1>
        </div>
        
        <div className="flex items-center space-x-4">
          {!isEditing ? (
            <Button
              onClick={() => setIsEditing(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          ) : (
            <div className="flex space-x-2">
              <Button
                onClick={handleSave}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save
              </Button>
              <Button
                onClick={handleCancel}
                className="bg-gray-600 hover:bg-gray-700 text-white"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
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
          <div className="lg:col-span-2">
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
                </div>
              </CardContent>
            </Card>
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
          <Card className="bg-gray-800 border-gray-700 max-w-2xl mx-auto">
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
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;
