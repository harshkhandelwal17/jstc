import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Debug storage wrapper (load early) 
import './utils/debugStorage';
import './utils/cookieTest';
import './utils/apiTest';

// Context
import { AuthProvider, useAuth } from './context/AuthContext';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage'; 
import StudentsPage from './pages/StudentsPage';
import AddStudentPage from './pages/AddStudentPage';
import EditStudentPage from './pages/EditStudentPage';
import StudentDetailsPage from './pages/StudentDetailsPage';
import FeesPage from './pages/FeesPage';
import EnhancedAddPaymentPage from './pages/EnhancedAddPaymentPage';
import FeeHistoryPage from './pages/FeeHistoryPage';
import ResultsPage from './pages/ResultsPage';
import AddResultPage from './pages/AddResultPage';
import ResultEntryPage from './pages/ResultEntryPage';
import BackSubjectResultPage from './pages/BackSubjectResultPage';
import StudentResultsPage from './pages/ResultsPage';
import ReportsPage from './pages/ReportsPage';
import BackSubjectsPage from './pages/BackSubjectsPage';

// Components
import Layout from './components/Layout';
import LoadingSpinner from './components/LoadingSpinner';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  return isAuthenticated ? children : <Navigate to="/login" />;
};

// Public Route Component (redirect to dashboard if already logged in)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }
  return !isAuthenticated ? children : <Navigate to="/dashboard"/>;
};


function App() {
  return (
    <div className="App">
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route 
              path="/login" 
              element={
                <PublicRoute>
                  <LoginPage />
                </PublicRoute>
              } 
            />

            {/* Protected Routes with Layout */}
            <Route 
              path="/*" 
              element={
                <ProtectedRoute>
                  <Layout>
                    <Routes>
                      <Route path="/dashboard" element={<DashboardPage />} />
                      
                      {/* Student Routes */}
                      <Route path="/students" element={<StudentsPage />} />
                      <Route path="/students/add" element={<AddStudentPage />} />
                      <Route path="/students/edit/:id" element={<EditStudentPage />} /> 
                      <Route path="/students/details/:id" element={<StudentDetailsPage />} />
                      
                      {/* Fee Routes */}
                      <Route path="/fees" element={<FeesPage />} />
                      <Route path="/fees/add-payment" element={<EnhancedAddPaymentPage />} />
                      <Route path="/fees/history/:studentId" element={<FeeHistoryPage />} />
                      
                      {/* Result Routes */}
                      <Route path="/results" element={<ResultsPage />} />
                      <Route path="/results/add" element={<AddResultPage />} />
                      <Route path="/results/entry" element={<ResultEntryPage />} />
                      <Route path="/results/back-subjects" element={<BackSubjectResultPage />} />
                      <Route path="/results/student/:studentId" element={<StudentResultsPage />} />
                      
                      {/* Back Subject Routes */}
                      <Route path="/back-subjects" element={<BackSubjectsPage />} />
                      
                      {/* Reports Routes */}
                      <Route path="/reports" element={<ReportsPage />} />
                      
                      {/* Default redirect */}
                      <Route path="/" element={<Navigate to="/dashboard" />} />
                      <Route path="*" element={<Navigate to="/dashboard" />} />
                    </Routes>
                  </Layout>
                </ProtectedRoute>
              } 
            />
          </Routes>
        </Router>

        {/* Toast Notifications */}
        <ToastContainer
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
          className="mt-16"
        />
      </AuthProvider>
    </div>
  );
}

export default App
