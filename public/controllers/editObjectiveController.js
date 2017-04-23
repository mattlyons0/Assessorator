"use strict";
app.controller("editObjectiveCtrl", function($scope){
  function init(){
    if ($scope.tabData.objectiveID != undefined){

      let objective = new CourseUtils($scope.class).getObjective($scope.tabData.objectiveID);

      $scope.edit = true;
      $scope.objective.name = objective.objectiveText;
      $scope.objectiveID = objective.ID;
    }
  }

  $scope.objective = {};
  $scope.submitError = false;

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

    if(!$scope.edit){
      new CourseUtils($scope.class).createObjective($scope.objective.name);
    } else{
      let courseUtil = new CourseUtils($scope.class);
      courseUtil.getObjective($scope.objectiveID).objectiveText = $scope.objective.name;
    }

    UI.save($scope.class);
    
    $scope.cleanup();
  };

  $scope.cleanup = function(){
    $scope.stopWatching();
    $scope.$parent.closeTab($scope.tabID);
  };
  $scope.requestFocus = function(){
    setTimeout(function(){
      document.getElementById("objectiveName"+$scope.tabID).focus();
      $scope.resizeTextArea(document.getElementById("objectiveName"+$scope.tabID));
    },0); //Delay until render finishes
    init();
  };
});