import { useEffect, useState } from 'react'
import { 
  listInvoices, 
  createInvoice, 
  updateInvoice, 
  deleteInvoice, 
  generateInvoicePDF,
  listProjects 
} from '../services/api'
import { PermissionGuard, usePermissions } from '../utils/permissions.jsx'

export default function Invoices() {
  const [invoices, setInvoices] = useState([])
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingInvoice, setEditingInvoice] = useState(null)
  const { userRole } = usePermissions()
  const [formData, setFormData] = useState({
    projectId: '',
    dueDate: '',
    taxAmount: '',
    notes: ''
  })

  useEffect(() => {
    loadInvoices()
    loadProjects()
  }, [])

  const loadProjects = async () => {
    try {
      const data = await listProjects()
      setProjects(Array.isArray(data?.projects) ? data.projects : Array.isArray(data) ? data : [])
    } catch (err) {
      console.warn('Failed to load projects:', err)
    }
  }

  const loadInvoices = async () => {
    try {
      setLoading(true)
      const data = await listInvoices()
      setInvoices(Array.isArray(data?.invoices) ? data.invoices : Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load invoices')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (!formData.projectId) {
        setError('Please select a project')
        return
      }

      const payload = {
        project_id: formData.projectId,
        issue_date: new Date().toISOString().split('T')[0], // Today's date
        due_date: formData.dueDate,
        currency: 'USD',
        tax_rate: parseFloat(formData.taxAmount || 0),
        notes: formData.notes || '',
        include_unbilled_time: true
      }

      if (editingInvoice) {
        await updateInvoice(editingInvoice.id, payload)
      } else {
        await createInvoice(payload)
      }
      
      setShowForm(false)
      setEditingInvoice(null)
      resetForm()
      loadInvoices()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save invoice')
    }
  }

  const resetForm = () => {
    setFormData({
      projectId: '',
      dueDate: '',
      taxAmount: '',
      notes: ''
    })
  }

  const handleEdit = (invoice) => {
    setEditingInvoice(invoice)
    setFormData({
      projectId: invoice.project_id || '',
      dueDate: invoice.due_date ? invoice.due_date.split('T')[0] : '',
      taxAmount: invoice.tax_rate || '',
      notes: invoice.notes || ''
    })
    setShowForm(true)
  }

  const handleDelete = async (invoice) => {
    if (window.confirm(`Are you sure you want to delete invoice ${invoice.invoice_number}?`)) {
      try {
        await deleteInvoice(invoice.id)
        loadInvoices()
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to delete invoice')
      }
    }
  }

  const handleDownloadPDF = async (invoice) => {
    try {
      const blob = await generateInvoicePDF(invoice.id)
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `invoice-${invoice.invoice_number}.pdf`
      link.click()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate PDF')
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-blue-100 text-blue-800'
      case 'overdue':
        return 'bg-red-100 text-red-800'
      case 'draft':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0)
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading invoices...</div>
      </div>
    )
  }

  return (
    <div>
      <header className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-semibold text-text_primary">
            {userRole === 'client' ? 'My Invoices' : 'Invoice Management'}
          </h1>
          <p className="text-text_secondary">
            {userRole === 'client' 
              ? 'View and download your invoices' 
              : 'Manage invoices and billing'
            }
          </p>
        </div>
        <PermissionGuard action="create" resource="invoices">
          <button
            onClick={() => setShowForm(true)}
            className="bg-primary text-white px-4 py-2 rounded-lg shadow-soft hover:bg-primary/90 transition"
          >
            Create Invoice
          </button>
        </PermissionGuard>
      </header>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
          {error}
        </div>
      )}

      {/* Invoice Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">
              {editingInvoice ? 'Edit Invoice' : 'Create New Invoice'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Project *
                </label>
                <select
                  value={formData.projectId}
                  onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                >
                  <option value="">Select Project</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Due Date *
                  </label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tax Rate (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.taxAmount}
                    onChange={(e) => setFormData({ ...formData, taxAmount: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  rows={3}
                  placeholder="Additional notes for the invoice"
                />
              </div>
              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-primary text-white py-2 rounded-lg hover:bg-primary/90 transition"
                >
                  {editingInvoice ? 'Update' : 'Create'} Invoice
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false)
                    setEditingInvoice(null)
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

      {/* Invoices Table */}
      <div className="bg-white rounded-xl border border-border shadow-soft overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-border">
            <tr>
              <th className="text-left py-3 px-4 font-medium text-gray-700">Invoice #</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">Project</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">Amount</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">Due Date</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {invoices.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center py-8 text-gray-500">
                  No invoices found. Create your first invoice to get started.
                </td>
              </tr>
            ) : (
              invoices.map((invoice) => (
                <tr key={invoice.id} className="border-b border-border hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="font-medium text-gray-900">{invoice.invoice_number}</div>
                  </td>
                  <td className="py-3 px-4 text-gray-600">
                    {invoice.project_name || 'Unknown Project'}
                  </td>
                  <td className="py-3 px-4 text-gray-600">
                    {formatCurrency(invoice.total_amount)}
                  </td>
                  <td className="py-3 px-4 text-gray-600">
                    {formatDate(invoice.due_date)}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                      {invoice.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDownloadPDF(invoice)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        PDF
                      </button>
                      <PermissionGuard action="edit" resource="invoices">
                        <button
                          onClick={() => handleEdit(invoice)}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          Edit
                        </button>
                      </PermissionGuard>
                      <PermissionGuard action="delete" resource="invoices">
                        <button
                          onClick={() => handleDelete(invoice)}
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
