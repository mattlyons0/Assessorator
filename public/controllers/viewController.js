"use strict";
app.controller("viewCtrl", function ($scope, $mdDialog,$mdToast) {
  $scope.$mdToast = $mdToast;
  var process = require('process');

  let pkg = require('../package.json');

  $scope.page = {};
  $scope.page.URL = 'classes.html';

  $scope.printPageData = function () {
    console.log($scope.page)
  };

  $scope.dataDebug = function(){
    UI.printData();
  };

  $scope.todoList = function(){
    location.replace('todo.html');
  };
  
  $scope.devMode = function(){
    return process.env.NODE_ENV === 'dev';
  };

  $scope.about = function(){
    let versionHtml = 'Version: '+pkg.version+'<br/><br/>';
    $mdDialog.show($mdDialog.alert().parent(angular.element(document.body)).title(pkg.name)
      .htmlContent(versionHtml+pkg.description).ok('Close'));
  };
});