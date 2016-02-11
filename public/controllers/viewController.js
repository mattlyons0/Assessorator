"use strict";
app.controller("viewCtrl", function ($scope) {
  var process = require('process');
  $scope.page = {};
  $scope.page.URL = 'classes.html';

  if(process.env.NODE_ENV === 'dev'){
    UI.createClass("Dummy Class","DUM 100","Fall",2015);
  }

  $scope.printPageData = function () {
    console.log($scope.page)
  };
});