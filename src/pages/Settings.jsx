import { useEffect, useState } from 'react'
import { 
  getSettings, 
  updateSetting, 
  createSetting, 
  deleteSetting,
  getCompanyData,
  updateUser,
  listUsers,
  uploadFile
} from '../services/api'
import { usePermissions } from '../utils/permissions.jsx'
import useAuthStore from '../store/auth.js'
import { useTranslation } from '../utils/i18n.jsx'

export default function Settings() {
  const { t, changeLanguage, currentLanguage } = useTranslation()
  const [activeTab, setActiveTab] = useState('general')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const { hasPermission } = usePermissions()
  const { user, setUser } = useAuthStore()

  // State for different settings
  const [languageSettings, setLanguageSettings] = useState({
    userLanguage: 'en',
    systemLanguage: 'en',
    rtlEnabled: false
  })

  const [brandingSettings, setBrandingSettings] = useState({
    companyLogo: '',
    primaryColor: '#3B82F6',
    secondaryColor: '#EF4444',
    companyName: ''
  })

  const [users, setUsers] = useState([])
  const [permissions, setPermissions] = useState({
    administrator: [],
    developer: [],
    client: []
  })

  const [generalSettings, setGeneralSettings] = useState([])

  useEffect(() => {
    loadAllSettings()
  }, [])

  const loadAllSettings = async () => {
    try {
      setLoading(true)
      setError('')

      // Load general settings
      const settingsData = await getSettings()
      setGeneralSettings(Array.isArray(settingsData?.settings) ? settingsData.settings : [])

      // Load user language preference
      if (user) {
        const userLang = user.language_preference || 'en'
        setLanguageSettings(prev => ({
          ...prev,
          userLanguage: userLang
        }))
        
        // Sync with current language state
        if (currentLanguage !== userLang) {
          changeLanguage(userLang)
        }
      }

      // Load company data for branding
      try {
        const companyData = await getCompanyData()
        if (companyData) {
          setBrandingSettings({
            companyLogo: companyData.logo_url || '',
            primaryColor: companyData.primary_color || '#3B82F6',
            secondaryColor: companyData.secondary_color || '#EF4444',
            companyName: companyData.name || ''
          })
        }
      } catch (err) {
        console.log('Company data not available:', err.message)
      }

      // Load users if admin
      if (hasPermission('view', 'users')) {
        try {
          const usersData = await listUsers()
          setUsers(Array.isArray(usersData?.users) ? usersData.users : [])
        } catch (err) {
          console.log('Users data not available:', err.message)
        }
      }

    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  const handleLanguageChange = async (type, value) => {
    try {
      setError('')
      setSuccess('')

      if (type === 'userLanguage') {
        // Update user's language preference
        await updateUser(user.id, { language_preference: value })
        setLanguageSettings(prev => ({ ...prev, userLanguage: value }))
        
        // Update user in store
        setUser({ ...user, language_preference: value })
        
        // Update UI language immediately (without reload)
        changeLanguage(value)
        
        setSuccess(t('languageUpdated'))
      } else if (type === 'systemLanguage') {
        // Update system language setting
        await updateSetting('default_language', { value })
        setLanguageSettings(prev => ({ ...prev, systemLanguage: value }))
        setSuccess(t('settingsUpdated'))
      }
    } catch (err) {
      setError(err.response?.data?.message || t('errorUpdatingSettings'))
    }
  }

  const handleBrandingChange = async (field, value) => {
    try {
      setError('')
      setSuccess('')

      setBrandingSettings(prev => ({ ...prev, [field]: value }))
      
      // Update company settings
      const updateData = {}
      if (field === 'primaryColor') updateData.primary_color = value
      if (field === 'secondaryColor') updateData.secondary_color = value
      if (field === 'companyName') updateData.name = value

      if (Object.keys(updateData).length > 0) {
        // This would need to be implemented in the backend
        await updateSetting(`company_${field}`, { value })
        setSuccess('Branding updated successfully!')
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update branding')
    }
  }

  const handleLogoUpload = async (event) => {
    try {
      const file = event.target.files[0]
      if (!file) return

      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setError('File size must be less than 5MB')
        return
      }

      setError('')
      setSuccess('')
      
      const formData = new FormData()
      formData.append('file', file)
      formData.append('category', 'logo')

      const uploadResult = await uploadFile(formData)
      const logoUrl = uploadResult.file_url || uploadResult.url

      setBrandingSettings(prev => ({ ...prev, companyLogo: logoUrl }))
      await updateSetting('company_logo', { value: logoUrl })
      
      setSuccess('Logo uploaded successfully!')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to upload logo')
    }
  }

  const handleUserRoleChange = async (userId, newRole) => {
    try {
      setError('')
      setSuccess('')

      await updateUser(userId, { role: newRole })
      
      setUsers(prev => prev.map(u => 
        u.id === userId ? { ...u, role: newRole } : u
      ))
      
      setSuccess('User role updated successfully!')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update user role')
    }
  }

  const tabs = [
    { id: 'general', name: t('generalSettings'), icon: '⚙️' },
    { id: 'language', name: t('languageSettings'), icon: '🌐' },
    { id: 'branding', name: t('brandingSettings'), icon: '🎨' },
    { id: 'users', name: t('userManagement'), icon: '👥', permission: 'users' },
    { id: 'permissions', name: t('permissionManagement'), icon: '🔒', permission: 'settings' }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading settings...</div>
      </div>
    )
  }

  return (
    <div>
      <header className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-semibold text-text_primary">{t('settingsTitle')}</h1>
          <p className="text-text_secondary">{t('settingsDescription')}</p>
        </div>
      </header>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-600">
          {success}
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          {tabs.map((tab) => {
            if (tab.permission && !hasPermission('view', tab.permission)) {
              return null
            }
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.name}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-xl border border-border shadow-soft">
        
        {/* General Settings Tab */}
    {activeTab === 'general' && (
          <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">{t('generalSettings')}</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Application Name
                  </label>
                  <input
                    type="text"
                    defaultValue="Meta Software PM"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Default Timezone
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">Eastern Time</option>
                    <option value="Europe/London">London</option>
                    <option value="Asia/Dubai">Dubai</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Language Settings Tab */}
        {activeTab === 'language' && (
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">{t('languageSettings')}</h2>
            <div className="space-y-6">
              
              {/* User Language Preference */}
              <div>
                <h3 className="text-lg font-medium mb-3">{t('yourLanguagePreference')}</h3>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="userLanguage"
                      value="en"
                      checked={languageSettings.userLanguage === 'en' || currentLanguage === 'en'}
                      onChange={(e) => handleLanguageChange('userLanguage', e.target.value)}
                      className="mr-2"
                    />
                    <span className="mr-3">🇺🇸</span>
                    English
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="userLanguage"
                      value="ar"
                      checked={languageSettings.userLanguage === 'ar' || currentLanguage === 'ar'}
                      onChange={(e) => handleLanguageChange('userLanguage', e.target.value)}
                      className="mr-2"
                    />
                    <span className="mr-3">🇸🇦</span>
                    العربية (Arabic)
                  </label>
                </div>
              </div>

              {/* System Language (Admin only) */}
              {hasPermission('edit', 'settings') && (
                <div>
                  <h3 className="text-lg font-medium mb-3">{t('systemDefaultLanguage')}</h3>
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="systemLanguage"
                        value="en"
                        checked={languageSettings.systemLanguage === 'en'}
                        onChange={(e) => handleLanguageChange('systemLanguage', e.target.value)}
                        className="mr-2"
                      />
                      <span className="mr-3">🇺🇸</span>
                      English
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="systemLanguage"
                        value="ar"
                        checked={languageSettings.systemLanguage === 'ar'}
                        onChange={(e) => handleLanguageChange('systemLanguage', e.target.value)}
                        className="mr-2"
                      />
                      <span className="mr-3">🇸🇦</span>
                      العربية (Arabic)
                    </label>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    This will be the default language for new users and public pages.
                  </p>
                </div>
              )}

              {/* RTL Support Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-800 mb-2">{t('rtlSupport')}</h4>
                <p className="text-blue-700 text-sm">
                  {t('rtlSupportDescription')}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Company Branding Tab */}
        {activeTab === 'branding' && (
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">{t('brandingSettings')}</h2>
            <div className="space-y-6">
              
              {/* Company Logo */}
              <div>
                <h3 className="text-lg font-medium mb-3">{t('companyLogo')}</h3>
                <div className="flex items-center space-x-4">
                  <div className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                    {brandingSettings.companyLogo ? (
                      <img 
                        src={brandingSettings.companyLogo} 
                        alt="Company Logo" 
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <span className="text-gray-400 text-xs text-center">No Logo</span>
                    )}
                  </div>
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                      id="logo-upload"
                    />
                    <label
                      htmlFor="logo-upload"
                      className="cursor-pointer bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition inline-block"
                    >
                      {t('uploadLogo')}
                    </label>
                    <p className="text-sm text-gray-600 mt-1">
                      {t('logoRecommendation')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Company Colors */}
              <div>
                <h3 className="text-lg font-medium mb-3">{t('brandColors')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('primaryColor')}
                    </label>
                    <div className="flex items-center space-x-3">
                      <input
                        type="color"
                        value={brandingSettings.primaryColor}
                        onChange={(e) => handleBrandingChange('primaryColor', e.target.value)}
                        className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={brandingSettings.primaryColor}
                        onChange={(e) => handleBrandingChange('primaryColor', e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('secondaryColor')}
                    </label>
                    <div className="flex items-center space-x-3">
                      <input
                        type="color"
                        value={brandingSettings.secondaryColor}
                        onChange={(e) => handleBrandingChange('secondaryColor', e.target.value)}
                        className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={brandingSettings.secondaryColor}
                        onChange={(e) => handleBrandingChange('secondaryColor', e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Color Preview */}
              <div>
                <h3 className="text-lg font-medium mb-3">{t('preview')}</h3>
                <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center space-x-4 mb-4">
                    <div 
                      className="w-8 h-8 rounded"
                      style={{ backgroundColor: brandingSettings.primaryColor }}
                    ></div>
                    <span className="text-sm font-medium">Primary Color</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div 
                      className="w-8 h-8 rounded"
                      style={{ backgroundColor: brandingSettings.secondaryColor }}
                    ></div>
                    <span className="text-sm font-medium">Secondary Color</span>
                  </div>
                  <div className="mt-4">
                    <button 
                      className="px-4 py-2 rounded-lg text-white"
                      style={{ backgroundColor: brandingSettings.primaryColor }}
                    >
                      Sample Primary Button
                    </button>
                    <button 
                      className="ml-2 px-4 py-2 rounded-lg text-white"
                      style={{ backgroundColor: brandingSettings.secondaryColor }}
                    >
                      Sample Secondary Button
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Users Management Tab */}
        {activeTab === 'users' && hasPermission('view', 'users') && (
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">{t('userManagement')}</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-border">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">User</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Email</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Role</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((userData) => (
                    <tr key={userData.id} className="border-b border-border hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-900">
                          {userData.first_name} {userData.last_name}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-600">{userData.email}</td>
                      <td className="py-3 px-4">
                        {hasPermission('edit', 'users') ? (
                          <select
                            value={userData.role}
                            onChange={(e) => handleUserRoleChange(userData.id, e.target.value)}
                            className="px-2 py-1 border border-gray-300 rounded text-sm"
                          >
                            <option value="administrator">{t('administrator')}</option>
                            <option value="developer">{t('developer')}</option>
                            <option value="client">{t('client')}</option>
                          </select>
                        ) : (
                          <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                            userData.role === 'administrator' ? 'bg-red-100 text-red-800' :
                            userData.role === 'developer' ? 'bg-blue-100 text-blue-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {t(userData.role)}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                          userData.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {userData.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <button className="text-blue-600 hover:text-blue-800 text-sm">
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Permissions Tab */}
        {activeTab === 'permissions' && hasPermission('edit', 'settings') && (
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Permission Management</h2>
            <div className="space-y-6">
              
              {/* Permission Matrix */}
              <div>
                <h3 className="text-lg font-medium mb-3">Role Permissions</h3>
                <div className="overflow-x-auto">
                  <table className="w-full border border-gray-300 rounded-lg">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left py-3 px-4 font-medium text-gray-700 border-b">
                          Permission
                        </th>
                        <th className="text-center py-3 px-4 font-medium text-gray-700 border-b border-l">
                          {t('administrator')}
                        </th>
                        <th className="text-center py-3 px-4 font-medium text-gray-700 border-b border-l">
                          {t('developer')}
                        </th>
                        <th className="text-center py-3 px-4 font-medium text-gray-700 border-b border-l">
                          {t('client')}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { name: 'View Dashboard', key: 'dashboard.view' },
                        { name: 'Manage Projects', key: 'projects.manage' },
                        { name: 'Manage Tasks', key: 'tasks.manage' },
                        { name: 'Manage Users', key: 'users.manage' },
                        { name: 'View Reports', key: 'reports.view' },
                        { name: 'Manage Invoices', key: 'invoices.manage' },
                        { name: 'System Settings', key: 'settings.manage' },
                        { name: 'Time Tracking', key: 'time.manage' }
                      ].map((permission, index) => (
                        <tr key={permission.key} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="py-3 px-4 border-b">{permission.name}</td>
                          <td className="py-3 px-4 border-b border-l text-center">
                            <span className="text-green-600">✓</span>
                          </td>
                          <td className="py-3 px-4 border-b border-l text-center">
                            {['dashboard.view', 'projects.manage', 'tasks.manage', 'reports.view', 'time.manage'].includes(permission.key) ? (
                              <span className="text-green-600">✓</span>
                            ) : (
                              <span className="text-gray-400">✗</span>
                            )}
                          </td>
                          <td className="py-3 px-4 border-b border-l text-center">
                            {['dashboard.view', 'reports.view'].includes(permission.key) ? (
                              <span className="text-green-600">✓</span>
                            ) : (
                              <span className="text-gray-400">✗</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Permission Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-800 mb-2">Permission Levels</h4>
                <ul className="text-blue-700 text-sm space-y-1">
                  <li><strong>Administrator:</strong> Full access to all features and settings</li>
                  <li><strong>Developer:</strong> Project and task management, time tracking</li>
                  <li><strong>Client:</strong> View-only access to assigned projects and reports</li>
                </ul>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
