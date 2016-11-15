"use strict";
app.controller("viewCtrl", function ($scope, $uibModal, $document,$mdToast) {
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
    let authorHtml = '<span style="float:right">Written by Matt Lyons &lt;matt@mattlyons.net&gt;</span>';
    let versionHtml = '<span style="float: left">Version: '+pkg.version+'</span>';
    let html = '<div class="list-group flex" style="margin-bottom:0"><div class="list-group-item active"><h2 style="margin-top:10px">'+pkg.name+'</h2></div>'
      +'<li class="list-group-item" style="height:40px">'+versionHtml+authorHtml+'</li>'+'<li class="list-group-item">'+pkg.description+
      '</li></div>';

    let aboutModal = $uibModal.open({
      template: html
    });
  };
});