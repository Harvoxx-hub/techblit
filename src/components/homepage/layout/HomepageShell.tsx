import { ReactNode } from 'react'

interface HomepageShellProps {
  children: ReactNode
}

const HomepageShell = ({ children }: HomepageShellProps) => {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {children}
    </div>
  )
}

export default HomepageShell
