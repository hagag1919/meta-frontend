import useAuthStore from '../store/auth.js'

export const ROLE_PERMISSIONS = {
  administrator: {
    name: 'Administrator',
    routes: [
      { path: '/', label: 'Dashboard', icon: '📊' },
      { path: '/projects', label: 'Projects', icon: '📁' },
      { path: '/tasks', label: 'Tasks', icon: '✅' },
      { path: '/users', label: 'Users', icon: '👥' },
      { path: '/companies', label: 'Companies', icon: '🏢' },
      { path: '/clients', label: 'Client Management', icon: '🤝' },
      { path: '/invoices', label: 'Invoices', icon: '💰' },
      { path: '/reports', label: 'Reports', icon: '📈' },
      { path: '/time-tracking', label: 'Time Tracking', icon: '⏰' },
      { path: '/settings', label: 'Settings', icon: '⚙️' },
      { path: '/chat', label: 'Chat', icon: '💬' }
    ],
    canCreate: ['projects', 'tasks', 'users', 'companies', 'clients', 'invoices'],
    canEdit: ['projects', 'tasks', 'users', 'companies', 'clients', 'invoices', 'settings'],
    canDelete: ['projects', 'tasks', 'users', 'companies', 'clients', 'invoices'],
    canView: ['all']
  },
  developer: {
    name: 'Developer',
    routes: [
      { path: '/', label: 'Dashboard', icon: '📊' },
      { path: '/projects', label: 'My Projects', icon: '📁' },
      { path: '/tasks', label: 'My Tasks', icon: '✅' },
      { path: '/time-tracking', label: 'Time Tracking', icon: '⏰' },
      { path: '/chat', label: 'Team Chat', icon: '💬' },
      { path: '/profile', label: 'Profile', icon: '👤' }
    ],
    canCreate: ['tasks', 'comments', 'time-entries'],
    canEdit: ['tasks', 'profile', 'comments', 'time-entries'],
    canDelete: ['comments', 'time-entries'],
    canView: ['projects', 'tasks', 'users', 'time-tracking']
  },
  client: {
    name: 'Client',
    routes: [
      { path: '/', label: 'Project Dashboard', icon: '📊' },
      { path: '/projects', label: 'My Projects', icon: '📁' },
      { path: '/invoices', label: 'Invoices', icon: '💰' },
      { path: '/reports', label: 'Project Reports', icon: '📈' },
      { path: '/chat', label: 'Support Chat', icon: '💬' },
      { path: '/profile', label: 'Profile', icon: '👤' }
    ],
    canCreate: ['comments'],
    canEdit: ['profile'],
    canDelete: [],
    canView: ['projects', 'invoices', 'reports']
  }
}

export const usePermissions = () => {
  const { user } = useAuthStore()
  const userRole = user?.role || 'client'
  
  const permissions = ROLE_PERMISSIONS[userRole] || ROLE_PERMISSIONS.client
  
  const hasPermission = (action, resource) => {
    if (permissions.canView.includes('all')) return true
    
    switch (action) {
      case 'create':
        return permissions.canCreate.includes(resource)
      case 'edit':
        return permissions.canEdit.includes(resource)
      case 'delete':
        return permissions.canDelete.includes(resource)
      case 'view':
        return permissions.canView.includes(resource) || permissions.canView.includes('all')
      default:
        return false
    }
  }

  const canAccess = (route) => {
    return permissions.routes.some(r => r.path === route)
  }

  return {
    userRole,
    permissions,
    hasPermission,
    canAccess,
    routes: permissions.routes
  }
}

// Component to protect routes based on roles
export const RoleProtectedRoute = ({ children, requiredRoles = [], requiredPermission = null, resource = null }) => {
  const { user } = useAuthStore()
  const { hasPermission } = usePermissions()
  
  const userRole = user?.role || 'client'
  
  // Check role access
  if (requiredRoles.length > 0 && !requiredRoles.includes(userRole)) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-6xl mb-4">🚫</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </div>
    )
  }
  
  // Check specific permission
  if (requiredPermission && resource && !hasPermission(requiredPermission, resource)) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-6xl mb-4">🚫</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to {requiredPermission} {resource}.</p>
        </div>
      </div>
    )
  }
  
  return children
}

// Component for conditional rendering based on permissions
export const PermissionGuard = ({ action, resource, children, fallback = null }) => {
  const { hasPermission } = usePermissions()
  
  if (hasPermission(action, resource)) {
    return children
  }
  
  return fallback
}
