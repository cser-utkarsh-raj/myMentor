import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../store/authStore'

const getApiBase = () => {
  const configured = import.meta.env.VITE_API_URL?.trim()
  if (configured) return configured.replace(/\/$/, '')
  const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost'
  return (host === 'localhost' || host === '127.0.0.1')
    ? `http://${host}:8000/api/v1`
    : 'https://mymentor-backend.onrender.com/api/v1'
}
const API_BASE = getApiBase()

const getHeaders = (isMultipart = false) => {
  const { session, isDemoMode } = useAuthStore.getState()
  const headers: Record<string, string> = {}
  if (!isMultipart) headers['Content-Type'] = 'application/json'
  if (isDemoMode) headers['Authorization'] = 'Bearer demo_mode_token'
  else if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`
  return headers
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

const apiFetch = async (endpoint: string, options: RequestInit = {}, fallbackMsg = 'API Error', retries = 2) => {
  const isMulti = options.body instanceof FormData
  let lastError: any = null

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController()
    const timeoutMs = endpoint.includes('/goals') && options.method === 'POST' ? 90000 : 30000
    const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs)
    try {
      const res = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        signal: options.signal || controller.signal,
        headers: { ...getHeaders(isMulti), ...(options.headers || {}) }
      })
      window.clearTimeout(timeoutId)

      if (!res.ok) {
        if ((res.status === 502 || res.status === 503 || res.status === 504) && attempt < retries) {
          await sleep(1500 * (attempt + 1))
          continue
        }
        let detail = fallbackMsg
        try {
          const body = await res.json()
          if (body.detail) detail = typeof body.detail === 'string' ? body.detail : JSON.stringify(body.detail)
        } catch {}
        const error: any = new Error(detail)
        error.status = res.status
        throw error
      }
      return res.status === 204 ? null : res.json()
    } catch (err: any) {
      window.clearTimeout(timeoutId)
      lastError = err
      const retryableNetwork = err?.name === 'TypeError' || err?.name === 'AbortError' || /failed to fetch|network/i.test(err?.message || '')
      if (attempt < retries && retryableNetwork) {
        await sleep(1200 * (attempt + 1))
        continue
      }
      throw new Error(err?.name === 'AbortError' ? 'The server took too long to respond. Please try again.' : (err?.message || fallbackMsg))
    }
  }
  throw lastError || new Error(fallbackMsg)
}

export interface Resource {
  id: number; day_id: number; title: string; category: string; platform: string; difficulty: string;
  is_completed: boolean; completed_at: string | null; notes: string | null; revision_count: number;
  estimated_duration_mins: number; external_url: string | null; xp_reward: number; tags: string | null;
}
export interface Day { id: number; module_id: number; day_number: number; title: string; unlocked: boolean; is_completed: boolean; xp_rewarded: boolean; resources: Resource[] }
export interface Module { id: number; track_id: number; title: string; description: string | null; order: number; days: Day[] }
export interface Track { id: number; goal_id: number; title: string; description: string | null; order: number; modules: Module[] }
export interface Goal { id: number; title: string; target: string | null; active_mode: string; daily_hours: number; timeline_days: number; xp: number; streak: number; longest_streak: number; last_active_date: string | null; created_at: string; tracks: Track[] }
export interface AnalyticsDashboard {
  overall_progress_percent: number; total_hours_studied: number; total_resources_completed: number; current_streak: number; longest_streak: number; days_remaining: number; xp: number; daily_score: number; streak_badges_count: number; category_progress: Record<string, number>; weekly_study_hours: number[]; heatmap: Array<{ date: string; hours: number; count: number }>; weakest_topic?: string; most_revised_topic?: string; recovery_recommended?: boolean; checkpoint_celebration?: boolean; last_completed_module?: string;
}
export interface Badge { id: number; goal_id: number; title: string; description: string; icon_name: string; unlocked_at: string }
export interface PDFFile { id: number; filename: string; file_path: string; size_bytes: number; upload_date: string; category: string; tags: string | null; is_archived: boolean; extraction_status?: string }

export function useActiveGoal() {
  const { activeGoalId, isInitialized, session, isDemoMode, setActiveGoalId } = useAuthStore()
  const enabled = isInitialized && (isDemoMode || !!session)
  return useQuery<Goal | null>({
    queryKey: ['activeGoal', activeGoalId, session?.user?.id || 'demo'],
    enabled,
    queryFn: async () => {
      if (activeGoalId) {
        try {
          return await apiFetch(`/goals/${activeGoalId}`, {}, 'Failed to fetch active goal')
        } catch (error: any) {
          if (error?.status === 404) setActiveGoalId(null)
          else throw error
        }
      }
      return apiFetch('/goals/active', {}, 'Failed to fetch active goal')
    },
    retry: 1,
    staleTime: 30000
  })
}

export function useGoals() {
  const { isInitialized, session, isDemoMode } = useAuthStore()
  return useQuery<Goal[]>({ queryKey: ['goals', session?.user?.id || 'demo'], enabled: isInitialized && (isDemoMode || !!session), queryFn: () => apiFetch('/goals/', {}, 'Failed to fetch goals'), retry: 1 })
}
export function useGoal(goalId: number | undefined) { return useQuery<Goal>({ queryKey: ['goal', goalId], queryFn: () => apiFetch(`/goals/${goalId}`, {}, 'Failed to fetch goal detail'), enabled: !!goalId }) }
export function useGoalAnalytics(goalId: number | undefined) { return useQuery<AnalyticsDashboard>({ queryKey: ['analytics', goalId], queryFn: () => apiFetch(`/goals/${goalId}/analytics`, {}, 'Failed to fetch analytics'), enabled: !!goalId }) }
export function useGoalBadges(goalId: number | undefined) { return useQuery<Badge[]>({ queryKey: ['badges', goalId], queryFn: () => apiFetch(`/goals/${goalId}/badges`, {}, 'Failed to fetch achievements'), enabled: !!goalId }) }
export function useResources(goalId: number | null) { return useQuery<Record<string, any[]>>({ queryKey: ['resources', goalId], queryFn: () => apiFetch(goalId ? `/resources/?goal_id=${goalId}` : '/resources/', {}, 'Failed to fetch resource library'), enabled: !!goalId }) }
export function usePDFs() { return useQuery<PDFFile[]>({ queryKey: ['pdfs'], queryFn: () => apiFetch('/pdfs/', {}, 'Failed to fetch PDFs') }) }
export function useGoalLibrary() { return useQuery({ queryKey: ['goalLibrary'], queryFn: async () => (await apiFetch('/system/library', {}, 'Failed to fetch library'))?.data, retry: 1 }) }
export function useAIStatus() { return useQuery<{ ai_available: boolean; model: string | null; features: string[] }>({ queryKey: ['aiStatus'], queryFn: () => apiFetch('/ai/status', {}, 'Failed to fetch AI status'), staleTime: 60000, retry: 1 }) }
export function useDailyTip(params: { goal_title: string; current_topic?: string; streak?: number }) { return useQuery<{ tip: string; ai_generated: boolean }>({ queryKey: ['dailyTip', params.goal_title], queryFn: () => apiFetch('/ai/daily-tip', { method: 'POST', body: JSON.stringify(params) }, 'Failed to fetch tip'), enabled: !!params.goal_title, staleTime: 3600000 }) }

export function useCreateGoal() {
  const qc = useQueryClient(), { setActiveGoalId } = useAuthStore()
  return useMutation({
    mutationFn: (data: any) => apiFetch('/goals/', { method: 'POST', body: JSON.stringify(data) }, 'Failed to create goal', 1),
    onSuccess: (data) => { if (data?.id) setActiveGoalId(data.id); qc.invalidateQueries({ queryKey: ['activeGoal'] }); qc.invalidateQueries({ queryKey: ['goals'] }) }
  })
}
export function useDeleteGoal() { const qc = useQueryClient(), { setActiveGoalId } = useAuthStore(); return useMutation({ mutationFn: (id: number) => apiFetch(`/goals/${id}`, { method: 'DELETE' }, 'Failed to delete goal'), onSuccess: () => { setActiveGoalId(null); qc.invalidateQueries({ queryKey: ['activeGoal'] }); qc.invalidateQueries({ queryKey: ['goals'] }) } }) }
export function useUpdateResource() { const qc = useQueryClient(); return useMutation({ mutationFn: ({ resourceId, payload }: any) => apiFetch(`/tasks/${resourceId}`, { method: 'PUT', body: JSON.stringify(payload) }, 'Failed to update resource'), onSuccess: () => { qc.invalidateQueries({ queryKey: ['activeGoal'] }); qc.invalidateQueries({ queryKey: ['resources'] }); qc.invalidateQueries({ queryKey: ['analytics'] }) } }) }
export function useLogStudySession() { const qc = useQueryClient(); return useMutation({ mutationFn: (data: any) => apiFetch('/study-sessions/', { method: 'POST', body: JSON.stringify(data) }, 'Failed to log study session'), onSuccess: () => { qc.invalidateQueries({ queryKey: ['activeGoal'] }); qc.invalidateQueries({ queryKey: ['analytics'] }) } }) }
export function useAddCustomResource() { const qc = useQueryClient(); return useMutation({ mutationFn: (payload: any) => apiFetch('/resources/custom', { method: 'POST', body: JSON.stringify(payload) }, 'Failed to add custom resource'), onSuccess: () => { qc.invalidateQueries({ queryKey: ['resources'] }); qc.invalidateQueries({ queryKey: ['activeGoal'] }) } }) }
export function useUploadPDF() { const qc = useQueryClient(); return useMutation({ mutationFn: (formData: FormData) => apiFetch('/pdfs/', { method: 'POST', body: formData }, 'Failed to upload PDF'), onSuccess: () => qc.invalidateQueries({ queryKey: ['pdfs'] }) }) }
export function useGenerateRoadmapFromPDF() { const qc = useQueryClient(); return useMutation({ mutationFn: (pdfId: number) => apiFetch(`/pdfs/${pdfId}/generate-roadmap`, { method: 'POST' }, 'Failed to generate roadmap from PDF', 1), onSuccess: () => qc.invalidateQueries({ queryKey: ['activeGoal'] }) }) }
export function useDeletePDF() { const qc = useQueryClient(); return useMutation({ mutationFn: (id: number) => apiFetch(`/pdfs/${id}`, { method: 'DELETE' }, 'Failed to delete PDF'), onSuccess: () => qc.invalidateQueries({ queryKey: ['pdfs'] }) }) }
export function useTogglePDFArchive() { const qc = useQueryClient(); return useMutation({ mutationFn: (id: number) => apiFetch(`/pdfs/${id}/archive`, { method: 'PUT' }, 'Failed to toggle archive'), onSuccess: () => qc.invalidateQueries({ queryKey: ['pdfs'] }) }) }
export function useUpdatePDFTags() { const qc = useQueryClient(); return useMutation({ mutationFn: ({ pdfId, tags }: any) => { const fd = new FormData(); fd.append('tags', tags); return apiFetch(`/pdfs/${pdfId}/tags`, { method: 'PUT', body: fd }, 'Failed to update tags') }, onSuccess: () => qc.invalidateQueries({ queryKey: ['pdfs'] }) }) }
export function useTriggerRecovery() { const qc = useQueryClient(); return useMutation({ mutationFn: (goalId: number) => apiFetch(`/goals/${goalId}/recovery`, { method: 'POST' }, 'Failed to trigger recovery mode'), onSuccess: () => { qc.invalidateQueries({ queryKey: ['activeGoal'] }); qc.invalidateQueries({ queryKey: ['analytics'] }) } }) }
export function useBackupDatabase() { return useMutation({ mutationFn: () => apiFetch('/system/backup', {}, 'Failed to backup database') }) }
export function useSenseiChat() { return useMutation({ mutationFn: (data: any) => apiFetch('/ai/chat', { method: 'POST', body: JSON.stringify(data) }, 'Sensei chat failed') }) }
export function useExplainTopic() { return useMutation({ mutationFn: (data: any) => apiFetch('/ai/explain', { method: 'POST', body: JSON.stringify(data) }, 'Failed to explain topic') }) }
export function useAIRoadmap() { return useMutation({ mutationFn: (data: any) => apiFetch('/ai/generate-roadmap', { method: 'POST', body: JSON.stringify(data) }, 'AI roadmap generation failed') }) }
export function useSummarizePDF() { return useMutation({ mutationFn: (data: any) => apiFetch('/ai/summarize-pdf', { method: 'POST', body: JSON.stringify(data) }, 'PDF summarization failed') }) }
