import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  LineElement,
  PointElement,
} from 'chart.js'
import { Bar, Pie, Line } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  LineElement,
  PointElement
)

export default function ProjectProgressChart({ projects = [] }) {
  // Prepare data for bar chart
  const barData = {
    labels: projects.map(p => p.name || 'Unknown Project').slice(0, 10), // Limit to 10 projects
    datasets: [
      {
        label: 'Progress %',
        data: projects.map(p => p.progress_percentage || 0).slice(0, 10),
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
      },
    ],
  }

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Project Progress Overview',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          callback: function(value) {
            return value + '%'
          }
        }
      },
    },
  }

  // Prepare data for pie chart (project status distribution)
  const statusCounts = projects.reduce((acc, project) => {
    const status = project.status || 'unknown'
    acc[status] = (acc[status] || 0) + 1
    return acc
  }, {})

  const pieData = {
    labels: Object.keys(statusCounts),
    datasets: [
      {
        label: 'Projects',
        data: Object.values(statusCounts),
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',   // Green for completed
          'rgba(59, 130, 246, 0.8)',  // Blue for ongoing
          'rgba(249, 115, 22, 0.8)',  // Orange for planning
          'rgba(239, 68, 68, 0.8)',   // Red for stopped
          'rgba(156, 163, 175, 0.8)', // Gray for unknown
        ],
        borderColor: [
          'rgba(34, 197, 94, 1)',
          'rgba(59, 130, 246, 1)',
          'rgba(249, 115, 22, 1)',
          'rgba(239, 68, 68, 1)',
          'rgba(156, 163, 175, 1)',
        ],
        borderWidth: 1,
      },
    ],
  }

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
      },
      title: {
        display: true,
        text: 'Project Status Distribution',
      },
    },
  }

  // Prepare data for completion rate trend (simplified)
  const completionData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Average Progress',
        data: [20, 35, 45, 55, 65, 75], // Mock data - in real implementation, this would come from API
        borderColor: 'rgba(59, 130, 246, 1)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
      },
    ],
  }

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Progress Trend Over Time',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          callback: function(value) {
            return value + '%'
          }
        }
      },
    },
  }

  if (projects.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <div className="text-lg font-medium">No project data available</div>
        <p className="text-sm mt-2">Create some projects to see progress charts</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Progress Bar Chart */}
      <div className="bg-white rounded-xl border border-border p-6 shadow-soft">
        <div className="h-80">
          <Bar data={barData} options={barOptions} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution Pie Chart */}
        <div className="bg-white rounded-xl border border-border p-6 shadow-soft">
          <div className="h-64">
            <Pie data={pieData} options={pieOptions} />
          </div>
        </div>

        {/* Progress Trend Line Chart */}
        <div className="bg-white rounded-xl border border-border p-6 shadow-soft">
          <div className="h-64">
            <Line data={completionData} options={lineOptions} />
          </div>
        </div>
      </div>
    </div>
  )
}
