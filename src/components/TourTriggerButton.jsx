import { useState, useEffect } from 'react'
import { Button } from 'flowbite-react'

const TourTriggerButton = ({ tour, onStartTour, position = 'bottom-right' }) => {
  const [isVisible, setIsVisible] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  useEffect(() => {
    // Show button after a delay to ensure page is loaded
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  const handleClick = () => {
    if (onStartTour) {
      onStartTour(tour)
    } else if (window.magicclTourPlayback) {
      window.magicclTourPlayback.startTour(tour)
    }
  }

  const getPositionClasses = () => {
    const baseClasses = 'fixed z-50 transition-all duration-300'
    
    switch (position) {
      case 'bottom-right':
        return `${baseClasses} bottom-5 right-5`
      case 'bottom-left':
        return `${baseClasses} bottom-5 left-5`
      case 'top-right':
        return `${baseClasses} top-5 right-5`
      case 'top-left':
        return `${baseClasses} top-5 left-5`
      case 'bottom-center':
        return `${baseClasses} bottom-5 left-1/2 transform -translate-x-1/2`
      case 'top-center':
        return `${baseClasses} top-5 left-1/2 transform -translate-x-1/2`
      default:
        return `${baseClasses} bottom-5 right-5`
    }
  }

  if (!isVisible || !tour) {
    return null
  }

  return (
    <div className={getPositionClasses()}>
      <Button
        className={`
          magiccl-tour-trigger-btn
          bg-blue-600 hover:bg-blue-700 text-white
          rounded-full w-16 h-16 p-0
          shadow-lg hover:shadow-xl
          transform transition-all duration-200
          ${isHovered ? 'scale-110' : 'scale-100'}
          flex items-center justify-center
        `}
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        title={tour.title ? `Start tour: ${tour.title}` : 'Start tour'}
        aria-label={tour.title ? `Start tour: ${tour.title}` : 'Start tour'}
      >
        <svg 
          className="w-8 h-8" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
          />
        </svg>
        
        {/* Pulse animation ring */}
        <div className={`
          absolute inset-0 rounded-full
          bg-blue-400 opacity-30
          animate-ping
          ${isHovered ? 'opacity-50' : 'opacity-30'}
        `} />
      </Button>
      
      {/* Optional tooltip on hover */}
      {isHovered && tour.title && (
        <div className={`
          absolute mb-2 px-3 py-2
          bg-gray-900 text-white text-sm rounded-lg
          whitespace-nowrap z-10
          ${position.includes('bottom') ? 'bottom-full' : 'top-full'}
          ${position.includes('right') ? 'right-0' : 'left-0'}
          transform transition-opacity duration-200
        `}>
          {tour.title}
          <div className={`
            absolute w-2 h-2 bg-gray-900 transform rotate-45
            ${position.includes('bottom') ? 'top-full -mt-1' : 'bottom-full -mb-1'}
            ${position.includes('right') ? 'right-4' : 'left-4'}
          `} />
        </div>
      )}
    </div>
  )
}

export default TourTriggerButton 