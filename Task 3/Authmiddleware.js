// Authentication middleware to protect routes
const isAuthenticated = (req, res, next) => {
  if (req.session.user) {
    next(); // User is logged in, proceed to route
  } else {
    res.status(401).json({ message: "Please login first" });
  }
};

module.exports = isAuthenticated;