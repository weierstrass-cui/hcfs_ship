angular.module('starter', ['starter.controller', 'ngAnimate', 'ngTouch', 'ngSanitize', 'ngFileUpload'])
.config(['$routeProvider', 
	function($routeProvider){
		$routeProvider
		.when('/login', {
			templateUrl: 'template/login.html',
			controller: 'loginController'
		}).when('/admin', {
			templateUrl: 'template/admin.html',
			controller: 'adminController'
		}).when('/product', {
			templateUrl: 'template/product.html',
			controller: 'productController'
		}).otherwise('/login');
	}
]);