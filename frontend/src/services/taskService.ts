const BACKEND_URL = 'http://127.0.0.1:5001';

export interface TaskCompletion {
  id: string;
  taskId: string;
  taskTitle: string;
  taskDescription: string;
  day: number;
  category: string;
  points: number;
  peopleConnected: number;
  submissionText: string;
  imageUrl?: string;
  submittedAt: string;
  completedAt: string;
  status: 'completed' | 'in_progress' | 'available' | 'locked';
  estimatedTime?: string;
}

export interface TaskStats {
  totalTasks: number;
  completedTasks: number;
  totalPoints: number;
  totalPeopleConnected: number;
  averagePointsPerTask: number;
  categoryBreakdown: { [key: string]: number };
  monthlyProgress: { month: string; tasks: number; points: number }[];
  recentCompletions: TaskCompletion[];
}

export interface Task {
  id: string;
  title: string;
  description: string;
  points: number;
  deadline: string;
  status: 'available' | 'in_progress' | 'completed' | 'locked';
  category: string;
  day: number;
  completedAt?: string;
  estimatedTime?: string;
}

class TaskService {
  private static instance: TaskService;
  private cache: {
    tasks?: Task[];
    submissions?: TaskCompletion[];
    stats?: TaskStats;
    lastFetch?: number;
  } = {};
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  static getInstance(): TaskService {
    if (!TaskService.instance) {
      TaskService.instance = new TaskService();
    }
    return TaskService.instance;
  }

  private async fetchWithAuth(url: string) {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  private isCacheValid(): boolean {
    return this.cache.lastFetch !== undefined &&
           (Date.now() - this.cache.lastFetch) < this.CACHE_DURATION;
  }

  async getTasks(): Promise<Task[]> {
    if (this.cache.tasks && this.isCacheValid()) {
      return this.cache.tasks;
    }

    try {
      const tasksData = await this.fetchWithAuth(`${BACKEND_URL}/api/tasks`);
      const submissionsData = await this.fetchWithAuth(`${BACKEND_URL}/api/my-submissions`);
      
      const completedTaskIds = new Set(submissionsData.map((sub: any) => sub.task_id));
      const maxAvailableTasks = Math.min(submissionsData.length + 3, tasksData.length);

      const transformedTasks = tasksData.map((task: any, index: number) => {
        let status: 'available' | 'completed' | 'locked' = 'locked';

        if (completedTaskIds.has(task.id)) {
          status = 'completed';
        } else if (index < maxAvailableTasks) {
          status = 'available';
        }

        // Determine category based on task type and day
        const getCategory = (taskData: any) => {
          if (taskData.task_type === 'orientation') return 'Orientation';
          if (taskData.day <= 5) return 'Getting Started';
          if (taskData.day <= 10) return 'Building Network';
          return 'Advanced Tasks';
        };

        return {
          id: task.id,
          title: task.title,
          description: task.description,
          points: task.points_reward,
          deadline: `Day ${task.day}`,
          status,
          category: getCategory(task),
          day: task.day,
          estimatedTime: '2-3 hours'
        };
      });

      this.cache.tasks = transformedTasks;
      this.cache.lastFetch = Date.now();
      return transformedTasks;
    } catch (error) {
      console.error('Error fetching tasks:', error);
      return [];
    }
  }

  async getTaskCompletions(): Promise<TaskCompletion[]> {
    if (this.cache.submissions && this.isCacheValid()) {
      return this.cache.submissions;
    }

    try {
      const [tasksData, submissionsData] = await Promise.all([
        this.fetchWithAuth(`${BACKEND_URL}/api/tasks`),
        this.fetchWithAuth(`${BACKEND_URL}/api/my-submissions`)
      ]);

      const tasksMap = new Map(tasksData.map((task: any) => [task.id, task]));

      const transformedSubmissions = submissionsData.map((sub: any) => {
        const task = tasksMap.get(sub.task_id);
        // Determine category based on task type and day
        const getCategory = (taskData: any) => {
          if (!taskData) return 'General';
          if (taskData.task_type === 'orientation') return 'Orientation';
          if (taskData.day <= 5) return 'Getting Started';
          if (taskData.day <= 10) return 'Building Network';
          return 'Advanced Tasks';
        };

        return {
          id: sub.id,
          taskId: sub.task_id,
          taskTitle: (task as any)?.title || 'Task',
          taskDescription: (task as any)?.description || '',
          day: sub.day,
          category: getCategory(task),
          points: sub.points_earned,
          peopleConnected: sub.people_connected || 0,
          submissionText: sub.status_text || '',
          imageUrl: sub.proof_image ? `data:image/jpeg;base64,${sub.proof_image}` : undefined,
          submittedAt: sub.submission_date,
          completedAt: sub.completion_date || sub.submission_date,
          status: 'completed' as const,
          estimatedTime: '2-3 hours'
        };
      });

      this.cache.submissions = transformedSubmissions;
      this.cache.lastFetch = Date.now();
      return transformedSubmissions;
    } catch (error) {
      console.error('Error fetching task completions:', error);
      return [];
    }
  }

  async getTaskStats(): Promise<TaskStats> {
    if (this.cache.stats && this.isCacheValid()) {
      return this.cache.stats;
    }

    try {
      const [tasks, completions] = await Promise.all([
        this.getTasks(),
        this.getTaskCompletions()
      ]);

      const totalTasks = tasks.length;
      const completedTasks = completions.length;
      const totalPoints = completions.reduce((sum, comp) => sum + comp.points, 0);
      const totalPeopleConnected = completions.reduce((sum, comp) => sum + comp.peopleConnected, 0);
      const averagePointsPerTask = completedTasks > 0 ? totalPoints / completedTasks : 0;

      // Category breakdown
      const categoryBreakdown: { [key: string]: number } = {};
      completions.forEach(comp => {
        categoryBreakdown[comp.category] = (categoryBreakdown[comp.category] || 0) + 1;
      });

      // Monthly progress
      const monthlyData: { [key: string]: { tasks: number; points: number } } = {};
      completions.forEach(comp => {
        const date = new Date(comp.completedAt);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { tasks: 0, points: 0 };
        }
        monthlyData[monthKey].tasks += 1;
        monthlyData[monthKey].points += comp.points;
      });

      const monthlyProgress = Object.entries(monthlyData).map(([key, data]) => {
        const [year, month] = key.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1);
        return {
          month: date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' }),
          tasks: data.tasks,
          points: data.points
        };
      }).sort((a, b) => a.month.localeCompare(b.month));

      // Recent completions (last 5)
      const recentCompletions = completions
        .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
        .slice(0, 5);

      const stats: TaskStats = {
        totalTasks,
        completedTasks,
        totalPoints,
        totalPeopleConnected,
        averagePointsPerTask,
        categoryBreakdown,
        monthlyProgress,
        recentCompletions
      };

      this.cache.stats = stats;
      return stats;
    } catch (error) {
      console.error('Error calculating task stats:', error);
      return {
        totalTasks: 0,
        completedTasks: 0,
        totalPoints: 0,
        totalPeopleConnected: 0,
        averagePointsPerTask: 0,
        categoryBreakdown: {},
        monthlyProgress: [],
        recentCompletions: []
      };
    }
  }

  clearCache(): void {
    this.cache = {};
  }

  async refreshData(): Promise<void> {
    this.clearCache();
    await Promise.all([
      this.getTasks(),
      this.getTaskCompletions(),
      this.getTaskStats()
    ]);
  }
}

export const taskService = TaskService.getInstance();
