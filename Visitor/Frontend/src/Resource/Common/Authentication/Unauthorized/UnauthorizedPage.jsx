import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, HelpCircle, LogOut, LayoutDashboard, UserCheck, LogIn, Lock, ArrowRight } from 'lucide-react';
import { useAuth } from '../../../../contexts/AuthContext';
import { getRoleLanding, isAdminRole, normalizeRole } from '../../../../config/routes';

export default function UnauthorizedPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout } = useAuth();
    const [countdown, setCountdown] = useState(3);

    const normalizedRole = useMemo(() => normalizeRole(user), [user]);
    const roleLanding = useMemo(() => {
        if (!user) return '/login';
        return getRoleLanding(user?.role, user) || '/dashboard';
    }, [user]);

    const roleDisplayName = useMemo(() => {
        if (!user) return 'Guest / Unauthenticated';
        switch (normalizedRole) {
            case 'admin':
                return 'System Administrator';
            case 'manager':
                return 'Department Manager';
            case 'receptionist':
                return 'Reception / Front Desk Staff';
            case 'security':
                return 'Security Officer';
            case 'employee':
                return 'Employee / Host Staff';
            case 'visitor':
                return 'Registered Visitor';
            default:
                return user?.role || 'Standard User';
        }
    }, [user, normalizedRole]);

    // Automatically navigate back to dashboard after brief countdown
    useEffect(() => {
        if (!user) return;
        const timer = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    navigate(roleLanding, { replace: true });
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [user, roleLanding, navigate]);

    const handleReturnToDashboard = () => {
        if (!user) {
            navigate('/login', { replace: true });
        } else {
            navigate(roleLanding, { replace: true });
        }
    };

    const handleSignOut = () => {
        try {
            logout();
        } catch {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('refreshToken');
            sessionStorage.clear();
        }
        navigate('/login', { replace: true });
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-[#070b13] text-slate-100 font-sans relative overflow-hidden px-4 py-8">
            {/* Background ambient lighting */}
            <div className="absolute top-[-20%] left-[-10%] h-[550px] w-[550px] rounded-full bg-rose-950/20 blur-[140px] pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-10%] h-[500px] w-[500px] rounded-full bg-indigo-950/25 blur-[140px] pointer-events-none" />
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#0c1524_1px,transparent_1px),linear-gradient(to_bottom,#0c1524_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-25 pointer-events-none" />

            <div className="w-full max-w-lg relative z-10 text-center">
                <div className="bg-[#0b101b]/95 border border-slate-800/90 rounded-2xl p-7 sm:p-10 shadow-[0_0_50px_rgba(0,0,0,0.65)] relative overflow-hidden backdrop-blur-2xl">
                    {/* Top alert accent line */}
                    <div className="absolute top-0 left-0 right-0 h-[4px] bg-gradient-to-r from-red-600 via-rose-500 to-amber-500" />

                    {/* Shield Icon with glow */}
                    <div className="flex justify-center mb-5">
                        <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl border-2 border-red-500/40 bg-red-950/25 shadow-[0_0_30px_rgba(239,68,68,0.3)]">
                            <ShieldAlert className="h-10 w-10 text-rose-500 animate-pulse" />
                            <div className="absolute -bottom-1.5 -right-1.5 bg-slate-900 border border-red-500/50 rounded-full p-1 shadow-sm">
                                <Lock className="h-3.5 w-3.5 text-red-400" />
                            </div>
                        </div>
                    </div>

                    <h1 className="text-3xl font-black text-white uppercase tracking-widest">403 FORBIDDEN</h1>
                    <h2 className="text-sm font-bold text-rose-400 uppercase tracking-widest mt-1.5 flex items-center justify-center gap-1.5">
                        Access Restricted
                    </h2>

                    <p className="text-xs text-slate-400 mt-3 leading-relaxed max-w-md mx-auto">
                        Your account clearance level does not permit accessing this protected resource route.
                        Access permissions are enforced in accordance with internal role-based security policies.
                    </p>

                    {/* Authenticated account context pill */}
                    {user ? (
                        <div className="mt-5 p-3.5 bg-slate-900/80 border border-slate-800 rounded-xl text-left text-xs space-y-1.5">
                            <div className="flex items-center justify-between text-slate-400">
                                <span className="flex items-center gap-1.5 font-medium">
                                    <UserCheck className="h-3.5 w-3.5 text-indigo-400" /> Current Session:
                                </span>
                                <span className="font-semibold text-slate-200 truncate max-w-[220px]">
                                    {user.email || user.username || user.fullName || 'User'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-slate-400">
                                <span>Role Clearance:</span>
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                                    {roleDisplayName}
                                </span>
                            </div>
                        </div>
                    ) : (
                        <div className="mt-5 p-3 bg-amber-950/20 border border-amber-500/30 rounded-xl text-xs text-amber-300/90 text-center">
                            You are not currently authenticated or your session has ended.
                        </div>
                    )}

                    {/* Auto-redirection notification */}
                    {user && countdown > 0 && (
                        <div className="mt-4 flex items-center justify-center gap-2 text-xs text-indigo-400 bg-indigo-950/40 border border-indigo-500/20 rounded-lg py-2 px-3">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                            </span>
                            <span>Redirecting to your {roleDisplayName} workspace in {countdown}s...</span>
                        </div>
                    )}

                    {/* Action buttons */}
                    <div className="mt-6 space-y-2.5">
                        {user ? (
                            <>
                                <button
                                    type="button"
                                    onClick={handleReturnToDashboard}
                                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2.5 transition-all shadow-[0_4px_18px_rgba(99,102,241,0.35)] cursor-pointer text-xs uppercase tracking-wider"
                                >
                                    <LayoutDashboard className="h-4 w-4" />
                                    <span>Return to My Dashboard ({roleDisplayName}) {countdown > 0 ? `(${countdown}s)` : ''}</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={handleSignOut}
                                    className="w-full border border-slate-700 hover:border-slate-600 bg-slate-800/50 hover:bg-slate-800 text-slate-300 hover:text-white font-semibold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2.5 transition-all cursor-pointer text-xs"
                                >
                                    <LogOut className="h-4 w-4 text-rose-400" />
                                    <span>Sign Out & Switch Account</span>
                                </button>
                            </>
                        ) : (
                            <Link
                                to="/login"
                                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2.5 transition-all shadow-[0_4px_18px_rgba(99,102,241,0.35)] text-xs uppercase tracking-wider"
                            >
                                <LogIn className="h-4 w-4" />
                                <span>Sign In to System</span>
                            </Link>
                        )}

                        <a
                            href="mailto:security@organization.com?subject=VMS%20Access%20Clearance%20Inquiry"
                            className="w-full border border-slate-800 hover:border-slate-700 hover:text-slate-200 text-slate-500 font-medium py-2 rounded-xl flex items-center justify-center gap-2 transition-all text-xs"
                        >
                            <HelpCircle className="h-3.5 w-3.5" />
                            <span>Contact System Security Administrator</span>
                        </a>
                    </div>
                </div>

                {/* Footer system disclaimer */}
                <p className="text-[11px] text-slate-600 mt-4 font-mono">
                    IT park VMS • Security Policy Enforcement Gateway
                </p>
            </div>
        </div>
    );
}
