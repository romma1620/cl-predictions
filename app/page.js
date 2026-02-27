'use client';

import { useEffect, useMemo, useState } from 'react';
import { avatars, knockoutMatchIds, knockoutRounds } from '@/lib/matches';

const emptyPicks = Object.fromEntries(knockoutMatchIds.map((matchId) => [matchId, '']));

const allMatches = knockoutRounds.flatMap((round) => round.matches);
const matchesById = Object.fromEntries(allMatches.map((match) => [match.id, match]));

const dependentsByMatchId = allMatches.reduce((map, match) => {
  if (!match.from) {
    return map;
  }

  match.from.forEach((sourceId) => {
    map[sourceId] = map[sourceId] || [];
    map[sourceId].push(match.id);
  });

  return map;
}, {});

function normalizePicks(input) {
  if (Array.isArray(input)) {
    return input.reduce((acc, item) => {
      if (item?.matchId) {
        acc[item.matchId] = item.winner || '';
      }
      return acc;
    }, { ...emptyPicks });
  }

  if (input && typeof input === 'object') {
    return { ...emptyPicks, ...input };
  }

  return { ...emptyPicks };
}

function getMatchOptions(match, picks) {
  if (match.home && match.away) {
    return [match.home, match.away];
  }

  return (match.from || []).map((matchId) => picks[matchId]).filter(Boolean);
}

function getMatchLabel(match, picks) {
  if (match.home && match.away) {
    return `${match.home} vs ${match.away}`;
  }

  const teams = (match.from || []).map((sourceId) => picks[sourceId] || `Winner of ${sourceId.toUpperCase()}`);
  return `${teams[0]} vs ${teams[1]}`;
}

export default function HomePage() {
  const [stage, setStage] = useState('login');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [avatar, setAvatar] = useState('');
  const [picks, setPicks] = useState({ ...emptyPicks });
  const [dashboard, setDashboard] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const canSubmitPredictions = useMemo(
    () =>
      knockoutMatchIds.every((matchId) => {
        const match = matchesById[matchId];
        const options = getMatchOptions(match, picks);
        return options.length === 2 && options.includes(picks[matchId]);
      }),
    [picks]
  );

  async function loadDashboard() {
    const response = await fetch('/api/predictions', { cache: 'no-store' });
    const data = await response.json();
    const entries = (data.predictions || []).map((entry) => ({
      ...entry,
      picks: normalizePicks(entry.picks)
    }));
    setDashboard(entries);
  }

  useEffect(() => {
    const storedName = window.localStorage.getItem('cl-user-name');
    const storedAvatar = window.localStorage.getItem('cl-user-avatar');

    if (storedName) {
      setName(storedName);
      if (storedAvatar) {
        setAvatar(storedAvatar);
        setStage('predict');
      } else {
        setStage('avatar');
      }
    }

    loadDashboard();
  }, []);

  async function handleLogin(event) {
    event.preventDefault();
    setMessage('');
    setLoading(true);

    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, password })
    });

    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      setMessage(data.error || 'Login failed.');
      return;
    }

    window.localStorage.setItem('cl-user-name', name);
    setStage('avatar');
    setMessage('Logged in. Pick an avatar.');
  }

  async function handleSaveAvatar() {
    if (!avatar) {
      setMessage('Pick one avatar first.');
      return;
    }

    setLoading(true);
    setMessage('');

    const response = await fetch('/api/avatar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, avatar })
    });

    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      setMessage(data.error || 'Could not save avatar.');
      return;
    }

    window.localStorage.setItem('cl-user-avatar', avatar);
    setStage('predict');
    setMessage('Avatar saved. Complete your full knockout bracket.');
    await loadDashboard();
  }

  function clearDependentPicks(nextPicks, sourceId) {
    const dependents = dependentsByMatchId[sourceId] || [];
    dependents.forEach((dependentId) => {
      nextPicks[dependentId] = '';
      clearDependentPicks(nextPicks, dependentId);
    });
  }

  function updatePick(matchId, winner) {
    setPicks((current) => {
      const next = { ...current, [matchId]: winner };
      clearDependentPicks(next, matchId);
      return next;
    });
  }

  async function handleSavePredictions() {
    if (!canSubmitPredictions) {
      setMessage('Please complete every round from R16 to Final Winner.');
      return;
    }

    setLoading(true);
    setMessage('');

    const response = await fetch('/api/predictions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, picks })
    });

    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      setMessage(data.error || 'Could not save predictions.');
      return;
    }

    setMessage('Bracket saved! Everyone can see your full road to the final winner.');
    await loadDashboard();
  }

  return (
    <main className="page">
      <section className="card">
        <h1>Road to Budapest 26 — Prediction Bracket</h1>
        <p className="subtitle">Login → avatar → predict from Round of 16 to the final winner.</p>

        {stage === 'login' && (
          <form className="form" onSubmit={handleLogin}>
            <label>
              Name
              <input value={name} onChange={(event) => setName(event.target.value)} required />
            </label>
            <label>
              Password
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </label>
            <button disabled={loading} type="submit">
              {loading ? 'Loading...' : 'Login'}
            </button>
          </form>
        )}

        {stage === 'avatar' && (
          <div className="section">
            <p>Welcome, {name}! Choose your avatar:</p>
            <div className="avatarGrid">
              {avatars.map((icon) => (
                <button
                  key={icon}
                  className={avatar === icon ? 'avatar active' : 'avatar'}
                  onClick={() => setAvatar(icon)}
                  type="button"
                >
                  {icon}
                </button>
              ))}
            </div>
            <button disabled={loading || !avatar} onClick={handleSaveAvatar} type="button">
              {loading ? 'Saving...' : 'Save avatar'}
            </button>
          </div>
        )}

        {stage === 'predict' && (
          <div className="section">
            <p>
              Signed in as <strong>{avatar || '🙂'} {name}</strong>
            </p>

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
                            {[0, 1].map((index) => {
                              const team = options[index] || 'Waiting...';
                              const disabled = !options[index];
                              return (
                                <button
                                  key={`${match.id}-${index}`}
                                  className={selectedWinner === team ? 'pick active' : 'pick'}
                                  disabled={disabled}
                                  onClick={() => updatePick(match.id, team)}
                                  type="button"
                                >
                                  {team}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <button disabled={loading || !canSubmitPredictions} onClick={handleSavePredictions} type="button">
              {loading ? 'Saving...' : 'Save full bracket'}
            </button>
          </div>
        )}

        {message && <p className="message">{message}</p>}
      </section>

      <section className="card">
        <h2>Predictions Dashboard</h2>
        <p className="subtitle">Everyone can see each full bracket and champion pick.</p>

        {dashboard.length === 0 && <p>No predictions yet.</p>}

        {dashboard.map((entry) => (
          <article className="dashboardEntry" key={entry.name}>
            <h3>
              {entry.avatar} {entry.name}
            </h3>
            <p className="championPick">🏆 Final winner: <strong>{entry.picks['final-1'] || 'Not set'}</strong></p>
            {knockoutRounds.map((round) => (
              <div className="dashboardRound" key={`${entry.name}-${round.key}`}>
                <h4>{round.title}</h4>
                <ul>
                  {round.matches.map((match) => (
                    <li key={`${entry.name}-${match.id}`}>
                      {getMatchLabel(match, entry.picks)} → <strong>{entry.picks[match.id] || 'Not picked'}</strong>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </article>
        ))}
      </section>
    </main>
  );
}
