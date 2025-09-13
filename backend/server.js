const express = require('express');
const cors = require('cors');
const app = express();

// Allow cross-origin requests from your Angular app
app.use(cors({
  origin: 'http://localhost:4200'
}));

// Parse JSON body requests
app.use(express.json());

// Import routes
const userRoutes = require('./routes/userRoutes');
app.use('/api', userRoutes);

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
