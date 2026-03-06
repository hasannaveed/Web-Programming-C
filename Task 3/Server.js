const express = require("express");
const session = require("express-session");
const connectDB = require("./db");
const User = require("./User");
const isAuthenticated = require("./authMiddleware");

const app = express();
const PORT = 3000;

// Connect to MongoDB
connectDB();

// Middleware to parse JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(
  session({
    secret: "my-secret-key",
    resave: false,
    saveUninitialized: false,
  })
);

// ==================== ROUTES ====================

// POST /register - Register a new user
app.post("/register", async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required" });
    }

    // Create User instance and register
    const user = new User(username, password);
    const result = await user.register();

    if (result.success) {
      res.status(201).json({ message: result.message });
    } else {
      res.status(400).json({ message: result.message });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// POST /login - Login user
app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required" });
    }

    // Create User instance and login
    const user = new User(username, password);
    const result = await user.login();

    if (result.success) {
      // Create session
      req.session.user = username;
      res.status(200).json({ message: result.message });
    } else {
      res.status(401).json({ message: result.message });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// GET /dashboard - Protected route (only logged-in users)
app.get("/dashboard", isAuthenticated, (req, res) => {
  res.status(200).json({ message: `Welcome ${req.session.user}` });
});

// GET /logout - Destroy session and logout
app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: "Logout failed" });
    }
    res.status(200).json({ message: "Logout successful" });
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});