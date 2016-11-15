"use strict";
app.controller("classesCtrl", function ($scope, $mdDialog,$sce) {
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
  
  $scope.rightMenu = function ($mdOpenMenu, event) {
    $mdOpenMenu();
  };

  var closeTo = angular.element(document.querySelector('md-list-item:last-child'));
  $scope.addClass = function (event,id) {
    let scope = $scope.$new(); //Makes current scope parent
    if(id != undefined) {
      scope.classID = id;
      scope.edit = true;
    }
    $mdDialog.show({
      controller: CreateClassController,
      templateUrl: 'views/editClass.html',
      parent: angular.element(document.body),
      targetEvent: event,
      clickOutsideToClose: false,
      fullscreen: true,
      scope: scope,
      closeTo: closeTo
    });
  };
  $scope.editClass = function(event,id){
    $scope.addClass(event,id);
  };
  $scope.deleteClass = function(id){
    let course = UI.getClassById(id);
    let topics = course.topics.length;
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
    let confirm = $mdDialog.confirm().title('Are you sure you would like to delete '+ course.courseID +'?')
      .htmlContent(courseDescrip + '<br/><br/>This will delete: '+deleteStr)
      .ok('Delete all of this data').cancel('Cancel').theme('warn');
    $mdDialog.show(confirm).then(function(){
      let finalConfirm = $mdDialog.confirm().title('Are you sure you would like to delete '+ course.courseID +'?')
        .textContent('This operation cannot be reversed.').ok('Yes I am sure').cancel('Cancel').theme('warn');
      $mdDialog.show(finalConfirm).then(function(){
        UI.deleteClass(id);
      }, function(){
        //You backed out
      })
    }, function(){
      //You didn't delete it.
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
        "<a href='javascript:require(\"remote\").getCurrentWindow().toggleDevTools();'>console</a> for more information.");
    } else if(errorType == 'blocked'){
      $scope.readErrorText = $sce.trustAsHtml("Error opening database. Please ensure no other instances of "+name+" are open then " +
        "<a href='javascript:document.location.reload()'>Retry</a>.");
    } else if(errorType == 'unknown'){
      $scope.readErrorText = $sce.trustAsHtml("Error opening database. See " +
        "<a href='javascript:require(\"remote\").getCurrentWindow().toggleDevTools();'>console</a> for more information. " +
        "<a href='javascript:document.location.reload()'>Retry</a>")
    }
  };
});

function CreateClassController($scope, $mdDialog) {
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
      $mdDialog.hide();
    }
  };
  $scope.cancel = function (event) {
    $mdDialog.cancel();
  };
}
