import React, { useState, useEffect } from 'react';
import { Settings, Save, LogOut, RotateCcw, CheckCircle2, Shield, User } from 'lucide-react';
import { api } from '../api';

export default function SettingsScreen({ user, onUpdateUser, onLogout }) {
  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    units: user?.units || 'kg',
    weekly_target: user?.weekly_target || 4,
    experience_level: user?.experience_level || 'Intermediate',
    goal: user?.goal || ''
  });

  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState('');

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || '',
        units: user.units || 'kg',
        weekly_target: user.weekly_target || 4,
        experience_level: user.experience_level || 'Intermediate',
        goal: user.goal || ''
      });
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSavedMessage('');

    try {
      const res = await api.updateSettings({
        full_name: formData.full_name,
        units: formData.units,
        weekly_target: parseInt(formData.weekly_target, 10),
        experience_level: formData.experience_level,
        goal: formData.goal
      });

      if (onUpdateUser) {
        onUpdateUser(res.settings);
      }
      setSavedMessage("Settings saved successfully.");
      setTimeout(() => setSavedMessage(''), 3000);
    } catch (err) {
      setSavedMessage(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleResetDemo = async () => {
    try {
      const res = await api.loginDemo();
      if (onUpdateUser) {
        onUpdateUser(res.user);
      }
      setSavedMessage("Reset to Jordan Davis demo profile (Lvl 12, 6w streak).");
      setTimeout(() => setSavedMessage(''), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 pb-24 md:pb-12 max-w-xl mx-auto">
      {/* Header */}
      <div className="border-b border-steel pb-4">
        <span className="text-[10px] font-mono uppercase tracking-widest text-muted font-bold">
          Preferences & Protocol
        </span>
        <h2 className="font-headline text-3xl font-extrabold text-chalk uppercase tracking-wide">
          Settings
        </h2>
        <p className="text-muted text-xs font-sans mt-0.5">
          Tune your targets, measurement units, and identity.
        </p>
      </div>

      {savedMessage && (
        <div className="bg-streak/15 border border-streak text-chalk p-3.5 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-streak flex-shrink-0" />
          <span>{savedMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-carbon border border-steel rounded-card p-5 space-y-5 shadow-xl">
        {/* Full Name */}
        <div>
          <label className="text-xs font-mono uppercase tracking-wider text-muted block mb-1.5">
            Athlete Name
          </label>
          <input
            type="text"
            value={formData.full_name}
            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            className="w-full bg-void border border-steel rounded-xl px-4 py-2.5 text-sm text-chalk focus:outline-none focus:border-ember"
            required
          />
        </div>

        {/* Units: kg vs lbs */}
        <div>
          <label className="text-xs font-mono uppercase tracking-wider text-muted block mb-1.5">
            Weight Unit (kg / lbs)
          </label>
          <div className="grid grid-cols-2 gap-3">
            {['kg', 'lbs'].map((u) => (
              <button
                key={u}
                type="button"
                onClick={() => setFormData({ ...formData, units: u })}
                className={`min-h-[48px] rounded-xl font-headline text-lg font-bold uppercase tracking-wider transition-all border ${
                  formData.units === u
                    ? 'bg-ember text-white border-ember shadow-md shadow-ember/20'
                    : 'bg-void text-muted border-steel hover:text-chalk'
                }`}
              >
                {u.toUpperCase()} ({u === 'kg' ? 'Kilograms' : 'Pounds'})
              </button>
            ))}
          </div>
        </div>

        {/* Weekly Target Sessions: 2 - 6 */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-mono uppercase tracking-wider text-muted">
              Weekly Target Sessions (2 - 6)
            </label>
            <span className="font-headline text-xl font-bold text-gold">
              {formData.weekly_target}x per week
            </span>
          </div>

          <input
            type="range"
            min="2"
            max="6"
            step="1"
            value={formData.weekly_target}
            onChange={(e) => setFormData({ ...formData, weekly_target: parseInt(e.target.value, 10) })}
            className="w-full accent-ember cursor-pointer"
          />
          <div className="flex justify-between text-[11px] text-muted font-mono mt-1">
            <span>2 Sessions (Maintain)</span>
            <span>4 Sessions (Recommended)</span>
            <span>6 Sessions (Heavy)</span>
          </div>
        </div>

        {/* Experience Level */}
        <div>
          <label className="text-xs font-mono uppercase tracking-wider text-muted block mb-1.5">
            Experience Level
          </label>
          <select
            value={formData.experience_level}
            onChange={(e) => setFormData({ ...formData, experience_level: e.target.value })}
            className="w-full bg-void border border-steel rounded-xl px-4 py-2.5 text-xs text-chalk font-headline uppercase font-bold tracking-wider focus:outline-none focus:border-ember"
          >
            <option value="Beginner">Beginner (0 - 1 years)</option>
            <option value="Intermediate">Intermediate (1 - 3 years)</option>
            <option value="Advanced">Advanced (3+ years)</option>
          </select>
        </div>

        {/* Goal Description */}
        <div>
          <label className="text-xs font-mono uppercase tracking-wider text-muted block mb-1.5">
            Current Target / Goal
          </label>
          <input
            type="text"
            value={formData.goal}
            onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
            placeholder="e.g. Consistent 4x/week lifting & 140kg Deadlift"
            className="w-full bg-void border border-steel rounded-xl px-4 py-2.5 text-xs text-chalk focus:outline-none focus:border-ember"
          />
        </div>

        {/* Save Button (Min 48px) */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={saving}
            className="w-full min-h-[48px] bg-ember hover:bg-ember-hot text-white font-headline text-lg font-bold uppercase tracking-wider rounded-xl shadow-lg shadow-ember/25 transition-all flex items-center justify-center gap-2 active:scale-95"
          >
            <Save className="w-5 h-5" />
            <span>Save Preferences</span>
          </button>
        </div>
      </form>

      {/* Demo Profile Tools */}
      <div className="bg-carbon border border-steel rounded-card p-5 space-y-3">
        <h4 className="font-headline text-lg font-bold text-chalk uppercase tracking-wide">
          Developer & Demo Controls
        </h4>
        <p className="text-xs text-muted">
          Quickly switch back to the seeded Jordan Davis demo user (Level 12 Berserker, 6-week streak, 3 weeks history).
        </p>

        <button
          onClick={handleResetDemo}
          className="w-full min-h-[48px] bg-void border border-steel hover:border-gold/50 text-gold font-headline text-sm font-bold uppercase tracking-wider rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Switch to Demo User (Jordan Davis)</span>
        </button>

        <button
          onClick={onLogout}
          className="w-full min-h-[48px] bg-void border border-steel hover:border-ember/50 text-muted hover:text-ember-hot font-headline text-sm font-bold uppercase tracking-wider rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
}
