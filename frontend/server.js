const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Serve all static files (index.html, style.css, script.js, sw.js, manifest.json)
app.use(express.static(__dirname));

// Fallback to index.html for any route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => console.log(`StudyMate Frontend running on port ${PORT}`));
