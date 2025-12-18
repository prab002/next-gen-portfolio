import React from 'react';
import styles from './Button.module.css';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  glow?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'md', glow = false, children, ...props }, ref) => {
    const variantClass = styles[variant];
    const sizeClass = styles[size];
    const glowClass = glow ? styles.glow : '';

    return (
      <button
        ref={ref}
        className={`${styles.button} ${variantClass} ${sizeClass} ${glowClass} ${className}`}
        {...props}
      >
        <span className={styles.content}>{children}</span>
      </button>
    );
  }
);

Button.displayName = 'Button';
