import React, { useState } from 'react';
import { Logo } from './Logo';
import { CtaFooter } from './CtaFooter';
import { UserRole, AuthUser } from '../types';
import { Eye, EyeOff, ShieldAlert, CheckCircle2, ArrowRight, Loader2, Sparkles, Users, CheckSquare, Calendar } from 'lucide-react';
import { api } from '../services/api';

interface LoginPageProps {
  onLoginSuccess: (user: AuthUser) => void;
  onShowToast: (title: string, description?: string, type?: 'info' | 'warning' | 'success') => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, onShowToast }) => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');

  // Login Form States
  const [companyEmail, setCompanyEmail] = useState('');
  const [userType, setUserType] = useState<UserRole>('Manager');
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Sign Up Form States
  const [signupCompanyName, setSignupCompanyName] = useState('');
  const [signupCompanyEmail, setSignupCompanyEmail] = useState('');
  const [signupManagerName, setSignupManagerName] = useState('');
  const [signupManagerId, setSignupManagerId] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showSignupConfirmPassword, setShowSignupConfirmPassword] = useState(false);

  // Status & Feedback
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Handle Login Submit
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!companyEmail.trim() || !userId.trim() || !password.trim()) {
      setErrorMessage('Please complete all required fields.');
      return;
    }

    try {
      setLoading(true);
      const res = await api.login({
        companyEmail: companyEmail.trim(),
        userType,
        userId: userId.trim(),
        password,
      });

      onShowToast(
        `Welcome back, ${res.user.name}`,
        `Signed in to ${res.user.companyName} as ${res.user.role}`,
        'success'
      );
      onLoginSuccess(res.user);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'User not found or incorrect credentials.';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  // Handle Sign Up Submit
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (
      !signupCompanyName.trim() ||
      !signupCompanyEmail.trim() ||
      !signupManagerName.trim() ||
      !signupManagerId.trim() ||
      !signupPassword ||
      !signupConfirmPassword
    ) {
      setErrorMessage('Please complete all required fields.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(signupCompanyEmail.trim())) {
      setErrorMessage('Invalid company email address format.');
      return;
    }

    if (signupPassword !== signupConfirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    if (signupPassword.length < 4) {
      setErrorMessage('Password must be at least 4 characters.');
      return;
    }

    try {
      setLoading(true);
      const res = await api.registerManager({
        companyName: signupCompanyName.trim(),
        companyEmail: signupCompanyEmail.trim(),
        managerName: signupManagerName.trim(),
        managerId: signupManagerId.trim(),
        password: signupPassword,
        confirmPassword: signupConfirmPassword,
      });

      setSuccessMessage(res.message || 'Account created successfully.');
      onShowToast('Workspace Created', 'You can now sign in with your credentials.', 'success');
      // Pre-fill login with registered credentials
      setCompanyEmail(signupCompanyEmail.trim());
      setUserId(signupManagerId.trim());
      setUserType('Manager');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to create workspace.';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      id="meetflow-auth-canvas"
      className="min-h-screen w-full bg-[#0d091b] text-white flex flex-col justify-between relative overflow-hidden font-sans select-none"
    >
      {/* Background Graphic Design Elements: Abstract Workflow, Meeting & AI Nodes */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Deep ambient radial violet glows */}
        <div className="absolute -top-48 -left-48 w-[600px] h-[600px] bg-violet-600/15 rounded-full blur-[140px]" />
        <div className="absolute top-1/2 -right-48 w-[650px] h-[650px] bg-indigo-600/15 rounded-full blur-[160px]" />
        <div className="absolute -bottom-48 left-1/3 w-[550px] h-[550px] bg-purple-700/10 rounded-full blur-[150px]" />

        {/* Subtle geometric dot grid matrix */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #a855f7 1px, transparent 0)`,
            backgroundSize: '32px 32px',
          }}
        />

        {/* Abstract Meeting & Connected Workflow Graphic Curves */}
        <svg
          className="absolute inset-0 w-full h-full opacity-20"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 1440 900"
          fill="none"
        >
          <path
            d="M-100 200 C300 100, 500 450, 900 350 C1200 280, 1400 500, 1600 400"
            stroke="url(#bg-grad-line1)"
            strokeWidth="1.5"
            strokeDasharray="6 6"
          />
          <path
            d="M-50 700 C350 750, 650 500, 1050 650 C1300 750, 1500 600, 1650 620"
            stroke="url(#bg-grad-line2)"
            strokeWidth="1.5"
          />
          {/* Subtle circular pulse nodes symbolizing meetings and tasks */}
          <circle cx="500" cy="450" r="4" fill="#a855f7" />
          <circle cx="900" cy="350" r="5" fill="#6366f1" />
          <circle cx="650" cy="500" r="4" fill="#c084fc" />
          <circle cx="1050" cy="650" r="6" fill="#818cf8" />
          <defs>
            <linearGradient id="bg-grad-line1" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.1" />
              <stop offset="50%" stopColor="#a855f7" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0.2" />
            </linearGradient>
            <linearGradient id="bg-grad-line2" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.1" />
              <stop offset="50%" stopColor="#818cf8" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#c084fc" stopOpacity="0.1" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Top Header with MeetFlow Brand */}
      <header id="meetflow-login-header" className="relative z-10 w-full px-6 py-5 sm:px-12 flex items-center justify-between border-b border-violet-900/20 backdrop-blur-xs">
        <Logo size="md" showSubtitle={true} variant="violet" />
        <div className="hidden sm:flex items-center gap-6 text-xs text-violet-300/70">
          <span className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-violet-400" />
            Meeting Accountability
          </span>
          <span className="flex items-center gap-1.5">
            <CheckSquare className="w-3.5 h-3.5 text-indigo-400" />
            Task Delegation
          </span>
          <span className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-fuchsia-400" />
            Team Synergy
          </span>
        </div>
      </header>

      {/* Main Content Area */}
      <main id="meetflow-login-main" className="relative z-10 flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          {/* Card Container in Dark Violet Theme */}
          <div
            id="auth-card-container"
            className="bg-[#150f28]/90 backdrop-blur-xl p-7 sm:p-9 rounded-2xl border border-violet-800/40 shadow-2xl shadow-black/60 relative"
          >
            {/* Ambient top edge highlight */}
            <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-violet-400/40 to-transparent" />

            {/* Logo inside card */}
            <div className="flex justify-center mb-6">
              <Logo size="lg" showText={true} variant="violet" />
            </div>

            {/* Header Titles */}
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold tracking-tight text-white">
                {mode === 'login' ? 'Welcome back' : 'Create your workspace'}
              </h1>
              <p className="text-xs sm:text-sm text-violet-300/70 mt-1.5">
                {mode === 'login'
                  ? 'Sign in to your workspace'
                  : 'Register your company and manager credentials'}
              </p>
            </div>

            {/* Error Message Alert */}
            {errorMessage && (
              <div
                id="auth-error-alert"
                className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5 animate-fadeIn"
              >
                <ShieldAlert className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                <span className="leading-relaxed">{errorMessage}</span>
              </div>
            )}

            {/* Success Message Banner */}
            {successMessage && mode === 'signup' && (
              <div
                id="auth-success-alert"
                className="mb-5 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex flex-col gap-3 animate-fadeIn"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span className="font-semibold">{successMessage}</span>
                </div>
                <button
                  type="button"
                  id="go-to-login-btn"
                  onClick={() => {
                    setMode('login');
                    setSuccessMessage('');
                    setErrorMessage('');
                  }}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <span>Go to Login</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* MODE 1: LOGIN FORM */}
            {mode === 'login' && (
              <form onSubmit={handleLogin} className="space-y-4">
                {/* Field 1: COMPANY EMAIL ID */}
                <div>
                  <label
                    htmlFor="login-company-email"
                    className="block text-[11px] font-bold text-violet-200/80 uppercase mb-1.5 tracking-wider"
                  >
                    Company Email ID
                  </label>
                  <input
                    id="login-company-email"
                    type="email"
                    value={companyEmail}
                    onChange={(e) => {
                      setCompanyEmail(e.target.value);
                      if (errorMessage) setErrorMessage('');
                    }}
                    placeholder="Enter company email ID"
                    className="w-full px-4 py-2.5 text-sm rounded-xl bg-[#1c1436] border border-violet-800/40 text-white placeholder:text-violet-400/40 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition"
                    required
                  />
                </div>

                {/* Field 2: LOGIN AS */}
                <div>
                  <label
                    htmlFor="login-as-role"
                    className="block text-[11px] font-bold text-violet-200/80 uppercase mb-1.5 tracking-wider"
                  >
                    Login as
                  </label>
                  <select
                    id="login-as-role"
                    value={userType}
                    onChange={(e) => {
                      setUserType(e.target.value as UserRole);
                      if (errorMessage) setErrorMessage('');
                    }}
                    className="w-full px-4 py-2.5 text-sm rounded-xl bg-[#1c1436] border border-violet-800/40 text-white focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition cursor-pointer"
                  >
                    <option value="Manager" className="bg-[#1c1436] text-white">Manager</option>
                    <option value="Employee" className="bg-[#1c1436] text-white">Employee</option>
                  </select>
                </div>

                {/* Field 3: USER ID */}
                <div>
                  <label
                    htmlFor="login-user-id"
                    className="block text-[11px] font-bold text-violet-200/80 uppercase mb-1.5 tracking-wider"
                  >
                    User ID
                  </label>
                  <input
                    id="login-user-id"
                    type="text"
                    value={userId}
                    onChange={(e) => {
                      setUserId(e.target.value);
                      if (errorMessage) setErrorMessage('');
                    }}
                    placeholder={userType === 'Manager' ? 'Enter manager ID' : 'Enter employee ID'}
                    className="w-full px-4 py-2.5 text-sm rounded-xl bg-[#1c1436] border border-violet-800/40 text-white placeholder:text-violet-400/40 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition"
                    required
                  />
                </div>

                {/* Field 4: PASSWORD */}
                <div>
                  <label
                    htmlFor="login-password"
                    className="block text-[11px] font-bold text-violet-200/80 uppercase mb-1.5 tracking-wider"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (errorMessage) setErrorMessage('');
                      }}
                      placeholder="••••••••"
                      className="w-full px-4 py-2.5 pr-11 text-sm rounded-xl bg-[#1c1436] border border-violet-800/40 text-white placeholder:text-violet-400/40 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition"
                      required
                    />
                    <button
                      type="button"
                      id="toggle-login-password-btn"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-violet-400/60 hover:text-violet-200 transition"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* LOGIN BUTTON */}
                <button
                  type="submit"
                  id="login-submit-btn"
                  disabled={loading}
                  className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 active:from-violet-700 active:to-purple-700 text-white text-sm font-bold shadow-lg shadow-violet-900/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Authenticating...</span>
                    </>
                  ) : (
                    <span>Login</span>
                  )}
                </button>

                {/* Don't have an account? SIGN UP link */}
                <div className="pt-4 border-t border-violet-900/30 text-center flex items-center justify-center gap-1.5 text-xs text-violet-300/70">
                  <span>Don't have an account?</span>
                  <button
                    type="button"
                    id="switch-to-signup-btn"
                    onClick={() => {
                      setMode('signup');
                      setErrorMessage('');
                      setSuccessMessage('');
                    }}
                    className="font-bold text-violet-300 hover:text-white underline underline-offset-4 decoration-violet-500 transition cursor-pointer"
                  >
                    Sign Up
                  </button>
                </div>
              </form>
            )}

            {/* MODE 2: MANAGER SIGN UP FORM */}
            {mode === 'signup' && !successMessage && (
              <form onSubmit={handleSignUp} className="space-y-3.5">
                {/* 1. Company Name */}
                <div>
                  <label
                    htmlFor="signup-company-name"
                    className="block text-[11px] font-bold text-violet-200/80 uppercase mb-1 tracking-wider"
                  >
                    Company Name
                  </label>
                  <input
                    id="signup-company-name"
                    type="text"
                    value={signupCompanyName}
                    onChange={(e) => setSignupCompanyName(e.target.value)}
                    placeholder="e.g. Acme Technologies"
                    className="w-full px-3.5 py-2 text-sm rounded-xl bg-[#1c1436] border border-violet-800/40 text-white placeholder:text-violet-400/40 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition"
                    required
                  />
                </div>

                {/* 2. Company Email ID */}
                <div>
                  <label
                    htmlFor="signup-company-email"
                    className="block text-[11px] font-bold text-violet-200/80 uppercase mb-1 tracking-wider"
                  >
                    Company Email ID
                  </label>
                  <input
                    id="signup-company-email"
                    type="email"
                    value={signupCompanyEmail}
                    onChange={(e) => setSignupCompanyEmail(e.target.value)}
                    placeholder="admin@acme.com"
                    className="w-full px-3.5 py-2 text-sm rounded-xl bg-[#1c1436] border border-violet-800/40 text-white placeholder:text-violet-400/40 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition"
                    required
                  />
                </div>

                {/* 3. Manager Name */}
                <div>
                  <label
                    htmlFor="signup-manager-name"
                    className="block text-[11px] font-bold text-violet-200/80 uppercase mb-1 tracking-wider"
                  >
                    Manager Name
                  </label>
                  <input
                    id="signup-manager-name"
                    type="text"
                    value={signupManagerName}
                    onChange={(e) => setSignupManagerName(e.target.value)}
                    placeholder="e.g. Sarah Jenkins"
                    className="w-full px-3.5 py-2 text-sm rounded-xl bg-[#1c1436] border border-violet-800/40 text-white placeholder:text-violet-400/40 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition"
                    required
                  />
                </div>

                {/* 4. Manager ID */}
                <div>
                  <label
                    htmlFor="signup-manager-id"
                    className="block text-[11px] font-bold text-violet-200/80 uppercase mb-1 tracking-wider"
                  >
                    Manager ID
                  </label>
                  <input
                    id="signup-manager-id"
                    type="text"
                    value={signupManagerId}
                    onChange={(e) => setSignupManagerId(e.target.value)}
                    placeholder="e.g. MGR-101"
                    className="w-full px-3.5 py-2 text-sm rounded-xl bg-[#1c1436] border border-violet-800/40 text-white placeholder:text-violet-400/40 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition"
                    required
                  />
                </div>

                {/* 5. Password */}
                <div>
                  <label
                    htmlFor="signup-password"
                    className="block text-[11px] font-bold text-violet-200/80 uppercase mb-1 tracking-wider"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="signup-password"
                      type={showSignupPassword ? 'text' : 'password'}
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3.5 py-2 pr-10 text-sm rounded-xl bg-[#1c1436] border border-violet-800/40 text-white placeholder:text-violet-400/40 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition"
                      required
                    />
                    <button
                      type="button"
                      id="toggle-signup-password-btn"
                      onClick={() => setShowSignupPassword(!showSignupPassword)}
                      className="absolute right-3 top-2.5 text-violet-400/60 hover:text-violet-200 transition"
                    >
                      {showSignupPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* 6. Confirm Password */}
                <div>
                  <label
                    htmlFor="signup-confirm-password"
                    className="block text-[11px] font-bold text-violet-200/80 uppercase mb-1 tracking-wider"
                  >
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      id="signup-confirm-password"
                      type={showSignupConfirmPassword ? 'text' : 'password'}
                      value={signupConfirmPassword}
                      onChange={(e) => setSignupConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3.5 py-2 pr-10 text-sm rounded-xl bg-[#1c1436] border border-violet-800/40 text-white placeholder:text-violet-400/40 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition"
                      required
                    />
                    <button
                      type="button"
                      id="toggle-signup-confirm-password-btn"
                      onClick={() => setShowSignupConfirmPassword(!showSignupConfirmPassword)}
                      className="absolute right-3 top-2.5 text-violet-400/60 hover:text-violet-200 transition"
                    >
                      {showSignupConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* CREATE ACCOUNT BUTTON */}
                <button
                  type="submit"
                  id="signup-submit-btn"
                  disabled={loading}
                  className="w-full mt-3 py-3 px-4 rounded-xl bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 active:from-violet-700 active:to-purple-700 text-white text-sm font-bold shadow-lg shadow-violet-900/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Creating Workspace...</span>
                    </>
                  ) : (
                    <span>Create Account</span>
                  )}
                </button>

                {/* Back to Login link */}
                <div className="pt-3 border-t border-violet-900/30 text-center text-xs text-violet-300/70">
                  <span>Already registered? </span>
                  <button
                    type="button"
                    id="back-to-login-btn"
                    onClick={() => {
                      setMode('login');
                      setErrorMessage('');
                    }}
                    className="font-bold text-violet-300 hover:text-white underline underline-offset-4 decoration-violet-500 transition cursor-pointer"
                  >
                    Go to Login
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </main>

      {/* Cinematic Full-Width CTA + Footer Section */}
      <CtaFooter />
    </div>
  );
};
