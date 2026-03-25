import express from "express";
import { all, get, run } from "../db";
import { Food } from "../models";
import { auth, AuthRequest } from "../authMiddleware";

const router = express.Router();

function parseLeadingNumber(input?: string): number {
  const text = input ?? "";
  const match = text.match(/[-+]?\d*\.?\d+/);
  if (!match) return 0;
  const n = Number(match[0]);
  return Number.isFinite(n) ? n : 0;
}

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

// Donations totals (global)
router.get("/stats", async (_req, res) => {
  try {
    const totals = await get<{
      donatedCount: number;
      donatedQuantityTotal: number;
    }>(
      `SELECT
         COUNT(*) as donatedCount,
         COALESCE(SUM(quantity_value), 0) as donatedQuantityTotal
       FROM donations`
    );

    res.json({
      donatedCount: totals?.donatedCount ?? 0,
      donatedQuantityTotal: totals?.donatedQuantityTotal ?? 0,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  }
});

// Donations totals (for a donor)
router.get("/mine/stats", auth("donor"), async (req: AuthRequest, res) => {
  try {
    const totals = await get<{
      donatedCount: number;
      donatedQuantityTotal: number;
    }>(
      `SELECT
         COUNT(*) as donatedCount,
         COALESCE(SUM(quantity_value), 0) as donatedQuantityTotal
       FROM donations
       WHERE donor_id = ?`,
      [req.userId]
    );

    res.json({
      donatedCount: totals?.donatedCount ?? 0,
      donatedQuantityTotal: totals?.donatedQuantityTotal ?? 0,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
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

// Donor marks a food as donated; it is removed from active listings.
router.post("/:id/donated", auth("donor"), async (req: AuthRequest, res) => {
  try {
    const foodId = Number(req.params.id);
    if (!foodId) return res.status(400).json({ message: "Invalid ID" });

    const food = await get<Food>(
      `SELECT * FROM foods WHERE id = ? AND donor_id = ?`,
      [foodId, req.userId]
    );

    if (!food) return res.status(404).json({ message: "Food not found" });

    const quantityText = food.quantity || "";
    const quantityValue = parseLeadingNumber(quantityText);

    await run("BEGIN");
    await run(
      `INSERT INTO donations (donor_id, food_id, quantity_text, quantity_value)
       VALUES (?,?,?,?)`,
      [req.userId, foodId, quantityText, quantityValue]
    );
    await run("DELETE FROM foods WHERE id = ? AND donor_id = ?", [
      foodId,
      req.userId,
    ]);
    await run("COMMIT");

    res.json({ message: "Food marked as donated!" });
  } catch (e) {
    console.error(e);
    try {
      await run("ROLLBACK");
    } catch {
      // ignore rollback errors
    }
    res.status(500).json({ message: "Server error" });
  }
});

// Donor deletes their own food
router.delete("/:id", auth("donor"), async (req: AuthRequest, res) => {
  try {
    const foodId = Number(req.params.id);
    if (!foodId) return res.status(400).json({ message: "Invalid ID" });

    await run("DELETE FROM foods WHERE id = ? AND donor_id = ?", [foodId, req.userId]);

    return res.json({ message: "Food deleted successfully!" });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Server error" });
  }
});

export default router;
