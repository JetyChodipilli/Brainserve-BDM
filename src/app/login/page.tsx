// src/app/login/page.tsx
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Lock, Mail, ArrowRight, AlertCircle, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed.');
      }

      // Route to user's dedicated portal
      if (data.user.role === 'CEO') {
        router.push('/ceo/dashboard');
      } else if (data.user.role === 'HR') {
        router.push('/hr/dashboard');
      } else {
        router.push('/bdm/dashboard');
      }
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (roleEmail: string, rolePass: string) => {
    setEmail(roleEmail);
    setPassword(rolePass);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 text-white font-black text-2xl shadow-xl shadow-indigo-500/20 mb-4">
          B
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          EduDeal Enterprise
        </h1>
        <p className="mt-2 text-sm text-slate-300">
          College Business Deal Management & Executive Governance
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-2xl rounded-2xl border border-slate-100">
          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Work Email Address
              </label>
              <div className="mt-1 relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@enterprise.edu"
                  className="block w-full pl-9 pr-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 bg-white text-slate-900 placeholder:text-slate-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Password
              </label>
              <div className="mt-1 relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="block w-full pl-9 pr-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 bg-white text-slate-900 placeholder:text-slate-400"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg shadow-md text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors"
            >
              {loading ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <span>Sign In to Platform</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Login Credentials Bar */}
          <div className="mt-8 pt-6 border-t border-slate-200">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-3">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>One-Click Role Demonstration Accounts</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickLogin('ceo@enterprise.edu', 'CeoPassword123!')}
                className="p-2 text-left rounded-lg border border-amber-200 bg-amber-50 hover:bg-amber-100 transition-colors"
              >
                <div className="font-bold text-amber-900">👑 CEO Executive</div>
                <div className="text-[11px] text-amber-700">Dr. Rajesh Nair</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('hr@enterprise.edu', 'HrPassword123!')}
                className="p-2 text-left rounded-lg border border-purple-200 bg-purple-50 hover:bg-purple-100 transition-colors"
              >
                <div className="font-bold text-purple-900">👥 HR Operations</div>
                <div className="text-[11px] text-purple-700">Ananya Iyer</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('bdm.vikram@enterprise.edu', 'BdmPassword123!')}
                className="p-2 text-left rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 transition-colors"
              >
                <div className="font-bold text-blue-900">💼 BDM Lead 1</div>
                <div className="text-[11px] text-blue-700">Vikram Sharma</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('bdm.priya@enterprise.edu', 'BdmPassword123!')}
                className="p-2 text-left rounded-lg border border-teal-200 bg-teal-50 hover:bg-teal-100 transition-colors"
              >
                <div className="font-bold text-teal-900">💼 BDM Lead 2</div>
                <div className="text-[11px] text-teal-700">Priya Patel</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
