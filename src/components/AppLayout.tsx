import * as React from 'react'
import { Language } from './Language'
import { MainContent, SideBarContainer, SideBarLayout } from './SideBar'
import { Theme } from './Theme'

export function AppLayout({ children }: React.PropsWithChildren) {
  const mainContentRef = React.useRef<React.ElementRef<'div'>>(null)

  return (
    <div className='bg-slate-50 text-slate-900 transition-colors duration-150 ease-in-out dark:bg-slate-900 dark:text-slate-200'>
      <SideBarLayout>
        <SideBarContainer
          swipeableAreaRef={mainContentRef}
          actions={
            <>
              <Theme />
              <Language />
            </>
          }
        />

        <MainContent ref={mainContentRef}>{children}</MainContent>
      </SideBarLayout>
    </div>
  )
}
