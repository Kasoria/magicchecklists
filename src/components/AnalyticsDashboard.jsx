import React from 'react'
import { Card, Badge, Button } from 'flowbite-react'
import { formatDate as formatDateUtil } from '../utils/dateUtils'

const AnalyticsDashboard = ({ analyticsData, adminData }) => {
  if (!analyticsData) {
    return null
  }

  const {
    total_checklists = 0,
    active_checklists = 0,
    total_views = 0,
    total_checks = 0,
    most_popular = null,
    most_checked_item = null,
    approaching_deadlines = []
  } = analyticsData

  const formatTimeRemaining = (timeRemaining) => {
    if (timeRemaining < 0) {
      return <Badge color="failure" className="inline-flex">Overdue</Badge>
    }

    const hours = Math.floor(timeRemaining / 3600)
    const days = Math.floor(hours / 24)

    if (days > 0) {
      return (
        <Badge color={days <= 1 ? "warning" : "gray"} className="inline-flex">
          {days} {days === 1 ? 'day' : 'days'}
        </Badge>
      )
    } else {
      return (
        <Badge color={hours < 12 ? "failure" : hours < 24 ? "warning" : "gray"} className="inline-flex">
          {hours} {hours === 1 ? 'hour' : 'hours'}
        </Badge>
      )
    }
  }

  const formatDate = (timestamp) => {
    try {
      return formatDateUtil(timestamp, 'datetime')
    } catch (e) {
      return 'Invalid date'
    }
  }

  return (
    <div className="mb-8 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Checklist Analytics Overview
        </h2>
        <Button 
          color="light" 
          size="sm"
          onClick={() => window.location.href = `${window.location.origin}/wp-admin/admin.php?page=mcl_checklists&view=analytics`}
        >
          View Full Analytics
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
                  <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/>
                </svg>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Views</h3>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {total_views.toLocaleString()}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                </svg>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Checks</h3>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {total_checks.toLocaleString()}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M6.343 6.343a8 8 0 1 0 11.314 0M12 8V4"/>
                </svg>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Checklists</h3>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {active_checklists}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Approaching Deadlines */}
      {approaching_deadlines && approaching_deadlines.length > 0 && (
        <Card>
          <div className="mb-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Approaching Deadlines
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                <tr>
                  <th className="px-4 py-2">Checklist</th>
                  <th className="px-4 py-2">Item</th>
                  <th className="px-4 py-2">Deadline</th>
                  <th className="px-4 py-2">Time Remaining</th>
                </tr>
              </thead>
              <tbody>
                {approaching_deadlines.map((deadline, index) => (
                  <tr key={index} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        <a 
                          href={`/wp-admin/admin.php?page=mcl_add_new&checklist_id=${deadline.checklist_id}`}
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          {deadline.checklist_title}
                        </a>
                        {deadline.is_checklist_deadline && (
                          <Badge color="info" className="inline-flex" size="xs">
                            Checklist Deadline
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td 
                      className="px-4 py-2"
                      dangerouslySetInnerHTML={{ __html: deadline.item_content }}
                    />
                    <td className="px-4 py-2">
                      {deadline.deadline > 86400 ? formatDate(deadline.deadline) : 'Invalid date'}
                    </td>
                    <td className="px-4 py-2">
                      {formatTimeRemaining(deadline.time_remaining)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Bottom Row: Most Popular & Most Checked */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Most Popular Checklist */}
        {most_popular && (
          <Card>
            <div className="mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Most Popular Checklist
              </h3>
            </div>
            <div className="flex justify-between items-center">
              <div>
                <a 
                  href={`/wp-admin/admin.php?page=mcl_add_new&checklist_id=${most_popular.checklist_id}`}
                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                >
                  {most_popular.post_title}
                </a>
              </div>
              <Badge color="gray">
                {most_popular.view_count === 1 
                  ? `${most_popular.view_count.toLocaleString()} view`
                  : `${most_popular.view_count.toLocaleString()} views`
                }
              </Badge>
            </div>
          </Card>
        )}

        {/* Most Checked Item */}
        {most_checked_item && (
          <Card>
            <div className="mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Most Checked Item
              </h3>
            </div>
            <div className="space-y-2">
              <div 
                className="text-gray-700 dark:text-gray-300"
                dangerouslySetInnerHTML={{ __html: most_checked_item.item_content }}
              />
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 dark:text-gray-400">
                  in{' '}
                  <a 
                    href={`/wp-admin/admin.php?page=mcl_add_new&checklist_id=${most_checked_item.checklist_id}`}
                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    {most_checked_item.post_title}
                  </a>
                </span>
                <Badge color="gray">
                  {most_checked_item.check_count === 1 
                    ? `${most_checked_item.check_count.toLocaleString()} check`
                    : `${most_checked_item.check_count.toLocaleString()} checks`
                  }
                </Badge>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}

export default AnalyticsDashboard 