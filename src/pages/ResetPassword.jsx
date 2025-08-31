import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { resetPassword } from '../services/api'

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [token, setToken] = useState('')

  useEffect(() => {
    const tokenParam = searchParams.get('token')
    if (!tokenParam) {
      setError('Invalid or missing reset token')
      return
    }
    setToken(tokenParam)
  }, [searchParams])

  const validatePassword = (password) => {
    if (password.length < 8) {
      return 'Password must be at least 8 characters long'
    }
    if (!/(?=.*[a-z])/.test(password)) {
      return 'Password must contain at least one lowercase letter'
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      return 'Password must contain at least one uppercase letter'
    }
    if (!/(?=.*\d)/.test(password)) {
      return 'Password must contain at least one number'
    }
    return null
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    
    if (!password || !confirmPassword) {
      setError('Please fill in all fields')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    const passwordError = validatePassword(password)
    if (passwordError) {
      setError(passwordError)
      return
    }

    if (!token) {
      setError('Invalid reset token')
      return
    }

    setLoading(true)
    setError('')
    
    try {
      await resetPassword(token, password)
      setSuccess(true)
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login')
      }, 3000)
    } catch (err) {
      console.error('Reset password error:', err)
      const data = err.response?.data
      let msg = 'Failed to reset password'
      
      if (data?.error) {
        msg = data.error
      } else if (data?.message) {
        msg = data.message
      } else if (err.response?.status === 400) {
        msg = 'Invalid or expired reset token'
      } else if (err.response?.status) {
        msg = `Server error (${err.response.status})`
      } else if (err.message?.includes('Network Error')) {
        msg = 'Network error - please check your connection'
      }
      
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="w-full max-w-md bg-surface rounded-xl shadow-soft p-6 border border-border text-center">
          <div className="text-6xl mb-4">✅</div>
          <h1 className="text-2xl font-semibold text-text_primary mb-4">Password Reset Successful</h1>
          <p className="text-text_secondary mb-6">
            Your password has been successfully reset. You can now sign in with your new password.
          </p>
          <p className="text-sm text-text_secondary mb-6">
            Redirecting to login page in 3 seconds...
          </p>
          <Link 
            to="/login" 
            className="inline-block w-full bg-primary text-white py-2 px-4 rounded-lg hover:bg-primary/90 transition-colors"
          >
            Go to Login
          </Link>
        </div>
      </div>
    )
  }

  if (!token && error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="w-full max-w-md bg-surface rounded-xl shadow-soft p-6 border border-border text-center">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-semibold text-text_primary mb-4">Invalid Reset Link</h1>
          <p className="text-text_secondary mb-6">
            This password reset link is invalid or has expired. Please request a new one.
          </p>
          <Link 
            to="/forgot-password" 
            className="inline-block w-full bg-primary text-white py-2 px-4 rounded-lg hover:bg-primary/90 transition-colors"
          >
            Request New Reset Link
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-md bg-surface rounded-xl shadow-soft p-6 border border-border">
        <h1 className="text-2xl font-semibold text-text_primary mb-1">Create New Password</h1>
        <p className="text-text_secondary mb-6">
          Enter your new password below. Make sure it's strong and secure.
        </p>
        
        {error && (
          <div className="mb-4 text-red-600 bg-red-50 border border-red-200 p-3 rounded-lg">
            {error}
          </div>
        )}
        
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text_secondary mb-2">
              New Password
            </label>
            <input 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              type="password" 
              required 
              placeholder="Enter new password"
              className="w-full border border-border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-primary bg-white"
            />
            <p className="text-xs text-text_secondary mt-1">
              Must be at least 8 characters with uppercase, lowercase, and number
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-text_secondary mb-2">
              Confirm Password
            </label>
            <input 
              value={confirmPassword} 
              onChange={(e) => setConfirmPassword(e.target.value)} 
              type="password" 
              required 
              placeholder="Confirm new password"
              className="w-full border border-border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-primary bg-white"
            />
          </div>
          
          <button 
            disabled={loading || !token} 
            className="w-full bg-primary text-white py-3 rounded-lg font-medium disabled:opacity-60 hover:bg-primary/90 transition-colors"
          >
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
        
        <div className="text-center text-sm text-text_secondary mt-6">
          Remember your password?{' '}
          <Link className="text-primary hover:underline font-medium" to="/login">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  )
}
