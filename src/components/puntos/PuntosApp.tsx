"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { AppData, Player, TrainingSession, PointLog, ViewState } from '@/lib/puntos/types';
import { loadData, saveData, generateId } from '@/lib/puntos/storage';
import { Tabs } from '@/components/puntos/Tabs';
import { Icons } from '@/components/puntos/Icon';
import { POINT_PRESETS } from '@/lib/puntos/constants';

const TEAM_COLORS: Record<string, { label: string, bg: string, text: string, border: string, ring: string }> = {
  red: { label: 'Rojo', bg: 'bg-rose-500', text: 'text-white', border: 'border-rose-600', ring: 'ring-rose-500' },
  blue: { label: 'Azul', bg: 'bg-blue-600', text: 'text-white', border: 'border-blue-700', ring: 'ring-blue-600' },
  yellow: { label: 'Amarillo', bg: 'bg-yellow-400', text: 'text-yellow-900', border: 'border-yellow-500', ring: 'ring-yellow-400' },
  black: { label: 'Negro', bg: 'bg-slate-800', text: 'text-white', border: 'border-slate-900', ring: 'ring-slate-800' },
  white: { label: 'Blanco', bg: 'bg-white', text: 'text-slate-800', border: 'border-slate-300', ring: 'ring-slate-300' },
  green: { label: 'Verde', bg: 'bg-emerald-500', text: 'text-white', border: 'border-emerald-600', ring: 'ring-emerald-500' },
};

