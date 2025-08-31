import { useState } from 'react'
import { Link } from 'react-router-dom'
import { forgotPassword } from '../services/api'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const onSubmit = async (e) => {
    e.preventDefault()
    if (!email) {
      setError('Email is required')
      return
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address')
      return
    }

    setLoading(true)
    setError('')
    
    try {
      await forgotPassword(email)
      setSuccess(true)
    } catch (err) {
      console.error('Forgot password error:', err)
      const data = err.response?.data
      let msg = 'Failed to send reset email'
      
      if (data?.error) {
        msg = data.error
      } else if (data?.message) {
        msg = data.message
      } else if (err.response?.status === 400) {
        msg = 'Bad request - please check your email'
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
          <div className="text-6xl mb-4">📧</div>
          <h1 className="text-2xl font-semibold text-text_primary mb-4">Check Your Email</h1>
          <p className="text-text_secondary mb-6">
            If an account with that email exists, we've sent a password reset link to <strong>{email}</strong>
          </p>
          <p className="text-sm text-text_secondary mb-6">
            Didn't receive the email? Check your spam folder or try again in a few minutes.
          </p>
          <Link 
            to="/login" 
            className="inline-block w-full bg-primary text-white py-2 px-4 rounded-lg hover:bg-primary/90 transition-colors"
          >
            Back to Login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-md bg-surface rounded-xl shadow-soft p-6 border border-border">
        <h1 className="text-2xl font-semibold text-text_primary mb-1">Reset Password</h1>
        <p className="text-text_secondary mb-6">
          Enter your email address and we'll send you a link to reset your password.
        </p>
        
        {error && (
          <div className="mb-4 text-red-600 bg-red-50 border border-red-200 p-3 rounded-lg">
            {error}
          </div>
        )}
        
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text_secondary mb-2">
              Email Address
            </label>
            <input 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              type="email" 
              required 
              placeholder="Enter your email"
              className="w-full border border-border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-primary bg-white"
            />
          </div>
          
          <button 
            disabled={loading} 
            className="w-full bg-primary text-white py-3 rounded-lg font-medium disabled:opacity-60 hover:bg-primary/90 transition-colors"
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
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
