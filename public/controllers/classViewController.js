'use strict';

app.controller('classViewCtrl', function ($scope,$timeout,$mdDialog, $mdToast, $sce, $filter) {
  $scope.class = UI.getClassById($scope.$parent.page.classID);
  $scope.tabs = [];
  let nextID = 0;
  
  let classView = $scope.class.prefs.classView;
  $scope.classView = classView;
  let courseUtils = new CourseUtils($scope.class);

  $scope.questionCount = courseUtils.countQuestions();

  //Used for accordions
  $scope.assessmentOpen = [];
  $scope.topicOpen = [];
  $scope.objectiveOpen = [];
  $scope.questionOpen = [];

  //Used for filter angular state
  $scope.assessmentsQuery = {
    topic: classView.assessments.filter.topicQuery!==null?courseUtils.getTopic(classView.assessments.filter.topicQuery):null,
    objective: classView.assessments.filter.objectiveQuery!==null?courseUtils.getObjective(classView.assessments.filter.objectiveQuery):null
  };
  $scope.questionsQuery = {
    topic: classView.questions.filter.topicQuery!==null?courseUtils.getTopic(classView.questions.filter.topicQuery):null,
    objective: classView.questions.filter.objectiveQuery!==null?courseUtils.getObjective(classView.questions.filter.objectiveQuery):null
  };

  //Used for sorting
  $scope.sortModes = [
    {name:'Alphabetical (A-Z)', icon: 'glyphicon-sort-by-alphabet', ascending: true, fieldIndex: 0},
    {name: 'Alphabetical (Z-A)', icon: 'glyphicon-sort-by-alphabet-alt', ascending: false, fieldIndex: 0},
    {name: 'Date Added (New-Old)', icon: 'glyphicon-sort-by-order', ascending: false, fieldIndex: 1},
    {name: 'Date Added (Old-New)', icon: 'glyphicon-sort-by-order-alt', ascending: true, fieldIndex: 1}
  ];
  $scope.sortFieldsQuestions = ['questionTitle', 'creationDate'];
  $scope.sortFieldsObjectives = ['objectiveText', 'creationDate'];
  $scope.sortFieldsTopics = ['topicName', 'creationDate'];
  $scope.sortFieldsAssessments = ['assessmentName', 'creationDate'];

  $scope.assessmentsSort = $scope.sortModes[0];

  $scope.sortModeMouseDown = function(event,keyval){
    //Increment or Decrement index based on which mouse button was pressed
    let index = classView[keyval].sort;
    if(event.which === 1) { //Left Click
      index++;
      if(index >= $scope.sortModes.length)
        index = 0;
    }
    else if(event.which === 3) { //Right Click
      index--;
      if(index < 0)
        index = $scope.sortModes.length-1;
    }

    //Change Sort Mode
    classView[keyval].sort = index;
  };
  $scope.getSortParams = function(tabType,sortMode){
    let key;
    sortMode = $scope.sortModes[sortMode];

    if(tabType === 'questions'){
      key=$scope.sortFieldsQuestions[sortMode.fieldIndex];
    } else if(tabType === 'objectives'){
      key=$scope.sortFieldsObjectives[sortMode.fieldIndex];
    } else if(tabType === 'topics'){
      key=$scope.sortFieldsTopics[sortMode.fieldIndex];
    } else if(tabType === 'assessments'){
      key=$scope.sortFieldsAssessments[sortMode.fieldIndex];
    }

    return {key: key, mode: sortMode};
  };


  $scope.filterTopics = function(){
    let topics = $scope.class.topics;
    if(!classView.topics.filter.open || !classView.topics.filter.query)
      return topics;
    let out = new Set();
    for(let topic of topics){
      if(classView.topics.filter.searchTopics){
        if(classView.topics.filter.caseSensitive && topic.topicName.includes(classView.topics.filter.query) ||
            !classView.topics.filter.caseSensitive && topic.topicName.toLowerCase().includes(classView.topics.filter.query.toLowerCase()))
          out.add(topic);
      }
      if(classView.topics.filter.searchDescriptions){
        if(classView.topics.filter.caseSensitive && topic.topicDescription.includes(classView.topics.filter.query) ||
          !classView.topics.filter.caseSensitive && topic.topicDescription && topic.topicDescription.toLowerCase().includes(classView.topics.filter.query.toLowerCase()))
          out.add(topic);
      }
    }
    return Array.from(out);
  };

  $scope.filterObjectives = function(){
    let objectives = $scope.class.objectives;
    if(!classView.objectives.filter.open || !classView.objectives.filter.query)
      return objectives;
    let out = [];
    for(let objective of objectives){
      if(classView.objectives.filter.caseSensitive && objective.objectiveText.includes(classView.objectives.filter.query) ||
          !classView.objectives.filter.caseSensitive && objective.objectiveText.toLowerCase().includes(classView.objectives.filter.query.toLowerCase()))
        out.push(objective);
    }
    return out;
  };

  $scope.filterAssessments = function(){
    let assessments = $scope.class.assessments;
    if(!classView.assessments.filter.open || (!classView.assessments.filter.query && classView.assessments.filter.topicQuery === null && classView.assessments.filter.objectiveQuery === null))
      return assessments;

    let remain = [];
    if(classView.assessments.filter.topicQuery !== null){
      for(let assessment of assessments){
        let found = false;
        for(let rule of assessment.rules){
          if(found)
            break;
          for(let topic of rule.topics){
            if(topic.ID === classView.assessments.filter.topicQuery) {
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
    if(classView.assessments.filter.objectiveQuery !== null) {
      for (let i=0;i<remain.length;i++) {
        let assessment = remain[i];
        let found = false;
        for (let rule of assessment.rules){
          for(let objective of rule.objectives){
            if(objective.ID === classView.assessments.filter.objectiveQuery){
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
      if (classView.assessments.filter.searchNames) {
        if (classView.assessments.filter.caseSensitive && assessment.assessmentName.includes(classView.assessments.filter.query) ||
          (!classView.assessments.filter.caseSensitive && assessment.assessmentName.toLowerCase().includes(classView.assessments.filter.query.toLowerCase())))
          out.add(assessment);
      }
      if (classView.assessments.filter.searchDescriptions){
        if (classView.assessments.filter.caseSensitive && assessment.assessmentDescription.includes(classView.assessments.filter.query) ||
          (!classView.assessments.filter.caseSensitive && assessment.assessmentDescription.toLowerCase().includes(classView.assessments.filter.query.toLowerCase())))
          out.add(assessment);
      }
      if (classView.assessments.filter.searchQuestions){
        for(let question of assessment.questions){
          if (classView.assessments.filter.caseSensitive && question.questionTitle.includes(classView.assessments.filter.query) ||
            (!classView.assessments.filter.caseSensitive && question.questionTitle.toLowerCase().includes(classView.assessments.filter.query.toLowerCase())))
            out.add(assessment);
        }
      }
    }

    return Array.from(out);
  };

  $scope.filterQuestions = function(){
    let questions;
    if(classView.questions.filter.open && classView.questions.filter.topicQuery !== null){
      questions = [];
      for(let topic of $scope.class.topics){
        if(topic.ID === classView.questions.filter.topicQuery){
          for(let question of topic.questions){
            questions.push(question);
          }
        }
      }
    } else{
      questions = $scope.getAllQuestions();
    }
    if(classView.questions.filter.open && classView.questions.filter.objectiveQuery !== null){
      for(let i=0;i<questions.length;i++){
        let containsObj = false;
        for(let obj of questions[i].objectives){
          if(obj.ID === classView.questions.filter.objectiveQuery) {
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
    if(!classView.questions.filter.open || !classView.questions.filter.query)
      return questions;

    let out = new Set(); //Doesn't allow duplicates
    for(let question of questions) {
      if (classView.questions.filter.searchQuestions) {
        if (classView.questions.filter.caseSensitive && question.questionTitle.includes(classView.questions.filter.query) ||
          (!classView.questions.filter.caseSensitive && question.questionTitle.toLowerCase().includes(classView.questions.filter.query.toLowerCase())))
          out.add(question);
      }
      if (classView.questions.filter.searchDescriptions){
        if (classView.questions.filter.caseSensitive && question.questionDescription.includes(classView.questions.filter.query) ||
          (!classView.questions.filter.caseSensitive && question.questionDescription.toLowerCase().includes(classView.questions.filter.query.toLowerCase())))
          out.add(question);
      }
      if (classView.questions.filter.searchAnswers){
        for(let answer of question.answers){
          if (classView.questions.filter.caseSensitive && answer.answerText.includes(classView.questions.filter.query) ||
            (!classView.questions.filter.caseSensitive && answer.answerText.toLowerCase().includes(classView.questions.filter.query.toLowerCase())))
            out.add(question);
        }
      }
    }

    return Array.from(out);
  };

  $scope.createTopic = function(){
    createTab('New Topic','views/editTopic.html','editTopicCtrl');

    //Remove popup from new question topic chooser UI
    if(document.querySelector('#topicChooserInput')) {
      $timeout(function () { //Delay until after current $apply
        document.querySelector('#topicChooserInput').blur();
        angular.element(document.querySelector('md-virtual-repeat-container')).triggerHandler('mouseleave');
      }, 50); //Less than this seems to screw with the animation
    }
  };
  $scope.editTopic = function(id){
    createTab('Edit Topic','views/editTopic.html','editTopicCtrl',{topicID: id});
  };
  $scope.deleteTopic = function(id){
    let topic = new CourseUtils($scope.class).getTopic(id);
    if(id === 0){
      showToast('Cannot delete \''+topic.topicName+'\' as it is the topic questions without a topic are shown under.', {level: 'warning', delay: 7});
      return;
    }

    if(topic.questions.length > 0){
      showToast('\''+topic.topicName+'\' contains '+topic.questions.length+' question'+(topic.questions.length>1?'s':'')+
        '.All questions must be '+'removed from a topic before it can be deleted.',{level: 'warning', delay:10});
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
    createTab('New Question', 'views/editQuestion.html','editQuestionCtrl', {callback: $scope.updateQuestionCount});
  };
  $scope.editQuestion = function(uid){
    if(uid.topic === undefined){
      uid = angular.fromJson(uid);
    }
    createTab('Edit Question', 'views/editQuestion.html','editQuestionCtrl',{questionID: uid.question,topicID: uid.topic, callback: $scope.updateQuestionCount});
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
    createTab('New Objective','views/editObjective.html','editObjectiveCtrl');

    //Remove popup from new question topic chooser UI
    if(document.querySelector('#objectiveChooserInput')) {
      $timeout(function () { //Delay until after current $apply
        document.querySelector('#objectiveChooserInput').blur();
        angular.element(document.querySelectorAll('md-virtual-repeat-container')[1]).triggerHandler('mouseleave');
      }, 50); //Less than this seems to screw with the animation
    }
  };

  $scope.editObjective = function(id){
    createTab('New Objective','views/editObjective.html','editObjectiveCtrl', {objectiveID: id});
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
    createTab('New Assessment', 'views/editAssessment.html','editAssessmentCtrl');
  };
  $scope.editAssessment = function(id){
    createTab('New Assessment', 'views/editAssessment.html','editAssessmentCtrl', {assessmentID: id});
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
      tabName='Search Questions';
    createTab(tabName,'views/searchQuestions.html','searchQuestionsCtrl',data);
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
    createTab('Import Questions', 'views/importQuestions.html','importQuestionsCtrl',{callback: $scope.updateQuestionCount});
  };

  $scope.exportAssessment = function(assessmentID){
    createTab('Export Assessment', 'views/exportAssessment.html','exportAssessmentCtrl',{assessmentID: assessmentID});
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
        output += ', ';
      else if (i < rule[property].length - 1)
        output += ' and ';
    }
    return output;
  };

  $scope.formatAssessmentQuestion = function(question){
    let jsonUID = angular.toJson(question.UID).replace('"/g','\"');
    let highlighted = $filter('highlight')(question.questionTitle,classView.assessments.filter.query,classView.assessments.filter.caseSensitive);
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
      if(classView.questions.filter.open && classView.questions.filter.searchAnswers)
        out+=$filter('highlight')(answer.answerText,classView.questions.filter.query,classView.questions.filter.caseSensitive);
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
    if(classView.questions.filter.topicQuery !== null)
      out+='<span class="ui-select-highlight">';
    out+='<a href="#" ng-click="editTopic('+topic.ID+')">'+topic.topicName+'</a>';
    if(classView.questions.filter.topicQuery !== null)
      out+='</span>';
    if(question.objectives.length){
      out+='<br/>Objectives: ';
    }
    for(let i=0;i<question.objectives.length;i++){
      let obj = question.objectives[i];
      if(classView.questions.filter.open && classView.questions.filter.objectiveQuery !== null && classView.questions.filter.objectiveQuery === obj.ID)
        out+='<span class="ui-select-highlight">';
      out+='<a href="#" ng-click="editObjective('+obj.ID+')">'+obj.objectiveText+'</a>';
      if(classView.questions.filter.open && classView.questions.filter.objectiveQuery !== null && classView.questions.filter.objectiveQuery == obj.ID)
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

  $scope.topicByID = function(topicID){
    return new CourseUtils($scope.class).getTopic(question.topicID);
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

  //Watches for filter assessments and questions
  //Copy only id to saved data instead of entire topic/objective
  $scope.$watch('assessmentsQuery.topic', function(){
    classView.assessments.filter.topicQuery = $scope.assessmentsQuery.topic!==null?$scope.assessmentsQuery.topic.ID:null;
  });
  $scope.$watch('assessmentsQuery.objective', function(){
    classView.assessments.filter.objectiveQuery = $scope.assessmentsQuery.objective!==null?$scope.assessmentsQuery.objective.ID:null;
  });
  $scope.$watch('questionsQuery.topic', function(){
    classView.questions.filter.topicQuery = $scope.questionsQuery.topic!==null?$scope.questionsQuery.topic.ID:null;
  });
  $scope.$watch('questionsQuery.objective', function(){
    classView.questions.filter.objectiveQuery = $scope.questionsQuery.objective!==null?$scope.questionsQuery.objective.ID:null;
  });


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

