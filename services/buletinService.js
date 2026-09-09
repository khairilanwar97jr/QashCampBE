const repo = require('../repositories/buletinRepo');

async function getPublishedBuletin(query = {}) {
  // Keep the homepage slider small; never fetch all rows and slice in the UI.
  const limit = query.limit === undefined ? '5' : query.limit;
  if (typeof limit !== 'string' || !/^(?:[1-9]|10)$/.test(limit)) {
    throw Object.assign(new Error('Limit must be an integer between 1 and 10'), { status: 400 });
  }
  const rows = await repo.getPublishedBuletin(Number(limit));
  return rows.map(row => ({
    id: String(row.id),
    topic: row.topic,
    content: row.content,
    date: row.date,
    image_url: row.image_url,
    image_url_2: row.image_url_2 ?? null,
  }));
}

module.exports = { getPublishedBuletin };
