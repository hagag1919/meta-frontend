import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://xskfbqttkhkbsmcowhtr.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhza2ZicXR0a2hrYnNtY293aHRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3Mzg3NDAsImV4cCI6MjA3MjMxNDc0MH0.yNeI_mxAA8nRICoRRgocnk3tzFa7KsL7Ees8HBHINg4'

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseKey)

// Storage bucket name for documents
export const STORAGE_BUCKET = 'meta-storage'

// Helper function to generate file paths
export const generateFilePath = (type, filename, userId = null) => {
  const timestamp = new Date().toISOString().slice(0, 10) // YYYY-MM-DD
  const userPrefix = userId ? `user-${userId}/` : ''
  return `${userPrefix}${type}/${timestamp}/${filename}`
}

// Helper function to get public URL for uploaded file
export const getPublicUrl = (path) => {
  const { data } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(path)
  
  return data.publicUrl
}

// Helper function to create signed URL for private files
export const getSignedUrl = async (path, expiresIn = 3600) => {
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(path, expiresIn)
  
  if (error) {
    console.error('Error creating signed URL:', error)
    throw error
  }
  
  return data.signedUrl
}

export default supabase
