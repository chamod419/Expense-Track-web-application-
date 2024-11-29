const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mysql = require('mysql2');
const path = require('path'); 
const app = express();
const port = 3000;

app.use(cors());
app.use(bodyParser.json());


app.use(express.static(path.join(__dirname, 'public')));


const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'track_my_cash'
});


db.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        return;
    }
    console.log('Connected to MySQL');
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname))); 


app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'goals.html')); 
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


app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
