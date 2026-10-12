import React, { useState } from 'react';
import { Button } from '@heroui/react';
import { ShieldCheck } from 'lucide-react';
import { api } from '../api.js';

export default function AdminSignIn({ loading, configured, onSignedIn }) {
  const [showDemo, setShowDemo] = useState(false);
  const [username, setUsername] = useState('admin'),
    [password, setPassword] = useState(''),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  return (
    <section className="admin-signin">
      <div className="signin-intro">
        <ShieldCheck size={38} />
        <h1>Admin Login</h1>
        <p>Keep the restaurant collection up to date. Sign in to add, edit, and delete records.</p>
        <a href="#home">← Back to exploring</a>
        <div className="demo-reveal-control">
          <button
            type="button"
            className="demo-reveal-button"
            aria-expanded={showDemo}
            aria-controls="demo-credentials"
            onDoubleClick={() => setShowDemo((v) => !v)}
            onClick={(e) => {
              if (e.detail === 0) setShowDemo((v) => !v);
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              setShowDemo((v) => !v);
            }}
          >
            {showDemo ? 'Hide demo login' : 'Show demo login'}
          </button>
          <p className="demo-reveal-hint">Double-click to reveal. On mobile, tap once.</p>
        </div>
        {showDemo && (
          <aside
            id="demo-credentials"
            className="demo-login demo-pop"
            aria-label="Example administrator login"
          >
            <h2>Example login</h2>
            <p>Use these details to try the administrator workspace.</p>
            <dl>
              <div>
                <dt>Username</dt>
                <dd>admin</dd>
              </div>
              <div>
                <dt>Password</dt>
                <dd>admin123</dd>
              </div>
            </dl>
          </aside>
        )}
      </div>
      <form
        className="signin-form"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError('');
          try {
            const user = await api('/api/auth/login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ username, password }),
            });
            setPassword('');
            onSignedIn(user);
          } catch (e) {
            setError(e.message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <h2>Welcome back.</h2>
        <label htmlFor="admin-username">Username</label>
        <input
          id="admin-username"
          name="username"
          autoComplete="username"
          required
          maxLength={100}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <label htmlFor="admin-password">Password</label>
        <input
          id="admin-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          maxLength={256}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && (
          <p role="alert" className="form-error">
            {error}
          </p>
        )}
        {configured === false && (
          <p className="muted">
            Administrator access has not been configured yet. Contact the project owner.
          </p>
        )}
        <Button
          type="submit"
          className="orange-button"
          isLoading={busy || loading}
          isDisabled={configured === false}
        >
          Sign in
        </Button>
        <p className="muted">Browsing restaurants is open to everyone.</p>
      </form>
    </section>
  );
}
