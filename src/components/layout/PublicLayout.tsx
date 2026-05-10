import { Outlet } from 'react-router-dom'
import { Navbar }         from './Navbar'
import { Footer }         from './Footer'
import { UniverseBackground } from '@/components/three/UniverseBackground'
import { CursorSparkle }      from '@/components/three/CursorSparkle'

export function PublicLayout() {
  return (
    <>
      {/* Fixed universe canvas behind everything */}
      <UniverseBackground />

      {/* Cursor sparkle effect */}
      <CursorSparkle />

      <div className="relative z-10 min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1">
          <Outlet />
        </main>
        <Footer />
      </div>
    </>
  )
}
