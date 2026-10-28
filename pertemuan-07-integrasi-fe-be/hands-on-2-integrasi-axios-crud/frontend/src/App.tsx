import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/AppLayout.tsx';
import { ProtectedRoute } from './components/ProtectedRoute.tsx';
import { AuthProvider } from './context/AuthContext.tsx';
import { AdminDashboardPage } from './pages/AdminDashboardPage.tsx';
import { ForbiddenPage } from './pages/ForbiddenPage.tsx';
import { HomePage } from './pages/HomePage.tsx';
import { LoginPage } from './pages/LoginPage.tsx';
import { MyReviewsPage } from './pages/MyReviewsPage.tsx';
import { NotFoundPage } from './pages/NotFoundPage.tsx';
import { OwnerDashboardPage } from './pages/OwnerDashboardPage.tsx';
import { ProfilePage } from './pages/ProfilePage.tsx';
import { RegisterPage } from './pages/RegisterPage.tsx';
import { StallDetailPage } from './pages/StallDetailPage.tsx';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<HomePage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="register" element={<RegisterPage />} />
            <Route path="stalls/:id" element={<StallDetailPage />} />
            <Route path="forbidden" element={<ForbiddenPage />} />

            <Route element={<ProtectedRoute />}>
              <Route path="profile" element={<ProfilePage />} />
            </Route>

            <Route element={<ProtectedRoute roles={['customer']} />}>
              <Route path="reviews" element={<MyReviewsPage />} />
            </Route>

            <Route element={<ProtectedRoute roles={['owner']} />}>
              <Route path="owner" element={<OwnerDashboardPage />} />
            </Route>

            <Route element={<ProtectedRoute roles={['admin']} />}>
              <Route path="admin" element={<AdminDashboardPage />} />
            </Route>

            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
