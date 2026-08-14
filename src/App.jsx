import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import { Calendar, Trophy, GitFork, Heart } from 'lucide-react'

const CrossedPaddlesIcon = ({ size = 42, className = "" }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="currentColor"
    className={className}
  >
    <g transform="rotate(45 12 12)">
      <path fillRule="evenodd" clipRule="evenodd" d="M10 2C8.34315 2 7 3.34315 7 5V11.5C7 13.1569 8.34315 14.5 10 14.5H14C15.6569 14.5 17 13.1569 17 11.5V5C17 3.34315 15.6569 2 14 2H10ZM10 6.5C10.8284 6.5 11.5 5.82843 11.5 5C11.5 4.17157 10.8284 3.5 10 3.5C9.17157 3.5 8.5 4.17157 8.5 5C8.5 5.82843 9.17157 6.5 10 6.5Z" />
      <rect x="10.5" y="14" width="3" height="8" rx="1.5" />
    </g>
    <g transform="rotate(-45 12 12)">
      <rect x="10.5" y="14" width="3" height="8" rx="1.5" />
      <path fillRule="evenodd" clipRule="evenodd" d="M10 2C8.34315 2 7 3.34315 7 5V11.5C7 13.1569 8.34315 14.5 10 14.5H14C15.6569 14.5 17 13.1569 17 11.5V5C17 3.34315 15.6569 2 14 2H10ZM14 6.5C14.8284 6.5 15.5 5.82843 15.5 5C15.5 4.17157 14.8284 3.5 14 3.5C13.1716 3.5 12.5 4.17157 12.5 5C12.5 5.82843 13.1716 6.5 14 6.5Z" />
    </g>
    <circle cx="12" cy="12" r="2.5" fill="#0f1015" />
    <circle cx="12" cy="12" r="1.5" fill="currentColor" />
  </svg>
)

// Dummy Data (before Supabase integration)
const DUMMY_DATA = {
  tournaments: {
    "Tournament Data Loading...": {
      categories: {
        "Men's 18+ 3.0 (4)": {
          standings: [
            { team: "Sam Heys / Alan Barnsley", p: 3, w: 3, l: 0, pd: 16 },
            { team: "Dave Pullen / Anthony Coe", p: 3, w: 1, l: 2, pd: 5 },
            { team: "Alex Yapp / Christopher Eastwood", p: 3, w: 1, l: 2, pd: -5 },
            { team: "Jack Ballard Ridley / Abhishek Bongirwar", p: 3, w: 1, l: 2, pd: -16 },
          ],
          matches: [
            { label: "Round 1", team_a: "Alex Yapp / Christopher Eastwood", score_a: 15, score_b: 8, team_b: "Dave Pullen / Anthony Coe", time: "Court 14 • 10:30" },
            { label: "Round 1", team_a: "Sam Heys / Alan Barnsley", score_a: 15, score_b: 13, team_b: "Dave Pullen / Anthony Coe", time: "Court 14 • 11:00" },
            { label: "Round 2", team_a: "Sam Heys / Alan Barnsley", score_a: 15, score_b: 6, team_b: "Jack Ballard Ridley / Abhishek Bongirwar", time: "Court 14 • 11:30" },
            { label: "Round 2", team_a: "Alex Yapp / Christopher Eastwood", score_a: 8, score_b: 15, team_b: "Jack Ballard Ridley / Abhishek Bongirwar", time: "Court 14 • 12:00" },
          ],
          knockouts: [
            { label: "Finals", team_a: "Sam Heys / Alan Barnsley", score_a: 15, score_b: 10, team_b: "Dave Pullen / Anthony Coe", time: "Court 1 • 14:00" }
          ]
        },
        "Women's Open Pro (6)": {
          standings: [],
          matches: [],
          knockouts: []
        }
      }
    }
  }
}

