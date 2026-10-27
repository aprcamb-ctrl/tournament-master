import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Plus, Minus, Clock, Users, Maximize2, Minimize2, Volume2, VolumeX, ChevronLeft, ChevronRight } from 'lucide-react';

export default function SocialRunner({ sessionData }) {
  const [selectedRoundIdx, setSelectedRoundIdx] = useState(0);
  
  // Timer state - ALWAYS 10 minutes default
  const DEFAULT_TIMER_MINUTES = 10;
  const [timeLeft, setTimeLeft] = useState(DEFAULT_TIMER_MINUTES * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const timerRef = useRef(null);

  // When session updates, ensure timer remains on 10 minutes default
  useEffect(() => {
    setTimeLeft(DEFAULT_TIMER_MINUTES * 60);
    setIsRunning(false);
  }, [sessionData?.updated_at]);

  // Timer interval countdown
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setIsRunning(false);
            if (soundEnabled) {
              triggerBuzzer();
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, soundEnabled]);

  const triggerBuzzer = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      const playTone = (freq, start, duration) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
        gain.gain.setValueAtTime(0.4, ctx.currentTime + start);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + start + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + start);
        osc.stop(ctx.currentTime + start + duration);
      };

      // 3 short beep fanfare
      playTone(587.33, 0.0, 0.25); // D5
      playTone(587.33, 0.3, 0.25); // D5
      playTone(880.00, 0.6, 0.7);  // A5
    } catch (e) {
      console.warn('Audio buzzer could not play:', e);
    }
  };

  const toggleTimer = () => setIsRunning(!isRunning);
  
  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(DEFAULT_TIMER_MINUTES * 60);
  };

  const addMinutes = (mins = 1) => {
    setTimeLeft(prev => prev + mins * 60);
  };

  const removeMinutes = (mins = 1) => {
    setTimeLeft(prev => Math.max(0, prev - mins * 60));
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const rounds = sessionData?.rounds || [];
  const activeRound = rounds[selectedRoundIdx] || rounds[0];

  if (!sessionData || !rounds.length) {
    return (
      <div style={{
        maxWidth: '700px',
        margin: '40px auto',
        padding: '30px',
        background: 'rgba(15, 23, 42, 0.8)',
        border: '1px solid rgba(56, 189, 248, 0.2)',
        borderRadius: '16px',
        textAlign: 'center',
        boxShadow: '0 10px 25px rgba(0,0,0,0.4)'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎾</div>
        <h2 style={{ color: '#38bdf8', marginBottom: '12px', fontSize: '1.5rem' }}>No Active Social Session Uploaded</h2>
        <p style={{ color: '#94a3b8', lineHeight: '1.6', fontSize: '1rem' }}>
          To run a social session here, generate the rounds on the <strong>Club Social</strong> laptop app and click <strong>"Upload to Web"</strong>.
        </p>
      </div>
    );
  }

  const isTimeCritical = timeLeft < 60 && timeLeft > 0;
  const isTimeUp = timeLeft === 0;

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 10px 40px' }}>
      
      {/* Top Banner: Session Title & Updated Time */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        background: 'rgba(15, 23, 42, 0.65)',
        border: '1px solid rgba(56, 189, 248, 0.25)',
        borderRadius: '16px',
        padding: '16px 20px',
        marginBottom: '20px',
        backdropFilter: 'blur(8px)'
      }}>
        <div>
          <div style={{ fontSize: '0.8rem', color: '#38bdf8', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Club Social Session
          </div>
          <h2 style={{ margin: '4px 0 0', color: '#ffffff', fontSize: '1.4rem', fontWeight: 800 }}>
            {sessionData.title || 'Social Session'}
          </h2>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button 
            onClick={toggleFullscreen}
            title="Toggle TV Fullscreen"
            style={{
              background: 'rgba(30, 41, 59, 0.8)',
              border: '1px solid #334155',
              color: '#94a3b8',
              borderRadius: '10px',
              padding: '8px 12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.85rem'
            }}
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            <span style={{ display: 'none', md: 'inline' }}>TV Display</span>
          </button>
        </div>
      </div>

      {/* Countdown Timer Module */}
      <div style={{
        background: isTimeUp 
          ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.25), rgba(15, 23, 42, 0.9))' 
          : isTimeCritical 
            ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.25), rgba(15, 23, 42, 0.9))' 
            : 'linear-gradient(135deg, rgba(14, 165, 233, 0.15), rgba(15, 23, 42, 0.85))',
        border: isTimeUp 
          ? '2px solid #ef4444' 
          : isTimeCritical 
            ? '2px solid #f59e0b' 
            : '1px solid rgba(56, 189, 248, 0.3)',
        borderRadius: '20px',
        padding: '20px',
        marginBottom: '24px',
        boxShadow: isTimeUp 
          ? '0 0 30px rgba(239, 68, 68, 0.4)' 
          : '0 10px 25px rgba(0,0,0,0.3)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.3s ease'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94a3b8', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>
          <Clock size={16} color="#38bdf8" />
          Round Countdown
        </div>

        {/* Digital Time Numbers with - / + Stepper Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', margin: '4px 0 14px' }}>
          <button
            onClick={() => removeMinutes(1)}
            disabled={timeLeft < 60}
            title="Subtract 1 minute"
            style={{
              background: 'rgba(30, 41, 59, 0.8)',
              color: '#f87171',
              border: '1px solid rgba(248, 113, 113, 0.3)',
              borderRadius: '50%',
              width: '42px',
              height: '42px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: timeLeft < 60 ? 'not-allowed' : 'pointer',
              opacity: timeLeft < 60 ? 0.4 : 1,
              transition: 'all 0.15s ease'
            }}
          >
            <Minus size={20} />
          </button>

          <div style={{
            fontSize: '3.6rem',
            fontWeight: 900,
            fontFamily: 'monospace, system-ui',
            letterSpacing: '2px',
            color: isTimeUp ? '#ef4444' : isTimeCritical ? '#f59e0b' : '#38bdf8',
            textShadow: isTimeUp ? '0 0 20px rgba(239, 68, 68, 0.7)' : '0 0 15px rgba(56, 189, 248, 0.5)',
            userSelect: 'none'
          }}>
            {formatTime(timeLeft)}
          </div>

          <button
            onClick={() => addMinutes(1)}
            title="Add 1 minute"
            style={{
              background: 'rgba(30, 41, 59, 0.8)',
              color: '#38bdf8',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              borderRadius: '50%',
              width: '42px',
              height: '42px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <Plus size={20} />
          </button>
        </div>

        {/* Timer Control Buttons */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button
            onClick={toggleTimer}
            style={{
              background: isRunning ? '#f59e0b' : '#10b981',
              color: '#0f172a',
              border: 'none',
              padding: '10px 24px',
              borderRadius: '25px',
              fontWeight: 800,
              fontSize: '1rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: isRunning ? '0 0 15px rgba(245, 158, 11, 0.4)' : '0 0 15px rgba(16, 185, 129, 0.4)',
              transition: 'transform 0.1s ease'
            }}
          >
            {isRunning ? <><Pause size={18} fill="#0f172a" /> Pause</> : <><Play size={18} fill="#0f172a" /> Start</>}
          </button>

          <button
            onClick={() => removeMinutes(1)}
            title="Subtract 1 minute"
            disabled={timeLeft < 60}
            style={{
              background: 'rgba(30, 41, 59, 0.9)',
              color: '#f87171',
              border: '1px solid rgba(248, 113, 113, 0.4)',
              padding: '10px 16px',
              borderRadius: '25px',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: timeLeft < 60 ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              opacity: timeLeft < 60 ? 0.5 : 1
            }}
          >
            <Minus size={16} /> 1 Min
          </button>

          <button
            onClick={() => addMinutes(1)}
            title="Add 1 minute"
            style={{
              background: 'rgba(30, 41, 59, 0.9)',
              color: '#38bdf8',
              border: '1px solid rgba(56, 189, 248, 0.4)',
              padding: '10px 16px',
              borderRadius: '25px',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <Plus size={16} /> 1 Min
          </button>

          <button
            onClick={resetTimer}
            title="Reset to 10 minutes"
            style={{
              background: 'rgba(30, 41, 59, 0.9)',
              color: '#f8fafc',
              border: '1px solid #475569',
              padding: '10px 16px',
              borderRadius: '25px',
              fontWeight: 600,
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <RotateCcw size={16} /> Reset
          </button>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            title={soundEnabled ? 'Mute buzzer sound' : 'Enable buzzer sound'}
            style={{
              background: 'rgba(30, 41, 59, 0.9)',
              color: soundEnabled ? '#a3e635' : '#64748b',
              border: '1px solid #475569',
              padding: '10px 14px',
              borderRadius: '25px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>
        </div>

        {/* Quick Presets */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '14px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
          <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, letterSpacing: '0.5px' }}>PRESETS:</span>
          {[8, 10, 12, 15, 20].map(mins => (
            <button
              key={mins}
              onClick={() => {
                setIsRunning(false);
                setTimeLeft(mins * 60);
              }}
              style={{
                background: timeLeft === mins * 60 ? 'rgba(56, 189, 248, 0.25)' : 'rgba(30, 41, 59, 0.6)',
                color: timeLeft === mins * 60 ? '#38bdf8' : '#94a3b8',
                border: timeLeft === mins * 60 ? '1px solid #38bdf8' : '1px solid #334155',
                padding: '4px 10px',
                borderRadius: '12px',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {mins}m
            </button>
          ))}
        </div>
      </div>

      {/* Round Selector Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '20px',
        background: 'rgba(15, 23, 42, 0.7)',
        padding: '10px 14px',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        overflowX: 'auto'
      }}>
        <button
          disabled={selectedRoundIdx === 0}
          onClick={() => setSelectedRoundIdx(prev => Math.max(0, prev - 1))}
          style={{
            background: 'none',
            border: 'none',
            color: selectedRoundIdx === 0 ? '#475569' : '#f8fafc',
            cursor: selectedRoundIdx === 0 ? 'default' : 'pointer',
            padding: '6px',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <ChevronLeft size={20} />
        </button>

        <div style={{ display: 'flex', gap: '8px', flex: 1, overflowX: 'auto', padding: '4px 0' }}>
          {rounds.map((r, idx) => {
            const isSelected = idx === selectedRoundIdx;
            return (
              <button
                key={idx}
                onClick={() => setSelectedRoundIdx(idx)}
                style={{
                  background: isSelected ? '#a3e635' : 'rgba(30, 41, 59, 0.8)',
                  color: isSelected ? '#0f172a' : '#f8fafc',
                  border: isSelected ? '1px solid #a3e635' : '1px solid #334155',
                  padding: '8px 16px',
                  borderRadius: '20px',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  boxShadow: isSelected ? '0 0 15px rgba(163, 230, 53, 0.4)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                Round {r.round_num || idx + 1}
              </button>
            );
          })}
        </div>

        <button
          disabled={selectedRoundIdx === rounds.length - 1}
          onClick={() => setSelectedRoundIdx(prev => Math.min(rounds.length - 1, prev + 1))}
          style={{
            background: 'none',
            border: 'none',
            color: selectedRoundIdx === rounds.length - 1 ? '#475569' : '#f8fafc',
            cursor: selectedRoundIdx === rounds.length - 1 ? 'default' : 'pointer',
            padding: '6px',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Matches for Active Round */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h3 style={{ margin: 0, color: '#f8fafc', fontSize: '1.2rem', fontWeight: 800 }}>
            Round {activeRound?.round_num || selectedRoundIdx + 1} Court Assignments
          </h3>
          {activeRound?.type && (
            <span style={{
              background: 'rgba(56, 189, 248, 0.15)',
              color: '#38bdf8',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              padding: '4px 10px',
              borderRadius: '12px',
              fontSize: '0.75rem',
              fontWeight: 700,
              textTransform: 'uppercase'
            }}>
              {activeRound.type}
            </span>
          )}
        </div>

        {/* Court Cards Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '16px'
        }}>
          {activeRound?.matches?.map((m, mIdx) => (
            <div
              key={mIdx}
              style={{
                background: 'rgba(15, 23, 42, 0.85)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '16px',
                padding: '16px',
                boxShadow: '0 8px 20px rgba(0,0,0,0.3)',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {/* Court Badge */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                paddingBottom: '10px',
                marginBottom: '12px'
              }}>
                <div style={{
                  color: '#a3e635',
                  fontWeight: 800,
                  fontSize: '1.05rem',
                  letterSpacing: '0.5px'
                }}>
                  {m.court || `Court ${mIdx + 1}`}
                </div>
                {m.type && m.type !== activeRound?.type && (
                  <span style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 600 }}>{m.type}</span>
                )}
              </div>

              {/* Matchup Layout */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {/* Team 1 */}
                <div style={{
                  background: 'rgba(30, 41, 59, 0.7)',
                  borderRadius: '10px',
                  padding: '10px 14px',
                  borderLeft: '4px solid #38bdf8'
                }}>
                  <div style={{ color: '#94a3b8', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '2px' }}>
                    Team 1
                  </div>
                  <div style={{ color: '#f8fafc', fontWeight: 700, fontSize: '1rem', lineHeight: '1.3' }}>
                    {m.team1?.join(' & ') || 'TBD'}
                  </div>
                </div>

                {/* VS Badge */}
                <div style={{ textAlign: 'center', margin: '-4px 0' }}>
                  <span style={{
                    display: 'inline-block',
                    padding: '2px 8px',
                    borderRadius: '10px',
                    background: '#1e293b',
                    color: '#64748b',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    letterSpacing: '1px'
                  }}>
                    VS
                  </span>
                </div>

                {/* Team 2 */}
                <div style={{
                  background: 'rgba(30, 41, 59, 0.7)',
                  borderRadius: '10px',
                  padding: '10px 14px',
                  borderLeft: '4px solid #a3e635'
                }}>
                  <div style={{ color: '#94a3b8', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '2px' }}>
                    Team 2
                  </div>
                  <div style={{ color: '#f8fafc', fontWeight: 700, fontSize: '1rem', lineHeight: '1.3' }}>
                    {m.team2?.join(' & ') || 'TBD'}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bench / Resting Players Drawer */}
      <div style={{
        background: 'rgba(15, 23, 42, 0.65)',
        border: '1px dashed rgba(255, 255, 255, 0.15)',
        borderRadius: '14px',
        padding: '16px 20px',
        marginTop: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94a3b8', fontWeight: 700, fontSize: '0.9rem', marginBottom: '8px' }}>
          <Users size={16} color="#f59e0b" />
          Resting / Bye This Round ({activeRound?.bench?.length || 0})
        </div>

        {activeRound?.bench && activeRound.bench.length > 0 ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {activeRound.bench.map((pName, pIdx) => (
              <span
                key={pIdx}
                style={{
                  background: 'rgba(245, 158, 11, 0.15)',
                  color: '#fbbf24',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  padding: '6px 12px',
                  borderRadius: '20px',
                  fontSize: '0.85rem',
                  fontWeight: 600
                }}
              >
                ☕ {pName}
              </span>
            ))}
          </div>
        ) : (
          <div style={{ color: '#64748b', fontSize: '0.85rem', fontStyle: 'italic' }}>
            All players are active on courts this round!
          </div>
        )}
      </div>

    </div>
  );
}
