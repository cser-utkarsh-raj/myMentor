import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../store/authStore'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'

const getHeaders = (isMultipart = false) => {
  const { session, isDemoMode } = useAuthStore.getState()
  const headers: Record<string, string> = {}
  
  if (!isMultipart) {
    headers['Content-Type'] = 'application/json'
  }
  
  if (isDemoMode) {
    headers['Authorization'] = 'Bearer demo_mode_token'
  } else if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`
  }
  
  return headers
}


const handleApiError = async (res: Response, fallbackMessage: string): Promise<never> => {
  let detail = fallbackMessage
  try {
    const body = await res.json()
    if (body.detail) {
      detail = typeof body.detail === 'string' ? body.detail : JSON.stringify(body.detail)
    }
  } catch {
    // Response body is not JSON, use fallback
  }
  throw new Error(detail)
}

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
  recovery_recommended?: boolean
  checkpoint_celebration?: boolean
  last_completed_module?: string | null
}

// ==========================================
// HOOKS DEFINITIONS
// ==========================================

export const useTriggerRecovery = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (goalId: number) => {
      const response = await fetch(`${API_BASE}/goals/${goalId}/recovery`, {
        method: 'POST',
        headers: getHeaders()
      })
      if (!response.ok) await handleApiError(response, 'Failed to trigger Recovery Mode')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeGoal'] })
      queryClient.invalidateQueries({ queryKey: ['goalAnalytics'] })
    }
  })
}

export function useActiveGoal() {
  const { activeGoalId, setActiveGoalId } = useAuthStore()
  return useQuery<Goal | null>({
    queryKey: ['activeGoal', activeGoalId],
    queryFn: async () => {
      if (activeGoalId) {
        const res = await fetch(`${API_BASE}/goals/${activeGoalId}`, {
          headers: getHeaders()
        })
        if (res.ok) {
          return res.json()
        } else {
          setActiveGoalId(null)
        }
      }
      
      const res = await fetch(`${API_BASE}/goals/active`, {
        headers: getHeaders()
      })
      if (!res.ok) return null
      const data = await res.json()
      if (data && data.id) {
        setActiveGoalId(data.id)
      }
      return data
    }
  })
}

export function useGoals() {
  return useQuery<Goal[]>({
    queryKey: ['goals'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/goals/`, {
        headers: getHeaders()
      })
      if (!res.ok) return []
      return res.json()
    }
  })
}

export function useGoal(goalId: number | undefined) {
  return useQuery<Goal>({
    queryKey: ['goal', goalId],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/goals/${goalId}`, {
        headers: getHeaders()
      })
      if (!res.ok) await handleApiError(res, 'Failed to fetch goal detail')
      return res.json()
    },
    enabled: !!goalId
  })
}

export function useGoalAnalytics(goalId: number | undefined) {
  return useQuery<AnalyticsDashboard>({
    queryKey: ['analytics', goalId],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/goals/${goalId}/analytics`, {
        headers: getHeaders()
      })
      if (!res.ok) await handleApiError(res, 'Failed to fetch analytics')
      return res.json()
    },
    enabled: !!goalId
  })
}

export function useGoalBadges(goalId: number | undefined) {
  return useQuery<Badge[]>({
    queryKey: ['badges', goalId],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/goals/${goalId}/badges`, {
        headers: getHeaders()
      })
      if (!res.ok) await handleApiError(res, 'Failed to fetch achievements')
      return res.json()
    },
    enabled: !!goalId
  })
}

export function useCreateGoal() {
  const queryClient = useQueryClient()
  const { setActiveGoalId } = useAuthStore()
  return useMutation<Goal, Error, { title: string; target: string; active_mode: string; daily_hours: number; timeline_days: number }>({
    mutationFn: async (goalData) => {
      const res = await fetch(`${API_BASE}/goals/`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(goalData)
      })
      if (!res.ok) await handleApiError(res, 'Failed to create goal')
      return res.json()
    },
    onSuccess: (data) => {
      if (data && data.id) {
        setActiveGoalId(data.id)
      }
      queryClient.invalidateQueries({ queryKey: ['activeGoal'] })
      queryClient.invalidateQueries({ queryKey: ['goals'] })
    }
  })
}

export function useDeleteGoal() {
  const queryClient = useQueryClient()
  const { setActiveGoalId } = useAuthStore()
  return useMutation<void, Error, number>({
    mutationFn: async (goalId) => {
      const res = await fetch(`${API_BASE}/goals/${goalId}`, {
        method: 'DELETE',
        headers: getHeaders()
      })
      if (!res.ok) await handleApiError(res, 'Failed to delete goal')
    },
    onSuccess: () => {
      setActiveGoalId(null)
      queryClient.invalidateQueries({ queryKey: ['activeGoal'] })
      queryClient.invalidateQueries({ queryKey: ['goals'] })
    }
  })
}

export function useUpdateResource() {
  const queryClient = useQueryClient()
  return useMutation<Resource, Error, { resourceId: number; payload: { is_completed?: boolean; notes?: string; revision_count?: number } }>({
    mutationFn: async ({ resourceId, payload }) => {
      const res = await fetch(`${API_BASE}/tasks/${resourceId}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(payload)
      })
      if (!res.ok) await handleApiError(res, 'Failed to update resource')
      return res.json()
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['activeGoal'] })
      queryClient.invalidateQueries({ queryKey: ['goal'] })
      queryClient.invalidateQueries({ queryKey: ['resources'] })
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
        headers: getHeaders(),
        body: JSON.stringify(sessionData)
      })
      if (!res.ok) await handleApiError(res, 'Failed to log study session')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeGoal'] })
      queryClient.invalidateQueries({ queryKey: ['analytics'] })
    }
  })
}

