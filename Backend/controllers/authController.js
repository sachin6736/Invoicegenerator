import User from '../Models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const register = async (req, res) => {
  try {
    let { name, email, password } = req.body;

    // Normalize inputs
    name = name?.trim();
    email = email?.trim().toLowerCase();

    // Required fields validation
    if (!name) {
      return res.status(400).json({ message: "Full name is required", field: "name" });
    }
    if (!email) {
      return res.status(400).json({ message: "Email is required", field: "email" });
    }
    if (!password) {
      return res.status(400).json({ message: "Password is required", field: "password" });
    }

    // Name length
    if (name.length < 2 || name.length > 50) {
      return res.status(400).json({ message: "Name must be between 2 and 50 characters", field: "name" });
    }

    // Email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format", field: "email" });
    }

    // Password rules (same as frontend)
    if (password.length < 12) {
      return res.status(400).json({ message: "Password must be at least 12 characters", field: "password" });
    }
    if (password.length > 128) {
      return res.status(400).json({ message: "Password is too long (max 128 characters)", field: "password" });
    }
    if (!/[A-Z]/.test(password)) {
      return res.status(400).json({ message: "Password must contain at least 1 uppercase letter", field: "password" });
    }
    if (!/[a-z]/.test(password)) {
      return res.status(400).json({ message: "Password must contain at least 1 lowercase letter", field: "password" });
    }
    if (!/[0-9]/.test(password)) {
      return res.status(400).json({ message: "Password must contain at least 1 number", field: "password" });
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return res.status(400).json({ message: "Password must contain at least 1 special character", field: "password" });
    }

    // Check for existing user (case-insensitive email)
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        message: "User already exists",
        field: "email"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      message: "User registered",
      token,
      user: { name, email },
    });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ message: "Server error during registration" });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Basic validation
    if (!email?.trim()) {
      return res.status(400).json({ message: "Email is required", field: "email" });
    }
    if (!password) {
      return res.status(400).json({ message: "Password is required", field: "password" });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) {
      return res.status(400).json({ 
        message: "Invalid credentials",
        field: "general"  // or "email" if you want to show under email
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ 
        message: "Invalid credentials",
        field: "general"  // or "password"
      });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({
      message: "Login successful",
      token,
      user: { name: user.name, email: user.email },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error during login" });
  }
};