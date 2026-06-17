const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./config/database');
const authRoutes = require('./routes/auth');
const leaveRoutes = require('./routes/leaves');
const aiRoutes = require('./routes/ai');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/ai', aiRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Leave Management System API is running.' });
});

const distPath = path.join(__dirname, '..', 'frontend', 'dist');
if (require('fs').existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
