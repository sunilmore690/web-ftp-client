var config = require('config')
  , _ = require('lodash')
  , Jsftp = require('jsftp')
  , mime = require('mime')
  , fs =require('fs');

function quitConn(myFtp){
  myFtp.raw.quit(function(err, data) {
    if (err) return console.error(err);
 
    console.log("Bye!");
});
}
var ftps = {};
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

ftps.connect = function (req, res, next) {
  try{
    var ftp = new Jsftp(req.body);
  

  ftp.auth(req.body.user,req.body.pass,function(err,result){
    quitConn(ftp)
    if(err) return next(err)
    else if(result && !result.isError){
      req.session.ftp = req.body
      res.json(req.body);
    }else return next({errors:[text]})
  })

  }catch(e){
    return next({errors:[e],status:500})

  }
};
ftps.upload = function(req,res,next){
  console.log('req files',req.files)
  console.log('req body',req.body)
  // res.send('successful')

  
  var filePath = req.files['uploadfile'].path;
  var filename = req.files['uploadfile'].originalFilename;
  var fileData = fs.readFileSync(filePath);
  try{
    var ftp = new Jsftp(req.session.ftp);
  }catch(e){
    return next({errors:[e],status:500})
  }
  console.log('uploadfile',req.body.dir + filename)
  ftp.put(fileData, req.body.dir + filename, function(hadError) {
    if(hadError){
      return next(hadError)
    }else{
      res.json({message:'File uploaded Successfully'})
    }
  });
}
ftps.list = function (req,res,next){

  try{
    var ftp = new Jsftp(req.session.ftp);
  }catch(e){
    return next({errors:[e],status:500})
  }
  ftp.ls(req.body.dir || '/',function (err,files){
    quitConn(ftp)
    if(err) return next(err)
    else {
      files = _.sortBy(files,function(file){
        return - file.type;
      })
      files = _.map(files,function(file){
          file.time = new Date(file.time);
          var perm = '';
          if(file.userPermissions){
             if(file.userPermissions.read) perm+='r'
             else perm += '-'

             if(file.userPermissions.write) perm+='w'
             else perm += '-'

             if(file.userPermissions.exec) perm+='x'
             else perm += '-'

          }
         if(file.groupPermissions){
             if(file.groupPermissions.read) perm+='r'
             else perm += '-'

             if(file.groupPermissions.write) perm+='w'
             else perm += '-'

             if(file.groupPermissions.exec) perm+='x'
             else perm += '-'

          }
          if(file.otherPermissions){
             if(file.otherPermissions.read) perm+='r'
             else perm += '-'

             if(file.otherPermissions.write) perm+='w'
             else perm += '-'

             if(file.otherPermissions.exec) perm+='x'
             else perm += '-'

          }
          if(file.type != 0){
            file.type = 'Directory';
          }else{
            file.type = 'File';
          }
          file.perm = perm;
          return file;
      })
      var currentDir = req.body.dir || '/';
      currentDir = currentDir.split('/');

      res.json({ftpdirlist:files,dirs:currentDir});
    }
  })
}
ftps.download = function (req,res,next){
  console.log('req session',req.session.ftp);
  try{
    var ftp = new Jsftp(req.session.ftp);
  }catch(e){
    console.log('err',err)
    return next({errors:[e],status:500})
  }
  //console.log('test',test)
  
  var uniquekey = getCookie('connect.sid',req.headers.cookie)
  var localFilePath = './temp/'+uniquekey + '_' +req.query.name;
  console.log('localFilePath',localFilePath);
  req.query.path = (req.query.path.charAt(req.query.path) == '/') ? req.query.path : req.query.path + '/';

  ftp.get(req.query.path + req.query.name,localFilePath,function(err){
    quitConn(ftp)
    if(err) next({errors:[err],status:500})
    else{
      console.log('file download')
      var mimetype = mime.lookup(localFilePath);
      res.setHeader('Content-disposition', 'attachment; filename=' + req.query.name);
      res.setHeader('Content-type', mimetype);
      var filestream = fs.createReadStream(localFilePath);
      filestream.pipe(res);
      fs.unlinkSync(localFilePath)
    }
  })
}
ftps.rename = function (req,res,next){
  try{
    var ftp = new Jsftp(req.session.ftp);
  }catch(e){
    console.log('err',err)
    return next({errors:[e],status:500})
  }
  var from = req.body.path + req.body.source;
  var to = req.body.path + req.body.dest
  ftp.rename(from, to, function(err, data) {
    quitConn(ftp)
   if (err) return next(err)
   else res.json({message:'Rename successful'})
  })
}
ftps.mkdir = function (req,res,next){
  try{
    var ftp = new Jsftp(req.session.ftp);
  }catch(e){
    console.log('err',err)
    return next({errors:[e],status:500})
  }
  ftp.raw.mkd(req.body.dir, function(err, data) {
    if (err) return next(err)
    else res.json({message:'Directory Created'})
  })
}
ftps.delete = function(req,res,next){
  try{
    var ftp = new Jsftp(req.session.ftp);
  }catch(e){
    console.log('err',err)
    return next({errors:[e],status:500})
  }
  ftp.raw.dele(req.body.path + req.body.name, function(err, data) {
    if (err) return next(err)
    else res.json({message:'File Deleted'})
  })
}
ftps.move = function(){
  try{
    var ftp = new Jsftp(req.session.ftp);
  }catch(e){
    console.log('err',err)
    return next({errors:[e],status:500})
  }
  var from = req.body.sourcePath + req.body.sourceFile;
  var to = req.body.sourcePath + req.body.destFile
  ftp.rename(from, to, function(err, res) {
    quitConn(ftp)
   if (err) return next(err)
   else res.json({message:'Rename successful'})
  })
}
ftps.copy = function (req,res,next){
   try{
    var ftp = new Jsftp(req.session.ftp);
  }catch(e){
    console.log('err',err)
    return next({errors:[e],status:500})
  }
  if(!req.body.sourcePath){
    return next({errors:['source path ']})
  }else if(!req.body.destPath){
    return next({errors:['source path ']})
  }else if(req.body.sourcePath == req.body.destPath){
    return next({errors:['Source path & dest path could not be same']})
  }
  var uniquekey = getCookie('connect.sid',req.headers.cookie)
  var localFilePath = './temp/'+uniquekey + '_' +req.body.name;
  ftp.get(req.body.sourcePath + req.body.name,localFilePath, function(err, socket) {
    if (err){
      quitConn(ftp)
      return next(err)
    }
    else{
      ftp.put(localFilePath,req.body.destPath + req.body.name,function(err){
        quitConn(ftp)
        if(err) return next(err)
        else res.json({message:'Copied File Successfully'})
        fs.unlinkSync(localFilePath)
      })
    }
  });
}
ftps.testConnection = function (req, res, next) {
  try{
    var ftp = new Jsftp(req.body);
  }catch(e){
    return next({errors:[e],status:500})
  }
  ftp.auth(req.body.user,req.body.pass,function(err,result){
    quitConn(ftp)
    if(err) return next(err)
    else if(result && !result.isError){
      req.session.ftp = req.body
      res.json(req.body);
    }else return next({errors:[text]})
  })
};



module.exports = ftps;
