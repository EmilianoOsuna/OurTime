import React from 'react'
import { Outlet } from 'react-router-dom'
import FloatingNav from './FloatingNav'
import TopHeader from './TopHeader'
import OfflineBanner from '../ui/OfflineBanner'
import InstallPrompt from '../ui/InstallPrompt'

const MainLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-surface selection:bg-primary/10 relative z-0">
      <OfflineBanner />
      <TopHeader />

      <main className="max-w-4xl mx-auto px-6 pt-8 pb-32">
        <Outlet />
      </main>

      <FloatingNav />
      <InstallPrompt />
    </div>
  )
}

export default MainLayout

