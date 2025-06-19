import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  leftIcon,
  rightIcon,
  className = '',
  ...props
}) => {
  const baseStyles = 'font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 ease-in-out flex items-center justify-center gap-2 transform active:scale-[0.98]';

  const variantStyles = {
    primary: 'bg-primary text-white hover:bg-primary-hover focus:ring-primary focus:ring-offset-backgroundLight dark:focus:ring-offset-background',
    secondary: 'bg-secondary text-white hover:bg-pink-600 focus:ring-secondary focus:ring-offset-backgroundLight dark:focus:ring-offset-background',
    danger: 'bg-danger text-white hover:bg-danger-hover focus:ring-danger focus:ring-offset-backgroundLight dark:focus:ring-offset-background',
    ghost: 'bg-transparent text-textPrimaryLight dark:text-textPrimary hover:bg-gray-200 dark:hover:bg-surface-lighter focus:ring-primary focus:ring-offset-backgroundLight dark:focus:ring-offset-background',
    outline: 'bg-transparent text-textPrimaryLight dark:text-textPrimary border border-borderLight dark:border-borderDark hover:bg-gray-100 dark:hover:bg-surface focus:ring-primary focus:ring-offset-backgroundLight dark:focus:ring-offset-background',
  };

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className} hover:brightness-110 active:brightness-90`}
      {...props}
    >
      {leftIcon}
      {children}
      {rightIcon}
    </button>
  );
};