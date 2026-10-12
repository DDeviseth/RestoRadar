export async function api(url, options) {
  const res = await fetch(url, options);
  if (!res.headers.get('content-type')?.includes('application/json'))
    throw Error(
      'The restaurant API is unavailable. Deploy the complete project, including its api and data folders.',
    );
  const data = await res.json();
  if (!res.ok) {
    const error = Error(data.error || 'Unable to load records.');
    error.status = res.status;
    throw error;
  }
  return data;
}
