import React from 'react'

interface EditorialCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  className?: string
  elevated?: boolean
}

const EditorialCard: React.FC<EditorialCardProps> = ({ children, className = '', elevated = false, ...props }) => {
  return (
    <div 
      className={`
        editorial-card
        ${elevated ? 'shadow-xl scale-[1.01]' : 'shadow-sm'}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  )
}

export default EditorialCard
