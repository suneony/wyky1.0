// 在Cloud code里初始化express框架
var fs = require('fs');
var express = require('express');
var app = express();
var expressLayouts=require('express-ejs-layouts');
var avosExpressCookieSession=require('avos-express-cookie-session');

/*---------------------------------------------------------------------*/
// App全局配置
app.set('views','cloud/views');   //设置模板目录
app.set('view engine', 'ejs');    // 设置template引擎
app.set('layout','layout');
app.use(expressLayouts);
app.use(express.bodyParser());    // 读取请求body的中间件
app.use(express.cookieParser('wyky_secure'));
app.use(avosExpressCookieSession({ cookie: { maxAge: 3600000 }}));
app.use(avosExpressCookieSession({fetchUser:true}));
app.use(function(req,res,next){
	res.locals.vary=AV.User.current();
	next();
});
app.use(app.router);

/*---------------------------------------------------------------------*/
/*---------------------------------------------------------------------*/
//使用express路由API服务/hello的http GET请求
app.get('/',function(req,res){
	var headUrl,userName,fileName,fileUrl;
	var UploadRecord=AV.Object.extend("UploadRecord");
	var query=new AV.Query(UploadRecord);
	res.render('index',{
		title:'首页',
		message:"message"
	});
});
app.get('/download',function(req,res){
	AV.Cloud.httpRequest({ url: "http://paas-files.qiniudn.com/YuayIrwajSsOA0rKJpo8KXbQH0e1kL79vaNHvCPr.pdf" }).then(function(response) {
  	//console.log(response);
  	res.send(response);
});
});
/*---------------------------------------------------------------------*/
app.post('/login',function(req,res){
	res.header('Content-Type', 'text/json');
	AV.User.logIn(req.body["login_username"],req.body["login_password"]).then(function(){
		console.log("signin successfully: %j",AV.User.current());
		res.json({status:1,result:"success"});
	},function(error){
		res.json({status:0,result:error});
	});
});
app.post('/reg',function(req,res){
	res.header('Content-Type', 'text/json');
	var username=req.body.reg_username;
	var password=req.body.reg_password;
	var email=req.body.reg_email;
	var firstDegreeCourse=req.body.first_degree_course;
	var secondDegreeCourse=req.body.second_degree_course;
	var user=new AV.User();
	user.set("username",username);
	user.set("password",password);
	user.set("email",email);
	user.set("firstDegreeCourse",firstDegreeCourse);
	user.set("secondDegreeCourse",secondDegreeCourse);
	user.signUp(null,{
		success:function(user){
			AV.User.logIn(username,password).then(function(){
			},
			function(error){
			});
			res.json({status:1,result:"success"});
		},
		error:function(error){
			res.json({status:0,result:error});
		}
	});	
});
app.post('/logout',function(req,res){
	res.header('Content-Type', 'text/json');
	AV.User.logOut();
	res.json({status:1});
});
app.post('/upload',function(req,res){
	res.header('Content-Type', 'text/json');
	var current_user=AV.User.current();
	if(!current_user)
	{
		res.json({status:0});
	}
	else
	{
		res.json({status:1});
	}
});
app.post('/fileupload',function(req,res){
	res.header('Content-Type', 'text/json');
	console.log(req.data);
	var file = req.files.fileupload;
    if(file){
        fs.readFile(file.path, function(err, data){
            if(err)
			res.json({status:0});
	        var base64Data = data.toString('base64');
            var theFile = new AV.File(file.name, {base64: base64Data});
            theFile.save().then(function(theFile){
                res.json({status:1});
                var UploadRecord=AV.Object.extend("UploadRecord");
                var uploadRecord= new UploadRecord();
                uploadRecord.set("userId",AV.User.current().id);
                uploadRecord.set("fileName",theFile.name());
                uploadRecord.set("fileUrl",theFile.url());
                uploadRecord.save(null, {
				  success: function(uploadRecord) {
				  },
				  error: function(uploadRecord, error) {
				  }
				});
            });
        });
    }else
        res.json({status:2});
});
/*---------------------------------------------------------------------*/
//最后，必须有这行代码来使express响应http请求
app.listen();
