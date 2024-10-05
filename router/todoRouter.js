import { Router } from 'express';
import path from 'path';
import { authenticate } from '../authenticate.js';
import { TodoModel } from '../db.js';
import { fileURLToPath } from 'url';

export const todoRouter = Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

todoRouter.delete('/deletetodo', authenticate, async (req, res) => {
    const { todoId } = req.body;
    if (!todoId) {
        return res.status(400).json({ error: "Todo ID is required" });
    }
    try {
        const deletedTodo = await TodoModel.findByIdAndDelete(todoId);
        if (!deletedTodo) {
            return res.status(404).json({ error: "Todo not found" });
        }
        return res.json({ message: "Todo deleted successfully" });
    } catch (error) {
        return res.status(500).json({ error: "An error occurred while deleting the todo" });
    }
});

todoRouter.put('/updatetodo', authenticate, async (req, res) => {
    const { todoId, checked } = req.body;
    try {
        const todo = await TodoModel.findByIdAndUpdate(todoId, { isCompleted: checked }, { new: true });
        if (!todo) {
            return res.status(404).json({ message: 'Todo not found' });
        }
        return res.json({ message: 'Todo updated successfully', todo });
    } catch (error) {
        return res.status(500).json({ message: 'Error updating todo', error });
    }
});

todoRouter.put('/edittodo', authenticate, async (req, res) => {
    try {
        const { title, todoId } = req.body;
        if (!todoId || !title) {
            return res.status(400).json({ message: 'Todo ID and title are required' });
        }
        const updatedTodo = await TodoModel.findByIdAndUpdate(todoId, { title }, { new: true });
        if (updatedTodo) {
            return res.json({ message: 'Todo updated successfully', updatedTodo });
        } else {
            return res.status(404).json({ message: 'Todo not found' });
        }
    } catch (e) {
        return res.status(500).json({ message: 'Error updating todo', error: e });
    }
});

todoRouter.get('/gettodos', authenticate, async (req, res) => {
    const user = req.user;
    const userId = user.id;
    const data = await TodoModel.find({ userId });
    return res.json({
        message: "Fetched Todos",
        todos: data
    });
});

todoRouter.post('/addtodo', authenticate, async (req, res) => {
    try {
        const user = req.user;
        const userId = user.id;
        const { title } = req.body;
        if (!title) {
            return res.status(400).json({ error: "Title is required" });
        }
        const response = await TodoModel.create({
            title,
            userId
        });
        return res.status(201).json({
            message: `${title} added successfully`,
            response
        });
    } catch (e) {
        return res.status(500).json({ error: "An error occurred while adding the todo" });
    }
});

todoRouter.get('/todo', authenticate, (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'index.html'));
});
