import { useState } from 'react'
import './index.css'
import TopNav from './components/TopNav'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import Forecasting from './pages/Forecasting'
import Archive from './pages/Archive'
import PayloadHealth from './pages/PayloadHealth'

export default function App() {
  const [activePage, setActivePage] = useState('nowcasting')

  const pages = {
    nowcasting: <Dashboard />,
    forecasting: <Forecasting />,
    payload: <PayloadHealth />,
    archive: <Archive />,
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <TopNav activePage={activePage} setActivePage={setActivePage} />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar activePage={activePage} setActivePage={setActivePage} />
        <main style={{ flex: 1, overflow: 'auto', background: 'var(--bg-primary)' }}>
          {pages[activePage]}
        </main>
      </div>
    </div>
  )
}
