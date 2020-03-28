const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const mongoose = require('mongoose');
const flash = require('connect-flash');
const methodOverride = require('method-override');
const session = require('express-session');
const passport =  require('passport');

const app = express();

// Passport config
require('./config/passport')(passport);

// DB Config
const db = require('./config/keys').MongoURI;

// Connect to Mongo
mongoose.connect(db, {useNewUrlParser: true, useUnifiedTopology: true})
    .then(() => console.log("MongoDB Connected..."))
    .catch(err => console.log(err));

// EJS
app.use(expressLayouts);
app.set('view engine', 'ejs');

// Public folder
app.use(express.static("./public"));

// Body Parser
app.use(express.urlencoded({ extended: false }));

// Method Override
app.use(methodOverride("_method"));

// Express Session middleware
app.use(session({
    secret: 'Secret message',
    resave: true,
    saveUninitialized: true,
}));

// Passport middleware (Always after express session middleware)
app.use(passport.initialize());
app.use(passport.session());


// Connect flash
app.use(flash());

// Global variables
app.use(function(req, res, next) {
    res.locals.currentUser = req.user;
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('error');
    next();
});

// Routes

app.use("/", require('./routes/index'));
app.use("/users", require('./routes/users'));
app.use("/courses", require('./routes/courses'));
app.use("/studentmessages", require('./routes/studentmessages'));
app.use("/friends", require('./routes/friends'));
app.use("/admin", require('./routes/admins'));
app.use("*", require('./routes/errors'));


const PORT = process.env.PORT || 5000;

app.listen(PORT, console.log('Server started on port ' + PORT));