import { useEffect, useState, useCallback } from 'react'
import { listTasks, createTask, updateTask, deleteTask, listProjects, listUsers } from '../services/api'
import { PermissionGuard, usePermissions } from '../utils/permissions.jsx'
import CommentSection from '../components/CommentSection'

export default function Tasks() {
  const [tasks, setTasks] = useState([])
  const [projects, setProjects] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [showDetailModal, setShowDetailModal] = useState(null)
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    assignee: ''
  })
  const { userRole } = usePermissions()
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    project: '',
    assignee: '',
    priority: 'medium',
    status: 'todo',
    deadline: '',
    estimatedHours: ''
  })

  const loadTasks = useCallback(async () => {
    try {
      setLoading(true)
      const data = await listTasks(filters)
      setTasks(Array.isArray(data?.tasks) ? data.tasks : Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load tasks')
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    loadTasks()
    loadProjects()
    loadUsers()
  }, [loadTasks])

  const loadProjects = async () => {
    try {
      const data = await listProjects()
      setProjects(Array.isArray(data?.projects) ? data.projects : Array.isArray(data) ? data : [])
    } catch (err) {
      console.warn('Failed to load projects:', err)
    }
  }

  const loadUsers = async () => {
    try {
      const data = await listUsers()
      console.log('Loaded users:', data) // Debug log
      setUsers(Array.isArray(data?.users) ? data.users : Array.isArray(data) ? data : [])
    } catch (err) {
      console.warn('Failed to load users:', err)
      setUsers([]) // Ensure users is always an array
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingTask) {
        await updateTask(editingTask.id || editingTask._id, formData)
      } else {
        await createTask(formData)
      }
      
      setShowForm(false)
      setEditingTask(null)
      resetForm()
      loadTasks()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save task')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      project: '',
      assignee: '',
      priority: 'medium',
      status: 'todo',
      deadline: '',
      estimatedHours: ''
    })
  }

  const handleEdit = (task) => {
    setEditingTask(task)
    setFormData({
      name: task.title || task.name || '',
      description: task.description || '',
      project: task.projectId || task.project_id || task.project || '',
      assignee: task.assigneeId || task.assignee_id || task.assignee || '',
      priority: task.priority || 'medium',
      status: task.status || 'todo',
      deadline: task.dueDate ? task.dueDate.split('T')[0] : task.deadline ? task.deadline.split('T')[0] : '',
      estimatedHours: task.estimatedHours || task.estimated_hours || ''
    })
    setShowForm(true)
  }

  const handleDelete = async (task) => {
    if (window.confirm(`Are you sure you want to delete "${task.title || task.name}"?`)) {
      try {
        await deleteTask(task.id || task._id)
        loadTasks()
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to delete task')
      }
    }
  }

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'in_progress':
      case 'in progress':
        return 'bg-blue-100 text-blue-800'
      case 'blocked':
        return 'bg-red-100 text-red-800'
      case 'todo':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
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

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString()
  }

  const getProjectName = (projectId) => {
    const project = projects.find(p => (p.id || p._id) === projectId)
    return project?.name || 'Unknown Project'
  }

  const getUserName = (userId) => {
    const user = users.find(u => (u.id || u._id) === userId)
    return user ? (user.name || `${user.first_name} ${user.last_name}` || user.email) : 'Unassigned'
  }

  const getPageTitle = () => {
    switch (userRole) {
      case 'administrator':
        return 'Task Management'
      case 'developer':
        return 'My Tasks'
      case 'client':
        return 'Project Tasks'
      default:
        return 'Tasks'
    }
  }

  const getPageSubtitle = () => {
    switch (userRole) {
      case 'administrator':
        return 'Manage all tasks across projects'
      case 'developer':
        return 'View and update your assigned tasks'
      case 'client':
        return 'Monitor task progress in your projects'
      default:
        return 'Track and manage project tasks'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading tasks...</div>
      </div>
    )
  }

  return (
    <div>
      <header className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-semibold text-text_primary">{getPageTitle()}</h1>
          <p className="text-text_secondary">{getPageSubtitle()}</p>
        </div>
        <PermissionGuard action="create" resource="tasks">
          <button
            onClick={() => setShowForm(true)}
            className="bg-primary text-white px-4 py-2 rounded-lg shadow-soft hover:bg-primary/90 transition"
          >
            Add Task
          </button>
        </PermissionGuard>
      </header>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg border border-border p-4 mb-6 shadow-soft">
        <h3 className="text-lg font-medium mb-4">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">All Statuses</option>
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="blocked">Blocked</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            <select
              value={filters.priority}
              onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">All Priorities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          {userRole === 'administrator' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assignee</label>
              <select
                value={filters.assignee}
                onChange={(e) => setFilters({ ...filters, assignee: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">All Assignees</option>
                {users.map((user) => (
                  <option key={user.id || user._id} value={user.id || user._id}>
                    {user.name || `${user.first_name} ${user.last_name}` || user.email}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Task Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">
              {editingTask ? 'Edit Task' : 'Create New Task'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Task Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Project *
                  </label>
                  <select
                    value={formData.project}
                    onChange={(e) => setFormData({ ...formData, project: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  >
                    <option value="">Select Project</option>
                    {projects.map((project) => (
                      <option key={project.id || project._id} value={project.id || project._id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Assignee
                  </label>
                  <select
                    value={formData.assignee}
                    onChange={(e) => setFormData({ ...formData, assignee: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Unassigned</option>
                    {users.filter(u => u.role === 'developer' || u.role === 'administrator').map((user) => (
                      <option key={user.id || user._id} value={user.id || user._id}>
                        {user.name || `${user.first_name} ${user.last_name}` || user.email}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="blocked">Blocked</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estimated Hours
                  </label>
                  <input
                    type="number"
                    value={formData.estimatedHours}
                    onChange={(e) => setFormData({ ...formData, estimatedHours: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    min="0"
                    step="0.5"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Due Date
                </label>
                <input
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-primary text-white py-2 rounded-lg hover:bg-primary/90 transition"
                >
                  {editingTask ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false)
                    setEditingTask(null)
                    resetForm()
                  }}
                  className="flex-1 bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tasks Table */}
      <div className="bg-white rounded-xl border border-border shadow-soft overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-border">
            <tr>
              <th className="text-left py-3 px-4 font-medium text-gray-700">Task</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">Project</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">Assignee</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">Priority</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">Due Date</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {tasks.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center py-8 text-gray-500">
                  No tasks found. Create your first task to get started.
                </td>
              </tr>
            ) : (
              tasks.map((task) => (
                <tr key={task.id || task._id} className="border-b border-border hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="font-medium text-gray-900">{task.title || task.name}</div>
                    {task.description && (
                      <div className="text-sm text-gray-600 truncate max-w-xs">
                        {task.description}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4 text-gray-600">
                    {getProjectName(task.projectId || task.project_id || task.project)}
                  </td>
                  <td className="py-3 px-4 text-gray-600">
                    {getUserName(task.assigneeId || task.assignee_id || task.assignee)}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                      {task.priority || 'medium'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                      {(task.status || 'todo').replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-600">
                    {formatDate(task.dueDate || task.due_date || task.deadline)}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowDetailModal(task)}
                        className="text-purple-600 hover:text-purple-800 text-sm"
                      >
                        View
                      </button>
                      <PermissionGuard action="edit" resource="tasks">
                        <button
                          onClick={() => handleEdit(task)}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          Edit
                        </button>
                      </PermissionGuard>
                      <PermissionGuard action="delete" resource="tasks">
                        <button
                          onClick={() => handleDelete(task)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Delete
                        </button>
                      </PermissionGuard>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Task Detail Modal */}
      {showDetailModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                    {showDetailModal.name || showDetailModal.title}
                  </h2>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>Project: {getProjectName(showDetailModal.projectId || showDetailModal.project_id || showDetailModal.project)}</span>
                    <span>Assigned to: {getUserName(showDetailModal.assigneeId || showDetailModal.assignee_id || showDetailModal.assignee)}</span>
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(showDetailModal.priority)}`}>
                      {showDetailModal.priority || 'medium'}
                    </span>
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(showDetailModal.status)}`}>
                      {(showDetailModal.status || 'todo').replace('_', ' ')}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setShowDetailModal(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Task Details */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium text-gray-800 mb-2">Task Details</h3>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                      <div>
                        <span className="text-sm font-medium text-gray-600">Description:</span>
                        <p className="text-gray-800 mt-1">
                          {showDetailModal.description || 'No description provided'}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600">Due Date:</span>
                        <p className="text-gray-800 mt-1">
                          {formatDate(showDetailModal.dueDate || showDetailModal.due_date || showDetailModal.deadline) || 'No due date set'}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600">Estimated Hours:</span>
                        <p className="text-gray-800 mt-1">
                          {showDetailModal.estimatedHours || showDetailModal.estimated_hours || 'Not specified'}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600">Created:</span>
                        <p className="text-gray-800 mt-1">
                          {formatDate(showDetailModal.createdAt || showDetailModal.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Comments Section */}
                <div>
                  <CommentSection 
                    entityType="task" 
                    entityId={showDetailModal.id || showDetailModal._id}
                    entityTitle={showDetailModal.name || showDetailModal.title}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
