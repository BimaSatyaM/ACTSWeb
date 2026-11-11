import React from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary'
  children: React.ReactNode
}

export const Button: React.FC<ButtonProps> = ({ variant = 'primary', children, className = '', ...props }) => {
  const baseStyle = 'inline-flex items-center justify-center px-3.5 py-1.5 text-sm font-semibold rounded-none transition-all duration-300 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 hover:scale-[1.01] cursor-pointer'
  
  const variantStyle = variant === 'primary'
    ? 'bg-white/[0.02] hover:bg-white/[0.05] text-text-primary hover:text-white border border-white/[0.08] hover:border-accent-theme/30 shadow-[inset_0_1px_1px_rgba(255,255,255,0.06),0_8px_32px_0_rgba(0,0,0,0.37)] hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0.06),0_0_20px_rgba(255,46,84,0.15)] backdrop-blur-md'
    : 'bg-white/[0.01] hover:bg-white/[0.03] text-text-secondary hover:text-text-primary border border-white/[0.04] hover:border-white/[0.08] shadow-[0_4px_16px_rgba(0,0,0,0.2)] backdrop-blur-sm'

  return (
    <button className={`${baseStyle} ${variantStyle} ${className}`} {...props}>
      {children}
    </button>
  )
}
