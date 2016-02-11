"use strict";
app.controller("editTopicCtrl", function($scope){
  $scope.topic = {};

  let tab;

  $scope.stopWatching = $scope.$watch('topic.name', function(){ //Once name is entered
    if(!$scope.topic.name)
      return;
    if(!tab)
      tab = $scope.$parent.getTabByID($scope.tabID);
    tab.name = strLimit("Topic: "+$scope.topic.name);
  });

  $scope.submitTopic = function(){
    if(!$scope.topic.name)
      return;
    $scope.$parent.class.createTopic($scope.topic.name,$scope.topic.description);
    $scope.cleanup();
  };

  $scope.cleanup = function(){
    $scope.stopWatching();
    $scope.$parent.closeTab($scope.tabID);
  };
  $scope.requestFocus = function(){
    setTimeout(function(){
      document.getElementById("topicName"+$scope.tabID).focus();
    },200); //Delay until animation starts
  };
});