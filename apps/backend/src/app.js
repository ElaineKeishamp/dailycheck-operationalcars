const express=require('express');
const cors=require('cors');
const app=express();

// Allow requests from the Vite frontend dev server
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:4173'],
    credentials: true,
}));

app.use(express.json());

app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/admin', require('./routes/admin.routes'));
app.use('/api/daily-checks', require('./routes/dailyCheck.routes'));



//end point 
app.get('/', (req, res) => {
    res.json({message: 'Daily Check API is running'});
});

module.exports=app;

