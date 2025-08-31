export default function StatsOverview({ stats = {} }) {
  const getStatCards = () => {
    return [
      {
        title: 'Total Projects',
        value: stats.total_projects || 0,
        color: 'blue',
        icon: '📁',
        description: 'All projects in system'
      },
      {
        title: 'Active Projects',
        value: stats.ongoing_projects || 0,
        color: 'green',
        icon: '🚀',
        description: 'Currently running'
      },
      {
        title: 'Completed Projects',
        value: stats.completed_projects || 0,
        color: 'purple',
        icon: '✅',
        description: 'Successfully finished'
      },
      {
        title: 'Total Tasks',
        value: stats.total_tasks || 0,
        color: 'orange',
        icon: '📋',
        description: 'All tasks across projects'
      },
      {
        title: 'Completed Tasks',
        value: stats.completed_tasks || 0,
        color: 'emerald',
        icon: '✔️',
        description: 'Finished tasks'
      },
      {
        title: 'Overdue Tasks',
        value: stats.overdue_tasks || 0,
        color: 'red',
        icon: '⚠️',
        description: 'Past due date'
      },
      {
        title: 'High Priority',
        value: stats.high_priority_tasks || 0,
        color: 'yellow',
        icon: '🔥',
        description: 'Urgent tasks'
      },
      {
        title: 'Active Users',
        value: stats.active_users || 0,
        color: 'indigo',
        icon: '👥',
        description: 'Currently active'
      }
    ]
  }

  const getColorClasses = (color) => {
    const colorMap = {
      blue: {
        bg: 'bg-blue-50',
        text: 'text-blue-600',
        border: 'border-blue-200'
      },
      green: {
        bg: 'bg-green-50',
        text: 'text-green-600',
        border: 'border-green-200'
      },
      purple: {
        bg: 'bg-purple-50',
        text: 'text-purple-600',
        border: 'border-purple-200'
      },
      orange: {
        bg: 'bg-orange-50',
        text: 'text-orange-600',
        border: 'border-orange-200'
      },
      emerald: {
        bg: 'bg-emerald-50',
        text: 'text-emerald-600',
        border: 'border-emerald-200'
      },
      red: {
        bg: 'bg-red-50',
        text: 'text-red-600',
        border: 'border-red-200'
      },
      yellow: {
        bg: 'bg-yellow-50',
        text: 'text-yellow-600',
        border: 'border-yellow-200'
      },
      indigo: {
        bg: 'bg-indigo-50',
        text: 'text-indigo-600',
        border: 'border-indigo-200'
      }
    }
    return colorMap[color] || colorMap.blue
  }

  const calculateCompletionRate = () => {
    const totalTasks = stats.total_tasks || 0
    const completedTasks = stats.completed_tasks || 0
    return totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
  }

  const calculateProjectCompletionRate = () => {
    const totalProjects = stats.total_projects || 0
    const completedProjects = stats.completed_projects || 0
    return totalProjects > 0 ? Math.round((completedProjects / totalProjects) * 100) : 0
  }

  const statCards = getStatCards()

  return (
    <div className="space-y-6">
      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => {
          const colors = getColorClasses(stat.color)
          return (
            <div 
              key={index}
              className={`${colors.bg} ${colors.border} border rounded-xl p-4 shadow-soft hover:shadow-md transition-shadow`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-600 mb-1">{stat.title}</div>
                  <div className={`text-2xl font-bold ${colors.text}`}>
                    {stat.value.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {stat.description}
                  </div>
                </div>
                <div className="text-2xl opacity-80">
                  {stat.icon}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Completion Rate Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Task Completion Rate */}
        <div className="bg-white rounded-xl border border-border p-6 shadow-soft">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Task Completion Rate</h3>
          <div className="flex items-center">
            <div className="flex-1">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Progress</span>
                <span>{calculateCompletionRate()}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-green-500 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${calculateCompletionRate()}%` }}
                ></div>
              </div>
              <div className="mt-2 text-xs text-gray-500">
                {stats.completed_tasks || 0} of {stats.total_tasks || 0} tasks completed
              </div>
            </div>
          </div>
        </div>

        {/* Project Completion Rate */}
        <div className="bg-white rounded-xl border border-border p-6 shadow-soft">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Project Completion Rate</h3>
          <div className="flex items-center">
            <div className="flex-1">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Progress</span>
                <span>{calculateProjectCompletionRate()}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-blue-500 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${calculateProjectCompletionRate()}%` }}
                ></div>
              </div>
              <div className="mt-2 text-xs text-gray-500">
                {stats.completed_projects || 0} of {stats.total_projects || 0} projects completed
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Insights */}
      <div className="bg-white rounded-xl border border-border p-6 shadow-soft">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600">Workload Status</div>
            <div className="text-lg font-semibold mt-1">
              {stats.overdue_tasks > 0 ? (
                <span className="text-red-600">⚠️ {stats.overdue_tasks} Overdue</span>
              ) : (
                <span className="text-green-600">✅ On Track</span>
              )}
            </div>
          </div>
          
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600">Priority Focus</div>
            <div className="text-lg font-semibold mt-1">
              {stats.high_priority_tasks > 0 ? (
                <span className="text-orange-600">🔥 {stats.high_priority_tasks} High Priority</span>
              ) : (
                <span className="text-gray-600">😌 Normal Priority</span>
              )}
            </div>
          </div>

          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600">Team Activity</div>
            <div className="text-lg font-semibold mt-1">
              <span className="text-blue-600">👥 {stats.active_users || 0} Active Users</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
