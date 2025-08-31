import { useState, useEffect } from 'react'
import { login as loginApi, healthCheck, testSecurityPatterns } from '../services/api'
import useAuthStore from '../store/auth'
import { Link, useNavigate } from 'react-router-dom'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [backendStatus, setBackendStatus] = useState('checking...')
  const setAuth = useAuthStore((s)=>s.setAuth)
  const navigate = useNavigate()

  useEffect(() => {
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
  }, [])

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

  const testSecurity = async () => {
    try {
      console.log('Running security pattern tests...')
      await testSecurityPatterns()
      setBackendStatus('✓ Security tests completed - check console')
    } catch (err) {
      console.error('Security test failed:', err)
      setBackendStatus('✗ Security test failed')
    }
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    if (!email || !password) { 
      setError('Email and password are required')
      return 
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address')
      return
    }
    
    if (email.length > 255) {
      setError('Email address is too long')
      return
    }
    
    setLoading(true)
    setError('')
    try {
      const data = await loginApi(email, password)
      // assuming response returns { token, user }
      setAuth(data.token, data.user)
      navigate('/')
    } catch (err) {
      console.error('Login error - Full error:', err)
      console.error('Login error - Response:', err.response)
      console.error('Login error - Response data:', err.response?.data)
      console.error('Login error - Status:', err.response?.status)
      
      const data = err.response?.data
      let msg = 'Login failed'
      
      // Handle rate limiting
      if (err.response?.status === 429) {
        const retryAfter = data?.retryAfter || 900 // Default to 15 minutes
        const minutes = Math.ceil(retryAfter / 60)
        msg = `Too many login attempts. Please wait ${minutes} minutes before trying again.`
      }
      // Handle security middleware errors
      else if (data?.error === 'Invalid input detected' || 
          data?.error === 'Security validation failed') {
        msg = 'Request blocked by security system. Please try again or contact support if this persists.'
      } else if (data?.details && Array.isArray(data.details)) {
        // Validation errors from express-validator
        msg = data.details.map(detail => detail.msg || detail.message || detail).join(', ')
      } else if (data?.error) {
        msg = data.error
      } else if (data?.message) {
        msg = data.message
      } else if (Array.isArray(data?.errors)) {
        msg = data.errors.map(e => e.msg || e.message || e).join(', ')
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-md bg-surface rounded-xl shadow-soft p-6 border border-border">
        <h1 className="text-2xl font-semibold text-text_primary mb-1">Sign in</h1>
        <p className="text-text_secondary mb-2">Access your account</p>
        <div className="text-xs text-text_secondary mb-4">
          Backend: {backendStatus}
          <button 
            onClick={testBackend} 
            className="ml-2 text-xs bg-gray-200 px-2 py-1 rounded"
          >
            Test
          </button>
          <button 
            onClick={testSecurity} 
            className="ml-2 text-xs bg-blue-200 px-2 py-1 rounded"
          >
            Security
          </button>
        </div>
        {error && <div className="mb-4 text-red-600 bg-red-50 border border-red-200 p-2 rounded">{error}</div>}
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-text_secondary mb-1">Email</label>
            <input value={email} onChange={(e)=>setEmail(e.target.value)} type="email" required className="w-full border border-border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-primary bg-white" />
          </div>
          <div>
            <label className="block text-sm text-text_secondary mb-1">Password</label>
            <input value={password} onChange={(e)=>setPassword(e.target.value)} type="password" required className="w-full border border-border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-primary bg-white" />
          </div>
          <div className="text-right">
            <Link className="text-sm text-primary hover:underline" to="/forgot-password">
              Forgot password?
            </Link>
          </div>
          <button disabled={loading} className="w-full bg-primary text-white py-2 rounded-lg disabled:opacity-60">{loading? 'Signing in...' : 'Sign in'}</button>
        </form>
        <div className="text-sm text-text_secondary mt-4">No account? <Link className="text-primary" to="/register">Register</Link></div>
      </div>
    </div>
  )
}
