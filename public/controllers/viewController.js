"use strict";
app.controller("viewCtrl", function ($scope, $window) {
  var process = require('process');
  $scope.page = {};
  $scope.page.URL = 'classes.html';

  if(process.env.NODE_ENV === 'dev'){
    UI.createClass("Dummy Class","DUM 100","Fall",2015);
    UI.getClasses()[0].createTopic('Dummy Topic','A Topic created for the purposes of testing.');
  }

  $scope.printPageData = function () {
    console.log($scope.page)
  };
});