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

app.get("/todo/:id", (req, res) => {
    const id = parseInt(req.params.id);
    const todo = todos.find(t => t.id === id);
    if (!todo) {
        return res.status(404).json({ status: 404, message: "Todo not found" });
    }
    res.json({ status: 200, message: "Todo found", data: todo });
});

