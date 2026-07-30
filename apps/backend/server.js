const app = require('./src/app');
const { initCleanupScheduler } = require('./src/services/cleanup.service');
require('dotenv').config();

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    initCleanupScheduler();
});


