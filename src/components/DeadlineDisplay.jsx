import React, { useState, useEffect } from 'react';
import { formatDate, formatDeadlineCountdown } from '../utils/dateUtils';

const DeadlineDisplay = ({ deadline }) => {
    // Get i18n data
    const i18n = (typeof window !== 'undefined' && (window.mclAdminData?.i18n || window.mclPublicData?.i18n)) || {};
    const [countdown, setCountdown] = useState('');
    const [deadlineClass, setDeadlineClass] = useState('');

    useEffect(() => {
        if (!deadline) return;

        const updateCountdown = () => {
            const countdownData = formatDeadlineCountdown(deadline);
            
            setCountdown(countdownData.text);

            // Set appropriate warning class based on status
            switch (countdownData.status) {
                case 'passed':
                    setDeadlineClass('mcl-deadline-passed');
                    break;
                case 'critical':
                    setDeadlineClass('mcl-deadline-2h');
                    break;
                case 'warning':
                    setDeadlineClass('mcl-deadline-24h');
                    break;
                default:
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
                <span className="mcl-deadline-label">{i18n.deadlineDisplay?.deadline || 'Deadline'}:</span>
                <span id="mcl-countdown" className="mcl-countdown" data-deadline={deadline}>
                    {countdown}
                </span>
            </div>
        </div>
    );
};

export default React.memo(DeadlineDisplay); 