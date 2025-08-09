import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  User, 
  Mail, 
  Shield, 
  Calendar,
  Edit3,
  Save,
  X,
  Key,
  Bell,
  Activity,
  Settings,
  Database,
  Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface AdminProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  created_at: string;
  last_login: string;
  permissions: string[];
  settings: {
    email_notifications: boolean;
    security_alerts: boolean;
    weekly_reports: boolean;
    system_updates: boolean;
  };
}

interface AdminStats {
  users_managed: number;
  reports_generated: number;
  system_actions: number;
  uptime_maintained: number;
}

const Profile: React.FC<{ user: any; refreshUser: () => Promise<void> }> = ({ user, refreshUser }) => {
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    department: ''
  });
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  const sampleProfile: AdminProfile = {
    id: 'admin_001',
    name: 'Admin User',
    email: 'admin@test.com',
    role: 'System Administrator',
    department: 'DS Team',
    created_at: '2023-06-15',
    last_login: '2024-01-15 14:30:00',
    permissions: [
      'user_management',
      'system_settings',
      'data_export',
      'security_config',
      'analytics_access',
      'task_management'
    ],
    settings: {
      email_notifications: true,
      security_alerts: true,
      weekly_reports: true,
      system_updates: false
    }
  };

  const sampleStats: AdminStats = {
    users_managed: 145,
    reports_generated: 67,
    system_actions: 1247,
    uptime_maintained: 99.8
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 1000));
        setProfile(sampleProfile);
        setStats(sampleStats);
        setEditForm({
          name: sampleProfile.name,
          email: sampleProfile.email,
          department: sampleProfile.department
        });
      } catch (error) {
        console.error('Error fetching profile:', error);
        setProfile(sampleProfile);
        setStats(sampleStats);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      if (profile) {
        const updatedProfile = {
          ...profile,
          name: editForm.name,
          email: editForm.email,
          department: editForm.department
        };
        setProfile(updatedProfile);
        setIsEditing(false);
        await refreshUser();
        alert('Profile updated successfully!');
      }
    } catch (error) {
      alert('Failed to update profile. Please try again.');
    }
  };

  const handleCancel = () => {
    if (profile) {
      setEditForm({
        name: profile.name,
        email: profile.email,
        department: profile.department
      });
    }
    setIsEditing(false);
  };

  const handlePasswordChange = async () => {
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      alert('New passwords do not match!');
      return;
    }
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert('Password changed successfully!');
      setShowPasswordModal(false);
      setPasswordForm({
        current_password: '',
        new_password: '',
        confirm_password: ''
      });
    } catch (error) {
      alert('Failed to change password. Please try again.');
    }
  };

  const updateNotificationSetting = (key: keyof AdminProfile['settings'], value: boolean) => {
    if (profile) {
      setProfile({
        ...profile,
        settings: {
          ...profile.settings,
          [key]: value
        }
      });
    }
  };

  const getPermissionIcon = (permission: string) => {
    switch (permission) {
      case 'user_management': return <Users className="h-4 w-4" />;
      case 'system_settings': return <Settings className="h-4 w-4" />;
      case 'data_export': return <Database className="h-4 w-4" />;
      case 'security_config': return <Shield className="h-4 w-4" />;
      case 'analytics_access': return <Activity className="h-4 w-4" />;
      case 'task_management': return <Calendar className="h-4 w-4" />;
      default: return <Shield className="h-4 w-4" />;
    }
  };

  const getPermissionLabel = (permission: string) => {
    return permission.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-xl text-gray-400">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-800">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold">Admin Profile</h1>
          <span className="px-3 py-1 bg-purple-600 text-white text-sm rounded-full">System Administrator</span>
        </div>
        
        <div className="flex items-center space-x-4">
          {!isEditing ? (
            <Button onClick={handleEdit} className="bg-blue-600 hover:bg-blue-700">
              <Edit3 className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          ) : (
            <div className="flex space-x-2">
              <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700">
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
              <Button onClick={handleCancel} variant="outline" className="border-gray-600 text-gray-300">
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Information */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Profile Information
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Manage your account details and personal information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center space-x-6">
                  <div className="w-20 h-20 bg-purple-600 rounded-full flex items-center justify-center text-2xl font-bold">
                    {profile?.name.split(' ').map(n => n[0]).join('') || 'A'}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white">{profile?.name}</h3>
                    <p className="text-gray-400">{profile?.role}</p>
                    <p className="text-purple-400">{profile?.department}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Full Name
                    </label>
                    {isEditing ? (
                      <Input
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="bg-gray-700 border-gray-600 text-white"
                      />
                    ) : (
                      <p className="text-white bg-gray-700 px-3 py-2 rounded-lg">{profile?.name}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Email Address
                    </label>
                    {isEditing ? (
                      <Input
                        type="email"
                        value={editForm.email}
                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                        className="bg-gray-700 border-gray-600 text-white"
                      />
                    ) : (
                      <p className="text-white bg-gray-700 px-3 py-2 rounded-lg">{profile?.email}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Department
                    </label>
                    {isEditing ? (
                      <Input
                        value={editForm.department}
                        onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                        className="bg-gray-700 border-gray-600 text-white"
                      />
                    ) : (
                      <p className="text-white bg-gray-700 px-3 py-2 rounded-lg">{profile?.department}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Role
                    </label>
                    <p className="text-white bg-gray-700 px-3 py-2 rounded-lg">{profile?.role}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Account Created
                    </label>
                    <p className="text-white bg-gray-700 px-3 py-2 rounded-lg">{profile?.created_at}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Last Login
                    </label>
                    <p className="text-white bg-gray-700 px-3 py-2 rounded-lg">{profile?.last_login}</p>
                  </div>
                </div>

                <div className="flex justify-start">
                  <Button 
                    onClick={() => setShowPasswordModal(true)}
                    variant="outline" 
                    className="border-gray-600 text-gray-300"
                  >
                    <Key className="h-4 w-4 mr-2" />
                    Change Password
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Permissions */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Shield className="h-5 w-5 mr-2" />
                  Permissions & Access
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Your current system permissions and access levels
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {profile?.permissions.map((permission) => (
                    <div key={permission} className="flex items-center space-x-3 p-3 bg-gray-700 rounded-lg">
                      <div className="text-green-400">
                        {getPermissionIcon(permission)}
                      </div>
                      <span className="text-white">{getPermissionLabel(permission)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Admin Stats */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Admin Statistics</CardTitle>
                <CardDescription className="text-gray-400">Your administrative metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-400">{stats?.users_managed}</p>
                  <p className="text-gray-400 text-sm">Users Managed</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-400">{stats?.reports_generated}</p>
                  <p className="text-gray-400 text-sm">Reports Generated</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-400">{stats?.system_actions}</p>
                  <p className="text-gray-400 text-sm">System Actions</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-yellow-400">{stats?.uptime_maintained}%</p>
                  <p className="text-gray-400 text-sm">Uptime Maintained</p>
                </div>
              </CardContent>
            </Card>

            {/* Notification Settings */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Bell className="h-5 w-5 mr-2" />
                  Notification Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { key: 'email_notifications', label: 'Email Notifications' },
                  { key: 'security_alerts', label: 'Security Alerts' },
                  { key: 'weekly_reports', label: 'Weekly Reports' },
                  { key: 'system_updates', label: 'System Updates' }
                ].map((setting) => (
                  <div key={setting.key} className="flex items-center justify-between">
                    <span className="text-gray-300 text-sm">{setting.label}</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={profile?.settings[setting.key as keyof AdminProfile['settings']]}
                        onChange={(e) => updateNotificationSetting(setting.key as keyof AdminProfile['settings'], e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Change Password Modal */}
        {showPasswordModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true">
            <div className="absolute inset-0 bg-black/70" onClick={() => setShowPasswordModal(false)}></div>
            <div className="relative w-full max-w-md mx-4 bg-gray-900 rounded-lg border border-gray-700 shadow-xl">
              <div className="flex items-center justify-between p-6 border-b border-gray-800">
                <h3 className="text-lg font-semibold text-white">Change Password</h3>
                <button
                  onClick={() => setShowPasswordModal(false)}
                  className="text-gray-400 hover:text-white"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Current Password
                    </label>
                    <Input
                      type="password"
                      value={passwordForm.current_password}
                      onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      New Password
                    </label>
                    <Input
                      type="password"
                      value={passwordForm.new_password}
                      onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Confirm New Password
                    </label>
                    <Input
                      type="password"
                      value={passwordForm.confirm_password}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <Button
                    onClick={() => setShowPasswordModal(false)}
                    variant="outline"
                    className="border-gray-700 text-gray-300 hover:bg-gray-800"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handlePasswordChange}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Change Password
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

export default Profile;
