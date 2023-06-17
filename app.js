//jshint esversion:6

require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
// const encrypt = require('mongoose-encryption');
// const md5 = require('md5');
// const bcrypt = require('bcrypt');
// const saltRounds = 10;
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const googleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');

const app = express();

// console.log(process.env.API_KEY);
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
	session({
		secret: 'rafi cahya',
		resave: false,
		saveUninitialized: false,
	})
);
app.use(passport.initialize());
app.use(passport.session());

mongoose.connect('mongodb://localhost:27017/userDB', { useNewUrlParser: true });
// mongoose.set("useCreateIndex",true)

const userSchema = new mongoose.Schema({
	email: String,
	password: String,
	googleId: String,
	secret:String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

// userSchema.plugin(encrypt, { secret: process.env.SECRET, encryptedFields: ['password'] });

const User = new mongoose.model('User', userSchema);

passport.use(User.createStrategy());

// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());

passport.serializeUser(function (user, done) {
	done(null, user.id);
});

passport.deserializeUser(function (id, done) {
	// User.findById(id,function (err,user) {
	// 	done(err,user)
	// })
	User.findById(id)
		.then(function (user) {
			done(user);
		})
		.catch(function (err) {
			console.log(err);
		});
});

passport.use(
	new googleStrategy(
		{
			clientID: process.env.CLIENT_ID,
			clientSecret: process.env.CLIENT_SECRET,
			callbackURL: 'http://localhost:3001/auth/google/secrets',
			userProfileURL: 'https://www.googleapis.com/oauth2/v3/userinfo',
		},
		function (accessToken, refreshToken, profile, cb) {
			console.log(profile);
			User.findOrCreate({ googleId: profile.id }, function (err, user) {
				return cb(err, user);
			});
		}
	)
);

app.get('/', function (req, res) {
	res.render('home');
});

app.get('/auth/google', passport.authenticate('google', { scope: ['Profile'] }));

app.get(
	'/auth/google/secrets',
	passport.authenticate('google', { failureRedirect: '/login' }),
	function (req, res) {
		res.redirect('/secrets');
	}
);

app.get('/login', function (req, res) {
	res.render('login');
});

app.get('/register', (req, res) => {
	res.render('register');
});

app.get('/secrets', function (req, res) {
	User.find({"secret":{$ne:null}})
		.then(function (foundUser) {
			res.render("secret",{userWithSecrets:foundUser})
		})
		.catch(function (err) {
			console.log(err);
		})
	
});

app.get("/submit",function (req,res) {
	if (req.isAuthenticated()) {
		res.render("submit")
	}else{
		res.redirect('/login')
	}
})

app.post("/submit",(req,res) => { 
	const submittedSecret = req.body.secret
	User.findById(req.user.id)
		.then(function (foundUser) {
			foundUser.secret=submittedSecret
			foundUser.save()
				.then(() => {
					res.redirect("/secrets")
				})
		})
		.catch(function (err) {
			console.error(err);
		})
 })

app.get('/logout', function (req, res) {
	req.logout(function (err) {
		if (!err) {
			res.redirect('/');
		}
	});
});

app.post('/register', (req, res) => {
	// bcrypt.hash(req.body.password, saltRounds, function (err, hash) {
	// 	const newUser = new User({
	// 		email: req.body.username, // body -> utk ambil dari isian. username adl "name" di htmlNya
	// 		password: hash,
	// 	});
	// 	// newUser.save(function (err) { //* old way
	// 	// 	if (err) {
	// 	// 		console.log(err);
	// 	// 	}else{
	// 	// 		res.render("secrets")
	// 	// 	}
	// 	// });
	// 	newUser
	// 		.save()
	// 		.then(function () {
	// 			res.render('secrets');
	// 		})
	// 		.catch(function (err) {
	// 			console.log(err);
	// 		});
	// });
	User.register({ username: req.body.username }, req.body.password, function (err, user) {
		if (err) {
			console.log(err);
			res.redirect('/register');
		} else {
			passport.authenticate('local')(req, res, function () {
				res.redirect('/secrets');
			});
		}
	});
});

app.post('/login', (req, res) => {
	// const username = req.body.username;
	// const password = req.body.password;
	// User.findOne({ email: username })
	// 	.then(function (foundUser) {
	// 		if (foundUser) {
	// 			bcrypt.compare(password, foundUser.password, function (err, result) {
	// 				if (result === true) {
	// 					res.render('secrets');
	// 				} else {
	// 					res.send(`password salah`);
	// 				}
	// 			});
	// 		} else {
	// 			res.send(`user tidak ketemu`);
	// 		}
	// 	})
	// 	.catch(function (err) {
	// 		console.log(err);
	// 	});

	const user = new User({
		username: req.body.username,
		password: req.body.password,
	});

	req.login(user, function (err) {
		if (err) {
			console.log(err);
		} else {
			passport.authenticate('local')(req, res, function () {
				res.redirect('/secrets');
			});
		}
	});
});

app.listen(3001, () => {
	console.log(`running on port 3001`);
});
