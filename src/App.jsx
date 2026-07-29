import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import Home from './pages/Home.jsx'
import TeamTrialsBuilder from './pages/TeamTrialsBuilder/index.jsx'
import SupportCardBuilder from './pages/SupportCardBuilder/index.jsx'

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/team-trials" element={<TeamTrialsBuilder />} />
        <Route path="/support-cards" element={<SupportCardBuilder />} />
      </Routes>
    </Layout>
  )
}
