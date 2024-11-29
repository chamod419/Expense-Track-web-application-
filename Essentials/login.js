const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path'); // Import the path module
const app = express();
const port = 3000;


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


db.connect((err) => {
    if (err) throw err;
    console.log('MySQL connected...');
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
            res.redirect('/dashboard.html'); 
        } else {
            res.redirect('/login.html?message=Invalid email or password');
        }
    });
});


app.use((req, res) => {
    res.status(404).send('404: Page Not Found');
});


app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
