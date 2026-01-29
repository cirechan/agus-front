import React from 'react';
import { Icons } from './Icon';
import { ViewState } from '@/lib/puntos/types';

interface TabsProps {
  currentView: ViewState;
  onChange: (view: ViewState) => void;
  hasActiveSession: boolean;
}

export const Tabs: React.FC<TabsProps> = ({ currentView, onChange, hasActiveSession }) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 safe-area-pb z-50">
      <div className="flex justify-around items-center h-16 w-full">
        <button
          onClick={() => onChange(ViewState.DASHBOARD)}
          className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${
            currentView === ViewState.DASHBOARD ? 'text-indigo-600' : 'text-slate-400'
          }`}
        >
          <Icons.Trophy size={20} />
          <span className="text-[10px] font-medium">Ranking</span>
        </button>

        <button
          onClick={() => onChange(hasActiveSession ? ViewState.SESSION_ACTIVE : ViewState.SESSION_SETUP)}
          className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${
            currentView === ViewState.SESSION_ACTIVE || currentView === ViewState.SESSION_SETUP
              ? 'text-indigo-600'
              : 'text-slate-400'
          }`}
        >
          <div className={`p-2 rounded-full ${hasActiveSession ? 'bg-indigo-100' : 'bg-slate-100'}`}>
            <Icons.Play size={24} className={hasActiveSession ? 'fill-current' : ''} />
          </div>
          <span className="text-[10px] font-medium">{hasActiveSession ? 'Entreno' : 'Nuevo'}</span>
        </button>

        <button
          onClick={() => onChange(ViewState.HISTORY)}
          className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${
            currentView === ViewState.HISTORY ? 'text-indigo-600' : 'text-slate-400'
          }`}
        >
          <Icons.Calendar size={20} />
          <span className="text-[10px] font-medium">Historial</span>
        </button>

        <button
          onClick={() => onChange(ViewState.ROSTER)}
          className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${
            currentView === ViewState.ROSTER ? 'text-indigo-600' : 'text-slate-400'
          }`}
        >
          <Icons.Users size={20} />
          <span className="text-[10px] font-medium">Equipo</span>
        </button>
      </div>
    </div>
  );
};
