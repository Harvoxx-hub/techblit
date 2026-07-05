import Link from 'next/link'

interface ViewAllLinkProps {
  href: string
  label?: string
}

const ViewAllLink = ({ href, label = 'View all' }: ViewAllLinkProps) => {
  const className = 'text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-brand-gold transition-colors'

  if (href.startsWith('http')) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
        aria-label={`${label} — opens external page`}
      >
        {label} →
      </a>
    )
  }

  return (
    <Link
      href={href}
      className={className}
      aria-label={`${label} — opens category page`}
    >
      {label} →
    </Link>
  )
}

export default ViewAllLink
