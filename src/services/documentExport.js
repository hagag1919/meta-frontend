import { supabase, STORAGE_BUCKET, generateFilePath, getSignedUrl } from '../config/supabase'
import useAuthStore from '../store/auth'
import api from './api'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

// Document export service
export class DocumentExportService {
  
  // Export data to Excel and upload to Supabase Storage
  static async exportToExcel(data, filename, options = {}) {
    try {
      console.log('📊 Exporting data to Excel...')
      
      const {
        sheetName = 'Data',
        userId = null,
        isPublic = false,
        metadata = {}
      } = options
      
      // Create workbook and worksheet
      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.json_to_sheet(data)
      
      // Auto-size columns
      const colWidths = []
      const range = XLSX.utils.decode_range(ws['!ref'])
      
      for (let C = range.s.c; C <= range.e.c; ++C) {
        let maxWidth = 10
        for (let R = range.s.r; R <= range.e.r; ++R) {
          const cellAddress = XLSX.utils.encode_cell({ c: C, r: R })
          const cell = ws[cellAddress]
          if (cell && cell.v) {
            const cellLength = cell.v.toString().length
            maxWidth = Math.max(maxWidth, cellLength)
          }
        }
        colWidths[C] = { width: Math.min(maxWidth + 2, 50) }
      }
      ws['!cols'] = colWidths
      
      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, sheetName)
      
      // Generate Excel buffer
      const excelBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
      
      // Create file blob
      const blob = new Blob([excelBuffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      })
      
      // Generate file path
      const currentUser = useAuthStore.getState().user
      const actualUserId = userId || currentUser?.id
      const filePath = generateFilePath('exports/excel', `${filename}.xlsx`, actualUserId)
      
      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(filePath, blob, {
          contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          metadata: {
            ...metadata,
            exportedBy: currentUser?.email || 'system',
            exportedAt: new Date().toISOString(),
            recordCount: data.length
          }
        })
      
      if (error) {
        console.error('Error uploading Excel file:', error)
        throw error
      }
      
      console.log('✅ Excel file uploaded successfully:', data.path)
      
      // Record export in database
      try {
        await api.post('/exports', {
          filename: `${filename}.xlsx`,
          file_path: data.path,
          export_type: 'excel',
          entity_type: options.metadata?.entityType || 'data',
          record_count: data.length,
          file_size: blob.size,
          is_public: isPublic,
          metadata: options.metadata
        })
      } catch (dbError) {
        console.warn('Failed to record export in database:', dbError)
        // Continue anyway - file is uploaded
      }
      
      // Return download information
      const downloadUrl = isPublic 
        ? supabase.storage.from(STORAGE_BUCKET).getPublicUrl(data.path).data.publicUrl
        : await getSignedUrl(data.path, 3600) // 1 hour expiry
      
      return {
        success: true,
        path: data.path,
        downloadUrl,
        filename: `${filename}.xlsx`,
        fileSize: blob.size,
        recordCount: data.length
      }
      
    } catch (error) {
      console.error('Excel export failed:', error)
      throw error
    }
  }
  
  // Export data to PDF and upload to Supabase Storage
  static async exportToPDF(data, filename, options = {}) {
    try {
      console.log('📄 Exporting data to PDF...')
      
      const {
        title = 'Data Export',
        columns = null,
        userId = null,
        isPublic = false,
        metadata = {},
        pageOrientation = 'portrait'
      } = options
      
      // Create PDF document
      const doc = new jsPDF(pageOrientation)
      
      // Add title
      doc.setFontSize(16)
      doc.text(title, 20, 20)
      
      // Add metadata
      const currentUser = useAuthStore.getState().user
      doc.setFontSize(10)
      doc.text(`Exported by: ${currentUser?.email || 'System'}`, 20, 30)
      doc.text(`Export date: ${new Date().toLocaleString()}`, 20, 35)
      doc.text(`Records: ${data.length}`, 20, 40)
      
      // Prepare table data
      let tableColumns = columns
      if (!tableColumns && data.length > 0) {
        tableColumns = Object.keys(data[0])
      }
      
      const tableRows = data.map(row => 
        tableColumns.map(col => row[col] || '')
      )
      
      // Add table
      doc.autoTable({
        head: [tableColumns],
        body: tableRows,
        startY: 50,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [66, 139, 202] }
      })
      
      // Generate PDF buffer
      const pdfBuffer = doc.output('arraybuffer')
      
      // Create file blob
      const blob = new Blob([pdfBuffer], { type: 'application/pdf' })
      
      // Generate file path
      const actualUserId = userId || currentUser?.id
      const filePath = generateFilePath('exports/pdf', `${filename}.pdf`, actualUserId)
      
      // Upload to Supabase Storage
      const { data: uploadData, error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(filePath, blob, {
          contentType: 'application/pdf',
          metadata: {
            ...metadata,
            exportedBy: currentUser?.email || 'system',
            exportedAt: new Date().toISOString(),
            recordCount: data.length
          }
        })
      
      if (error) {
        console.error('Error uploading PDF file:', error)
        throw error
      }
      
      console.log('✅ PDF file uploaded successfully:', uploadData.path)
      
      // Record export in database
      try {
        await api.post('/exports', {
          filename: `${filename}.pdf`,
          file_path: uploadData.path,
          export_type: 'pdf',
          entity_type: options.metadata?.entityType || 'data',
          record_count: data.length,
          file_size: blob.size,
          is_public: isPublic,
          metadata: options.metadata
        })
      } catch (dbError) {
        console.warn('Failed to record export in database:', dbError)
        // Continue anyway - file is uploaded
      }
      
      // Return download information
      const downloadUrl = isPublic 
        ? supabase.storage.from(STORAGE_BUCKET).getPublicUrl(uploadData.path).data.publicUrl
        : await getSignedUrl(uploadData.path, 3600) // 1 hour expiry
      
      return {
        success: true,
        path: uploadData.path,
        downloadUrl,
        filename: `${filename}.pdf`,
        fileSize: blob.size,
        recordCount: data.length
      }
      
    } catch (error) {
      console.error('PDF export failed:', error)
      throw error
    }
  }
  
  // Export data to CSV and upload to Supabase Storage
  static async exportToCSV(data, filename, options = {}) {
    try {
      console.log('📝 Exporting data to CSV...')
      
      const {
        delimiter = ',',
        userId = null,
        isPublic = false,
        metadata = {}
      } = options
      
      if (!data || data.length === 0) {
        throw new Error('No data to export')
      }
      
      // Get column headers
      const headers = Object.keys(data[0])
      
      // Create CSV content
      let csvContent = headers.join(delimiter) + '\n'
      
      // Add data rows
      data.forEach(row => {
        const values = headers.map(header => {
          let value = row[header] || ''
          // Escape commas and quotes in CSV
          if (typeof value === 'string' && (value.includes(delimiter) || value.includes('"'))) {
            value = `"${value.replace(/"/g, '""')}"`
          }
          return value
        })
        csvContent += values.join(delimiter) + '\n'
      })
      
      // Create file blob
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      
      // Generate file path
      const currentUser = useAuthStore.getState().user
      const actualUserId = userId || currentUser?.id
      const filePath = generateFilePath('exports/csv', `${filename}.csv`, actualUserId)
      
      // Upload to Supabase Storage
      const { data: uploadData, error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(filePath, blob, {
          contentType: 'text/csv',
          metadata: {
            ...metadata,
            exportedBy: currentUser?.email || 'system',
            exportedAt: new Date().toISOString(),
            recordCount: data.length
          }
        })
      
      if (error) {
        console.error('Error uploading CSV file:', error)
        throw error
      }
      
      console.log('✅ CSV file uploaded successfully:', uploadData.path)
      
      // Record export in database
      try {
        await api.post('/exports', {
          filename: `${filename}.csv`,
          file_path: uploadData.path,
          export_type: 'csv',
          entity_type: options.metadata?.entityType || 'data',
          record_count: data.length,
          file_size: blob.size,
          is_public: isPublic,
          metadata: options.metadata
        })
      } catch (dbError) {
        console.warn('Failed to record export in database:', dbError)
        // Continue anyway - file is uploaded
      }
      
      // Return download information
      const downloadUrl = isPublic 
        ? supabase.storage.from(STORAGE_BUCKET).getPublicUrl(uploadData.path).data.publicUrl
        : await getSignedUrl(uploadData.path, 3600) // 1 hour expiry
      
      return {
        success: true,
        path: uploadData.path,
        downloadUrl,
        filename: `${filename}.csv`,
        fileSize: blob.size,
        recordCount: data.length
      }
      
    } catch (error) {
      console.error('CSV export failed:', error)
      throw error
    }
  }
  
  // List user's exported files
  static async listUserExports(userId = null) {
    try {
      // First try to get from database (more reliable)
      try {
        const response = await api.get('/exports')
        if (response.data.success) {
          return response.data.exports.map(exp => ({
            name: exp.filename,
            created_at: exp.created_at,
            metadata: {
              size: exp.file_size,
              recordCount: exp.record_count,
              exportType: exp.export_type
            },
            path: exp.file_path
          }))
        }
      } catch (apiError) {
        console.warn('Failed to fetch from database, falling back to storage:', apiError)
      }
      
      // Fallback to direct storage query
      const currentUser = useAuthStore.getState().user
      const actualUserId = userId || currentUser?.id
      
      if (!actualUserId) {
        throw new Error('User ID is required')
      }
      
      const { data, error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .list(`user-${actualUserId}/exports`, {
          limit: 100,
          sortBy: { column: 'created_at', order: 'desc' }
        })
      
      if (error) {
        console.error('Error listing exports:', error)
        throw error
      }
      
      return data || []
    } catch (error) {
      console.error('Failed to list exports:', error)
      throw error
    }
  }
  
  // Delete an exported file
  static async deleteExport(filePath) {
    try {
      const { error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .remove([filePath])
      
      if (error) {
        console.error('Error deleting export:', error)
        throw error
      }
      
      console.log('✅ Export deleted successfully:', filePath)
      return { success: true }
    } catch (error) {
      console.error('Failed to delete export:', error)
      throw error
    }
  }
}

export default DocumentExportService
