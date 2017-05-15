var TemplateManager = {
    templates: {}, // holds the templates cache
    get: function(id, callback) {
        var template = this.templates[id];
        if (template) { // return the cached version if it exists
            callback(template);
        } else {
            var that = this;
            $.get('/templates/' + id + ".hbs", function(template) {
                that.templates[id] = template;
                callback(that.templates[id]);
            });
        }
    }
}

function parseQueryString(variable) {
    var query = window.location.search.substring(1);
    var vars = query.split('&');
    for (var i = 0; i < vars.length; i++) {
        var pair = vars[i].split('=');
        if (decodeURIComponent(pair[0]) == variable) {
            return decodeURIComponent(pair[1]);
        }
    }

}
Handlebars.registerHelper("when", function(operand_1, operator, operand_2, options) {
    var operators = {
            'eq': function(l, r) {
                return l == r;
            },
            'noteq': function(l, r) {
                return l != r;
            },
            'gt': function(l, r) {
                return Number(l) > Number(r);
            },
            'or': function(l, r) {
                return l || r;
            },
            'and': function(l, r) {
                return l && r;
            },
            '%': function(l, r) {
                return (l % r) === 0;
            }
        },
        result = operators[operator](operand_1, operand_2);

    if (result) return options.fn(this);
    else return options.inverse(this);
});
Handlebars.registerHelper("formattedDate",function(date){
  console.log('date',date)
  return moment(date).format('MMMM Do YYYY, h:mm:ss a');
})
var BaseModel = Backbone.Model.extend({});

var FtpConnect = Backbone.Model.extend({
    urlRoot: '/api/ftp/connect',
    defaults: {
        port: '21'
    }
});
var FtpListModel = Backbone.Model.extend({
    urlRoot: '/api/ftp/list',
    defaults: {
      dir:'/'
    }
});
var renameModel = Backbone.Model.extend({
    urlRoot: '/api/ftp/rename'
});
var deleteModel = Backbone.Model.extend({
    urlRoot: '/api/ftp/delete'
});


