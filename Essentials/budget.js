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
    res.sendFile(path.join(__dirname, 'budget.html')); 
});


app.post('/add-budget', (req, res) => {
    const { budgetType, budgetAmount, actualAmount } = req.body;

    if (!budgetType || !budgetAmount || !actualAmount) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    const remainingAmount = budgetAmount - actualAmount;
    const query = 'INSERT INTO budget (budget_type, budget_amount, actual_amount, remaining_amount) VALUES (?, ?, ?, ?)';
    
    db.query(query, [budgetType, budgetAmount, actualAmount, remainingAmount], (err, result) => {
        if (err) {
            console.error('Error inserting budget:', err);
            return res.status(500).json({ message: 'Database error' });
        }
        res.status(201).json({ message: 'Budget added successfully', budgetId: result.insertId });
    });
});


app.post('/add-category', (req, res) => {
    const { budgetType, categoryName, categoryBudgetAmount, categoryActualAmount } = req.body;

    if (!budgetType || !categoryName || !categoryBudgetAmount || !categoryActualAmount) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    const remainingAmount = categoryBudgetAmount - categoryActualAmount;
    const query = 'INSERT INTO category (budget_type, category_name, budget_amount, actual_amount, remaining_amount) VALUES (?, ?, ?, ?, ?)';

    db.query(query, [budgetType, categoryName, categoryBudgetAmount, categoryActualAmount, remainingAmount], (err, result) => {
        if (err) {
            console.error('Error inserting category:', err);
            return res.status(500).json({ message: 'Database error' });
        }
        res.status(201).json({ message: 'Category added successfully', categoryId: result.insertId });
    });
});


app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
});
