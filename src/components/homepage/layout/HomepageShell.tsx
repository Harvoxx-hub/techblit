import { ReactNode } from 'react'

interface HomepageShellProps {
  children: ReactNode
}

const HomepageShell = ({ children }: HomepageShellProps) => {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 overflow-x-hidden">
      {children}
    </div>
  )
}

export default HomepageShell
