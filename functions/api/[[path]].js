const BACKEND = 'https://pureforcebackend1-ghs2woj2.b4a.run';
const ROUTES = new Map([
  ['health', 'GET'], ['login', 'POST'], ['register', 'POST'],
  ['generate', 'POST'], ['order', 'POST'], ['orders', 'GET'],
  ['admin/analytics', 'GET']
]);
const json = (status, detail) => new Response(JSON.stringify({ detail }), {
  status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
});
export async function onRequest({ request, params }) {
  const path = Array.isArray(params.path) ? params.path.join('/') : params.path;
  const method = ROUTES.get(path);
  if (!method) return json(404, 'API route not found');
  if (request.method !== method) return json(405, 'Method not allowed');
  const origin = request.headers.get('Origin');
  if (origin && origin !== new URL(request.url).origin) return json(403, 'Origin not allowed');
  const headers = new Headers();
  for (const name of ['Content-Type', 'Authorization']) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  const options = { method, headers, redirect: 'error', signal: AbortSignal.timeout(30000) };
  if (method === 'POST') {
    const body = await request.arrayBuffer();
    if (body.byteLength > 65536) return json(413, 'Request is too large');
    options.body = body;
  }
  try {
    const upstream = await fetch(BACKEND + '/' + path, options);
    return new Response(upstream.body, {
      status: upstream.status,
      headers: {
        'Content-Type': upstream.headers.get('Content-Type') || 'application/json',
        'Cache-Control': 'no-store'
      }
    });
  } catch {
    return json(503, 'The storefront service is temporarily unavailable');
  }
}
