import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import MainLayout from './components/layout/MainLayout'
import Dashboard from './pages/Dashboard'
import Plans from './pages/Plans'
import Finances from './pages/Finances'
import Gallery from './pages/Gallery'
import AddPlan from './pages/AddPlan'
import AddMemory from './pages/AddMemory'
import AddExpense from './pages/AddExpense'
import AddIncome from './pages/AddIncome'
import PlanDetail from './pages/PlanDetail'
import Auth from './pages/Auth'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="plans" element={<Plans />} />
            <Route path="plans/new" element={<AddPlan />} />
            <Route path="plans/edit/:id" element={<AddPlan />} />
            <Route path="plans/:id" element={<PlanDetail />} />
            <Route path="gallery" element={<Gallery />} />
            <Route path="gallery/new" element={<AddMemory />} />
            <Route path="finances" element={<Finances />} />
            <Route path="finances/expense/new" element={<AddExpense />} />
            <Route path="finances/expense/edit/:id" element={<AddExpense />} />
            <Route path="finances/income/new" element={<AddIncome />} />
            <Route path="finances/income/edit/:id" element={<AddIncome />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App
