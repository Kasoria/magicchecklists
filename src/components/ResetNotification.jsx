import React, { useEffect, useState } from 'react';

const ResetNotification = ({ show, onClose, adminData }) => {
    const i18n = adminData?.i18n || (typeof window !== 'undefined' && window.mclAdminData?.i18n) || (typeof window !== 'undefined' && window.mcl_checklists?.i18n) || {};
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
                    {i18n.resetNotification?.message || 'This checklist has been automatically reset.'}
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