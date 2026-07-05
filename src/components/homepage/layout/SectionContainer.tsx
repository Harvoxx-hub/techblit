import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface SectionContainerProps {
  children: ReactNode
  className?: string
  as?: 'section' | 'div'
}

const SectionContainer = ({
  children,
  className = '',
  as: Tag = 'section',
}: SectionContainerProps) => {
  return (
    <Tag className={cn('py-8 lg:py-10', className)}>
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        {children}
      </div>
    </Tag>
  )
}

export default SectionContainer
