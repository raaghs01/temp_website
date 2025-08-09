import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Settings as SettingsIcon, 
  User, 
  Shield, 
  Bell,
  Database,
  Globe,
  Mail,
  Key,
  Save,
  RefreshCw,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface SystemSettings {
  general: {
    system_name: string;
    admin_email: string;
    maintenance_mode: boolean;
    debug_mode: boolean;
    max_ambassadors: number;
    points_per_task: number;
  };
  notifications: {
    email_notifications: boolean;
    slack_notifications: boolean;
    sms_notifications: boolean;
    daily_reports: boolean;
    alert_threshold: number;
  };
  security: {
    password_policy: 'basic' | 'medium' | 'strict';
    session_timeout: number;
    two_factor_auth: boolean;
    api_rate_limiting: boolean;
    login_attempts: number;
  };
  integrations: {
    mongodb_url: string;
    smtp_server: string;
    slack_webhook: string;
    analytics_key: string;
  };
}

const Settings: React.FC<{ logout: () => void }> = ({ logout }) => {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'notifications' | 'security' | 'integrations'>('general');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const defaultSettings: SystemSettings = {
    general: {
      system_name: 'DC Studios Ambassador Platform',
      admin_email: 'admin@dcstudios.com',
      maintenance_mode: false,
      debug_mode: false,
      max_ambassadors: 500,
      points_per_task: 100
    },
    notifications: {
      email_notifications: true,
      slack_notifications: true,
      sms_notifications: false,
      daily_reports: true,
      alert_threshold: 85
    },
    security: {
      password_policy: 'medium',
      session_timeout: 30,
      two_factor_auth: false,
      api_rate_limiting: true,
      login_attempts: 5
    },
    integrations: {
      mongodb_url: 'mongodb://localhost:27017/ambassador_db',
      smtp_server: 'smtp.gmail.com:587',
      slack_webhook: 'https://hooks.slack.com/services/...',
      analytics_key: 'GA_MEASUREMENT_ID'
    }
  };

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 1000));
        setSettings(defaultSettings);
      } catch (error) {
        console.error('Error fetching settings:', error);
        setSettings(defaultSettings);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setSuccessMessage('Settings saved successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      setErrorMessage('Failed to save settings. Please try again.');
      setTimeout(() => setErrorMessage(''), 3000);
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (section: keyof SystemSettings, key: string, value: any) => {
    if (!settings) return;
    
    setSettings({
      ...settings,
      [section]: {
        ...settings[section],
        [key]: value
      }
    });
  };

  const handleLogout = () => {
    if (confirm('Are you sure you want to logout?')) {
      logout();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-xl text-gray-400">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-800">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold">System Settings</h1>
          <span className="px-3 py-1 bg-purple-600 text-white text-sm rounded-full">Admin Control</span>
        </div>
        
        <div className="flex items-center space-x-4">
          {successMessage && (
            <div className="flex items-center space-x-2 text-green-400">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm">{successMessage}</span>
            </div>
          )}
          {errorMessage && (
            <div className="flex items-center space-x-2 text-red-400">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm">{errorMessage}</span>
            </div>
          )}
          <Button 
            onClick={handleSave}
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {saving ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-4">
                <nav className="space-y-2">
                  {[
                    { id: 'general', label: 'General Settings', icon: SettingsIcon },
                    { id: 'notifications', label: 'Notifications', icon: Bell },
                    { id: 'security', label: 'Security', icon: Shield },
                    { id: 'integrations', label: 'Integrations', icon: Globe }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                        activeTab === tab.id
                          ? 'bg-purple-600 text-white'
                          : 'text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      <tab.icon className="h-5 w-5" />
                      <span>{tab.label}</span>
                    </button>
                  ))}
                </nav>
              </CardContent>
            </Card>

            {/* Account Actions */}
            <Card className="bg-gray-800 border-gray-700 mt-6">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Account Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  onClick={handleLogout}
                  variant="outline" 
                  className="w-full border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
                >
                  Logout
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Settings Content */}
          <div className="lg:col-span-3">
            {/* General Settings */}
            {activeTab === 'general' && (
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">General Settings</CardTitle>
                  <CardDescription className="text-gray-400">
                    Configure basic system settings and parameters
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        System Name
                      </label>
                      <Input
                        value={settings?.general.system_name}
                        onChange={(e) => updateSetting('general', 'system_name', e.target.value)}
                        className="bg-gray-700 border-gray-600 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Admin Email
                      </label>
                      <Input
                        type="email"
                        value={settings?.general.admin_email}
                        onChange={(e) => updateSetting('general', 'admin_email', e.target.value)}
                        className="bg-gray-700 border-gray-600 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Max Ambassadors
                      </label>
                      <Input
                        type="number"
                        value={settings?.general.max_ambassadors}
                        onChange={(e) => updateSetting('general', 'max_ambassadors', parseInt(e.target.value))}
                        className="bg-gray-700 border-gray-600 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Default Points per Task
                      </label>
                      <Input
                        type="number"
                        value={settings?.general.points_per_task}
                        onChange={(e) => updateSetting('general', 'points_per_task', parseInt(e.target.value))}
                        className="bg-gray-700 border-gray-600 text-white"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                      <div>
                        <h4 className="text-white font-medium">Maintenance Mode</h4>
                        <p className="text-gray-400 text-sm">Temporarily disable system access</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings?.general.maintenance_mode}
                          onChange={(e) => updateSetting('general', 'maintenance_mode', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                      </label>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                      <div>
                        <h4 className="text-white font-medium">Debug Mode</h4>
                        <p className="text-gray-400 text-sm">Enable detailed logging and error reporting</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings?.general.debug_mode}
                          onChange={(e) => updateSetting('general', 'debug_mode', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                      </label>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Notifications Settings */}
            {activeTab === 'notifications' && (
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Notification Settings</CardTitle>
                  <CardDescription className="text-gray-400">
                    Configure how and when you receive notifications
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    {[
                      { key: 'email_notifications', label: 'Email Notifications', description: 'Receive notifications via email' },
                      { key: 'slack_notifications', label: 'Slack Notifications', description: 'Send alerts to Slack channel' },
                      { key: 'sms_notifications', label: 'SMS Notifications', description: 'Critical alerts via SMS' },
                      { key: 'daily_reports', label: 'Daily Reports', description: 'Automated daily summary reports' }
                    ].map((notification) => (
                      <div key={notification.key} className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                        <div>
                          <h4 className="text-white font-medium">{notification.label}</h4>
                          <p className="text-gray-400 text-sm">{notification.description}</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings?.notifications[notification.key as keyof typeof settings.notifications] as boolean}
                            onChange={(e) => updateSetting('notifications', notification.key, e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                        </label>
                      </div>
                    ))}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Alert Threshold (%)
                    </label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={settings?.notifications.alert_threshold}
                      onChange={(e) => updateSetting('notifications', 'alert_threshold', parseInt(e.target.value))}
                      className="bg-gray-700 border-gray-600 text-white max-w-xs"
                    />
                    <p className="text-gray-400 text-sm mt-1">
                      Send alerts when system performance drops below this threshold
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Security Settings */}
            {activeTab === 'security' && (
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Security Settings</CardTitle>
                  <CardDescription className="text-gray-400">
                    Configure security policies and authentication settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Password Policy
                      </label>
                      <select 
                        value={settings?.security.password_policy}
                        onChange={(e) => updateSetting('security', 'password_policy', e.target.value)}
                        className="w-full bg-gray-700 border-gray-600 text-white rounded-lg p-2"
                      >
                        <option value="basic">Basic (8+ characters)</option>
                        <option value="medium">Medium (8+ chars, mixed case)</option>
                        <option value="strict">Strict (12+ chars, special chars)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Session Timeout (minutes)
                      </label>
                      <Input
                        type="number"
                        value={settings?.security.session_timeout}
                        onChange={(e) => updateSetting('security', 'session_timeout', parseInt(e.target.value))}
                        className="bg-gray-700 border-gray-600 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Max Login Attempts
                      </label>
                      <Input
                        type="number"
                        value={settings?.security.login_attempts}
                        onChange={(e) => updateSetting('security', 'login_attempts', parseInt(e.target.value))}
                        className="bg-gray-700 border-gray-600 text-white"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                      <div>
                        <h4 className="text-white font-medium">Two-Factor Authentication</h4>
                        <p className="text-gray-400 text-sm">Require 2FA for admin accounts</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings?.security.two_factor_auth}
                          onChange={(e) => updateSetting('security', 'two_factor_auth', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                      </label>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                      <div>
                        <h4 className="text-white font-medium">API Rate Limiting</h4>
                        <p className="text-gray-400 text-sm">Limit API requests to prevent abuse</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings?.security.api_rate_limiting}
                          onChange={(e) => updateSetting('security', 'api_rate_limiting', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                      </label>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Integrations Settings */}
            {activeTab === 'integrations' && (
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Integration Settings</CardTitle>
                  <CardDescription className="text-gray-400">
                    Configure external service connections and API keys
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        <Database className="h-4 w-4 inline mr-2" />
                        MongoDB Connection URL
                      </label>
                      <Input
                        type="password"
                        value={settings?.integrations.mongodb_url}
                        onChange={(e) => updateSetting('integrations', 'mongodb_url', e.target.value)}
                        className="bg-gray-700 border-gray-600 text-white"
                        placeholder="mongodb://username:password@host:port/database"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        <Mail className="h-4 w-4 inline mr-2" />
                        SMTP Server
                      </label>
                      <Input
                        value={settings?.integrations.smtp_server}
                        onChange={(e) => updateSetting('integrations', 'smtp_server', e.target.value)}
                        className="bg-gray-700 border-gray-600 text-white"
                        placeholder="smtp.gmail.com:587"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        <Bell className="h-4 w-4 inline mr-2" />
                        Slack Webhook URL
                      </label>
                      <Input
                        type="password"
                        value={settings?.integrations.slack_webhook}
                        onChange={(e) => updateSetting('integrations', 'slack_webhook', e.target.value)}
                        className="bg-gray-700 border-gray-600 text-white"
                        placeholder="https://hooks.slack.com/services/..."
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        <Key className="h-4 w-4 inline mr-2" />
                        Analytics Tracking ID
                      </label>
                      <Input
                        value={settings?.integrations.analytics_key}
                        onChange={(e) => updateSetting('integrations', 'analytics_key', e.target.value)}
                        className="bg-gray-700 border-gray-600 text-white"
                        placeholder="G-XXXXXXXXXX"
                      />
                    </div>
                  </div>
                  
                  <div className="p-4 bg-yellow-900/20 border border-yellow-700 rounded-lg">
                    <div className="flex items-start space-x-3">
                      <AlertTriangle className="h-5 w-5 text-yellow-400 mt-0.5" />
                      <div>
                        <h4 className="text-yellow-400 font-medium">Security Notice</h4>
                        <p className="text-yellow-300 text-sm">
                          These settings contain sensitive information. Ensure proper access controls are in place.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
