import { useState, useEffect } from 'react'
import { register as registerAdmin, healthCheck } from '../services/api'
import useAuthStore from '../store/auth'
import { Link, useNavigate } from 'react-router-dom'

export default function AdminRegister() {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [backendStatus, setBackendStatus] = useState('checking...')
  const { user } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    // Check if user is admin
    if (!user || user.role !== 'administrator') {
      navigate('/')
      return
    }

    // Check if backend is reachable
    const checkBackend = async () => {
      try {
        await healthCheck()
        setBackendStatus('✓ Backend reachable')
      } catch (err) {
        console.error('Backend health check failed:', err)
        setBackendStatus('✗ Backend unreachable')
      }
    }
    checkBackend()
  }, [user, navigate])

  const testBackend = async () => {
    try {
      console.log('Testing backend health...')
      const result = await healthCheck()
      console.log('Backend health result:', result)
      setBackendStatus('✓ Backend healthy: ' + JSON.stringify(result))
    } catch (err) {
      console.error('Backend test failed:', err)
      setBackendStatus('✗ Backend test failed: ' + err.message)
    }
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    if (!firstName || !lastName || !email || !password) {
      setError('All fields are required')
      return
    }
    if (password.length < 8) {
      setError('Password must be 8-128 characters and contain at least one lowercase, uppercase, digit, and special character (@$!%*?&)')
      return
    }
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      const data = await registerAdmin({ firstName, lastName, email, password, role: 'administrator' })
      setSuccess('Administrator account created successfully!')
      setFirstName('')
      setLastName('')
      setEmail('')
      setPassword('')
      
      console.log('Admin created:', data)
    } catch (err) {
      console.error('Admin registration error - Full error:', err)
      console.error('Admin registration error - Response:', err.response)
      console.error('Admin registration error - Response data:', err.response?.data)
      console.error('Admin registration error - Status:', err.response?.status)
      
      const data = err.response?.data
      let msg = 'Admin registration failed'
      
      if (data?.error === 'Only administrators can create admin accounts') {
        msg = 'Access denied. Only administrators can create admin accounts.'
      } else if (data?.error === 'Invalid input detected' || 
          data?.error === 'Security validation failed') {
        msg = 'Request blocked by security system. Please ensure your input doesn\'t contain special characters that might be flagged as suspicious.'
      } else if (data?.details && Array.isArray(data.details)) {
        msg = data.details.map(detail => detail.msg || detail.message || detail).join(', ')
      } else if (data?.error) {
        msg = data.error
      } else if (data?.message) {
        msg = data.message
      } else if (Array.isArray(data?.errors)) {
        msg = data.errors.map(e => e.msg || e.message || e).join(', ')
      } else if (err.response?.status === 403) {
        msg = 'Access denied. Only administrators can create admin accounts.'
      } else if (err.response?.status === 400) {
        msg = 'Bad request - please check your input'
      } else if (err.response?.status) {
        msg = `Server error (${err.response.status})`
      } else if (err.message?.includes('timeout')) {
        msg = 'Request timed out - please try again'
      } else if (err.message?.includes('Network Error')) {
        msg = 'Network error - please check your connection'
      }
      
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  // Don't render if not admin
  if (!user || user.role !== 'administrator') {
    return null
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-md bg-surface rounded-xl shadow-soft p-6 border border-border">
        <h1 className="text-2xl font-semibold text-text_primary mb-1">Create Admin Account</h1>
        <p className="text-text_secondary mb-2">Add a new administrator to the system</p>
        <div className="text-xs text-text_secondary mb-4">
          Backend: {backendStatus}
          <button 
            onClick={testBackend} 
            className="ml-2 text-xs bg-gray-200 px-2 py-1 rounded"
          >
            Test
          </button>
        </div>
        {error && <div className="mb-4 text-red-600 bg-red-50 border border-red-200 p-2 rounded">{error}</div>}
        {success && <div className="mb-4 text-green-600 bg-green-50 border border-green-200 p-2 rounded">{success}</div>}
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-text_secondary mb-1">First name</label>
              <input 
                value={firstName} 
                onChange={(e)=>setFirstName(e.target.value)} 
                required 
                className="w-full border border-border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-primary bg-white" 
              />
            </div>
            <div>
              <label className="block text-sm text-text_secondary mb-1">Last name</label>
              <input 
                value={lastName} 
                onChange={(e)=>setLastName(e.target.value)} 
                required 
                className="w-full border border-border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-primary bg-white" 
              />
            </div>
          </div>
          <div>
            <label className="block text-sm text-text_secondary mb-1">Email</label>
            <input 
              value={email} 
              onChange={(e)=>setEmail(e.target.value)} 
              type="email" 
              required 
              className="w-full border border-border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-primary bg-white" 
            />
          </div>
          <div>
            <label className="block text-sm text-text_secondary mb-1">Password</label>
            <input 
              value={password} 
              onChange={(e)=>setPassword(e.target.value)} 
              type="password" 
              required 
              className="w-full border border-border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-primary bg-white" 
            />
            <p className="text-xs text-text_secondary mt-1">8-128 characters with uppercase, lowercase, number, and special character (@$!%*?&)</p>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Role:</strong> Administrator<br/>
              This account will have full system access and administrative privileges.
            </p>
          </div>
          <button 
            disabled={loading} 
            className="w-full bg-primary text-white py-2 rounded-lg disabled:opacity-60"
          >
            {loading? 'Creating Admin...' : 'Create Administrator Account'}
          </button>
        </form>
        <div className="text-sm text-text_secondary mt-4">
          <Link className="text-primary" to="/">← Back to Dashboard</Link>
        </div>
      </div>
    </div>
  )
}
