const express=require('express');
const app=express();

app.use(express.json());

app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/admin', require('./routes/admin.routes'));
app.use('/api/daily-checks', require('./routes/dailyCheck.routes'));



//end point 
app.get('/', (req, res) => {
    res.json({message: 'Daily Check API is running'});
});

module.exports=app;

