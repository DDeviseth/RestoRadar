import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

export function installAuth(app, { username, password, secret, secure = false }) {
  const ready = !!(username && password && secret),
    salt = randomBytes(16);
  const passwordHash = ready ? scryptSync(password, salt, 64) : null;
  const sign = (value) => createHmac('sha256', secret).update(value).digest('base64url');
  const equal = (a, b) => {
    const x = Buffer.from(a),
      y = Buffer.from(b);
    return x.length === y.length && timingSafeEqual(x, y);
  };
  const cookie = (res, value, maxAge) =>
    res.setHeader(
      'Set-Cookie',
      `restoradar_session=${value}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${maxAge}${secure ? '; Secure' : ''}`,
    );
  const session = (req) => {
    if (!ready) return false;
    const token = req.headers.cookie
      ?.split(';')
      .map((x) => x.trim())
      .find((x) => x.startsWith('restoradar_session='))
      ?.slice(19);
    if (!token) return false;
    const [payload, signature, ...extra] = token.split('.');
    if (extra.length || !signature || !equal(sign(payload), signature)) return false;
    try {
      const data = JSON.parse(Buffer.from(payload, 'base64url').toString());
      return data.user === username && data.expires > Date.now();
    } catch {
      return false;
    }
  };
  const attempts = new Map();
  app.use('/api', (req, res, next) => {
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
    const origin = req.get('origin');
    if (origin) {
      try {
        if (new URL(origin).host !== req.get('host'))
          return res.status(403).json({ error: 'Request origin is not allowed.' });
      } catch {
        return res.status(403).json({ error: 'Invalid request origin.' });
      }
    }
    next();
  });
  app.get('/api/auth/session', (req, res) => {
    res.set('Cache-Control', 'no-store');
    res.json({
      authenticated: session(req),
      username: session(req) ? username : null,
      configured: ready,
    });
  });
  app.post('/api/auth/login', (req, res) => {
    res.set('Cache-Control', 'no-store');
    if (!ready)
      return res
        .status(503)
        .json({ error: 'Administrator sign-in needs to be configured in the server settings.' });
    const key = req.socket.remoteAddress || 'unknown',
      now = Date.now();
    for (const [k, v] of attempts) if (v.until < now) attempts.delete(k);
    const entry = attempts.get(key) || { count: 0, until: now + 15 * 60 * 1000 };
    if (entry.count >= 10)
      return res.status(429).json({ error: 'Too many sign-in attempts. Try again in 15 minutes.' });
    const valid =
      typeof req.body.password === 'string' &&
      req.body.password.length <= 256 &&
      equal(scryptSync(req.body.password, salt, 64), passwordHash) &&
      req.body.username === username;
    if (!valid) {
      entry.count++;
      attempts.set(key, entry);
      return res.status(401).json({ error: 'The username or password is incorrect.' });
    }
    attempts.delete(key);
    const payload = Buffer.from(
      JSON.stringify({
        user: username,
        expires: now + 8 * 60 * 60 * 1000,
        nonce: randomBytes(16).toString('hex'),
      }),
    ).toString('base64url');
    cookie(res, payload + '.' + sign(payload), 8 * 60 * 60);
    res.json({ authenticated: true, username });
  });
  app.post('/api/auth/logout', (req, res) => {
    cookie(res, '', 0);
    res.json({ authenticated: false });
  });
  app.use('/api/restaurants', (req, res, next) => {
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method) || session(req)) return next();
    res.status(401).json({ error: 'Sign in as an administrator to change restaurant records.' });
  });
}
