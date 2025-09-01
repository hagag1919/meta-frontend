import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import useAuthStore from '../../store/auth'
import { usePermissions, ROLE_PERMISSIONS } from '../../utils/permissions.jsx'
import NotificationBell from '../NotificationBell'
import BackendStatusIndicator from '../BackendStatusIndicator'
import { useTranslation } from '../../utils/i18n.jsx'

const navItem = 'flex items-center gap-3 px-3 py-2 rounded-lg text-text_secondary hover:bg-secondary hover:text-primary transition'
const activeNav = 'bg-[#EEF2FF] text-primary font-medium'

export default function MainLayout() {
  const navigate = useNavigate()
  const { user, clear } = useAuthStore()
  const { routes, userRole, permissions } = usePermissions()
  const { t } = useTranslation()

  const onLogout = () => {
    clear()
    navigate('/login')
  }

  const getUserDisplayName = () => {
    if (user?.first_name && user?.last_name) {
      return `${user.first_name} ${user.last_name}`
    }
    return user?.name || user?.email || 'User'
  }

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'administrator':
        return 'bg-red-100 text-red-800'
      case 'developer':
        return 'bg-blue-100 text-blue-800'
      case 'client':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="flex max-w-[1400px] mx-auto">
        <aside className="w-[280px] bg-surface border-r border-border p-4">
          <div className="flex items-center gap-2 mb-6">
            <img src="/vite.svg" alt="logo" className="w-8 h-8" />
            <span className="text-xl font-semibold text-text_primary">Meta Software</span>
          </div>
          
          {/* Role Badge */}
          <div className="mb-4 p-2 rounded-lg bg-gray-50">
            <div className="text-xs text-gray-500 mb-1">Role</div>
            <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(userRole)}`}>
              {permissions.name}
            </span>
          </div>

          {/* Dynamic Navigation based on role */}
          <nav className="flex flex-col gap-1">
            {routes.map((route) => (
              <NavLink 
                key={route.path}
                to={route.path} 
                end={route.path === '/'}
                className={({isActive}) => `${navItem} ${isActive ? activeNav : ''}`}
              >
                <span className="text-lg">{route.icon}</span>
                {route.labelKey ? t(route.labelKey) : route.label}
              </NavLink>
            ))}
          </nav>

          {/* User Info */}
          <div className="mt-6 p-3 rounded-lg bg-secondary text-sm text-text_secondary">
            <div className="text-xs text-gray-500 mb-1">Signed in as</div>
            <div className="text-text_primary font-medium">{getUserDisplayName()}</div>
            <div className="text-xs text-gray-500 mt-1">{user?.email}</div>
          </div>

          <button 
            onClick={onLogout} 
            className="mt-4 w-full bg-primary text-white py-2 rounded-lg shadow-soft hover:bg-primary/90 transition"
          >
            Logout
          </button>
        </aside>
        <main className="flex-1 p-6">
          {/* Top Navigation Bar with Notifications */}
          <div className="flex justify-end items-center mb-6 gap-3">
            {/* Backend Status Indicator */}
            <BackendStatusIndicator />
            {/* Quick language switcher */}
            <LanguageSwitcher />
            <NotificationBell />
          </div>
          <Outlet />
        </main>
      </div>
    </div>
  )
}

function LanguageSwitcher() {
  const { currentLanguage, changeLanguage } = useTranslation()
  return (
    <div className="flex items-center gap-1 text-sm">
      <button
        onClick={() => changeLanguage('en')}
        className={`px-2 py-1 rounded ${currentLanguage === 'en' ? 'bg-gray-200' : ''}`}
        title="English"
      >🇺🇸 EN</button>
      <button
        onClick={() => changeLanguage('ar')}
        className={`px-2 py-1 rounded ${currentLanguage === 'ar' ? 'bg-gray-200' : ''}`}
        title="العربية"
      >🇸🇦 AR</button>
    </div>
  )
}
