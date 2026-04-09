const express = require('express');
const cors = require('cors');
const { publicRouter, privateRouter } = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const reimbursementRoutes = require('./routes/reimbursement');
const taxRoutes = require('./routes/tax');
const reportsRoutes = require('./routes/reports');
const logsRoutes = require('./routes/logs');

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

// JWT auth: POST /register, POST /login (and /api/* for proxied clients)
app.use('/', publicRouter);
app.use('/api', publicRouter);

app.use('/api/auth', privateRouter);

app.use('/api/dashboard', dashboardRoutes);

app.use('/', taxRoutes);
app.use('/api', taxRoutes);

app.use('/', reportsRoutes);
app.use('/api', reportsRoutes);

app.use('/', logsRoutes);
app.use('/api', logsRoutes);

app.use('/', reimbursementRoutes);
app.use('/api', reimbursementRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

module.exports = app;
