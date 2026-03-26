const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 6969;

app.use(cors());
app.use(express.json());

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

module.exports = app;

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

app.post("/todo", (req, res) => {
    if(!req.body) {
        return res.status(400).json({ status: 400, message: "Request body is required" });
    }
    
    try {
        const { title } = req.body;
        if (!title || title.trim() === "") {
            throw new Error("Title is required");
        }
        const newTodo = {
            id: todos.length > 0 ? todos[todos.length - 1].id + 1 : 1,
            title: title.trim(),
            completed: false,
        };
        todos.push(newTodo);
        return res.status(201).json({ status: 201, message: "Todo created", data: newTodo });
    } catch (error) {
        return res.status(400).json({ status: 400, message: error.message });
    }
});

app.patch("/todo/:id", (req, res) => {
    const id = parseInt(req.params.id);
    const todo = todos.find(t => t.id === id);
    if (!todo) {
        return res.status(404).json({ status: 404, message: "Todo not found" });
    }
    const { title, completed } = req.body;

    if (title !== undefined && title.trim() === "") {
        return res.status(400).json({ status: 400, message: "Title is required" });
    }

    if (title !== undefined) {
        todo.title = title.trim();
    }

    if (completed !== undefined) {
        todo.completed = Boolean(completed);
    }

    res.json({ status: 200, message: "Todo updated", data: todo });
});

app.delete("/todo/:id", (req, res) => {
    const id = parseInt(req.params.id);
    const index = todos.findIndex(t => t.id === id);
    if (index === -1) {
        return res.status(404).json({ status: 404, message: "Todo not found" });
    }
    const deleted = todos.splice(index, 1)[0];
    res.json({ status: 200, message: "Todo deleted", data: deleted });
});
