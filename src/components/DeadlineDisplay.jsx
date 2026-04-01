import React, { useState, useEffect } from 'react';
import { formatDate, formatDeadlineCountdown } from '../utils/dateUtils';

const DeadlineDisplay = ({ deadline }) => {
    // Get i18n data
    const i18n = (typeof window !== 'undefined' && (window.magicclAdminData?.i18n || window.magicclPublicData?.i18n)) || {};
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
                    setDeadlineClass('magiccl-deadline-passed');
                    break;
                case 'critical':
                    setDeadlineClass('magiccl-deadline-2h');
                    break;
                case 'warning':
                    setDeadlineClass('magiccl-deadline-24h');
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
        <div className={`magiccl-deadline ${deadlineClass}`} id="magiccl-deadline-container">
            <div className="magiccl-deadline-info">
                <span className="magiccl-deadline-label">{i18n.deadlineDisplay?.deadline || 'Deadline'}:</span>
                <span id="magiccl-countdown" className="magiccl-countdown" data-deadline={deadline}>
                    {countdown}
                </span>
            </div>
        </div>
    );
};

export default React.memo(DeadlineDisplay); 