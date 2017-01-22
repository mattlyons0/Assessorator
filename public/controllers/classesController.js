"use strict";
app.controller("classesCtrl", function ($scope, $mdDialog,$sce,$uibModal) {
  $scope.readingDisk = true;
  $scope.readError = undefined;

  if(!UI.stateCreated()) {
    UI.onStateCreate(() => {
      $scope.$apply(() => {
        $scope.classes = UI.getClasses();
        $scope.readingDisk = false;
      })
    });
  } else {
    $scope.classes = UI.getClasses();
    $scope.readingDisk = false;
  }

  $scope.addClass = function (event,id) {
    let scope = $scope.$new(); //Makes current scope parent
    if(id != undefined) {
      scope.classID = id;
      scope.edit = true;
    }

    $uibModal.open({
      templateUrl: 'views/editClass.html',
      controller: CreateClassController,
      bindings: {
        close: '&',
        dismiss: '&'
      },
      scope: scope,
      keyboard: false,
      backdrop: 'static',
      size: 'lg'
    });
  };
  $scope.editClass = function(event,id){
    $scope.addClass(event,id);
  };
  $scope.deleteClass = function(id){
    let course = UI.getClassById(id);
    let topics = course.topics.length-1;
    let objectives = course.objectives.length;
    let assessments = course.assessments.length;
    let questions = 0;
    for(let topic of course.topics){
      questions+=topic.questions.length;
    }
    let deleteArr = [];
    if(questions)
      deleteArr.push("<b>"+questions + " question"+(questions>1?'s</b>':'</b>'));
    if(topics)
      deleteArr.push("<b>"+topics + " topic"+(topics>1?'s</b>':'</b>'));
    if(objectives)
      deleteArr.push("<b>"+objectives + " objective"+(objectives>1?'s</b>':'</b>'));
    if(assessments) {
      deleteArr.push("<b>"+assessments + " assessment"+(assessments>1?'s</b>':'</b>'));
    }

    let deleteStr = "";
    for(let i=0;i<deleteArr.length;i++){
      if(i+2<deleteArr.length){
        deleteStr+=deleteArr[i]+', ';
      } else if(i+1<deleteArr.length){
        deleteStr+=deleteArr[i]+' and ';
      } else { //Last element
        deleteStr+=deleteArr[i]+'.';
      }
    }
    let courseDescrip = course.courseID + ', ' + course.courseName + ' ' + course.courseSemester + ' ' + course.courseYear;
    if(!deleteStr.trim()){
      deleteStr = courseDescrip;
      courseDescrip = "";
    }
    let header = '<div class="list-group flex" style="margin-bottom:0"><div class="list-group-item alert-danger"><h3 style="margin-top:10px">'
          +'<h3>Are You Sure You Would Like to Delete '+ course.courseID +'?</h3></div><li class="list-group-item">';
    let html = courseDescrip + '<br/><br/><div class="text-danger">This will delete: '+deleteStr+'</div></li>';
    let buttons ='<div style="padding: 5px; text-align:right"> <button type="button" class="btn btn-default" ng-click="dismiss()" style="margin-right:2px">Cancel</button>'
      +'<button type="button" class="btn btn-danger" ng-click="close()"><b>Delete</b></button></div>';
    let confirm = $uibModal.open({
      template: header+html+buttons,
      controller: function($scope,$uibModalInstance){
        $scope.close = $uibModalInstance.close;
        $scope.dismiss = $uibModalInstance.dismiss;
      }
    });
    confirm.result.then(function(){
      html='<div class="text-danger">This operation cannot be reversed. '+courseDescrip+' will be deleted.</div></li>';
      let lastChance = $uibModal.open({
        template: header+html+buttons,
        controller: function($scope,$uibModalInstance){
          $scope.close = $uibModalInstance.close;
          $scope.dismiss = $uibModalInstance.dismiss;
        }
      });
      lastChance.result.then(function(){
        UI.deleteClass(id);
      },
      function(){
        //Didn't delete
      });
    }, function(){
      //Didn't delete
    });
  };

  $scope.getClassQuestions = function(id) {
    let courseUtil = new CourseUtils(UI.getClassById(id));
    return courseUtil.countQuestions();
  };

  $scope.classesMenu = [
    ['Edit Course', function ($itemScope, $event) {
      $scope.editClass($event,$itemScope.class.ID);
    }],
    null, //divider
    ['Delete Course', function ($itemScope, $event) {
      $scope.deleteClass($itemScope.class.ID);
    }]
  ];

  $scope.viewClass = function (classID) {
    $scope.$parent.page.classID = classID;
    $scope.$parent.page.URL = 'classView.html';
  };

  $scope.dbReadError = function(errorType){
    let name = require('../package.json').name;
    $scope.$apply($scope.readError = true);
    if(errorType == 'dom'){
      $scope.readErrorText = $sce.trustAsHtml("Error opening database. Please ensure no other instances of "+name+" are open then " +
        "<a href='javascript:document.location.reload()'>Retry</a>.");
    } else if(errorType == 'version'){
      $scope.readErrorText = $sce.trustAsHtml("Error opening database, invalid version. See " +
        "<a href='javascript:require(\"electron\").remote.getCurrentWindow().toggleDevTools();'>console</a> for more information.");
    } else if(errorType == 'blocked'){
      $scope.readErrorText = $sce.trustAsHtml("Error opening database. Please ensure no other instances of "+name+" are open then " +
        "<a href='javascript:document.location.reload()'>Retry</a>.");
    } else if(errorType == 'unknown'){
      $scope.readErrorText = $sce.trustAsHtml("Error opening database. See " +
        "<a href='javascript:require(\"electron\").remote.getCurrentWindow().toggleDevTools();'>console</a> for more information. " +
        "<a href='javascript:document.location.reload()'>Retry</a>")
    }
  };
});

function CreateClassController($scope, $uibModalInstance) {
  if($scope.classID == undefined) {
    $scope.class = {
      name: "",
      id: "",
      semester: "",
      year: new Date().getFullYear(),
      objectives: []
    };
  } else { //We are editing a class
    let course = UI.getClassById($scope.classID);
    $scope.class = {
      name: course.courseName,
      id: course.courseID,
      semester: course.courseSemester,
      year: course.courseYear,
      objectives: course.objectives
    };
  }
  $scope.semesters = ("Fall Spring Summer").split(' ');

  $scope.submit = function () {
    if ($scope.class.id) {
      if(!$scope.edit) {
        let courseID = UI.createClass($scope.class.name, $scope.class.id, $scope.class.semester, $scope.class.year?$scope.class.year:'');

        UI.save(UI.getClassById(courseID));
      } else { //Editing
        let course = UI.getClassById($scope.classID);
        course.courseName = $scope.class.name;
        course.courseID = $scope.class.id;
        course.courseSemester = $scope.class.semester;
        course.courseYear = $scope.class.year?$scope.class.year:'';

        UI.save(course);
      }
      $uibModalInstance.close();
    } else{
      angular.element(document.querySelector('#classID')).css('border-color','red');
      angular.element(document.querySelector('#classID')).css('background-color','lightPink');
      angular.element(document.querySelector('#classID')).attr('placeholder','Required')
    }
  };
  $scope.cancel = function (event) {
    $uibModalInstance.dismiss();
  };
}