var FtpListView = Backbone.View.extend({
    el: '.page',

    events: {
     'click .list':'listDirFile',
     'click .path':'goToPath',
     'click .action':'Action',
     'click .mkdir':'makeDir',
     'click .delete' : 'deleteFile'
    },
    Action:function(event){
      var data = $(event.currentTarget).data();
      if(data.action == 'download'){
        this.download(data.name)
      }else if(data.action == 'rename'){
        this.rename(data.name);
      }
    },

    makeDir:function(event){
      var that = this;
      var newdir = prompt("New Directory Name ", '');
      if(newdir){
        var dir = this.model.get('dir')+'/'+newdir
        var request = $.post('/api/ftp/mkdir',{dir:dir});

        request.success(function(result) {
          window.App.flash('Directory Created','success')
          that.render();      
        });

        request.error(function(jqXHR, textStatus, errorThrown) {
          window.App.flash('Something went wrong','error')
          // Etc
        });
      }
    },
    download:function(name){
      var currentDir = this.model.get('dir') || '/';

    },
    rename:function(name){
      var that  = this;
      var currentDir = this.model.get('dir') || '/';
      var newfile = prompt("Rename ", name);

      if(newfile && newfile != name ){
        var rename = new renameModel({path:currentDir,source:name,dest:newfile});
        rename.save({},{
          success:function(){
            window.App.flash("Rename successfull", 'success');
            that.render();
            
          }
        })
      }
    },
    deleteFile:function(event){
      var data = $(event.currentTarget).data();
      if (confirm("Are you sure,do you want to delete this file ? "+data.name) != true) {
        return false;
      } 
      var that = this;
      
      var delete_model = new deleteModel({path:this.model.get('dir') || '/',name:data.name});
      delete_model.save({},{
        success:function(){
          window.App.flash("File Deleted", 'success');
          that.render();
        }
      })
      return false;

    },
    postRender : function(){
      var that  = this;
      $("#uplodadfileform").on('submit',function(){
        console.log('after submit')
       var formData = new FormData($(this)[0]);

         $.ajax({
            url: '/api/ftp/upload',
            type: 'POST',
            data: formData,
            async: false,
            success: function (data) {
                window.App.flash('File Uploaded ','success')
                that.render();
            },
            cache: false,
            contentType: false,
            processData: false
        });
        return false;
      });
      this.$el.find("input:file").change(function (){
         that.$el.find("#uplodadfileform").submit();
       console.log('test')
       
     });
    },
    initialize: function() {
      var that = this;
      this.model = new FtpListModel({dir:sessionStorage.getItem('currentDir') || '/'});
      this.model.on('change:dir',function(){
        window.sessionStorage.setItem('currentDir', that.model.get('dir'));
      })

    },
    goToPath : function(event){
        var data = $(event.currentTarget).data();
        var dirs = this.model.get('dirs') || [];
        dirs = JSON.parse(JSON.stringify(dirs));
        dirs.pop();
        if(dirs.indexOf(data.name) >=0){
            var dir = '';
            for(var i=0;i<=dirs.indexOf(data.name);i++){
              dir +=dirs[i] +'/'
            }
            console.log('dir',dir);
            this.model.set('dir',dir);
            this.render();
        }else{

        }
    },
    listDirFile:function(event){
        var data = $(event.currentTarget).data();
        console.log('data',data);
        if(data.type == 'folder'){
            var dir = this.model.get('dirs') || [];
            dir = dir.join('/')
            console.log('dir',dir +data.name +"/")
            this.model.set('dir',dir +data.name +"/");
            this.render();
        }else{

        }
    },
    render: function() {
      var that = this;
      this.model.save({},{
        success: function() {

          TemplateManager.get('ftp_list', function(template) {
           
              var template = Handlebars.compile(template);
              var data = JSON.parse(JSON.stringify(that.model.attributes))
               data.dirs.pop();
              var html = template(data);
              that.$el.html(html);
              that.postRender();
          })
        }.bind(this)
      });
      return this;
  }
});
var NavBarView = Backbone.View.extend({

  el:'nav',
  events:{
   'click .signout':'Logout'
  },
  initialize:function(){

    // console.log('vv',new signupView())

  },
  Logout:function(){
     var request = $.post('/api/ftp/logout',{});

    request.success(function(result) {
      window.sessionStorage.removeItem('currentDir');
      window.App.flash('Logout Successfully','success')
      window.location = '/';      
    });

    request.error(function(jqXHR, textStatus, errorThrown) {
      window.App.error('Something went wrong')
      // Etc
    });
    return false;
  },
  render:function(){
    TemplateManager.get('navbar',function(source){
      var template = Handlebars.compile(source);
      console.log('ftp',window.App.User)
      var html = template({ftp:window.App.User});
      this.$el.html(html);
    }.bind(this))
  }
})
var HomeView = Backbone.View.extend({
    el: '.page',
    initialize: function() {
        this._modelBinder = new Backbone.ModelBinder();
        this.model = new FtpConnect()
    },
    events: {
        'click .login': "Login"
    },
    render: function(id) {
      if(window.sessionStorage.getItem('ftp')){
        this.model.set(JSON.parse(window.sessionStorage.getItem('ftp') || {}));
      }

        // this.model.unset('id');
        var that = this;

        TemplateManager.get('home', function(template) {
            // var source = $('#user-info-template').html();
            var template = Handlebars.compile(template);
            var html = template(that.model.attributes || {});
            // console.log('test')
            // console.log('html',html)
            that.$el.html(html);
             that.bindModel()
            return false;
        })
    },
    addSettingModal: function(event) {
        window.App.settingmodalview.render(this.model);
        return false;
    },
    bindModel: function() {
        var bindings = {
            host: '[name=host]',
            user: '[name=user]',
            pass: '[name=pass]',
            port: '[name=port]'
        };
        this._modelBinder.bind(this.model, this.el, bindings);
    },
    Login: function(e) {
        var that = this;
        that.model.save({}, {
            success: function() {
                // that.$el.modal('hide');
              window.App.User = that.model.attributes;
              
              window.sessionStorage.setItem('ftp',JSON.stringify({host:that.model.get('host'),user:that.model.get('user')}))
              window.location = '/'
            },
            error: function(err) {
                window.App.flash("Something went wrong. Please try again", 'error');
            }
        })
    }
});

var Router = Backbone.Router.extend({
    routes: {
        '': 'home',
        'ftplist':'index'

    },
    index:function(){
      if(window.App.User){
        router.currentView = new FtpListView();
        router.currentView.render();
      }else{
         App.router.navigate('',{trigger:true})
      }
    },
    home: function() {
      if (window.App.User) {
        router.currentView = new FtpListView();
        router.currentView.render();
      } else {
          router.currentView = new HomeView();
          router.currentView.render();
      }

    },
    execute: function(callback, args) {
        console.log('Calling execute')
        if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
            App.isMobile = true;
        }
        var that = this;
        
        window.App.loggedIn(function(err, user) {
            if(!App.navBarView){
              App.navBarView = new NavBarView()
              App.navBarView.render();
            }
          args.push(parseQueryString(args.pop()));
          if (callback) callback.apply(that, args);
        })

    }
});
var router = new Router();
window.App = window.App || {};
window.App.router = router;
window.App.setLoading =function(loading){
   $('body').toggleClass('loading', loading);

  if(!loading) {
    $('body').css('overflow-y', 'auto');
  } else {
    $('body').css('overflow-y', 'hidden');
  }
}
window.App.loggedIn = function(callback) {
    var request = $.get('/api/isloggedin');

    request.success(function(result) {

        window.App.User = result
        callback(null, result);
    });
    request.error(function(jqXHR, textStatus, errorThrown) {
        callback(errorThrown)
    });
}
window.App.flash = function(message, type) {
    if (type == 'error') {
        $.growl.error({
            message: message,
            duration: 1000,
            type: 'danger'
        });
    } else {
        $.growl.notice({
            message: message,
            title: '',
            duration: 1000
        });
    }
}
jQuery.ajaxSetup({
  beforeSend: function() {
     window.App.setLoading(true)
  },
  complete: function(){
    window.App.setLoading(false)
  },
  success: function() {}
});
Backbone.history.start();