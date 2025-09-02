import { useEffect, useState } from 'react'
import { 
  getTimeEntries, 
  startTimeEntry, 
  stopTimeEntry, 
  updateTimeEntry, 
  deleteTimeEntry,
  listProjects,
  listTasks
} from '../services/api'
import { PermissionGuard } from '../utils/permissions.jsx'

export default function TimeTracking() {
  const [timeEntries, setTimeEntries] = useState([])
  const [projects, setProjects] = useState([])
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeEntry, setActiveEntry] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [editingEntry, setEditingEntry] = useState(null)
  const [formData, setFormData] = useState({
    taskId: '',
    description: '',
    duration: 0
  })

  useEffect(() => {
    loadTimeEntries()
    loadProjects()
    loadTasks()
  }, [])

  const loadTimeEntries = async () => {
    try {
      setLoading(true)
      const data = await getTimeEntries()
      console.log('Time entries data:', data) // Debug log
      setTimeEntries(Array.isArray(data?.time_entries) ? data.time_entries : Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load time entries')
    } finally {
      setLoading(false)
    }
  }

  const loadProjects = async () => {
    try {
      const data = await listProjects()
      setProjects(Array.isArray(data?.projects) ? data.projects : Array.isArray(data) ? data : [])
    } catch (err) {
      console.warn('Failed to load projects:', err)
    }
  }

  const loadTasks = async () => {
    try {
      const data = await listTasks()
      setTasks(Array.isArray(data?.tasks) ? data.tasks : Array.isArray(data) ? data : [])
    } catch (err) {
      console.warn('Failed to load tasks:', err)
    }
  }

  const handleStartTimer = async (taskId, description) => {
    try {
      const data = await startTimeEntry({ taskId, description })
      setActiveEntry(data)
      setError('')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to start timer')
    }
  }

  const handleStopTimer = async () => {
    try {
      if (activeEntry) {
        await stopTimeEntry({ timeEntryId: activeEntry.id })
        setActiveEntry(null)
        loadTimeEntries()
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to stop timer')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingEntry) {
        await updateTimeEntry(editingEntry.id, formData)
      } else {
        // Manual time entry
        await startTimeEntry({
          taskId: formData.taskId,
          description: formData.description,
          duration: formData.duration * 3600 // Convert hours to seconds
        })
      }
      
      setShowForm(false)
      setEditingEntry(null)
      setFormData({ taskId: '', description: '', duration: 0 })
      loadTimeEntries()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save time entry')
    }
  }

  const handleEdit = (entry) => {
    setEditingEntry(entry)
    setFormData({
      taskId: entry.taskId || entry.task_id || '',
      description: entry.description || '',
      duration: Math.round((entry.duration || 0) / 3600 * 100) / 100 // Convert seconds to hours
    })
    setShowForm(true)
  }

  const handleDelete = async (entry) => {
    if (window.confirm('Are you sure you want to delete this time entry?')) {
      try {
        await deleteTimeEntry(entry.id)
        loadTimeEntries()
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to delete time entry')
      }
    }
  }

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${hours}h ${minutes}m`
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString()
  }

  const getTaskName = (taskId) => {
    const task = tasks.find(t => t.id === taskId)
    return task?.title || task?.name || 'Unknown Task'
  }

  const getProjectName = (projectId) => {
    const project = projects.find(p => p.id === projectId)
    return project?.name || 'Unknown Project'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading time entries...</div>
      </div>
    )
  }

  return (
    <div>
      <header className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-semibold text-text_primary">Time Tracking</h1>
          <p className="text-text_secondary">Track your work time on projects and tasks</p>
        </div>
        <div className="flex gap-2">
          <PermissionGuard action="create" resource="time-entries">
            <button
              onClick={() => setShowForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow-soft hover:bg-blue-700 transition"
            >
              Add Manual Entry
            </button>
          </PermissionGuard>
        </div>
      </header>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
          {error}
        </div>
      )}

      {/* Timer Section */}
      <div className="bg-white rounded-xl border border-border p-6 mb-6 shadow-soft">
        <h2 className="text-xl font-semibold mb-4">Timer</h2>
        {activeEntry ? (
          <div className="flex items-center justify-between">
            <div>
              <div className="text-lg font-medium text-green-600">⏰ Timer Running</div>
              <div className="text-sm text-gray-600">
                Task: {getTaskName(activeEntry.taskId)}
              </div>
              <div className="text-sm text-gray-600">
                {activeEntry.description}
              </div>
            </div>
            <button
              onClick={handleStopTimer}
              className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition"
            >
              Stop Timer
            </button>
          </div>
        ) : (
          <div>
            <div className="text-lg text-gray-600 mb-4">No active timer</div>
            <div className="flex gap-2">
              <select 
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                onChange={(e) => {
                  const taskId = e.target.value
                  if (taskId) {
                    handleStartTimer(taskId, 'Working on task')
                  }
                }}
              >
                <option value="">Select a task to start timer</option>
                {tasks.map((task) => (
                  <option key={task.id} value={task.id}>
                    {task.title || task.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Time Entry Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">
              {editingEntry ? 'Edit Time Entry' : 'Add Manual Time Entry'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Task *
                </label>
                <select
                  value={formData.taskId}
                  onChange={(e) => setFormData({ ...formData, taskId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                >
                  <option value="">Select Task</option>
                  {tasks.map((task) => (
                    <option key={task.id} value={task.id}>
                      {task.title || task.name}
                    </option>
                  ))}
                </select>
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
                  placeholder="What did you work on?"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duration (hours) *
                </label>
                <input
                  type="number"
                  step="0.25"
                  min="0"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-primary text-white py-2 rounded-lg hover:bg-primary/90 transition"
                >
                  {editingEntry ? 'Update' : 'Add'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false)
                    setEditingEntry(null)
                    setFormData({ taskId: '', description: '', duration: 0 })
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

      {/* Time Entries Table */}
      <div className="bg-white rounded-xl border border-border shadow-soft overflow-hidden">
        <div className="p-4 border-b border-border">
          <h2 className="text-lg font-semibold">Time Entries</h2>
        </div>
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-border">
            <tr>
              <th className="text-left py-3 px-4 font-medium text-gray-700">Date</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">Task</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">Project</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">Description</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">Duration</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {timeEntries.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center py-8 text-gray-500">
                  No time entries found. Start tracking time on your tasks.
                </td>
              </tr>
            ) : (
              timeEntries.map((entry) => (
                <tr key={entry.id} className="border-b border-border hover:bg-gray-50">
                  <td className="py-3 px-4 text-gray-600">
                    {formatDate(entry.startTime || entry.start_time || entry.createdAt)}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-medium text-gray-900">
                      {getTaskName(entry.taskId || entry.task_id)}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-600">
                    {getProjectName(entry.projectId || entry.project_id)}
                  </td>
                  <td className="py-3 px-4 text-gray-600 max-w-xs truncate">
                    {entry.description || '-'}
                  </td>
                  <td className="py-3 px-4 text-gray-600">
                    {formatDuration(entry.duration || 0)}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      <PermissionGuard action="edit" resource="time-entries">
                        <button
                          onClick={() => handleEdit(entry)}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          Edit
                        </button>
                      </PermissionGuard>
                      <PermissionGuard action="delete" resource="time-entries">
                        <button
                          onClick={() => handleDelete(entry)}
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
    </div>
  )
}
