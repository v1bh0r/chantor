/**
 * Module dependencies.
 */
require('coffee-script')
var socket = require('socket.io');

var flashify = require('flashify')
var express = require('express')
    , http = require('http')
    , RedisStore = require('connect-redis')(express)
    , path = require('path');

var app = express();

app.configure(function () {
    app.set('port', process.env.PORT || 3000);
    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');
    app.use(express.favicon());
    app.use(express.logger('dev'));
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(express.cookieParser('asdlkfhkasdnfas,ndfasd,f,asndf,mansd,fs'));
    app.use(express.session({
        secret:"23658kjddfdgnmvc,mbneriggnkerng;sgndn",
        store:new RedisStore
    }));
    app.use(flashify);
    app.use(app.router);
    app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function () {
    app.use(express.errorHandler());
});

//Listen
var server = http.createServer(app).listen(app.get('port'), function () {
    console.log("Express server listening on port " + app.get('port'));
});

var io = socket.listen(server, { log: false }); //Attach socket io to the server

//Routes
require('./routes')(app, io) //sending both app and socket io instances to the routes