export const useGoalLibrary = () => {
  return useQuery({
    queryKey: ['goalLibrary'],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/system/library`, {
        headers: getHeaders()
      })
      if (!response.ok) await handleApiError(response, 'Failed to fetch library')
      const data = await response.json()
      return data.data
    }
  })
}

export function useResources(goalId: number | null) {
  return useQuery<Record<string, any[]>>({
    queryKey: ['resources', goalId],
    queryFn: async () => {
      const url = goalId ? `${API_BASE}/resources/?goal_id=${goalId}` : `${API_BASE}/resources/`
      const res = await fetch(url, {
        headers: getHeaders()
      })
      if (!res.ok) await handleApiError(res, 'Failed to fetch resource library')
      return res.json()
    }
  })
}

export function useAddCustomResource() {
  const queryClient = useQueryClient()
  return useMutation<any, Error, { title: string; category?: string; platform?: string; difficulty?: string; external_url?: string; estimated_time_mins?: number; notes?: string; goal_id?: number }>({
    mutationFn: async (payload) => {
      const res = await fetch(`${API_BASE}/resources/custom`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload)
      })
      if (!res.ok) await handleApiError(res, 'Failed to add custom resource')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources'] })
      queryClient.invalidateQueries({ queryKey: ['activeGoal'] })
      queryClient.invalidateQueries({ queryKey: ['analytics'] })
    }
  })
}

export function usePDFs() {
  return useQuery<PDFFile[]>({
    queryKey: ['pdfs'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/pdfs/`, {
        headers: getHeaders()
      })
      if (!res.ok) await handleApiError(res, 'Failed to fetch PDFs')
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
        headers: getHeaders(true),
        body: formData
      })
      if (!res.ok) await handleApiError(res, 'Failed to upload PDF')
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
        method: 'DELETE',
        headers: getHeaders()
      })
      if (!res.ok) await handleApiError(res, 'Failed to delete PDF')
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
        method: 'PUT',
        headers: getHeaders()
      })
      if (!res.ok) await handleApiError(res, 'Failed to toggle archive status')
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
        headers: getHeaders(true),
        body: formData
      })
      if (!res.ok) await handleApiError(res, 'Failed to update PDF tags')
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
      const res = await fetch(`${API_BASE}/system/backup`, {
        headers: getHeaders()
      })
      if (!res.ok) await handleApiError(res, 'Failed to backup database')
      return res.json()
    }
  })
}

// ==========================================
// AI / SENSEI HOOKS
// ==========================================

export function useAIStatus() {
  return useQuery<{ ai_available: boolean; model: string | null; features: string[] }>({
    queryKey: ['aiStatus'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/ai/status`, {
        headers: getHeaders()
      })
      if (!res.ok) return { ai_available: false, model: null, features: [] }
      return res.json()
    },
    staleTime: 60000
  })
}

export function useSenseiChat() {
  return useMutation<
    { response: string; ai_available: boolean },
    Error,
    { messages: Array<{ role: string; text: string }>; goal_context?: string; personality?: string }
  >({
    mutationFn: async (chatData) => {
      const res = await fetch(`${API_BASE}/ai/chat`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(chatData)
      })
      if (!res.ok) await handleApiError(res, 'Sensei chat failed')
      return res.json()
    }
  })
}

export function useExplainTopic() {
  return useMutation<
    { explanation: string },
    Error,
    { topic: string; context?: string; difficulty?: string }
  >({
    mutationFn: async (data) => {
      const res = await fetch(`${API_BASE}/ai/explain`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data)
      })
      if (!res.ok) await handleApiError(res, 'Failed to explain topic')
      return res.json()
    }
  })
}

export function useAIRoadmap() {
  return useMutation<
    { roadmap: any },
    Error,
    { goal_title: string; target?: string; daily_hours?: number; timeline_days?: number }
  >({
    mutationFn: async (data) => {
      const res = await fetch(`${API_BASE}/ai/generate-roadmap`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data)
      })
      if (!res.ok) await handleApiError(res, 'AI roadmap generation failed')
      return res.json()
    }
  })
}

export function useDailyTip(params: { goal_title: string; current_topic?: string; streak?: number }) {
  return useQuery<{ tip: string; ai_generated: boolean }>({
    queryKey: ['dailyTip', params.goal_title],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/ai/daily-tip`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(params)
      })
      if (!res.ok) return { tip: 'Stay consistent and keep learning! 🔥', ai_generated: false }
      return res.json()
    },
    enabled: !!params.goal_title,
    staleTime: 1000 * 60 * 60 // 1 hour
  })
}

export function useSummarizePDF() {
  return useMutation<
    { summary: string; key_concepts: string[]; flashcards: Array<{ question: string; answer: string }> },
    Error,
    { text_content: string; filename: string }
  >({
    mutationFn: async (data) => {
      const res = await fetch(`${API_BASE}/ai/summarize-pdf`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data)
      })
      if (!res.ok) await handleApiError(res, 'PDF summarization failed')
      return res.json()
    }
  })
}
