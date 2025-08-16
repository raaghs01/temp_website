export interface User {
  id: string;
  name: string;
  email: string;
  college: string;
  group_leader_name: string;
  role: 'ambassador' | 'admin';
  total_points: number;
  rank_position: number;
  current_day: number;
  total_referrals: number;
  registration_date: string;
  status?: string;
}

export interface Ambassador {
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
  tasks_completed?: number;
}

export interface AdminStats {
  total_ambassadors: number;
  active_ambassadors: number;
  total_revenue: number;
  total_events: number;
  total_students_reached: number;
  average_engagement_rate: number;
  top_performing_college: string;
  monthly_growth: number;
}

export interface Task {
  id: string;
  day: number;
  title: string;
  description: string;
  task_type: string;
  points_reward: number;
  is_active: boolean;
}

export interface Submission {
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

export interface LeaderboardEntry {
  name: string;
  college: string;
  total_points: number;
  total_referrals: number;
  rank: number;
}
