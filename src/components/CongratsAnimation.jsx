import React, { useEffect, useState } from 'react';

const CongratsAnimation = ({ show }) => {
    const [confetti, setConfetti] = useState([]);
    const colors = ['#6c63ff', '#ff6b6b', '#ffd93d', '#6bff95', '#ff6bcd'];

    useEffect(() => {
        if (show) {
            // Create confetti pieces
            const confettiPieces = [];
            for (let i = 0; i < 50; i++) {
                confettiPieces.push({
                    id: i,
                    color: colors[Math.floor(Math.random() * colors.length)],
                    left: Math.random() * 100,
                    fallDuration: 1 + Math.random() * 2,
                    animationDelay: Math.random() * 0.5
                });
            }
            setConfetti(confettiPieces);
        } else {
            setConfetti([]);
        }
    }, [show]);

    if (!show) return null;

    return (
        <div className="mcl-congratulations active">
            <div className="mcl-congrats-content">
                <div className="mcl-congrats-message">
                    Great job! 🎉
                </div>
            </div>
            {confetti.map(piece => (
                <div
                    key={piece.id}
                    className="mcl-confetti"
                    style={{
                        backgroundColor: piece.color,
                        left: `${piece.left}%`,
                        '--fall-duration': `${piece.fallDuration}s`,
                        animationDelay: `${piece.animationDelay}s`
                    }}
                />
            ))}
        </div>
    );
};

export default React.memo(CongratsAnimation); 