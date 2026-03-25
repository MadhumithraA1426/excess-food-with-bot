"use strict";
async function test() {
    const loginRes = await fetch("http://localhost:4000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "a@a.com", password: "a" })
    });
    const data = await loginRes.json();
    const token = data.token;
    if (!token)
        throw new Error("No token");
    // Post food
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    const res = await fetch("http://localhost:4000/api/foods", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token },
        body: JSON.stringify({
            title: "Test Food 3",
            contact_info: "123",
            expiry: nextYear.toISOString()
        })
    });
    console.log("POST:", await res.json());
    // Get food
    const foodsRes = await fetch("http://localhost:4000/api/foods");
    const foods = await foodsRes.json();
    console.log("GET foods:", JSON.stringify(foods));
    if (foods.length > 0) {
        const foodId = foods[0].id;
        // Delete food
        const delRes = await fetch("http://localhost:4000/api/foods/" + foodId, {
            method: "DELETE",
            headers: { "Authorization": "Bearer " + token }
        });
        console.log("DELETE:", delRes.status, await delRes.text());
    }
}
test();
