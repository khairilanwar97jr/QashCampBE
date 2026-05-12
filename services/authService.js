// services/authService.js
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const authRepo = require("../repositories/authRepo");

const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

async function login(email, password) {
  const user = await authRepo.getUserByEmail(email);

  if (!user) {
    throw new Error("Invalid email or password");
  }

  if (user.status !== 1) {
    throw new Error("Account is not active");
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error("Invalid email or password");
  }

  const token = jwt.sign(
    { userId: user.id, role: user.role },
    JWT_SECRET,
    { expiresIn: "7d" }
  );

// services/authService.js
return {
  token,
  user: {
    id: user.id,
    email: user.email,
    role: user.role,
    first_name: user.first_name,
    last_name: user.last_name
  }
};

}

// services/authService.js


const registerUser = async ({ email, password, firstName, lastName, role }) => {
  // 1️⃣ Check if email already exists
  const existingUser = await authRepo.findUserByEmail(email);
  if (existingUser) {
    throw new Error('Email already in use');
  }

  // 2️⃣ Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // 3️⃣ Save user to DB
  const user = await authRepo.createUser({
    email,
    hashedPassword,
    firstName,
    lastName,
    role
  });

  return user; // return new user info
};

module.exports = { login,registerUser };


