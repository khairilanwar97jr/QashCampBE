const supabase = require('../config/supabase');

async function getPublishedBuletin(limit) {
  const { data, error } = await supabase.from('buletin')
    .select('id, topic, content, date, image_url, image_url_2')
    .eq('is_published', true)
    .order('date', { ascending: false })
    .order('id', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
}

module.exports = { getPublishedBuletin };
