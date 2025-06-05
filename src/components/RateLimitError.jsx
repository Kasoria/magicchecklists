import React, { useEffect, useState } from 'react';

const RateLimitError = ({ type, message, onClose }) => {
    const [countdown, setCountdown] = useState(null);

    useEffect(() => {
        if (!message) return;

        // Extract countdown from message if present
        const countdownMatch = message.match(/(\d+)\s+second/);
        if (countdownMatch) {
            let remainingSeconds = parseInt(countdownMatch[1]);
            setCountdown(remainingSeconds);

            const interval = setInterval(() => {
                remainingSeconds -= 1;
                if (remainingSeconds <= 0) {
                    clearInterval(interval);
                    onClose();
                    return;
                }
                setCountdown(remainingSeconds);
            }, 1000);

            return () => clearInterval(interval);
        }
    }, [message, onClose]);

    if (!message) return null;

    const displayMessage = countdown !== null 
        ? message.replace(/\d+\s+second(?:s)?/, `${countdown} second${countdown !== 1 ? 's' : ''}`)
        : message;

    const containerClass = type === 'global' 
        ? 'mcl-rate-limit-error mcl-global-error' 
        : 'mcl-rate-limit-error mcl-drawer-error';

    return (
        <div className={`${containerClass} active`}>
            <div className="mcl-rate-limit-error-content">
                <svg 
                    className="mcl-rate-limit-icon" 
                    width="24" 
                    height="24" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path 
                        fillRule="evenodd" 
                        clipRule="evenodd" 
                        d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22ZM12 7C12.5523 7 13 7.44772 13 8V12C13 12.5523 12.5523 13 12 13C11.4477 13 11 12.5523 11 12V8C11 7.44772 11.4477 7 12 7ZM12 15C12.5523 15 13 15.4477 13 16C13 16.5523 12.5523 17 12 17C11.4477 17 11 16.5523 11 16C11 15.4477 11.4477 15 12 15Z" 
                        fill="currentColor"
                    />
                </svg>
                <span className="mcl-rate-limit-message">{displayMessage}</span>
                <button className="mcl-rate-limit-close" onClick={onClose}>×</button>
            </div>
        </div>
    );
};

export default React.memo(RateLimitError); 