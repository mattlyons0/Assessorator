"use strict";
app.controller("editAssessmentCtrl", function ($scope, $mdDialog, $mdToast) {
  $scope.assessment = {};

  $scope.submitAssessment = function () {
    if (!$scope.assessment.title)
      return;
    //TODO submission logic
    $scope.class.createAssessment($scope.assessment.title,$scope.assessment.description);
    $scope.cleanup();
  };

  $scope.cleanup = function () {
    $scope.$parent.closeTab($scope.tabID);
  };

  $scope.requestFocus = function () {
    setTimeout(function () {
      document.getElementById("assessmentTitle" + $scope.tabID).focus();
    }, 500); //Delay until animation starts
  };

  let tab;
  $scope.stopWatching = $scope.$watch('assessment.title', function () { //Edit Tab Title
    if (!$scope.assessment.title)
      return;
    if (!tab)
      tab = $scope.$parent.getTabByID($scope.tabID);
    tab.name = strLimit("Assessment: " + $scope.assessment.title);
  });
});