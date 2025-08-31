import axios from 'axios'
import useAuthStore from '../store/auth'

export const API_BASE = 'https://meta-backend-hqm9.onrender.com'

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 30000, // 30 second timeout
  withCredentials: false // Ensure no unexpected cookies/credentials
})

api.interceptors.request.use((config) => {
  const isAuthEndpoint = config?.url?.startsWith('/auth')
  const token = useAuthStore.getState().token
  
  console.log('Request interceptor:', {
    url: config.url,
    isAuthEndpoint,
    hasToken: !!token,
    method: config.method,
    headers: config.headers,
    data: config.data
  })
  
  if (!isAuthEndpoint && token) {
    config.headers = config.headers || {}
    config.headers.Authorization = `Bearer ${token}`
  } else if (isAuthEndpoint && config?.headers?.Authorization) {
    delete config.headers.Authorization
  }
  
  // Ensure we have clean headers that won't trigger CORS issues
  // Backend only allows: Content-Type, Authorization, X-Requested-With
  config.headers = {
    'Content-Type': 'application/json',
    ...(config.headers.Authorization && { 'Authorization': config.headers.Authorization })
  }
  
  console.log('Final request headers:', config.headers)
  console.log('Final request data:', config.data)
  return config
})

api.interceptors.response.use(
  (response) => {
    console.log('Response interceptor - Success:', {
      url: response.config?.url,
      status: response.status,
      data: response.data
    })
    return response
  },
  (err) => {
    console.log('Response interceptor - Error:', {
      url: err.config?.url,
      status: err.response?.status,
      data: err.response?.data,
      message: err.message
    })
    
    // Handle security middleware errors specifically
    if (err.response?.status === 400 && 
        err.response?.data?.error === 'Invalid input detected') {
      console.error('Security middleware blocked request:', err.response.data)
      // Create a more user-friendly error
      const enhancedError = new Error('Request blocked by security filter')
      enhancedError.response = {
        ...err.response,
        data: {
          error: 'Security validation failed',
          message: 'Your request was blocked by our security system. Please check your input and try again.',
          details: 'If this persists, the content may contain characters that look suspicious to our security system.'
        }
      }
      return Promise.reject(enhancedError)
    }
    
    const status = err.response?.status
    const url = err.config?.url || ''
    const isAuthEndpoint = url.startsWith('/api/auth')
    if (status === 401 && !isAuthEndpoint) {
      useAuthStore.getState().clear()
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// Test function to identify security middleware triggers
export const testSecurityPatterns = async () => {
  console.log('Testing security patterns...')
  
  const testCases = [
    { name: 'Basic', email: 'test@example.com', password: 'Password123' },
    { name: 'With !', email: 'test@example.com', password: 'Password123!' },
    { name: 'Simple', email: 'a@b.com', password: 'Pass1234' },
    { name: 'No special', email: 'user@domain.com', password: 'Password1' },
  ]
  
  for (const testCase of testCases) {
    try {
      console.log(`Testing ${testCase.name}:`, { email: testCase.email, password: '***' })
      
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testCase.email, password: testCase.password }),
        mode: 'cors',
        credentials: 'omit'
      })
      
      const data = await response.text()
      console.log(`${testCase.name} result:`, response.status, data.substring(0, 100))
      
    } catch (error) {
      console.log(`${testCase.name} error:`, error.message)
    }
  }
}

// Health check
export const healthCheck = async () => {
  try {
    const { data } = await api.get('/health')
    return data
  } catch (error) {
    console.error('Health check failed:', error)
    
    // If CORS or security issues, try a simple fetch
    if (error.message === 'Network Error' || 
        error.response?.status === 400) {
      try {
        const response = await fetch(`${API_BASE}/health`, {
          method: 'GET',
          mode: 'cors',
          credentials: 'omit'
        })
        if (response.ok) {
          return await response.json()
        }
        throw new Error(`HTTP ${response.status}`)
      } catch (fetchError) {
        console.error('Fetch health check also failed:', fetchError)
        throw fetchError
      }
    }
    
    throw error
  }
}

