'use client';

import { useEffect, useMemo, useState } from 'react';
import { avatars, matches } from '@/lib/matches';

const emptyPicks = matches.map((match) => ({ matchId: match.id, winner: '' }));

export default function HomePage() {
  const [stage, setStage] = useState('login');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [avatar, setAvatar] = useState('');
  const [picks, setPicks] = useState(emptyPicks);
  const [dashboard, setDashboard] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const canSubmitPredictions = useMemo(
    () => picks.every((pick) => pick.winner),
    [picks]
  );

  async function loadDashboard() {
    const response = await fetch('/api/predictions', { cache: 'no-store' });
    const data = await response.json();
    setDashboard(data.predictions || []);
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
    setMessage('Avatar saved. Now make your predictions.');
    await loadDashboard();
  }

  function updatePick(matchId, winner) {
    setPicks((current) =>
      current.map((pick) =>
        pick.matchId === matchId
          ? {
              ...pick,
              winner
            }
          : pick
      )
    );
  }

  async function handleSavePredictions() {
    if (!canSubmitPredictions) {
      setMessage('Please choose winners for all matches.');
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

    setMessage('Predictions saved! Everyone can see them in the dashboard.');
    await loadDashboard();
  }

  return (
    <main className="page">
      <section className="card">
        <h1>Champions League 2026 Predictions</h1>
        <p className="subtitle">Simple app: login → avatar → pick winners.</p>

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
            <div className="matches">
              {matches.map((match) => {
                const selectedWinner = picks.find((pick) => pick.matchId === match.id)?.winner || '';
                return (
                  <div className="matchCard" key={match.id}>
                    <p>
                      {match.home} vs. {match.away}
                    </p>
                    <div className="choiceRow">
                      <button
                        className={selectedWinner === match.home ? 'pick active' : 'pick'}
                        onClick={() => updatePick(match.id, match.home)}
                        type="button"
                      >
                        {match.home}
                      </button>
                      <button
                        className={selectedWinner === match.away ? 'pick active' : 'pick'}
                        onClick={() => updatePick(match.id, match.away)}
                        type="button"
                      >
                        {match.away}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            <button disabled={loading || !canSubmitPredictions} onClick={handleSavePredictions} type="button">
              {loading ? 'Saving...' : 'Save predictions'}
            </button>
          </div>
        )}

        {message && <p className="message">{message}</p>}
      </section>

      <section className="card">
        <h2>Predictions Dashboard</h2>
        <p className="subtitle">Everyone can see submitted picks.</p>

        {dashboard.length === 0 && <p>No predictions yet.</p>}

        {dashboard.map((entry) => (
          <article className="dashboardEntry" key={entry.name}>
            <h3>
              {entry.avatar} {entry.name}
            </h3>
            <ul>
              {entry.picks.map((pick) => {
                const match = matches.find((item) => item.id === pick.matchId);
                return (
                  <li key={`${entry.name}-${pick.matchId}`}>
                    {match?.home} vs. {match?.away} → <strong>{pick.winner}</strong>
                  </li>
                );
              })}
            </ul>
          </article>
        ))}
      </section>
    </main>
  );
}
