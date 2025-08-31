export default function TimelineChart({ projects = [] }) {
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'bg-green-500'
      case 'ongoing':
        return 'bg-blue-500'
      case 'planning':
        return 'bg-yellow-500'
      case 'stopped':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return ''
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    })
  }

  const calculateDaysFromStart = (startDate, currentDate) => {
    if (!startDate || !currentDate) return 0
    const start = new Date(startDate)
    const current = new Date(currentDate)
    const diffTime = Math.abs(current - start)
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  const getProjectDuration = (startDate, endDate) => {
    if (!startDate || !endDate) return 100 // Default width
    const start = new Date(startDate)
    const end = new Date(endDate)
    const diffTime = Math.abs(end - start)
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  // Sort projects by start date
  const sortedProjects = [...projects]
    .filter(p => p.start_date) // Only show projects with start dates
    .sort((a, b) => new Date(a.start_date) - new Date(b.start_date))
    .slice(0, 10) // Limit to 10 projects for better visualization

  if (sortedProjects.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <div className="text-lg font-medium">No timeline data available</div>
        <p className="text-sm mt-2">Projects need start and end dates to show in timeline</p>
      </div>
    )
  }

  // Find the earliest and latest dates to set the timeline scale
  const allDates = sortedProjects.flatMap(p => [p.start_date, p.end_date].filter(Boolean))
  const earliestDate = new Date(Math.min(...allDates.map(d => new Date(d))))
  const latestDate = new Date(Math.max(...allDates.map(d => new Date(d))))
  const totalTimespan = Math.ceil((latestDate - earliestDate) / (1000 * 60 * 60 * 24)) || 365

  return (
    <div className="bg-white rounded-xl border border-border p-6 shadow-soft">
      <h3 className="text-lg font-medium mb-6">Project Timeline</h3>
      
      {/* Timeline Header */}
      <div className="mb-4 flex justify-between text-sm text-gray-600">
        <span>{formatDate(earliestDate)}</span>
        <span>Project Timeline View</span>
        <span>{formatDate(latestDate)}</span>
      </div>

      {/* Timeline Content */}
      <div className="space-y-4">
        {sortedProjects.map((project) => {
          const projectStart = calculateDaysFromStart(earliestDate, project.start_date)
          const projectDuration = getProjectDuration(project.start_date, project.end_date)
          const startPercent = (projectStart / totalTimespan) * 100
          const widthPercent = (projectDuration / totalTimespan) * 100

          return (
            <div key={project.id} className="relative">
              {/* Project Label */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-gray-900 truncate">
                    {project.name}
                  </h4>
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span>{formatDate(project.start_date)} - {formatDate(project.end_date)}</span>
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs ${
                      project.status === 'completed' ? 'bg-green-100 text-green-800' :
                      project.status === 'ongoing' ? 'bg-blue-100 text-blue-800' :
                      project.status === 'planning' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {project.status}
                    </span>
                  </div>
                </div>
                <div className="text-sm font-medium text-gray-700">
                  {Math.round(project.progress_percentage || 0)}%
                </div>
              </div>

              {/* Timeline Bar Background */}
              <div className="w-full h-6 bg-gray-200 rounded-full relative overflow-hidden">
                {/* Project Duration Bar */}
                <div 
                  className={`absolute top-0 h-full ${getStatusColor(project.status)} opacity-30 rounded-full`}
                  style={{
                    left: `${Math.max(0, Math.min(startPercent, 95))}%`,
                    width: `${Math.max(5, Math.min(widthPercent, 100 - startPercent))}%`
                  }}
                />
                
                {/* Progress Bar */}
                <div 
                  className={`absolute top-0 h-full ${getStatusColor(project.status)} rounded-full flex items-center px-2`}
                  style={{
                    left: `${Math.max(0, Math.min(startPercent, 95))}%`,
                    width: `${Math.max(2, Math.min((widthPercent * (project.progress_percentage || 0)) / 100, 100 - startPercent))}%`
                  }}
                >
                  <span className="text-xs text-white font-medium">
                    {project.progress_percentage >= 15 ? `${Math.round(project.progress_percentage || 0)}%` : ''}
                  </span>
                </div>
              </div>

              {/* Task Summary */}
              <div className="mt-1 text-xs text-gray-500">
                {project.total_tasks && (
                  <span>
                    {project.completed_tasks || 0} of {project.total_tasks} tasks completed
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex flex-wrap gap-4 text-xs">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded mr-2"></div>
            <span>Completed</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-500 rounded mr-2"></div>
            <span>Ongoing</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-yellow-500 rounded mr-2"></div>
            <span>Planning</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-500 rounded mr-2"></div>
            <span>Stopped</span>
          </div>
        </div>
      </div>
    </div>
  )
}
