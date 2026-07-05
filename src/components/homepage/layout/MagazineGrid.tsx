import { ReactNode } from 'react'

interface MagazineGridProps {
  main: ReactNode
  sidebar: ReactNode
  mobileRails?: ReactNode
}

const MagazineGrid = ({ main, sidebar, mobileRails }: MagazineGridProps) => {
  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
      {mobileRails && (
        <div className="lg:hidden mb-6 space-y-4">
          {mobileRails}
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-8 lg:gap-10">
        <div className="flex-1 min-w-0 space-y-8 lg:space-y-10">
          {main}
        </div>

        <aside className="hidden lg:block w-[320px] shrink-0">
          <div className="sticky top-24 space-y-8">
            {sidebar}
          </div>
        </aside>
      </div>
    </div>
  )
}

export default MagazineGrid
