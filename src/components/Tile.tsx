import React from 'react';

interface TileProps {
    letter: string;
    type?: 'vowel' | 'consonant';
    selected?: boolean;
    onClick?: () => void;
    size?: 'sm' | 'md' | 'lg';
}

export const Tile: React.FC<TileProps> = ({
    letter,
    type = 'consonant',
    selected = false,
    onClick,
    size = 'md'
}) => {
    const sizeMap = {
        sm: '2rem',
        md: '3.5rem',
        lg: '5rem'
    };

    return (
        <div
            onClick={onClick}
            style={{
                width: sizeMap[size],
                height: sizeMap[size],
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--tile-bg)',
                border: `2px solid ${selected ? 'var(--primary)' : 'var(--tile-border)'}`,
                borderRadius: '12px',
                boxShadow: selected
                    ? '0 0 0 4px rgba(249, 115, 22, 0.2)'
                    : '0 4px 0 var(--tile-shadow)',
                fontSize: size === 'sm' ? '1rem' : '1.5rem',
                fontWeight: 800,
                color: type === 'vowel' ? 'var(--text-scent)' : 'var(--text-berry)',
                cursor: 'pointer',
                userSelect: 'none',
                transform: selected ? 'translateY(-2px)' : 'none',
                transition: 'all 0.1s ease',
                position: 'relative'
            }}
        >
            {letter.toUpperCase()}

            {/* Type Marker (optional visual cue) */}
            <div style={{
                position: 'absolute',
                bottom: '4px',
                width: '4px',
                height: '4px',
                borderRadius: '50%',
                background: type === 'vowel' ? 'var(--text-scent)' : 'var(--text-berry)',
                opacity: 0.3
            }} />
        </div>
    );
};
