"use strict";

app.controller("classViewCtrl", function ($scope,$timeout,$mdDialog, $mdToast, $sce, $filter) {
  $scope.class = UI.getClassById($scope.$parent.page.classID);
  $scope.tabs = [];
  let nextID = 0;

  $scope.questionCount = new CourseUtils($scope.class).countQuestions();

  //Used for accordions
  $scope.assessmentOpen = [];
  $scope.topicOpen = [];
  $scope.objectiveOpen = [];
  $scope.questionOpen = [];

  //Used for filters
  $scope.questionsFilter = {
    open: false,

    query: '',
    topicQuery: '',
    objectiveQuery: '',

    searchQuestions: true,
    searchDescriptions: false,
    searchAnswers: false,
    caseSensitive: false
  };
  $scope.objectivesFilter = {
    open: false,

    query: '',
    caseSensitive: false
  };
  $scope.topicsFilter = {
    open: false,

    query: '',
    searchTopics: true,
    searchDescriptions: false,
    caseSensitive: false
  };
  $scope.assessmentsFilter = {
    open: false,

    query: '',
    topicQuery: '',
    objectiveQuery: '',

    searchNames: true,
    searchDescriptions: false,
    searchQuestions: false,
    caseSensitive: false
  };


  $scope.filterTopics = function(){
    let topics = $scope.class.topics;
    if(!$scope.topicsFilter.open || !$scope.topicsFilter.query)
      return topics;
    let out = new Set();
    for(let topic of topics){
      if($scope.topicsFilter.searchTopics){
        if($scope.topicsFilter.caseSensitive && topic.topicName.includes($scope.topicsFilter.query) ||
            !$scope.topicsFilter.caseSensitive && topic.topicName.toLowerCase().includes($scope.topicsFilter.query.toLowerCase()))
          out.add(topic);
      }
      if($scope.topicsFilter.searchDescriptions){
        if($scope.topicsFilter.caseSensitive && topic.topicDescription.includes($scope.topicsFilter.query) ||
          !$scope.topicsFilter.caseSensitive && topic.topicDescription && topic.topicDescription.toLowerCase().includes($scope.topicsFilter.query.toLowerCase()))
          out.add(topic);
      }
    }
    return Array.from(out);
  };

  $scope.filterObjectives = function(){
    let objectives = $scope.class.objectives;
    if(!$scope.objectivesFilter.open || !$scope.objectivesFilter.query)
      return objectives;
    let out = [];
    for(let objective of objectives){
      if($scope.objectivesFilter.caseSensitive && objective.objectiveText.includes($scope.objectivesFilter.query) ||
          !$scope.objectivesFilter.caseSensitive && objective.objectiveText.toLowerCase().includes($scope.objectivesFilter.query.toLowerCase()))
        out.push(objective);
    }
    return out;
  };

  $scope.filterAssessments = function(){
    let assessments = $scope.class.assessments;
    if(!$scope.assessmentsFilter.open || (!$scope.assessmentsFilter.query && !$scope.assessmentsFilter.topicQuery && !$scope.assessmentsFilter.objectiveQuery))
      return assessments;

    let remain = [];
    if($scope.assessmentsFilter.topicQuery){
      for(let assessment of assessments){
        let found = false;
        for(let rule of assessment.rules){
          if(found)
            break;
          for(let topic of rule.topics){
            if(topic.ID == $scope.assessmentsFilter.topicQuery.ID) {
              remain.push(assessment);
              found = true;
              break;
            }
          }
        }
      }
    } else{
      remain = assessments;
    }
    if($scope.assessmentsFilter.objectiveQuery) {
      for (let i=0;i<remain.length;i++) {
        let assessment = remain[i];
        let found = false;
        for (let rule of assessment.rules){
          for(let objective of rule.objectives){
            if(objective.ID == $scope.assessmentsFilter.objectiveQuery.ID){
              found = true;
            }
          }
        }
        if(!found){
          remain.splice(i,1);
          i--;
        }
      }
    }

    let out = new Set(); //Doesn't allow duplicates
    for(let assessment of remain) {
      if ($scope.assessmentsFilter.searchNames) {
        if ($scope.assessmentsFilter.caseSensitive && assessment.assessmentName.includes($scope.assessmentsFilter.query) ||
          (!$scope.assessmentsFilter.caseSensitive && assessment.assessmentName.toLowerCase().includes($scope.assessmentsFilter.query.toLowerCase())))
          out.add(assessment);
      }
      if ($scope.assessmentsFilter.searchDescriptions){
        if ($scope.assessmentsFilter.caseSensitive && assessment.assessmentDescription.includes($scope.assessmentsFilter.query) ||
          (!$scope.assessmentsFilter.caseSensitive && assessment.assessmentDescription.toLowerCase().includes($scope.assessmentsFilter.query.toLowerCase())))
          out.add(assessment);
      }
      if ($scope.assessmentsFilter.searchQuestions){
        for(let question of assessment.questions){
          if ($scope.assessmentsFilter.caseSensitive && question.questionTitle.includes($scope.assessmentsFilter.query) ||
            (!$scope.assessmentsFilter.caseSensitive && question.questionTitle.toLowerCase().includes($scope.assessmentsFilter.query.toLowerCase())))
            out.add(assessment);
        }
      }
    }

    return Array.from(out);
  };

  $scope.filterQuestions = function(){
    let questions;
    if($scope.questionsFilter.open && $scope.questionsFilter.topicQuery){
      questions = [];
      for(let topic of $scope.class.topics){
        if(topic.ID == $scope.questionsFilter.topicQuery.ID){
          for(let question of topic.questions){
            questions.push(question);
          }
        }
      }
    } else{
      questions = $scope.getAllQuestions();
    }
    if($scope.questionsFilter.open && $scope.questionsFilter.objectiveQuery){
      for(let i=0;i<questions.length;i++){
        let containsObj = false;
        for(let obj of questions[i].objectives){
          if(obj.ID == $scope.questionsFilter.objectiveQuery.ID) {
            containsObj = true;
            break;
          }
        }
        if(!containsObj){
          questions.splice(i, 1); //Delete current index
          i--;
        }
      }
    }
    if(!$scope.questionsFilter.open || !$scope.questionsFilter.query)
      return questions;

    let out = new Set(); //Doesn't allow duplicates
    for(let question of questions) {
      if ($scope.questionsFilter.searchQuestions) {
        if ($scope.questionsFilter.caseSensitive && question.questionTitle.includes($scope.questionsFilter.query) ||
          (!$scope.questionsFilter.caseSensitive && question.questionTitle.toLowerCase().includes($scope.questionsFilter.query.toLowerCase())))
          out.add(question);
      }
      if ($scope.questionsFilter.searchDescriptions){
        if ($scope.questionsFilter.caseSensitive && question.questionDescription.includes($scope.questionsFilter.query) ||
          (!$scope.questionsFilter.caseSensitive && question.questionDescription.toLowerCase().includes($scope.questionsFilter.query.toLowerCase())))
          out.add(question);
      }
      if ($scope.questionsFilter.searchAnswers){
        for(let answer of question.answers){
          if ($scope.questionsFilter.caseSensitive && answer.answerText.includes($scope.questionsFilter.query) ||
            (!$scope.questionsFilter.caseSensitive && answer.answerText.toLowerCase().includes($scope.questionsFilter.query.toLowerCase())))
            out.add(question);
        }
      }
    }

    return Array.from(out);
  };

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

  $scope.assessmentBadgeQuestions = function(assessment){
    return assessment.questions.length + ' Added Question' + (assessment.questions.length != 1 ? 's' : '');
  };
  $scope.assessmentBadgeRules = function(assessment){
    return assessment.rules.length + ' Rule'+ (assessment.rules.length!=1?'s':'');
  };
  $scope.assessmentTotalQuestions = function(assessment){
    let sum = 0;
    for(let rule of assessment.rules)
      sum+=rule.numRequired;
    sum+=assessment.questions.length;
    return sum + ' Total Question' + (sum != 1? 's':'');
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

  $scope.formatAssessmentQuestion = function(question){
    let jsonUID = angular.toJson(question.UID).replace('"/g','\"');
    let highlighted = $filter('highlight')(question.questionTitle,$scope.assessmentsFilter.query,$scope.assessmentsFilter.caseSensitive);
    return '<a href="#" ng-click=\'editQuestion('+jsonUID+')\'>'+ highlighted + '</a> ' + $scope.formatQuestionType(question);
  };

  $scope.formatQuestion = function(question) {
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
      if($scope.questionsFilter.open && $scope.questionsFilter.searchAnswers)
        out+=$filter('highlight')(answer.answerText,$scope.questionsFilter.query,$scope.questionsFilter.caseSensitive);
      else
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
    let out = 'Topic: ';
    if($scope.questionsFilter.topicQuery)
      out+='<span class="ui-select-highlight">';
    out+='<a href="#" ng-click="editTopic('+topic.ID+')">'+topic.topicName+'</a>';
    if($scope.questionsFilter.topicQuery)
      out+='</span>';
    if(question.objectives.length){
      out+='<br/>Objectives: ';
    }
    for(let i=0;i<question.objectives.length;i++){
      let obj = question.objectives[i];
      if($scope.questionsFilter.open && $scope.questionsFilter.objectiveQuery && $scope.questionsFilter.objectiveQuery.ID == obj.ID)
        out+='<span class="ui-select-highlight">';
      out+='<a href="#" ng-click="editObjective('+obj.ID+')">'+obj.objectiveText+'</a>';
      if($scope.questionsFilter.open && $scope.questionsFilter.objectiveQuery && $scope.questionsFilter.objectiveQuery.ID == obj.ID)
        out+='</span>';
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

  $scope.floatingScrollListener = function(srcElem){
    let src = angular.element(document.querySelector('#'+srcElem));
    if (src[0].scrollTop != 0) {
      src.css('border-top', '1px solid #ddd');
    } else{
      src.css('border-top','');
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