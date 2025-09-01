import React, { useState, useEffect } from 'react'
import { DocumentExportPanel } from '../components'
import { getAllProjects, getAllTasks, getUsers } from '../services/api'
import useAuthStore from '../store/auth'

const dataTypes = [
  { 
    key: 'projects', 
    label: 'Projects', 
    description: 'Export all project data including status, dates, and assignments',
    fetchFunction: getAllProjects
  },
  { 
    key: 'tasks', 
    label: 'Tasks', 
    description: 'Export task details, priorities, and completion status',
    fetchFunction: getAllTasks
  },
  { 
    key: 'users', 
    label: 'Users', 
    description: 'Export user information and roles (Admin only)',
    fetchFunction: getUsers,
    adminOnly: true
  }
]

const ExportsPage = () => {
  const [selectedDataType, setSelectedDataType] = useState('projects')
  const [exportData, setExportData] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const { user } = useAuthStore()
  
  // Filter data types based on user role
  const availableDataTypes = dataTypes.filter(type => 
    !type.adminOnly || user?.role === 'administrator'
  )
  
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        setError('')
        
        const dataType = dataTypes.find(dt => dt.key === selectedDataType)
        if (!dataType) {
          setError('Invalid data type selected')
          return
        }
        
        const response = await dataType.fetchFunction()
        
        // Handle different API response formats
        let data = []
        if (response.data) {
          data = response.data
        } else if (Array.isArray(response)) {
          data = response
        } else if (response[selectedDataType]) {
          data = response[selectedDataType]
        } else {
          console.warn('Unexpected API response format:', response)
          data = []
        }
        
        // Transform data for export
        const transformedData = transformDataForExport(data, selectedDataType)
        setExportData(transformedData)
        
      } catch (err) {
        console.error('Failed to load data:', err)
        setError(err.response?.data?.message || 'Failed to load data for export')
        setExportData([])
      } finally {
        setLoading(false)
      }
    }
    
    loadData()
  }, [selectedDataType])
  
  const loadData = async () => {
    try {
      setLoading(true)
      setError('')
      
      const dataType = dataTypes.find(dt => dt.key === selectedDataType)
      if (!dataType) {
        setError('Invalid data type selected')
        return
      }
      
      const response = await dataType.fetchFunction()
      
      // Handle different API response formats
      let data = []
      if (response.data) {
        data = response.data
      } else if (Array.isArray(response)) {
        data = response
      } else if (response[selectedDataType]) {
        data = response[selectedDataType]
      } else {
        console.warn('Unexpected API response format:', response)
        data = []
      }
      
      // Transform data for export
      const transformedData = transformDataForExport(data, selectedDataType)
      setExportData(transformedData)
      
    } catch (err) {
      console.error('Failed to load data:', err)
      setError(err.response?.data?.message || 'Failed to load data for export')
      setExportData([])
    } finally {
      setLoading(false)
    }
  }
  
  const transformDataForExport = (data, type) => {
    if (!Array.isArray(data)) {
      console.warn('Data is not an array:', data)
      return []
    }
    
    switch (type) {
      case 'projects':
        return data.map(project => ({
          'Project ID': project.id,
          'Project Name': project.name,
          'Description': project.description || '',
          'Status': project.status || 'active',
          'Priority': project.priority || 'medium',
          'Start Date': project.start_date ? new Date(project.start_date).toLocaleDateString() : '',
          'Due Date': project.due_date ? new Date(project.due_date).toLocaleDateString() : '',
          'Completion': project.completion_percentage ? `${project.completion_percentage}%` : '0%',
          'Budget': project.budget || '',
          'Client': project.client_name || '',
          'Created Date': project.created_at ? new Date(project.created_at).toLocaleDateString() : '',
          'Updated Date': project.updated_at ? new Date(project.updated_at).toLocaleDateString() : ''
        }))
        
      case 'tasks':
        return data.map(task => ({
          'Task ID': task.id,
          'Task Name': task.name,
          'Description': task.description || '',
          'Status': task.status || 'new',
          'Priority': task.priority || 'medium',
          'Project': task.project_name || '',
          'Assigned To': task.assigned_user_name || '',
          'Due Date': task.due_date ? new Date(task.due_date).toLocaleDateString() : '',
          'Estimated Hours': task.estimated_hours || '',
          'Actual Hours': task.actual_hours || '',
          'Created Date': task.created_at ? new Date(task.created_at).toLocaleDateString() : '',
          'Updated Date': task.updated_at ? new Date(task.updated_at).toLocaleDateString() : ''
        }))
        
      case 'users':
        return data.map(user => ({
          'User ID': user.id,
          'Name': user.name,
          'Email': user.email,
          'Role': user.role,
          'Department': user.department || '',
          'Phone': user.phone || '',
          'Status': user.status || 'active',
          'Last Login': user.last_login ? new Date(user.last_login).toLocaleDateString() : '',
          'Email Verified': user.email_verified ? 'Yes' : 'No',
          'Created Date': user.created_at ? new Date(user.created_at).toLocaleDateString() : ''
        }))
        
      default:
        return data
    }
  }
  
  const getDataTypeInfo = () => {
    const dataType = availableDataTypes.find(dt => dt.key === selectedDataType)
    return dataType || availableDataTypes[0]
  }
  
  const dataTypeInfo = getDataTypeInfo()
  
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Document Exports</h1>
          <p className="text-gray-600 mt-2">
            Export your data in various formats and store them securely in cloud storage
          </p>
        </div>
        
        {/* Data Type Selection */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Select Data to Export</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {availableDataTypes.map((dataType) => (
              <div
                key={dataType.key}
                className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
                  selectedDataType === dataType.key
                    ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                }`}
                onClick={() => setSelectedDataType(dataType.key)}
              >
                <h3 className="font-medium text-gray-900 mb-2">{dataType.label}</h3>
                <p className="text-sm text-gray-600">{dataType.description}</p>
                {dataType.adminOnly && (
                  <span className="inline-block mt-2 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
                    Admin Only
                  </span>
                )}
              </div>
            ))}
          </div>
          
          {/* Load Data Button */}
          <button
            onClick={loadData}
            disabled={loading}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Loading {dataTypeInfo.label}...
              </>
            ) : (
              <>
                🔄 Refresh {dataTypeInfo.label} Data
              </>
            )}
          </button>
        </div>
        
        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <h3 className="text-red-800 font-medium">Error Loading Data</h3>
            <p className="text-red-600 text-sm mt-1">{error}</p>
          </div>
        )}
        
        {/* Data Preview */}
        {exportData.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Data Preview - {dataTypeInfo.label}
            </h3>
            <div className="bg-gray-50 rounded-md p-4">
              <p className="text-sm text-gray-600 mb-3">
                <span className="font-medium">{exportData.length}</span> records ready for export
              </p>
              
              {/* Sample Data Table */}
              {exportData.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-xs">
                    <thead>
                      <tr className="border-b border-gray-200">
                        {Object.keys(exportData[0]).slice(0, 5).map((key) => (
                          <th key={key} className="text-left py-2 px-3 font-medium text-gray-700">
                            {key}
                          </th>
                        ))}
                        {Object.keys(exportData[0]).length > 5 && (
                          <th className="text-left py-2 px-3 font-medium text-gray-700">
                            ... +{Object.keys(exportData[0]).length - 5} more columns
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {exportData.slice(0, 3).map((row, index) => (
                        <tr key={index} className="border-b border-gray-100">
                          {Object.values(row).slice(0, 5).map((value, cellIndex) => (
                            <td key={cellIndex} className="py-2 px-3 text-gray-600">
                              {String(value).length > 30 
                                ? `${String(value).substring(0, 30)}...` 
                                : String(value)
                              }
                            </td>
                          ))}
                          {Object.values(row).length > 5 && (
                            <td className="py-2 px-3 text-gray-400">...</td>
                          )}
                        </tr>
                      ))}
                      {exportData.length > 3 && (
                        <tr>
                          <td colSpan="6" className="py-2 px-3 text-center text-gray-500 italic">
                            ... and {exportData.length - 3} more rows
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Export Panel */}
        <DocumentExportPanel
          data={exportData}
          title={`${dataTypeInfo.label} Export`}
          entityType={selectedDataType}
        />
      </div>
    </div>
  )
}

export default ExportsPage
