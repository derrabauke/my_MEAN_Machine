// BASIC SETUP
// ===========

var express     = require('express');
var app         = express(); // define our app unsing express
var bodyParser  = require('body-parser');
var morgan      = require('morgan');
var mongoose    = require('mongoose');
var User        = require('./app/models/user.js');
var port        = process.env.PORT || 8080; // set the port for our app

// connect to our database
mongoose.connect('mongodb://localhost:27017/mean_crm_db');

// App config
// body-parser will grab information from HTTP requests
app.use(bodyParser.urlencoded({ extended: true}));
app.use(bodyParser.json());

// config our app to handle CORs ( Cross Origin Request )
app.use(function(req, res, next) {
    res.setHeader('Acces-Control-Allow-Origin', '*');
    res.setHeader('Acces-Control-Allow-Methods', 'GET, POST');
    res.setHeader('Acces-Control-Allow-Headers', 'X-Requested-With, content-type, \Authorization');
    next();
});

// log all requests to console
app.use(morgan('dev'));

// ROUTES FOR OUR API
// ==================

// basic route for the home page
app.get('/', function(req, res){
    res.send('Welcome to our homepage!');
});

// get an instance of the express router
var apiRouter = express.Router();

// middleware to use for all requests
apiRouter.use(function(req, res, next){
    // do logging
    console.log('Somebody just came to this app!');
    // later on I will add authentification at this point,
    // so just auth. users are able to go on from this point on
    // if I don´t call "next();" the app will stop at this point
    next();
})

// test route to make sure everything is working
// accessed at GET http://localhost:8080/api
apiRouter.get('/', function(req, res){
    res.json({message: 'hooray! Welcome to our API!' + Math.floor(Date.now() /1000)});
});

// user modifcation routes
apiRouter.route('/users')
    // create a user ( acces at POST @ localhost:8080/api/users )
    .post(function(req, res) {
        // create a new instance of the User model
        var user = new User();

        // set the user information ( comes from the request )
        user.name = req.body.name;
        user.username = req.body.username;
        user.password = req.body.password;

        // save the user and check for errors
        user.save(function(err) {
            if (err) {
                // duplicate error
                if (err.code == 11000){
                    return res.json({
                        success: false,
                        message: 'A user with that username already exists.'
                    });
                } else {
                    return res.send(err);
                }
            }
            res.json({ message: 'User created!' });
        });
    })
    // get all the users ( GET @ localhost:8080/api/users )
    .get(function(req, res) {
        User.find(function(err, users){
            if (err) { res.send(err); }

            // return the users
            res.json(users);
        });
    });
apiRouter.route('/users/:user_id')
    // get the user with that id
    // (accessed with GET @ localhost:8080/api/users/:user_id)
    .get(function(req, res) {
        User.findById(req.params.user_id, function(err, user){
            if (err) res.send(err);

            //return that user
            res.json(user);
        })
    })

    // update the specific user
    .put(function(req, res){
        // use our user model to find the user he want
        User.findById(req.params.user_id, function(err, user){
            if (err) res.send(err);

            //update the users info only if its new
            if (req.body.name ) user.name = req.body.name;
            if (req.body.username) user.username = req.body.username;
            if (req.body.password) user.password = req.body.password;

            // save the user
            user.save(function(err){
                if (err) res.send(err);

                //return a message
                res.json({ message: 'User updated!'});
            });
        });
    })

    // delete the specific user
    .delete(function(req, res){
        User.remove({
            _id: req.params.user_id
        }, function(err, user){
            if (err) return res.send(err);

            res.json({ message: 'Successfully deleted' });
        });
    });
// ==> ENTER MORE ROUTES HERE
// ...

// register routes
// all of our routes will be prefixed with /api
app.use('/api', apiRouter);

// START THE SERVER
// ======================
app.listen(port);
console.log('Magic happens on port' + port);
