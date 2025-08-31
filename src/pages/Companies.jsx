import { useEffect, useState, useCallback } from 'react'
import { createCompany, listCompanies, getCurrentUser, updateCompany, deleteCompany } from '../services/api'
import { PermissionGuard, usePermissions } from '../utils/permissions.jsx'

export default function Companies() {
  const [companies, setCompanies] = useState([])
  const [currentUser, setCurrentUser] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [editingCompany, setEditingCompany] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    status: '',
    search: ''
  })
  const { userRole } = usePermissions()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    website: '',
    contact_person: '',
    notes: '',
    is_active: true
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const loadCompanies = useCallback(async () => {
    try {
      setLoading(true)
      const data = await listCompanies(filters)
      const companiesList = data.companies || (data.company ? [data.company] : [])
      setCompanies(Array.isArray(companiesList) ? companiesList : [])
    } catch (e) {
      console.error('Failed to load companies:', e)
      setError(e.response?.data?.message || 'Failed to load companies')
    } finally {
      setLoading(false)
    }
  }, [filters])

  const loadUser = useCallback(async () => {
    try {
      const { user } = await getCurrentUser()
      setCurrentUser(user)
    } catch (e) {
      console.error('Failed to load user:', e)
    }
  }, [])

  useEffect(() => {
    loadUser()
    loadCompanies()
  }, [loadUser, loadCompanies])

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setError('')
      setSuccess('')
      
      // Only send non-empty fields
      const payload = {}
      Object.keys(formData).forEach(key => {
        if (key === 'is_active') {
          payload[key] = formData[key]
        } else if (formData[key] && formData[key].toString().trim()) {
          payload[key] = formData[key].toString().trim()
        }
      })

      if (editingCompany) {
        await updateCompany(editingCompany.id, payload)
        setSuccess('Company updated successfully!')
      } else {
        await createCompany(payload)
        setSuccess('Company created successfully!')
      }
      
      resetForm()
      await loadCompanies()
    } catch (e) {
      setError(e.response?.data?.message || e.response?.data?.error || 'Failed to save company')
    }
  }

  const handleEdit = (company) => {
    setEditingCompany(company)
    setFormData({
      name: company.name || '',
      email: company.email || '',
      phone: company.phone || '',
      address: company.address || '',
      website: company.website || '',
      contact_person: company.contact_person || '',
      notes: company.notes || '',
      is_active: company.is_active !== false
    })
    setShowForm(true)
  }

  const handleDelete = async (company) => {
    if (window.confirm(`Are you sure you want to delete "${company.name}"?`)) {
      try {
        await deleteCompany(company.id)
        setSuccess('Company deleted successfully!')
        await loadCompanies()
      } catch (e) {
        setError(e.response?.data?.message || 'Failed to delete company')
      }
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: '',
      website: '',
      contact_person: '',
      notes: '',
      is_active: true
    })
    setError('')
    setSuccess('')
    setShowForm(false)
    setEditingCompany(null)
  }

  const getPageTitle = () => {
    switch (userRole) {
      case 'administrator':
        return 'Company Management'
      case 'client':
        return 'My Company'
      default:
        return 'Companies'
    }
  }

  const getPageSubtitle = () => {
    switch (userRole) {
      case 'administrator':
        return 'Manage client companies and their information'
      case 'client':
        return 'View and manage your company information'
      default:
        return 'Company information'
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading companies...</div>
      </div>
    )
  }

  return (
    <div>
      <header className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-semibold text-text_primary">{getPageTitle()}</h1>
          <p className="text-text_secondary">{getPageSubtitle()}</p>
          {currentUser && (
            <p className="text-sm text-text_secondary mt-1">
              Logged in as: {currentUser.first_name} {currentUser.last_name} ({currentUser.role})
            </p>
          )}
        </div>
        <PermissionGuard action="create" resource="companies">
          <button
            onClick={() => setShowForm(true)}
            className="bg-primary text-white rounded-lg px-4 py-2 hover:bg-primary/90 shadow-soft transition"
          >
            Add Company
          </button>
        </PermissionGuard>
      </header>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-600">
          {success}
        </div>
      )}

      {/* Filters */}
      {userRole === 'administrator' && (
        <div className="bg-white rounded-lg border border-border p-4 mb-6 shadow-soft">
          <h3 className="text-lg font-medium mb-4">Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                placeholder="Search by company name or contact person"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Company Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">
              {editingCompany ? 'Edit Company' : 'Create New Company'}
            </h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter company name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Person
                </label>
                <input
                  type="text"
                  name="contact_person"
                  value={formData.contact_person}
                  onChange={handleInputChange}
                  placeholder="Enter contact person name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter email address"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="Enter phone number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Website
                </label>
                <input
                  type="url"
                  name="website"
                  value={formData.website}
                  onChange={handleInputChange}
                  placeholder="https://example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Enter company address"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  placeholder="Additional notes about the company"
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {userRole === 'administrator' && (
                <div className="md:col-span-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="is_active"
                      checked={formData.is_active}
                      onChange={handleInputChange}
                      className="rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <span className="text-sm font-medium text-gray-700">Company is active</span>
                  </label>
                </div>
              )}

              <div className="md:col-span-2 flex gap-3 pt-4">
                <button
                  type="submit"
                  className="bg-primary text-white rounded-lg px-6 py-2 hover:bg-primary/90 transition"
                >
                  {editingCompany ? 'Update Company' : 'Create Company'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="bg-gray-500 text-white rounded-lg px-6 py-2 hover:bg-gray-600 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Companies List */}
      <div className="bg-white rounded-xl border border-border shadow-soft overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-border">
            <tr>
              <th className="text-left py-3 px-4 font-medium text-gray-700">Company</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">Contact Info</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">Projects</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">Created</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {companies.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center py-8 text-gray-500">
                  No companies found.
                </td>
              </tr>
            ) : (
              companies.map(company => (
                <tr key={company.id} className="border-b border-border hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="font-medium text-gray-900">{company.name}</div>
                    {company.contact_person && (
                      <div className="text-sm text-gray-600">Contact: {company.contact_person}</div>
                    )}
                    {company.website && (
                      <div className="text-sm text-blue-600">
                        <a href={company.website} target="_blank" rel="noopener noreferrer" className="hover:underline">
                          {company.website}
                        </a>
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {company.email && (
                      <div className="text-gray-900">{company.email}</div>
                    )}
                    {company.phone && (
                      <div className="text-sm text-gray-600">{company.phone}</div>
                    )}
                    {company.address && (
                      <div className="text-sm text-gray-600">{company.address}</div>
                    )}
                    {!company.email && !company.phone && !company.address && (
                      <div className="text-gray-500">-</div>
                    )}
                  </td>
                  <td className="py-3 px-4 text-gray-600">
                    {company.projects_count || 0} projects
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                      company.is_active !== false
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {company.is_active !== false ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-600">
                    {formatDate(company.created_at)}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      <PermissionGuard action="edit" resource="companies">
                        <button
                          onClick={() => handleEdit(company)}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          Edit
                        </button>
                      </PermissionGuard>
                      <PermissionGuard action="delete" resource="companies">
                        <button
                          onClick={() => handleDelete(company)}
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
