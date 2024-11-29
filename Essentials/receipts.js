const express = require('express');
const mysql = require('mysql2');
const multer = require('multer');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const moment = require('moment'); 

const app = express();
const PORT = 3000;


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname))); 


const db = mysql.createConnection({
    host: 'localhost',
    user: 'root', 
    password: '', 
    database: 'track_my_cash' 
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


app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'receipts.html')); 
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


app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
