import { useState, useEffect, useCallback } from 'react';
import { taskService, Task, TaskCompletion, TaskStats } from '../services/taskService';

export interface UseTaskDataReturn {
  tasks: Task[];
  completions: TaskCompletion[];
  stats: TaskStats;
  loading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
}

export const useTaskData = (autoRefresh: boolean = true): UseTaskDataReturn => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [completions, setCompletions] = useState<TaskCompletion[]>([]);
  const [stats, setStats] = useState<TaskStats>({
    totalTasks: 0,
    completedTasks: 0,
    totalPoints: 0,
    totalPeopleConnected: 0,
    averagePointsPerTask: 0,
    categoryBreakdown: {},
    monthlyProgress: [],
    recentCompletions: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [tasksData, completionsData, statsData] = await Promise.all([
        taskService.getTasks(),
        taskService.getTaskCompletions(),
        taskService.getTaskStats()
      ]);

      setTasks(tasksData);
      setCompletions(completionsData);
      setStats(statsData);
    } catch (err) {
      console.error('Error fetching task data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch task data');
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshData = useCallback(async () => {
    await taskService.refreshData();
    await fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (autoRefresh) {
      fetchData();
    }
  }, [fetchData, autoRefresh]);

  return {
    tasks,
    completions,
    stats,
    loading,
    error,
    refreshData
  };
};

// Hook for getting specific task completion data
export const useTaskCompletion = (taskId: string) => {
  const [completion, setCompletion] = useState<TaskCompletion | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCompletion = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const completions = await taskService.getTaskCompletions();
        const taskCompletion = completions.find(comp => comp.taskId === taskId);
        setCompletion(taskCompletion || null);
      } catch (err) {
        console.error('Error fetching task completion:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch task completion');
      } finally {
        setLoading(false);
      }
    };

    if (taskId) {
      fetchCompletion();
    }
  }, [taskId]);

  return { completion, loading, error };
};

// Hook for getting filtered task data
export const useFilteredTaskData = (filters: {
  status?: string;
  dateRange?: { start: string; end: string };
}) => {
  const { tasks, completions, stats, loading, error, refreshData } = useTaskData();
  const [filteredData, setFilteredData] = useState({
    tasks: [] as Task[],
    completions: [] as TaskCompletion[],
    stats: stats
  });

  useEffect(() => {
    let filteredTasks = [...tasks];
    let filteredCompletions = [...completions];



    // Filter by status
    if (filters.status && filters.status !== 'all') {
      filteredTasks = filteredTasks.filter(task => task.status === filters.status);
      if (filters.status === 'completed') {
        // Only show completions for completed status
      } else {
        filteredCompletions = []; // No completions for non-completed statuses
      }
    }

    // Filter by date range
    if (filters.dateRange && filters.dateRange.start && filters.dateRange.end) {
      const startDate = new Date(filters.dateRange.start);
      const endDate = new Date(filters.dateRange.end);
      
      filteredCompletions = filteredCompletions.filter(comp => {
        const compDate = new Date(comp.completedAt);
        return compDate >= startDate && compDate <= endDate;
      });
    }

    // Recalculate stats for filtered data
    const filteredStats: TaskStats = {
      totalTasks: filteredTasks.length,
      completedTasks: filteredCompletions.length,
      totalPoints: filteredCompletions.reduce((sum, comp) => sum + comp.points, 0),
      totalPeopleConnected: filteredCompletions.reduce((sum, comp) => sum + comp.peopleConnected, 0),
      averagePointsPerTask: filteredCompletions.length > 0 ?
        filteredCompletions.reduce((sum, comp) => sum + comp.points, 0) / filteredCompletions.length : 0,
      categoryBreakdown: filteredCompletions.reduce((acc, comp) => {
        acc[comp.category] = (acc[comp.category] || 0) + 1;
        return acc;
      }, {} as { [key: string]: number }),
      monthlyProgress: stats.monthlyProgress, // Keep original monthly progress
      recentCompletions: filteredCompletions
        .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
        .slice(0, 5)
    };

    setFilteredData({
      tasks: filteredTasks,
      completions: filteredCompletions,
      stats: filteredStats
    });
  }, [tasks, completions, stats, filters]);

  return {
    ...filteredData,
    loading,
    error,
    refreshData
  };
};
