const supabase = require("../config/supabase");

// --------------------
// GET USER BY EMAIL
// --------------------
async function getUserByEmail(email) {
  const { data, error } = await supabase
    .from("app_user")
    .select("*")
    .eq("email", email)
    .single();

  // no rows found is not fatal
  if (error && error.code !== "PGRST116") {
    throw error;
  }

  return data;
}

// --------------------
// FIND USER BY EMAIL
// --------------------
async function findUserByEmail(email) {
  const { data, error } = await supabase
    .from("app_user")
    .select("*")
    .eq("email", email)
    .single();

  if (error && error.code !== "PGRST116") {
    throw error;
  }

  return data;
}

// --------------------
// CREATE USER
// --------------------
async function createUser({
  email,
  hashedPassword,
  firstName,
  lastName,
  role,
}) {
  const { data, error } = await supabase
    .from("app_user")
    .insert([
      {
        email,
        password: hashedPassword,
        first_name: firstName,
        last_name: lastName,
        role: role || "USER",
      },
    ])
    .select(`
      id,
      email,
      first_name,
      last_name,
      role,
      created_at
    `)
    .single();

  if (error) throw error;

  return data;
}

module.exports = {
  getUserByEmail,
  findUserByEmail,
  createUser,
};