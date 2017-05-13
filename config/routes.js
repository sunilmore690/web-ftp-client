var config = require('config').cloud
  , path = require('path')
  , ftpsController = require('../api/controllers/ftps_controller')
  , isLoggedin = function(req,res,next){
    if(req.session.ftp) {
      return next()
    }else return next({errors:['Not authorized'],status:401})
  }

 function getCookie (name,cookies){
  console.log('list',typeof list)
   var list = {},
          rc = cookies;
          console.log('rc',rc)
      rc && rc.split(';').forEach(function( cookie ) {
          var parts = cookie.split('=');
          list[parts.shift().trim()] = decodeURI(parts.join('='));
      });
      console.log('list',list)
    return list[name];

  }
module.exports = function(app) {
  
  //connect to ftp client
  app.post('/api/ftp/connect',ftpsController.connect)  
  app.get('/api/isloggedin',function (req,res,next){
    console.log('req session',req.session);
    console.log('req cookie',getCookie('connect.sid',req.headers.cookie))

    if(req.session.ftp) res.json(req.session.ftp)
    else res.status(401).json({loggedin:false})
  })
  app.post('/api/ftp/logout',function (req,res,next){
    delete req.session.destroy();
    res.json({success:true})
  })
  app.post('/api/ftp/list',isLoggedin,ftpsController.list);
  app.get('/api/ftp/download',isLoggedin,ftpsController.download);
  app.post('/api/ftp/rename',isLoggedin,ftpsController.rename);
  app.post('/api/ftp/move',isLoggedin,ftpsController.move);
  app.post('/api/ftp/copy',isLoggedin,ftpsController.copy);
  app.post('/api/ftp/mkdir',isLoggedin,ftpsController.mkdir);
  app.post('/api/ftp/upload',isLoggedin,ftpsController.upload);
  app.post('/api/ftp/delete',isLoggedin,ftpsController.delete);
  app.post('/api/reply_to_sms',function (req,res,next){
      console.log('req body',req.body)
      res.json('test');
  })
};
