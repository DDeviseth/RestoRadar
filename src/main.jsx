import { api } from './api.js';
import { names, themes } from './constants.js';
import AdminSignIn from './components/AdminSignIn.jsx';
import Editor from './components/RestaurantEditor.jsx';
import CuisinePhoto from './components/CuisinePhoto.jsx';
import { assignPhotos } from './photo-selection.js';
import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  HeroUIProvider,
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from '@heroui/react';
import {
  Radar,
  Search,
  ArrowUpRight,
  ArrowRight,
  MapPin,
  Utensils,
  Plus,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChartNoAxesCombined,
  LayoutGrid,
  List,
  Check,
  ArrowLeft,
} from 'lucide-react';
import '@fontsource/outfit/400.css';
import '@fontsource/outfit/500.css';
import '@fontsource/outfit/600.css';
import '@fontsource/outfit/700.css';
import '@fontsource/outfit/800.css';
import './style.css';
const fmt = (n) => Number(n).toLocaleString();

const date = (d) =>
  new Date(d?.$date ?? d).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
function App() {
  const [auth, setAuth] = useState(null);
  useEffect(() => {
    api('/api/auth/session')
      .then(setAuth)
      .catch(() => setAuth({ authenticated: false }));
  }, []);
  const [route, setRoute] = useState(location.hash.slice(1) || 'home'),
    [summary, setSummary] = useState(null),
    [results, setResults] = useState(null),
    [q, setQ] = useState(''),
    [field, setField] = useState('name'),
    [borough, setBorough] = useState(''),
    [cuisine, setCuisine] = useState(''),
    [page, setPage] = useState(1),
    [view, setView] = useState('cards'),
    [revision, setRevision] = useState(0),
    [error, setError] = useState(''),
    [notice, setNotice] = useState(''),
    [detail, setDetail] = useState(null),
    [edit, setEdit] = useState(null),
    [deleting, setDeleting] = useState(null),
    [busy, setBusy] = useState(false),
    [min, setMin] = useState(90),
    [limit, setLimit] = useState(10);
  const go = (r) => {
    location.hash = r;
  };
  useEffect(() => {
    const onHash = () => {
      setRoute(location.hash.slice(1) || 'home');
      setPage(1);
      setError('');
      window.scrollTo(0, 0);
    };
    addEventListener('hashchange', onHash);
    return () => removeEventListener('hashchange', onHash);
  }, []);
  useEffect(() => {
    let active = true;
    api(`/api/summary?min=${min}&limit=${limit}`)
      .then((d) => active && setSummary(d))
      .catch((e) => active && setError(e.message));
    return () => {
      active = false;
    };
  }, [revision, min, limit]);
  useEffect(() => {
    const controller = new AbortController();
    setResults(null);
    const params = new URLSearchParams({ q, field, borough, cuisine, page: String(page) });
    const timer = setTimeout(
      () =>
        api('/api/restaurants?' + params, { signal: controller.signal })
          .then(setResults)
          .catch((e) => {
            if (e.name !== 'AbortError') setError(e.message);
          }),
      150,
    );
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [q, field, borough, cuisine, page, revision, route]);
  useEffect(() => {
    if (!route.startsWith('detail/')) return;
    let active = true;
    setDetail(null);
    api('/api/restaurants/' + route.split('/')[1])
      .then((r) => active && setDetail(r))
      .catch((e) => active && setError(e.message));
    return () => {
      active = false;
    };
  }, [route, revision]);
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(''), 5000);
    return () => clearTimeout(t);
  }, [notice]);
  const reset = () => {
    setQ('');
    setCuisine('');
    setBorough('');
    setPage(1);
  };
  const browse = (b = '', c = '') => {
    reset();
    setBorough(b);
    setCuisine(c);
    go('restaurants');
  };
  const mutate = async (url, method, body) => {
    setBusy(true);
    try {
      await api(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
      });
      setRevision((v) => v + 1);
      setNotice(
        method === 'DELETE'
          ? 'Restaurant deleted.'
          : method === 'POST'
            ? 'Restaurant added.'
            : 'Changes saved.',
      );
      return true;
    } catch (e) {
      if (e.status === 401) setAuth({ authenticated: false });
      setError(e.message);
      return false;
    } finally {
      setBusy(false);
    }
  };
  const isAdmin = route.startsWith('admin');
  const cardPhotos = assignPhotos(results?.records || []);
  const Card = ({ r, index = 0 }) => (
    <article className="restaurant-card" style={{ '--card-order': Math.min(index, 7) }}>
      <CuisinePhoto photo={cardPhotos.get(r.restaurant_id)} />
      <div className={'card-top ' + themes[Math.max(0, names.indexOf(r.borough))]}>
        <span>
          <Utensils size={20} />
          {r.cuisine}
        </span>
        <span className="grade">{r.latest?.grade || 'No grade'}</span>
      </div>
      <div className="card-body">
        <button className="restaurant-title" onClick={() => go('detail/' + r.restaurant_id)}>
          {r.name}
          <ArrowUpRight size={19} />
        </button>
        <p className="location">
          <MapPin size={14} />
          {r.borough}
        </p>
        <p className="description">{r.description}</p>
        <div className="card-bottom">
          <span>
            Inspection score <strong>{r.latest?.score ?? '—'}</strong>
          </span>
          <button aria-label={'View ' + r.name} onClick={() => go('detail/' + r.restaurant_id)}>
            <ArrowRight size={19} />
          </button>
        </div>
      </div>
    </article>
  );
  const Filters = () => (
    <div className="filters">
      <label className="search-box">
        <Search size={19} />
        <input
          aria-label="Search restaurants"
          placeholder="Search restaurants…"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
        />
      </label>
      <label>
        <span className="sr-only">Cuisine</span>
        <select
          value={cuisine}
          onChange={(e) => {
            setCuisine(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All cuisines</option>
          {summary?.cuisines.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </label>
      <label>
        <span className="sr-only">Borough</span>
        <select
          value={borough}
          onChange={(e) => {
            setBorough(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All boroughs</option>
          {names.map((b) => (
            <option key={b}>{b}</option>
          ))}
        </select>
      </label>
      <Button variant="light" onPress={reset}>
        Reset
      </Button>
    </div>
  );
  const Pagination = () =>
    results &&
    results.total > 0 && (
      <div className="pagination">
        <span>
          {fmt(results.total)} records · Page {page} of {results.pages}
        </span>
        <div>
          <Button
            isIconOnly
            aria-label="Previous page"
            variant="bordered"
            isDisabled={page === 1}
            onPress={() => setPage((p) => p - 1)}
          >
            <ChevronLeft size={18} />
          </Button>
          <Button
            isIconOnly
            aria-label="Next page"
            variant="bordered"
            isDisabled={page >= results.pages}
            onPress={() => setPage((p) => p + 1)}
          >
            <ChevronRight size={18} />
          </Button>
        </div>
      </div>
    );
  const Records = ({ table = false, inspections = false }) =>
    !results ? (
      <div className="skeleton" aria-label="Loading restaurants">
        <div />
        <div />
        <div />
      </div>
    ) : !results.records.length ? (
      <div className="empty">
        <Search size={36} />
        <h2>No restaurants found</h2>
        <p>Try another name or clear your filters.</p>
        <Button onPress={reset}>Clear filters</Button>
      </div>
    ) : table ? (
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Restaurant</th>
              <th>Cuisine</th>
              <th>Borough</th>
              <th>{inspections ? 'Latest inspection' : 'Address'}</th>
              <th>Grade / score</th>
              {isAdmin && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {results.records.map((r, index) => (
              <tr key={r.restaurant_id}>
                <td>
                  <button className="table-name" onClick={() => go('detail/' + r.restaurant_id)}>
                    {r.name}
                  </button>
                  <small>{r.restaurant_id}</small>
                </td>
                <td>{r.cuisine}</td>
                <td>{r.borough}</td>
                <td>
                  {inspections
                    ? r.latest
                      ? date(r.latest.date)
                      : 'No inspections'
                    : `${r.address.building} ${r.address.street}`}
                  <small>{!inspections && r.address.zipcode}</small>
                </td>
                <td>
                  <span className="table-grade">{r.latest?.grade || '—'}</span>{' '}
                  {r.latest?.score ?? '—'}
                </td>
                {isAdmin && (
                  <td>
                    <div className="actions">
                      <Button
                        isIconOnly
                        aria-label={'Edit ' + r.name}
                        variant="light"
                        onPress={() => {
                          setError('');
                          setEdit(r);
                        }}
                      >
                        <Pencil size={17} />
                      </Button>
                      <Button
                        isIconOnly
                        aria-label={'Delete ' + r.name}
                        variant="light"
                        onPress={() => {
                          setError('');
                          setDeleting(r);
                        }}
                      >
                        <Trash2 size={17} />
                      </Button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ) : (
      <div className="record-grid">
        {results.records.map((r, index) => (
          <Card key={r.restaurant_id} r={r} index={index} />
        ))}
      </div>
    );
  return (
    <>
      <a
        className="skip"
        href="#main"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById('main').focus();
        }}
      >
        Skip to content
      </a>
      <header>
        <div className="nav-wrap">
          <a href="#home" className="brand">
            <Radar size={31} />
            <span>
              resto<span>radar</span>
              <small>New York, on the menu.</small>
            </span>
          </a>
          <nav aria-label="Main navigation">
            {[
              ['home', 'Discover'],
              ['restaurants', 'Restaurants'],
              ['search', 'Search'],
              ['boroughs', 'Boroughs'],
              ['insights', 'Insights'],
            ].map(([r, label]) => (
              <a className={route === r ? 'active' : ''} href={'#' + r} key={r}>
                {label}
              </a>
            ))}
          </nav>
        </div>
      </header>
      <main id="main" tabIndex={-1} key={route} className="page-arrival">
        <div className="status-line">
          <span>
            <span className="status-dot" />
            {summary?.mode || 'Loading dataset'}
          </span>
          <span>
            {summary ? fmt(summary.total) : '…'} restaurant records{' '}
            <span className="desktop-only">
              / 5 boroughs / {summary?.cuisines.length || '…'} cuisines
            </span>
          </span>
        </div>
        {error && !edit && !deleting && (
          <div role="alert" className="error">
            {error}
            <Button
              size="sm"
              onPress={() => {
                setError('');
                setRevision((v) => v + 1);
              }}
            >
              Retry
            </Button>
          </div>
        )}
        {notice && (
          <div role="status" className="notice">
            <Check size={18} />
            {notice}
          </div>
        )}
        {isAdmin && !auth?.authenticated ? (
          <AdminSignIn
            loading={auth === null}
            configured={auth?.configured}
            onSignedIn={(user) => {
              setAuth(user);
              setError('');
              reset();
              go('admin');
            }}
          />
        ) : route === 'home' ? (
          <>
            <section className="hero">
              <div className="hero-copy">
                <h1>
                  A whole city.
                  <br />A world of <span>flavor.</span>
                </h1>
                <p>
                  Get to know New York through its restaurants. Explore the cuisines, neighborhoods,
                  and stories in our collection.
                </p>
                <form
                  className="hero-search"
                  onSubmit={(e) => {
                    e.preventDefault();
                    setField('name');
                    go('search');
                  }}
                >
                  <Search size={22} />
                  <input
                    aria-label="Search by restaurant name"
                    placeholder="What’s on your radar?"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                  />
                  <Button type="submit" className="orange-button">
                    Find a restaurant
                    <ArrowUpRight size={19} />
                  </Button>
                </form>
                <div className="quick-links">
                  <span>Start with a cuisine</span>
                  {['Bakery', 'Italian', 'Chinese'].map((c) => (
                    <button key={c} onClick={() => browse('', c)}>
                      {c}
                      <ArrowUpRight size={13} />
                    </button>
                  ))}
                </div>
              </div>
              <div className="borough-board">
                <img
                  className="city-photo"
                  src="/images/new-york.jpg"
                  alt="Storefronts along a New York street"
                  width={1200}
                  height={800}
                  fetchPriority="high"
                />
                <div className="board-heading">
                  <MapPin size={23} />
                  <span>
                    Five boroughs.
                    <br />
                    <strong>Plenty to explore.</strong>
                  </span>
                </div>
                {names.map((b, i) => (
                  <button
                    className={'borough-strip ' + themes[i]}
                    key={b}
                    onClick={() => browse(b)}
                  >
                    <span>{b}</span>
                    <span>
                      {fmt(summary?.groups.find((g) => g.name === b)?.count || 0)}
                      <ArrowUpRight size={18} />
                    </span>
                  </button>
                ))}
                <p>Choose a borough to find its restaurants.</p>
              </div>
            </section>
            <section className="featured">
              <div className="section-head">
                <div>
                  <h2>On your radar</h2>
                  <p>A few places to begin your search.</p>
                </div>
                <Button variant="light" onPress={() => browse()}>
                  Explore the directory
                  <ArrowRight size={18} />
                </Button>
              </div>
              {results ? (
                <div className="record-grid home-grid">
                  {results.records.slice(0, 4).map((r, index) => (
                    <Card key={r.restaurant_id} r={r} index={index} />
                  ))}
                </div>
              ) : (
                <Records />
              )}
            </section>
            <section className="insight-band">
              <ChartNoAxesCombined size={40} />
              <div>
                <h2>There’s a story in the numbers.</h2>
                <p>Compare borough coverage and explore historical inspection scores.</p>
              </div>
              <Button onPress={() => go('insights')}>
                Explore insights
                <ArrowUpRight size={18} />
              </Button>
            </section>
          </>
        ) : route.startsWith('detail/') ? (
          <>
            <Button variant="light" onPress={() => go('restaurants')}>
              <ArrowLeft size={18} />
              Back to restaurants
            </Button>
            {detail ? (
              <>
                <section className="detail-head">
                  <div>
                    <p className="location">
                      <MapPin size={17} />
                      {detail.borough} · {detail.cuisine}
                    </p>
                    <h1>{detail.name}</h1>
                    <p>Restaurant ID {detail.restaurant_id}</p>
                  </div>
                  <span className={'detail-grade ' + themes[names.indexOf(detail.borough)]}>
                    {detail.latest?.grade || '—'}
                    <small>Latest grade</small>
                  </span>
                </section>
                <div className="detail-columns">
                  <section>
                    <h2>About this restaurant</h2>
                    <p>{detail.description}</p>
                  </section>
                  <section className="address-block">
                    <h2>Where to find it</h2>
                    <p>
                      {detail.address.building} {detail.address.street}
                      <br />
                      {detail.borough}, NY {detail.address.zipcode}
                    </p>
                  </section>
                </div>
                <section className="inspection-history">
                  <div className="section-head">
                    <h2>Inspection history</h2>
                    <span>{detail.grades.length} recorded inspections</span>
                  </div>
                  <div className="table-scroll">
                    <table>
                      <thead>
                        <tr>
                          <th>Inspection date</th>
                          <th>Grade</th>
                          <th>Score</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...detail.grades]
                          .sort(
                            (a, b) =>
                              new Date(b.date?.$date ?? b.date) - new Date(a.date?.$date ?? a.date),
                          )
                          .map((g, i) => (
                            <tr key={i}>
                              <td>{date(g.date)}</td>
                              <td>
                                <span className="table-grade">{g.grade}</span>
                              </td>
                              <td>{g.score}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                    {!detail.grades.length && (
                      <p className="empty">No inspections recorded for this restaurant.</p>
                    )}
                  </div>
                </section>
              </>
            ) : (
              <div className="skeleton">
                <div />
                <div />
              </div>
            )}
          </>
        ) : route === 'insights' ? (
          <>
            <div className="page-heading">
              <div>
                <h1>The city, by the numbers.</h1>
                <p>Explore aggregate inspection scores from the recorded history.</p>
              </div>
              <ChartNoAxesCombined size={48} />
            </div>
            <div className="insights-controls">
              <label>
                Minimum total score
                <select value={min} onChange={(e) => setMin(Number(e.target.value))}>
                  {[0, 50, 90, 150, 200].map((n) => (
                    <option value={n} key={n}>
                      Greater than {n}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Results to show
                <select value={limit} onChange={(e) => setLimit(Number(e.target.value))}>
                  {[5, 10, 20].map((n) => (
                    <option key={n}>{n}</option>
                  ))}
                </select>
              </label>
              <p>
                Totals add every recorded inspection score. These are historical inspection records,
                not customer ratings.
              </p>
            </div>
            <div className="section-head">
              <h2>Highest aggregate scores</h2>
              <span>Ordered by total score</span>
            </div>
            <div className="ranked-list">
              {summary?.ranked.map((r, i) => (
                <button key={r.restaurant_id} onClick={() => go('detail/' + r.restaurant_id)}>
                  <span className="rank">{String(i + 1).padStart(2, '0')}</span>
                  <span className="rank-name">
                    <strong>{r.name}</strong>
                    <small>
                      {r.cuisine} · {r.borough} · {r.inspectionCount} inspections
                    </small>
                  </span>
                  <span className="score">
                    {r.totalScore}
                    <small>Total score</small>
                  </span>
                  <ArrowUpRight size={20} />
                </button>
              ))}
              {summary && !summary.ranked.length && (
                <div className="empty">No records exceed this minimum. Choose a lower score.</div>
              )}
            </div>
            <details className="pipeline">
              <summary>How this aggregate is calculated</summary>
              <code>
                $unwind grades → $group by restaurant_id → $sum grades.score → $match totalScore
                &gt; minimum → $sort descending → $limit
              </code>
              <p>
                Atlas mode executes this pipeline in MongoDB. Local mode calculates equivalent
                results from the JSON records.
              </p>
            </details>
          </>
        ) : (
          <>
            <div className="page-heading">
              <div>
                <h1>
                  {route === 'boroughs'
                    ? 'Find your corner of the city.'
                    : route === 'search'
                      ? 'What’s on your radar?'
                      : isAdmin
                        ? 'Your restaurant workspace.'
                        : 'Every borough. Every cuisine.'}
                </h1>
                <p>
                  {isAdmin
                    ? 'Add restaurants, keep details current, and review inspection records.'
                    : route === 'boroughs'
                      ? 'Explore restaurants grouped by New York’s five boroughs.'
                      : 'Browse the collection and discover something new.'}
                </p>
              </div>
              {isAdmin ? (
                <Button
                  className="orange-button"
                  onPress={() => {
                    setError('');
                    setEdit({ new: true });
                  }}
                >
                  <Plus size={18} />
                  Add restaurant
                </Button>
              ) : (
                <Utensils size={44} />
              )}
            </div>
            {isAdmin && (
              <div className="admin-tabs">
                {[
                  ['admin', 'Restaurants'],
                  ['admin/inspections', 'Inspection records'],
                ].map(([r, l]) => (
                  <Button
                    className={route === r ? 'selected' : ''}
                    key={r}
                    variant="light"
                    onPress={() => go(r)}
                  >
                    {l}
                  </Button>
                ))}
                <Button
                  variant="light"
                  onPress={async () => {
                    try {
                      await api('/api/auth/logout', { method: 'POST' });
                      setAuth({ authenticated: false, configured: true });
                      setEdit(null);
                      setDeleting(null);
                      go('home');
                    } catch (e) {
                      setError(e.message);
                    }
                  }}
                >
                  Sign out
                </Button>
                <Button variant="light" onPress={() => go('home')}>
                  Public site
                  <ArrowUpRight size={16} />
                </Button>
              </div>
            )}
            {route === 'boroughs' && (
              <div className="borough-tabs">
                {names.map((b, i) => (
                  <button
                    className={`${themes[i]} ${borough === b ? 'chosen' : ''}`}
                    onClick={() => {
                      setBorough(borough === b ? '' : b);
                      setPage(1);
                    }}
                    key={b}
                  >
                    <MapPin size={18} />
                    <strong>{b}</strong>
                    <span>
                      {fmt(summary?.groups.find((g) => g.name === b)?.count || 0)} restaurants
                    </span>
                  </button>
                ))}
              </div>
            )}
            {route === 'search' && (
              <div className="search-tabs">
                {['name', 'cuisine', 'borough'].map((f) => (
                  <Button
                    key={f}
                    className={field === f ? 'selected' : ''}
                    variant="light"
                    onPress={() => {
                      setField(f);
                      setPage(1);
                    }}
                  >
                    By {f}
                  </Button>
                ))}
              </div>
            )}
            {Filters()}
            <div className="result-heading">
              <h2>
                {borough ||
                  cuisine ||
                  (isAdmin ? 'Restaurant records' : 'The restaurant collection')}
              </h2>
              <div>
                {!isAdmin && (
                  <>
                    <Button
                      isIconOnly
                      aria-label="Card view"
                      variant={view === 'cards' ? 'solid' : 'light'}
                      onPress={() => setView('cards')}
                    >
                      <LayoutGrid size={18} />
                    </Button>
                    <Button
                      isIconOnly
                      aria-label="Table view"
                      variant={view === 'table' ? 'solid' : 'light'}
                      onPress={() => setView('table')}
                    >
                      <List size={19} />
                    </Button>
                  </>
                )}
              </div>
            </div>
            <Records
              table={isAdmin || view === 'table'}
              inspections={route === 'admin/inspections'}
            />
            <Pagination />
          </>
        )}
      </main>
      <footer>
        <a href="#home" className="footer-brand">
          <Radar size={23} />
          restoradar
        </a>
        <p>New York restaurant records. A database project.</p>
        <span>
          Historical inspections · Not customer ratings
          <br />
          <a href="/photo-credits.html" target="_blank" rel="noreferrer">
            Stock photography & credits
          </a>
          <br />
          <a className="admin-entry" href="#admin">
            Admin Login
          </a>
        </span>
      </footer>
      <Modal
        isOpen={!!deleting && !!auth?.authenticated}
        onOpenChange={(open) => {
          if (!open && !busy) setDeleting(null);
        }}
      >
        <ModalContent>
          <ModalHeader>Delete restaurant?</ModalHeader>
          <ModalBody>
            <p>
              Remove <strong>{deleting?.name}</strong> and its inspection history? This cannot be
              undone.
            </p>
            {error && (
              <p role="alert" className="form-error">
                {error}
              </p>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="light" isDisabled={busy} onPress={() => setDeleting(null)}>
              Cancel
            </Button>
            <Button
              color="danger"
              isLoading={busy}
              onPress={async () => {
                if (await mutate('/api/restaurants/' + deleting.restaurant_id, 'DELETE'))
                  setDeleting(null);
              }}
            >
              Delete restaurant
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      <Modal
        isOpen={!!edit && !!auth?.authenticated}
        onOpenChange={(open) => {
          if (!open && !busy) setEdit(null);
        }}
        size="2xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          {edit && (
            <Editor
              record={edit}
              cuisines={summary?.cuisines || []}
              busy={busy}
              error={error}
              cancel={() => setEdit(null)}
              save={async (body) => {
                if (
                  await mutate(
                    '/api/restaurants' + (edit.new ? '' : '/' + edit.restaurant_id),
                    edit.new ? 'POST' : 'PUT',
                    body,
                  )
                )
                  setEdit(null);
              }}
            />
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
createRoot(document.getElementById('root')).render(
  <HeroUIProvider>
    <App />
  </HeroUIProvider>,
);
