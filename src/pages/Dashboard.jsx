import { useEffect, useState } from 'react'
import { getDashboardStats, getDashboardProgress, getDashboardActivities, getDashboardTasks } from '../services/api'
import useAuthStore from '../store/auth'

export default function Dashboard() {
  const [stats, setStats] = useState({})
  const [progress, setProgress] = useState([])
  const [activities, setActivities] = useState([])
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { user } = useAuthStore()

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true)
        // Load all dashboard data in parallel
        const [statsResponse, progressResponse, activitiesResponse, tasksResponse] = await Promise.all([
          getDashboardStats().catch(() => ({ stats: {} })),
          getDashboardProgress().catch(() => ({ projects: [] })),
          getDashboardActivities().catch(() => ({ activities: [] })),
          getDashboardTasks().catch(() => ({ tasks: [] }))
        ])
        
        setStats(statsResponse.stats || {})
        setProgress(Array.isArray(progressResponse?.projects) ? progressResponse.projects : 
                   Array.isArray(progressResponse) ? progressResponse : [])
        setActivities(Array.isArray(activitiesResponse?.activities) ? activitiesResponse.activities : 
                     Array.isArray(activitiesResponse) ? activitiesResponse : [])
        setTasks(Array.isArray(tasksResponse?.tasks) ? tasksResponse.tasks : 
                Array.isArray(tasksResponse) ? tasksResponse : [])
      } catch (err) {
        setError(err.response?.data?.error || err.response?.data?.message || 'Failed to load dashboard data')
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [])

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString()
  }

  const getActivityIcon = (action) => {
    switch (action) {
      case 'project_created':
      case 'project_updated':
        return '📁'
      case 'task_created':
      case 'task_updated':
      case 'task_assigned':
        return '✅'
      case 'user_registered':
      case 'user_updated':
        return '👤'
      case 'comment_created':
        return '💬'
      default:
        return '📝'
    }
  }

  const getTaskPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800'
      case 'low':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getTaskStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'in_progress':
        return 'bg-blue-100 text-blue-800'
      case 'new':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getDashboardTitle = () => {
    switch (user?.role) {
      case 'administrator':
        return 'System Overview'
      case 'developer':
        return 'My Workspace'
      case 'client':
        return 'Project Dashboard'
      default:
        return 'Dashboard'
    }
  }

  const getDashboardSubtitle = () => {
    switch (user?.role) {
      case 'administrator':
        return 'Complete system statistics and activity overview'
      case 'developer':
        return 'Your projects, tasks, and recent activity'
      case 'client':
        return 'Track your project progress and updates'
      default:
        return 'Welcome to your dashboard'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading dashboard...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold text-text_primary">{getDashboardTitle()}</h1>
        <p className="text-text_secondary mt-1">{getDashboardSubtitle()}</p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
          {error}
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {user?.role === 'administrator' && (
          <>
            <div className="bg-white rounded-lg border border-border shadow-soft p-4">
              <div className="text-2xl font-bold text-blue-600">{stats.total_projects || 0}</div>
              <div className="text-sm text-gray-600">Total Projects</div>
              <div className="text-xs text-gray-500 mt-1">
                {stats.ongoing_projects || 0} active, {stats.completed_projects || 0} completed
              </div>
            </div>
            <div className="bg-white rounded-lg border border-border shadow-soft p-4">
              <div className="text-2xl font-bold text-green-600">{stats.total_tasks || 0}</div>
              <div className="text-sm text-gray-600">Total Tasks</div>
              <div className="text-xs text-gray-500 mt-1">
                {stats.overdue_tasks || 0} overdue, {stats.high_priority_tasks || 0} high priority
              </div>
            </div>
            <div className="bg-white rounded-lg border border-border shadow-soft p-4">
              <div className="text-2xl font-bold text-purple-600">{stats.total_users || 0}</div>
              <div className="text-sm text-gray-600">Total Users</div>
              <div className="text-xs text-gray-500 mt-1">
                {stats.developers || 0} developers, {stats.clients || 0} clients
              </div>
            </div>
            <div className="bg-white rounded-lg border border-border shadow-soft p-4">
              <div className="text-2xl font-bold text-orange-600">{stats.total_companies || 0}</div>
              <div className="text-sm text-gray-600">Active Companies</div>
              <div className="text-xs text-gray-500 mt-1">
                {stats.active_companies || 0} active clients
              </div>
            </div>
          </>
        )}

        {user?.role === 'developer' && (
          <>
            <div className="bg-white rounded-lg border border-border shadow-soft p-4">
              <div className="text-2xl font-bold text-blue-600">{stats.total_projects || 0}</div>
              <div className="text-sm text-gray-600">My Projects</div>
              <div className="text-xs text-gray-500 mt-1">
                {stats.ongoing_projects || 0} active, {stats.completed_projects || 0} completed
              </div>
            </div>
            <div className="bg-white rounded-lg border border-border shadow-soft p-4">
              <div className="text-2xl font-bold text-green-600">{stats.assigned_tasks || 0}</div>
              <div className="text-sm text-gray-600">Assigned Tasks</div>
              <div className="text-xs text-gray-500 mt-1">
                {stats.overdue_assigned_tasks || 0} overdue, {stats.in_progress_assigned_tasks || 0} in progress
              </div>
            </div>
            <div className="bg-white rounded-lg border border-border shadow-soft p-4">
              <div className="text-2xl font-bold text-purple-600">{stats.hours_this_week || 0}h</div>
              <div className="text-sm text-gray-600">This Week</div>
              <div className="text-xs text-gray-500 mt-1">
                {stats.hours_this_month || 0}h this month
              </div>
            </div>
            <div className="bg-white rounded-lg border border-border shadow-soft p-4">
              <div className="text-2xl font-bold text-orange-600">{stats.new_assigned_tasks || 0}</div>
              <div className="text-sm text-gray-600">New Tasks</div>
              <div className="text-xs text-gray-500 mt-1">
                Recently assigned
              </div>
            </div>
          </>
        )}

        {user?.role === 'client' && (
          <>
            <div className="bg-white rounded-lg border border-border shadow-soft p-4">
              <div className="text-2xl font-bold text-blue-600">{stats.total_projects || 0}</div>
              <div className="text-sm text-gray-600">Your Projects</div>
              <div className="text-xs text-gray-500 mt-1">
                {stats.ongoing_projects || 0} active, {stats.completed_projects || 0} completed
              </div>
            </div>
            <div className="bg-white rounded-lg border border-border shadow-soft p-4">
              <div className="text-2xl font-bold text-green-600">{stats.total_tasks || 0}</div>
              <div className="text-sm text-gray-600">Total Tasks</div>
              <div className="text-xs text-gray-500 mt-1">
                {stats.completed_tasks || 0} completed, {stats.overdue_tasks || 0} overdue
              </div>
            </div>
            <div className="bg-white rounded-lg border border-border shadow-soft p-4">
              <div className="text-2xl font-bold text-purple-600">
                ${stats.total_budget ? parseFloat(stats.total_budget).toLocaleString() : '0'}
              </div>
              <div className="text-sm text-gray-600">Total Budget</div>
              <div className="text-xs text-gray-500 mt-1">
                ${stats.total_paid ? parseFloat(stats.total_paid).toLocaleString() : '0'} paid
              </div>
            </div>
            <div className="bg-white rounded-lg border border-border shadow-soft p-4">
              <div className="text-2xl font-bold text-orange-600">
                ${stats.pending_invoices ? parseFloat(stats.pending_invoices).toLocaleString() : '0'}
              </div>
              <div className="text-sm text-gray-600">Pending Invoices</div>
              <div className="text-xs text-gray-500 mt-1">
                Awaiting payment
              </div>
            </div>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Projects Progress */}
        {progress.length > 0 && (
          <div className="bg-white rounded-xl border border-border shadow-soft">
            <div className="p-6 border-b border-border">
              <h2 className="text-xl font-semibold text-gray-900">Active Projects</h2>
              <p className="text-gray-600 mt-1">Project progress overview</p>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {progress.slice(0, 5).map((project) => (
                  <div key={project.id} className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{project.name}</h4>
                      <div className="mt-1">
                        <div className="bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 rounded-full h-2 transition-all duration-300"
                            style={{ width: `${project.progress_percentage || 0}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                    <div className="ml-4 text-sm font-medium text-gray-600">
                      {project.progress_percentage || 0}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Recent Activity */}
        <div className="bg-white rounded-xl border border-border shadow-soft">
          <div className="p-6 border-b border-border">
            <h2 className="text-xl font-semibold text-gray-900">Recent Activity</h2>
            <p className="text-gray-600 mt-1">Latest updates and changes</p>
          </div>
          <div className="p-6">
            {activities.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                No recent activity found
              </div>
            ) : (
              <div className="space-y-4">
                {activities.slice(0, 5).map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3">
                    <div className="text-lg">{getActivityIcon(activity.action)}</div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">
                        <span className="font-medium">{activity.user_name}</span>{' '}
                        {activity.action.replace('_', ' ')}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDate(activity.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Tasks (for developers) */}
        {user?.role !== 'client' && tasks.length > 0 && (
          <div className="bg-white rounded-xl border border-border shadow-soft lg:col-span-2">
            <div className="p-6 border-b border-border">
              <h2 className="text-xl font-semibold text-gray-900">
                {user?.role === 'developer' ? 'My Upcoming Tasks' : 'Upcoming Tasks'}
              </h2>
              <p className="text-gray-600 mt-1">Tasks requiring attention</p>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {tasks.slice(0, 5).map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{task.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">{task.project_name}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {task.priority && (
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getTaskPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                      )}
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getTaskStatusColor(task.status)}`}>
                        {(task.status || 'new').replace('_', ' ')}
                      </span>
                      <span className="text-xs text-gray-500 ml-2">
                        {formatDate(task.due_date)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
