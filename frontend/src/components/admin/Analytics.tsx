import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  TrendingUp, 
  Users, 
  Award, 
  Calendar, 
  BarChart3,
  Activity,
  Target,
  Clock,
  Download,
  Filter
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SystemMetrics {
  totalAmbassadors: number;
  activeAmbassadors: number;
  weeklyGrowth: number;
  avgTaskCompletion: number;
  totalPointsAwarded: number;
  systemUptime: number;
  peakActiveHours: string;
  topPerformingCollege: string;
}

const Analytics: React.FC = () => {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter'>('month');

  const sampleMetrics: SystemMetrics = {
    totalAmbassadors: 145,
    activeAmbassadors: 128,
    weeklyGrowth: 12.5,
    avgTaskCompletion: 78.3,
    totalPointsAwarded: 125600,
    systemUptime: 99.8,
    peakActiveHours: '6:00 PM - 9:00 PM',
    topPerformingCollege: 'IIT Delhi'
  };

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 1000));
        setMetrics(sampleMetrics);
      } catch (error) {
        console.error('Error fetching analytics:', error);
        setMetrics(sampleMetrics);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, [selectedPeriod]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-xl text-gray-400">Loading analytics...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-800">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold">System Analytics</h1>
          <span className="px-3 py-1 bg-purple-600 text-white text-sm rounded-full">Admin View</span>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex space-x-2">
            {(['week', 'month', 'quarter'] as const).map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedPeriod === period
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </button>
            ))}
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-medium">Total Ambassadors</p>
                  <p className="text-2xl font-bold text-white mt-1">{metrics?.totalAmbassadors}</p>
                  <p className="text-green-400 text-xs mt-1">+{metrics?.weeklyGrowth}% this week</p>
                </div>
                <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Users className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-medium">Active Rate</p>
                  <p className="text-2xl font-bold text-white mt-1">{((metrics?.activeAmbassadors || 0) / (metrics?.totalAmbassadors || 1) * 100).toFixed(1)}%</p>
                  <p className="text-green-400 text-xs mt-1">{metrics?.activeAmbassadors} active today</p>
                </div>
                <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                  <Activity className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-medium">Avg Completion</p>
                  <p className="text-2xl font-bold text-white mt-1">{metrics?.avgTaskCompletion}%</p>
                  <p className="text-yellow-400 text-xs mt-1">Task completion rate</p>
                </div>
                <div className="w-12 h-12 bg-yellow-600 rounded-lg flex items-center justify-center">
                  <Target className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-medium">System Uptime</p>
                  <p className="text-2xl font-bold text-white mt-1">{metrics?.systemUptime}%</p>
                  <p className="text-green-400 text-xs mt-1">Last 30 days</p>
                </div>
                <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* User Growth Chart */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Ambassador Growth Trend</CardTitle>
              <CardDescription className="text-gray-400">Monthly registration and activation rates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80 bg-gray-700 rounded-lg p-4">
                <GrowthChart />
              </div>
            </CardContent>
          </Card>

          {/* Performance Distribution */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Performance Distribution</CardTitle>
              <CardDescription className="text-gray-400">Ambassador performance across colleges</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80 bg-gray-700 rounded-lg p-4">
                <PerformanceChart />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Analytics Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Top Performing Colleges */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Top Performing Colleges</CardTitle>
              <CardDescription className="text-gray-400">Ranked by average completion rate</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { name: 'IIT Delhi', ambassadors: 15, completion: 92, points: 15600 },
                  { name: 'IIT Bombay', ambassadors: 12, completion: 89, points: 14200 },
                  { name: 'IIT Madras', ambassadors: 10, completion: 87, points: 12800 },
                  { name: 'IIT Kanpur', ambassadors: 8, completion: 85, points: 11400 },
                  { name: 'IIT Kharagpur', ambassadors: 9, completion: 83, points: 10900 }
                ].map((college, index) => (
                  <div key={college.name} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="text-white font-medium">{college.name}</p>
                        <p className="text-gray-400 text-sm">{college.ambassadors} ambassadors</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-medium">{college.completion}%</p>
                      <p className="text-gray-400 text-sm">{college.points.toLocaleString()} pts</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* System Insights */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">System Insights</CardTitle>
              <CardDescription className="text-gray-400">Key performance indicators</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-300">Daily Active Users</span>
                    <span className="text-white font-medium">85%</span>
                  </div>
                  <div className="w-full bg-gray-600 rounded-full h-3">
                    <div className="bg-green-500 h-3 rounded-full" style={{ width: '85%' }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-300">Task Completion Rate</span>
                    <span className="text-white font-medium">78%</span>
                  </div>
                  <div className="w-full bg-gray-600 rounded-full h-3">
                    <div className="bg-blue-500 h-3 rounded-full" style={{ width: '78%' }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-300">User Satisfaction</span>
                    <span className="text-white font-medium">94%</span>
                  </div>
                  <div className="w-full bg-gray-600 rounded-full h-3">
                    <div className="bg-purple-500 h-3 rounded-full" style={{ width: '94%' }}></div>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-600">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-white">{metrics?.peakActiveHours}</p>
                      <p className="text-gray-400 text-sm">Peak Hours</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">{metrics?.totalPointsAwarded?.toLocaleString()}</p>
                      <p className="text-gray-400 text-sm">Total Points</p>
                    </div>
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

export default Analytics;

// Growth Chart Component
const GrowthChart: React.FC = () => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  const registrations = [15, 23, 18, 32, 28, 35];
  const activations = [12, 20, 16, 28, 25, 31];
  
  const width = 500;
  const height = 250;
  const padding = 40;
  const stepX = (width - padding * 2) / (months.length - 1);
  const maxVal = Math.max(...registrations, ...activations);
  
  const scaleY = (value: number) => {
    return padding + (height - padding * 2) * (1 - value / maxVal);
  };

  const regPoints = registrations.map((v, i) => `${padding + i * stepX},${scaleY(v)}`).join(' ');
  const actPoints = activations.map((v, i) => `${padding + i * stepX},${scaleY(v)}`).join(' ');

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
      <defs>
        <linearGradient id="regGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.3} />
          <stop offset="100%" stopColor="#3B82F6" stopOpacity={0} />
        </linearGradient>
        <linearGradient id="actGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#10B981" stopOpacity={0.3} />
          <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
        </linearGradient>
      </defs>
      
      {/* Grid lines */}
      {[0, 10, 20, 30, 40].map(val => (
        <line key={val} x1={padding} y1={scaleY(val)} x2={width - padding} y2={scaleY(val)} 
              stroke="#374151" strokeDasharray="2,2" strokeWidth={1} />
      ))}
      
      {/* X labels */}
      {months.map((month, i) => (
        <text key={month} x={padding + i * stepX} y={height - 10} textAnchor="middle" fontSize="12" fill="#9CA3AF">
          {month}
        </text>
      ))}
      
      {/* Registration area and line */}
      <polyline points={`${regPoints} ${width - padding},${height - padding} ${padding},${height - padding}`} 
                fill="url(#regGradient)" stroke="none" />
      <polyline points={regPoints} fill="none" stroke="#3B82F6" strokeWidth={3} strokeLinejoin="round" />
      
      {/* Activation line */}
      <polyline points={actPoints} fill="none" stroke="#10B981" strokeWidth={3} strokeLinejoin="round" strokeDasharray="5,5" />
      
      {/* Points */}
      {registrations.map((v, i) => (
        <circle key={`reg-${i}`} cx={padding + i * stepX} cy={scaleY(v)} r={4} fill="#3B82F6" />
      ))}
      {activations.map((v, i) => (
        <circle key={`act-${i}`} cx={padding + i * stepX} cy={scaleY(v)} r={4} fill="#10B981" />
      ))}
      
      {/* Legend */}
      <g transform="translate(350, 30)">
        <circle cx={0} cy={0} r={3} fill="#3B82F6" />
        <text x={10} y={4} fontSize="10" fill="#9CA3AF">Registrations</text>
        <circle cx={0} cy={15} r={3} fill="#10B981" />
        <text x={10} y={19} fontSize="10" fill="#9CA3AF">Activations</text>
      </g>
    </svg>
  );
};

// Performance Chart Component (Donut Chart)
const PerformanceChart: React.FC = () => {
  const data = [
    { label: 'High Performers', value: 35, color: '#10B981' },
    { label: 'Average Performers', value: 45, color: '#3B82F6' },
    { label: 'Low Performers', value: 20, color: '#F59E0B' }
  ];
  
  const total = data.reduce((sum, item) => sum + item.value, 0);
  let currentAngle = -90;

  return (
    <svg width="100%" height="250" viewBox="0 0 300 250">
      <g transform="translate(150, 125)">
        {data.map((item, index) => {
          const percentage = item.value / total;
          const angle = percentage * 360;
          const startAngle = currentAngle * Math.PI / 180;
          const endAngle = (currentAngle + angle) * Math.PI / 180;
          
          const largeArcFlag = angle > 180 ? 1 : 0;
          const outerRadius = 80;
          const innerRadius = 40;
          
          const x1 = Math.cos(startAngle) * outerRadius;
          const y1 = Math.sin(startAngle) * outerRadius;
          const x2 = Math.cos(endAngle) * outerRadius;
          const y2 = Math.sin(endAngle) * outerRadius;
          
          const x3 = Math.cos(endAngle) * innerRadius;
          const y3 = Math.sin(endAngle) * innerRadius;
          const x4 = Math.cos(startAngle) * innerRadius;
          const y4 = Math.sin(startAngle) * innerRadius;
          
          const pathData = [
            `M ${x1} ${y1}`,
            `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
            `L ${x3} ${y3}`,
            `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${x4} ${y4}`,
            'Z'
          ].join(' ');
          
          currentAngle += angle;
          
          return (
            <path key={index} d={pathData} fill={item.color} stroke="#1F2937" strokeWidth={2} />
          );
        })}
        
        {/* Center text */}
        <text textAnchor="middle" y={-5} fontSize="16" fill="white" fontWeight="bold">
          {total}%
        </text>
        <text textAnchor="middle" y={10} fontSize="10" fill="#9CA3AF">
          Avg Score
        </text>
      </g>
      
      {/* Legend */}
      <g transform="translate(20, 180)">
        {data.map((item, index) => (
          <g key={index} transform={`translate(0, ${index * 20})`}>
            <circle cx={5} cy={5} r={4} fill={item.color} />
            <text x={15} y={8} fontSize="10" fill="#9CA3AF">
              {item.label}: {item.value}%
            </text>
          </g>
        ))}
      </g>
    </svg>
  );
};
