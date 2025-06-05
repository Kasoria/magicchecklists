import { Card, Button } from 'flowbite-react'

const Analytics = () => {
  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white dark:bg-brand-dark border border-gray-200 dark:border-gray-600">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v6a2 2 0 002 2h6a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Checklists</p>
              <p className="text-2xl font-bold text-brand-dark dark:text-white">12</p>
            </div>
          </div>
        </Card>

        <Card className="bg-white dark:bg-brand-dark border border-gray-200 dark:border-gray-600">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Checklists</p>
              <p className="text-2xl font-bold text-brand-dark dark:text-white">8</p>
            </div>
          </div>
        </Card>

        <Card className="bg-white dark:bg-brand-dark border border-gray-200 dark:border-gray-600">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Completions Today</p>
              <p className="text-2xl font-bold text-brand-dark dark:text-white">24</p>
            </div>
          </div>
        </Card>

        <Card className="bg-white dark:bg-brand-dark border border-gray-200 dark:border-gray-600">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Completion Rate</p>
              <p className="text-2xl font-bold text-brand-dark dark:text-white">87%</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Charts Placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white dark:bg-brand-dark border border-gray-200 dark:border-gray-600">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-brand-dark dark:text-white">Usage Over Time</h3>
            <Button 
              size="sm" 
              color="gray"
              className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 border-gray-300 dark:border-gray-600"
            >
              View Details
            </Button>
          </div>
          <div className="h-64 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <svg className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <p className="text-gray-500 dark:text-gray-400">Chart coming soon</p>
            </div>
          </div>
        </Card>

        <Card className="bg-white dark:bg-brand-dark border border-gray-200 dark:border-gray-600">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-brand-dark dark:text-white">Popular Checklists</h3>
            <Button 
              size="sm" 
              color="gray"
              className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 border-gray-300 dark:border-gray-600"
            >
              View All
            </Button>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div>
                <p className="font-medium text-brand-dark dark:text-white">Website Launch Checklist</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">45 completions this week</p>
              </div>
              <div className="text-right">
                <span className="text-sm font-medium text-green-600 dark:text-green-400">+12%</span>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div>
                <p className="font-medium text-brand-dark dark:text-white">Content Review Process</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">32 completions this week</p>
              </div>
              <div className="text-right">
                <span className="text-sm font-medium text-green-600 dark:text-green-400">+8%</span>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div>
                <p className="font-medium text-brand-dark dark:text-white">SEO Optimization</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">28 completions this week</p>
              </div>
              <div className="text-right">
                <span className="text-sm font-medium text-red-600 dark:text-red-400">-3%</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="bg-white dark:bg-brand-dark border border-gray-200 dark:border-gray-600">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-brand-dark dark:text-white">Recent Activity</h3>
          <Button 
            size="sm" 
            color="gray"
            className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 border-gray-300 dark:border-gray-600"
          >
            View All Activity
          </Button>
        </div>
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-brand-dark dark:text-white">
                <span className="font-medium">John Doe</span> created a new checklist
                <span className="font-medium"> "Product Launch Checklist"</span>
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">2 hours ago</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-brand-dark dark:text-white">
                <span className="font-medium">Sarah Wilson</span> completed
                <span className="font-medium"> "Content Review Process"</span>
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">4 hours ago</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-brand-dark dark:text-white">
                <span className="font-medium">Mike Johnson</span> updated
                <span className="font-medium"> "SEO Optimization"</span> checklist
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Yesterday</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default Analytics 