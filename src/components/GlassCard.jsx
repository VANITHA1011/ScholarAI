import React from 'react';

export const GlassCard = ({ children, className = '', hoverEffect = false, ...props }) => {
  return (
    <div
      className={`glass-panel p-6 sm:p-8 rounded-2xl ${
        hoverEffect ? 'glass-panel-hover' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
