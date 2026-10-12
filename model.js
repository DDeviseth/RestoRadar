export const boroughs = ['Manhattan', 'Brooklyn', 'Queens', 'Bronx', 'Staten Island'];
export function normalize(r) {
  const cuisine = r.cuisine.trim().replace(/Caf(?:Ã©|ÃƒÂ©|�)/g, 'Café');
  return { ...r, cuisine, borough: r.borough.trim() };
}
export function description(r) {
  return (
    r.description ??
    `${r.name} is listed as ${r.cuisine} cuisine in ${r.borough}, at ${r.address.building} ${r.address.street}. Explore its recorded inspection history below.`
  );
}
export function decorate(r) {
  const grades = [...(r.grades || [])].sort(
    (a, b) => new Date(b.date?.$date ?? b.date) - new Date(a.date?.$date ?? a.date),
  );
  return { ...r, _id: undefined, description: description(r), latest: grades[0] ?? null };
}
export function filterRecords(
  records,
  { q = '', field = 'name', borough = '', cuisine = '' } = {},
) {
  return records.filter(
    (r) =>
      (!q ||
        String(field === 'all' ? `${r.name} ${r.cuisine} ${r.borough}` : (r[field] ?? ''))
          .toLowerCase()
          .includes(q.toLowerCase())) &&
      (!borough || r.borough === borough) &&
      (!cuisine || r.cuisine === cuisine),
  );
}
export function summarize(records, min = 90, limit = 10) {
  const groups = boroughs.map((name) => ({
    name,
    count: records.filter((r) => r.borough === name).length,
  }));
  const ranked = records
    .map((r) => ({
      ...decorate(r),
      totalScore: (r.grades || []).reduce((sum, g) => sum + (Number(g.score) || 0), 0),
      inspectionCount: r.grades?.length ?? 0,
    }))
    .filter((r) => r.totalScore > min)
    .sort((a, b) => b.totalScore - a.totalScore || a.restaurant_id.localeCompare(b.restaurant_id))
    .slice(0, limit);
  return {
    total: records.length,
    cuisines: [...new Set(records.map((r) => r.cuisine))].sort(),
    groups,
    ranked,
  };
}
export function validateRecord(b) {
  const fields = ['name', 'cuisine', 'borough', 'restaurant_id'];
  for (const f of fields)
    if (typeof b[f] !== 'string' || !b[f].trim() || b[f].length > 200)
      throw Error(`Provide a valid ${f.replace('_', ' ')}.`);
  if (!boroughs.includes(b.borough)) throw Error('Choose a valid borough.');
  if (!/^\d{8}$/.test(b.restaurant_id)) throw Error('Restaurant ID must contain eight digits.');
  if (
    !b.address ||
    ['building', 'street', 'zipcode'].some(
      (f) => typeof b.address[f] !== 'string' || !b.address[f].trim(),
    )
  )
    throw Error('Complete the building, street and ZIP code.');
  if (!/^\d{5}$/.test(b.address.zipcode)) throw Error('ZIP code must contain five digits.');
  if (typeof b.description !== 'string' || b.description.length > 1000)
    throw Error('Description must be at most 1,000 characters.');
  return {
    name: b.name.trim(),
    cuisine: b.cuisine.trim(),
    borough: b.borough,
    restaurant_id: b.restaurant_id,
    address: {
      building: b.address.building.trim(),
      street: b.address.street.trim(),
      zipcode: b.address.zipcode,
      coord: Array.isArray(b.address.coord) ? b.address.coord : [],
    },
    description: b.description.trim(),
  };
}
