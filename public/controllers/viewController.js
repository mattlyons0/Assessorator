"use strict";
app.controller("viewCtrl", function ($scope, $window) {
  var process = require('process');
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
  }
});