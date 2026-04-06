// Basic API smoke tests for Tech-A-Muna
(async function(){
  try {
    const BASE = process.env.API_BASE || 'http://localhost:3000';
    console.log('API base:', BASE);

    // GET /api/stores
    const s = await fetch(BASE + '/api/stores');
    if (!s.ok) throw new Error('/api/stores failed: ' + s.status);
    const stores = await s.json();
    console.log('/api/stores ->', Array.isArray(stores) ? `${stores.length} stores` : typeof stores);

    // POST /api/reviews
    const reviewPayload = { storeId: (stores && stores[0] && (stores[0]._id || stores[0].id)) || null, username: 'smoke-test', rating: 5, headline: 'smoke', text: 'smoke test' };
    const p = await fetch(BASE + '/api/reviews', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(reviewPayload) });
    if (p.status !== 201) throw new Error('/api/reviews POST failed: ' + p.status + ' ' + (await p.text()));
    const created = await p.json();
    console.log('/api/reviews POST -> created id', created._id || created.id);

    // GET /api/data
    const d = await fetch(BASE + '/api/data');
    if (!d.ok) throw new Error('/api/data failed: ' + d.status);
    const data = await d.json();
    console.log('/api/data ->', Object.keys(data).join(', '));

    console.log('SMOKE TESTS PASSED');
    process.exit(0);
  } catch (err) {
    console.error('SMOKE TESTS FAILED:', err && err.message ? err.message : err);
    process.exit(2);
  }
})();
