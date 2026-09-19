import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'motion/react';
import { 
  X, 
  User, 
  Mail, 
  Lock, 
  Phone, 
  ShieldCheck, 
  Check, 
  Sparkles, 
  ArrowRight, 
  LogOut,
  UserCheck
} from 'lucide-react';
import { useSimulator } from '../context/SimulatorContext';
import { AuthFormData } from '../types';
import { GoogleSignInButton, AuthOrDivider } from './GoogleSignInButton';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, loginUser, registerUser, loginWithGoogle, logoutUser } = useSimulator();
  
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>(currentUser ? 'login' : 'signup');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Signup form state
  const [formData, setFormData] = useState<AuthFormData>({
    fullName: '',
    email: '',
    username: '',
    password: '',
    phone: '',
    ageGroup: '16-18 (Teen Investor)',
    experienceLevel: 'BEGINNER',
  });

  useEffect(() => {
    if (!isOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', closeOnEscape);
    return () => { document.body.style.overflow = previousOverflow; window.removeEventListener('keydown', closeOnEscape); };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleGoogleCredential = async (credential: string) => {
    setErrorMsg('');
    setLoading(true);
    const res = await loginWithGoogle(credential);
    setLoading(false);
    if (res.success) {
      setSuccessMsg(res.message);
      setTimeout(() => {
        onClose();
      }, 1200);
    } else {
      setErrorMsg(res.message);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginIdentifier.trim()) {
      setErrorMsg('Please enter your email or username');
      return;
    }
    if (!loginPassword) {
      setErrorMsg('Please enter your password');
      return;
    }
    setErrorMsg('');
    setLoading(true);
    const res = await loginUser(loginIdentifier, loginPassword);
    setLoading(false);
    if (res.success) {
      setSuccessMsg(res.message);
      setTimeout(() => {
        onClose();
      }, 1200);
    } else {
      setErrorMsg(res.message);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName.trim() || !formData.email.trim() || !formData.username.trim()) {
      setErrorMsg('Please fill in your Full Name, Email, and Username');
      return;
    }
    if (!formData.password || formData.password.length < 8) {
      setErrorMsg('Create a password with at least 8 characters');
      return;
    }
    setErrorMsg('');
    setLoading(true);
    const res = await registerUser(formData);
    setLoading(false);
    if (res.success) {
      setSuccessMsg('Account registered successfully! Welcome to Rupee Rookie.');
      setTimeout(() => {
        onClose();
      }, 1200);
    } else {
      setErrorMsg(res.message);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[120] flex items-end justify-center overflow-hidden bg-black/65 p-0 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label="RupeeRookie account"
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="max-h-[94dvh] w-full max-w-lg overflow-y-auto overflow-x-hidden rounded-t-[28px] border border-slate-200 bg-white shadow-2xl sm:max-h-[90vh] sm:rounded-3xl"
        onClick={(event) => event.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 bg-slate-900 px-4 py-4 text-white sm:px-6 sm:py-5">
          <div className="flex min-w-0 items-center gap-3 pr-2">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center font-bold text-white shadow-md">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="truncate font-extrabold text-sm tracking-tight sm:text-base">
                {currentUser ? `Investor Profile: ${currentUser.fullName}` : 'Rupee Rookie Investor Account'}
              </h3>
              <p className="text-xs text-zinc-300">
                {currentUser ? 'Your active simulator account credentials' : 'Join India’s premier student paper trading simulator'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close account dialog"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-white/15 bg-white/10 text-zinc-200 transition-colors hover:bg-white/20 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selection */}
        {!currentUser ? (
          <div className="bg-slate-50 border-b border-slate-200 px-6 py-2.5 flex items-center gap-2">
            <button
              onClick={() => { setActiveTab('signup'); setErrorMsg(''); setSuccessMsg(''); }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'signup'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Create Account
            </button>
            <button
              onClick={() => { setActiveTab('login'); setErrorMsg(''); setSuccessMsg(''); }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'login'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Sign In
            </button>
          </div>
        ) : (
          <div className="bg-slate-50 border-b border-slate-200 px-6 py-2.5 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-emerald-700" />
              Logged In Profile
            </span>
            <button
              onClick={() => { logoutUser(); onClose(); }}
              className="flex items-center gap-1 text-xs text-rose-600 hover:text-rose-800 font-bold px-3 py-1.5 rounded-xl hover:bg-rose-50 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        )}

        {/* Body Content */}
        <div className="p-6">
          {errorMsg && (
            <div role="alert" aria-live="assertive" className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div role="status" aria-live="polite" className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Google Sign-In / Sign-Up (hidden when GOOGLE_CLIENT_ID is not configured) */}
          {!currentUser && (
            <GoogleSignInButton
              onCredential={handleGoogleCredential}
              text={activeTab === 'login' ? 'signin_with' : 'signup_with'}
            >
              <AuthOrDivider className="text-slate-400 border-slate-200" />
            </GoogleSignInButton>
          )}

          {/* SIGNUP FORM */}
          {!currentUser && activeTab === 'signup' && (
            <form onSubmit={handleSignupSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-900 mb-1">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      placeholder="e.g. Aarav Jain"
                      className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-[#64748B] focus:outline-none focus:border-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-900 mb-1">
                    Username <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="text-xs font-bold text-slate-500 absolute left-3 top-1/2 -translate-y-1/2">@</span>
                    <input
                      type="text"
                      required
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      placeholder="aarav_investor"
                      className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-[#64748B] focus:outline-none focus:border-slate-900"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-900 mb-1">
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="aarav@gmail.com"
                      className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-[#64748B] focus:outline-none focus:border-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-900 mb-1">
                    Phone / WhatsApp (Optional)
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+91 98765 43210"
                      className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-[#64748B] focus:outline-none focus:border-slate-900"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-900 mb-1">
                    Age / Student Cohort
                  </label>
                  <select
                    value={formData.ageGroup}
                    onChange={(e) => setFormData({ ...formData, ageGroup: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-slate-900"
                  >
                    <option value="13-15 (Middle School)">13-15 (Middle School)</option>
                    <option value="16-18 (Teen Investor)">16-18 (Teen Investor)</option>
                    <option value="18-22 (College Student)">18-22 (College Student)</option>
                    <option value="22+ (Young Professional)">22+ (Young Professional)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-900 mb-1">
                    Trading Experience
                  </label>
                  <select
                    value={formData.experienceLevel}
                    onChange={(e) => setFormData({ ...formData, experienceLevel: e.target.value as any })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-slate-900"
                  >
                    <option value="BEGINNER">Beginner (Starting Fresh)</option>
                    <option value="INTERMEDIATE">Intermediate (Know Basics)</option>
                    <option value="ADVANCED">Advanced (Active Trader)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1">
                  Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    minLength={8}
                    maxLength={128}
                    autoComplete="new-password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="At least 8 characters"
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-[#64748B] focus:outline-none focus:border-slate-900"
                  />
                </div>
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  <span className="font-bold text-emerald-900">Virtual Capital Grant:</span>
                </div>
                <span className="font-mono font-extrabold text-emerald-800">₹10,00,000 INR (Free)</span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? 'Registering Account...' : 'Complete Sign Up & Start Trading'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* SIGNIN FORM */}
          {!currentUser && activeTab === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1">
                  Email or Username <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    placeholder="aarav@gmail.com or aarav_investor"
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-[#64748B] focus:outline-none focus:border-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1">
                  Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    autoComplete="current-password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-[#64748B] focus:outline-none focus:border-slate-900"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-slate-900 hover:bg-indigo-950 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? 'Authenticating...' : 'Sign In to Rupee Rookie'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* ACTIVE LOGGED IN PROFILE CARD */}
          {currentUser && (
            <div className="space-y-4">
              <div className="bg-white border border-slate-200 p-4 rounded-2xl space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-lg">
                    {currentUser.fullName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-sm">{currentUser.fullName}</h4>
                    <p className="text-xs text-slate-500">@{currentUser.username} • {currentUser.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/50 text-xs">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Investor Tier</span>
                    <span className="font-extrabold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full inline-block mt-0.5 text-[10px]">
                      {currentUser.experienceLevel}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Age Cohort</span>
                    <span className="font-bold text-slate-900 block mt-0.5 text-[11px]">
                      {currentUser.ageGroup || 'Teen Investor'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Virtual Capital</span>
                    <span className="font-bold text-slate-900 block mt-0.5 text-[11px]">
                      ₹{(currentUser.initialCapital || 1000000).toLocaleString('en-IN')} INR
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Contact</span>
                    <span className="font-bold text-slate-900 block mt-0.5 text-[11px]">
                      {currentUser.phone || 'Not Provided'}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all"
              >
                Continue Trading
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>,
    document.body
  );
};
