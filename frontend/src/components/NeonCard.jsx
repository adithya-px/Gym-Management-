import React from 'react';

export const NeonCard = ({ children, title, value, accent = 'none', className = '' }) => {
    // accent can be 'none', 'primary', 'secondary', 'tertiary', 'alert'
    let cardClass = 'neon-card';
    let titleClass = 'card-title';
    let valueClass = 'card-value';

    if (accent === 'primary') {
        cardClass += ' neon-card-primary';
        valueClass += ' text-accent-primary';
    } else if (accent === 'secondary') {
        cardClass += ' neon-card-secondary';
        valueClass += ' text-accent-secondary';
    } else if (accent === 'tertiary') {
        cardClass += ' neon-card-accent';
        valueClass += ' text-accent-tertiary';
    } else if (accent === 'alert') {
        cardClass += ' neon-card-alert';
        valueClass += ' text-danger';
    }

    return (
        <div className={`${cardClass} ${className}`}>
            {title && <div className={titleClass}>{title}</div>}
            {value && <div className={valueClass}>{value}</div>}
            {children}
        </div>
    );
};
