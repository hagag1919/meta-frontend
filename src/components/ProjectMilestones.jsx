import { useState, useEffect, useCallback } from 'react'
import { listMilestones, createMilestone, updateMilestone, deleteMilestone } from '../services/api'

export default function ProjectMilestones({ project, onClose }) {
  const [milestones, setMilestones] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingMilestone, setEditingMilestone] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    due_date: '',
    order_index: ''
  })

  const loadMilestones = useCallback(async () => {
    try {
      setLoading(true)
      const data = await listMilestones(project.id)
      setMilestones(data.milestones || [])
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load milestones')
    } finally {
      setLoading(false)
    }
  }, [project.id])

  useEffect(() => {
    loadMilestones()
  }, [loadMilestones])

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setError('')
      
      const payload = {
        name: formData.name,
        description: formData.description,
        due_date: formData.due_date || null,
        order_index: formData.order_index ? parseInt(formData.order_index) : undefined
      }

      if (editingMilestone) {
        await updateMilestone(project.id, editingMilestone.id, payload)
      } else {
        await createMilestone(project.id, payload)
      }

      setShowForm(false)
      setEditingMilestone(null)
      resetForm()
      loadMilestones()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save milestone')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      due_date: '',
      order_index: ''
    })
  }

  const handleEdit = (milestone) => {
    setEditingMilestone(milestone)
    setFormData({
      name: milestone.name || '',
      description: milestone.description || '',
      due_date: milestone.due_date ? milestone.due_date.split('T')[0] : '',
      order_index: milestone.order_index?.toString() || ''
    })
    setShowForm(true)
  }

  const handleToggleComplete = async (milestone) => {
    try {
      await updateMilestone(project.id, milestone.id, {
        is_completed: !milestone.is_completed
      })
      loadMilestones()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update milestone')
    }
  }

  const handleDelete = async (milestone) => {
    if (window.confirm(`Are you sure you want to delete "${milestone.name}"?`)) {
      try {
        await deleteMilestone(project.id, milestone.id)
        loadMilestones()
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to delete milestone')
      }
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'No due date'
    return new Date(dateString).toLocaleDateString()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-text_primary">
              Project Milestones - {project.name}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600">
              {error}
            </div>
          )}

          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-medium text-text_primary">Milestones</h3>
            <button
              onClick={() => {
                setShowForm(true)
                setEditingMilestone(null)
                resetForm()
              }}
              className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90"
            >
              Add Milestone
            </button>
          </div>

          {showForm && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
              <h4 className="text-md font-medium mb-4">
                {editingMilestone ? 'Edit Milestone' : 'Add New Milestone'}
              </h4>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text_secondary mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full border border-border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Milestone name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text_secondary mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full border border-border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-primary"
                    rows="3"
                    placeholder="Milestone description"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-text_secondary mb-1">
                      Due Date
                    </label>
                    <input
                      type="date"
                      value={formData.due_date}
                      onChange={(e) => setFormData({...formData, due_date: e.target.value})}
                      className="w-full border border-border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text_secondary mb-1">
                      Order Index
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.order_index}
                      onChange={(e) => setFormData({...formData, order_index: e.target.value})}
                      className="w-full border border-border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Order (optional)"
                    />
                  </div>
                </div>

                <div className="flex space-x-3">
                  <button
                    type="submit"
                    className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90"
                  >
                    {editingMilestone ? 'Update' : 'Create'} Milestone
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false)
                      setEditingMilestone(null)
                      resetForm()
                    }}
                    className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {loading ? (
            <div className="text-center py-8">
              <div className="text-gray-600">Loading milestones...</div>
            </div>
          ) : milestones.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-600">No milestones yet</div>
              <p className="text-sm text-gray-500 mt-2">Add your first milestone to track project progress</p>
            </div>
          ) : (
            <div className="space-y-4">
              {milestones.map((milestone) => (
                <div
                  key={milestone.id}
                  className={`p-4 border rounded-lg ${
                    milestone.is_completed ? 'bg-green-50 border-green-200' : 'bg-white border-border'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <input
                        type="checkbox"
                        checked={milestone.is_completed}
                        onChange={() => handleToggleComplete(milestone)}
                        className="mt-1 h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                      />
                      <div className="flex-1">
                        <h4 className={`text-lg font-medium ${
                          milestone.is_completed ? 'text-green-800 line-through' : 'text-text_primary'
                        }`}>
                          {milestone.name}
                        </h4>
                        {milestone.description && (
                          <p className="text-text_secondary mt-1">{milestone.description}</p>
                        )}
                        <div className="flex items-center space-x-4 mt-2 text-sm text-text_secondary">
                          <span>Due: {formatDate(milestone.due_date)}</span>
                          {milestone.order_index !== null && (
                            <span>Order: {milestone.order_index}</span>
                          )}
                          {milestone.is_completed && milestone.completed_at && (
                            <span className="text-green-600">
                              Completed: {new Date(milestone.completed_at).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex space-x-2 ml-4">
                      <button
                        onClick={() => handleEdit(milestone)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(milestone)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
