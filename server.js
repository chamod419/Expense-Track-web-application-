const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path'); 
const app = express();
const port = 3000;
const moment = require('moment'); 
const multer = require('multer');


app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());


app.use(express.static(__dirname)); 


const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '', 
    database: 'track_my_cash' 
});



app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});


app.post('/register', (req, res) => {
    const { username, email, password } = req.body;
    const sql = 'INSERT INTO users (username, email, password) VALUES (?, ?, ?)';
    db.query(sql, [username, email, password], (err, result) => {
        if (err) {
            return res.redirect('/register.html?message=Error registering user');
        }
        res.redirect('/login.html?message=Registration successful, please login');
    });
});


app.post('/login', (req, res) => {
    const { email, password } = req.body;
    const sql = 'SELECT * FROM users WHERE email = ? AND password = ?';
    db.query(sql, [email, password], (err, results) => {
        if (err) {
            return res.redirect('/login.html?message=Error logging in');
        }
        if (results.length > 0) {
            res.redirect('/dashboard.html'); // Redirect to a dashboard page
        } else {
            res.redirect('/login.html?message=Invalid email or password');
        }
    });
});




const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './'); 
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });


db.connect(err => {
    if (err) throw err;
    console.log('Connected to MySQL');
});




app.post('/add-receipt', upload.single('image'), (req, res) => {
    const { name, price, date } = req.body;
    const imagePath = req.file ? req.file.path : null;

    db.query('INSERT INTO receipts (name, price, date, image) VALUES (?, ?, ?, ?)', 
        [name, price, date, imagePath], (err) => {
            if (err) {
                console.error('Error adding receipt:', err);
                return res.status(500).json({ message: 'Error adding receipt' });
            }
            res.status(200).json({ message: 'Receipt added successfully' });
        });
});

app.get('/receipts', (req, res) => {
    db.query('SELECT * FROM receipts', (err, results) => {
        if (err) {
            console.error('Error fetching receipts:', err);
            return res.status(500).json({ message: 'Error fetching receipts' });
        }
        
       
        const formattedResults = results.map(receipt => ({
            ...receipt,
            date: moment(receipt.date).format('Do MMMM YYYY') 
        }));

        res.json(formattedResults); 
    });
});

app.get('/receipts/:id', (req, res) => {
    const id = req.params.id;
    db.query('SELECT * FROM receipts WHERE id = ?', [id], (err, results) => {
        if (err) {
            console.error('Error fetching receipt:', err);
            return res.status(500).json({ message: 'Error fetching receipt' });
        }
        if (results.length === 0) {
            return res.status(404).json({ message: 'Receipt not found' });
        }
        res.json(results[0]); 
    });
});

app.put('/receipts/:id', upload.single('image'), (req, res) => {
    const id = req.params.id;
    const { name, price, date } = req.body;
    const imagePath = req.file ? req.file.path : null;

    db.query('UPDATE receipts SET name = ?, price = ?, date = ?, image = ? WHERE id = ?', 
        [name, price, date, imagePath, id], (err) => {
            if (err) {
                console.error('Error updating receipt:', err);
                return res.status(500).json({ message: 'Error updating receipt' });
            }
            res.status(200).json({ message: 'Receipt updated successfully' });
        });
});

app.delete('/receipts/:id', (req, res) => {
    const id = req.params.id;
    db.query('DELETE FROM receipts WHERE id = ?', [id], (err) => {
        if (err) {
            console.error('Error deleting receipt:', err);
            return res.status(500).json({ message: 'Error deleting receipt' });
        }
        res.status(200).json({ message: 'Receipt deleted successfully' });
    });
});





app.get('/goals', (req, res) => {
    db.query('SELECT id, goal_name, target_amount, saved_amount, (saved_amount / target_amount) * 100 AS percentage FROM goals', (err, results) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Error fetching goals' });
        }
        res.json(results);
    });
});


app.post('/add-goal', (req, res) => {
    const { goal_name, target_amount } = req.body;
    db.query('INSERT INTO goals (goal_name, target_amount, saved_amount) VALUES (?, ?, ?)', [goal_name, target_amount, 0], (err, results) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Error adding goal' });
        }
        res.json({ success: true });
    });
});

app.post('/update-goal', (req, res) => {
    const { id, saved_amount } = req.body;

   
    db.query('SELECT saved_amount FROM goals WHERE id = ?', [id], (err, results) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Error fetching current saved amount' });
        }

        const currentSavedAmount = results[0].saved_amount;
        const updatedSavedAmount = parseFloat(currentSavedAmount) + parseFloat(saved_amount);

        db.query('UPDATE goals SET saved_amount = ? WHERE id = ?', [updatedSavedAmount, id], (err, results) => {
            if (err) {
                return res.status(500).json({ success: false, message: 'Error updating goal' });
            }
            res.json({ success: true });
        });
    });
});



