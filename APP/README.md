# SQZ

注意：使用localstoratge的时候，命名前请添加 SQZ_ 前缀， 且尽量不要使用

获取token：
$scope.commonFn.getToken();

后台参数传递：
/userService/login/map;loginName=13585948849;pass=_I8sJx/sys;terminal=android
{
	map: {
		loginName: '13585948849',
		pass: '_I8sJx'
	},
	sys: {
		terminal: 'android'
	}
}

/userService/getCaptcha/13585948849/sys;terminal=android
{
	noName: '13585948849',
	sys: {
		terminal: 'android'
	}
}

前台参数传递：
$scope.commonFn.buildParamsForUrl({
	a: '1',
	b: '2'
});
a=1&b=2
$scope.commonFn.getParamsFromUrl();
{
	a: '1',
	b: '2'
}

获得设备类型：
controller中使用 $scope.commonFn.getDevice();

Controller中页面跳转：
$scope.commonFn.goView('/login');			// 可回退
$scope.commonFn.goView('/login', true);		// 不可回退

返回上一页：
$scope.commonFn.goLastView();

弹窗提示：
$scope.commonFn.alertMsg([标题], [内容], [确定后回调函数]);
$scope.commonFn.confirmMsg([标题], [内容], [确定后回调函数], [取消后回调函数]);


