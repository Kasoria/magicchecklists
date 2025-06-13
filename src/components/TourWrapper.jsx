import { useState, useEffect } from 'react'
import TourCreator from './TourCreator.jsx'
import TourPlayback from './TourPlayback.jsx'
import TourTriggerButton from './TourTriggerButton.jsx'

const TourWrapper = ({ adminData, tourData = {}, onExit }) => {
  const [isCreatorMode, setIsCreatorMode] = useState(false)
  const [activeTours, setActiveTours] = useState([])
  const [triggerTours, setTriggerTours] = useState([])
  const [currentTourId, setCurrentTourId] = useState(0)
  const [continueTourId, setContinueTourId] = useState(0)
  const [continueStep, setContinueStep] = useState(0)

  useEffect(() => {
    // Check if explicitly set to creator mode via props
    if (tourData.isCreatorMode) {
      setIsCreatorMode(true)
      setCurrentTourId(tourData.currentTourId || 0)
      return
    }

    // Initialize based on URL parameters and tour data
    const urlParams = new URLSearchParams(window.location.search)
    
    // Check for tour creator mode
    const tourMode = urlParams.get('mcl_tour_mode')
    const tourId = parseInt(urlParams.get('tour_id')) || 0
    
    if (tourMode === '1') {
      setIsCreatorMode(true)
      setCurrentTourId(tourId)
    } else {
      // This is playback mode - handle tour continuation and normal tour loading
      const continueTour = parseInt(urlParams.get('mcl_continue_tour')) || 0
      const continueStepParam = parseInt(urlParams.get('mcl_tour_step')) || 0
      
      if (continueTour > 0) {
        setContinueTourId(continueTour)
        setContinueStep(continueStepParam)
      }
      
      // Load active tours for public view from multiple sources
      let toursToLoad = []
      
      if (tourData.activeTours && tourData.activeTours.length > 0) {
        toursToLoad = tourData.activeTours
      } else if (window.mclTourPlaybackData && window.mclTourPlaybackData.tours) {
        toursToLoad = window.mclTourPlaybackData.tours
      }
      
      if (toursToLoad.length > 0) {
        setActiveTours(toursToLoad)
        
        // Filter tours that should show trigger buttons
        const triggersToShow = toursToLoad.filter(tour => 
          tour.show_trigger_button && !tour.autostart
        )
        setTriggerTours(triggersToShow)
      }
    }
  }, [tourData])

  const handleExitCreator = () => {
    setIsCreatorMode(false)
    
    if (onExit) {
      // Use the callback provided by parent component
      onExit()
    } else {
      // Navigate back to admin tours page
      window.location.href = adminData.dashboard_url || '/wp-admin/admin.php?page=mcl_tours'
    }
  }

  const handleStartTour = (tour) => {
    if (window.mclTourPlayback) {
      window.mclTourPlayback.startTour(tour)
    }
  }

  // Always render TourPlayback for handling previews, even in creator mode
  return (
    <>
      {/* Tour Playback Service Component - always present for preview support */}
      <TourPlayback
        adminData={adminData}
        activeTours={activeTours}
        continueTourId={continueTourId}
        continueStep={continueStep}
      />
      
      {isCreatorMode ? (
        // Render tour creator interface
        <TourCreator
          adminData={adminData}
          tourId={currentTourId}
          onExit={handleExitCreator}
        />
      ) : (
        // Render tour trigger buttons for public interface
        <>
          {triggerTours.map((tour, index) => (
            <TourTriggerButton
              key={tour.id}
              tour={tour}
              onStartTour={handleStartTour}
              position={index === 0 ? 'bottom-right' : `bottom-${index * 80 + 20}`}
            />
          ))}
        </>
      )}
    </>
  )
}

export default TourWrapper 