// Enhanced login with retry logic
export const login = async (email, password) => {
  // Trim inputs to remove leading/trailing whitespace
  const cleanEmail = email.trim();
  const cleanPassword = password.trim();

  try {
    const { data } = await api.post('/api/auth/login', { 
      email: cleanEmail, 
      password: cleanPassword 
    });
    console.log('Login response:', { ...data, token: '***' });
    return data;
  } catch (error) {
    console.error('Login error details:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    throw error;
  }
};

export const register = async (payload) => {
  // Backend expects: first_name, last_name, email, password, role, phone (optional)
  const body = {
    first_name: payload.firstName ?? payload.first_name ?? payload.name?.split(' ')?.[0],
    last_name: payload.lastName ?? payload.last_name ?? payload.name?.split(' ')?.slice(1).join(' '),
    email: payload.email,
    password: payload.password,
    role: payload.role ?? 'developer', // Default to 'developer' if not specified
    ...(payload.phone && { phone: payload.phone }), // Only include phone if provided
  }
  
  // Clean the data to avoid security middleware issues
  const cleanBody = {
    first_name: body.first_name?.trim()?.replace(/[^a-zA-Z\s]/g, ''),
    last_name: body.last_name?.trim()?.replace(/[^a-zA-Z\s]/g, ''),
    email: body.email?.trim()?.toLowerCase(),
    password: body.password?.trim(),
    role: body.role
  }
  
  console.log('Register request body:', { ...cleanBody, password: '***' })
  
  try {
    const { data } = await api.post('/api/auth/register', cleanBody)
    console.log('Register response:', { ...data, token: '***' })
    return data
  } catch (error) {
    console.log('Register error details:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    })
    
    // If security middleware blocks it, try with ultra-clean data
    if (error.response?.status === 400 && 
        error.response?.data?.error === 'Invalid input detected') {
      console.log('Retrying registration with ultra-clean data...')
      
      const ultraCleanBody = {
        first_name: cleanBody.first_name?.replace(/[^a-zA-Z]/g, ''),
        last_name: cleanBody.last_name?.replace(/[^a-zA-Z]/g, ''),
        email: cleanBody.email?.replace(/[^a-zA-Z0-9@._-]/g, ''),
        password: cleanBody.password?.replace(/[^a-zA-Z0-9!@#$%^&*()_+={};':"\\|,.<>?-]/g, ''),
        role: cleanBody.role
      }
      
      console.log('Ultra-clean register attempt:', { ...ultraCleanBody, password: '***' })
      
      try {
        const { data } = await axios.post(`${API_BASE}/api/auth/register`, 
          ultraCleanBody,
          {
            headers: { 'Content-Type': 'application/json' },
            timeout: 30000,
            withCredentials: false
          }
        )
        console.log('Register retry successful:', { ...data, token: '***' })
        return data
      } catch (retryError) {
        console.error('Register retry failed:', retryError)
        throw retryError
      }
    }
    throw error
  }
}

// Password Recovery
export const forgotPassword = async (email) => {
  const { data } = await api.post('/api/auth/forgot-password', { email: email.trim() })
  return data
}

export const resetPassword = async (token, password) => {
  const { data } = await api.post('/api/auth/reset-password', { 
    token: token.trim(), 
    password: password.trim() 
  })
  return data
}

export const changePassword = async (payload) => {
  const { data } = await api.post('/api/auth/change-password', {
    currentPassword: payload.currentPassword,
    newPassword: payload.newPassword
  })
  return data
}

// Email Verification
export const sendVerificationEmail = async () => {
  const { data } = await api.post('/api/auth/send-verification')
  return data
}

export const verifyEmail = async (token) => {
  const { data } = await api.post('/api/auth/verify-email', { token: token.trim() })
  return data
}

// Notifications
export const getNotifications = async (params = {}) => (await api.get('/api/dashboard/notifications', { params })).data
export const markNotificationRead = async (id) => (await api.put(`/api/dashboard/notifications/${id}/read`)).data
export const markAllNotificationsRead = async () => (await api.put('/api/dashboard/notifications/read-all')).data

// Dashboard
export const getDashboardStats = async () => (await api.get('/api/dashboard/stats')).data
export const getDashboardProgress = async () => {
  // Backend endpoint is /api/dashboard/active-projects
  const { data } = await api.get('/api/dashboard/active-projects')
  return data
}

// Projects
export const listProjects = async () => (await api.get('/api/projects')).data
export const createProject = async (payload) => (await api.post('/api/projects', payload)).data
export const getProject = async (id) => (await api.get(`/api/projects/${id}`)).data
export const updateProject = async (id, payload) => (await api.put(`/api/projects/${id}`, payload)).data
export const deleteProject = async (id) => (await api.delete(`/api/projects/${id}`)).data

// Project Members
export const addProjectMember = async (projectId, payload) => (await api.post(`/api/projects/${projectId}/members`, payload)).data
export const removeProjectMember = async (projectId, memberId) => (await api.delete(`/api/projects/${projectId}/members/${memberId}`)).data

// Project Milestones
export const listMilestones = async (projectId) => (await api.get(`/api/projects/${projectId}/milestones`)).data
export const createMilestone = async (projectId, payload) => (await api.post(`/api/projects/${projectId}/milestones`, payload)).data
export const updateMilestone = async (projectId, milestoneId, payload) => (await api.put(`/api/projects/${projectId}/milestones/${milestoneId}`, payload)).data
export const deleteMilestone = async (projectId, milestoneId) => (await api.delete(`/api/projects/${projectId}/milestones/${milestoneId}`)).data

// Companies
export const listCompanies = async () => {
  try {
    // First get current user to know their role
    const { user } = await getCurrentUser()
    
    if (user.role === 'administrator') {
      // Administrators can get all companies via settings endpoint
      const { data } = await api.get('/api/settings/company')
      return data
    } else if (user.role === 'developer') {
      // Developers can access clients endpoint
      try {
        const { data } = await api.get('/api/clients')
        return data
      } catch {
        // Fallback to settings endpoint for developers
        const { data } = await api.get('/api/settings/company')
        return data
      }
    } else if (user.role === 'client') {
      // Clients get their own company via settings endpoint
      const { data } = await api.get('/api/settings/company')
      return data
    }
    
    // Fallback
    return { companies: [] }
  } catch (error) {
    console.warn('Failed to load companies:', error)
    return { companies: [] }
  }
}
// Backend company routes live under /api/companies; map UI payload to API shape
export const createCompany = async (payload) => {
  const body = {
    name: payload.name,
    email: payload.email || null,
    phone: payload.phone || null,
    website: payload.website || null,
    address: payload.address || null,
  }
  return (await api.post('/api/companies', body)).data
}
export const updateCompany = async (id, payload) => {
  const body = {
    ...(payload.name && { name: payload.name }),
    ...(payload.email && { email: payload.email }),
    ...(payload.phone && { phone: payload.phone }),
    ...(payload.website && { website: payload.website }),
    ...(payload.address && { address: payload.address }),
    ...(payload.contact_person && { contact_person: payload.contact_person }),
    ...(payload.contactPerson && { contact_person: payload.contactPerson }),
    ...(payload.notes && { notes: payload.notes }),
  }
  return (await api.put(`/api/clients/${id}`, body)).data
}
export const deleteCompany = async (id) => (await api.delete(`/api/clients/${id}`)).data

// Tasks
export const listTasks = async (params = {}) => {
  // Map possible UI params to backend query names
  const query = {
    ...(params.page && { page: params.page }),
    ...(params.limit && { limit: params.limit }),
    ...(params.search && { search: params.search }),
    ...(params.status && { status: params.status }), // expects: new|in_progress|completed|canceled
    ...(params.priority && { priority: params.priority }), // low|medium|high
    ...(params.project && { project_id: params.project }),
    ...(params.projectId && { project_id: params.projectId }),
    ...(params.assignee && { assigned_to: params.assignee }),
    ...(params.assigned_to && { assigned_to: params.assigned_to }),
    ...(params.overdue !== undefined && { overdue: String(params.overdue) })
  }
  return (await api.get('/api/tasks', { params: query })).data
}

const normalizeTaskStatus = (s) => {
  if (!s) return undefined
  const v = String(s).toLowerCase().replace(' ', '_')
  if (['new', 'in_progress', 'completed', 'canceled'].includes(v)) return v
  return undefined
}

export const createTask = async (payload) => {
  // Map UI keys to API expectations (snake_case)
  const body = {
    title: payload.title ?? payload.name,
    description: payload.description,
    project_id: payload.project_id ?? payload.project ?? payload.projectId,
    milestone_id: payload.milestone_id ?? payload.milestoneId ?? undefined,
    assigned_to: payload.assigned_to ?? payload.assignee ?? payload.assigneeId ?? undefined,
    priority: payload.priority, // low|medium|high
    status: normalizeTaskStatus(payload.status) || undefined,
    due_date: payload.due_date ?? payload.deadline ?? payload.dueDate ?? undefined,
    estimated_hours: payload.estimated_hours ?? payload.estimatedHours ?? undefined,
  }
  return (await api.post('/api/tasks', body)).data
}

export const updateTask = async (id, payload) => {
  const body = {
    ...(payload.title || payload.name ? { title: payload.title ?? payload.name } : {}),
    ...(payload.description !== undefined ? { description: payload.description } : {}),
    ...(payload.priority ? { priority: payload.priority } : {}),
    ...(payload.status ? { status: normalizeTaskStatus(payload.status) } : {}),
    ...(payload.estimated_hours ?? payload.estimatedHours ? { estimated_hours: payload.estimated_hours ?? payload.estimatedHours } : {}),
    ...(payload.actual_hours ?? payload.actualHours ? { actual_hours: payload.actual_hours ?? payload.actualHours } : {}),
    ...(payload.due_date ?? payload.deadline ?? payload.dueDate ? { due_date: payload.due_date ?? payload.deadline ?? payload.dueDate } : {}),
    ...(payload.assigned_to ?? payload.assignee ?? payload.assigneeId ? { assigned_to: payload.assigned_to ?? payload.assignee ?? payload.assigneeId } : {}),
  }
  return (await api.put(`/api/tasks/${id}`, body)).data
}

// Users
export const listUsers = async () => (await api.get('/api/users')).data
export const getCurrentUser = async () => {
  try {
    const { data } = await api.get('/api/users/profile')
    return data
  } catch {
    // If profile endpoint doesn't exist, try to get user info from token
    console.warn('Profile endpoint not available, using fallback')
    const { user } = useAuthStore.getState()
    return { user }
  }
}
export const updateUser = async (id, payload) => (await api.put(`/api/users/${id}`, payload)).data
export const deleteUser = async (id) => (await api.delete(`/api/users/${id}`)).data

// Clients (separate from Companies)
export const listClients = async () => (await api.get('/api/clients')).data
export const createClient = async (payload) => {
  // This endpoint expects creating a user linked to a company; if only company creation is needed, use createCompany
  return (await api.post('/api/clients', payload)).data
}
export const updateClient = async (id, payload) => (await api.put(`/api/clients/${id}`, payload)).data
export const deleteClient = async (id) => (await api.delete(`/api/clients/${id}`)).data
export const getClient = async (id) => (await api.get(`/api/clients/${id}`)).data

// Tasks (enhanced)
export const getTask = async (id) => (await api.get(`/api/tasks/${id}`)).data
export const deleteTask = async (id) => (await api.delete(`/api/tasks/${id}`)).data
export const getTasksByProject = async (projectId) => (await api.get(`/api/tasks/project/${projectId}`)).data
export const getTasksByUser = async (userId) => (await api.get(`/api/tasks/user/${userId}`)).data

// Comments
export const createComment = async (payload) => (await api.post('/api/comments', payload)).data
export const getCommentsByEntity = async (entityType, entityId) => (await api.get(`/api/comments/${entityType}/${entityId}`)).data
export const updateComment = async (id, payload) => (await api.put(`/api/comments/${id}`, payload)).data
export const deleteComment = async (id) => (await api.delete(`/api/comments/${id}`)).data

// Files
export const uploadFile = async (file, entityType, entityId) => {
  const formData = new FormData()
  formData.append('files', file)
  
  if (entityType === 'project') {
    formData.append('project_id', entityId)
  } else if (entityType === 'task') {
    formData.append('task_id', entityId)
  }
  
  return (await api.post('/api/files/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })).data
}

export const uploadFiles = async (files, entityType, entityId, isPublic = false) => {
  const formData = new FormData()
  
  // Add multiple files
  files.forEach(file => {
    formData.append('files', file)
  })
  
  if (entityType === 'project') {
    formData.append('project_id', entityId)
  } else if (entityType === 'task') {
    formData.append('task_id', entityId)
  }
  
  formData.append('is_public', isPublic)
  
  return (await api.post('/api/files/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })).data
}

export const getFilesByEntity = async (entityType, entityId) => {
  const params = {}
  if (entityType === 'project') {
    params.project_id = entityId
  } else if (entityType === 'task') {
    params.task_id = entityId
  }
  return (await api.get('/api/files', { params })).data
}
export const downloadFile = async (id) => (await api.get(`/api/files/download/${id}`, { responseType: 'blob' })).data
export const deleteFile = async (id) => (await api.delete(`/api/files/${id}`)).data

// Time Tracking
export const startTimeEntry = async (payload) => (await api.post('/api/time/start', payload)).data
export const stopTimeEntry = async (payload) => (await api.post('/api/time/stop', payload)).data
export const getTimeEntries = async (params) => (await api.get('/api/time/entries', { params })).data
export const getTimeEntriesByTask = async (taskId) => (await api.get(`/api/time/task/${taskId}`)).data
export const updateTimeEntry = async (id, payload) => (await api.put(`/api/time/${id}`, payload)).data
export const deleteTimeEntry = async (id) => (await api.delete(`/api/time/${id}`)).data

// Invoices
export const listInvoices = async (params) => (await api.get('/api/invoices', { params })).data
export const createInvoice = async (payload) => (await api.post('/api/invoices', payload)).data
export const getInvoice = async (id) => (await api.get(`/api/invoices/${id}`)).data
export const updateInvoice = async (id, payload) => (await api.put(`/api/invoices/${id}`, payload)).data
export const deleteInvoice = async (id) => (await api.delete(`/api/invoices/${id}`)).data
export const generateInvoicePDF = async (id) => (await api.get(`/api/invoices/${id}/pdf`, { responseType: 'blob' })).data

// Reports
export const getTimeReport = async (params) => (await api.get('/api/reports/productivity', { params })).data
export const getProjectReport = async (params) => (await api.get('/api/reports/projects', { params })).data
export const getUserPerformanceReport = async (userId, params) => (await api.get('/api/reports/tasks', { params: { ...params, developer_id: userId } })).data
export const getFinancialReport = async (params) => (await api.get('/api/reports/financial', { params })).data
export const exportReport = async (payload) => (await api.post('/api/reports/export', payload, { responseType: 'blob' })).data

// Settings
export const getSettings = async () => (await api.get('/api/settings')).data
export const getSetting = async (key) => (await api.get(`/api/settings/${key}`)).data
export const updateSetting = async (key, payload) => (await api.put(`/api/settings/${key}`, payload)).data
export const createSetting = async (payload) => (await api.post('/api/settings', payload)).data
export const deleteSetting = async (key) => (await api.delete(`/api/settings/${key}`)).data

// Company Data (handles role-based access automatically)
export const getCompanyData = async () => (await api.get('/api/settings/company')).data

// Client Projects (for client users to view their company projects)
export const getClientProjects = async () => {
  // For client users, this gets their company's projects automatically
  // For admin/dev, this gets all projects they have access to
  return (await api.get('/api/projects')).data
}

// Chat
export const getChannels = async () => {
  const { data } = await api.get('/api/chat/conversations')
  const conversations = Array.isArray(data?.conversations) ? data.conversations : []
  // Map to frontend-friendly fields (type, description)
  const channels = conversations.map(c => ({
    ...c,
    type: c.is_group_chat ? 'public' : 'direct',
    description: c.project_name ? `Project: ${c.project_name}` : undefined
  }))
  return { channels }
}

export const getMessages = async ({ channelId, limit = 50, page = 1 }) => {
  if (!channelId) return { messages: [] }
  const { data } = await api.get(`/api/chat/conversations/${channelId}/messages`, { params: { limit, page } })
  const messages = (Array.isArray(data?.messages) ? data.messages : []).map(m => ({
    ...m,
    user_name: m.sender_name,
    created_at: m.created_at,
    message: m.content
  }))
  return { messages }
}

export const sendMessage = async ({ message, channelId, type = 'text' }) => {
  if (!channelId) throw new Error('channelId is required')
  return (await api.post(`/api/chat/conversations/${channelId}/messages`, {
    content: message,
    message_type: type
  })).data
}

export const createChannel = async (payload) => (await api.post('/api/chat/conversations', payload)).data

// Dashboard (enhanced)
export const getDashboardActivities = async () => {
  try {
    const { data } = await api.get('/api/dashboard/recent-activity')
    return data
  } catch {
    console.warn('Activities endpoint not available')
    return { activities: [] }
  }
}
export const getDashboardTasks = async () => {
  try {
    const { data } = await api.get('/api/dashboard/upcoming-tasks')
    return data
  } catch {
    console.warn('Dashboard tasks endpoint not available')
    return { tasks: [] }
  }
}

export default api
