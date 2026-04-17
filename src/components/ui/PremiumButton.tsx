import React from 'react'

interface PremiumButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost'
  children: React.ReactNode
}

const PremiumButton: React.FC<PremiumButtonProps> = ({ 
  variant = 'primary', 
  children, 
  className = '', 
  ...props 
}) => {
  const baseStyles = 'px-8 py-3 font-bold rounded-full transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg'
  
  const variants = {
    primary: 'bg-gradient-to-br from-primary to-primary-container text-white shadow-primary/20',
    secondary: 'bg-secondary text-white shadow-secondary/20',
    ghost: 'bg-transparent text-primary hover:bg-primary/5 shadow-none'
  }

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

export default PremiumButton
