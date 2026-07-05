import { ReactNode } from 'react'

interface MagazineGridProps {
  main: ReactNode
  sidebar: ReactNode
  mobileRails?: ReactNode
}

const MagazineGrid = ({ main, sidebar, mobileRails }: MagazineGridProps) => {
  return (
    <div className="max-w-[1400px] mx-auto w-full">
      {mobileRails && (
        <div className="lg:hidden mb-6 px-4 sm:px-6 lg:px-8 space-y-4">
          {mobileRails}
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 xl:gap-10">
        <div className="flex-1 min-w-0">
          {main}
        </div>

        <aside className="hidden lg:block w-[280px] xl:w-[320px] shrink-0 pr-4 sm:pr-6 lg:pr-8">
          <div className="sticky top-20 xl:top-24 space-y-8">
            {sidebar}
          </div>
        </aside>
      </div>
    </div>
  )
}

export default MagazineGrid
