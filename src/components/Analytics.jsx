import React, { useEffect, useState, useRef } from 'react'
import { Card, Button, Badge, Table, TableBody, TableCell, TableHead, TableHeadCell, TableRow, Dropdown, DropdownDivider, DropdownItem } from 'flowbite-react'
import ApexCharts from 'apexcharts'
import ConfirmationModal from './ConfirmationModal'
import { formatDate } from '../utils/dateUtils'

const Analytics = ({ adminData }) => {
  const [timeFilter, setTimeFilter] = useState('7')
  // analyticsData state, initialize from localized data
  const [analyticsData, setAnalyticsData] = useState(adminData.analytics || {})
  const chartInstancesRef = useRef({})
  const [isCleaningUp, setIsCleaningUp] = useState(false)
  const [showClearModal, setShowClearModal] = useState(false)

  // Get analytics data from adminData
  const {
    summary = {},
    all_analytics = [],
    trends = { dates: [], views: [], checks: [] },
    performance = { labels: [], views: [], checks: [] },
    completion_rates = { high_completion: 0, medium_completion: 0, low_completion: 0, not_used: 0 },
    recent_activity = []
  } = analyticsData

  const {
    total_checklists = 0,
    active_checklists = 0,
    total_views = 0,
    total_checks = 0,
    most_popular = null,
    most_checked_item = null,
    approaching_deadlines = []
  } = summary

  // Fetch comprehensive analytics via AJAX
  const fetchAnalytics = async () => {
    if (adminData.ajaxurl && adminData.nonces?.mcl_get_comprehensive_analytics) {
      const formData = new FormData()
      formData.append('action', 'mcl_get_comprehensive_analytics')
      formData.append('_ajax_nonce', adminData.nonces.mcl_get_comprehensive_analytics)
      formData.append('time_filter', timeFilter) // Add time filter parameter
      try {
        const response = await fetch(adminData.ajaxurl, { method: 'POST', body: formData })
        const json = await response.json()
        if (json.success) {
          console.log('Fetched analytics data:', json.data) // Debug log
          setAnalyticsData(json.data)
        } else {
          console.error('Failed to fetch analytics:', json.data)
        }
      } catch (error) {
        console.error('Error fetching analytics:', error)
      }
    }
  }

  // Fetch analytics on mount and when timeFilter changes
  useEffect(() => {
    fetchAnalytics()
  }, [timeFilter])

  // Function to clear all analytics data
  const clearAllAnalytics = async () => {
    setIsCleaningUp(true)
    try {
      const formData = new FormData()
      formData.append('action', 'mcl_cleanup_test_data')
      formData.append('_ajax_nonce', adminData.nonces.mcl_cleanup_test_data)
      
      const response = await fetch(adminData.ajaxurl, { method: 'POST', body: formData })
      const json = await response.json()
      
      if (json.success) {
        // Reload analytics data
        window.location.reload()
      } else {
        alert('Failed to clear analytics data: ' + (json.data || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error clearing analytics data:', error)
      alert('Error clearing analytics data')
    } finally {
      setIsCleaningUp(false)
    }
  }

  useEffect(() => {
    // Initialize charts when component mounts or data changes
    // Add delay to ensure DOM elements are properly rendered and visible
    const timer = setTimeout(() => {
      initializeCharts()
    }, 300)
    
    // Cleanup function
    return () => {
      clearTimeout(timer)
      Object.values(chartInstancesRef.current).forEach(chart => {
        if (chart && chart.destroy) {
          chart.destroy()
        }
      })
      chartInstancesRef.current = {}
    }
  }, [analyticsData]) // Use the main analyticsData object instead of destructured parts

  const initializeCharts = () => {
    // Cleanup existing charts
    Object.values(chartInstancesRef.current).forEach(chart => {
      if (chart && chart.destroy) {
        chart.destroy()
      }
    })

    // Clear chart instances
    chartInstancesRef.current = {}

    // Check if chart containers exist and are visible
    const trendsContainer = document.getElementById('trends-chart')
    const performanceContainer = document.getElementById('performance-chart')
    const completionContainer = document.getElementById('completion-chart')
    
    if (!trendsContainer || !performanceContainer || !completionContainer) {
      console.warn('Chart containers not found, skipping chart initialization')
      return
    }

    // Trends Line Chart
    if (trendsContainer && trends.dates && trends.dates.length > 0) {
      const trendsChart = new ApexCharts(document.getElementById('trends-chart'), {
        chart: {
          type: 'line',
          height: 350,
          fontFamily: 'Inter, sans-serif',
          toolbar: { show: false },
          background: 'transparent'
        },
        series: [
          {
            name: 'Views',
            data: trends.views || [],
            color: '#3B82F6'
          },
          {
            name: 'Checks',
            data: trends.checks || [],
            color: '#10B981'
          }
        ],
        xaxis: {
          categories: trends.dates || [],
          labels: {
            style: {
              colors: '#6B7280'
            }
          }
        },
        yaxis: {
          labels: {
            style: {
              colors: '#6B7280'
            }
          }
        },
        stroke: {
          curve: 'smooth',
          width: 3
        },
        grid: {
          borderColor: '#E5E7EB'
        },
        legend: {
          labels: {
            colors: '#6B7280'
          }
        },
        tooltip: {
          theme: 'light'
        }
      })
      trendsChart.render()
      chartInstancesRef.current.trends = trendsChart
    }
    
    // Performance Bar Chart
    if (performanceContainer && performance.labels && performance.labels.length > 0) {
      const performanceChart = new ApexCharts(document.getElementById('performance-chart'), {
        chart: {
          type: 'bar',
          height: 350,
          fontFamily: 'Inter, sans-serif',
          toolbar: { show: false },
          background: 'transparent'
        },
        series: [
          {
            name: 'Views',
            data: performance.views || [],
            color: '#3B82F6'
          },
          {
            name: 'Checks',
            data: performance.checks || [],
            color: '#10B981'
          }
        ],
        xaxis: {
          categories: performance.labels || [],
          labels: {
            style: {
              colors: '#6B7280'
            }
          }
        },
        yaxis: {
          labels: {
            style: {
              colors: '#6B7280'
            }
          }
        },
        grid: {
          borderColor: '#E5E7EB'
        },
        legend: {
          labels: {
            colors: '#6B7280'
          }
        },
        tooltip: {
          theme: 'light'
        },
        plotOptions: {
          bar: {
            horizontal: false,
            columnWidth: '55%'
          }
        }
      })
      performanceChart.render()
      chartInstancesRef.current.performance = performanceChart
    }
    
    // Completion Rates Donut Chart
    if (completionContainer) {
      const completionChart = new ApexCharts(document.getElementById('completion-chart'), {
        chart: {
          type: 'donut',
          height: 350,
          fontFamily: 'Inter, sans-serif',
          background: 'transparent'
        },
        series: [
          completion_rates.high_completion || 0,
          completion_rates.medium_completion || 0,
          completion_rates.low_completion || 0,
          completion_rates.not_used || 0
        ],
        labels: ['High Usage (10+)', 'Medium Usage (3-9)', 'Low Usage (1-2)', 'Unused'],
        colors: ['#10B981', '#3B82F6', '#F59E0B', '#6B7280'],
        legend: {
          labels: {
            colors: '#6B7280'
          }
        },
        tooltip: {
          theme: 'light'
        },
        plotOptions: {
          pie: {
            donut: {
              size: '65%'
            }
          }
        }
      })
      completionChart.render()
      chartInstancesRef.current.completion = completionChart
    }
  }



  const formatTimeAgo = (dateString) => {
    try {
      const date = new Date(dateString)
      const now = new Date()
      const diffMs = now - date
      const diffMins = Math.floor(diffMs / 60000)
      const diffHours = Math.floor(diffMins / 60)
      const diffDays = Math.floor(diffHours / 24)

      if (diffMins < 60) {
        return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`
      } else if (diffHours < 24) {
        return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`
      } else {
        return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`
      }
    } catch (e) {
      return 'Unknown'
    }
  }

  const getTimeFilterLabel = (filter) => {
    switch (filter) {
      case '7': return 'Last 7 Days'
      case '30': return 'Last 30 Days'
      case '90': return 'Last 90 Days'
      default: return 'Last 7 Days'
    }
  }

  return (
    <div className="space-y-6">

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
                  <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/>
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Views</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{total_views.toLocaleString()}</p>
            </div>
          </div>
        </Card>

        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Checks</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{total_checks.toLocaleString()}</p>
            </div>
          </div>
        </Card>

        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6.343 6.343a8 8 0 1 0 11.314 0M12 8V4"/>
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Checklists</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{active_checklists}</p>
            </div>
          </div>
        </Card>

        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Checklists</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{total_checklists}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Usage Trends Chart */}
        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Usage Trends ({getTimeFilterLabel(timeFilter)})</h3>
            <Dropdown label={getTimeFilterLabel(timeFilter)} color="light" size="sm">
              <DropdownItem onClick={() => setTimeFilter('7')}>Last 7 Days</DropdownItem>
              <DropdownItem onClick={() => setTimeFilter('30')}>Last 30 Days</DropdownItem>
              <DropdownItem onClick={() => setTimeFilter('90')}>Last 90 Days</DropdownItem>
            </Dropdown>
          </div>
          <div id="trends-chart"></div>
        </Card>

        {/* Completion Rates Chart */}
        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Item Usage Distribution</h3>
          </div>
          <div id="completion-chart"></div>
        </Card>
      </div>

      {/* Performance Chart - Full Width */}
      <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Top Performing Checklists</h3>
        </div>
        <div id="performance-chart"></div>
      </Card>

      {/* Analytics Table */}
      <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">All Checklists Analytics</h3>
        </div>
        {all_analytics && all_analytics.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeadCell>Checklist</TableHeadCell>
                  <TableHeadCell>Views</TableHeadCell>
                  <TableHeadCell>Last Viewed</TableHeadCell>
                  <TableHeadCell>Most Checked Items</TableHeadCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {all_analytics.map((item, index) => (
                  <TableRow key={index} className="bg-white dark:bg-gray-800 border-b dark:border-gray-700">
                    <TableCell>
                      <a 
                        href={`/wp-admin/admin.php?page=mcl_add_new&checklist_id=${item.checklist_id}`}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                      >
                        {item.title}
                      </a>
                    </TableCell>
                    <TableCell>
                      <Badge color="gray" className="inline-flex">
                        {item.view_count?.toLocaleString() || '0'} views
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500 dark:text-gray-400">
                      {item.last_viewed ? formatDate(item.last_viewed, 'datetime') : 'Never'}
                    </TableCell>
                    <TableCell>
                      {item.most_checked_items && item.most_checked_items.length > 0 ? (
                        <div className="space-y-1">
                          {item.most_checked_items.slice(0, 3).map((checkItem, idx) => (
                            <div key={idx} className="flex justify-between items-center text-sm">
                              <span 
                                className="text-gray-700 dark:text-gray-300 truncate max-w-xs"
                                dangerouslySetInnerHTML={{ __html: checkItem.item_content }}
                              />
                              <Badge color="info" size="xs" className="ml-2">
                                {checkItem.check_count}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-500 dark:text-gray-400 italic text-sm">No usage data</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">No analytics data available yet. Data will appear once your checklists are being used.</p>
          </div>
        )}
      </Card>

      {/* Recent Activity */}
      <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Recent Activity</h3>
        </div>
        {recent_activity && recent_activity.length > 0 ? (
          <div className="space-y-4">
            {recent_activity.map((activity, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    activity.activity_type === 'view' 
                      ? 'bg-blue-100 dark:bg-blue-900/30' 
                      : 'bg-green-100 dark:bg-green-900/30'
                  }`}>
                    {activity.activity_type === 'view' ? (
                      <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
                        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/>
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                      </svg>
                    )}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 dark:text-white">
                    {activity.activity_type === 'view' ? (
                      <>
                        Checklist <span className="font-medium">"{activity.post_title}"</span> was viewed
                      </>
                    ) : (
                      <>
                        Item <span className="font-medium" dangerouslySetInnerHTML={{ __html: activity.item_content }} /> 
                        was checked in <span className="font-medium">"{activity.post_title}"</span>
                      </>
                    )}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatTimeAgo(activity.activity_date)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">No recent activity to display.</p>
          </div>
        )}
      </Card>

      {/* Clear Analytics Section */}
      <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        <div className="text-center py-6 flex flex-col items-center">
          <div className="mb-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Clear Analytics Data
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              This will permanently delete all analytics data including views, item checks, and activity history.
            </p>
          </div>
          <Button 
            color="red" 
            size="sm" 
            onClick={() => setShowClearModal(true)}
            disabled={isCleaningUp}
          >
            {isCleaningUp ? 'Clearing...' : 'Clear All Analytics'}
          </Button>
        </div>
      </Card>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showClearModal}
        onClose={() => setShowClearModal(false)}
        onConfirm={clearAllAnalytics}
        title="Clear All Analytics Data?"
        message="This will permanently delete all analytics data including view counts, item check history, and activity logs. This action cannot be undone."
        confirmText="Yes, clear all data"
        cancelText="Cancel"
        confirmButtonClass="bg-red-600 hover:bg-red-700 focus:ring-red-300 dark:bg-red-500 dark:hover:bg-red-600 dark:focus:ring-red-900"
        icon="delete"
        items={[
          "All checklist view counts",
          "All item check history", 
          "All activity logs",
          "Chart and trend data"
        ]}
      />
    </div>
  )
}

export default Analytics 