"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
async function runTest() {
    const uniq = Date.now();
    // Register
    const regRes = await fetch("http://localhost:4000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Int", email: `i${uniq}@t.c`, password: "pass", role: "donor" })
    });
    console.log("Reg:", await regRes.text());
    // Login
    const loginRes = await fetch("http://localhost:4000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: `i${uniq}@t.c`, password: "pass" })
    });
    const { token, role } = await loginRes.json();
    console.log("Log ok:", !!token, role);
    // Post Food
    const postRes = await fetch("http://localhost:4000/api/foods", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token },
        body: JSON.stringify({ title: "Itest", contact_info: "1", expiry: "2050-01-01T00:00:00Z" })
    });
    console.log("Post:", await postRes.text());
    // Get Foods
    const getsRes = await fetch("http://localhost:4000/api/foods");
    const foods = await getsRes.json();
    console.log("Foods count:", foods.length);
    const myFood = foods.find((f) => f.title === "Itest");
    if (!myFood)
        return;
    // Delete
    const delRes = await fetch("http://localhost:4000/api/foods/" + myFood.id, {
        method: "DELETE",
        headers: { "Authorization": "Bearer " + token }
    });
    console.log("Del:", delRes.status, await delRes.text());
}
runTest().catch(console.error);
