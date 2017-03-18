"use strict";
app.controller("viewCtrl", function ($scope, $uibModal, $document,$mdToast, ngToast, $sce) {
  var process = require('process');
  UI.setToastVar(ngToast,$sce);

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
    let aboutModal = $uibModal.open({
      templateUrl: 'views/about.html'
    });
  };

  $scope.settings = function(){
    let settingsModal = $uibModal.open({
      templateUrl: 'views/settings.html',
      size: 'lg',
      keyboard: false,
      backdrop: 'static'
    });
  };
});