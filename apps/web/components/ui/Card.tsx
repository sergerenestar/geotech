import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
}

export default function Card({ children, className = '' }: CardProps) {
  return (
    <div className={`bg-surface rounded-card shadow-card p-6 ${className}`}>
      {children}
    </div>
  );
}
