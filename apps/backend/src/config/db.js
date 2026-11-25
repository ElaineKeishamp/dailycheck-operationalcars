const {Pool} = require ('pg');
const { DATABASE_TIME_ZONE, databaseTypes } = require('./databaseTime');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    options: `-c timezone=${DATABASE_TIME_ZONE}`,
    types: databaseTypes,
});

pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
});
module.exports = pool;
