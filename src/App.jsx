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
  tournament_name: "Exeter Grand Slam 2026",
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

function App() {
  const [data, setData] = useState(DUMMY_DATA);
  const [activeTab, setActiveTab] = useState('fixtures'); // fixtures, standings, knockouts
  const [selectedCategory, setSelectedCategory] = useState(Object.keys(DUMMY_DATA.categories)[0]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}));

  useEffect(() => {
    fetchTournamentState();

    // Subscribe to realtime changes
    const subscription = supabase
      .channel('public:tournament_state')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tournament_state' }, payload => {
        if (payload.new && payload.new.data) {
          setData(payload.new.data);
          setLastUpdated(new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}));
          // Set initial category if not set
          const cats = Object.keys(payload.new.data.categories || {}).sort((a, b) => a.localeCompare(b));
          if (cats.length > 0 && !cats.includes(selectedCategory)) {
            setSelectedCategory(cats[0]);
          }
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    }
  }, []);

  const fetchTournamentState = async () => {
    try {
      const { data: row, error } = await supabase
        .from('tournament_state')
        .select('*')
        .eq('id', 1)
        .single();
        
      if (row && row.data) {
        setData(row.data);
        const cats = Object.keys(row.data.categories || {}).sort((a, b) => a.localeCompare(b));
        if (cats.length > 0) {
          setSelectedCategory(cats[0]);
        }
      }
    } catch (err) {
      console.log('Using dummy data or failed to fetch:', err);
    } finally {
      setLoading(false);
    }
  };

  const catData = data.categories?.[selectedCategory] || { matches: [], standings: [], knockouts: [] };

  // Parse title to highlight parts if possible
  const splitTitle = data.tournament_name.split(' ');
  const titleStart = splitTitle.slice(0, Math.ceil(splitTitle.length/2)).join(' ');
  const titleEnd = splitTitle.slice(Math.ceil(splitTitle.length/2)).join(' ');

  return (
    <div className="container">
      <div className="header-wrapper">
        <div className="logo-container">
          <div className="logo-icon">
            <CrossedPaddlesIcon size={28} />
            <span className="logo-text-1">TOURNAMENT</span>
          </div>
          <span className="logo-text-2">MASTER</span>
        </div>
        
        <header className="header">
          <h1 className="title">{titleStart} <span>{titleEnd}</span></h1>
          <div className="subtitle">
            LIVE FIXTURES <span>•</span> STANDINGS <span>•</span> KNOCKOUTS
          </div>
        </header>

        <div className="live-indicator">
          <div className="live-badge">
            <div className="live-dot"></div>
            LIVE
          </div>
          <div className="updated-text">UPDATED {lastUpdated}</div>
        </div>
      </div>

      <div className="card" style={{padding: '15px 20px', marginBottom: '25px'}}>
        <div className="card-label">SELECT CATEGORY</div>
        <div className="select-wrapper">
          <select 
            value={selectedCategory} 
            onChange={e => setSelectedCategory(e.target.value)}
          >
            {Object.keys(data.categories).sort((a, b) => a.localeCompare(b)).map(cat => (
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

      <div className="built-by">
        <Heart size={14} color="#a3e635" fill="#a3e635" /> BUILT FOR THE PICKLEBALL COMMUNITY
      </div>
    </div>
  )
}

export default App
