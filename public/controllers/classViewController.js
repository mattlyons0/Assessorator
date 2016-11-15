"use strict";

app.controller("classViewCtrl", function ($scope,$timeout,$mdDialog, $mdToast, $sce) {
  $scope.class = UI.getClassById($scope.$parent.page.classID);
  $scope.tabs = [];
  let nextID = 0;

  $scope.questionCount = new CourseUtils($scope.class).countQuestions();

  //Used for accordions
  $scope.assessmentOpen = [];
  $scope.topicOpen = [];
  $scope.objectiveOpen = [];
  $scope.questionOpen = [];

  $scope.createTopic = function(){
    createTab("New Topic","views/editTopic.html","editTopicCtrl");

    //Remove popup from new question topic chooser UI
    if(document.querySelector("#topicChooserInput")) {
      $timeout(function () { //Delay until after current $apply
        document.querySelector("#topicChooserInput").blur();
        angular.element(document.querySelector('md-virtual-repeat-container')).triggerHandler('mouseleave');
      }, 50); //Less than this seems to screw with the animation
    }
  };
  $scope.editTopic = function(id){
    createTab("Edit Topic","views/editTopic.html","editTopicCtrl",{topicID: id});
  };
  $scope.deleteTopic = function(id){
    let topic = new CourseUtils($scope.class).getTopic(id);
    if(id == 0){
      showToast("Cannot delete '"+topic.topicName+"' as it is the topic questions without a topic are shown under.",$mdToast);
      return;
    }

    if(topic.questions.length > 0){
      showToast("'"+topic.topicName+"' contains "+topic.questions.length+" question"+(topic.questions.length>1?'s':'')+
        ". All questions must be "+"removed from a topic before it can be deleted.",$mdToast);
      return;
    }
    let confirm = $mdDialog.confirm().title('Are you sure you would like to delete Topic \''+topic.topicName+'\'?')
      .ok('Delete').cancel('Cancel');
    $mdDialog.show(confirm).then(function(){
      new CourseUtils($scope.class).deleteTopic(id);

      UI.save($scope.class);
      $scope.selectedTopic = undefined;
    }, function(){
      //You didn't delete it.
    });
  };
  $scope.createQuestion = function(){
    createTab("New Question", "views/editQuestion.html","editQuestionCtrl", {callback: $scope.updateQuestionCount});
  };
  $scope.editQuestion = function(uid){
    if(uid.topic === undefined){
      uid = angular.fromJson(uid);
    }
    createTab("Edit Question", "views/editQuestion.html","editQuestionCtrl",{questionID: uid.question,topicID: uid.topic, callback: $scope.updateQuestionCount});
  };
  $scope.deleteQuestion = function(uid){
    let courseUtil = new CourseUtils($scope.class);
    let question = courseUtil.getQuestion(uid);
    let confirm = $mdDialog.confirm().title('Are you sure you would like to delete Question \''+question.questionTitle+'\'?')
      .ok('Delete').cancel('Cancel');
    $mdDialog.show(confirm).then(function(){
      new TopicUtils(courseUtil.getTopic(question.topicID)).deleteQuestion(question.ID);

      UI.save($scope.class);
      $scope.updateQuestionCount();
    }, function(){
      //You didn't delete it.
    });
  };
  $scope.createObjective = function(){
    createTab("New Objective","views/editObjective.html","editObjectiveCtrl");

    //Remove popup from new question topic chooser UI
    if(document.querySelector("#objectiveChooserInput")) {
      $timeout(function () { //Delay until after current $apply
        document.querySelector("#objectiveChooserInput").blur();
        angular.element(document.querySelectorAll('md-virtual-repeat-container')[1]).triggerHandler('mouseleave');
      }, 50); //Less than this seems to screw with the animation
    }
  };

  $scope.editObjective = function(id){
    createTab("New Objective","views/editObjective.html","editObjectiveCtrl", {objectiveID: id});
  };
  $scope.deleteObjective = function(id){
    let courseUtil = new CourseUtils($scope.class);
    let objective = courseUtil.getObjective(id);
    let confirm = $mdDialog.confirm().title('Are you sure you would like to delete Objective \''+objective.objectiveText+'\'?')
      .ok('Delete').cancel('Cancel');
    $mdDialog.show(confirm).then(function(){
     courseUtil.deleteObjective(id);

      UI.save($scope.class);
    }, function(){
      //You didn't delete it.
    });
  };
  $scope.createAssessment = function(){
    createTab("New Assessment", "views/editAssessment.html","editAssessmentCtrl");
  };
  $scope.editAssessment = function(id){
    createTab("New Assessment", "views/editAssessment.html","editAssessmentCtrl", {assessmentID: id});
  };
  $scope.deleteAssessment = function(id){
    let assessment = new CourseUtils($scope.class).getAssessment(id);
    let confirm = $mdDialog.confirm().title('Are you sure you would like to delete Assessment \''+assessment.assessmentName+'\'?')
      .ok('Delete').cancel('Cancel');
    $mdDialog.show(confirm).then(function(){
      new CourseUtils($scope.class).deleteAssessment(id);

      UI.save($scope.class);
    }, function(){
      //You didn't delete it.
    });
  };
  $scope.getClassQuestions = function() {
    let courseUtil = new CourseUtils($scope.class);
    return courseUtil.countQuestions();
  };

  $scope.deleteQuestions = function(){
    $scope.data = {};
    $scope.getTabByID(-1).data.searchQuestions = {};
    $scope.searchQuestions('Delete Questions', {type: 'delete', callbackTID: -1});
    $scope.stopWatching2 = $scope.$watch('getTabByID(-1).data.searchQuestions.complete', function () {
      if ($scope.getTabByID(-1).data.searchQuestions.complete === true) { //Search for manual questions is complete
        $scope.stopWatching2();
        //Detect selected questions
        let toDelete = [];
        if($scope.data.searchQuestions.questions) {
          for (let deleteQuestion of $scope.data.searchQuestions.questions) {
            toDelete.push(deleteQuestion);
          }
        }
        if(!toDelete.length){
          return;
        }

        let confirm = $mdDialog.confirm().title('Are you sure you would like to delete '+toDelete.length+' question'+
          (toDelete.length>1?'s':'')+'?')
          .textContent('This action is not reversible').ok('Delete').cancel('Cancel');
        $mdDialog.show(confirm).then(function () {
          let courseUtil = new CourseUtils($scope.class);
          for(let deleteQuestion of toDelete){
            let topic = courseUtil.getTopic(deleteQuestion.topicID);
            let topicUtil = new TopicUtils(topic);
            topicUtil.deleteQuestion(deleteQuestion.questionID);
          }
        }, function () {
          //You didn't do it.
        });
      }
    })
  };
  $scope.searchQuestions = function(tabName,data){
    if(!tabName)
      tabName="Search Questions";
    createTab(tabName,"views/searchQuestions.html","searchQuestionsCtrl",data);
  };

  $scope.updateQuestionCount = function(){
    $scope.questionCount = new CourseUtils($scope.class).countQuestions();
  };
  
  $scope.getAllQuestions = function(){
    return UI.getAllQuestionsForClass($scope.class.ID);
  };

  $scope.selectTopic = function(topicID){
    if(topicID === undefined)
      return;
    if($scope.selectedTopic != undefined)
      document.querySelector('#topic'+$scope.selectedTopic.ID).style.background='transparent';
    $scope.selectedTopic = new CourseUtils($scope.class).getTopic(topicID);
    document.querySelector('#topic'+$scope.selectedTopic.ID).style.background='#E8E8E8';
  };

  $scope.importQuestions = function(){
    createTab("Import Questions", "views/importQuestions.html","importQuestionsCtrl");
  };
  
  $scope.exportAssessment = function(assessmentID){
    createTab("Export Assessment", "views/exportAssessment.html","exportAssessmentCtrl",{assessmentID: assessmentID});
  };
  
  $scope.determineListClass = function(var2){
    if(var2)
      return 'md-2-line';
    else
      return 'md-2-line md-1-line';
  };

  $scope.assessmentBadge = function(assessment){
    let out = '';
    if(assessment.questions.length == 0 && assessment.rules.length == 0)
      return '0 Questions, 0 Rules';
    if(assessment.rules.length != 0)
      out += assessment.rules.length+' Rule'+(assessment.rules.length!=1?'s':'');
    if(assessment.questions.length != 0) {
      if (out.length > 0)
        out += ', ';
      out += assessment.questions.length + ' Question' + (assessment.questions.length != 1 ? 's' : '');
    }
    return out;
  };

  $scope.questionBadgeTopic = function(question){
    let courseUtil = new CourseUtils($scope.class);
    let topic = courseUtil.getTopic(question.topicID);
    return 'Topic: '+topic.topicName;
  };

  $scope.questionBadgeObjectives = function(question){
    let out = 'Objective';
    if(question.objectives.length != 1)
      out+='s';
    out+=': ';
    for(let i=0;i<question.objectives.length;i++){
      if(i != 0)
        out+=', ';
      out+=question.objectives[i].objectiveText;
    }

    return out;
  };

  $scope.formatAssessmentRule = function (rule) {
    let output = rule.numRequired + ' Question'+ (rule.numRequired!=1?'s':'') +' from ';
    let property = ''; // objectives or topic
    let property2 = ''; // objectiveName or topicName
    if(rule.type == 'Objective'){
      property = 'objectives';
      property2 = 'objectiveText';
      output += 'Objective';
    } else if(rule.type == 'Topic'){
      property = 'topics';
      property2 = 'topicName';
      output += 'Topic';
    } else {
      return '<p class="text-danger">Error: Rule without an Objective or Topic</p>';
    }

    if(rule[property].length != 1){
      output += 's: ';
    } else{
      output += ': ';
    }
    for (let i = 0; i < rule[property].length; i++) {
      if (rule[property][i][property2]) {
        let click = '';
        if(property == 'topics'){
          click='editTopic('+rule[property][i].ID+')';
        } else if(property == 'objectives'){
          click='editObjective('+rule[property][i].ID+')';
        } else{
          console.error('Error, property not topic or objective: '+property);
          return;
        }
        output += '<a href="#" ng-click="' + click + '">' + rule[property][i][property2] + '</a>';
      }

      if (i < rule[property].length - 2)
        output += ", ";
      else if (i < rule[property].length - 1)
        output += " and ";
    }
    return output;
  };

  $scope.formatAssessmentQuestion = function(question) {
    let jsonUID = angular.toJson(question.UID).replace('"/g','\"');
    return '<a href="#" ng-click=\'editQuestion('+jsonUID+')\'>'+question.questionTitle + '</a> ' + $scope.formatQuestionType(question);
  };

  $scope.formatQuestionType = function(question){
    let out = '<span class="text-muted">';
    let trueCount = 0;
    for(let answer of question.answers){
      if (answer.correct == true)
        trueCount++;
    }
    if (trueCount > 1)
      out += 'Multiple Answers';
    else if(question.answers.length == 2 && question.answers[0].answerText == 'True' && question.answers[1].answerText == 'False')
      out += 'True/False';
    else
      out += 'Multiple Choice';
    out += '</span>';
    return out;
  };

  $scope.formatObjectiveQuestion = function(questionUID) {
    let courseUtil = new CourseUtils($scope.class);
    return $scope.formatAssessmentQuestion(courseUtil.getQuestion(questionUID));
  };

  $scope.formatQuestionAnswers = function(question){
    let out = '';
    for(let answer of question.answers){
      out+=answer.answerText;
      if(answer.correct)
        out+='<span class="badge" style="margin-left:5px; background-color:#337ab7">Correct</span>';
      if(answer.pinned)
        out+='<span class="badge" style="margin-left:5px">Pinned</span>';
      out+='<br/>'
    }

    return $sce.trustAsHtml(out);
  };

  $scope.formatQuestionTopicObjectives = function(question){
    let topic = new CourseUtils($scope.class).getTopic(question.topicID);
    let out = 'Topic: <a href="#" ng-click="editTopic('+topic.ID+')">'+topic.topicName+'</a>';
    if(question.objectives.length){
      out+='<br/>Objectives: ';
    }
    for(let i=0;i<question.objectives.length;i++){
      let obj = question.objectives[i];
      out+='<a href="#" ng-click="editObjective('+obj.ID+')">'+obj.objectiveText+'</a>';
      if(i+1 != question.objectives.length)
        out+=', ';
    }

    return out;
  };

  $scope.topicBadge = function(topic){
    let out = topic.questions.length + ' Question';
    if(topic.questions.length != 1){
      out+='s';
    }
    return out;
  };

  $scope.objectiveBadge = function(objective){
    let questions = objective.questionUIDs;
    let out = questions.length + ' Question';
    if(questions.length != 1){
      out+='s';
    }
    return out;
  };

  $scope.iterateAccordion = function(accordionArray,value,count){
    for(let i=0;i<count;i++){
      accordionArray[i]=value;
    }
  };

  $scope.floatingScrollListener = function(cssChangeElem,srcElem){
    let elem = angular.element(document.querySelector('#'+cssChangeElem));
    let src = angular.element(document.querySelector('#'+srcElem))[0];
    if (src.scrollTop != 0) {
      elem.css('border-bottom', '1px solid #ddd');
    } else{
      elem.css('border-bottom','');
    }
  };

  $scope.repairObjectives = function(){
    //Repair Question pointers to objectives
    for(let objective of $scope.class.objectives) {
      objective.questionUIDs = [];
      let objectiveUtil = new ObjectiveUtils(objective);
      let courseUtil = new CourseUtils($scope.class);
      for (let topic of $scope.class.topics) {
        for (let question of topic.questions) {
          for (let obj of question.objectives) {
            if (obj.ID == objective.ID && question.UID !== undefined) {
              objectiveUtil.addQuestionUID(question.UID);
            }
          }
        }
      }
    }
    UI.save($scope.class);
  };

  $scope.goBack = function () {
    if($scope.tabs.length > 0) {
      let confirm = $mdDialog.confirm().title('Are you sure you would like to go back?')
        .textContent('All open tabs will be closed.').ok('Go Back').cancel('Cancel');
      $mdDialog.show(confirm).then(function () {
        back();
      }, function () {
        //You didn't do it.
      });
    } else{
      back();
    }

    function back(){
      $scope.$parent.page.classID = undefined;
      $scope.$parent.page.URL = 'classes.html';
    }
  };

  $scope.closeTab = function(tabID){
    for(let x=0;x<$scope.tabs.length;x++){
      if($scope.tabs[x].id === tabID){
        $scope.tabs.splice(x,1);
      }
    }
  };

  $scope.getTabByID = function(tabID){
    if(tabID === -1){
      return $scope;
    }

    for(let x=0;x<$scope.tabs.length;x++){
      if($scope.tabs[x].id === tabID){
        return $scope.tabs[x];
      }
    }
    console.error('No tab found with ID: '+tabID);
  };

  function createTab(tabName,contentURL,ctrl,data){
    if(!data)
      data = {};
    
    let tab = {
      id: nextID,
      name: tabName,
      URL: contentURL,
      controller: ctrl,
      data: data
    };
    nextID++;
    $scope.tabs.push(tab);
    
    return tab.id;
  }


  /********************************
  *  Right Click Menu Definitions
  ********************************/

  // Tab Headings
  $scope.assessmentsHeading = [
    ['Create Assessment', function ($itemScope, $event) {
      $scope.createAssessment();
    }]
  ];
  $scope.topicsHeading = [
    ['Create Topic', function ($itemScope, $event) {
      $scope.createTopic();
    }]
  ];
  $scope.objectivesHeading = [
    ['Create Objective', function ($itemScope, $event) {
      $scope.createObjective();
    }]
  ];
  $scope.questionsHeading = [
    ['Create Question', function ($itemScope, $event) {
      $scope.createQuestion();
    }]
  ];

  // Accordion Headings
  $scope.assessmentHeader = [
    ['Edit Assessment', function($itemScope,$event){
      $scope.editAssessment($itemScope.assessment.ID);
    }],
    null,
    ['Delete Assessment', function($itemScope,$event){
      $scope.deleteAssessment($itemScope.assessment.ID);
    }]
  ];
  $scope.topicHeader = [
    ['Edit Topic', function($itemScope,$event){
      $scope.editTopic($itemScope.topic.ID);
    }],
    null,
    ['Delete Topic', function($itemScope,$event){
      $scope.deleteTopic($itemScope.topic.ID);
    }]
  ];
  $scope.objectiveHeader = [
    ['Edit Objective', function($itemScope,$event){
      $scope.editObjective($itemScope.objective.ID);
    }],
    null,
    ['Delete Objective', function($itemScope,$event){
      $scope.deleteObjective($itemScope.objective.ID);
    }]
  ];
  $scope.questionHeader = [
    ['Edit Question', function($itemScope,$event){
      $scope.editQuestion($itemScope.question.UID);
    }],
    null,
    ['Delete Question', function($itemScope,$event){
      $scope.deleteQuestion($itemScope.question.UID);
    }]
  ];
});