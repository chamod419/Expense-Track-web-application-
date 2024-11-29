const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path'); 

const app = express();
const port = 3000;


app.use(cors());

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root', 
    password: '', 
    database: 'track_my_cash'
});


db.connect(err => {
    if (err) {
        console.error('Could not connect to MySQL:', err);
        process.exit(1);
    }
    console.log('Connected to MySQL');
});


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname)); 

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'category.html')); 
});


app.get('/api/categories', async (req, res) => {
    try {
        const [categories] = await db.promise().query('SELECT * FROM `categories`');
        res.json(categories);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching categories', error });
    }
});

app.post('/api/categories', async (req, res) => {
    const { name, type } = req.body;
    try {
        const [result] = await db.promise().query(
            'INSERT INTO `categories` (`name`, `type`, `created_at`, `updated_at`) VALUES (?, ?, NOW(), NOW())',
            [name, type]
        );
        res.json({ message: 'Category added successfully', id: result.insertId });
    } catch (error) {
        res.status(500).json({ message: 'Error adding category', error });
    }
});


app.put('/api/categories/:id', async (req, res) => {
    const { id } = req.params;
    const { name } = req.body;
    try {
        await db.promise().query(
            'UPDATE `categories` SET `name` = ?, `updated_at` = NOW() WHERE `id` = ?',
            [name, id]
        );
        res.json({ message: 'Category updated successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error updating category', error });
    }
});

app.delete('/api/categories/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await db.promise().query('DELETE FROM `categories` WHERE `id` = ?', [id]);
        res.json({ message: 'Category deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting category', error });
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
