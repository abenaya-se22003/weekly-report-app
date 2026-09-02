import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { Role } from '../types';
import { LogIn, UserPlus, Shield, User, Sparkles, AlertCircle } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('TEAM_MEMBER');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login, register, demoLogin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (isRegister) {
        await register(name, email, password, role);
      } else {
        await login(email, password);
      }
      navigate(role === 'MANAGER' ? '/dashboard' : '/reports/mine', { replace: true });
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickDemo = async (demoEmail: string, demoRole: Role) => {
    setError(null);
    setIsSubmitting(true);
    try {
      await demoLogin(demoEmail);
      navigate(demoRole === 'MANAGER' ? '/dashboard' : '/reports/mine', { replace: true });
    } catch (err: any) {
      setError(err.message || 'Demo login failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Subtle Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-primary-600 to-indigo-400 shadow-xl shadow-primary-500/25 mb-4 border border-primary-400/30">
            <span className="text-white font-extrabold text-2xl">W</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Weekly Report<span className="text-primary-400">Sync</span>
          </h1>
          <p className="text-sm text-surface-400 mt-1.5">
            Team Progress &amp; Weekly Accountability Platform
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-surface-900/80 backdrop-blur-xl border border-surface-800/80 rounded-2xl shadow-2xl p-6 sm:p-8">
          {/* Mode Switcher Tabs */}
          <div className="flex bg-surface-950 p-1 rounded-xl border border-surface-800 mb-6">
            <button
              type="button"
              onClick={() => {
                setIsRegister(false);
                setError(null);
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                !isRegister
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'text-surface-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setIsRegister(true);
                setError(null);
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                isRegister
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'text-surface-400 hover:text-white'
              }`}
            >
              Register New Account
            </button>
          </div>

          {error && (
            <div className="mb-5 p-3.5 bg-rose-500/10 border border-rose-500/25 rounded-xl text-xs text-rose-300 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div>
                <label className="block text-xs font-semibold text-surface-300 mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-surface-950/80 border border-surface-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-surface-500 focus:outline-none focus:border-primary-500 transition-colors"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-surface-300 mb-1.5">
                Work Email
              </label>
              <input
                type="email"
                required
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-surface-950/80 border border-surface-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-surface-500 focus:outline-none focus:border-primary-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-surface-300 mb-1.5">
                Password
              </label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-surface-950/80 border border-surface-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-surface-500 focus:outline-none focus:border-primary-500 transition-colors"
              />
            </div>

            {isRegister && (
              <div>
                <label className="block text-xs font-semibold text-surface-300 mb-1.5">
                  Assign Account Role
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('TEAM_MEMBER')}
                    className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      role === 'TEAM_MEMBER'
                        ? 'bg-primary-600/20 border-primary-500 text-primary-300 shadow-sm'
                        : 'bg-surface-950 border-surface-800 text-surface-400 hover:text-surface-200'
                    }`}
                  >
                    <User className="w-3.5 h-3.5" /> Team Member
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('MANAGER')}
                    className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      role === 'MANAGER'
                        ? 'bg-purple-600/20 border-purple-500 text-purple-300 shadow-sm'
                        : 'bg-surface-950 border-surface-800 text-surface-400 hover:text-surface-200'
                    }`}
                  >
                    <Shield className="w-3.5 h-3.5" /> Manager
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-3 bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-primary-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : isRegister ? (
                <>
                  <UserPlus className="w-4 h-4" /> Create Account
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" /> Sign In
                </>
              )}
            </button>
          </form>

          {/* 1-Click Quick Demo Login Section */}
          <div className="mt-8 pt-6 border-t border-surface-800/80">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-primary-400 mb-3">
              <Sparkles className="w-3.5 h-3.5" /> 1-Click Quick Demo Accounts
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemo('alice.chen@company.com', 'TEAM_MEMBER')}
                className="text-left p-2.5 bg-surface-950/80 hover:bg-surface-800/80 border border-surface-800 rounded-xl transition-all group"
              >
                <div className="text-xs font-semibold text-white group-hover:text-primary-300">
                  Alice Chen
                </div>
                <div className="text-[10px] text-surface-400">Team Member</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo('bob.martinez@company.com', 'TEAM_MEMBER')}
                className="text-left p-2.5 bg-surface-950/80 hover:bg-surface-800/80 border border-surface-800 rounded-xl transition-all group"
              >
                <div className="text-xs font-semibold text-white group-hover:text-primary-300">
                  Bob Martinez
                </div>
                <div className="text-[10px] text-surface-400">Team Member</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo('sarah.johnson@company.com', 'MANAGER')}
                className="text-left p-2.5 bg-surface-950/80 hover:bg-surface-800/80 border border-purple-500/20 rounded-xl transition-all group"
              >
                <div className="text-xs font-semibold text-purple-200 group-hover:text-purple-300">
                  Sarah Johnson
                </div>
                <div className="text-[10px] text-purple-400/80">Manager (Admin)</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo('michael.torres@company.com', 'MANAGER')}
                className="text-left p-2.5 bg-surface-950/80 hover:bg-surface-800/80 border border-purple-500/20 rounded-xl transition-all group"
              >
                <div className="text-xs font-semibold text-purple-200 group-hover:text-purple-300">
                  Michael Torres
                </div>
                <div className="text-[10px] text-purple-400/80">Manager (Admin)</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
