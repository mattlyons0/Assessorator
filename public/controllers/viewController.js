"use strict";
app.controller("viewCtrl", function ($scope) {
  $scope.page = {};
  $scope.page.URL = 'classes.html';

  $scope.printPageData = function () {
    console.log($scope.page)
  };
});