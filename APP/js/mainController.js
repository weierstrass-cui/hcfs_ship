(function(){
	if( mainCtrl == ''){
		console.log('mainCtrl 加载出错');
		return;
	}

	mainCtrl.controller('loginController', ['$scope', '$mainService', '$storage', 
		function($scope, $mainService, $storage){
			$storage.removeLocalStorage('HCFS_user');
			$scope.user = {
				username: '',
				password: ''
			};
			$scope.fn = {
				doLogin: function(){
					if( !$scope.user.username ){
						$scope.commonFn.alertMsg('', '请输入用户名');
						return;
					}
					if( !$scope.user.password ){
						$scope.commonFn.alertMsg('', '请输入密码');
						return;
					}
					$mainService.login($scope.user, function(res){
						if( res.isAdmin ){
							$scope.commonFn.goView('/admin');
						}else{
							var user = {
								uid: res.uid,
								username: res.name
							}
							$storage.setLocalStorage('HCFS_user', JSON.stringify(user));
							$scope.commonFn.goView('/product');
						}
					});
				}
			}
		}
	]);
	mainCtrl.controller('adminController', ['$scope', '$mainService', '$storage',
		function($scope, $mainService, $storage){
			$mainService.getAllRoomConfig({}, function(res){
				$scope.roomConfig = res;
			});
			$mainService.getOrderLogs({}, function(res){
				for(var i in res){
					res[i].time = new Date(res[i].time - 0).toJSON();
				}
				$scope.orderLogList = res;
			});
		}
	]);
	mainCtrl.controller('productController', ['$scope', '$mainService', '$storage',
		function($scope, $mainService, $storage){
			var user = JSON.parse($storage.getLocalStorage('HCFS_user'));
			$scope.currentUser = user;
			var resetRoom = function(){
				$mainService.getAllRoomConfig({}, function(res){
					var roomConfigCache = {}, roomConfig = [];
					for(var i in res){
						roomConfigCache[res[i].name] = roomConfigCache[res[i].name] || [];
						roomConfigCache[res[i].name].push({
							id: res[i].id,
							name: res[i].name,
							type: res[i].type,
							total: res[i].total,
							remain: res[i].remain,
							order: 0
						});
					}
					for(var i in roomConfigCache){
						roomConfig.push({
							name: i,
							config: roomConfigCache[i]
						});
					}
					$scope.roomConfig = roomConfig;
				});
			}
			resetRoom();

			$scope.fn = {
				minus: function(room){
					if( room.order > 0 ){
						room.order = room.order - 1;
					}else{
						room.order = 0;
					}
				},
				plus: function(room){
					if( room.order < room.remain ){
						room.order = room.order - 0 + 1;
					}else{
						room.order = room.remain;
					}
				},
				checkNum: function(room){
					room.order = room.order.replace(/[^\d]/g,'');

					if( room.order < 0 ){
						room.order = 0;
					}
					if( room.order > room.remain ){
						room.order = room.remain;
					}
				},
				checkOrder: function(){
					var orderList = [];
					for(var i in $scope.roomConfig){
						for(var j in $scope.roomConfig[i].config){
							var room = $scope.roomConfig[i].config[j];
							if( room.order && room.order > 0 && room.order <= room.remain ){
								orderList.push(room);
							}
						}
					}
					
					if( orderList.length ){
						$scope.popWin = true;
						$scope.orderList = orderList;
					}
				},
				doOrder: function(){
					if( $scope.orderList.length ){
						var data = {
							uid: user.uid,
							orderList: $scope.orderList
						}
						$mainService.doOrder(data, function(res){
							if( 0 == res.errorList.length ){
								$scope.commonFn.alertMsg('', '恭喜您预订成功');
							}
							$scope.popWin = false;
							resetRoom();
						});
					}
				}
			}
		}
	]);
	mainCtrl.controller('logsController', ['$scope', '$mainService', '$storage',
		function($scope, $mainService, $storage){
			var user = JSON.parse($storage.getLocalStorage('HCFS_user'));
			$scope.currentUser = user;
			$mainService.getOrderLogs({
				uid: user.uid
			}, function(res){
				$scope.orderList = res;
			});
		}
	]);
})();

