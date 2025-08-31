import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { verifyEmail } from '../services/api'

export default function VerifyEmail() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const verifyEmailAddress = useCallback(async (token) => {
    try {
      await verifyEmail(token)
      setSuccess(true)
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login')
      }, 3000)
    } catch (err) {
      console.error('Email verification error:', err)
      const data = err.response?.data
      let msg = 'Failed to verify email'
      
      if (data?.error) {
        msg = data.error
      } else if (data?.message) {
        msg = data.message
      } else if (err.response?.status === 400) {
        msg = 'Invalid or expired verification token'
      } else if (err.response?.status) {
        msg = `Server error (${err.response.status})`
      } else if (err.message?.includes('Network Error')) {
        msg = 'Network error - please check your connection'
      }
      
      setError(msg)
    } finally {
      setLoading(false)
    }
  }, [navigate])

  useEffect(() => {
    const tokenParam = searchParams.get('token')
    if (!tokenParam) {
      setError('Invalid or missing verification token')
      setLoading(false)
      return
    }
    verifyEmailAddress(tokenParam)
  }, [searchParams, verifyEmailAddress])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="w-full max-w-md bg-surface rounded-xl shadow-soft p-6 border border-border text-center">
          <div className="animate-spin text-6xl mb-4">⏳</div>
          <h1 className="text-2xl font-semibold text-text_primary mb-4">Verifying Email...</h1>
          <p className="text-text_secondary">
            Please wait while we verify your email address.
          </p>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="w-full max-w-md bg-surface rounded-xl shadow-soft p-6 border border-border text-center">
          <div className="text-6xl mb-4">✅</div>
          <h1 className="text-2xl font-semibold text-text_primary mb-4">Email Verified!</h1>
          <p className="text-text_secondary mb-6">
            Your email address has been successfully verified. You can now access all features of your account.
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-md bg-surface rounded-xl shadow-soft p-6 border border-border text-center">
        <div className="text-6xl mb-4">❌</div>
        <h1 className="text-2xl font-semibold text-text_primary mb-4">Verification Failed</h1>
        <p className="text-text_secondary mb-6">
          {error || 'This email verification link is invalid or has expired.'}
        </p>
        <div className="space-y-3">
          <Link 
            to="/login" 
            className="inline-block w-full bg-primary text-white py-2 px-4 rounded-lg hover:bg-primary/90 transition-colors"
          >
            Go to Login
          </Link>
          <p className="text-sm text-text_secondary">
            Need help? Contact support or try logging in to resend verification.
          </p>
        </div>
      </div>
    </div>
  )
}
