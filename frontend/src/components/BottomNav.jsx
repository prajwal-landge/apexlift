import React from 'react';
import { LayoutDashboard, Dumbbell, Calendar, Target, Trophy, TrendingUp } from 'lucide-react';

export default function BottomNav({ activeTab, setActiveTab }) {
  const tabs = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'workout', label: 'Log', icon: Dumbbell, highlight: true },
    { id: 'progress', label: 'Stats', icon: TrendingUp },
    { id: 'plans', label: 'Plans', icon: Calendar },
    { id: 'quests', label: 'Quests', icon: Target },
    { id: 'league', label: 'League', icon: Trophy },
  ];

  return (
    <nav 
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-void/95 backdrop-blur-lg border-t border-steel pb-safe"
    >
      <div className="grid grid-cols-6 h-16 max-w-md mx-auto items-center px-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          if (tab.highlight) {
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex flex-col items-center justify-center -mt-4 group focus:outline-none"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg transition-transform active:scale-95 ${
                  isActive ? 'bg-ember-hot shadow-ember/40 scale-105' : 'bg-ember hover:bg-ember-hot shadow-ember/20'
                }`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <span className={`text-[10px] font-headline font-bold uppercase tracking-wider mt-1 ${
                  isActive ? 'text-ember-hot' : 'text-muted'
                }`}>
                  {tab.label}
                </span>
              </button>
            );
          }

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex flex-col items-center justify-center h-full py-1 text-center transition-colors focus:outline-none"
            >
              <Icon className={`w-5 h-5 transition-transform ${
                isActive ? 'text-ember-hot scale-110' : 'text-muted hover:text-chalk'
              }`} />
              <span className={`text-[10px] font-headline font-bold uppercase tracking-wider mt-1 ${
                isActive ? 'text-ember-hot' : 'text-muted'
              }`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
