const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 6969;

app.use(cors());
app.use(express.json());
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

let todos = [
    {id: 1, title: "Comprar leche", completed: false},
    {id: 2, title: "Hacer ejercicio", completed: true},
];

app.get("/todo", (req, res) => {
    res.json({ status: 200, message: "Todos los elementos", data: todos });
});

