import React from 'react';

const LockedOverlay = ({ message, adminData }) => {
    const i18n = adminData?.i18n || (typeof window !== 'undefined' && window.magicclAdminData?.i18n) || (typeof window !== 'undefined' && window.magiccl_checklists?.i18n) || {};

    return (
        <div className="magiccl-locked-overlay" style={{ display: 'flex' }}>
            <p>{message || i18n.lockedOverlay?.message || 'This checklist is currently locked for editing by another user.'}</p>
        </div>
    );
};

export default React.memo(LockedOverlay); 