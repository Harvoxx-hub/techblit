import { ReactNode } from 'react'

interface HorizontalScrollRailProps {
  label: string
  children: ReactNode
}

const HorizontalScrollRail = ({ label, children }: HorizontalScrollRailProps) => {
  return (
    <div>
      <h3 className="text-xs font-bold uppercase tracking-widest text-brand-gold mb-3">
        {label}
      </h3>
      <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 -mx-1 px-1">
        {children}
      </div>
    </div>
  )
}

export default HorizontalScrollRail
