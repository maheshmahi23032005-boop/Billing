require('dotenv').config();
const { initDb } = require('./db/init');
const app = require('./app');

const PORT = process.env.PORT || 5000;

if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET is required. Copy server/.env.example to server/.env and set it.');
  process.exit(1);
}

initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server listening on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
