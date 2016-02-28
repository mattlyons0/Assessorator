"use strict";
app.controller("viewCtrl", function ($scope, $window) {
  var process = require('process');
  $scope.page = {};
  $scope.page.URL = 'classes.html';

  if(process.env.NODE_ENV === 'dev'){
    UI.createClass("Dummy Class","DUM 100","Fall",2015);
    UI.getClasses()[0].createTopic('Dummy Topic','A Topic created for the purposes of testing.');
    UI.getClasses()[0].topics[0].createQuestion('Dummy Question 1','A Question for the purposes of testing.');
    UI.getClasses()[0].topics[0].questions[0].createAnswer('The wrong answer',false);
    UI.getClasses()[0].topics[0].questions[0].createAnswer('The right answer',true);
  }

  $scope.printPageData = function () {
    console.log($scope.page)
  };
});