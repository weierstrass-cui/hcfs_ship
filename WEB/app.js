'use strict'

var http = require('http'),
	url = require('url'),
	querystring = require('querystring'),
	mysql = require('mysql');
var configs = require('./config.js'),
	option = configs.dbOption;

var createConnection = function(){
	return (mysql.createConnection({
		host: option.host,
		user: option.user,
		port: option.port || '3306',
		password: option.password,
		database: option.database
	}));
}

var sendResponse = function(httpResponse, body, status, description){
	var responseBody = JSON.stringify({
		status: status,
		result: body,
		description: description || ''
	});

	httpResponse.writeHeader(200, {'content-type':'application/x-www-form-urlencoded;charset=UTF-8', "Access-Control-Allow-Origin":"*"});
	httpResponse.write(responseBody);
	httpResponse.end();
}

var queryFunctions = {
	'/login': function(httpResponse){
		try{
			var username = this.username, password = this.password;
			var connection = createConnection();
			var sql = 'select * from hcfs_user where name="' + username + '" and pass="' + password + '"';
			connection.query(sql, function(selectErr, selectResult){
				if( selectErr ){
					return;
				}
				if( selectResult.length ){
					var response = {
						isAdmin: selectResult[0].isAdmin == '1',
						name: selectResult[0].city,
						uid: selectResult[0].id,
					}
					sendResponse(httpResponse, response, 'Y');
				}else{
					sendResponse(httpResponse, '', 'N', '用户名或密码错误');
				}
				connection.end();
			});
		}catch(e){
			sendResponse(httpResponse, '', 'N', '系统错误');
		}
	},
	'/getRoomConfig': function(httpResponse){
		try{
			var connection = createConnection();
			var sql = 'select b.id, a.name, b.type, b.count as total, b.count-b.use as remain from hcfs_room a join hcfs_room_count b where a.id = b.rid';
			connection.query(sql, function(selectErr, selectResult){
				if( selectErr ){
					return;
				}
				if( selectResult.length ){
					sendResponse(httpResponse, selectResult, 'Y');
				}else{
					sendResponse(httpResponse, '', 'N', '查无记录');
				}
				connection.end();
			});
		}catch(e){
			sendResponse(httpResponse, '', 'N', '系统错误');
		}
	},
	'/doOrder': function(httpResponse){
		try{
			var postData = this.orderList, uid = this.uid;
			var connection = createConnection();
			var sql = 'select b.id, a.name, b.type, b.count as total, b.count-b.use as remain, b.use from hcfs_room a join hcfs_room_count b where a.id = b.rid';
			connection.query(sql, function(selectErr, selectResult){
				if( selectErr ){
					return;
				}
				if( selectResult.length ){
					var updateList = [], errorList = [], successCount = 0, errorCount = 0;
					var insertList = [];
					for(var i in postData){
						for(var j in selectResult){
							if( postData[i].id == selectResult[j].id ){
								if( postData[i].order > 0 && 
									postData[i].order <= selectResult[j].remain ){
									updateList.push({
										id: postData[i].id,
										order: postData[i].order,
										num: selectResult[j].use + postData[i].order
									});
								}else{
									errorList.push(postData[i]);
								}
							}
						}
					}
					var doUpdate = function(){
						var updateData = updateList.shift();
						var sql = 'update hcfs_room_count a set a.use = ' + (updateData.num) + ' where a.id = ' + updateData.id
						connection.query(sql, function(updateErr, updateResult){
							if( updateErr ){
								return;
							}
							successCount += 1;
							insertList.push({
								rid: updateData.id,
								uid: uid,
								order: updateData.order,
								time: new Date().getTime()
							});
							if( updateList.length ){
								doUpdate();
							}else{
								var doInsert = function(){
									var insertData = insertList.shift();
									var sql = 'insert into hcfs_orders values  (null, ' + insertData.uid + ', ' + insertData.rid + ', ' + insertData.order + ', ' + insertData.time + ')';
									connection.query(sql, function(insertErr, insertResult){
										if( insertErr ){
											return;
										}
										if( insertList.length ){
											doInsert();
										}else{
											var response = {
												success: successCount,
												errorList: errorList
											};
											sendResponse(httpResponse, response, 'Y');
											connection.end();
										}
									});
								}
								doInsert();
							}
						});
					}
					doUpdate();
					return;
				}else{
					sendResponse(httpResponse, '', 'N', '查无记录');
				}
				connection.end();
			});
		}catch(e){
			sendResponse(httpResponse, '', 'N', '系统错误');
		}
	},
	'/getOrderLogs': function(httpResponse){
		try{
			var connection = createConnection();
			var sql = 'select f.city, e.name, f.type, f.order, f.time from hcfs_room e join (';
				sql += 'select c.rid, c.type, d.city, d.order, d.time from hcfs_room_count c join (';
				sql += 'select b.city, a.rid, a.order, a.time from hcfs_orders a ';
				sql += '	join hcfs_user b on a.uid = b.id';
				if( this.uid ){
					sql += ' where b.id = ' + this.uid;
				}
				sql += ') d on c.id = d.rid';
				sql += ') f on e.id = f.rid';
				sql += ' order by f.time desc';
			connection.query(sql, function(selectErr, selectResult){
				if( selectErr ){
					return;
				}
				if( selectResult.length ){
					sendResponse(httpResponse, selectResult, 'Y');
				}else{
					sendResponse(httpResponse, '', 'N', '查无记录');
				}
				connection.end();
			});
		}catch(e){
			sendResponse(httpResponse, '', 'N', '系统错误');
		}
	},
	'/getOrderTotal': function(httpResponse){
		try{
			var connection = createConnection();
			var sql = 'select f.city, e.name, f.type, sum(f.order) as total from hcfs_room e join (';
				sql += 'select c.id, c.rid, c.type, d.city, d.order, d.time from hcfs_room_count c join (';
				sql += 'select b.city, a.rid, a.order, a.time from hcfs_orders a ';
				sql += '	join hcfs_user b on a.uid = b.id';
				if( this.uid ){
					sql += ' where b.id = ' + this.uid;
				}
				sql += ') d on c.id = d.rid';
				sql += ') f on e.id = f.rid';
				sql += ' group by e.name, f.type';
				sql += ' order by f.id';
			connection.query(sql, function(selectErr, selectResult){
				if( selectErr ){
					return;
				}
				if( selectResult.length ){
					sendResponse(httpResponse, selectResult, 'Y');
				}else{
					sendResponse(httpResponse, '', 'N', '查无记录');
				}
				connection.end();
			});
		}catch(e){
			sendResponse(httpResponse, '', 'N', '系统错误');
		}
	}
}

http.createServer(function(req, res){
	var post = '', pathName = '';
	req.on('data', function(chunk){
		post += chunk;
	});
	req.on('end', function(){
		var postData = JSON.parse(querystring.parse(post).data);
		pathName = url.parse(req.url, true).pathname;
		
		var postDataString = JSON.stringify(postData);
		if( pathName != '/' && postDataString ){
			queryFunctions[pathName] && queryFunctions[pathName].call(postData, res);
		}else{
			res.writeHeader(500, {'content-type':'application/x-www-form-urlencoded;charset=UTF-8', "Access-Control-Allow-Origin":"*"});
			res.end();
		}
	});
}).listen(8080);