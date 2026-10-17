// src/app/register/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Shield,
  Lock,
  Mail,
  User,
  Phone,
  Briefcase,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'CEO' | 'HR' | 'BDM'>('BDM');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [hasCeo, setHasCeo] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Check whether a CEO is already registered
  useEffect(() => {
    async function checkCeoStatus() {
      try {
        const res = await fetch('/api/auth/register');
        if (res.ok) {
          const data = await res.json();
          setHasCeo(data.hasCeo);
          // Default to BDM if CEO already exists
          if (data.hasCeo) {
            setRole('BDM');
          }
        }
      } catch (err) {
        // Fallback
      }
    }
    checkCeoStatus();
  }, []);

  const isCeoBlocked = role === 'CEO' && hasCeo === true;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please ensure both passwords match.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (isCeoBlocked) {
      setError(
        'A Chief Executive Officer (CEO) account has already been registered for this organization. Only one CEO account is permitted. Please choose HR or BDM.'
      );
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName,
          email,
          phone,
          role,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Registration failed. Please review your details.');
      }

      setSuccess('Account registered successfully! Redirecting to sign in...');
      setTimeout(() => {
        router.push('/login?registered=1');
      }, 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gray-800 text-white font-black text-2xl shadow-xl mb-4">
          <svg width="16" height="16" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none" preserveAspectRatio="xMidYMid meet" shape-rendering="geometricPrecision"><title>BrainServe</title><defs><linearGradient id="favicon-red" x1="4" y1="2" x2="12" y2="7.5"><stop offset="0" stop-color="#FF4549"/><stop offset="1" stop-color="#D91F27"/></linearGradient><linearGradient id="favicon-black" x1="4" y1="8" x2="12" y2="13"><stop offset="0" stop-color="#454B4A"/><stop offset="0.55" stop-color="#292E2D"/><stop offset="1" stop-color="#101313"/></linearGradient><linearGradient id="red-highlight" x1="4" y1="3" x2="8" y2="7"><stop offset="0" stop-color="#FFFFFF" stop-opacity="0.38"/><stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/></linearGradient><linearGradient id="black-highlight" x1="3" y1="8" x2="8" y2="12"><stop offset="0" stop-color="#FFFFFF" stop-opacity="0.2"/><stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/></linearGradient></defs><path d="M2.15 7.3L6.2 2.25H9.8L13.85 7.3H10.75L8 3.9L5.25 7.3H2.15Z" fill="url(#favicon-red)" stroke="#D91F27" stroke-width="0.22" stroke-linejoin="round"/><path d="M2.15 7.7L6.2 12.75H9.8L13.85 7.7H10.75L8 11.1L5.25 7.7H2.15Z" fill="url(#favicon-black)" stroke="#101313" stroke-width="0.22" stroke-linejoin="round"/><path d="M4.05 6.55L6.7 3.25H8.85" stroke="url(#red-highlight)" stroke-width="0.32" stroke-linecap="round" stroke-linejoin="round"/><path d="M3.25 8.15L6.35 12.05" stroke="url(#black-highlight)" stroke-width="0.3" stroke-linecap="round"/></svg>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-800 tracking-tight">
          Brainserve BDM
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Role‑Based Access Registration
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-2xl rounded-2xl border border-slate-100">
          <form className="space-y-4" onSubmit={handleSubmit}>
            {error && (
              <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                <span className="font-medium leading-relaxed">{error}</span>
              </div>
            )}

            {success && (
              <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                <span className="font-semibold leading-relaxed">{success}</span>
              </div>
            )}

            {/* Role Selection Dropdown */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Select Your Role <span className="text-rose-500">*</span>
              </label>
              <div className="mt-1 relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Briefcase className="w-4 h-4" />
                </div>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as 'CEO' | 'HR' | 'BDM')}
                  className="block w-full pl-9 pr-8 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 bg-white text-slate-900 font-medium"
                >
                  <option value="BDM" title="Business Development Manager – can submit and manage deals.">BDM — Business Development Manager (Field Deals & Proposals)</option>
                  <option value="HR" title="Human Resources – can create onboarding tasks.">HR — Human Resources (Onboarding Execution & Operations)</option>
                  <option value="CEO" title="Only one CEO allowed; if already registered, choose HR or BDM.">
                    CEO — Chief Executive Officer {hasCeo ? '(Already Registered)' : '(Organization Head)'}
                  </option>
                </select>
              </div>

              {/* Dynamic CEO Validation Alert */}
              {isCeoBlocked && (
                <div className="mt-2.5 p-3 rounded-lg bg-amber-50 border border-amber-300 text-xs text-amber-900 flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                  <div>
                    <span className="font-bold">Organization Constraint: </span>
                    <span>
                      A Chief Executive Officer (CEO) account has already been registered for this organization. Only <strong>one CEO account</strong> is permitted. Please switch your role to <strong>HR</strong> or <strong>BDM</strong>.
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <div className="mt-1 relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Vikram Sharma"
                  className="block w-full pl-9 pr-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 bg-white text-slate-900 placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Work Email / Mail ID */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Work Email Address (Mail ID) <span className="text-rose-500">*</span>
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

            {/* Phone */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Phone Number (Optional)
              </label>
              <div className="mt-1 relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="block w-full pl-9 pr-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 bg-white text-slate-900 placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Password <span className="text-rose-500">*</span>
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
                    placeholder="Min. 8 chars"
                    className="block w-full pl-9 pr-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 bg-white text-slate-900 placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Confirm Password <span className="text-rose-500">*</span>
                </label>
                <div className="mt-1 relative rounded-lg shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    className="block w-full pl-9 pr-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 bg-white text-slate-900 placeholder:text-slate-400"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || isCeoBlocked}
              className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg shadow-md text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <span>Registering Account...</span>
              ) : isCeoBlocked ? (
                <span>Cannot Register (CEO Already Exists)</span>
              ) : (
                <>
                  <span>Complete Registration</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer links */}
          <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
            <span>Already have an account?</span>
            <Link
              href="/login"
              className="font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              Sign In to Your Account →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
