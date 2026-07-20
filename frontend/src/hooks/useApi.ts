import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

const API_BASE = 'http://localhost:8000/api/v1'

// ==========================================
// TYPES MATCHING BACKEND PYDANTIC SCHEMAS
// ==========================================
export interface Resource {
  id: number
  day_id: number
  title: string
  category: string
  platform: string
  difficulty: string
  is_completed: boolean
  completed_at: string | null
  notes: string | null
  revision_count: number
  estimated_duration_mins: number
  external_url: string | null
  xp_reward: number
  tags: string | null
}

export interface Day {
  id: number
  module_id: number
  day_number: number
  title: string
  unlocked: boolean
  is_completed: boolean
  xp_rewarded: boolean
  resources: Resource[]
}

export interface Module {
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
  modules: Module[]
}

export interface Goal {
  id: number
  title: string
  target: string | null
  active_mode: string
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
  tags: string | null
  is_archived: boolean
}

export interface AnalyticsDashboard {
  overall_progress_percent: number
  total_hours_studied: number
  total_resources_completed: number
  current_streak: number
  longest_streak: number
  days_remaining: number
  xp: number
  daily_score: number
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
  return useMutation<Goal, Error, { title: string; target: string; active_mode: string; daily_hours: number; timeline_days: number }>({
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

export function useUpdateResource() {
  const queryClient = useQueryClient()
  return useMutation<Resource, Error, { resourceId: number; payload: { is_completed?: boolean; notes?: string; revision_count?: number } }>({
    mutationFn: async ({ resourceId, payload }) => {
      const res = await fetch(`${API_BASE}/tasks/${resourceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (!res.ok) throw new Error('Failed to update resource')
      return res.json()
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['activeGoal'] })
      queryClient.invalidateQueries({ queryKey: ['goal'] })
      queryClient.invalidateQueries({ queryKey: ['analytics'] })
      queryClient.invalidateQueries({ queryKey: ['badges'] })
    }
  })
}

export function useLogStudySession() {
  const queryClient = useQueryClient()
  return useMutation<any, Error, { goal_id: number; resource_id?: number; duration_seconds: number; completion_status: boolean; platform?: string; notes?: string }>({
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
        body: formData
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

export function useTogglePDFArchive() {
  const queryClient = useQueryClient()
  return useMutation<PDFFile, Error, number>({
    mutationFn: async (pdfId) => {
      const res = await fetch(`${API_BASE}/pdfs/${pdfId}/archive`, {
        method: 'PUT'
      })
      if (!res.ok) throw new Error('Failed to toggle archive status')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pdfs'] })
    }
  })
}

export function useUpdatePDFTags() {
  const queryClient = useQueryClient()
  return useMutation<PDFFile, Error, { pdfId: number; tags: string }>({
    mutationFn: async ({ pdfId, tags }) => {
      const formData = new FormData()
      formData.append('tags', tags)
      const res = await fetch(`${API_BASE}/pdfs/${pdfId}/tags`, {
        method: 'PUT',
        body: formData
      })
      if (!res.ok) throw new Error('Failed to update PDF tags')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pdfs'] })
    }
  })
}

export function useBackupDatabase() {
  return useMutation<any, Error, void>({
    mutationFn: async () => {
      const res = await fetch(`${API_BASE}/system/backup`)
      if (!res.ok) throw new Error('Failed to backup database')
      return res.json()
    }
  })
}
