import React, { useState, useEffect } from 'react'
import { DocumentArrowDownIcon, DocumentIcon, TrashIcon, EyeIcon } from '@heroicons/react/24/outline'
import DocumentExportService from '../services/documentExport'
import { supabase } from '../config/supabase'
import useAuthStore from '../store/auth'

const DocumentExportPanel = ({ data = [], title = 'Data Export', entityType = 'data' }) => {
  const [isExporting, setIsExporting] = useState(false)
  const [exportHistory, setExportHistory] = useState([])
  const [selectedFormat, setSelectedFormat] = useState('excel')
  const [exportOptions, setExportOptions] = useState({
    filename: '',
    includeTimestamp: true,
    isPublic: false
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  
  const { user } = useAuthStore()
  
  // Load export history on component mount
  useEffect(() => {
    loadExportHistory()
  }, [])
  
  // Generate default filename
  useEffect(() => {
    if (!exportOptions.filename) {
      const timestamp = exportOptions.includeTimestamp 
        ? `_${new Date().toISOString().split('T')[0]}`
        : ''
      setExportOptions(prev => ({
        ...prev,
        filename: `${entityType}_export${timestamp}`
      }))
    }
  }, [entityType, exportOptions.includeTimestamp, exportOptions.filename])
  
  const loadExportHistory = async () => {
    try {
      setLoading(true)
      const exports = await DocumentExportService.listUserExports()
      setExportHistory(exports)
    } catch (err) {
      console.error('Failed to load export history:', err)
      setError('Failed to load export history')
    } finally {
      setLoading(false)
    }
  }
  
  const handleExport = async () => {
    if (!data || data.length === 0) {
      setError('No data to export')
      return
    }
    
    try {
      setIsExporting(true)
      setError(null)
      
      const filename = exportOptions.filename || `${entityType}_export`
      const options = {
        userId: user?.id,
        isPublic: exportOptions.isPublic,
        metadata: {
          entityType,
          exportFormat: selectedFormat,
          exportedFrom: window.location.pathname
        }
      }
      
      let result
      
      switch (selectedFormat) {
        case 'excel':
          result = await DocumentExportService.exportToExcel(data, filename, {
            ...options,
            sheetName: title
          })
          break
        case 'pdf':
          result = await DocumentExportService.exportToPDF(data, filename, {
            ...options,
            title: title
          })
          break
        case 'csv':
          result = await DocumentExportService.exportToCSV(data, filename, options)
          break
        default:
          throw new Error('Unsupported export format')
      }
      
      if (result.success) {
        // Trigger download
        const link = document.createElement('a')
        link.href = result.downloadUrl
        link.download = result.filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        // Reload export history
        await loadExportHistory()
        
        // Reset form
        setExportOptions(prev => ({
          ...prev,
          filename: ''
        }))
      }
      
    } catch (err) {
      console.error('Export failed:', err)
      setError(err.message || 'Export failed')
    } finally {
      setIsExporting(false)
    }
  }
  
  const handleDeleteExport = async (filePath) => {
    try {
      await DocumentExportService.deleteExport(filePath)
      await loadExportHistory()
    } catch (err) {
      console.error('Failed to delete export:', err)
      setError('Failed to delete export')
    }
  }
  
  const getFileIcon = (filename) => {
    if (filename.endsWith('.xlsx')) return '📊'
    if (filename.endsWith('.pdf')) return '📄'
    if (filename.endsWith('.csv')) return '📝'
    return '📄'
  }
  
  const formatFileSize = (bytes) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    if (bytes === 0) return '0 Bytes'
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }
  
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center gap-3 mb-6">
        <DocumentArrowDownIcon className="h-6 w-6 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">Export Documents</h3>
      </div>
      
      {/* Export Form */}
      <div className="mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Format Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Export Format
            </label>
            <select
              value={selectedFormat}
              onChange={(e) => setSelectedFormat(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="excel">Excel (.xlsx)</option>
              <option value="pdf">PDF (.pdf)</option>
              <option value="csv">CSV (.csv)</option>
            </select>
          </div>
          
          {/* Filename */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filename
            </label>
            <input
              type="text"
              value={exportOptions.filename}
              onChange={(e) => setExportOptions(prev => ({ ...prev, filename: e.target.value }))}
              placeholder={`${entityType}_export`}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        
        {/* Options */}
        <div className="flex flex-wrap gap-4 mb-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={exportOptions.includeTimestamp}
              onChange={(e) => setExportOptions(prev => ({ ...prev, includeTimestamp: e.target.checked }))}
              className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Include timestamp</span>
          </label>
          
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={exportOptions.isPublic}
              onChange={(e) => setExportOptions(prev => ({ ...prev, isPublic: e.target.checked }))}
              className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Public access</span>
          </label>
        </div>
        
        {/* Export Stats */}
        <div className="bg-gray-50 rounded-md p-3 mb-4">
          <p className="text-sm text-gray-600">
            Ready to export <span className="font-semibold">{data.length}</span> records
            {selectedFormat === 'excel' && ' with auto-sized columns'}
            {selectedFormat === 'pdf' && ' in tabular format'}
            {selectedFormat === 'csv' && ' with proper escaping'}
          </p>
        </div>
        
        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
        
        {/* Export Button */}
        <button
          onClick={handleExport}
          disabled={isExporting || !data.length}
          className="w-full md:w-auto px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isExporting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Exporting...
            </>
          ) : (
            <>
              <DocumentArrowDownIcon className="h-4 w-4" />
              Export {selectedFormat.toUpperCase()}
            </>
          )}
        </button>
      </div>
      
      {/* Export History */}
      <div className="border-t pt-6">
        <h4 className="text-md font-medium text-gray-900 mb-4">Export History</h4>
        
        {loading ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-sm text-gray-500 mt-2">Loading exports...</p>
          </div>
        ) : exportHistory.length === 0 ? (
          <div className="text-center py-8">
            <DocumentIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500">No exports yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {exportHistory.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getFileIcon(file.name)}</span>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{file.name}</p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(file.metadata?.size || 0)} • 
                      {new Date(file.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      // Create download link
                      const link = document.createElement('a')
                      link.href = supabase.storage.from('meta-storage').getPublicUrl(file.name).data.publicUrl
                      link.download = file.name
                      document.body.appendChild(link)
                      link.click()
                      document.body.removeChild(link)
                    }}
                    className="p-1 text-blue-600 hover:text-blue-800"
                    title="Download"
                  >
                    <EyeIcon className="h-4 w-4" />
                  </button>
                  
                  <button
                    onClick={() => handleDeleteExport(file.name)}
                    className="p-1 text-red-600 hover:text-red-800"
                    title="Delete"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default DocumentExportPanel
