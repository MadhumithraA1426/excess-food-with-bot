import express from "express";
import bcrypt from "bcrypt";
import { get, run } from "../db";
import { User } from "../models";
import { signToken } from "../authMiddleware";

const router = express.Router();

// POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !["donor", "user"].includes(role)) {
      return res.status(400).json({ message: "Invalid input" });
    }

    const existing = await get<User>("SELECT * FROM users WHERE email = ?", [email]);
    if (existing) {
      return res.status(400).json({ message: "Email already used" });
    }

    const hash = await bcrypt.hash(password, 10);
    await run(
      "INSERT INTO users (name, email, password_hash, role) VALUES (?,?,?,?)",
      [name, email, hash, role]
    );

    return res.status(201).json({ message: "Registered successfully" });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Server error" });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await get<User>("SELECT * FROM users WHERE email = ?", [email]);
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(400).json({ message: "Invalid credentials" });

    const token = signToken(user.id, user.role as "donor" | "user");
    return res.json({ token, role: user.role, name: user.name });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Server error" });
  }
});

export default router;
