//jshint esversion:6

const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');

const app = express();

app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));

mongoose.connect('mongodb://localhost:27017/userDB', { useNewUrlParser: true });

const userSchema = {
	email: String,
	password: String,
};

const User = new mongoose.model('User', userSchema);

app.get('/', function (req, res) {
	res.render('home');
});

app.get('/login', function (req, res) {
	res.render('login');
});

app.get('/register', (req, res) => {
	res.render('register');
});

app.post('/register', (req, res) => {
	const newUser = new User({
		email: req.body.username, // body -> utk ambil dari isian. username adl "name" di htmlNya
		password: req.body.password,
	});
	// newUser.save(function (err) {
	// 	if (err) {
	// 		console.log(err);
	// 	}else{
	// 		res.render("secrets")
	// 	}
	// });
	newUser
		.save()
		.then(function () {
			res.render('secrets');
		})
		.catch(function (err) {
			console.log(err);
		});
});

app.post('/login', (req, res) => {
	const username = req.body.username;
	const password = req.body.password;

	User.findOne({ email: username })
		.then(function (foundUser) {
			if (foundUser) {
				if (foundUser.password===password) {
					res.render("secrets")
				}else{
					console.log(`password salah`);
				}
				
			}else{
				console.log(`user tidak ketemu`);
			}
		})
		.catch(function (err) {
			console.log(err);
		})
});

app.listen(3001, () => {
	console.log(`running on port 3001`);
});
