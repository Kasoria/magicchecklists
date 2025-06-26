/**
 * Date formatting utility functions for MagicChecklists
 */

// Available date/time format options
export const DATE_FORMAT_OPTIONS = {
  'us': {
    label: 'US Format (MM/DD/YYYY)',
    date: { month: '2-digit', day: '2-digit', year: 'numeric' },
    time: { hour: '2-digit', minute: '2-digit', hour12: true },
    locale: 'en-US'
  },
  'eu': {
    label: 'European Format (DD/MM/YYYY)',
    date: { day: '2-digit', month: '2-digit', year: 'numeric' },
    time: { hour: '2-digit', minute: '2-digit', hour12: false },
    locale: 'en-GB'
  },
  'iso': {
    label: 'ISO Format (YYYY-MM-DD)',
    date: { year: 'numeric', month: '2-digit', day: '2-digit' },
    time: { hour: '2-digit', minute: '2-digit', hour12: false },
    locale: 'sv-SE' // Swedish locale naturally uses ISO format
  },
  'compact': {
    label: 'Compact Format (DD MMM YYYY)',
    date: { day: 'numeric', month: 'short', year: 'numeric' },
    time: { hour: '2-digit', minute: '2-digit', hour12: false },
    locale: 'en-US'
  },
  'long': {
    label: 'Long Format (Month DD, YYYY)',
    date: { month: 'long', day: 'numeric', year: 'numeric' },
    time: { hour: '2-digit', minute: '2-digit', hour12: true },
    locale: 'en-US'
  }
}

/**
 * Get the current date format setting from shared global settings
 * This uses the date format from the MagicPlugins shared settings
 */
const getDateFormatSetting = () => {
  try {
    const format = window.mcl_checklists?.settings?.dateFormat || 'us'
    const config = DATE_FORMAT_OPTIONS[format] || DATE_FORMAT_OPTIONS.us
    
    // Ensure we have a valid config
    if (!config || !config.locale) {
      console.warn('Invalid date format config, falling back to US format')
      return DATE_FORMAT_OPTIONS.us
    }
    
    return config
  } catch (error) {
    console.warn('Error getting date format setting:', error)
    return DATE_FORMAT_OPTIONS.us
  }
}

/**
 * Format a date using the user's preferred format
 * @param {Date|number|string} date - Date to format (Date object, timestamp, or date string)
 * @param {string} type - Type of formatting: 'date', 'time', 'datetime', 'short'
 * @param {object} customOptions - Custom formatting options to override defaults
 * @returns {string} Formatted date string
 */
export const formatDate = (date, type = 'datetime', customOptions = {}) => {
  // Handle null/undefined inputs
  if (date === null || date === undefined || date === '') {
    return 'No date'
  }
  
  try {
    // Convert input to Date object
    let dateObj
    if (typeof date === 'number') {
      // Handle both seconds and milliseconds timestamps
      // Additional validation for reasonable timestamp ranges
      if (date < 0) {
        throw new Error('Negative timestamp')
      }
      dateObj = new Date(date < 10000000000 ? date * 1000 : date)
    } else if (typeof date === 'string') {
      // Check if it's a numeric string (like '1749585600')
      if (!isNaN(Number(date))) {
        const numDate = Number(date)
        dateObj = new Date(numDate < 10000000000 ? numDate * 1000 : numDate)
      } else {
        dateObj = new Date(date)
      }
    } else if (date instanceof Date) {
      dateObj = date
    } else {
      throw new Error('Invalid date input')
    }

    // Check if date is valid
    if (isNaN(dateObj.getTime())) {
      throw new Error('Invalid date')
    }

    const formatConfig = getDateFormatSetting()
    let options = {}

    switch (type) {
      case 'date':
        options = { ...formatConfig.date, ...customOptions }
        break
      case 'time':
        options = { ...formatConfig.time, ...customOptions }
        break
      case 'datetime':
        options = { ...formatConfig.date, ...formatConfig.time, ...customOptions }
        break
      case 'short':
        // Short format for space-constrained areas like badges
        options = { 
          month: 'short', 
          day: 'numeric',
          ...customOptions 
        }
        break
      default:
        options = { ...formatConfig.date, ...formatConfig.time, ...customOptions }
    }

    // Try the formatted approach first
    try {
      const result = dateObj.toLocaleDateString(formatConfig.locale, options)
      if (result && result !== 'Invalid Date') {
        return result
      }
      throw new Error('Invalid result from toLocaleDateString')
    } catch (localeError) {
      // Fallback to simple US locale if there's an issue with the configured locale
      console.warn('Locale formatting failed, trying US fallback:', localeError)
      const fallbackResult = dateObj.toLocaleDateString('en-US', options)
      if (fallbackResult && fallbackResult !== 'Invalid Date') {
        return fallbackResult
      }
      throw localeError
    }
  } catch (error) {
    // Fallback to basic formatting with proper timestamp handling
    try {
      const fallbackDate = typeof date === 'number' && date < 10000000000 ? date * 1000 : date
      return new Date(fallbackDate).toLocaleString()
    } catch (fallbackError) {
      return 'Invalid date'
    }
  }
}

/**
 * Format a relative time (e.g., "2 hours ago", "in 3 days")
 * @param {Date|number|string} date - Date to format
 * @param {Date|number|string} baseDate - Base date to compare against (defaults to now)
 * @returns {string} Relative time string
 */
