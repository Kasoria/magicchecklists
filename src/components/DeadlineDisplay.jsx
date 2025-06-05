import React, { useState, useEffect } from 'react';

const DeadlineDisplay = ({ deadline }) => {
    const [countdown, setCountdown] = useState('');
    const [deadlineClass, setDeadlineClass] = useState('');

    useEffect(() => {
        if (!deadline) return;

        const updateCountdown = () => {
            const now = new Date();
            const deadlineDate = new Date(parseInt(deadline) * 1000);
            const distance = deadlineDate.getTime() - now.getTime();

            if (distance < 0) {
                setCountdown(`Passed (${deadlineDate.toLocaleString()})`);
                setDeadlineClass('mcl-deadline-passed');
                return;
            }

            // Calculate time components
            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));

            // Format countdown
            let countdownText;
            if (days > 0) {
                countdownText = `${days}d ${hours}h remaining`;
            } else if (hours > 0) {
                countdownText = `${hours}h ${minutes}m remaining`;
            } else {
                countdownText = `${minutes}m remaining`;
            }

            setCountdown(countdownText);

            // Set appropriate warning class
            if (distance < 7200000) { // 2 hours
                setDeadlineClass('mcl-deadline-2h');
            } else if (distance < 86400000) { // 24 hours
                setDeadlineClass('mcl-deadline-24h');
            } else {
                setDeadlineClass('');
            }
        };

        // Update immediately
        updateCountdown();

        // Update every minute
        const interval = setInterval(updateCountdown, 60000);

        return () => clearInterval(interval);
    }, [deadline]);

    if (!deadline) return null;

    return (
        <div className={`mcl-deadline ${deadlineClass}`} id="mcl-deadline-container">
            <div className="mcl-deadline-info">
                <span className="mcl-deadline-label">Deadline:</span>
                <span id="mcl-countdown" className="mcl-countdown" data-deadline={deadline}>
                    {countdown}
                </span>
            </div>
        </div>
    );
};

export default React.memo(DeadlineDisplay); 