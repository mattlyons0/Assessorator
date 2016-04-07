"use strict";
app.controller("viewCtrl", function ($scope, $window) {
  var process = require('process');
  $scope.page = {};
  $scope.page.URL = 'classes.html';

  $scope.printPageData = function () {
    console.log($scope.page)
  };
});