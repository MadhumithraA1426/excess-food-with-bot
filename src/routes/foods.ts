import express from "express";
import { all, run } from "../db";
import { Food } from "../models";
import { auth, AuthRequest } from "../authMiddleware";

const router = express.Router();

// Donor creates food
router.post("/", auth("donor"), async (req: AuthRequest, res) => {
  try {
    const { title, description, quantity, contact_info, expiry } = req.body;
    if (!title || !contact_info || !expiry) {
      return res.status(400).json({ message: "Missing fields" });
    }

    await run(
      `INSERT INTO foods (donor_id, title, description, quantity, contact_info, expiry)
       VALUES (?,?,?,?,?,?)`,
      [req.userId, title, description || "", quantity || "", contact_info, expiry]
    );

    return res.status(201).json({ message: "Food listed" });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Server error" });
  }
});

// Get all non-expired foods (for both users and donors)
router.get("/", async (_req, res) => {
  try {
    const nowIso = new Date().toISOString();
    const foods = await all<Food>(
      `SELECT foods.*, users.name as donor_name
       FROM foods
       JOIN users ON users.id = foods.donor_id
       WHERE datetime(expiry) > datetime(?)
       ORDER BY datetime(expiry) ASC`,
      [nowIso]
    );
    return res.json(foods);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Server error" });
  }
});

// Optional: donor sees own foods
router.get("/mine", auth("donor"), async (req: AuthRequest, res) => {
  try {
    const nowIso = new Date().toISOString();
    const foods = await all<Food>(
      `SELECT * FROM foods
       WHERE donor_id = ? AND datetime(expiry) > datetime(?)
       ORDER BY datetime(expiry) ASC`,
      [req.userId, nowIso]
    );
    return res.json(foods);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Server error" });
  }
});

export default router;
