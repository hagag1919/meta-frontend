import { useEffect, useState, useCallback } from 'react'
import { 
  getTimeReport, 
  getProjectReport, 
  getUserPerformanceReport, 
  getFinancialReport,
  listUsers,
  listProjects
} from '../services/api'
import { usePermissions } from '../utils/permissions.jsx'

export default function Reports() {
  const [activeTab, setActiveTab] = useState('time')
  const [timeReport, setTimeReport] = useState(null)
  const [projectReport, setProjectReport] = useState(null)
  const [userReport, setUserReport] = useState(null)
  const [financialReport, setFinancialReport] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    userId: '',
    projectId: '',
    status: ''
  })
  const [users, setUsers] = useState([])
  const [projects, setProjects] = useState([])
  const { userRole } = usePermissions()

  useEffect(() => {
    loadUsers()
    loadProjects()
  }, [])

  useEffect(() => {
    loadReport()
  }, [activeTab, filters])

  const loadUsers = async () => {
    try {
      const data = await listUsers()
      setUsers(Array.isArray(data?.users) ? data.users : [])
    } catch (err) {
      console.warn('Failed to load users:', err)
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

  const loadReport = useCallback(async () => {
    try {
      setLoading(true)
      setError('')

      switch (activeTab) {
        case 'time': {
          const timeData = await getTimeReport(filters)
          setTimeReport(timeData)
          break
        }
        case 'projects': {
          const projectData = await getProjectReport(filters)
          setProjectReport(projectData)
          break
        }
        case 'users': {
          if (filters.userId) {
            const userData = await getUserPerformanceReport(filters.userId, filters)
            setUserReport(userData)
          }
          break
        }
        case 'financial': {
          const financialData = await getFinancialReport(filters)
          setFinancialReport(financialData)
          break
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load report')
    } finally {
      setLoading(false)
    }
  }, [activeTab, filters])

  const handleExport = async () => {
    // Temporarily disabled - export endpoint not implemented in backend
    setError('Export functionality is currently not available. Please contact your administrator.')
    return
    
    /* 
    try {
      const payload = {
        type: activeTab,
        format,
        ...filters
      }
      const blob = await exportReport(payload)
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${activeTab}-report.${format}`
      link.click()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to export report')
    }
    */
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0)
  }

  const formatHours = (seconds) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${hours}h ${minutes}m`
  }

  const tabs = [
    { id: 'time', label: 'Time Report', icon: '⏰' },
    { id: 'projects', label: 'Project Report', icon: '📁' },
    { id: 'users', label: 'User Performance', icon: '👤' },
    { id: 'financial', label: 'Financial Report', icon: '💰' }
  ]

  // Filter tabs based on user role
  const filteredTabs = userRole === 'client' 
    ? tabs.filter(tab => ['projects', 'financial'].includes(tab.id))
    : tabs

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-3xl font-semibold text-text_primary">Reports</h1>
        <p className="text-text_secondary">Generate and export various business reports</p>
      </header>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
          {error}
        </div>
      )}

      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {filteredTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-border p-4 mb-6">
        <h3 className="text-lg font-medium mb-4">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          {activeTab === 'users' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                User
              </label>
              <select
                value={filters.userId}
                onChange={(e) => setFilters({ ...filters, userId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Select User</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name || `${user.first_name} ${user.last_name}` || user.email}
                  </option>
                ))}
              </select>
            </div>
          )}
          {activeTab === 'projects' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Project
              </label>
              <select
                value={filters.projectId}
                onChange={(e) => setFilters({ ...filters, projectId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">All Projects</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="flex items-end gap-2">
            <button
              onClick={() => handleExport()}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
            >
              Export PDF
            </button>
            <button
              onClick={() => handleExport()}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
            >
              Export Excel
            </button>
          </div>
        </div>
      </div>

      {/* Report Content */}
      <div className="bg-white rounded-lg border border-border p-6">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-gray-600">Loading report...</div>
          </div>
        ) : (
          <>
            {/* Time Report */}
            {activeTab === 'time' && timeReport && (
              <div>
                <h3 className="text-lg font-medium mb-4">Time Tracking Report</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {formatHours(timeReport.totalTime || 0)}
                    </div>
                    <div className="text-sm text-gray-600">Total Time</div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {timeReport.totalEntries || 0}
                    </div>
                    <div className="text-sm text-gray-600">Time Entries</div>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {formatHours((timeReport.totalTime || 0) / (timeReport.totalEntries || 1))}
                    </div>
                    <div className="text-sm text-gray-600">Average Entry</div>
                  </div>
                </div>
                {timeReport.entries && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left py-2 px-3">Date</th>
                          <th className="text-left py-2 px-3">User</th>
                          <th className="text-left py-2 px-3">Project</th>
                          <th className="text-left py-2 px-3">Task</th>
                          <th className="text-left py-2 px-3">Duration</th>
                        </tr>
                      </thead>
                      <tbody>
                        {timeReport.entries.map((entry, index) => (
                          <tr key={index} className="border-t">
                            <td className="py-2 px-3">{new Date(entry.date).toLocaleDateString()}</td>
                            <td className="py-2 px-3">{entry.userName}</td>
                            <td className="py-2 px-3">{entry.projectName}</td>
                            <td className="py-2 px-3">{entry.taskName}</td>
                            <td className="py-2 px-3">{formatHours(entry.duration)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Project Report */}
            {activeTab === 'projects' && projectReport && (
              <div>
                <h3 className="text-lg font-medium mb-4">Project Report</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {projectReport.totalProjects || 0}
                    </div>
                    <div className="text-sm text-gray-600">Total Projects</div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {projectReport.activeProjects || 0}
                    </div>
                    <div className="text-sm text-gray-600">Active Projects</div>
                  </div>
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">
                      {projectReport.completedProjects || 0}
                    </div>
                    <div className="text-sm text-gray-600">Completed</div>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {Math.round(projectReport.averageProgress || 0)}%
                    </div>
                    <div className="text-sm text-gray-600">Avg Progress</div>
                  </div>
                </div>
                {projectReport.projects && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left py-2 px-3">Project</th>
                          <th className="text-left py-2 px-3">Client</th>
                          <th className="text-left py-2 px-3">Status</th>
                          <th className="text-left py-2 px-3">Progress</th>
                          <th className="text-left py-2 px-3">Budget</th>
                        </tr>
                      </thead>
                      <tbody>
                        {projectReport.projects.map((project, index) => (
                          <tr key={index} className="border-t">
                            <td className="py-2 px-3 font-medium">{project.name}</td>
                            <td className="py-2 px-3">{project.clientName}</td>
                            <td className="py-2 px-3">
                              <span className={`inline-flex px-2 py-1 rounded-full text-xs ${
                                project.status === 'completed' ? 'bg-green-100 text-green-800' :
                                project.status === 'active' ? 'bg-blue-100 text-blue-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {project.status}
                              </span>
                            </td>
                            <td className="py-2 px-3">{Math.round(project.progress || 0)}%</td>
                            <td className="py-2 px-3">{formatCurrency(project.budget)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* User Performance Report */}
            {activeTab === 'users' && userReport && (
              <div>
                <h3 className="text-lg font-medium mb-4">User Performance Report</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {userReport.tasksCompleted || 0}
                    </div>
                    <div className="text-sm text-gray-600">Tasks Completed</div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {formatHours(userReport.totalTimeLogged || 0)}
                    </div>
                    <div className="text-sm text-gray-600">Time Logged</div>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {Math.round(userReport.averageTaskTime || 0)}h
                    </div>
                    <div className="text-sm text-gray-600">Avg Task Time</div>
                  </div>
                </div>
              </div>
            )}

            {/* Financial Report */}
            {activeTab === 'financial' && financialReport && (
              <div>
                <h3 className="text-lg font-medium mb-4">Financial Report</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(financialReport.totalRevenue || 0)}
                    </div>
                    <div className="text-sm text-gray-600">Total Revenue</div>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {formatCurrency(financialReport.paidInvoices || 0)}
                    </div>
                    <div className="text-sm text-gray-600">Paid Invoices</div>
                  </div>
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">
                      {formatCurrency(financialReport.pendingInvoices || 0)}
                    </div>
                    <div className="text-sm text-gray-600">Pending</div>
                  </div>
                  <div className="bg-red-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">
                      {formatCurrency(financialReport.overdueInvoices || 0)}
                    </div>
                    <div className="text-sm text-gray-600">Overdue</div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
