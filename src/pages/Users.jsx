import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { listUsers, updateUser, deleteUser, listCompanies } from '../services/api'
import { PermissionGuard, usePermissions } from '../utils/permissions.jsx'

export default function Users(){
  const [items, setItems] = useState([])
  const [companies, setCompanies] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [showEditModal, setShowEditModal] = useState(null)
  const [filters, setFilters] = useState({
    role: '',
    company: '',
    status: ''
  })
  const { userRole } = usePermissions()
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    role: '',
    company_id: '',
    status: 'active',
    phone: ''
  })

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true)
      const data = await listUsers(filters)
      setItems(Array.isArray(data?.users) ? data.users : Array.isArray(data) ? data : [])
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }, [filters])

  const loadCompanies = useCallback(async () => {
    try {
      const data = await listCompanies()
      const companiesList = data.companies || (data.company ? [data.company] : [])
      setCompanies(Array.isArray(companiesList) ? companiesList : [])
    } catch (e) {
      console.warn('Failed to load companies:', e)
    }
  }, [])

  useEffect(() => {
    loadUsers()
    loadCompanies()
  }, [loadUsers, loadCompanies])

  const handleEdit = (user) => {
    setShowEditModal(user)
    setEditFormData({
      name: user.name || `${user.first_name || ''} ${user.last_name || ''}`.trim(),
      email: user.email || '',
      role: user.role || '',
      company_id: user.company_id || '',
      status: user.status || 'active',
      phone: user.phone || ''
    })
  }

  const handleUpdateUser = async (e) => {
    e.preventDefault()
    try {
      await updateUser(showEditModal.id || showEditModal._id, editFormData)
      setShowEditModal(null)
      loadUsers()
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to update user')
    }
  }

  const handleDeleteUser = async (user) => {
    if (window.confirm(`Are you sure you want to delete user "${user.name || user.email}"?`)) {
      try {
        await deleteUser(user.id || user._id)
        loadUsers()
      } catch (e) {
        setError(e.response?.data?.message || 'Failed to delete user')
      }
    }
  }

  const getRoleColor = (role) => {
    switch (role?.toLowerCase()) {
      case 'administrator':
        return 'bg-purple-100 text-purple-800'
      case 'developer':
        return 'bg-blue-100 text-blue-800'
      case 'client':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'inactive':
        return 'bg-red-100 text-red-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getCompanyName = (companyId) => {
    const company = companies.find(c => c.id === companyId)
    return company?.name || '-'
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString()
  }

  const getPageTitle = () => {
    switch (userRole) {
      case 'administrator':
        return 'User Management'
      case 'client':
        return 'Team Members'
      default:
        return 'Users'
    }
  }

  const getPageSubtitle = () => {
    switch (userRole) {
      case 'administrator':
        return 'Manage system users and their permissions'
      case 'client':
        return 'View your team members and their roles'
      default:
        return 'View user information'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading users...</div>
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
        {userRole === 'administrator' && (
          <Link 
            to="/admin-register" 
            className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
          >
            Create Admin Account
          </Link>
        )}
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select
              value={filters.role}
              onChange={(e) => setFilters({ ...filters, role: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">All Roles</option>
              <option value="administrator">Administrator</option>
              <option value="developer">Developer</option>
              <option value="client">Client</option>
            </select>
          </div>
          {userRole === 'administrator' && (
            <>
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Edit User Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">Edit User</h2>
            <form onSubmit={handleUpdateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  value={editFormData.phone}
                  onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role *
                  </label>
                  <select
                    value={editFormData.role}
                    onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  >
                    <option value="">Select Role</option>
                    <option value="administrator">Administrator</option>
                    <option value="developer">Developer</option>
                    <option value="client">Client</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={editFormData.status}
                    onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>
              </div>
              {(editFormData.role === 'client' || userRole === 'administrator') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company
                  </label>
                  <select
                    value={editFormData.company_id}
                    onChange={(e) => setEditFormData({ ...editFormData, company_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">No Company</option>
                    {companies.map((company) => (
                      <option key={company.id} value={company.id}>
                        {company.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-primary text-white py-2 rounded-lg hover:bg-primary/90 transition"
                >
                  Update User
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditModal(null)}
                  className="flex-1 bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-border shadow-soft overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-border">
            <tr>
              <th className="text-left py-3 px-4 font-medium text-gray-700">User</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">Contact</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">Role</th>
              {userRole === 'administrator' && (
                <th className="text-left py-3 px-4 font-medium text-gray-700">Company</th>
              )}
              <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">Joined</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={userRole === 'administrator' ? '7' : '6'} className="text-center py-8 text-gray-500">
                  No users found.
                </td>
              </tr>
            ) : (
              items.map((user) => (
                <tr key={user.id || user._id} className="border-b border-border hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="font-medium text-gray-900">
                      {user.name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Unknown'}
                    </div>
                    <div className="text-sm text-gray-600">ID: {user.id || user._id}</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-gray-900">{user.email}</div>
                    {user.phone && (
                      <div className="text-sm text-gray-600">{user.phone}</div>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                      {user.role || 'unknown'}
                    </span>
                  </td>
                  {userRole === 'administrator' && (
                    <td className="py-3 px-4 text-gray-600">
                      {getCompanyName(user.company_id)}
                    </td>
                  )}
                  <td className="py-3 px-4">
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(user.status)}`}>
                      {user.status || 'active'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-600">
                    {formatDate(user.created_at || user.createdAt)}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      <PermissionGuard action="edit" resource="users">
                        <button
                          onClick={() => handleEdit(user)}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          Edit
                        </button>
                      </PermissionGuard>
                      <PermissionGuard action="delete" resource="users">
                        <button
                          onClick={() => handleDeleteUser(user)}
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
