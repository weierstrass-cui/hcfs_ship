(function(){
	var localUrl = 'http://192.168.1.7:8080';
	// var localUrl = 'http://nql.52ladybug.com:8080';
	// 重写 Date的toJSON方法，满足后台对日期格式的需求
	// 1990-12-31T00:00:00Z
	var addZero = function(num){
		return num < 10 ? ('0' + num) : num;
	}
	Date.prototype.toJSON = function(){
		var str = this.getFullYear() + '-';
			str += addZero(this.getMonth() + 1) + '-';
			str += addZero(this.getDate()) + ' ';
			str += addZero(this.getHours()) + ':';
			str += addZero(this.getMinutes()) + ':';
			str += addZero(this.getSeconds()) + '';
		return str;
	}
	// 远程请求
	mainCtrl.factory('$request', ['$rootScope', '$http', '$storage', function($rootScope, $http, $storage){
		var formatDateInObjectToString = function(object){
			for(var i in object){
				if( object[i].toString().indexOf('GMT') == 25 ){
					object[i] = object[i].toJSON();
					continue;
				}
				if(typeof object[i] === 'object'){
					formatDateInObjectToString(object[i]);
				}
			}
		}
		var fromatData = function(json){
			// {key: value, key: value} => key=value;key=value
			var str = [];
			for(var i in json){
				str.push(i + '=' + json[i]);
			}
			return (';' + str.join(';'));
		}
		var transform = function(data){
		    return $.param(data);
		}

		var isOnError = false;
		
		return {
			getLocalURL: function(){
				return localUrl;
			},
			getDeviceType: function(){
				return deviceType;
			},
			post: function(fnName, json, callback, parm, showLoading){
				if( showLoading !== false){
					$rootScope.isLoadingData = true;
				}
				
				if( typeof json !== 'object' ){
					$rootScope.$broadcast('onError', {title: '系统提示',  message: '接口传递参数格式错误'});
					return;
				}
				var postUrl = localUrl + fnName;

				if(postUrl === ''){
					$rootScope.$broadcast('onError', {title: '系统提示',  message: '参数出错'});
					return false;
				}

				$http.post(postUrl, {data: JSON.stringify(json)}, {
				    headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'},
				    transformRequest: transform
				})
				.success(function(res){
					if( res.status == 'Y' ){
						if(typeof callback === 'function'){
							callback(res.result);
						}
					}else{
						if( !isOnError ){
							isOnError = true;
							$rootScope.$broadcast('onError', {title: '系统提示',  message: res.description});
							setTimeout(function(){
								isOnError = false;
							}, 3000);
						}
					}
					if( showLoading !== false){
						$rootScope.isLoadingData = false;
					}
				})
				.error(function(data, status){
					$rootScope.$broadcast('onError', {title: '系统提示',  message: 'Oops~~ 你的数据被外星人劫持了~~'});
					if( showLoading !== false){
						$rootScope.isLoadingData = false;
					}
				});
			}
		}
	}]);
	// 本地存储
	mainCtrl.factory('$storage', [function(){
		return {
			getLocalStorage: function(key){
				return localStorage.getItem(key) || null;
			},
			setLocalStorage: function(key, value){
				localStorage.setItem(key, value);
				return this.getLocalStorage(key) || null;
			},
			removeLocalStorage: function(key){
				localStorage.removeItem(key);
				return this.getLocalStorage(key) || null;
			}
		}
	}]);
	// 字典
	mainCtrl.factory('$dictionary', ['$request', function(request){
		return {
			getDictionary: function(json, callback){
				request.post('/api/dictionary/getDict', json, callback);
			}
		}
	}]);
})();