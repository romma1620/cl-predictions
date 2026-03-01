'use client';

import { useEffect, useMemo, useState } from 'react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { firebaseAuth } from 'lib/firebase-client';
import { avatars, knockoutMatchIds, knockoutRounds, teamLogos } from 'lib/matches';

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

async function parseJsonSafely(response) {
  const text = await response.text();
  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch {
    return { error: 'Server returned an invalid response. Please try again.' };
  }
}

function TeamBadge({ team }) {
  return (
    <span className="teamBadge">
      <img alt={`${team} logo`} className="teamLogo" src={teamLogos[team]} />
      <span>{team}</span>
    </span>
  );
}

export default function HomePage() {
  const [stage, setStage] = useState('login');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [avatar, setAvatar] = useState('');
  const [token, setToken] = useState('');
  const [picks, setPicks] = useState({ ...emptyPicks });
  const [dashboard, setDashboard] = useState([]);
  const [results, setResults] = useState({});
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
    const response = await fetch('/api/predictions', {
      cache: 'no-store',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined
    });
    const data = await parseJsonSafely(response);

    if (!response.ok) {
      setMessage(data.error || 'Could not load predictions dashboard.');
      return;
    }

    const entries = (data.predictions || []).map((entry) => ({
      ...entry,
      picks: normalizePicks(entry.picks)
    }));
    setDashboard(entries);
  }

  useEffect(() => {
    const storedName = window.localStorage.getItem('cl-user-name');
    const storedAvatar = window.localStorage.getItem('cl-user-avatar');
    const storedToken = window.localStorage.getItem('cl-user-token');

    if (storedName && storedToken) {
      setName(storedName);
      setToken(storedToken);
      if (storedAvatar) {
        setAvatar(storedAvatar);
        setStage('predict');
      } else {
        setStage('avatar');
      }
    }

  }, []);

  useEffect(() => {
    loadDashboard();
    fetch('/api/results')
      .then((r) => r.json())
      .then((data) => { if (data.results) setResults(data.results); })
      .catch(() => {});
  }, [token]);

  async function handleLogin(event) {
    event.preventDefault();
    setMessage('');
    setLoading(true);

    try {
      const safeName = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '.').replace(/^\.+|\.+$/g, '') || 'user';
      const email = `${safeName}@cl-predictions.local`;

      let credential;
      try {
        credential = await signInWithEmailAndPassword(firebaseAuth, email, password);
      } catch (error) {
        if (['auth/user-not-found', 'auth/invalid-credential', 'auth/invalid-login-credentials'].includes(error?.code)) {
          credential = await createUserWithEmailAndPassword(firebaseAuth, email, password);
        } else {
          throw error;
        }
      }

      const idToken = await credential.user.getIdToken();
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`
        },
        body: JSON.stringify({ name })
      });
      const data = await parseJsonSafely(response);

      if (!response.ok) {
        setMessage(data.error || 'Login failed.');
        setLoading(false);
        return;
      }

      window.localStorage.setItem('cl-user-name', name);
      window.localStorage.setItem('cl-user-token', idToken);
      setToken(idToken);
      setAvatar(data.avatar || '');
      setStage(data.avatar ? 'predict' : 'avatar');
      setMessage(data.avatar ? 'Logged in.' : 'Logged in. Pick your team logo avatar.');
    } catch (error) {
      setMessage(error?.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
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
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ name, avatar })
    });

    const data = await parseJsonSafely(response);
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
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ name, picks, avatar })
    });

    const data = await parseJsonSafely(response);
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
        <div className="header">
          <h1>Road to Budapest 26 — Prediction Bracket</h1>
          <p className="subtitle">Pick every round from R16 to the final winner.</p>
        </div>

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
              {avatars.map((team) => (
                <button
                  key={team}
                  className={avatar === team ? 'avatar active' : 'avatar'}
                  onClick={() => setAvatar(team)}
                  type="button"
                >
                  <TeamBadge team={team} />
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
            <div className="signedInBar">
              <p className="userBar">
                Signed in as <strong>{avatar ? <TeamBadge team={avatar} /> : '🙂'} {name}</strong>
              </p>
              <button
                className="logoutBtn"
                type="button"
                onClick={() => {
                  window.localStorage.removeItem('cl-user-name');
                  window.localStorage.removeItem('cl-user-avatar');
                  window.localStorage.removeItem('cl-user-token');
                  setName('');
                  setPassword('');
                  setAvatar('');
                  setToken('');
                  setPicks({ ...emptyPicks });
                  setStage('login');
                  setMessage('');
                }}
              >
                Logout
              </button>
            </div>

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
                              key={`${match.id}-0`}
                              className={selectedWinner === (options[0] || '') ? 'pick active' : 'pick'}
                              disabled={!options[0]}
                              onClick={() => updatePick(match.id, options[0])}
                              type="button"
                            >
                              {options[0] ? <TeamBadge team={options[0]} /> : 'Waiting...'}
                            </button>
                            <span className="vsLabel">vs</span>
                            <button
                              key={`${match.id}-1`}
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

            {picks['final-1'] && (
              <div className="championContainer">
                <p className="championPick">
                  Your champion: <strong><TeamBadge team={picks['final-1']} /></strong>
                </p>
              </div>
            )}

            <button disabled={loading || !canSubmitPredictions} onClick={handleSavePredictions} type="button">
              {loading ? 'Saving...' : 'Save full bracket'}
            </button>
          </div>
        )}

        {message && <p className="message">{message}</p>}
      </section>

      <section className="card prizeCard">
        <div className="header">
          <h2>The Prize</h2>
          <p className="subtitle">What you're playing for.</p>
        </div>
        <div className="prizeImageWrapper">
          <img className="prizeImage" src="/1715.jpeg" alt="The prize" />
        </div>
      </section>

      <section className="card">
        <div className="header">
          <h2>Predictions Dashboard</h2>
          <p className="subtitle">Everyone can see each full bracket and champion pick.</p>
        </div>

        {dashboard.length === 0 && <p>No predictions yet.</p>}

        {dashboard.map((entry) => {
          const totalAnswered = knockoutMatchIds.filter((id) => results[id]).length;
          const correctCount = knockoutMatchIds.filter(
            (id) => results[id] && entry.picks[id] && results[id] === entry.picks[id]
          ).length;

          return (
          <article className="dashboardEntry" key={entry.name}>
            <h3>
              {entry.avatar && teamLogos[entry.avatar] ? (
                <img className="dashboardAvatar" src={teamLogos[entry.avatar]} alt={entry.avatar} />
              ) : null}
              {entry.name}
            </h3>
            {totalAnswered > 0 && (
              <div className="scoreDisplay">
                <span className="scoreValue">{correctCount}/{totalAnswered}</span>
                <span className="scoreLabel">correct</span>
              </div>
            )}
            <div className="championContainer">
              <p className="championPick">
                {entry.picks['final-1'] ? (
                  <>Final winner: <strong><TeamBadge team={entry.picks['final-1']} /></strong></>
                ) : (
                  <>Final winner: <strong>Not set</strong></>
                )}
              </p>
            </div>
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
          );
        })}
      </section>
    </main>
  );
}
