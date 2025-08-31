import { useEffect, useState } from 'react'
import { getCompanyData, getClientProjects } from '../services/api'
import ClientProjectDetails from '../components/ClientProjectDetails'

export default function ClientPortal() {
  const [clientData, setClientData] = useState(null)
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedProject, setSelectedProject] = useState(null)

  useEffect(() => {
    const loadClientData = async () => {
      try {
        setLoading(true)
        // Load company data and projects in parallel
        const [companyResponse, projectsResponse] = await Promise.all([
          getCompanyData(),
          getClientProjects()
        ])
        
        setClientData(companyResponse.company)
        setProjects(Array.isArray(projectsResponse?.projects) ? projectsResponse.projects : 
                  Array.isArray(projectsResponse) ? projectsResponse : [])
      } catch (err) {
        setError(err.response?.data?.error || err.response?.data?.message || 'Failed to load client data')
      } finally {
        setLoading(false)
      }
    }

    loadClientData()
  }, [])

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

  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified'
    return new Date(dateString).toLocaleDateString()
  }

  const calculateProgress = (project) => {
    if (project.progress_percentage) return project.progress_percentage
    if (project.completed_tasks && project.total_tasks) {
      return Math.round((project.completed_tasks / project.total_tasks) * 100)
    }
    return 0
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading your projects...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
        {error}
      </div>
    )
  }

  if (!clientData) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-600">
        No company data found. Please contact your administrator.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Company Header */}
      <div className="bg-white rounded-xl border border-border shadow-soft p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-text_primary">{clientData.name}</h1>
            <p className="text-text_secondary mt-1">Project Dashboard</p>
          </div>
          <div className="text-right text-sm text-gray-600">
            <div>Contact: {clientData.contact_person || 'Not specified'}</div>
            <div>Email: {clientData.email || 'Not specified'}</div>
            <div>Phone: {clientData.phone || 'Not specified'}</div>
          </div>
        </div>
      </div>

      {/* Project Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-border shadow-soft p-4">
          <div className="text-2xl font-bold text-blue-600">{projects.length}</div>
          <div className="text-sm text-gray-600">Total Projects</div>
        </div>
        <div className="bg-white rounded-lg border border-border shadow-soft p-4">
          <div className="text-2xl font-bold text-green-600">
            {projects.filter(p => p.status === 'ongoing').length}
          </div>
          <div className="text-sm text-gray-600">Active Projects</div>
        </div>
        <div className="bg-white rounded-lg border border-border shadow-soft p-4">
          <div className="text-2xl font-bold text-purple-600">
            {projects.filter(p => p.status === 'completed').length}
          </div>
          <div className="text-sm text-gray-600">Completed Projects</div>
        </div>
        <div className="bg-white rounded-lg border border-border shadow-soft p-4">
          <div className="text-2xl font-bold text-orange-600">
            {projects.length > 0 ? 
              Math.round(projects.reduce((acc, p) => acc + calculateProgress(p), 0) / projects.length) : 0}%
          </div>
          <div className="text-sm text-gray-600">Overall Progress</div>
        </div>
      </div>

      {/* Projects List */}
      <div className="bg-white rounded-xl border border-border shadow-soft">
        <div className="p-6 border-b border-border">
          <h2 className="text-xl font-semibold text-gray-900">Your Projects</h2>
          <p className="text-gray-600 mt-1">Track the progress of your ongoing and completed projects</p>
        </div>
        
        <div className="p-6">
          {!projects || projects.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No projects found. Your projects will appear here once they are created.
            </div>
          ) : (
            <div className="space-y-4">
              {projects.map((project) => (
                <div key={project.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900">{project.name}</h3>
                      {project.description && (
                        <p className="text-gray-600 mt-1 text-sm">{project.description}</p>
                      )}
                    </div>
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                      {(project.status || 'planning').replace('_', ' ')}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <span className="text-sm font-medium text-gray-700">Timeline:</span>
                      <div className="text-sm text-gray-600">
                        <div>Start: {formatDate(project.start_date)}</div>
                        <div>End: {formatDate(project.end_date)}</div>
                      </div>
                    </div>
                    
                    {project.total_tasks && (
                      <div>
                        <span className="text-sm font-medium text-gray-700">Tasks:</span>
                        <div className="text-sm text-gray-600">
                          {project.completed_tasks} of {project.total_tasks} completed
                        </div>
                      </div>
                    )}
                    
                    <div>
                      <span className="text-sm font-medium text-gray-700">Progress:</span>
                      <div className="mt-1">
                        <div className="bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 rounded-full h-2 transition-all duration-300"
                            style={{ width: `${calculateProgress(project)}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-600 mt-1">{calculateProgress(project)}% complete</span>
                      </div>
                    </div>
                  </div>

                  {/* Project Actions */}
                  <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                    <div className="text-xs text-gray-500">
                      Created: {formatDate(project.created_at)}
                    </div>
                    <button 
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      onClick={() => setSelectedProject(project)}
                    >
                      View Details →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Project Details Modal */}
      {selectedProject && (
        <ClientProjectDetails
          project={selectedProject}
          onClose={() => setSelectedProject(null)}
        />
      )}
    </div>
  )
}
