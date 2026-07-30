import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '@/features/auth/AuthContext'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { LoginPage } from '@/routes/LoginPage'
import { SignupPage } from '@/routes/SignupPage'
import { PersonalPage } from '@/routes/PersonalPage'
import { PersonalIncomePage } from '@/routes/PersonalIncomePage'
import { PersonalExpensesPage } from '@/routes/PersonalExpensesPage'
import { PersonalCardsPage } from '@/routes/PersonalCardsPage'
import { PersonalInvestmentsPage } from '@/routes/PersonalInvestmentsPage'
import { PersonalGoalsPage } from '@/routes/PersonalGoalsPage'
import { GroupsPage } from '@/routes/GroupsPage'
import { GroupDetailPage } from '@/routes/GroupDetailPage'
import { GroupGoalsPage } from '@/routes/GroupGoalsPage'
import { GroupFundPage } from '@/routes/GroupFundPage'
import { GroupExpensesPage } from '@/routes/GroupExpensesPage'
import { ProfilePage } from '@/routes/ProfilePage'

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />

          <Route
            path="/personal"
            element={
              <ProtectedRoute>
                <PersonalPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/personal/ingresos"
            element={
              <ProtectedRoute>
                <PersonalIncomePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/personal/gastos"
            element={
              <ProtectedRoute>
                <PersonalExpensesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/personal/tarjetas"
            element={
              <ProtectedRoute>
                <PersonalCardsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/personal/inversiones"
            element={
              <ProtectedRoute>
                <PersonalInvestmentsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/personal/metas"
            element={
              <ProtectedRoute>
                <PersonalGoalsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/groups"
            element={
              <ProtectedRoute>
                <GroupsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/groups/:groupId"
            element={
              <ProtectedRoute>
                <GroupDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/groups/:groupId/metas"
            element={
              <ProtectedRoute>
                <GroupGoalsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/groups/:groupId/fondo"
            element={
              <ProtectedRoute>
                <GroupFundPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/groups/:groupId/gastos"
            element={
              <ProtectedRoute>
                <GroupExpensesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />

          <Route path="/" element={<Navigate to="/personal" replace />} />
          <Route path="*" element={<Navigate to="/personal" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