export default function PuntosApp() {
  const [data, setData] = useState<AppData>({ players: [], sessions: [], logs: [] });
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.DASHBOARD);
  
  // Active Session State
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  
  // Selection State for Active Session
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<Set<string>>(new Set());
  const [sessionNote, setSessionNote] = useState<string>('');
  
  // Team Management State
  const [isEditingTeams, setIsEditingTeams] = useState(false);
  const [activeColorEdit, setActiveColorEdit] = useState<string>('red');

  // Load data on mount
  useEffect(() => {
    let isMounted = true;
    const init = async () => {
      const loaded = await loadData();
      if (!isMounted) return;
      setData(loaded);
      setIsLoaded(true);
      // Check if there is an incomplete session
      const openSession = loaded.sessions.find(s => !s.completed);
      if (openSession) {
        setActiveSessionId(openSession.id);
        setCurrentView(ViewState.SESSION_ACTIVE);
      }
    };
    void init();
    return () => {
      isMounted = false;
    };
  }, []);

  // Persist data whenever it changes
  useEffect(() => {
    if (!isLoaded) return;
    void saveData(data);
  }, [data, isLoaded]);

  const activeSession = useMemo(() => 
    data.sessions.find(s => s.id === activeSessionId), 
  [data.sessions, activeSessionId]);

  const handleStartSession = (attendees: string[], absences: string[]) => {
    const newSession: TrainingSession = {
      id: generateId(),
      date: new Date().toISOString().split('T')[0],
      attendees,
      absences,
      completed: false,
      teams: {}
    };
    
    setData(prev => ({
      ...prev,
      sessions: [newSession, ...prev.sessions]
    }));
    setActiveSessionId(newSession.id);
    setCurrentView(ViewState.SESSION_ACTIVE);
  };

  const handleRequestEndSession = () => {
      if (!activeSession) return;
      setCurrentView(ViewState.SESSION_SUMMARY);
  };

  const handleConfirmEndSession = () => {
    if (!activeSession) return;
    
    setData(prev => ({
      ...prev,
      sessions: prev.sessions.map(s => s.id === activeSession.id ? { ...s, completed: true } : s)
    }));
    setActiveSessionId(null);
    setCurrentView(ViewState.DASHBOARD);
  };

  const updatePlayerTeam = (playerId: string, colorKey: string | null) => {
    if (!activeSession) return;
    
    const currentTeams = activeSession.teams || {};
    let newTeams = { ...currentTeams };
    
    if (colorKey === null) {
      delete newTeams[playerId];
    } else {
      // Toggle off if already selected
      if (newTeams[playerId] === colorKey) {
          delete newTeams[playerId];
      } else {
          newTeams[playerId] = colorKey;
      }
    }

    setData(prev => ({
      ...prev,
      sessions: prev.sessions.map(s => s.id === activeSession.id ? { ...s, teams: newTeams } : s)
    }));
  };

  const addPoints = (points: number, reason: string) => {
    if (!activeSession || selectedPlayerIds.size === 0) return;

    const newLogs: PointLog[] = Array.from(selectedPlayerIds).map((pid) => ({
      id: generateId(),
      sessionId: activeSession.id,
      playerId: pid as string,
      points,
      reason: reason || (points > 0 ? 'Recompensa' : 'Penalización'),
      timestamp: Date.now()
    }));

    setData(prev => ({
      ...prev,
      logs: [...prev.logs, ...newLogs]
    }));
    
    // Clear selection after awarding
    setSelectedPlayerIds(new Set());
    setSessionNote('');
  };

  const toggleSelection = (playerId: string) => {
    setSelectedPlayerIds(prev => {
      const next = new Set(prev);
      if (next.has(playerId)) {
        next.delete(playerId);
      } else {
        next.add(playerId);
      }
      return next;
    });
  };

  const selectByTeamColor = (colorKey: string) => {
    if (!activeSession?.teams) return;
    const teamMembers = Object.entries(activeSession.teams)
      .filter(([_, color]) => color === colorKey)
      .map(([pid]) => pid);
    
    if (teamMembers.length > 0) {
      setSelectedPlayerIds(new Set(teamMembers));
    }
  };

  // --- VIEW COMPONENTS ---

  const RosterView = () => (
    <div className="p-4 pb-24">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Equipo</h1>
        <button 
          onClick={() => {
            const name = prompt('Nombre del jugador:');
            if(name) {
              const newPlayer: Player = { id: generateId(), name, isActive: true };
              setData(prev => ({...prev, players: [...prev.players, newPlayer]}));
            }
          }}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 shadow-sm active:scale-95 transition-transform"
        >
          <Icons.UserPlus size={18} />
          <span>Añadir</span>
        </button>
      </div>
      <div className="space-y-3">
        {data.players.map(player => (
          <div key={player.id} className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-100">
            <span className="font-medium text-lg text-slate-700">{player.name}</span>
            <div className="flex space-x-2">
               <button 
                onClick={() => {
                  if(confirm(`¿Eliminar a ${player.name}?`)) {
                    setData(prev => ({...prev, players: prev.players.filter(p => p.id !== player.id)}));
                  }
                }}
                className="text-slate-400 hover:text-rose-500 p-2"
              >
                <Icons.Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const SessionSetupView = () => {
    const [attendance, setAttendance] = useState<Set<string>>(new Set(data.players.map(p => p.id)));

    const toggleAttendance = (id: string) => {
      setAttendance(prev => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
    };

    return (
      <div className="p-4 pb-24 h-screen flex flex-col">
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Pasar Lista</h1>
        <p className="text-slate-500 mb-6 text-sm">Marca los jugadores que están presentes hoy.</p>
        
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {data.players.map(player => {
            const isPresent = attendance.has(player.id);
            return (
              <div 
                key={player.id} 
                onClick={() => toggleAttendance(player.id)}
                className={`flex justify-between items-center p-3 rounded-xl border transition-all cursor-pointer ${
                  isPresent 
                    ? 'bg-white border-indigo-200 shadow-sm' 
                    : 'bg-slate-50 border-slate-200 opacity-60'
                }`}
              >
                <span className={`font-medium ${isPresent ? 'text-slate-800' : 'text-slate-400'}`}>{player.name}</span>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center border ${
                  isPresent ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300'
                }`}>
                  {isPresent && <Icons.Check size={14} className="text-white" />}
                </div>
              </div>
            );
          })}
        </div>

        <div className="pt-4 border-t border-slate-100 mt-4">
          <div className="flex justify-between items-center mb-4 text-sm text-slate-500">
            <span>Presentes: {attendance.size}</span>
            <span>Ausentes: {data.players.length - attendance.size}</span>
          </div>
          <button 
            onClick={() => {
              const absentees = data.players.filter(p => !attendance.has(p.id)).map(p => p.id);
              handleStartSession(Array.from(attendance), absentees);
            }}
            className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-indigo-200 active:scale-[0.98] transition-all flex justify-center items-center space-x-2"
          >
            <span>Comenzar Entreno</span>
            <Icons.Play size={20} className="fill-current" />
          </button>
        </div>
      </div>
    );
  };

  const SessionSummaryView = () => {
    if (!activeSession) return null;
    const [copied, setCopied] = useState(false);

    // Calculate points for this session only
    const sessionLogs = data.logs.filter(l => l.sessionId === activeSession.id);
    const sessionPointsByPlayer: Record<string, number> = {};
    
    activeSession.attendees.forEach(pid => sessionPointsByPlayer[pid] = 0);
    sessionLogs.forEach(log => {
      if (sessionPointsByPlayer[log.playerId] !== undefined) {
        sessionPointsByPlayer[log.playerId] += log.points;
      }
    });

    const sortedPlayers = Object.entries(sessionPointsByPlayer)
      .map(([id, points]) => ({
        ...data.players.find(p => p.id === id)!,
        points
      }))
      .sort((a, b) => b.points - a.points);

    const mvps = sortedPlayers.slice(0, 3).filter(p => p.points > 0);
    const totalSessionPoints = sessionLogs.reduce((acc, l) => acc + l.points, 0);

    const generateShareText = () => {
       const date = new Date(activeSession.date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
       let text = `📅 *Resumen Entreno - ${date}*\n\n`;
       text += `👥 Asistentes: ${activeSession.attendees.length}\n`;
       text += `📉 Puntos repartidos: ${totalSessionPoints}\n\n`;
       
       if (mvps.length > 0) {
           text += `🏆 *MVP del Día*\n`;
           mvps.forEach((p, i) => {
               const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉';
               text += `${medal} ${p.name}: +${p.points}\n`;
           });
       } else {
           text += `¡Buen esfuerzo equipo!\n`;
       }
       
       text += `\n#CadetForce`;
       return text;
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(generateShareText());
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="flex flex-col h-[100dvh] bg-slate-50 animate-in fade-in duration-300">
            <div className="bg-indigo-600 text-white p-6 pb-12 rounded-b-[2.5rem] shadow-lg relative overflow-hidden">
                <div className="relative z-10 text-center">
                    <h1 className="text-2xl font-bold mb-1">¡Entrenamiento Completado!</h1>
                    <p className="text-indigo-100 text-sm">
                        {new Date(activeSession.date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </p>
                </div>
                {/* Decorative circles */}
                <div className="absolute top-0 left-0 w-32 h-32 bg-white opacity-5 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
                <div className="absolute bottom-0 right-0 w-40 h-40 bg-white opacity-10 rounded-full translate-x-1/3 translate-y-1/3"></div>
            </div>

            <div className="flex-1 px-4 -mt-8 overflow-y-auto pb-6">
                {/* Stats Card */}
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-4 flex justify-around text-center">
                    <div>
                        <div className="text-2xl font-bold text-slate-800">{activeSession.attendees.length}</div>
                        <div className="text-xs text-slate-400 uppercase font-bold tracking-wider">Asistentes</div>
                    </div>
                    <div className="w-[1px] bg-slate-100"></div>
                    <div>
                        <div className="text-2xl font-bold text-indigo-600">{totalSessionPoints > 0 ? '+' : ''}{totalSessionPoints}</div>
                        <div className="text-xs text-slate-400 uppercase font-bold tracking-wider">Puntos</div>
                    </div>
                </div>

                {/* Podium */}
                {mvps.length > 0 ? (
                    <div className="mb-6">
                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 ml-1">Podium del Día</h3>
                        <div className="space-y-2">
                            {mvps.map((p, i) => (
                                <div key={p.id} className={`flex items-center p-3 rounded-xl border ${
                                    i === 0 ? 'bg-yellow-50 border-yellow-200 shadow-sm' : 
                                    i === 1 ? 'bg-slate-50 border-slate-200' : 'bg-white border-slate-100'
                                }`}>
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-lg mr-3 ${
                                        i === 0 ? 'text-yellow-600' : i === 1 ? 'text-slate-500' : 'text-orange-700'
                                    }`}>
                                        {i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}
                                    </div>
                                    <div className="flex-1 font-semibold text-slate-800">{p.name}</div>
                                    <div className="font-mono font-bold text-indigo-600">+{p.points}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 text-center text-slate-400 mb-6">
                        No se repartieron puntos hoy.
                    </div>
                )}

                {/* Actions */}
                <div className="space-y-3">
                    <button 
                        onClick={handleCopy}
                        className="w-full bg-emerald-50 text-emerald-700 border border-emerald-200 py-3 rounded-xl font-bold flex items-center justify-center space-x-2 active:scale-95 transition-transform"
                    >
                        {copied ? <Icons.ClipboardCheck size={20} /> : <Icons.Copy size={20} />}
                        <span>{copied ? '¡Copiado!' : 'Copiar Resumen para WhatsApp'}</span>
                    </button>
                    
                    <button 
                        onClick={handleConfirmEndSession}
                        className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold shadow-lg shadow-slate-200 active:scale-95 transition-transform"
                    >
                        Guardar y Salir
                    </button>
                    
                    <button 
                        onClick={() => setCurrentView(ViewState.SESSION_ACTIVE)}
                        className="w-full text-slate-400 text-sm font-medium py-2"
                    >
                        Volver al entreno (Corregir)
                    </button>
                </div>
            </div>
        </div>
    );
  };

  const SessionActiveView = () => {
    if (!activeSession) return null;

    // Filter roster to only show attendees
    const attendees = data.players.filter(p => activeSession.attendees.includes(p.id));

    // Get active teams present in this session
    const activeTeamColors = new Set(Object.values(activeSession.teams || {}) as string[]);

    return (
      <div className="flex flex-col h-[100dvh] bg-slate-50">
        {/* Header */}
        <div className="px-4 py-3 bg-white border-b border-slate-200 flex justify-between items-center shadow-sm z-10">
          <div>
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wide">En curso</h2>
            <div className="font-bold text-slate-800 flex items-center space-x-2">
              <span>{new Date(activeSession.date).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' })}</span>
              {!isEditingTeams && (
                 <span className="bg-slate-100 text-slate-500 text-xs px-2 py-0.5 rounded-full">{attendees.length} J</span>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <button 
                onClick={() => {
                    setIsEditingTeams(!isEditingTeams);
                    setSelectedPlayerIds(new Set()); // Clear selections when switching modes
                }}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${
                    isEditingTeams 
                    ? 'bg-indigo-600 text-white shadow-md' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
            >
                <Icons.Settings size={14} />
                <span>{isEditingTeams ? 'Hecho' : 'Equipos'}</span>
            </button>
            {!isEditingTeams && (
                <button 
                onClick={handleRequestEndSession}
                className="text-rose-600 bg-rose-50 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-rose-100 transition-colors"
                >
                Terminar
                </button>
            )}
          </div>
        </div>

        {/* Tools Bar / Team Editor */}
        <div className={`border-b transition-all duration-300 ${isEditingTeams ? 'bg-white border-slate-200' : 'bg-slate-50 border-slate-200'}`}>
           
           {isEditingTeams ? (
                // EDIT MODE TOOLBAR
               <div className="p-3">
                   <p className="text-xs text-slate-500 mb-2 font-medium text-center">Selecciona un color y toca a los jugadores para asignarles peto.</p>
                   <div className="flex justify-center gap-3 overflow-x-auto pb-2 hide-scrollbar">
                       {Object.entries(TEAM_COLORS).map(([key, config]) => (
                           <button
                            key={key}
                            onClick={() => setActiveColorEdit(key)}
                            className={`flex flex-col items-center gap-1 min-w-[50px] transition-transform ${activeColorEdit === key ? 'scale-110' : 'opacity-60 scale-95'}`}
                           >
                               <div className={`w-8 h-8 rounded-full border-2 shadow-sm ${config.bg} ${config.border} ${activeColorEdit === key ? 'ring-2 ring-offset-2 ring-indigo-500' : ''}`}></div>
                               <span className="text-[10px] font-bold text-slate-600">{config.label}</span>
                           </button>
                       ))}
                       <button
                            onClick={() => setActiveColorEdit('none')}
                            className={`flex flex-col items-center gap-1 min-w-[50px] transition-transform ${activeColorEdit === 'none' ? 'scale-110' : 'opacity-60 scale-95'}`}
                           >
                               <div className={`w-8 h-8 rounded-full border-2 border-dashed border-slate-300 bg-slate-50 flex items-center justify-center ${activeColorEdit === 'none' ? 'ring-2 ring-offset-2 ring-indigo-500' : ''}`}>
                                   <Icons.X size={14} className="text-slate-400"/>
                               </div>
                               <span className="text-[10px] font-bold text-slate-600">Sin Peto</span>
                           </button>
                   </div>
               </div>
           ) : (
               // ACTIVE MODE TOOLBAR
               <div className="px-4 py-3 flex gap-2 overflow-x-auto hide-scrollbar">
                {activeTeamColors.size > 0 && (
                    <>
                        {Array.from(activeTeamColors).map(colorKey => {
                            const config = TEAM_COLORS[colorKey];
                            if(!config) return null;
                            return (
                                <button
                                    key={colorKey}
                                    onClick={() => selectByTeamColor(colorKey)}
                                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border shadow-sm transition-transform active:scale-95 ${config.bg} ${config.text} ${config.border}`}
                                >
                                    <Icons.Users size={14} />
                                    <span>{config.label}</span>
                                </button>
                            );
                        })}
                        <div className="w-[1px] bg-slate-300 mx-1 h-6 self-center shrink-0"></div>
                    </>
                )}

                <button 
                    onClick={() => setSelectedPlayerIds(new Set(attendees.map(p => p.id)))}
                    className="flex items-center space-x-1 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap bg-white text-slate-600 border border-slate-300 shadow-sm"
                >
                    <Icons.Check size={14} />
                    <span>Todos</span>
                </button>

                {selectedPlayerIds.size > 0 && (
                    <button 
                        onClick={() => setSelectedPlayerIds(new Set())}
                        className="flex items-center space-x-1 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap bg-slate-200 text-slate-600 border border-slate-300"
                    >
                        <Icons.X size={14} />
                        <span>Limpiar ({selectedPlayerIds.size})</span>
                    </button>
                )}
                </div>
           )}
        </div>

        {/* Player Grid */}
        <div className="flex-1 overflow-y-auto p-4 pb-48 bg-slate-50/50">
          <div className="grid grid-cols-3 gap-3">
            {attendees.map(player => {
              const playerTeamKey = activeSession.teams?.[player.id];
              const teamConfig = playerTeamKey ? TEAM_COLORS[playerTeamKey] : null;
              
              const isSelected = selectedPlayerIds.has(player.id);
              
              // Points for this session
              const sessionPoints = data.logs
                .filter(l => l.sessionId === activeSession.id && l.playerId === player.id)
                .reduce((sum, l) => sum + l.points, 0);

              const handleTap = () => {
                  if (isEditingTeams) {
                      updatePlayerTeam(player.id, activeColorEdit === 'none' ? null : activeColorEdit);
                  } else {
                      toggleSelection(player.id);
                  }
              };

              return (
                <button
                  key={player.id}
                  onClick={handleTap}
                  className={`relative flex flex-col items-center justify-center p-2 rounded-xl border-2 transition-all duration-200 h-28 shadow-sm ${
                    // Dynamic styling based on mode and selection
                    isEditingTeams 
                        ? (teamConfig ? `bg-white ${teamConfig.border}` : 'bg-white border-slate-200 opacity-80')
                        : isSelected 
                            ? 'bg-indigo-600 border-indigo-700 shadow-lg scale-105 z-10' 
                            : 'bg-white border-slate-200 hover:border-indigo-300'
                  } ${!isEditingTeams && teamConfig ? 'overflow-hidden' : ''}`}
                >
                  {/* Bib Indicator (Stripe) for Active Mode */}
                  {!isEditingTeams && teamConfig && !isSelected && (
                      <div className={`absolute top-0 left-0 right-0 h-1.5 ${teamConfig.bg}`}></div>
                  )}

                  {/* Team Dot indicator for Edit Mode */}
                  {isEditingTeams && teamConfig && (
                      <div className={`absolute top-2 right-2 w-3 h-3 rounded-full ${teamConfig.bg} border border-black/10`}></div>
                  )}

                  <div className={`text-sm font-bold mb-1 truncate w-full text-center px-1 ${isSelected ? 'text-white' : 'text-slate-800'}`}>
                    {player.name}
                  </div>
                  
                  {!isEditingTeams && (
                    <div className={`text-xs font-mono px-2 py-0.5 rounded-md ${
                        isSelected ? 'bg-indigo-500 text-indigo-100' : 'bg-slate-100 text-slate-500'
                    }`}>
                        {sessionPoints > 0 ? `+${sessionPoints}` : sessionPoints}
                    </div>
                  )}

                  {/* Edit mode: Show current team name if assigned */}
                  {isEditingTeams && (
                      <div className={`text-[10px] font-bold uppercase mt-1 ${teamConfig ? 'text-slate-800' : 'text-slate-300'}`}>
                          {teamConfig ? teamConfig.label : 'Sin Peto'}
                      </div>
                  )}

                  {isSelected && (
                    <div className="absolute top-2 right-2">
                      <Icons.Check size={14} className="text-indigo-300" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Controls Footer - Only show when NOT editing teams */}
        {!isEditingTeams && (
            <div className="fixed bottom-[64px] left-0 right-0 bg-white border-t border-slate-200 p-4 z-40 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
            <div className="max-w-lg mx-auto">
                {selectedPlayerIds.size === 0 ? (
                <div className="text-center text-slate-400 text-sm py-4">
                    Selecciona jugadores o equipos para puntuar
                </div>
                ) : (
                <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                        <input 
                        type="text" 
                        placeholder="Motivo (opcional)"
                        value={sessionNote}
                        onChange={(e) => setSessionNote(e.target.value)}
                        className="flex-1 bg-slate-100 border-0 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                        />
                        <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                        {selectedPlayerIds.size} seleccionados
                        </span>
                    </div>
                    <div className="grid grid-cols-6 gap-2">
                    {POINT_PRESETS.map((preset) => (
                        <button
                        key={preset.label}
                        onClick={() => addPoints(preset.value, sessionNote)}
                        className={`flex items-center justify-center py-3 rounded-lg font-bold text-sm border shadow-sm active:scale-95 transition-transform ${preset.color}`}
                        >
                        {preset.label}
                        </button>
                    ))}
                    </div>
                </div>
                )}
            </div>
            </div>
        )}
      </div>
    );
  };

  const DashboardView = () => {
    // Calculate Stats
    const stats = useMemo(() => {
      const result: { [key: string]: number } = {};
      data.players.forEach(p => result[p.id] = 0);
      data.logs.forEach(log => {
        if (result[log.playerId] !== undefined) {
          result[log.playerId] += log.points;
        }
      });
      return Object.entries(result)
        .map(([id, points]) => ({
          ...data.players.find(p => p.id === id)!,
          points
        }))
        .sort((a, b) => b.points - a.points);
    }, [data]);

    return (
      <div className="p-4 pb-24">
        <h1 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
          <Icons.Trophy className="text-yellow-500 fill-current" />
          Ranking Trimestral
        </h1>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          {stats.map((player, index) => (
            <div 
              key={player.id} 
              className={`flex items-center p-4 border-b border-slate-50 last:border-0 ${
                index < 3 ? 'bg-gradient-to-r from-slate-50 to-white' : ''
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold mr-4 ${
                index === 0 ? 'bg-yellow-100 text-yellow-700' :
                index === 1 ? 'bg-slate-200 text-slate-700' :
                index === 2 ? 'bg-orange-100 text-orange-800' :
                'text-slate-400 text-sm'
              }`}>
                {index + 1}
              </div>
              <div className="flex-1">
                <div className="font-semibold text-slate-800">{player.name}</div>
              </div>
              <div className={`font-mono font-bold text-lg ${
                player.points > 0 ? 'text-indigo-600' : player.points < 0 ? 'text-rose-500' : 'text-slate-400'
              }`}>
                {player.points}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const HistoryView = () => {
    // Create the matrix
    const sortedSessions = [...data.sessions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    const getPointsForSession = (playerId: string, sessionId: string) => {
      return data.logs
        .filter(l => l.sessionId === sessionId && l.playerId === playerId)
        .reduce((sum, l) => sum + l.points, 0);
    };

    const getTotalPoints = (playerId: string) => {
       return data.logs
        .filter(l => l.playerId === playerId)
        .reduce((sum, l) => sum + l.points, 0);
    }

    return (
      <div className="flex flex-col h-screen bg-white">
        <div className="p-4 border-b border-slate-100">
           <h1 className="text-2xl font-bold text-slate-800">Hoja de Cálculo</h1>
           <p className="text-sm text-slate-500">Vista general de asistencias y puntos</p>
        </div>
        
        <div className="flex-1 overflow-auto">
          <table className="w-full text-sm border-collapse">
            <thead className="bg-slate-50 sticky top-0 z-20 shadow-sm">
              <tr>
                <th className="p-3 text-left font-bold text-slate-700 border-b border-slate-200 sticky left-0 bg-slate-50 z-30 min-w-[120px]">Jugador</th>
                {sortedSessions.map(s => (
                  <th key={s.id} className="p-2 font-medium text-slate-500 border-b border-slate-200 text-center whitespace-nowrap min-w-[80px]">
                    <div className="text-[10px] uppercase tracking-wider">{new Date(s.date).toLocaleDateString('es-ES', { weekday: 'short' })}</div>
                    <div className="text-xs font-bold text-slate-800">{new Date(s.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}</div>
                  </th>
                ))}
                <th className="p-3 font-bold text-slate-800 border-b border-slate-200 text-center sticky right-0 bg-slate-100 z-30 shadow-l">Total</th>
              </tr>
            </thead>
            <tbody>
              {data.players.map(player => {
                 const total = getTotalPoints(player.id);
                 return (
                  <tr key={player.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 font-medium text-slate-700 border-b border-slate-100 sticky left-0 bg-white z-10 border-r">{player.name}</td>
                    {sortedSessions.map(session => {
                      const isAbsent = session.absences.includes(player.id);
                      const points = getPointsForSession(player.id, session.id);
                      
                      let cellContent = <span className="text-slate-300">-</span>;
                      let cellClass = "";

                      if (isAbsent) {
                        cellClass = "bg-rose-50";
                        cellContent = <div className="w-2 h-2 rounded-full bg-rose-200 mx-auto" title="Ausente" />;
                      } else if (points !== 0) {
                        cellClass = points > 0 ? "text-emerald-600 font-bold bg-emerald-50/30" : "text-rose-600 font-bold bg-rose-50/30";
                        cellContent = <span>{points}</span>;
                      }

                      return (
                        <td key={session.id} className={`p-2 text-center border-b border-slate-100 border-r border-slate-50 ${cellClass}`}>
                          {cellContent}
                        </td>
                      );
                    })}
                    <td className={`p-3 text-center font-bold border-b border-slate-100 sticky right-0 bg-slate-50 z-10 border-l ${total < 0 ? 'text-rose-600' : 'text-indigo-600'}`}>
                      {total}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {sortedSessions.length === 0 && (
            <div className="p-8 text-center text-slate-400">
              No hay entrenamientos registrados aún.
            </div>
          )}
        </div>
        <div className="h-16 shrink-0" /> {/* Spacer for tabs */}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans max-w-lg mx-auto shadow-2xl overflow-hidden relative">
      {currentView === ViewState.DASHBOARD && <DashboardView />}
      {currentView === ViewState.ROSTER && <RosterView />}
      {currentView === ViewState.SESSION_SETUP && <SessionSetupView />}
      {currentView === ViewState.SESSION_ACTIVE && <SessionActiveView />}
      {currentView === ViewState.SESSION_SUMMARY && <SessionSummaryView />}
      {currentView === ViewState.HISTORY && <HistoryView />}
      
      <Tabs 
        currentView={currentView} 
        onChange={setCurrentView} 
        hasActiveSession={!!activeSession} 
      />
    </div>
  );
}
