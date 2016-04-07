"use strict";
app.controller("editObjectiveCtrl", function($scope){
  $scope.objective = {};

  let tab;

  $scope.stopWatching = $scope.$watch('objective.name', function(){ //Once name is entered
    if(!$scope.objective.name)
      return;
    if(!tab)
      tab = $scope.$parent.getTabByID($scope.tabID);
    tab.name = strLimit("Objective: "+$scope.objective.name);
  });

  $scope.submitObjective = function(){
    if(!$scope.objective.name)
      return;
    new CourseUtils($scope.class).createObjective($scope.objective.name);
    $scope.cleanup();
  };

  $scope.cleanup = function(){
    $scope.stopWatching();
    $scope.$parent.closeTab($scope.tabID);
  };
  $scope.requestFocus = function(){
    setTimeout(function(){
      document.getElementById("objectiveName"+$scope.tabID).focus();
    },200); //Delay until animation starts
  };
});