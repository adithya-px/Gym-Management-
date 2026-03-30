import React from 'react';
import { GlowCard } from './GlowCard';

export const NeonCard = ({ children, title, value, accent = 'none', className = '' }) => {
    // Map existing accents to glow colors
    let cardClass = 'neon-card';
    let titleClass = 'card-title';
    let valueClass = 'card-value';
    let glowColor = 'blue';

    if (accent === 'primary') {
        cardClass += ' neon-card-primary';
        valueClass += ' text-accent-primary';
        glowColor = 'green';
    } else if (accent === 'secondary') {
        cardClass += ' neon-card-secondary';
        valueClass += ' text-accent-secondary';
        glowColor = 'blue';
    } else if (accent === 'tertiary') {
        cardClass += ' neon-card-accent';
        valueClass += ' text-accent-tertiary';
        glowColor = 'purple';
    } else if (accent === 'alert') {
        cardClass += ' neon-card-alert';
        valueClass += ' text-danger';
        glowColor = 'red';
    }

    return (
        <GlowCard className={`${cardClass} ${className}`} glowColor={glowColor} customSize={true}>
            {title && <div className={titleClass}>{title}</div>}
            {value && <div className={valueClass}>{value}</div>}
            {children}
        </GlowCard>
    );
};
