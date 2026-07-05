import ViewAllLink from '../atoms/ViewAllLink'

interface SectionHeaderProps {
  label: string
  href?: string
  className?: string
}

const SectionHeader = ({ label, href, className = '' }: SectionHeaderProps) => {
  return (
    <div className={`flex items-center justify-between mb-4 sm:mb-5 lg:mb-6 ${className}`}>
      <h2 className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-brand-gold">
        {label}
      </h2>
      {href && <ViewAllLink href={href} />}
    </div>
  )
}

export default SectionHeader
