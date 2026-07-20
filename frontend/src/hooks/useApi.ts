import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

const API_BASE = 'http://localhost:8000/api/v1'

// ==========================================
// TYPES MATCHING BACKEND PYDANTIC SCHEMAS
// ==========================================
export interface Task {
  id: number
  day_id: number
  title: string
  category: string
  difficulty: string
  is_completed: boolean
  completed_at: string | null
  notes: string | null
  revision_count: number
  estimated_time_mins: number
  completed_time_mins: number | null
}

export interface Day {
  id: number
  milestone_id: number
  day_number: number
  title: string
  unlocked: boolean
  is_completed: boolean
  xp_rewarded: boolean
  tasks: Task[]
}

export interface Milestone {
  id: number
  track_id: number
  title: string
  description: string | null
  order: number
  days: Day[]
}

export interface Track {
  id: number
  goal_id: number
  title: string
  description: string | null
  order: number
  milestones: Milestone[]
}

export interface Goal {
  id: number
  title: string
  target: string | null
  daily_hours: number
  timeline_days: number
  xp: number
  streak: number
  longest_streak: number
  last_active_date: string | null
  created_at: string
  tracks?: Track[]
}

export interface Badge {
  id: number
  goal_id: number
  title: string
  description: string
  icon_name: string
  unlocked_at: string
}

export interface PDFFile {
  id: number
  filename: string
  file_path: string
  size_bytes: number
  upload_date: string
  category: string
}

export interface AnalyticsDashboard {
  overall_progress_percent: number
  total_hours_studied: number
  total_questions_completed: number
  current_streak: number
  longest_streak: number
  days_remaining: number
  xp: number
  streak_badges_count: number
  category_progress: Record<string, number>
  weekly_study_hours: number[]
  heatmap: Array<{ date: string; count: number; xp: number; hours: number }>
  weakest_topic: string | null
  most_revised_topic: string | null
}

// ==========================================
// HOOKS DEFINITIONS
// ==========================================

export function useActiveGoal() {
  return useQuery<Goal | null>({
    queryKey: ['activeGoal'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/goals/active`)
      if (!res.ok) return null
      return res.json()
    }
  })
}

export function useGoal(goalId: number | undefined) {
  return useQuery<Goal>({
    queryKey: ['goal', goalId],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/goals/${goalId}`)
      if (!res.ok) throw new Error('Failed to fetch goal detail')
      return res.json()
    },
    enabled: !!goalId
  })
}

export function useGoalAnalytics(goalId: number | undefined) {
  return useQuery<AnalyticsDashboard>({
    queryKey: ['analytics', goalId],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/goals/${goalId}/analytics`)
      if (!res.ok) throw new Error('Failed to fetch analytics')
      return res.json()
    },
    enabled: !!goalId
  })
}

export function useGoalBadges(goalId: number | undefined) {
  return useQuery<Badge[]>({
    queryKey: ['badges', goalId],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/goals/${goalId}/badges`)
      if (!res.ok) throw new Error('Failed to fetch achievements')
      return res.json()
    },
    enabled: !!goalId
  })
}

export function useCreateGoal() {
  const queryClient = useQueryClient()
  return useMutation<Goal, Error, { title: string; target: string; daily_hours: number; timeline_days: number }>({
    mutationFn: async (goalData) => {
      const res = await fetch(`${API_BASE}/goals/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(goalData)
      })
      if (!res.ok) throw new Error('Failed to create goal')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeGoal'] })
    }
  })
}

export function useDeleteGoal() {
  const queryClient = useQueryClient()
  return useMutation<void, Error, number>({
    mutationFn: async (goalId) => {
      const res = await fetch(`${API_BASE}/goals/${goalId}`, {
        method: 'DELETE'
      })
      if (!res.ok) throw new Error('Failed to delete goal')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeGoal'] })
    }
  })
}

export function useUpdateTask() {
  const queryClient = useQueryClient()
  return useMutation<Task, Error, { taskId: number; payload: { is_completed?: boolean; notes?: string; revision_count?: number; completed_time_mins?: number } }>({
    mutationFn: async ({ taskId, payload }) => {
      const res = await fetch(`${API_BASE}/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (!res.ok) throw new Error('Failed to update task')
      return res.json()
    },
    onSuccess: (_, variables) => {
      // Invalidate target queries to trigger re-renders
      queryClient.invalidateQueries({ queryKey: ['activeGoal'] })
      queryClient.invalidateQueries({ queryKey: ['goal'] })
      queryClient.invalidateQueries({ queryKey: ['analytics'] })
      queryClient.invalidateQueries({ queryKey: ['badges'] })
    }
  })
}

export function useLogStudySession() {
  const queryClient = useQueryClient()
  return useMutation<any, Error, { goal_id: number; duration_seconds: number; completed: boolean }>({
    mutationFn: async (sessionData) => {
      const res = await fetch(`${API_BASE}/timer/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sessionData)
      })
      if (!res.ok) throw new Error('Failed to log study session')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeGoal'] })
      queryClient.invalidateQueries({ queryKey: ['analytics'] })
    }
  })
}

export function useResources() {
  return useQuery<Record<string, any[]>>({
    queryKey: ['resources'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/resources/`)
      if (!res.ok) throw new Error('Failed to fetch resource library')
      return res.json()
    }
  })
}

export function usePDFs() {
  return useQuery<PDFFile[]>({
    queryKey: ['pdfs'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/pdfs/`)
      if (!res.ok) throw new Error('Failed to fetch PDFs')
      return res.json()
    }
  })
}

export function useUploadPDF() {
  const queryClient = useQueryClient()
  return useMutation<PDFFile, Error, FormData>({
    mutationFn: async (formData) => {
      const res = await fetch(`${API_BASE}/pdfs/`, {
        method: 'POST',
        body: formData // Note: Content-Type header must NOT be set manually for FormData
      })
      if (!res.ok) throw new Error('Failed to upload PDF')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pdfs'] })
    }
  })
}

export function useDeletePDF() {
  const queryClient = useQueryClient()
  return useMutation<void, Error, number>({
    mutationFn: async (pdfId) => {
      const res = await fetch(`${API_BASE}/pdfs/${pdfId}`, {
        method: 'DELETE'
      })
      if (!res.ok) throw new Error('Failed to delete PDF')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pdfs'] })
    }
  })
}
