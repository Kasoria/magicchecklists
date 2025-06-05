import React, { useEffect } from 'react';

const ResetNotification = ({ show, onClose }) => {
    useEffect(() => {
        if (show) {
            // Auto-hide after 5 seconds
            const timer = setTimeout(() => {
                onClose();
            }, 5000);

            return () => clearTimeout(timer);
        }
    }, [show, onClose]);

    if (!show) return null;

    return (
        <div className="mcl-notification mcl-reset-notification mcl-notification-visible">
            <div className="mcl-notification-content">
                <span className="mcl-notification-message">
                    This checklist has been automatically reset.
                </span>
                <button 
                    type="button" 
                    className="mcl-notification-close"
                    onClick={onClose}
                >
                    <span className="dashicons dashicons-no-alt"></span>
                </button>
            </div>
        </div>
    );
};

export default React.memo(ResetNotification); 