import { useState, useEffect, useCallback } from 'react'
import { getCommentsByEntity, createComment, updateComment, deleteComment } from '../services/api'
import { usePermissions } from '../utils/permissions'

export default function CommentSection({ entityType, entityId, entityTitle }) {
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [isInternal, setIsInternal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [editingComment, setEditingComment] = useState(null)
  const [editContent, setEditContent] = useState('')
  const { userRole } = usePermissions()

  const loadComments = useCallback(async () => {
    try {
      setLoading(true)
      const data = await getCommentsByEntity(entityType, entityId)
      setComments(data.comments || [])
    } catch (err) {
      setError('Failed to load comments')
      console.error('Failed to load comments:', err)
    } finally {
      setLoading(false)
    }
  }, [entityType, entityId])

  useEffect(() => {
    if (entityType && entityId) {
      loadComments()
    }
  }, [entityType, entityId, loadComments])

  const handleSubmitComment = async (e) => {
    e.preventDefault()
    if (!newComment.trim()) return

    try {
      const payload = {
        content: newComment.trim(),
        is_internal: isInternal
      }
      
      if (entityType === 'project') {
        payload.project_id = entityId
      } else if (entityType === 'task') {
        payload.task_id = entityId
      }

      const result = await createComment(payload)
      
      setComments(prev => [...prev, {
        ...result.comment,
        author_name: result.comment.author_name || 'You'
      }])
      
      setNewComment('')
      setIsInternal(false)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create comment')
    }
  }

  const handleEditComment = async (commentId) => {
    if (!editContent.trim()) return

    try {
      await updateComment(commentId, { content: editContent.trim() })
      
      setComments(prev => prev.map(comment => 
        comment.id === commentId 
          ? { ...comment, content: editContent.trim(), updated_at: new Date().toISOString() }
          : comment
      ))
      
      setEditingComment(null)
      setEditContent('')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update comment')
    }
  }

  const handleDeleteComment = async (commentId) => {
    if (!confirm('Are you sure you want to delete this comment?')) return

    try {
      await deleteComment(commentId)
      setComments(prev => prev.filter(comment => comment.id !== commentId))
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete comment')
    }
  }

  const startEditing = (comment) => {
    setEditingComment(comment.id)
    setEditContent(comment.content)
  }

  const cancelEditing = () => {
    setEditingComment(null)
    setEditContent('')
  }

  const formatTime = (timestamp) => {
    if (!timestamp) return ''
    return new Date(timestamp).toLocaleString()
  }

  const getCommentIcon = (isInternal) => {
    return isInternal ? '🔒' : '💬'
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">
          Comments {entityTitle && `- ${entityTitle}`}
        </h3>
        <span className="text-sm text-gray-500">
          {comments.length} comment{comments.length !== 1 ? 's' : ''}
        </span>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          {error}
        </div>
      )}

      {/* Comment Form */}
      <form onSubmit={handleSubmitComment} className="mb-6">
        <div className="mb-3">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            rows={3}
            required
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {userRole !== 'client' && (
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={isInternal}
                  onChange={(e) => setIsInternal(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-gray-600">Internal comment 🔒</span>
              </label>
            )}
          </div>
          
          <button
            type="submit"
            disabled={!newComment.trim()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add Comment
          </button>
        </div>
      </form>

      {/* Comments List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading comments...</div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">💬</div>
            <div>No comments yet. Be the first to comment!</div>
          </div>
        ) : (
          comments.map((comment) => (
            <div
              key={comment.id}
              className={`border rounded-lg p-4 ${
                comment.is_internal ? 'border-yellow-200 bg-yellow-50' : 'border-gray-200 bg-gray-50'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-800">
                    {comment.author_name || 'Unknown User'}
                  </span>
                  <span className="text-xs">{getCommentIcon(comment.is_internal)}</span>
                  {comment.is_internal && (
                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                      Internal
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">
                    {formatTime(comment.created_at)}
                    {comment.updated_at !== comment.created_at && ' (edited)'}
                  </span>
                  {comment.author_id === comment.current_user_id && (
                    <div className="flex gap-1">
                      <button
                        onClick={() => startEditing(comment)}
                        className="text-xs text-blue-600 hover:text-blue-800"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteComment(comment.id)}
                        className="text-xs text-red-600 hover:text-red-800"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {editingComment === comment.id ? (
                <div className="space-y-3">
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    rows={3}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditComment(comment.id)}
                      className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition"
                    >
                      Save
                    </button>
                    <button
                      onClick={cancelEditing}
                      className="bg-gray-500 text-white px-3 py-1 rounded text-sm hover:bg-gray-600 transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-gray-700 whitespace-pre-wrap">
                  {comment.content}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
