//jshint esversion:6

const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');

const app = express();

app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', function (req, res) {
	res.render('home');
});

app.get('/login', function (req, res) {
	res.render('login');
});

app.get('/register', (req, res) => {
	res.render('register');
});

app.listen(3001,() => { 
    console.log(`running on port 3001`);
 })