"use strict";
app.controller("viewCtrl", function ($scope, $window) {
  var process = require('process');
  $scope.page = {};
  $scope.page.URL = 'classes.html';

  if(process.env.NODE_ENV === 'dev'){
    let n = 5;
    for(let i=0;i<n;i++) {
      UI.createClass("Dummy Class","DUM "+(100+i),"Fall",(2015+i));
      UI.getClasses()[0].createTopic('Dummy Topic '+(i+1),'A Topic created for the purposes of testing.');
      UI.getClasses()[0].topics[0].createQuestion('Dummy Question '+(i+1),'A Question for the purposes of testing.');
      UI.getClasses()[0].topics[0].questions[0].createAnswer('True',false);
      UI.getClasses()[0].topics[0].questions[0].createAnswer('False',true);
      UI.getClasses()[0].createObjective('Test Objective ' + (i + 1));
    }
  }

  $scope.printPageData = function () {
    console.log($scope.page)
  };
});