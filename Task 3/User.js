const UserModel = require("./UserModel");

class User {
  constructor(username, password) {
    this.username = username;
    this.password = password;
  }

  // Register a new user in MongoDB
  async register() {
    // Check if user already exists
    const existingUser = await UserModel.findOne({ username: this.username });
    if (existingUser) {
      return { success: false, message: "Username already exists" };
    }

    // Create and save new user
    const newUser = new UserModel({
      username: this.username,
      password: this.password,
    });
    await newUser.save();

    return { success: true, message: "User registered successfully" };
  }

  // Login user by checking credentials from MongoDB
  async login() {
    const user = await UserModel.findOne({
      username: this.username,
      password: this.password,
    });

    if (user) {
      return { success: true, message: "Login successful" };
    } else {
      return { success: false, message: "Invalid username or password" };
    }
  }
}

module.exports = User;