app.delete('/delete-goal/:id', (req, res) => {
    const goalId = req.params.id;
    db.query('DELETE FROM goals WHERE id = ?', [goalId], (err, results) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Error deleting goal' });
        }
        res.json({ success: true });
    });
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




app.post('/add-transaction', (req, res) => {
    const { name, date, amount, description, type } = req.body;

    if (!name || !date || !amount || !description || !type) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    const query = 'INSERT INTO transactions (name, date, price, description, type) VALUES (?, ?, ?, ?, ?)';
    db.query(query, [name, date, amount, description, type], (err, result) => {
        if (err) {
            console.error('Error inserting transaction:', err);
            return res.status(500).json({ message: 'Database error' });
        }
        res.status(201).json({ message: 'Transaction added successfully', id: result.insertId });
    });
});


app.get('/get-transactions', (req, res) => {
    const query = 'SELECT * FROM transactions';
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching transactions:', err);
            return res.status(500).json({ message: 'Database error' });
        }
        res.json(results);
    });
});



app.get('/get-report-data', (req, res) => {
    const queryIncome = 'SELECT SUM(price) AS total_income FROM transactions WHERE type = "Income"';
    const queryExpense = 'SELECT SUM(price) AS total_expense FROM transactions WHERE type = "Expense"';
    
    db.query(queryIncome, (err, incomeResult) => {
        if (err) {
            console.error('Error fetching income:', err);
            return res.status(500).json({ message: 'Database error' });
        }

        db.query(queryExpense, (err, expenseResult) => {
            if (err) {
                console.error('Error fetching expenses:', err);
                return res.status(500).json({ message: 'Database error' });
            }

            const totalIncome = incomeResult[0].total_income || 0;
            const totalExpense = expenseResult[0].total_expense || 0;
            const budgetLeft = totalIncome - totalExpense;

            res.json({
                totalIncome: totalIncome,
                totalExpense: totalExpense,
                budgetLeft: budgetLeft
            });
        });
    });
});



app.get('/income-vs-expenses', (req, res) => {
    const query = `SELECT MONTH(date) as month, 
                          SUM(CASE WHEN type = 'income' THEN price ELSE 0 END) AS income,
                          SUM(CASE WHEN type = 'expense' THEN price ELSE 0 END) AS expense
                   FROM transactions
                   GROUP BY MONTH(date)`;

    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching income vs expenses:', err);
            return res.status(500).json({ message: 'Database error' });
        }
        res.json(results);
    });
});


app.get('/expense-categories', (req, res) => {
    const query = `SELECT description AS category, SUM(price) AS total
                   FROM transactions
                   WHERE type = 'expense'
                   GROUP BY description`;

    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching expense categories:', err);
            return res.status(500).json({ message: 'Database error' });
        }
        res.json(results);
    });
});




app.get('/get-report-data', (req, res) => {
    const queryIncome = 'SELECT SUM(price) AS total_income FROM transactions WHERE type = "Income"';
    const queryExpense = 'SELECT SUM(price) AS total_expense FROM transactions WHERE type = "Expense"';

    db.query(queryIncome, (err, incomeResult) => {
        if (err) {
            console.error('Error fetching income:', err);
            return res.status(500).json({ message: 'Database error' });
        }

        db.query(queryExpense, (err, expenseResult) => {
            if (err) {
                console.error('Error fetching expenses:', err);
                return res.status(500).json({ message: 'Database error' });
            }

            const totalIncome = incomeResult[0].total_income || 0;
            const totalExpense = expenseResult[0].total_expense || 0;
            const budgetLeft = totalIncome - totalExpense;

            res.json({
                totalIncome: totalIncome,
                totalExpense: totalExpense,
                budgetLeft: budgetLeft
            });
        });
    });
});


app.get('/income-vs-expenses', (req, res) => {
    const query = `SELECT MONTH(date) as month, 
                          SUM(CASE WHEN type = 'Income' THEN price ELSE 0 END) AS income,
                          SUM(CASE WHEN type = 'Expense' THEN price ELSE 0 END) AS expense
                   FROM transactions
                   GROUP BY MONTH(date)`;

    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching income vs expenses:', err);
            return res.status(500).json({ message: 'Database error' });
        }
        res.json(results);
    });
});


app.get('/expense-categories', (req, res) => {
    const query = `SELECT description AS category, SUM(price) AS total
                   FROM transactions
                   WHERE type = 'Expense'
                   GROUP BY description`;

    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching expense categories:', err);
            return res.status(500).json({ message: 'Database error' });
        }
        res.json(results);
    });
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


app.use((req, res) => {
    res.status(404).send('404: Page Not Found');
});


app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
