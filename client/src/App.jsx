import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import store from './redux/store';

// Layout
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import ProtectedRoute from './components/layout/ProtectedRoute';

// Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import GigMarketplace from './pages/GigMarketplace';
import GigDetail from './pages/GigDetail';
import CreateGig from './pages/CreateGig';
import ClientDashboard from './pages/ClientDashboard';
import FreelancerDashboard from './pages/FreelancerDashboard';
import ChatPage from './pages/ChatPage';
import AdminDashboard from './pages/AdminDashboard';
import ProfilePage from './pages/ProfilePage';

function App() {
  return (
    <Provider store={store}>
      <Router>
        <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-primary/20 w-full">
          <Navbar />
          <main className="flex-1 w-full flex flex-col">
            <Routes>
              {/* Public */}
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password/:token" element={<ResetPassword />} />
              <Route path="/gigs" element={<GigMarketplace />} />
              <Route path="/gigs/:id" element={<GigDetail />} />

              {/* Protected — Any role */}
              <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
              <Route path="/chat" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />

              {/* Client routes */}
              <Route path="/dashboard/client" element={<ProtectedRoute allowedRoles={['client']}><ClientDashboard /></ProtectedRoute>} />
              <Route path="/gigs/create" element={<ProtectedRoute allowedRoles={['client']}><CreateGig /></ProtectedRoute>} />

              {/* Freelancer routes */}
              <Route path="/dashboard/freelancer" element={<ProtectedRoute allowedRoles={['freelancer']}><FreelancerDashboard /></ProtectedRoute>} />

              {/* Admin routes */}
              <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />

              {/* 404 */}
              <Route path="*" element={
                <div className="min-h-screen flex items-center justify-center pt-16">
                  <div className="text-center">
                    <div className="text-7xl font-black text-primary mb-4">404</div>
                    <h2 className="text-2xl font-bold mb-2">Page Not Found</h2>
                    <p className="text-muted-foreground mb-6">The page you're looking for doesn't exist.</p>
                    <a href="/" className="px-6 py-3 text-sm font-semibold text-white bg-primary rounded-xl hover:bg-primary/90 transition-all">Go Home</a>
                  </div>
                </div>
              } />
            </Routes>
          </main>
          <Footer />
        </div>

        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: 'hsl(var(--background))',
              color: 'hsl(var(--foreground))',
              border: '1px solid hsl(var(--border))',
              borderRadius: 'var(--radius-md)',
              fontSize: '14px',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
            },
          }}
        />
      </Router>
    </Provider>
  );
}

export default App;
