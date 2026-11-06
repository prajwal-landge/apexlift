import React, { useState } from 'react';
import Logo from '../components/Logo';
import { ArrowRight, Zap, Shield, Flame, CheckCircle2, AlertCircle } from 'lucide-react';
import { api, setToken, setCurrentUser } from '../api';

export default function AuthScreen({ onAuthSuccess }) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [weeklyTarget, setWeeklyTarget] = useState(4);
  const [units, setUnits] = useState('kg');
  
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    try {
      let res;
      if (isRegister) {
        res = await api.register({
          email,
          password,
          full_name: fullName,
          weekly_target: parseInt(weeklyTarget, 10),
          units
        });
      } else {
        res = await api.login(email, password);
      }

      setToken(res.access_token);
      setCurrentUser(res.user);
      onAuthSuccess(res.user);
    } catch (err) {
      setErrorMessage(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const res = await api.loginDemo();
      setToken(res.access_token);
      setCurrentUser(res.user);
      onAuthSuccess(res.user);
    } catch (err) {
      setErrorMessage(err.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-void flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <Logo size="lg" showTagline />
          </div>
          <h1 className="font-headline text-4xl font-black text-chalk uppercase tracking-wide">
            Make Today Count
          </h1>
          <p className="text-muted text-xs font-sans max-w-sm mx-auto leading-relaxed">
            XP rewards SHOWING UP, never lifting heavier. Level your character, complete quests, and build lifelong consistency.
          </p>
        </div>

        {/* 1-Click Demo Login Banner */}
        <div className="bg-gradient-to-r from-ember/15 via-carbon to-gold/10 border border-steel rounded-card p-4 relative overflow-hidden shadow-xl">
          <div className="flex items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-gold font-bold block">
                Instant Access
              </span>
              <h4 className="font-headline text-lg font-bold text-chalk uppercase">
                Explore as Jordan Davis
              </h4>
              <p className="text-[11px] text-muted">
                Level 12 Berserker • 6-week streak • Full 3-week history
              </p>
            </div>

            <button
              onClick={handleDemoLogin}
              disabled={loading}
              className="min-h-[48px] px-4 bg-ember hover:bg-ember-hot text-white font-headline text-sm font-bold uppercase tracking-wider rounded-xl shadow-lg shadow-ember/25 transition-all flex items-center gap-1.5 flex-shrink-0 active:scale-95"
            >
              <span>Demo Login</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Auth Form Card */}
        <div className="bg-carbon border border-steel rounded-card p-6 shadow-2xl">
          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-void border border-steel rounded-xl mb-5">
            <button
              type="button"
              onClick={() => { setIsRegister(false); setErrorMessage(''); }}
              className={`py-2 rounded-lg font-headline text-sm font-bold uppercase tracking-wider transition-colors ${
                !isRegister ? 'bg-carbon text-chalk shadow' : 'text-muted hover:text-chalk'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setIsRegister(true); setErrorMessage(''); }}
              className={`py-2 rounded-lg font-headline text-sm font-bold uppercase tracking-wider transition-colors ${
                isRegister ? 'bg-carbon text-chalk shadow' : 'text-muted hover:text-chalk'
              }`}
            >
              Join Apex
            </button>
          </div>

          {errorMessage && (
            <div className="bg-ember/15 border border-ember text-chalk p-3 rounded-xl text-xs flex items-center gap-2 mb-4">
              <AlertCircle className="w-4 h-4 text-ember-hot flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div>
                <label className="text-xs font-mono uppercase tracking-wider text-muted block mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Alex Hunter"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-void border border-steel rounded-xl px-4 py-2.5 text-xs text-chalk focus:outline-none focus:border-ember"
                  required
                />
              </div>
            )}

            <div>
              <label className="text-xs font-mono uppercase tracking-wider text-muted block mb-1">
                Email Address
              </label>
              <input
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-void border border-steel rounded-xl px-4 py-2.5 text-xs text-chalk focus:outline-none focus:border-ember"
                required
              />
            </div>

            <div>
              <label className="text-xs font-mono uppercase tracking-wider text-muted block mb-1">
                Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-void border border-steel rounded-xl px-4 py-2.5 text-xs text-chalk focus:outline-none focus:border-ember"
                required
              />
            </div>

            {isRegister && (
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-xs font-mono uppercase tracking-wider text-muted block mb-1">
                    Weekly Target
                  </label>
                  <select
                    value={weeklyTarget}
                    onChange={(e) => setWeeklyTarget(e.target.value)}
                    className="w-full bg-void border border-steel rounded-xl px-3 py-2 text-xs text-chalk font-headline uppercase font-bold focus:outline-none focus:border-ember"
                  >
                    <option value="2">2 Days / Week</option>
                    <option value="3">3 Days / Week</option>
                    <option value="4">4 Days / Week</option>
                    <option value="5">5 Days / Week</option>
                    <option value="6">6 Days / Week</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-mono uppercase tracking-wider text-muted block mb-1">
                    Default Units
                  </label>
                  <select
                    value={units}
                    onChange={(e) => setUnits(e.target.value)}
                    className="w-full bg-void border border-steel rounded-xl px-3 py-2 text-xs text-chalk font-headline uppercase font-bold focus:outline-none focus:border-ember"
                  >
                    <option value="kg">kg (Kilograms)</option>
                    <option value="lbs">lbs (Pounds)</option>
                  </select>
                </div>
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full min-h-[48px] bg-ember hover:bg-ember-hot disabled:opacity-50 text-white font-headline text-lg font-bold uppercase tracking-wider rounded-xl shadow-lg shadow-ember/25 transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span>{isRegister ? 'Create Apex Profile' : 'Sign In To ApexLift'}</span>
                )}
              </button>
            </div>
          </form>
        </div>

        <div className="text-center text-xs text-muted font-mono">
          <span>ApexLift v1.0 • Void Dark Theme • RPG Gym Consistency</span>
        </div>
      </div>
    </div>
  );
}
