import { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  children: ReactNode;
}

export default function Button({ variant = 'primary', children, className = '', ...props }: ButtonProps) {
  const base = 'px-4 py-2 rounded-lg font-medium text-sm transition-opacity focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50';
  const styles = {
    primary: 'bg-brand-gradient text-white focus:ring-blue-500',
    secondary: 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 focus:ring-gray-400',
  };
  return (
    <button className={`${base} ${styles[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}
