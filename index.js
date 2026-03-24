const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 6969;

app.use(cors());
app.use(express.json());
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

app.get("/", (req, res) => {
    console.log("Hello World");
    res.json({ status: 200, message: "Uste no mete cabra sarabambiche" });
});