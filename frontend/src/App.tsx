import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { elderlyTheme } from './theme/theme';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import ProjectPage from './pages/ProjectPage';
import DocumentPage from './pages/DocumentPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AdminPage from './pages/AdminPage';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import ConsentBanner from './components/ConsentBanner';
import { AuthProvider } from './contexts/AuthContext';

function App() {
  return (
    <ThemeProvider theme={elderlyTheme}>
      <CssBaseline />
      <Router>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <Layout>
                    <ConsentBanner />
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/project/:id" element={<ProjectPage />} />
                      <Route path="/project/:projectId/document" element={<DocumentPage />} />
                      <Route
                        path="/admin"
                        element={
                          <AdminRoute>
                            <AdminPage />
                          </AdminRoute>
                        }
                      />
                    </Routes>
                  </Layout>
                </ProtectedRoute>
              }
            />
          </Routes>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;
