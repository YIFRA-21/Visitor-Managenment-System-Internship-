import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth, BLOCKED_ACCOUNT_STATUSES } from '../../contexts/AuthContext';
import ProtectedRoute from './ProtectedRoute';
// Public website pages (LandingPage, ContactPage) temporarily terminated per user request.
// Will be restored after finishing all role workflows.
// import LandingPage from '../../modules/visitor-management/pages/LandingPage';
// import ContactPage from '../../modules/visitor-management/pages/ContactPage';
import BookAppointmentPage from '../../modules/appointment-management/pages/BookAppointmentPage';
import TrackAppointmentPage from '../../modules/appointment-management/pages/TrackAppointmentPage';
import VerifyVisitorPassPage from '../../modules/visitor-pass/pages/VerifyVisitorPassPage';
import LoginPage from '../../modules/authentication/pages/LoginPage';
import SignupPage from '../../modules/authentication/pages/SignupPage';
import ForgotPasswordPage from '../../modules/authentication/pages/ForgotPasswordPage';
import ResetPasswordPage from '../../modules/authentication/pages/ResetPasswordPage';
import ChangePasswordPage from '../../modules/authentication/pages/ChangePasswordPage';
import UnauthorizedPage from '../../modules/authentication/pages/UnauthorizedPage';
import AccessDeniedPage from '../../modules/authentication/pages/AccessDeniedPage';
import ResponsePage from '../../modules/response/ResponsePage';
import ConfirmationPage from '../../modules/response/ConfirmationPage';
import NotFoundPage from '../../modules/response/NotFoundPage';
import GlobalErrorPage from '../../modules/response/GlobalErrorPage';
import DashboardPage from '../../modules/dashboards/pages/DashboardPage';
import NotificationsPage from '../../modules/notifications/pages/NotificationsPage';
import { ROUTES, getRoleLanding } from './routeConfig';

// Identity Verification Module Pages
import IdentityVerificationOverviewPage from '../../modules/identity-verification/pages/IdentityVerificationOverviewPage';
import DocumentSelectionPage from '../../modules/identity-verification/pages/DocumentSelectionPage';
import DocumentCapturePage from '../../modules/identity-verification/pages/DocumentCapturePage';
import BiometricVerificationPage from '../../modules/identity-verification/pages/BiometricVerificationPage';
import VerificationStatusPage from '../../modules/identity-verification/pages/VerificationStatusPage';
import ReviewerQueuePage from '../../modules/identity-verification/pages/ReviewerQueuePage';
import ReviewerCaseDetailPage from '../../modules/identity-verification/pages/ReviewerCaseDetailPage';
import VerificationPolicySettingsPage from '../../modules/identity-verification/pages/VerificationPolicySettingsPage';
import LoadingScreen from '../../components/LoadingScreen';