function App() {
  const [data, setData] = useState(DUMMY_DATA);
  const [mainView, setMainView] = useState('events');
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [selectedEventForEntries, setSelectedEventForEntries] = useState(null);

  const [activeTab, setActiveTab] = useState('fixtures'); // fixtures, standings, knockouts
  const [selectedTournament, setSelectedTournament] = useState(Object.keys(DUMMY_DATA.tournaments)[0]);
  const [selectedCategory, setSelectedCategory] = useState(Object.keys(DUMMY_DATA.tournaments[Object.keys(DUMMY_DATA.tournaments)[0]].categories)[0]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}));
  const isLive = mainView === 'results' && data?.last_sync_time && (Date.now() / 1000 - data.last_sync_time) < 12 * 60 * 60 && data?.last_active_tournament === selectedTournament;

  // Helper to safely extract available tournaments
  const getTournamentsList = (sourceData) => {
    return Object.keys(sourceData?.tournaments || {}).sort((a, b) => a.localeCompare(b));
  };

  useEffect(() => {
    fetchTournamentState();
    fetchUpcomingEvents();

    // Subscribe to realtime changes
    const subscription = supabase
      .channel('public:tournament_state')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tournament_state' }, payload => {
        if (payload.new && payload.new.data) {
          if (payload.new.id === 1) {
            setData(payload.new.data);
            setLastUpdated(new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}));
          } else if (payload.new.id === 2) {
            setUpcomingEvents(payload.new.data.events || []);
          }
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    }
  }, []);

  const fetchUpcomingEvents = async () => {
    try {
      const { data: row, error } = await supabase
        .from('tournament_state')
        .select('*')
        .eq('id', 2)
        .single();
        
      if (row && row.data && row.data.events) {
        setUpcomingEvents(row.data.events);
      }
    } catch (err) {
      console.log('Failed to fetch events:', err);
    }
  };

  const fetchTournamentState = async () => {
    try {
      const { data: row, error } = await supabase
        .from('tournament_state')
        .select('*')
        .eq('id', 1)
        .single();
        
      if (row && row.data) {
        setData(row.data);
      }
    } catch (err) {
      console.log('Using dummy data or failed to fetch:', err);
    } finally {
      setLoading(false);
    }
  };

  // Ensure selected tournament and category are valid when data or selections change
  useEffect(() => {
    const tournaments = getTournamentsList(data);
    if (tournaments.length > 0) {
      if (!selectedTournament || !tournaments.includes(selectedTournament)) {
        // Tournament was deleted or not set, fallback to first
        setSelectedTournament(tournaments[0]);
      } else {
        // Tournament is valid, now check if category is valid for this tournament
        const cats = Object.keys(data.tournaments[selectedTournament]?.categories || {}).sort((a, b) => a.localeCompare(b));
        if (cats.length > 0 && (!selectedCategory || !cats.includes(selectedCategory))) {
          setSelectedCategory(cats[0]);
        }
      }
    }
  }, [data, selectedTournament, selectedCategory]);

  const activeTournamentData = data?.tournaments?.[selectedTournament] || { categories: {} };
  const catData = activeTournamentData.categories?.[selectedCategory] || { matches: [], standings: [], knockouts: [] };

  // Parse title to highlight parts if possible
  const currentTitle = selectedTournament || "Tournament Master";
  const splitTitle = currentTitle.split(' ');
  const titleStart = splitTitle.slice(0, Math.ceil(splitTitle.length/2)).join(' ');
  const titleEnd = splitTitle.slice(Math.ceil(splitTitle.length/2)).join(' ');

  return (
    <div className="container">
      <div className="header-wrapper">
        <div className="logo-container" style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
          {mainView === 'events' ? (
            <button 
              onClick={() => setMainView('results')}
              style={{ 
                background: 'transparent',
                color: 'white',
                border: '1px solid #3b82f6',
                padding: '8px 16px',
                borderRadius: '20px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              RESULTS
            </button>
          ) : (
            <button 
              onClick={() => setMainView('events')} 
              style={{ 
                background: 'transparent',
                color: 'white',
                border: '1px solid #a3e635',
                padding: '8px 16px',
                borderRadius: '20px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              EVENTS
            </button>
          )}
        </div>
        
        <header className="header" style={{ flex: 2, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <img src="/favicon.png" alt="Tournament Master" style={{ height: '70px', objectFit: 'contain', borderRadius: '15px', marginBottom: '10px' }} />
          <h1 className="title" style={{ marginTop: 0 }}>{titleStart} <span>{titleEnd}</span></h1>
          <div className="subtitle">
            LIVE FIXTURES <span>•</span> STANDINGS <span>•</span> KNOCKOUTS
          </div>
        </header>

        <div className="right-actions" style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '20px', flex: 1 }}>
          {isLive && (
            <div className="live-indicator" style={{ margin: 0 }}>
              <div className="live-badge">
                <div className="live-dot"></div>
                LIVE
              </div>
              <div className="updated-text">UPDATED {lastUpdated}</div>
            </div>
          )}
        </div>
      </div>

      
      {mainView === 'entries' && selectedEventForEntries && (
        <div className="content">
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
            <h2 style={{ margin: 0, color: '#a3e635' }}>{selectedEventForEntries.name} - Entries</h2>
            <button 
              onClick={() => {
                setMainView('events');
                setSelectedEventForEntries(null);
              }}
              style={{
                background: 'rgba(255,255,255,0.1)',
                color: 'white',
                border: '1px solid rgba(255,255,255,0.2)',
                padding: '8px 16px',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              &larr; Back to Events
            </button>
          </div>
          
          {(() => {
            let entries = selectedEventForEntries.entries ? [...selectedEventForEntries.entries] : [];
            if (entries.length === 0) return <p style={{color: 'white'}}>No entries found.</p>;
            
            const keys = Object.keys(entries[0]);
            
            // Auto-detect DUPR rating column to sort
            const duprCol = keys.find(k => k.toLowerCase().includes('dupr rating'));
            if (duprCol) {
                entries.sort((a, b) => {
                    const ratingA = parseFloat(a[duprCol]) || 0;
                    const ratingB = parseFloat(b[duprCol]) || 0;
                    return ratingB - ratingA;
                });
            }
            
            // Auto-detect grouping column

            const groupKey = keys.find(k => k.toLowerCase().includes('division') || k.toLowerCase().includes('category') || k.toLowerCase().includes('event'));
            
            const groups = {};
            if (groupKey) {
              entries.forEach(e => {
                const g = e[groupKey] || 'Other';
                if (!groups[g]) groups[g] = [];
                groups[g].push(e);
              });
            } else {
              groups['All Entrants'] = entries;
            }
            
            // Only show keys that have actual data across the group, excluding the groupKey if it exists
            return Object.keys(groups).map((gName, idx) => {
               const groupEntries = groups[gName];
               let displayKeys = keys.filter(k => k !== groupKey);
               
               // The user wants to ensure the columns shown are Name, DUPR Rating, Home Club
               // We will try to filter them if they exist
               const desiredColumns = [];
               const nameCol = displayKeys.find(k => k.toLowerCase() === 'name' || k.toLowerCase().includes('player'));
               const ratingCol = displayKeys.find(k => k.toLowerCase().includes('dupr rating'));
               const clubCol = displayKeys.find(k => k.toLowerCase().includes('home club') || k.toLowerCase().includes('club'));
               
               if (nameCol) desiredColumns.push(nameCol);
               if (ratingCol) desiredColumns.push(ratingCol);
               if (clubCol) desiredColumns.push(clubCol);
               
               if (desiredColumns.length > 0) {
                 displayKeys = desiredColumns;
               }
               
               return (
                 <div key={idx} style={{marginBottom: '30px', background: 'rgba(30, 41, 59, 0.8)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.1)'}}>
                   <h3 style={{color: 'white', borderBottom: '1px solid #334155', paddingBottom: '10px', marginTop: 0}}>{gName}</h3>
                   <div style={{overflowX: 'auto'}}>
                     <table style={{width: '100%', borderCollapse: 'collapse', marginTop: '15px'}}>
                       <thead>
                         <tr>
                           {displayKeys.map((k, i) => (
                             <th key={i} style={{textAlign: 'left', padding: '10px', color: '#94a3b8', borderBottom: '1px solid #334155'}}>{k}</th>
                           ))}
                         </tr>
                       </thead>
                       <tbody>
                         {groupEntries.map((entry, eIdx) => (
                           <tr key={eIdx} style={{background: eIdx % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent'}}>
                             {displayKeys.map((k, i) => (
                               <td key={i} style={{padding: '10px', color: '#f8fafc', borderBottom: '1px solid #334155'}}>{entry[k]}</td>
                             ))}
                           </tr>
                         ))}
                       </tbody>
                     </table>
                   </div>
                 </div>
               );
            });
          })()}
        </div>
      )}

      {mainView === 'events' && (
        <div className="content">
          <h2 style={{ textAlign: 'center', marginBottom: '20px', color: '#a3e635' }}>Upcoming Events</h2>
          <div className="fixtures-list">
            {upcomingEvents.length > 0 ? upcomingEvents.map((ev, i) => (
              <div className={`match-card fade-in-up ${i % 2 === 0 ? 'neon-alt' : 'neon-primary'}`} key={i} style={{animationDelay: `${i * 0.1}s`}}>
                <div style={{ padding: '15px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '10px' }}>
                    {ev.logoBase64 && (
                      <img src={ev.logoBase64} alt={ev.name} style={{ width: '60px', height: '60px', objectFit: 'contain', borderRadius: '8px', background: 'rgba(255,255,255,0.1)' }} />
                    )}
                    <h3 style={{ margin: '0', fontSize: '1.2em', color: 'white' }}>{ev.name}</h3>
                  </div>
                  <div style={{ color: '#a1a1aa', marginBottom: '5px' }}>📅 {ev.date}</div>
                  <div style={{ color: '#a1a1aa', marginBottom: '10px' }}>📍 {ev.location}</div>
                  {ev.description && <p style={{ color: '#cbd5e1', fontSize: '0.9em', lineHeight: '1.4' }}>{ev.description}</p>}
                  {ev.link && (
                    <a 
                      href={ev.link} 
                      target="_blank" 
                      rel="noreferrer"
                      style={{
                        display: 'inline-block',
                        marginTop: '10px',
                        background: '#3b82f6',
                        color: 'white',
                        padding: '8px 15px',
                        borderRadius: '6px',
                        textDecoration: 'none',
                        fontWeight: 'bold',
                        fontSize: '0.9em'
                      }}
                    >
                      Register / Details
                    </a>
                  )}
                  {ev.entries && ev.entries.length > 0 && (
                    <button
                      onClick={() => {
                        setSelectedEventForEntries(ev);
                        setMainView('entries');
                      }}
                      style={{
                        display: 'inline-block',
                        marginTop: '10px',
                        marginLeft: ev.link ? '10px' : '0',
                        background: '#10b981',
                        color: 'white',
                        padding: '8px 15px',
                        borderRadius: '6px',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '0.9em',
                        fontWeight: 'bold'
                      }}
                    >
                      View Entries &rarr;
                    </button>
                  )}
                </div>
              </div>
            )) : <p style={{textAlign: 'center', color: '#a1a1aa', padding: '40px'}}>No upcoming events.</p>}
          </div>
        </div>
      )}

      {mainView === 'results' && (
        <>
      <div className="card" style={{padding: '15px 20px', marginBottom: '25px'}}>
        <div className="card-label">SELECT EVENT</div>
        <div className="select-wrapper" style={{marginBottom: '20px'}}>
          <select 
            value={selectedTournament} 
            onChange={e => setSelectedTournament(e.target.value)}
          >
            {getTournamentsList(data).map(tourn => (
              <option key={tourn} value={tourn}>{tourn}</option>
            ))}
          </select>
          <div className="select-arrow">▼</div>
        </div>

        <div className="card-label">SELECT CATEGORY</div>
        <div className="select-wrapper">
          <select 
            value={selectedCategory} 
            onChange={e => setSelectedCategory(e.target.value)}
          >
            {Object.keys(activeTournamentData.categories).sort((a, b) => a.localeCompare(b)).map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <div className="select-arrow">▼</div>
        </div>
      </div>

      <div className="tabs">
        <div 
          className={`tab ${activeTab === 'fixtures' ? 'active' : ''}`}
          onClick={() => setActiveTab('fixtures')}
        >
          <Calendar size={20} /> FIXTURES
        </div>
        <div 
          className={`tab ${activeTab === 'standings' ? 'active' : ''}`}
          onClick={() => setActiveTab('standings')}
        >
          <Trophy size={20} /> STANDINGS
        </div>
        <div 
          className={`tab ${activeTab === 'knockouts' ? 'active' : ''}`}
          onClick={() => setActiveTab('knockouts')}
        >
          <GitFork size={20} /> KNOCKOUTS
        </div>
      </div>

      <div className="content">
        {activeTab === 'fixtures' && (
          <div className="fixtures-list">
            {catData.matches.length > 0 ? [...catData.matches].reverse().map((m, i) => (
              <div className={`match-card fade-in-up ${i % 2 === 0 ? 'neon-alt' : 'neon-primary'}`} key={i} style={{animationDelay: `${i * 0.1}s`}}>
                <div className="match-teams">
                  <div className="team left">
                    <div className="team-icon"><CrossedPaddlesIcon size={42} /></div>
                    <div className="team-name">{m.team_a.split(' / ').map((name, idx) => <div key={idx}>{name}{idx===0?' /':''}</div>)}</div>
                    <div className="team-score">
                      {m.score_a !== "" ? m.score_a : "-"}
                    </div>
                  </div>
                  <div className="vs">VS</div>
                  <div className="team right">
                    <div className="team-icon"><CrossedPaddlesIcon size={42} /></div>
                    <div className="team-name">{m.team_b.split(' / ').map((name, idx) => <div key={idx}>{name}{idx===0?' /':''}</div>)}</div>
                    <div className="team-score">
                      {m.score_b !== "" ? m.score_b : "-"}
                    </div>
                  </div>
                </div>
                <div className="match-footer">
                  {m.round}{m.label ? <span>•</span> : ''}{m.label}
                </div>
              </div>
            )) : <p style={{textAlign: 'center', color: '#a1a1aa', padding: '40px'}}>No fixtures available yet.</p>}
          </div>
        )}

        {activeTab === 'standings' && (
          <div className="card">
            <div style={{overflowX: 'auto'}}>
              <table className="standings-table">
                <thead>
                  <tr>
                    <th>Pos</th>
                    <th>Team</th>
                    <th>P</th>
                    <th>W</th>
                    <th>L</th>
                    <th>PD</th>
                  </tr>
                </thead>
                <tbody>
                  {catData.standings.map((s, i) => (
                    <tr key={i}>
                      <td>
                        <div className={`rank-badge ${i === 0 ? 'top-1' : ''}`}>
                          {i + 1}
                        </div>
                      </td>
                      <td style={{fontWeight: 600, color: 'white'}}>{s.team}</td>
                      <td>{s.p}</td>
                      <td style={{color: '#a3e635', fontWeight: 'bold'}}>{s.w}</td>
                      <td style={{color: '#f87171'}}>{s.l}</td>
                      <td style={{fontWeight: 'bold'}}>{s.pd > 0 ? '+'+s.pd : s.pd}</td>
                    </tr>
                  ))}
                  {catData.standings.length === 0 && (
                    <tr>
                      <td colSpan="6" style={{padding: '40px'}}>No standings available yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'knockouts' && (
          <div className="knockouts-list">
            {catData.knockouts && catData.knockouts.length > 0 ? catData.knockouts.map((m, i) => (
              <div className={`match-card fade-in-up ${i % 2 === 0 ? 'neon-alt' : 'neon-primary'}`} key={i} style={{animationDelay: `${i * 0.1}s`}}>
                <div className="match-teams">
                  <div className="team left">
                    <div className="team-icon"><CrossedPaddlesIcon size={42} /></div>
                    <div className="team-name">{m.team_a.split(' / ').map((name, idx) => <div key={idx}>{name}{idx===0?' /':''}</div>)}</div>
                    <div className="team-score">
                      {m.score_a !== "" ? m.score_a : "-"}
                    </div>
                  </div>
                  <div className="vs">VS</div>
                  <div className="team right">
                    <div className="team-icon"><CrossedPaddlesIcon size={42} /></div>
                    <div className="team-name">{m.team_b.split(' / ').map((name, idx) => <div key={idx}>{name}{idx===0?' /':''}</div>)}</div>
                    <div className="team-score">
                      {m.score_b !== "" ? m.score_b : "-"}
                    </div>
                  </div>
                </div>
                <div className="match-footer">
                  {m.round}{m.label ? <span>•</span> : ''}{m.label}
                </div>
              </div>
            )) : <p style={{textAlign: 'center', color: '#a1a1aa', padding: '40px'}}>No knockouts available yet.</p>}
          </div>
        )}
      </div>

        </>
      )}
      <div className="built-by">
        <Heart size={14} color="#a3e635" fill="#a3e635" /> BUILT FOR THE PICKLEBALL COMMUNITY
      </div>
    </div>
  )
}

export default App
