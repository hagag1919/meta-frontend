import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { createProject, listProjects, listCompanies, updateProject, deleteProject, listUsers, addProjectMember, removeProjectMember, getProject } from '../services/api'
import { PermissionGuard, usePermissions } from '../utils/permissions.jsx'
import ProjectMilestones from '../components/ProjectMilestones'
import ProjectFiles from '../components/ProjectFiles'
import CommentSection from '../components/CommentSection'

export default function Projects(){
  const [items, setItems] = useState([])
  const [companies, setCompanies] = useState([])
  const [users, setUsers] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingProject, setEditingProject] = useState(null)
  const [showMembersModal, setShowMembersModal] = useState(null)
  const [showMilestonesModal, setShowMilestonesModal] = useState(null)
  const [showFilesModal, setShowFilesModal] = useState(null)
  const [showDetailModal, setShowDetailModal] = useState(null)
  const [availableUsers, setAvailableUsers] = useState([])
  const [projectMembers, setProjectMembers] = useState([])
  const [filters, setFilters] = useState({
    status: '',
    company: ''
  })
  const { userRole } = usePermissions()
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    company_id: '',
    status: 'planning',
    start_date: '',
    end_date: '',
    budget: ''
  })

  const loadCompanies = useCallback(async () => {
    try {
      const data = await listCompanies()
      const companiesList = data.companies || (data.company ? [data.company] : [])
      setCompanies(Array.isArray(companiesList) ? companiesList : [])
      if (companiesList.length > 0 && !formData.company_id) {
        setFormData(prev => ({ ...prev, company_id: companiesList[0].id }))
      }
    } catch (e) {
      console.error('Failed to load companies:', e)
    }
  }, [formData.company_id])

  const loadUsers = useCallback(async () => {
    try {
      const data = await listUsers()
      setUsers(Array.isArray(data?.users) ? data.users : [])
    } catch (e) {
      console.warn('Failed to load users:', e)
    }
  }, [])

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const data = await listProjects(filters)
      setItems(Array.isArray(data?.projects) ? data.projects : Array.isArray(data) ? data : [])
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load projects')
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => { 
    load()
    loadCompanies()
    loadUsers()
  }, [load, loadCompanies, loadUsers])

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (!formData.company_id) {
        setError('Please select a company')
        return
      }

      if (editingProject) {
        await updateProject(editingProject.id, formData)
      } else {
        await createProject(formData)
      }
      
      setShowForm(false)
      setEditingProject(null)
      resetForm()
      load()
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to save project')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      company_id: companies.length > 0 ? companies[0].id : '',
      status: 'planning',
      start_date: '',
      end_date: '',
      budget: ''
    })
  }

  const handleEdit = (project) => {
    setEditingProject(project)
    setFormData({
      name: project.name || '',
      description: project.description || '',
      company_id: project.company_id || '',
      status: project.status || 'planning',
      start_date: project.start_date ? project.start_date.split('T')[0] : '',
      end_date: project.end_date ? project.end_date.split('T')[0] : '',
      budget: project.budget || ''
    })
    setShowForm(true)
  }

  const handleDelete = async (project) => {
    if (window.confirm(`Are you sure you want to delete "${project.name}"?`)) {
      try {
        await deleteProject(project.id)
        load()
      } catch (e) {
        setError(e.response?.data?.message || 'Failed to delete project')
      }
    }
  }

  const handleManageMembers = async (project) => {
    setShowMembersModal(project)
    // Load project members from project details and compute available users
    try {
      const data = await getProject(project.id)
      const team = Array.isArray(data?.project?.team_members) ? data.project.team_members : []
      // Normalize team members to a consistent shape used by UI
      const normalized = team.map(m => ({
        id: m.id, // project_members id
        user_id: m.user_id,
        first_name: m.first_name,
        last_name: m.last_name,
        email: m.email,
        role: m.role || m.user_role || 'Developer',
        joined_at: m.joined_at
      }))
      setProjectMembers(normalized)

      const allUsers = users.filter(u => u.role === 'developer' || u.role === 'administrator')
      const memberUserIds = new Set(normalized.map(m => m.user_id))
      setAvailableUsers(allUsers.filter(u => !memberUserIds.has(u.id)))
    } catch (e) {
      console.warn('Failed to load project members:', e)
    }
  }

  const handleAddMember = async (userId) => {
    try {
      const { member } = await addProjectMember(showMembersModal.id, { user_id: userId })
      const user = availableUsers.find(u => u.id === userId)
      // Normalize returned member to match UI list shape
      const normalized = {
        id: member.id, // project_members id
        user_id: member.user?.id || userId,
        first_name: member.user?.first_name || user?.first_name,
        last_name: member.user?.last_name || user?.last_name,
        email: member.user?.email || user?.email,
        role: member.role || user?.role || 'Developer',
        joined_at: member.joined_at
      }
      setProjectMembers(prev => [...prev, normalized])
      setAvailableUsers(prev => prev.filter(u => u.id !== userId))
    } catch (e) {
      setError(e.response?.data?.error || e.response?.data?.message || 'Failed to add member')
    }
  }

  const handleRemoveMember = async (memberId) => {
    try {
      const member = projectMembers.find(m => m.id === memberId)
      await removeProjectMember(showMembersModal.id, memberId)
      if (member) {
        const userToRestore = {
          id: member.user_id,
          first_name: member.first_name,
          last_name: member.last_name,
          email: member.email,
          role: member.role
        }
        setAvailableUsers(prev => {
          const exists = prev.some(u => u.id === userToRestore.id)
          return exists ? prev : [...prev, userToRestore]
        })
      }
      setProjectMembers(prev => prev.filter(m => m.id !== memberId))
    } catch (e) {
      setError(e.response?.data?.error || e.response?.data?.message || 'Failed to remove member')
    }
  }

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'planning':
        return 'bg-gray-100 text-gray-800'
      case 'ongoing':
        return 'bg-green-100 text-green-800'
      case 'completed':
        return 'bg-blue-100 text-blue-800'
      case 'stopped':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString()
  }

  const getCompanyName = (companyId) => {
    const company = companies.find(c => c.id === companyId)
    return company?.name || 'Unknown'
  }

  const getPageTitle = () => {
    switch (userRole) {
      case 'administrator':
        return 'Project Management'
      case 'developer':
        return 'My Projects'
      case 'client':
        return 'Company Projects'
      default:
        return 'Projects'
    }
  }

  const getPageSubtitle = () => {
    switch (userRole) {
      case 'administrator':
        return 'Manage all projects across the organization'
      case 'developer':
        return 'View and track your assigned projects'
      case 'client':
        return 'Monitor your company projects'
      default:
        return 'Track and manage your projects'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading projects...</div>
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
        <div className="flex gap-2">
          <PermissionGuard action="create" resource="projects">
            <button
              onClick={() => setShowForm(true)}
              className="bg-primary text-white px-4 py-2 rounded-lg shadow-soft hover:bg-primary/90 transition"
            >
              Add Project
            </button>
          </PermissionGuard>
          <PermissionGuard action="view" resource="companies">
            <Link 
              to="/companies" 
              className="bg-gray-500 text-white rounded-lg px-4 py-2 hover:bg-gray-600 text-sm transition"
            >
              Manage Companies
            </Link>
          </PermissionGuard>
        </div>
      </header>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg border border-border p-4 mb-6 shadow-soft">
        <h3 className="text-lg font-medium mb-4">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">All Statuses</option>
              <option value="planning">Planning</option>
              <option value="ongoing">Ongoing</option>
              <option value="completed">Completed</option>
              <option value="stopped">Stopped</option>
            </select>
          </div>
          {userRole === 'administrator' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
              <select
                value={filters.company}
                onChange={(e) => setFilters({ ...filters, company: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">All Companies</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Project Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">
              {editingProject ? 'Edit Project' : 'Create New Project'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Project Name *
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
                    Company *
                  </label>
                  <select
                    value={formData.company_id}
                    onChange={(e) => setFormData({ ...formData, company_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  >
                    <option value="">Select Company</option>
                    {companies.map(company => (
                      <option key={company.id} value={company.id}>{company.name}</option>
                    ))}
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
                    <option value="planning">Planning</option>
                    <option value="ongoing">Ongoing</option>
                    <option value="completed">Completed</option>
                    <option value="stopped">Stopped</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Budget
                </label>
                <input
                  type="number"
                  value={formData.budget}
                  onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-primary text-white py-2 rounded-lg hover:bg-primary/90 transition"
                >
                  {editingProject ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false)
                    setEditingProject(null)
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

      {/* Members Modal */}
      {showMembersModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">
              Manage Members - {showMembersModal.name}
            </h2>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium mb-3">Project Members</h3>
                <div className="space-y-2">
                  {projectMembers.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium">{`${member.first_name || ''} ${member.last_name || ''}`.trim() || member.email}</div>
                        <div className="text-sm text-gray-600">{member.email}</div>
                        <div className="text-xs text-gray-500">{member.role}</div>
                      </div>
                      <button
                        onClick={() => handleRemoveMember(member.id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  {projectMembers.length === 0 && (
                    <div className="text-gray-500 text-center py-4">No members assigned</div>
                  )}
                </div>
              </div>
              <div>
                <h3 className="text-lg font-medium mb-3">Available Users</h3>
                <div className="space-y-2">
                  {availableUsers.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium">{user.name || `${user.first_name} ${user.last_name}`}</div>
                        <div className="text-sm text-gray-600">{user.email}</div>
                        <div className="text-xs text-gray-500">{user.role}</div>
                      </div>
                      <button
                        onClick={() => handleAddMember(user.id)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Add
                      </button>
                    </div>
                  ))}
                  {availableUsers.length === 0 && (
                    <div className="text-gray-500 text-center py-4">No available users</div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex justify-end pt-4">
              <button
                onClick={() => setShowMembersModal(null)}
                className="bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Projects Table */}
      <div className="bg-white rounded-xl border border-border shadow-soft overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-border">
            <tr>
              <th className="text-left py-3 px-4 font-medium text-gray-700">Project</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">Company</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">Timeline</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">Budget</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center py-8 text-gray-500">
                  No projects found. Create your first project to get started.
                </td>
              </tr>
            ) : (
              items.map((project) => (
                <tr key={project.id} className="border-b border-border hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="font-medium text-gray-900">{project.name}</div>
                    {project.description && (
                      <div className="text-sm text-gray-600 truncate max-w-xs">
                        {project.description}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4 text-gray-600">
                    {getCompanyName(project.company_id)}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                      {(project.status || 'planning').replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-600">
                    <div className="text-sm">
                      <div>Start: {formatDate(project.start_date)}</div>
                      <div>End: {formatDate(project.end_date)}</div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-600">
                    {project.budget ? `$${parseFloat(project.budget).toLocaleString()}` : '-'}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowDetailModal(project)}
                        className="text-indigo-600 hover:text-indigo-800 text-sm"
                      >
                        View
                      </button>
                      <PermissionGuard action="edit" resource="projects">
                        <button
                          onClick={() => handleEdit(project)}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          Edit
                        </button>
                      </PermissionGuard>
                      <PermissionGuard action="manage_members" resource="projects">
                        <button
                          onClick={() => handleManageMembers(project)}
                          className="text-green-600 hover:text-green-800 text-sm"
                        >
                          Members
                        </button>
                      </PermissionGuard>
                      <PermissionGuard action="edit" resource="projects">
                        <button
                          onClick={() => setShowMilestonesModal(project)}
                          className="text-purple-600 hover:text-purple-800 text-sm"
                        >
                          Milestones
                        </button>
                      </PermissionGuard>
                      <PermissionGuard action="edit" resource="projects">
                        <button
                          onClick={() => setShowFilesModal(project)}
                          className="text-orange-600 hover:text-orange-800 text-sm"
                        >
                          Files
                        </button>
                      </PermissionGuard>
                      <PermissionGuard action="delete" resource="projects">
                        <button
                          onClick={() => handleDelete(project)}
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

      {/* Milestones Modal */}
      {showMilestonesModal && (
        <ProjectMilestones
          project={showMilestonesModal}
          onClose={() => setShowMilestonesModal(null)}
        />
      )}

      {/* Files Modal */}
      {showFilesModal && (
        <ProjectFiles
          project={showFilesModal}
          onClose={() => setShowFilesModal(null)}
        />
      )}

      {/* Project Detail Modal */}
      {showDetailModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Project Details</h2>
              <button
                onClick={() => setShowDetailModal(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">{showDetailModal.name}</h3>
                
                <div className="space-y-3">
                  <div>
                    <span className="text-sm font-medium text-gray-700">Company:</span>
                    <div className="text-gray-900">{getCompanyName(showDetailModal.company_id)}</div>
                  </div>
                  
                  <div>
                    <span className="text-sm font-medium text-gray-700">Status:</span>
                    <div>
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(showDetailModal.status)}`}>
                        {(showDetailModal.status || 'planning').replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <span className="text-sm font-medium text-gray-700">Timeline:</span>
                    <div className="text-gray-900">
                      <div>Start: {formatDate(showDetailModal.start_date)}</div>
                      <div>End: {formatDate(showDetailModal.end_date)}</div>
                    </div>
                  </div>
                  
                  <div>
                    <span className="text-sm font-medium text-gray-700">Budget:</span>
                    <div className="text-gray-900">
                      {showDetailModal.budget ? `$${parseFloat(showDetailModal.budget).toLocaleString()}` : 'Not specified'}
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3">Description</h4>
                <div className="text-gray-700 bg-gray-50 p-3 rounded-lg">
                  {showDetailModal.description || 'No description provided'}
                </div>
              </div>
            </div>

            <div className="border-t pt-6">
              <h4 className="text-lg font-medium text-gray-900 mb-4">Comments & Discussion</h4>
              <CommentSection
                entityType="project"
                entityId={showDetailModal.id}
                entityTitle={showDetailModal.name}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