export const formatRelativeTime = (date, baseDate = new Date()) => {
  try {
    const dateObj = typeof date === 'number' 
      ? new Date(date < 10000000000 ? date * 1000 : date)
      : new Date(date)
    
    const baseObj = typeof baseDate === 'number'
      ? new Date(baseDate < 10000000000 ? baseDate * 1000 : baseDate)
      : new Date(baseDate)

    const diffMs = dateObj.getTime() - baseObj.getTime()
    const diffSeconds = Math.floor(diffMs / 1000)
    const diffMinutes = Math.floor(diffSeconds / 60)
    const diffHours = Math.floor(diffMinutes / 60)
    const diffDays = Math.floor(diffHours / 24)

    // If the difference is more than 7 days, show absolute date
    if (Math.abs(diffDays) > 7) {
      return formatDate(date, 'date')
    }

    // Use relative time formatting
    if (Math.abs(diffSeconds) < 60) {
      return diffSeconds >= 0 ? 'just now' : 'just now'
    } else if (Math.abs(diffMinutes) < 60) {
      const mins = Math.abs(diffMinutes)
      return diffMinutes >= 0 
        ? `in ${mins} minute${mins !== 1 ? 's' : ''}`
        : `${mins} minute${mins !== 1 ? 's' : ''} ago`
    } else if (Math.abs(diffHours) < 24) {
      const hrs = Math.abs(diffHours)
      return diffHours >= 0
        ? `in ${hrs} hour${hrs !== 1 ? 's' : ''}`
        : `${hrs} hour${hrs !== 1 ? 's' : ''} ago`
    } else {
      const days = Math.abs(diffDays)
      return diffDays >= 0
        ? `in ${days} day${days !== 1 ? 's' : ''}`
        : `${days} day${days !== 1 ? 's' : ''} ago`
    }
  } catch (error) {
    console.warn('Relative time formatting error:', error)
    return formatDate(date, 'date')
  }
}

/**
 * Format a countdown to a deadline
 * @param {Date|number|string} deadline - Deadline date
 * @param {Date|number|string} currentTime - Current time (defaults to now)
 * @returns {object} Object with formatted countdown and status
 */
export const formatDeadlineCountdown = (deadline, currentTime = null) => {
  try {
    // Handle both numbers and numeric strings
    let deadlineTimestamp
    if (typeof deadline === 'number') {
      deadlineTimestamp = deadline < 10000000000 ? deadline * 1000 : deadline
    } else if (typeof deadline === 'string' && !isNaN(Number(deadline))) {
      // Convert numeric string to number, then apply timestamp logic
      const numDeadline = Number(deadline)
      deadlineTimestamp = numDeadline < 10000000000 ? numDeadline * 1000 : numDeadline
    } else {
      // Try to parse as date string
      deadlineTimestamp = new Date(deadline).getTime()
    }
    
    const deadlineObj = new Date(deadlineTimestamp)
    
    // Always get current time as timestamp for consistent handling
    const nowTimestamp = currentTime 
      ? (typeof currentTime === 'number' 
          ? (currentTime < 10000000000 ? currentTime * 1000 : currentTime)
          : new Date(currentTime).getTime())
      : Date.now()
    
    const currentObj = new Date(nowTimestamp)

    // Validate both dates
    if (isNaN(deadlineObj.getTime()) || isNaN(currentObj.getTime())) {
      throw new Error('Invalid date objects')
    }

    const timeLeft = deadlineObj.getTime() - currentObj.getTime()

    if (timeLeft < 0) {
      return {
        text: `Deadline passed (${formatDate(deadline, 'datetime')})`,
        status: 'passed',
        urgent: true
      }
    }

    const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24))
    const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60))

    let text = ''
    let status = 'normal'
    let urgent = false

    if (days > 0) {
      text = `${days}d ${hours}h remaining`
    } else if (hours > 0) {
      text = `${hours}h ${minutes}m remaining`
    } else {
      text = `${minutes}m remaining`
    }

    // Determine urgency
    if (timeLeft < 2 * 60 * 60 * 1000) { // 2 hours
      status = 'critical'
      urgent = true
    } else if (timeLeft < 24 * 60 * 60 * 1000) { // 24 hours
      status = 'warning'
      urgent = false
    }

    return { text, status, urgent }
  } catch (error) {
    console.warn('Deadline countdown formatting error:', error)
    return {
      text: 'Invalid deadline',
      status: 'error',
      urgent: false
    }
  }
}

/**
 * Get available format options for use in settings
 */
export const getAvailableFormats = () => {
  return Object.entries(DATE_FORMAT_OPTIONS).map(([key, config]) => ({
    value: key,
    label: config.label,
    example: formatExampleDate(config)
  }))
}

/**
 * Format an example date to show in format selection
 */
const formatExampleDate = (formatConfig) => {
  const exampleDate = new Date(2024, 2, 15, 14, 30) // March 15, 2024, 2:30 PM
  
  try {
    const dateStr = exampleDate.toLocaleDateString(formatConfig.locale, formatConfig.date)
    const timeStr = exampleDate.toLocaleDateString(formatConfig.locale, formatConfig.time)
    return `${dateStr} ${timeStr}`
  } catch (error) {
    return 'Example format'
  }
}

// Export default formatDate for easier importing
export default formatDate 