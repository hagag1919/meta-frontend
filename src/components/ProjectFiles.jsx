import { useState, useEffect, useCallback } from 'react'
import { uploadFiles, getFilesByEntity, deleteFile } from '../services/api'

export default function ProjectFiles({ project, onClose }) {
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [selectedFiles, setSelectedFiles] = useState([])

  const loadFiles = useCallback(async () => {
    try {
      setLoading(true)
      const data = await getFilesByEntity('project', project.id)
      setFiles(data.files || [])
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load files')
    } finally {
      setLoading(false)
    }
  }, [project.id])

  useEffect(() => {
    loadFiles()
  }, [loadFiles])

  const handleFileSelect = (event) => {
    const newFiles = Array.from(event.target.files)
    setSelectedFiles(prev => [...prev, ...newFiles])
  }

  const removeSelectedFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      setError('Please select files to upload')
      return
    }

    try {
      setUploading(true)
      setError('')
      
      await uploadFiles(selectedFiles, 'project', project.id, false)
      
      setSelectedFiles([])
      loadFiles()
      
      // Reset file input
      const fileInput = document.getElementById('file-input')
      if (fileInput) fileInput.value = ''
      
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to upload files')
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteFile = async (file) => {
    if (window.confirm(`Are you sure you want to delete "${file.original_filename}"?`)) {
      try {
        await deleteFile(file.id)
        loadFiles()
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to delete file')
      }
    }
  }

  const handleDownload = (file) => {
    // Create download link
    const link = document.createElement('a')
    link.href = `/api/files/download/${file.id}`
    link.download = file.original_filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (mimeType) => {
    if (mimeType.startsWith('image/')) return '🖼️'
    if (mimeType.includes('pdf')) return '📄'
    if (mimeType.includes('word')) return '📝'
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊'
    if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return '📈'
    if (mimeType.includes('zip') || mimeType.includes('rar')) return '🗜️'
    if (mimeType.startsWith('video/')) return '🎥'
    if (mimeType.startsWith('audio/')) return '🎵'
    return '📁'
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-text_primary">
              Project Files - {project.name}
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

          {/* File Upload Section */}
          <div className="mb-6 p-4 border-2 border-dashed border-gray-300 rounded-lg">
            <h3 className="text-lg font-medium mb-4 text-text_primary">Upload Files</h3>
            
            <div className="space-y-4">
              <div>
                <input
                  id="file-input"
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                  accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip,.rar,.mp4,.mpeg,.mov"
                />
                <label
                  htmlFor="file-input"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                  </svg>
                  Choose Files
                </label>
                <span className="ml-3 text-sm text-gray-500">
                  Max 5 files, 10MB each. Supports images, documents, videos, and archives.
                </span>
              </div>

              {/* Selected Files Preview */}
              {selectedFiles.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Selected Files:</h4>
                  <div className="space-y-2">
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">{getFileIcon(file.type)}</span>
                          <span className="text-sm text-gray-700">{file.name}</span>
                          <span className="text-xs text-gray-500">({formatFileSize(file.size)})</span>
                        </div>
                        <button
                          onClick={() => removeSelectedFile(index)}
                          className="text-red-500 hover:text-red-700 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Upload Button */}
              {selectedFiles.length > 0 && (
                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? 'Uploading...' : `Upload ${selectedFiles.length} File${selectedFiles.length > 1 ? 's' : ''}`}
                </button>
              )}
            </div>
          </div>

          {/* Existing Files List */}
          <div>
            <h3 className="text-lg font-medium mb-4 text-text_primary">
              Project Files ({files.length})
            </h3>

            {loading ? (
              <div className="text-center py-8">
                <div className="text-gray-600">Loading files...</div>
              </div>
            ) : files.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-600">No files uploaded yet</div>
                <p className="text-sm text-gray-500 mt-2">Upload your first project file using the form above</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {files.map((file) => (
                  <div
                    key={file.id}
                    className="border border-border rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl">{getFileIcon(file.mime_type)}</span>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-sm font-medium text-text_primary truncate">
                            {file.original_filename}
                          </h4>
                          <p className="text-xs text-gray-500">
                            {formatFileSize(file.file_size)}
                          </p>
                        </div>
                      </div>
                      <div className="flex space-x-1">
                        <button
                          onClick={() => handleDownload(file)}
                          className="text-blue-600 hover:text-blue-800 text-xs"
                          title="Download"
                        >
                          ⬇️
                        </button>
                        <button
                          onClick={() => handleDeleteFile(file)}
                          className="text-red-600 hover:text-red-800 text-xs"
                          title="Delete"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                    
                    <div className="text-xs text-gray-500 space-y-1">
                      <div>Uploaded: {new Date(file.created_at).toLocaleDateString()}</div>
                      {file.uploaded_by_name && (
                        <div>By: {file.uploaded_by_name}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
