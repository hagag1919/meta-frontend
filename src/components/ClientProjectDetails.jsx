import { useEffect, useState } from 'react'
import { getProject, getTasksByProject } from '../services/api'
import CommentSection from './CommentSection'

export default function ClientProjectDetails({ project, onClose }) {
  const [projectDetails, setProjectDetails] = useState(null)
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadProjectDetails = async () => {
      try {
        setLoading(true)
        const [projectResponse, tasksResponse] = await Promise.all([
          getProject(project.id),
          getTasksByProject(project.id)
        ])
        
        setProjectDetails(projectResponse.project || projectResponse)
        setTasks(Array.isArray(tasksResponse?.tasks) ? tasksResponse.tasks : 
               Array.isArray(tasksResponse) ? tasksResponse : [])
      } catch (err) {
        setError(err.response?.data?.error || err.response?.data?.message || 'Failed to load project details')
      } finally {
        setLoading(false)
      }
    }

    if (project?.id) {
      loadProjectDetails()
    }
  }, [project?.id])

  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified'
    return new Date(dateString).toLocaleDateString()
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'ongoing':
        return 'bg-blue-100 text-blue-800'
      case 'planning':
        return 'bg-yellow-100 text-yellow-800'
      case 'stopped':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority) => {
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
      case 'canceled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const calculateProgress = () => {
    if (projectDetails?.progress_percentage) return projectDetails.progress_percentage
    if (tasks.length === 0) return 0
    const completedTasks = tasks.filter(task => task.status === 'completed').length
    return Math.round((completedTasks / tasks.length) * 100)
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-600">Loading project details...</div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Project Details</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
            {error}
          </div>
        </div>
      </div>
    )
  }

  const displayProject = projectDetails || project

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-900">{displayProject.name}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl"
          >
            ✕
          </button>
        </div>

        {/* Project Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Project Description</h3>
              <p className="text-gray-700">{displayProject.description || 'No description provided'}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-sm font-medium text-gray-700">Timeline:</span>
                <div className="text-gray-900">
                  <div>Start: {formatDate(displayProject.start_date)}</div>
                  <div>End: {formatDate(displayProject.end_date)}</div>
                </div>
              </div>
              
              <div>
                <span className="text-sm font-medium text-gray-700">Status:</span>
                <div className="mt-1">
                  <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(displayProject.status)}`}>
                    {(displayProject.status || 'planning').replace('_', ' ')}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="text-md font-medium text-gray-900 mb-3">Progress Overview</h4>
              
              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Overall Progress</span>
                  <span>{calculateProgress()}%</span>
                </div>
                <div className="bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-blue-600 rounded-full h-3 transition-all duration-300"
                    style={{ width: `${calculateProgress()}%` }}
                  ></div>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Tasks:</span>
                  <span className="font-medium">{tasks.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Completed:</span>
                  <span className="font-medium text-green-600">
                    {tasks.filter(t => t.status === 'completed').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">In Progress:</span>
                  <span className="font-medium text-blue-600">
                    {tasks.filter(t => t.status === 'in_progress').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Pending:</span>
                  <span className="font-medium text-yellow-600">
                    {tasks.filter(t => t.status === 'new').length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tasks List */}
        <div className="mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Project Tasks</h3>
          
          {tasks.length === 0 ? (
            <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
              No tasks found for this project.
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="max-h-64 overflow-y-auto">
                {tasks.map((task) => (
                  <div key={task.id} className="border-b border-gray-200 p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{task.title}</h4>
                        {task.description && (
                          <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-xs">
                          <span className={`inline-flex px-2 py-1 rounded-full font-medium ${getTaskStatusColor(task.status)}`}>
                            {(task.status || 'new').replace('_', ' ')}
                          </span>
                          {task.priority && (
                            <span className={`inline-flex px-2 py-1 rounded-full font-medium ${getPriorityColor(task.priority)}`}>
                              {task.priority}
                            </span>
                          )}
                          {task.due_date && (
                            <span className="text-gray-500">
                              Due: {formatDate(task.due_date)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Comments Section */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Project Discussion</h3>
          <CommentSection
            entityType="project"
            entityId={displayProject.id}
            entityTitle={displayProject.name}
          />
        </div>
      </div>
    </div>
  )
}
