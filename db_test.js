"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("./src/db");
async function test() {
    try {
        // 1. Insert donor
        await (0, db_1.run)("INSERT INTO users (name, email, password_hash, role) VALUES ('a', 'a@a.com', 'a', 'donor')");
        const donor = await (0, db_1.get)("SELECT * FROM users WHERE email = 'a@a.com'");
        // 2. Insert food
        const nextYear = new Date();
        nextYear.setFullYear(nextYear.getFullYear() + 1);
        await (0, db_1.run)("INSERT INTO foods (donor_id, title, description, quantity, contact_info, expiry) VALUES (?, ?, ?, ?, ?, ?)", [donor.id, "Test", "Test", "1", "123", nextYear.toISOString()]);
        // 3. Get food
        const foods = await (0, db_1.all)("SELECT foods.*, users.name as donor_name FROM foods JOIN users ON users.id = foods.donor_id");
        console.log("Foods:", foods);
        if (foods.length > 0) {
            const foodId = foods[0].id;
            // 4. Delete food
            await (0, db_1.run)("DELETE FROM foods WHERE id = ?", [foodId]);
            console.log(`Deleted food ${foodId}`);
        }
        // 5. Get food again
        const foodsAfter = await (0, db_1.all)("SELECT * FROM foods");
        console.log("Foods after:", foodsAfter);
    }
    catch (e) {
        console.error(e);
    }
}
test();
