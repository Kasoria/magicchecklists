import React from 'react';

const LockedOverlay = ({ message }) => {
    return (
        <div className="mcl-locked-overlay" style={{ display: 'flex' }}>
            <p>{message || 'This checklist is currently locked for editing by another user.'}</p>
        </div>
    );
};

export default React.memo(LockedOverlay); 