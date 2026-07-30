const express = require('express');
const cors = require('cors');
const pool = require('./config/db');
const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/admin', require('./routes/admin.routes'));
app.use('/api/vehicles', require('./routes/vehicle.routes'));
app.use('/api/daily-checks', require('./routes/dailyCheck.routes'));

app.get('/api/health', async (req, res) => {
    try {
        await pool.query('SELECT 1');
        res.json({
            status: 'ok',
            service: 'dailycheck-api',
            database: 'ok',
        });
    } catch {
        console.error('Health check database query failed');
        res.status(503).json({
            status: 'error',
            service: 'dailycheck-api',
            database: 'unavailable',
        });
    }
});

//end point 
app.get('/', (req, res) => {
    res.json({message: 'Daily Check API is running'});
});

module.exports=app;

