const supabase = require("../config/supabase");

// --------------------
// PUBLIC (approved only)
// --------------------
const getAllApproved = async () => {
  const { data, error } = await supabase
    .from("moments")
    .select(`
      pkid,
      caption,
      image_url,
      user_id,
      submit_date,
      approved,
      app_user (
        first_name,
        last_name
      )
    `)
    .eq("approved", true)
    .order("submit_date", { ascending: false });

  if (error) throw error;
  return data;
};

// --------------------
// ADMIN (all)
// --------------------
const getAll = async () => {
  const { data, error } = await supabase
    .from("moments")
    .select(`
      pkid,
      caption,
      image_url,
      user_id,
      submit_date,
      approved,
      app_user (
        first_name,
        last_name
      )
    `)
    .order("submit_date", { ascending: false });

  if (error) throw error;
  return data;
};

// --------------------
// CREATE
// --------------------
const create = async ({ caption, imageUrl, userId }) => {
  const { data, error } = await supabase
    .from("moments")
    .insert([
      {
        caption,
        image_url: imageUrl,
        user_id: userId,
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
};

// --------------------
// APPROVE
// --------------------
const approve = async (id) => {
  const { data, error } = await supabase
    .from("moments")
    .update({ approved: true })
    .eq("pkid", id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// --------------------
// REJECT
// --------------------
const reject = async (id) => {
  const { data, error } = await supabase
    .from("moments")
    .update({ approved: false })
    .eq("pkid", id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

module.exports = {
  getAllApproved,
  getAll,
  create,
  approve,
  reject,
};