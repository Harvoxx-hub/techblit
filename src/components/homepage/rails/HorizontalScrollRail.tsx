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
      <ul className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 -mx-1 px-1 list-none">
        {children}
      </ul>
    </div>
  )
}

export default HorizontalScrollRail
