import React from 'react';
import Logo from './Logo';
import { Flame, Shield, User, LogOut } from 'lucide-react';

export default function Navbar({ user, activeTab, setActiveTab, onLogout }) {
  const navTabs = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'workout', label: 'Log Workout' },
    { id: 'progress', label: 'Progress' },
    { id: 'plans', label: 'My Plans' },
    { id: 'quests', label: 'Quests' },
    { id: 'league', label: 'League' },
    { id: 'settings', label: 'Settings' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-void/90 backdrop-blur-md border-b border-steel">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <button 
          onClick={() => setActiveTab('dashboard')} 
          className="text-left focus:outline-none flex items-center"
        >
          <Logo size="md" />
        </button>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1">
          {navTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-2 rounded-lg font-headline text-base tracking-wide uppercase transition-colors ${
                  isActive
                    ? 'text-ember-hot bg-carbon border border-steel/80 shadow-sm'
                    : 'text-muted hover:text-chalk hover:bg-steel/30'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* User Pill / Status */}
        {user && (
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Streak Badge */}
            <div className="flex items-center gap-1 bg-carbon border border-steel px-2 sm:px-2.5 py-1 rounded-lg text-xs font-headline font-bold text-streak tracking-wide">
              <span className="w-1.5 h-1.5 rounded-full bg-streak" />
              <span>{user.weekly_streak}W</span>
            </div>

            {/* Freezes Shield */}
            <div className="hidden sm:flex items-center gap-1 bg-carbon border border-steel px-2.5 py-1 rounded-lg text-xs font-sans text-muted">
              <Shield className="w-3.5 h-3.5 text-ember-hot" />
              <span className="font-headline font-bold text-chalk text-xs">{user.streak_freezes || 0}</span>
            </div>

            {/* Profile Avatar & Level */}
            <button
              onClick={() => setActiveTab('settings')}
              className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-lg bg-carbon border border-steel hover:border-gold/50 transition-colors focus:outline-none"
              title="Open Settings"
            >
              <div className="w-7 h-7 rounded-full bg-void border border-gold overflow-hidden flex items-center justify-center">
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-4 h-4 text-gold" />
                )}
              </div>
              <span className="font-headline text-sm font-bold text-gold">
                L{user.level}
              </span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
