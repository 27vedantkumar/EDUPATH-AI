import React, { useState } from 'react';
import {
  Sparkles,
  BookOpen,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  ArrowRight,
  Mail,
  Lock,
  User,
  GraduationCap,
  Layers,
  Cpu,
  RefreshCw
} from 'lucide-react';
import { useAuth, AuthState } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export const AuthPage = () => {
  const { login, register, verifyEmail, resendVerification, forgotPassword, resetPassword, loginDemo } = useAuth();
  const { themeConfig, isNight } = useTheme();

  // Active view: 'login' | 'register' | 'verify' | 'forgot' | 'reset'
  const [authView, setAuthView] = useState('login');

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [tokenInput, setTokenInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);

  // Status & Feedback
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [devVerifyLink, setDevVerifyLink] = useState('');

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    if (!email || !password) {
      setErrorMessage('Please enter both your email/username and password.');
      return;
    }

    try {
      setLoading(true);
      await login(email, password);
    } catch (err) {
      const msg = err.message || 'Login failed. Please check your credentials.';
      if (msg.includes('verification is required') || msg.includes('verify your email')) {
        setErrorMessage(msg);
        setAuthView('verify');
      } else {
        setErrorMessage(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!email || !password || !fullName) {
      setErrorMessage('Please fill in all required fields.');
      return;
    }
    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }
    if (!agreeTerms) {
      setErrorMessage('Please acknowledge the Terms of Service and Privacy Policy.');
      return;
    }

    try {
      setLoading(true);
      const res = await register({
        email,
        password,
        full_name: fullName,
        username: username || email.split('@')[0]
      });

      setSuccessMessage(res.message || 'Account created! Please verify your email.');
      if (res.dev_verification_link) {
        setDevVerifyLink(res.dev_verification_link);
      }
      setAuthView('verify');
    } catch (err) {
      setErrorMessage(err.message || 'Registration failed. An account with this email may already exist.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySubmit = async (e) => {
    e?.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    if (!tokenInput.trim()) {
      setErrorMessage('Please enter your verification token.');
      return;
    }

    try {
      setLoading(true);
      const res = await verifyEmail(tokenInput.trim());
      setSuccessMessage(res.message || 'Email verified successfully! You may now sign in.');
      setAuthView('login');
      setDevVerifyLink('');
    } catch (err) {
      setErrorMessage(err.message || 'Invalid or expired verification token.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendClick = async () => {
    if (!email) {
      setErrorMessage('Please provide your email address to receive a verification link.');
      return;
    }
    try {
      setLoading(true);
      const res = await resendVerification(email);
      setSuccessMessage(res.message || 'Verification link sent.');
      if (res.dev_verification_link) {
        setDevVerifyLink(res.dev_verification_link);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to resend verification.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    if (!email) {
      setErrorMessage('Please enter your email address.');
      return;
    }

    try {
      setLoading(true);
      const res = await forgotPassword(email);
      setSuccessMessage(res.message || 'Password reset link sent.');
      if (res.dev_reset_link) {
        setDevVerifyLink(res.dev_reset_link);
      }
      setAuthView('reset');
    } catch (err) {
      setErrorMessage(err.message || 'Failed to initiate password recovery.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    if (!tokenInput || !password) {
      setErrorMessage('Please enter both the reset token and your new password.');
      return;
    }
    if (password.length < 8) {
      setErrorMessage('New password must be at least 8 characters.');
      return;
    }

    try {
      setLoading(true);
      const res = await resetPassword(tokenInput.trim(), password);
      setSuccessMessage(res.message || 'Password reset successful! Please sign in.');
      setAuthView('login');
      setPassword('');
      setDevVerifyLink('');
    } catch (err) {
      setErrorMessage(err.message || 'Invalid or expired password reset token.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{ backgroundColor: themeConfig.bgCanvas }}
      className="min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans transition-colors duration-200"
    >
      <div
        style={{
          backgroundColor: themeConfig.bgCard,
          borderColor: themeConfig.borderCard
        }}
        className="max-w-5xl w-full rounded-3xl border shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[640px]"
      >
        {/* Left Column: Brand & Product Value (Desktop) */}
        <div
          style={{
            backgroundColor: isNight ? '#0a0d16' : '#fff0e8',
            borderColor: themeConfig.borderCard
          }}
          className="lg:col-span-5 p-8 sm:p-10 flex flex-col justify-between border-b lg:border-b-0 lg:border-r"
        >
          <div className="space-y-6">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-sky-400 flex items-center justify-center shadow-lg">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="font-extrabold text-xl tracking-tight text-slate-900 dark:text-white">
                  EduPath <span className="text-indigo-600 dark:text-indigo-400">AI</span>
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block -mt-1 font-medium">
                  Understand Better · Learn Smarter
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
                Your Multimodal, Source-Grounded Learning Companion.
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                Upload course PDFs, slide decks, and lecture recordings. Ask questions with precise slide-level citations, master concepts across 3 adaptive phases, and eliminate knowledge gaps.
              </p>
            </div>

            {/* Feature Highlights */}
            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">Source-Grounded Accuracy</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Every claim links to exact slide numbers, textbook pages, and video timestamps.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">3-Phase Adaptive Mastery</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Foundation $\rightarrow$ Application $\rightarrow$ Mastery with cross-phase diagnostic quizzes.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Cpu className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">Bayesian Active Learning</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Estimates belief states $P(\theta|D)$ and surfaces 5-minute targeted remediation.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Hackathon Judge Single-Click Instant Demo Access */}
          <div className="pt-8 border-t border-slate-300/40 dark:border-slate-800/80 space-y-2">
            <div className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5">
              <span>⚡ Hackathon Evaluation Shortcut:</span>
            </div>
            <button
              type="button"
              onClick={loginDemo}
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white font-bold text-xs shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Explore Demo as Alex Rivera (1-Click)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <p className="text-[10px] text-slate-400 text-center">
              Instant access for judges with pre-indexed Operating Systems & Deadlocks material.
            </p>
          </div>
        </div>

        {/* Right Column: Authentication Form */}
        <div className="lg:col-span-7 p-8 sm:p-10 flex flex-col justify-between">
          <div className="space-y-6">
            {/* Nav Tabs */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setAuthView('login');
                    setErrorMessage('');
                    setSuccessMessage('');
                  }}
                  className={`text-xs font-bold pb-1 transition-all ${
                    authView === 'login'
                      ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Sign In
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAuthView('register');
                    setErrorMessage('');
                    setSuccessMessage('');
                  }}
                  className={`text-xs font-bold pb-1 transition-all ${
                    authView === 'register'
                      ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Create Account
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAuthView('verify');
                    setErrorMessage('');
                    setSuccessMessage('');
                  }}
                  className={`text-xs font-bold pb-1 transition-all ${
                    authView === 'verify'
                      ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Verify Email
                </button>
              </div>

              <span className="text-[11px] font-medium text-slate-400 hidden sm:inline">
                Track D: Adaptive Tutoring
              </span>
            </div>

            {/* Error & Success Alerts */}
            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-600 dark:text-rose-400 text-xs flex items-start gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 text-xs flex items-start gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">{successMessage}</p>
                  {devVerifyLink && (
                    <div className="mt-1.5 pt-1.5 border-t border-emerald-500/20 text-[11px]">
                      <span>Development Quick-Verify Link: </span>
                      <button
                        type="button"
                        onClick={() => {
                          const token = devVerifyLink.split('token=')[1]?.split('&')[0];
                          if (token) {
                            setTokenInput(token);
                            handleVerifySubmit();
                          }
                        }}
                        className="underline font-bold hover:text-emerald-300"
                      >
                        Click here to verify automatically
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* View 1: Sign In Form */}
            {authView === 'login' && (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Welcome Back</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Sign in to continue your personalized learning journey.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                    Email Address or Username
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="student@university.edu"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setAuthView('forgot')}
                      className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
                >
                  {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>Sign In to Learning Space →</span>}
                </button>
              </form>
            )}

            {/* View 2: Registration Form */}
            {authView === 'register' && (
              <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Create Learner Account</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Any valid email address accepted. Mailbox verification required.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Alex Rivera"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                      Username (Optional)
                    </label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="alex_rivera"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@example.com"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                      Password (min 8 chars)
                    </label>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                      Confirm Password
                    </label>
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="flex items-start gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor="terms" className="text-[11px] text-slate-500 dark:text-slate-400">
                    I acknowledge EduPath AI Terms of Service and Privacy Policy.
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
                >
                  {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>Create Account & Send Verification →</span>}
                </button>
              </form>
            )}

            {/* View 3: Email Verification Form */}
            {authView === 'verify' && (
              <form onSubmit={handleVerifySubmit} className="space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Verify Your Mailbox</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Mandatory verification is required to protect your learning progress and source material.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                    Verification Token
                  </label>
                  <input
                    type="text"
                    required
                    value={tokenInput}
                    onChange={(e) => setTokenInput(e.target.value)}
                    placeholder="Paste the verification token received in email"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>

                <div className="flex items-center justify-between gap-3 pt-1">
                  <button
                    type="button"
                    onClick={handleResendClick}
                    className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
                  >
                    Resend verification email
                  </button>

                  <button
                    type="submit"
                    disabled={loading}
                    className="py-2 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <span>Confirm Verification →</span>}
                  </button>
                </div>
              </form>
            )}

            {/* View 4: Forgot Password Form */}
            {authView === 'forgot' && (
              <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Reset Your Password</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Enter your email to receive a secure password recovery challenge.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                    Registered Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@example.com"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex items-center justify-between gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setAuthView('login')}
                    className="text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white font-medium"
                  >
                    Back to Sign In
                  </button>

                  <button
                    type="submit"
                    disabled={loading}
                    className="py-2 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <span>Send Reset Link →</span>}
                  </button>
                </div>
              </form>
            )}

            {/* View 5: Reset Password Form */}
            {authView === 'reset' && (
              <form onSubmit={handleResetPasswordSubmit} className="space-y-3.5">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Choose New Password</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Enter the reset token and your new password.
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                    Reset Token
                  </label>
                  <input
                    type="text"
                    required
                    value={tokenInput}
                    onChange={(e) => setTokenInput(e.target.value)}
                    placeholder="Paste reset token from email"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                    New Password (min 8 chars)
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
                >
                  {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>Set New Password & Sign In →</span>}
                </button>
              </form>
            )}
          </div>

          {/* Footer note */}
          <div className="pt-6 border-t border-slate-200 dark:border-slate-800/80 text-[11px] text-slate-400 text-center">
            Multimodal AI Hackathon 2026 · Track D: Personalized Tutoring & Adaptive Learning
          </div>
        </div>
      </div>
    </div>
  );
};
