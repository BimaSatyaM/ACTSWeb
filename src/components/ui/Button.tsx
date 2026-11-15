import React from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost'
  children: React.ReactNode
}

export const Button: React.FC<ButtonProps> = ({ variant = 'primary', children, className = '', ...props }) => {
  const baseStyle = 'inline-flex items-center justify-center px-4 py-2 text-xs font-semibold rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#0369a1]/25 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer'
  
  const variantStyle = 
    variant === 'primary'
      ? 'bg-[#0369a1] hover:bg-[#0284c7] active:bg-[#075985] text-white shadow-xs border border-[#0369a1]/20'
      : variant === 'secondary'
      ? 'bg-[#fdfaf3] hover:bg-[#f3ead2] active:bg-[#ede3c7] text-slate-900 border border-slate-900/15 shadow-xs'
      : 'bg-transparent hover:bg-slate-900/5 text-slate-700 border-none'

  return (
    <button className={`${baseStyle} ${variantStyle} ${className}`} {...props}>
      {children}
    </button>
  )
}
