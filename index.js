var express = require('express')
  , http = require('http')
  , path = require('path')
  , exec = require("child_process").exec
  , config = require('config')
  , session = require('express-session')
  , MemoryStore = require('session-memory-store')(session)
  , cookieParser = require('cookie-parser');
  

var server = express();
// var ImageProcessorCron = require('./api/cron/image_processor_cron');
server.configure('staging', function() {
  server.config = require('./config/staging').cloud;
});
server.configure('master', function() {
  server.config = require('./config/master').cloud;
});
server.use(express.bodyParser({ limit: '50mb' }));
server.engine('html', require('ejs').renderFile);
server.use(express.static(__dirname + '/public'));
server.use(cookieParser('secret12'))
server.use(express.favicon("favicon.ico")); 
server.use(express.bodyParser({ limit: '50mb' }));
console.log('Config name',config.name);
server.use(session({
    secret: 'secret12',
    // create new redis store.
    store: new MemoryStore(),
    saveUninitialized: false,
    resave: false
}));


var consoleHolder = console;
function debug(bool){
    if(!bool){
        consoleHolder = console;
        console = {};
        console.log = function(){};
    }else
        console = consoleHolder;
}
debug(config.debug)
require('./config/routes')(server);

 // ImageProcessorCron(server)
server.get('/test', function (req, res, next) {
  console.log("test route");
  console.log(JSON.stringify(con));
  res.json("test success");
});
server.use(function(err, req, res, next) {
  console.log('err',err)
  if(err){
    res.status(err.status || 500).json({message:err.errors})
  }else{
    res.status(500).json({message:'something went wrong'})
  }
})
server.get('/', function (req, res, next) {
    res.render(path.join(__dirname + "/index.html"));
})
global.dirname = __dirname;
http.createServer(server).listen(process.env.PORT || config.port, function(){
  console.log("Web Ftp server listening on port =====|    " + (process.env.PORT || config.port));
});

// process.on('uncaughtException', function(err) {
//   console.log("Inside uncaughtException block error - - " + JSON.stringify(err));
//   // for (key in global.cloudObj) {
//   //   console.log("@@@@@ @@@@@ @@@@@ @@@@@ @@@@@ ");
//   //   console.log(key);
//   //   console.log(cloudObj[key]);
//   //   console.log(cloudObj[key].isRunning);
//   //   console.log("@@@@@ @@@@@ @@@@@ @@@@@ @@@@@ ");
//   //   cloudObj[key].isRunning = false;
//   // }
// })
