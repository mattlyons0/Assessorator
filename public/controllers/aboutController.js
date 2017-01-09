"use strict";
app.controller("aboutCtrl", function($scope){
  $scope.pkg = require('../package.json');
});