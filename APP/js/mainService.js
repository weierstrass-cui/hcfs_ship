(function(){
	if( mainCtrl == ''){
		console.log('mainCtrl 加载出错');
		return;
	}
	mainCtrl.factory('$mainService', ['$request', function(request){
		return {
			login: function(json, callback){
				request.post('/login', json, callback);
			},
			getAllRoomConfig: function(json, callback){
				request.post('/getRoomConfig', json, callback);
			},
			doOrder: function(json, callback){
				request.post('/doOrder', json, callback);
			}
		}
	}]);
})();