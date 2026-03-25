"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("./src/db");
const authMiddleware_1 = require("./src/authMiddleware");
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const auth_1 = __importDefault(require("./src/routes/auth"));
const foods_1 = __importDefault(require("./src/routes/foods"));
const cors_1 = __importDefault(require("cors"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use("/api/auth", auth_1.default);
app.use("/api/foods", foods_1.default);
const server = http_1.default.createServer(app);
async function test() {
    server.listen(4005, async () => {
        try {
            // 1. Create a user
            await (0, db_1.run)("INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)", ["Test Donor", "donor@t.c", "hash", "donor"]);
            const donor = await (0, db_1.get)("SELECT * FROM users WHERE email = ?", ["donor@t.c"]);
            const token = (0, authMiddleware_1.signToken)(donor.id, donor.role);
            // 2. Insert a food
            const nextYear = new Date();
            nextYear.setFullYear(nextYear.getFullYear() + 1);
            const res = await fetch("http://localhost:4005/api/foods", {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token },
                body: JSON.stringify({
                    title: "Test Food",
                    description: "Desc",
                    quantity: "1",
                    contact_info: "123",
                    expiry: nextYear.toISOString()
                })
            });
            console.log("POST /foods resp:", await res.json());
            // 3. Get foods
            const getRes = await fetch("http://localhost:4005/api/foods");
            const foods = await getRes.json();
            console.log("GET /foods resp:", JSON.stringify(foods));
            const foodId = foods[0].id;
            // 4. Try to delete the food
            const delRes = await fetch("http://localhost:4005/api/foods/" + foodId, {
                method: "DELETE",
                headers: { "Authorization": "Bearer " + token }
            });
            console.log("DELETE /foods/:id resp:", delRes.status, await delRes.text());
            process.exit(0);
        }
        catch (e) {
            console.error(e);
            process.exit(1);
        }
    });
}
test();
