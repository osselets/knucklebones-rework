import * as React from 'react'
import { randomName } from '../utils/name'
import { HomePage } from './HomePage'
import { Language } from './Language'
import { MainContent, SideBarContainer, SideBarLayout } from './SideBar'
import { Theme } from './Theme'

export function App() {
  const mainContentRef = React.useRef<React.ElementRef<'div'>>(null)

  React.useEffect(() => {
    if (localStorage.getItem('playerId') === null) {
      localStorage.setItem('playerId', randomName())
    }
  }, [])

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

        <MainContent ref={mainContentRef}>
          <HomePage />
        </MainContent>
      </SideBarLayout>
    </div>
  )
}
