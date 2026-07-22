const pool = require('./src/config/db');

async function testConnection() {
    try {
        const result = await pool.query ('SELECT NOW()');
        console.log("Database connection successful:");
        console.log("Database connection string:", result.rows[0].now);
    } catch (err) {
        console.error("Error connecting to the database:", err.message);
    } finally {
        await pool.end();
    }
}

testConnection();