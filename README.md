chromeStorage
=============

angularLocalStorageを参考にchrome extension開発でも使えるようにchrome.storageに対応しました。

## How to use

1. Just add this module to your app as a dependency
``var yourApp = angular.module('yourApp', [..., 'chromeStorage']``
2. Now inside your controllers simply pass the chromeStorage factory like this
``yourApp.controller('yourController', function( $scope, chromeStorage){``
3. Using the ``chromeStorage`` factory
  ```JAVASCRIPT
  // binding it to a $scope.variable (minimal)
  storage.bind($scope,'varName');
  // binding full
  storage.bind($scope,'varName',{defaultValue: 'randomValue123' ,storeName: 'customStoreKey'});
  // the params are ($scope, varName, opts(optional))
  // $scope - pass a reference to whatever scope the variable resides in
  // varName - the variable name so for $scope.firstName enter 'firstName'
  // opts - custom options like default value or unique store name
  // 	Here are the available options you can set:
  // 		* defaultValue: the default value
  // 		* storeName: add a custom store key value instead of using the scope variable name
  // 		* storage: target storage type. "chrome" , "local" , "cookie". default is "chrome"
  // 		* area: target storage area. this option use when storage is "chrome". 

  // will constantly be updating $scope.viewType
  // to change the variable both locally in your controller and in localStorage just do
  $scope.viewType = 'ANYTHING';
  // that's it, it will be updated in localStorage

  // just storing something in localStorage with cookie backup for unsupported browsers
  storage.set($scope,'key','value',opts);
  // getting that value
  storage.get($scope,'key',opts);

  // clear all localStorage values
  storage.clearAll($scope,opts);
