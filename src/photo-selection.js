import photos from './photos.json' with { type: 'json' };
const groupsFor = (c) =>
  /bakery|coffee|café|cafe/i.test(c)
    ? ['bakery']
    : /pizza|italian/i.test(c)
      ? ['italian']
      : /japanese/i.test(c)
        ? ['japanese']
        : /chinese/i.test(c)
          ? ['noodles', 'dumplings']
          : /thai|asian|noodle/i.test(c)
            ? ['noodles', 'dumplings']
            : /mexican|tex-mex/i.test(c)
              ? ['mexican']
              : /indian|pakistani|bangladeshi/i.test(c)
                ? ['indian']
                : /ice cream|dessert/i.test(c)
                  ? ['dessert']
                  : /vegetarian|salad/i.test(c)
                    ? ['salad']
                    : /seafood/i.test(c)
                      ? ['seafood']
                      : /steak/i.test(c)
                        ? ['steak']
                        : /sandwich|deli/i.test(c)
                          ? ['sandwich', 'salad', 'bakery']
                          : /hamburger/i.test(c)
                            ? ['burger']
                            : /american/i.test(c)
                              ? ['burger', 'sandwich', 'steak', 'salad']
                              : null;
export function assignPhotos(records) {
  const assigned = new Map(),
    used = new Map();
  for (const r of records) {
    const groups = groupsFor(r.cuisine),
      pool = photos.filter((p) => (groups ? groups.includes(p.group) : p.group !== 'city'));
    const hash = Array.from(String(r.restaurant_id)).reduce(
      (h, c) => (h * 31 + c.charCodeAt(0)) >>> 0,
      0,
    );
    const rotated = pool.map((_, i) => pool[(i + hash) % pool.length]);
    const photo = rotated.reduce((best, p) =>
      (used.get(p.file) || 0) < (used.get(best.file) || 0) ? p : best,
    );
    used.set(photo.file, (used.get(photo.file) || 0) + 1);
    assigned.set(r.restaurant_id, { ...photo, generic: !groups });
  }
  return assigned;
}