const DashboardRedirect = () => {
    const { user } = useAuth();
    const location = useLocation();
    if (!user)
        return <Navigate to={ROUTES.PUBLIC.LOGIN} replace/>;
    const statusUpper = String(user.accountStatus || user.status || '').toUpperCase();
    if (BLOCKED_ACCOUNT_STATUSES.includes(statusUpper)) {
        return <Navigate to="/login?blocked=true" replace/>;
    }
    if (user.firstLoginRequired || user.passwordChangeRequired) {
        return <Navigate to={ROUTES.PUBLIC.CHANGE_PASSWORD} replace/>;
    }
    const search = location.search || '';
    const landing = getRoleLanding(user.role, user);
    return <Navigate to={`${landing}${search}`} replace/>;
};
const RootRoute = () => {
    const { user, loading } = useAuth();
    if (loading) {
        return <LoadingScreen />;
    }
    if (user) {
        const statusUpper = String(user.accountStatus || user.status || '').toUpperCase();
        if (BLOCKED_ACCOUNT_STATUSES.includes(statusUpper)) {
            return <LoginPage />;
        }
        return <DashboardRedirect />;
    }
    return <LoginPage />;
};
export default function AppRoutes() {
    return (<Routes>
      {/*
          PUBLIC WEBSITE SUSPENDED:
          When running the app, directly display the Sign-In / Login page.
          (Will return back after finished all role parts).
        */}
      <Route path="/" element={<RootRoute />}/>
      <Route path={ROUTES.PUBLIC.HOME} element={<RootRoute />}/>
      <Route path={ROUTES.PUBLIC.LOGIN} element={<RootRoute />}/>
      <Route path={ROUTES.PUBLIC.SIGNUP} element={<SignupPage />}/>
      <Route path={ROUTES.PUBLIC.REGISTER} element={<SignupPage />}/>
      <Route path={ROUTES.PUBLIC.FORGOT_PASSWORD} element={<ForgotPasswordPage />}/>
      <Route path={ROUTES.PUBLIC.RESET_PASSWORD} element={<ResetPasswordPage />}/>
      <Route path={ROUTES.PUBLIC.CHANGE_PASSWORD} element={<ChangePasswordPage />}/>
      <Route path={ROUTES.PUBLIC.UNAUTHORIZED} element={<UnauthorizedPage />}/>
      <Route path={ROUTES.PUBLIC.ACCESS_DENIED} element={<AccessDeniedPage />}/>
      {/* Standalone Confirmation and Response pages disabled across all roles and pages: redirect directly */}
      <Route path={ROUTES.PUBLIC.RESPONSE} element={<Navigate to="/dashboard" replace />} />
      <Route path="/response" element={<Navigate to="/dashboard" replace />} />
      <Route path="/response/*" element={<Navigate to="/dashboard" replace />} />
      <Route path={ROUTES.PUBLIC.CONFIRM} element={<Navigate to="/dashboard" replace />} />
      <Route path="/confirm" element={<Navigate to="/dashboard" replace />} />
      <Route path="/confirm/*" element={<Navigate to="/dashboard" replace />} />
      <Route path={ROUTES.PUBLIC.NOT_FOUND} element={<NotFoundPage />}/>
      <Route path="/not-found" element={<NotFoundPage />}/>
      <Route path={ROUTES.PUBLIC.ERROR} element={<GlobalErrorPage />}/>
      <Route path="/error" element={<GlobalErrorPage />}/>

      {/* Internal appointment routes */}
      <Route path={ROUTES.PUBLIC.BOOK} element={<ProtectedRoute><BookAppointmentPage /></ProtectedRoute>}/>
      <Route path={ROUTES.PUBLIC.TRACK} element={<ProtectedRoute><TrackAppointmentPage /></ProtectedRoute>}/>
      <Route path={ROUTES.PUBLIC.VERIFY_PASS} element={<VerifyVisitorPassPage />}/>
      <Route path="/verify-pass" element={<VerifyVisitorPassPage />}/>

      <Route path="/dashboard" element={<ProtectedRoute><DashboardRedirect /></ProtectedRoute>}/>

      {/* Identity Verification Module Routes */}
      <Route path="/identity-verification" element={<ProtectedRoute><IdentityVerificationOverviewPage /></ProtectedRoute>} />
      <Route path="/identity-verification/select-document" element={<ProtectedRoute><DocumentSelectionPage /></ProtectedRoute>} />
      <Route path="/identity-verification/capture/:caseId" element={<ProtectedRoute><DocumentCapturePage /></ProtectedRoute>} />
      <Route path="/identity-verification/biometric/:caseId" element={<ProtectedRoute><BiometricVerificationPage /></ProtectedRoute>} />
      <Route path="/identity-verification/status" element={<ProtectedRoute><VerificationStatusPage /></ProtectedRoute>} />
      <Route path="/security/identity-reviews/:caseId" element={<ProtectedRoute requiredRole="security"><ReviewerCaseDetailPage /></ProtectedRoute>} />
      <Route path="/security/identity-reviews" element={<ProtectedRoute requiredRole="security"><ReviewerQueuePage /></ProtectedRoute>} />
      <Route path="/admin/identity-policy" element={<ProtectedRoute requiredRole="admin"><VerificationPolicySettingsPage /></ProtectedRoute>} />

      <Route path="/admin" element={<ProtectedRoute requiredRole="admin"><DashboardPage /></ProtectedRoute>}/>
      <Route path="/admin/*" element={<ProtectedRoute requiredRole="admin"><DashboardPage /></ProtectedRoute>}/>
      <Route path="/employee" element={<ProtectedRoute requiredRole="employee"><DashboardPage /></ProtectedRoute>}/>
      <Route path="/employee/*" element={<ProtectedRoute requiredRole="employee"><DashboardPage /></ProtectedRoute>}/>
      <Route path="/manager" element={<ProtectedRoute requiredRole="manager"><DashboardPage /></ProtectedRoute>}/>
      <Route path="/manager/*" element={<ProtectedRoute requiredRole="manager"><DashboardPage /></ProtectedRoute>}/>
      <Route path="/reception" element={<ProtectedRoute requiredRole="receptionist"><DashboardPage /></ProtectedRoute>}/>
      <Route path="/reception/*" element={<ProtectedRoute requiredRole="receptionist"><DashboardPage /></ProtectedRoute>}/>
      <Route path="/security" element={<ProtectedRoute requiredRole="security"><DashboardPage /></ProtectedRoute>}/>
      <Route path="/security/*" element={<ProtectedRoute requiredRole="security"><DashboardPage /></ProtectedRoute>}/>
      <Route path="/visitor" element={<ProtectedRoute requiredRole="visitor"><DashboardPage /></ProtectedRoute>}/>
      <Route path="/visitor/*" element={<ProtectedRoute requiredRole="visitor"><DashboardPage /></ProtectedRoute>}/>

      <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>}/>
      <Route path="/feedback-support/*" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>}/>
      <Route path="/support-feedback/*" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>}/>
      <Route path="/support/*" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>}/>
      <Route path="/feedback/*" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>}/>
      <Route path="/help-support/*" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>}/>

      <Route path="*" element={<NotFoundPage />}/>
    </Routes>);
}
