/**
 * COLLEGRANCE Campaign Registrations List API
 * GET /api/registrations?campaign=line-exclusive-2025
 *
 * Headers: { x-admin-secret: <ADMIN_SECRET env var> }
 * Returns: JSON list of all registrations for the campaign
 */

const { getStore } = require('@netlify/blobs');

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  };

  // Admin auth
  const secret = process.env.ADMIN_SECRET;
  if (secret && event.headers['x-admin-secret'] !== secret) {
    return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) };
  }

  const campaign = event.queryStringParameters?.campaign || 'line-exclusive-2025';

  try {
    const store = getStore({ name: 'campaign-notifications', consistency: 'strong' });
    const { blobs } = await store.list({ prefix: `${campaign}:` });

    const records = [];
    for (const blob of blobs) {
      const record = await store.get(blob.key, { type: 'json' });
      if (record) {
        records.push({
          key: blob.key,
          type: record.type,
          // Mask value for privacy: show only first/last chars
          valueMasked: record.type === 'email'
            ? record.value.replace(/(.{2}).*(@.*)/, '$1***$2')
            : record.value.slice(0, 4) + '****',
          campaign: record.campaign,
          registeredAt: record.registeredAt,
          notified: record.notified || false,
          notifiedAt: record.notifiedAt || null,
        });
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ ok: true, count: records.length, records }),
    };
  } catch (err) {
    console.error('Registrations error:', err);
    // Dev fallback
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ ok: true, count: 0, records: [], note: 'Dev environment - no store available' }),
    };
  }
};
