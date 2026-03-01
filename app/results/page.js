'use client';

import { useEffect, useState } from 'react';
import { knockoutMatchIds, knockoutRounds, teamLogos } from 'lib/matches';

const emptyPicks = Object.fromEntries(knockoutMatchIds.map((id) => [id, '']));

const allMatches = knockoutRounds.flatMap((round) => round.matches);
const matchesById = Object.fromEntries(allMatches.map((m) => [m.id, m]));

const dependentsByMatchId = allMatches.reduce((map, match) => {
  if (!match.from) return map;
  match.from.forEach((sourceId) => {
    map[sourceId] = map[sourceId] || [];
    map[sourceId].push(match.id);
  });
  return map;
}, {});

function getMatchOptions(match, picks) {
  if (match.home && match.away) return [match.home, match.away];
  return (match.from || []).map((id) => picks[id]).filter(Boolean);
}

function getMatchLabel(match, picks) {
  if (match.home && match.away) return `${match.home} vs ${match.away}`;
  const teams = (match.from || []).map((id) => picks[id] || `Winner of ${id.toUpperCase()}`);
  return `${teams[0]} vs ${teams[1]}`;
}

function TeamBadge({ team }) {
  return (
    <span className="teamBadge">
      <img alt={`${team} logo`} className="teamLogo" src={teamLogos[team]} />
      <span>{team}</span>
    </span>
  );
}

function clearDependentPicks(nextPicks, sourceId) {
  const dependents = dependentsByMatchId[sourceId] || [];
  dependents.forEach((id) => {
    nextPicks[id] = '';
    clearDependentPicks(nextPicks, id);
  });
}

export default function ResultsPage() {
  const [stage, setStage] = useState('password');
  const [password, setPassword] = useState('');
  const [picks, setPicks] = useState({ ...emptyPicks });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/results')
      .then((r) => r.json())
      .then((data) => {
        if (data.results) {
          setPicks((current) => ({ ...current, ...data.results }));
        }
      })
      .catch(() => {});
  }, []);

  function updatePick(matchId, winner) {
    setPicks((current) => {
      const next = { ...current, [matchId]: winner };
      clearDependentPicks(next, matchId);
      return next;
    });
  }

  async function handleSave() {
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, picks })
      });

      const data = await response.json();

      if (response.status === 403) {
        setMessage('Wrong password.');
        setStage('password');
        setLoading(false);
        return;
      }

      if (!response.ok) {
        setMessage(data.error || 'Failed to save.');
        setLoading(false);
        return;
      }

      setMessage('Results saved successfully.');
    } catch {
      setMessage('Network error.');
    } finally {
      setLoading(false);
    }
  }

  async function handlePasswordSubmit(e) {
    e.preventDefault();
    if (!password.trim()) return;
    setStage('editor');
    setMessage('');
  }

  return (
    <main className="page">
      <section className="card">
        <div className="header">
          <h1>Admin — Enter Real Results</h1>
          <p className="subtitle">Enter match outcomes as they happen. Partial saves are allowed.</p>
        </div>

        {stage === 'password' && (
          <form className="form" onSubmit={handlePasswordSubmit}>
            <label>
              Admin Password
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </label>
            <button type="submit">Enter</button>
          </form>
        )}

        {stage === 'editor' && (
          <div className="section">
            <div className="bracketRounds">
              {knockoutRounds.map((round) => (
                <div className="round" key={round.key}>
                  <h3>{round.title}</h3>
                  <div className="matches">
                    {round.matches.map((match) => {
                      const options = getMatchOptions(match, picks);
                      const selectedWinner = options.includes(picks[match.id]) ? picks[match.id] : '';

                      return (
                        <div className="matchCard" key={match.id}>
                          <p>{getMatchLabel(match, picks)}</p>
                          <div className="choiceRow">
                            <button
                              className={selectedWinner === (options[0] || '') ? 'pick active' : 'pick'}
                              disabled={!options[0]}
                              onClick={() => updatePick(match.id, options[0])}
                              type="button"
                            >
                              {options[0] ? <TeamBadge team={options[0]} /> : 'Waiting...'}
                            </button>
                            <span className="vsLabel">vs</span>
                            <button
                              className={selectedWinner === (options[1] || '') ? 'pick active' : 'pick'}
                              disabled={!options[1]}
                              onClick={() => updatePick(match.id, options[1])}
                              type="button"
                            >
                              {options[1] ? <TeamBadge team={options[1]} /> : 'Waiting...'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <button disabled={loading} onClick={handleSave} type="button">
              {loading ? 'Saving...' : 'Save results'}
            </button>
          </div>
        )}

        {message && <p className="message">{message}</p>}
      </section>
    </main>
  );
}
