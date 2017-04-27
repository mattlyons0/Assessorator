'use strict';

app.controller('classViewCtrl', function ($scope,$timeout, $mdToast, $sce, $filter, $uibModal, $window) {
  $scope.class = UI.getClassById($scope.$parent.page.classID);
  $scope.tabs = [];
  $scope.currentTab = 0;
  $scope.lastTab = [0];

  let nextID = 1;
  
  let classView = $scope.class.prefs.classView;
  $scope.classView = classView;
  let courseUtils = new CourseUtils($scope.class);

  $scope.questionCount = courseUtils.countQuestions();

  //Used for accordions and bulk checkboxes (needed in miscState so it can be synced upon deletion or creation of objects)
  let state = UI.miscState.classView;
  $scope.state = state;
  $scope.UIDtoJson = UI.UIDtoJson;

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
    {name:'Alphabetical (A-Z)', icon: 'glyphicon-sort-by-alphabet', ascending: true, fieldIndex: 0, index: 0},
    {name: 'Alphabetical (Z-A)', icon: 'glyphicon-sort-by-alphabet-alt', ascending: false, fieldIndex: 0, index: 1},
    {name: 'Date Added (New-Old)', icon: 'glyphicon-sort-by-order', ascending: false, fieldIndex: 1, index: 2},
    {name: 'Date Added (Old-New)', icon: 'glyphicon-sort-by-order-alt', ascending: true, fieldIndex: 1, index: 3}
  ];
  $scope.sortFieldsQuestions = ['questionTitle', 'creationDate'];
  $scope.sortFieldsObjectives = ['objectiveText', 'creationDate'];
  $scope.sortFieldsTopics = ['topicName', 'creationDate'];
  $scope.sortFieldsAssessments = ['assessmentName', 'creationDate'];

  $scope.sortModels = {
    assessments: $scope.sortModes[classView.assessments.sort],
    topics: $scope.sortModes[classView.topics.sort],
    objectives: $scope.sortModes[classView.objectives.sort],
    questions: $scope.sortModes[classView.questions.sort]
  }

  $scope.getSortParams = function(tabType,sortMode){
    let key, fallback;
    sortMode = $scope.sortModes[sortMode];
    let fallbackIdx = sortMode.fieldIndex?0:1;

    if(tabType === 'questions'){
      key=$scope.sortFieldsQuestions[sortMode.fieldIndex];
      fallback = $scope.sortFieldsQuestions[fallbackIdx];
    } else if(tabType === 'objectives'){
      key=$scope.sortFieldsObjectives[sortMode.fieldIndex];
      fallback = $scope.sortFieldsObjectives[fallbackIdx];
    } else if(tabType === 'topics'){
      key=$scope.sortFieldsTopics[sortMode.fieldIndex];
      fallback = $scope.sortFieldsTopics[fallbackIdx];
    } else if(tabType === 'assessments'){
      key=$scope.sortFieldsAssessments[sortMode.fieldIndex];
      fallback = $scope.sortFieldsAssessments[fallbackIdx];
    }

    return {key: key, fallback: fallback, mode: sortMode};
  };


  $scope.filterTopics = function(){
    let topics = $scope.class.topics;
    if(!classView.topics.filter.open || !classView.topics.filter.query)
      return topics;
    let out = new Set();
    for(let topic of topics){
      if(classView.topics.filter.searchTopics){
        if(classView.topics.filter.caseSensitive && topic.topicName.includes(classView.topics.filter.query) ||
            !classView.topics.filter.caseSensitive && safeToLowerCase(topic.topicName).includes(safeToLowerCase(classView.topics.filter.query)))
          out.add(topic);
      }
      if(classView.topics.filter.searchDescriptions){
        if(classView.topics.filter.caseSensitive && topic.topicDescription.includes(classView.topics.filter.query) ||
          !classView.topics.filter.caseSensitive && topic.topicDescription && safeToLowerCase(topic.topicDescription).includes(safeToLowerCase(classView.topics.filter.query)))
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
          !classView.objectives.filter.caseSensitive && safeToLowerCase(objective.objectiveText).includes(safeToLowerCase(classView.objectives.filter.query)))
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
      remain = assessments.slice();
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
          (!classView.assessments.filter.caseSensitive && safeToLowerCase(assessment.assessmentName).includes(safeToLowerCase(classView.assessments.filter.query))))
          out.add(assessment);
      }
      if (classView.assessments.filter.searchDescriptions){
        if (classView.assessments.filter.caseSensitive && assessment.assessmentDescription.includes(classView.assessments.filter.query) ||
          (!classView.assessments.filter.caseSensitive && safeToLowerCase(assessment.assessmentDescription).includes(safeToLowerCase(classView.assessments.filter.query))))
          out.add(assessment);
      }
      if (classView.assessments.filter.searchQuestions){
        for(let question of assessment.questions){
          if (classView.assessments.filter.caseSensitive && question.questionTitle.includes(classView.assessments.filter.query) ||
            (!classView.assessments.filter.caseSensitive && safeToLowerCase(question.questionTitle).includes(safeToLowerCase(classView.assessments.filter.query))))
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
          (!classView.questions.filter.caseSensitive && safeToLowerCase(question.questionTitle).includes(safeToLowerCase(classView.questions.filter.query))))
          out.add(question);
      }
      if (classView.questions.filter.searchDescriptions){
        if (classView.questions.filter.caseSensitive && question.questionDescription.includes(classView.questions.filter.query) ||
          (!classView.questions.filter.caseSensitive && safeToLowerCase(question.questionDescription).includes(safeToLowerCase(classView.questions.filter.query))))
          out.add(question);
      }
      if (classView.questions.filter.searchAnswers){
        for(let answer of question.answers){
          if (classView.questions.filter.caseSensitive && answer.answerText.includes(classView.questions.filter.query) ||
            (!classView.questions.filter.caseSensitive && safeToLowerCase(answer.answerText).includes(safeToLowerCase(classView.questions.filter.query))))
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
      showToast('Cannot delete \''+topic.topicName+'\' as it is the Default Topic', {level: 'danger', delay: 7});
      return;
    }

    if(topic.questions.length > 0){
      showToast('\''+topic.topicName+'\' contains '+topic.questions.length+' question'+(topic.questions.length>1?'s':'')+
        '. All questions must be '+'removed from a topic before it can be deleted.',{level: 'danger', delay:10});
      return;
    }

    let scope = $scope.$new();
    scope.alertType = 'danger';
    scope.title = 'Are You Sure You Would Like to Delete Topic \''+topic.topicName+'\'?';
    scope.description = topic.topicName+(topic.topicDescription?': '+topic.topicDescription:'');
    scope.confirmText = '<b>Delete Topic</b>';

    let confirm = $uibModal.open({
      templateUrl: 'html/modalTemplate.html',
      size: 'lg',
      scope: scope
    });
    confirm.result.then(function(){
      courseUtils.deleteTopic(Number(id));
      UI.save($scope.class);
    }, function(){
      //Didn't delete
    });
  };
  $scope.createQuestion = function(){
    createTab('New Question', 'views/editQuestion.html','editQuestionCtrl', {callback: $scope.updateQuestionCount});
  };
  $scope.editQuestion = function(uid){
    if(uid.topic === undefined){
      uid = UI.UIDfromJson(uid);
    }
    createTab('Edit Question', 'views/editQuestion.html','editQuestionCtrl',{questionID: uid.question,topicID: uid.topic, callback: $scope.updateQuestionCount});
  };
  $scope.deleteQuestion = function(uid){
    let courseUtil = new CourseUtils($scope.class);
    let question = courseUtil.getQuestion(uid);

    let questionAnswers = $scope.questionAnswersToHTML(question);

    let scope = $scope.$new();
    scope.alertType = 'danger';
    scope.title = 'Are You Sure You Would Like to Delete Question?';
    scope.normalText = question.questionTitle+(question.questionDescription?': '+question.questionDescription:'')+'<br/><br/>';
    scope.normalText += questionAnswers;
    scope.confirmText = '<b>Delete Question</b>';

    let confirm = $uibModal.open({
      templateUrl: 'html/modalTemplate.html',
      size: 'lg',
      scope: scope
    });
    confirm.result.then(function(){
      courseUtils.deleteQuestion(uid);
      UI.save($scope.class);
      $scope.questionCount--;
    }, function(){
      //Didn't delete
    });
  };
  $scope.createObjective = function(){
    createTab('New Objective','views/editObjective.html','editObjectiveCtrl');
  };

  $scope.editObjective = function(id){
    createTab('New Objective','views/editObjective.html','editObjectiveCtrl', {objectiveID: id});
  };
  $scope.deleteObjective = function(id){
    let courseUtil = new CourseUtils($scope.class);
    let objective = courseUtil.getObjective(id);

    if(objective.questionUIDs.length > 0){
      showToast('\''+objective.objectiveText+'\' is used in '+objective.questionUIDs.length+' question'+(objective.questionUIDs.length>1?'s':'')+
        '. All questions must be '+'removed from an objective before it can be deleted.',{level: 'danger', delay:10});
      return;
    }

    let scope = $scope.$new();
    scope.alertType = 'danger';
    scope.title = 'Are You Sure You Would Like to Delete Objective \''+objective.objectiveText+'\'?';
    scope.description = objective.objectiveText;
    scope.confirmText = '<b>Delete Objective</b>';

    let confirm = $uibModal.open({
      templateUrl: 'html/modalTemplate.html',
      size: 'lg',
      scope: scope
    });
    confirm.result.then(function(){
      courseUtils.deleteObjective(Number(id));
      UI.save($scope.class);
    }, function(){
      //Didn't delete
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

    let scope = $scope.$new();
    scope.alertType = 'danger';
    scope.title = 'Are You Sure You Would Like to Delete Assessment \''+assessment.assessmentName+'\'?';
    scope.description = assessment.assessmentName+(assessment.assessmentDescription?': '+assessment.assessmentDescription:'');
    scope.confirmText = '<b>Delete Assessment</b>';

    let confirm = $uibModal.open({
      templateUrl: 'html/modalTemplate.html',
      size: 'lg',
      scope: scope
    });
    confirm.result.then(function(){
      courseUtils.deleteAssessment(Number(id));
      UI.save($scope.class);
    }, function(){
      //Didn't delete
    });
  };
  $scope.getClassQuestions = function() {
    let courseUtil = new CourseUtils($scope.class);
    return courseUtil.countQuestions();
  };

  $scope.questionAnswersToHTML = function(question){
    let questionAnswers = '';
    let first = true;
    for(let answer of question.answers){
      if(first){
        first = false;
        questionAnswers+='<ul>'
      }
      questionAnswers+='<li style="list-style-type:circle">'+answer.answerText;
      if(answer.correct)
        questionAnswers+='<span class="badge" style="margin-left:5px; background-color:#337ab7">Correct</span>';
      if(answer.pinned)
        questionAnswers+='<span class="badge" style="margin-left:5px">Pinned</span>';
      questionAnswers+='</li>';
    }
    if(!first){
      questionAnswers+='</ul>'
    }

    return questionAnswers;
  };

  $scope.changeTopics = function(selectedUIDs){
    let selectedTopics = {}; //Count of each question with a specified topic indexed by topic id
    for(let selectedUID of selectedUIDs){
      let topicID = courseUtils.getQuestion(selectedUID).topicID;
      if(!selectedTopics.hasOwnProperty(topicID))
        selectedTopics[topicID] = 0;
      selectedTopics[topicID]++;
    }
    //Sort by times appeared then alphabetically
    let arr = [];
    for(let prop in selectedTopics) {
      if (selectedTopics.hasOwnProperty(prop)) {
        arr.push([prop, selectedTopics[prop]])
      }
    }
    arr.sort(function(a,b){
      let diff = b[1] - a[1];
      if (diff === 0 && courseUtils.getTopic(Number(a[0])).topicName > courseUtils.getTopic(Number(b[0])).topicName)
        diff = 1;
      else if(diff === 0)
        diff = -1;
      return diff;
    });
    //Show Data
    let underDropdown = '<b>Old Topic'+(arr.length===1?'':'s')+':</b> ';
    let first = true;
    for(let topic of arr){
      if(!first)
        underDropdown += ', ';
      else
        first=false;
      underDropdown += '<i>' +courseUtils.getTopic(Number(topic[0])).topicName + '</i> x' + topic[1];
    }

    let scope = $scope.$new();
    scope.class = $scope.class;
    scope.alertType = 'info';
    scope.title = 'Change Topic of '+ selectedUIDs.length +' Question'+(selectedUIDs.length===1?'':'s');
    scope.summary = underDropdown;
    scope.confirmText = '<b>Change Topic'+(selectedUIDs.length===1?'':'s')+'</b>';
    scope.dropdown = true;
    scope.dropdownInfo = {
      placeholder: 'Select a Topic',
      repeatObj: scope.class.topics,
      selectAttr: 'topicName',
      choicesAttr: 'topicName',
      descAttr: 'topicDescription',
      model: $scope.class.topics[0],
      label: 'Select the topic to change to:',
    };

    let confirm = $uibModal.open({
      templateUrl: 'html/modalTemplate.html',
      keyboard: false,
      backdrop: 'static',
      scope: scope
    });
    confirm.result.then(function(){
      let newTopic = scope.dropdownInfo.model;
      if(newTopic === undefined)
        newTopic = $scope.class.topics[0]; //No Topic
      let topicUtil = new TopicUtils(newTopic);
      for(let questionUID of selectedUIDs) {
        //Duplicate
        let oldQ = courseUtils.getQuestion(questionUID);
        let newID = topicUtil.createQuestion(oldQ.questionTitle,oldQ.questionDescription);
        let newQ = topicUtil.getQuestion(newID);
        newQ.answers = oldQ.answers;
        newQ.answersUID = oldQ.answersUID;
        newQ.objectives = oldQ.objectives;
        newQ.creationDate = oldQ.creationDate;
        //Duplicate selection data
        let newJSON = UI.UIDtoJson(newQ.UID);
        let oldJSON = UI.UIDtoJson(oldQ.UID);
        UI.miscState.classView.questions.checked[newJSON] = UI.miscState.classView.questions.checked[oldJSON];
        UI.miscState.classView.questions.open[newJSON] = UI.miscState.classView.questions.open[oldJSON];
        //Duplicate assessment manually added
        for(let assessment of $scope.class.assessments){
          let index = assessment.questions.indexOf(oldJSON);
          if(index !== -1)
            assessment.questions.push(newJSON);
        }
        //Delete old
        courseUtils.deleteQuestion(questionUID);
      }
      UI.save($scope.class);
    }, function(){
      //Canceled
    });
  };

  $scope.addObjectives = function(selectedUIDs){
    let underDropdown = '';

    let scope = $scope.$new();
    scope.class = $scope.class;
    scope.alertType = 'info';
    scope.title = 'Add Objectives to '+ selectedUIDs.length +' Question'+(selectedUIDs.length===1?'':'s');
    scope.summary = underDropdown;
    scope.confirmText = '<b>Add Objective'+(selectedUIDs.length===1?'':'s')+'</b>';
    scope.dropdown = true;
    scope.dropdownInfo = {
      placeholder: 'Choose an Objective',
      repeatObj: scope.class.objectives,
      selectAttr: 'objectiveText',
      choicesAttr: 'objectiveText',
      descAttr: '',
      model: '',
      label: 'Select the objectives to add:',
      multiple: true
    }

    let confirm = $uibModal.open({
      templateUrl: 'html/modalTemplate.html',
      keyboard: false,
      backdrop: 'static',
      scope: scope
    });
    confirm.result.then(function(){
      let selectedObjectives = scope.dropdownInfo.model; //Array of objectives selected or empty string
      if(selectedObjectives === ''){
        showToast('No Objectives Added',{level: 'info'});
        return;
      }

      for(let objective of selectedObjectives) {
        for (let selectedUID of selectedUIDs) {
          let question = courseUtils.getQuestion(selectedUID);
          let questionUtil = new QuestionUtils(question);
          if(!question.objectives.includes(objective))
            questionUtil.addObjective(objective);
        }
      }
      UI.save($scope.class);
    }, function(){
      //Canceled
    });
  };

  $scope.removeObjectives = function(selectedUIDs){
    let underDropdown = '';

    let scope = $scope.$new();
    scope.class = $scope.class;
    scope.alertType = 'info';
    scope.title = 'Remove Objectives from '+ selectedUIDs.length +' Question'+(selectedUIDs.length===1?'':'s');
    scope.summary = underDropdown;
    scope.confirmText = '<b>Remove Objective'+(selectedUIDs.length===1?'':'s')+'</b>';
    scope.dropdown = true;
    scope.dropdownInfo = {
      placeholder: 'Choose an Objective',
      repeatObj: scope.class.objectives,
      selectAttr: 'objectiveText',
      choicesAttr: 'objectiveText',
      descAttr: '',
      model: '',
      label: 'Select the objectives to remove:',
      multiple: true
    }

    let confirm = $uibModal.open({
      templateUrl: 'html/modalTemplate.html',
      keyboard: false,
      backdrop: 'static',
      scope: scope
    });
    confirm.result.then(function(){
      let selectedObjectives = scope.dropdownInfo.model; //Array of objectives selected or empty string
      if(selectedObjectives === ''){
        showToast('No Objectives Removed',{level: 'info'});
        return;
      }

      for (let selectedUID of selectedUIDs) {
        let question = courseUtils.getQuestion(selectedUID);
        let questionUtil = new QuestionUtils(question);
        for(let objective of selectedObjectives) {
          if (question.objectives.includes(objective))
            questionUtil.removeObjective(objective)
        }
      }
      UI.save($scope.class);
    }, function(){
      //Canceled
    });
  };

  $scope.deleteQuestions = function(deleteUIDs){
    let scope = $scope.$new();
    scope.alertType = 'danger';
    scope.title = 'Are You Sure You Would Like to Delete '+ deleteUIDs.length +' Question'+(deleteUIDs.length===1?'':'s')+'?';
    scope.description = 'This will delete the selected question'+(deleteUIDs.length===1?'':'s')+'.';
    scope.confirmText = '<b>Delete ' + deleteUIDs.length + ' Question'+(deleteUIDs.length===1?'':'s')+'</b>';

    let confirm = $uibModal.open({
      templateUrl: 'html/modalTemplate.html',
      size: 'lg',
      scope: scope
    });
    confirm.result.then(function(){
      for(let questionUID of deleteUIDs) {
        courseUtils.deleteQuestion(questionUID);
        $scope.questionCount--;
      }
      UI.save($scope.class);
    }, function(){
      //Didn't delete
    });
  };

  $scope.deleteAssessments = function(selectedUIDs){
    let scope = $scope.$new();
    scope.alertType = 'danger';
    scope.title = 'Are You Sure You Would Like to Delete '+ selectedUIDs.length +' Assessment'+(selectedUIDs.length===1?'':'s')+'?';
    scope.description = 'This will delete the selected assessment'+(selectedUIDs.length===1?'':'s')+'.';
    scope.confirmText = '<b>Delete ' + selectedUIDs.length + ' Assessment'+(selectedUIDs.length===1?'':'s')+'</b>';

    let confirm = $uibModal.open({
      templateUrl: 'html/modalTemplate.html',
      size: 'lg',
      scope: scope
    });
    confirm.result.then(function(){
      for(let id of selectedUIDs) {
        courseUtils.deleteAssessment(Number(id));
      }
      UI.save($scope.class);
    }, function(){
      //Didn't delete
    });
  };

  $scope.deleteTopics = function(selectedUIDs){
    let scope = $scope.$new();
    scope.alertType = 'danger';
    scope.title = 'Are You Sure You Would Like to Delete '+ selectedUIDs.length +' Topic'+(selectedUIDs.length===1?'':'s')+'?';
    scope.description = 'This will delete the selected topic'+(selectedUIDs.length===1?'':'s')+'.';
    scope.confirmText = '<b>Delete ' + selectedUIDs.length + ' Topic'+(selectedUIDs.length===1?'':'s')+'</b>';

    let confirm = $uibModal.open({
      templateUrl: 'html/modalTemplate.html',
      size: 'lg',
      scope: scope
    });
    confirm.result.then(function(){
      for(let id of selectedUIDs) {
        let topic = new CourseUtils($scope.class).getTopic(Number(id));
        if(id === 0){
          showToast('Cannot delete \''+topic.topicName+'\' as it is the Default Topic', {level: 'warning', delay: 10});
        } else if(topic.questions.length > 0){
          showToast('\''+topic.topicName+'\' contains '+topic.questions.length+' question'+(topic.questions.length>1?'s':'')+
            '. All questions must be '+'removed from a topic before it can be deleted.',{level: 'warning', delay:10});
        } else {
          courseUtils.deleteTopic(Number(id))
        }
      }
      UI.save($scope.class);
    }, function(){
      //Didn't delete
    });
  };

  $scope.deleteObjectives = function(selectedUIDs){
    let scope = $scope.$new();
    scope.alertType = 'danger';
    scope.title = 'Are You Sure You Would Like to Delete '+ selectedUIDs.length +' Objective'+(selectedUIDs.length===1?'':'s')+'?';
    scope.description = 'This will delete the selected objective'+(selectedUIDs.length===1?'':'s')+'.';
    scope.confirmText = '<b>Delete ' + selectedUIDs.length + ' Objective'+(selectedUIDs.length===1?'':'s')+'</b>';

    let confirm = $uibModal.open({
      templateUrl: 'html/modalTemplate.html',
      size: 'lg',
      scope: scope
    });
    confirm.result.then(function(){
      for(let id of selectedUIDs) {
        let objective = courseUtils.getObjective(Number(id));
        if(objective.questionUIDs.length > 0){
          showToast('\''+objective.objectiveText+'\' is used in '+objective.questionUIDs.length+' question'+(objective.questionUIDs.length>1?'s':'')+
            '. All questions must be '+'removed from an objective before it can be deleted.',{level: 'warning', delay:10});
        } else {
          courseUtils.deleteObjective(Number(id))
        }
      }
      UI.save($scope.class);
    }, function(){
      //Didn't delete
    });
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
    let sortedObjectives = question.objectives.slice();
    sortedObjectives = $filter('sort')(sortedObjectives, {key: 'objectiveText', mode: 'ascending'});
    let out = 'Objective';
    if(sortedObjectives.length !== 1)
      out+='s';
    out+=': ';
    for(let i=0;i<sortedObjectives.length;i++){
      if(i !== 0)
        out+=', ';
      out+=sortedObjectives[i].objectiveText;
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

  $scope.formatAssessmentQuestion = function(jsonUID){
    let question = courseUtils.getQuestion(UI.UIDfromJson(jsonUID));
    let highlighted = $filter('highlight')(question.questionTitle,classView.assessments.filter.query,classView.assessments.filter.caseSensitive);
    return '<a href="#" ng-click=\'editQuestion("'+jsonUID+'")\'>'+ highlighted + '</a> ' + $scope.formatQuestionType(question);
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

  $scope.formatObjectiveQuestions = function(objective){
    let questions = [];
    for(let questionUID of objective.questionUIDs)
      questions.push(courseUtils.getQuestion(questionUID));
    questions.sort(function(a,b){
      if(a.questionTitle>b.questionTitle)
        return 1;
      else
        return -1;
    });

    let lines = [];
    for(let question of questions){
      let line = '<p style="padding-left:5px">'+$scope.formatObjectiveQuestion(question.UID)+'</p>';
      lines.push(line);
    }
    let final = '';
    for(let l of lines){
      final+=l;
    }
    return final;
  };
  $scope.formatObjectiveQuestion = function(questionUID) {
    let question = courseUtils.getQuestion(questionUID);
    let jsonUID = UI.UIDtoJson(questionUID);
    let highlighted = $filter('highlight')(question.questionTitle,classView.assessments.filter.query,classView.assessments.filter.caseSensitive);
    return '<a href="#" ng-click=\'editQuestion("'+jsonUID+'")\'>'+ highlighted + '</a> ' + $scope.formatQuestionType(question);
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

  $scope.accordion = function(type,checked){
    let arr, accordion;
    switch(type){
      case 'assessment':
        arr = $scope.filterAssessments();
        if(!checked)
          accordion = state.assessments.open;
        else
          accordion = state.assessments.checked;
        break;
      case 'topic':
        arr = $scope.filterTopics();
        if(!checked)
          accordion = state.topics.open;
        else
          accordion = state.topics.checked;
        break;
      case 'objective':
        arr = $scope.filterObjectives();
        if(!checked)
          accordion = state.objectives.open;
        else
          accordion = state.objectives.checked;
        break;
      case 'question':
        arr = $scope.filterQuestions();
        if(!checked)
          accordion = state.questions.open;
        else
          accordion = state.questions.checked;
        break;
      default:
        console.error('Unknown type: '+type);
        return;
    }
    return {array: arr, accordion: accordion};
  };

  $scope.countAccordion = function(type,checked){
    let values = $scope.accordion(type,checked);
    let count = 0;
    for(let elem in values.accordion){
      if(values.accordion.hasOwnProperty(elem) && values.accordion[elem] === true)
        count++;
    }
    return count;
  };

  $scope.getAccordionIDs = function(type,checked){
    let values = $scope.accordion(type,checked);
    let arr = [];
    for(let elem in values.accordion){
      if(values.accordion.hasOwnProperty(elem) && values.accordion[elem] === true) {
        let id;
        if(type === 'question')
          id=UI.UIDfromJson(elem);
        else
          id=elem;

        arr.push(id);
      }
    }
    return arr;
  }

  $scope.iterateAccordion = function(type,value,checked){
    let values = $scope.accordion(type,checked);
    let arr = values.array;
    let accordion = values.accordion;
    for(let elem of arr){
      let key;
      if(type === 'question')
        key = UI.UIDtoJson(elem.UID);
      else
        key = elem.ID;
      accordion[key]=value;
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
      let header = '<div class="list-group flex" style="margin-bottom:0"><div class="list-group-item alert-danger"><h3 style="margin-top:10px">'
        +'<h3 style="text-align:center">Go Back to Course Selection?</h3></div><li class="list-group-item">';
      let html = '<h4>Changes in <i>'+$scope.getTabByID($scope.currentTab).name+'</i> will be lost.</h4></li>';
      let buttons ='<div style="padding: 5px; text-align:right"> <button type="button" class="btn btn-default" ng-click="dismiss()" style="margin-right:2px">Cancel</button>'
        +'<button type="button" class="btn btn-danger" ng-click="close()"><b>Go to Course Selection</b></button></div>';
      let confirm = $uibModal.open({
        template: header+html+buttons,
        controller: function($scope,$uibModalInstance){
          $scope.close = $uibModalInstance.close;
          $scope.dismiss = $uibModalInstance.dismiss;
        }
      });
      confirm.result.then(() => {
        //Do it
        back();
      }, () => {
        //Didn't do it
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
        $scope.tabs.splice(-1,1);
        $scope.lastTab.splice($scope.lastTab.length-1,1); //Delete Current Tab
        $scope.currentTab = $scope.lastTab[$scope.lastTab.length-1]; //Get Last Tab
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

  $scope.resizeTextArea = function (el) {
    if(el.resizeListening)
      return;
    el.resizeListening = true;

    autosize(el);
  };

  $scope.focusId = function(id){
    setTimeout(()=>{
      try {
        document.querySelector("#" + id).focus();
      } catch(err) {}
    }, 0);
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
    $scope.lastTab.push(tab.id);
    setTimeout( ()=> {
      $scope.$apply( () => {
        $scope.currentTab = tab.id;
      });
    },0); //Avoid flicker when switching tabs. Ensures tab is rendered before switching

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
  //Check for invalidation when deleted
  $scope.$watch('classView.assessments.filter.topicQuery', function(){
    if(classView.assessments.filter.topicQuery === null)
      $scope.assessmentsQuery.topic = null;
  });
  $scope.$watch('classView.assessments.filter.objectiveQuery', function(){
    if(classView.assessments.filter.objectiveQuery === null)
      $scope.assessmentsQuery.objective = null;
  });
  $scope.$watch('classView.questions.filter.topicQuery', function(){
    if(classView.questions.filter.topicQuery === null)
      $scope.questionsQuery.topic = null;
  });
  $scope.$watch('classView.questions.filter.objectiveQuery', function(){
    if(classView.questions.filter.objectiveQuery === null)
      $scope.questionsQuery.objective = null;
  });
  //Used to copy index to saved model for sort mode
  $scope.$watch('sortModels', function(){
    classView.assessments.sort = $scope.sortModels.assessments.index;
    classView.topics.sort = $scope.sortModels.topics.index;
    classView.objectives.sort = $scope.sortModels.objectives.index;
    classView.questions.sort = $scope.sortModels.questions.index;
  }, true);


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

//Safely converts toLowerCase if string, otherwise will fail a includes call
function safeToLowerCase(str){
  if(typeof str === 'string'){
    return str.toLowerCase();
  }
  return {includes: function() {return false}};
}