const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.send('Hello, World!');
});

if (require.main === module) {
  const PORT = 3001; // Fixed to port 3001
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

module.exports = app;
