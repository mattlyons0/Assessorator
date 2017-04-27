'use strict';
let AppDirectory = require('appdirectory');
let dirs = new AppDirectory('Assessorator');
let versionFolder = dirs.userData();
let versionFile = versionFolder + '/DBVersion';

let fs = require('fs');
let mkdirp = require('mkdirp');
let Course = require('../data/Course.js');

let DB_NAME = 'AssessoratorDataStore';
let db = undefined; //Opened DB Object
let db_version = 1;

// getDBVersion(loadDatabase); //Open DB
let loaded = false;
loadDatabase(function () {
  getCourses(function (loadedCourses) {
    UI.loadFromDisk(loadedCourses);
    loaded = true;
  });
}, function (err) {
  UI.diskLoadError(err);
});

window.onerror = function (err) {
  if (!loaded) {
    console.error('Caught exception when loading database.');
    console.error(err);
    angular.element(document.querySelector('#classesContainer')).scope().dbReadError('unknown');
  }
};

function loadDatabase(callback, errorCallback) {
  console.log('Opening Database Version ' + db_version + '...');
  let openRequest = indexedDB.open(DB_NAME, db_version);

  openRequest.onupgradeneeded = function (e) {
    let oldVersion = e.oldVersion;
    let newVersion = e.newVersion;
    console.log('Upgrading Database from version ' + oldVersion + ' to ' + newVersion);

    if (oldVersion === 0) { //This is a new database
      let courseStore = e.target.result.createObjectStore('courses', {keyPath: 'ID'});
      courseStore.transaction.oncomplete = function (event) {
        console.log('Created courseStore');
        //TODO ensure it gets here
      };
      courseStore.transaction.onerror = function (event) {
        console.error('Error creating initial courses object \n' + event);
      }
    }
    else { //This should be a in-app upgrade (occurs when a course or topic is added)
      // if(typeof addedData === Course){
      //   co
      // } else if(typeof addedData === Topic){
      //
      // } else{
      //   console.error('Unknown element type of added data: '+typeof addedData+', Data: '+addedData);
      // }


      // let coursesInMem = UI.getClasses();
      // if(coursesInMem.length == 0){
      //   console.warn('Upgrade should not have been triggered, no data to add.');
      // }
      // e.target.transaction.oncomplete = function(ev){
      //   let transaction = e.target.result.transaction(['courses'],'readwrite');
      //   let coursesStore = transaction.objectStore('courses');
      //   let cursor = coursesStore.openCursor();
      //   let coursesIDOnDisk = [];
      //   cursor.onsuccess = function(event){
      //     if(event.target.result){
      //       if(event.target.result.value['ID']) {
      //         coursesIDOnDisk.push(event.target.result.value['ID'].ID);
      //         console.log(event.target.result.value);
      //         event.target.result['continue']();
      //       }
      //     }
      //     for(let course of coursesInMem){
      //       let found = false;
      //       for(let courseID of coursesIDOnDisk){
      //         if(courseID === course.ID){
      //           found = true;
      //           break;
      //         }
      //       }
      //       if(found === false){ //Add course to disk and create respective stores
      //         let req = coursesStore.add(course);
      //         req.onerror = function(err){
      //           console.error('Error adding course to coursesStore\n'+err);
      //         };
      //         req.onsuccess = function(event){
      //           let courseStore = e.target.result.createObjectStore('course'+course.ID,{keyPath: "ID"});
      //           courseStore.transaction.oncomplete = function(event){
      //             console.log('Created courseStore');
      //             //TODO ensure it gets here
      //           };
      //           courseStore.transaction.onerror = function(event){
      //             console.error.println('Error creating initial courses object \n'+event);
      //           }
      //         }
      //       }
      //     }
      //
      //   };
      //   transaction.oncomplete = function(evt){
      //
      //   }
      // }
    }
  };
  openRequest.onsuccess = function (e) {
    console.log('Database opened successfully.');
    db = e.target.result;
    db.onversionchange = function (e) {
      console.log('Version Change');

      if (e.newVersion == null) {
        console.log('New Version null, closing...');
        db.close();
      }
    };

    getStorageUsage();

    if (callback)
      callback();
  };

  openRequest.onerror = function (event) {
    console.error('Error Opening DB');
    if (openRequest.error.name == 'VersionError') {
      console.error('Version Error: ' + openRequest.error.message);
      if (errorCallback) {
        errorCallback(openRequest.error.name);
      }
    } else {
      console.error(openRequest.error);
      if (errorCallback) {
        errorCallback(openRequest.error);
      }
    }

    openRequest.onblocked = function (event) {
      console.error('Error opening Database. Blocked.');
      console.error(event); //TODO fix this not occurring (chromium bug?)
      if (errorCallback) {
        errorCallback('blocked');
      }
    }
  };
}

function getStorageUsage() {
  navigator.webkitPersistentStorage.queryUsageAndQuota(
    function (usedBytes, grantedBytes) {
      let usedMB = usedBytes / 1000000; //Bytes to Megabyte
      let grantedMB = grantedBytes / 1000000; //Bytes to Megabyte
      console.log('Using ' + usedMB + ' MB of ' + grantedMB + ' MB.');
      if (grantedMB - usedMB <= 50) { //If there are less than 50MB free
        console.warn(grantedMB - usedMB + ' MB free! Computer low on disk space!');
      }
    },
    function (error) {
      console.error('Error accessing data usage quota');
      console.error(error);
    }
  )
}
// function getDBVersion(callback){
//   //Create Directory Structure (if it doesn't exist)
//   mkdirp(versionFolder, function(err){
//     if(err !== null) //Null denotes it already exists? maybe
//       console.error('Error creating folder structure for Version File\n'+err);
//   });
//
//   //Read Version
//   fs.readFile(versionFile,'utf8',function(error,data){
//     if(error+''.indexOf('ENOENT')!= -1){
//       console.log('No version file found, assuming this is the first time the program has been run.');
//       callback();
//     } else if(error){
//       console.error('An unknown error occurred accessing the Database Version Number: \n'+error);
//     }
//     else {
//       db_version = data;
//       callback();
//     }
//   })
// }

//TODO determine if this is needed or if the simplistic approach is sufficient
// function upgradeDatabase(callback,addedData){
//   db.close();
//   db_version++;
//   console.log(versionFile);
//   fs.writeFile(versionFile,db_version+'',function(error){
//     if(error){
//       console.error('An error occurred updating the Database Version Number: \n',+error);
//       return;
//     }
//     loadDatabase(callback,addedData);
//   });
// }

function closeDatabase(){
  db.close();
}

function deleteDatabase(callback) {
  var deleteDbRequest = indexedDB.deleteDatabase(DB_NAME);
  deleteDbRequest.onsuccess = function (event) {
    console.log('Database Deleted');
    if (callback)
      callback();
  };
  deleteDbRequest.onerror = function (e) {
    console.log('Database deletion error: ' + e.target.errorCode);
  };
  deleteDbRequest.onblocked = function(e){
    console.log('Database delete blocked: ');
    console.log(e);
  };

  db.close();
  // fs.unlink(versionFile,function(err){
  //   if(err && err.code != 'ENOENT'){
  //     console.error('Failed to delete Database Version File: \n'+err);
  //     return;
  //   }
  //   console.log('Deleted Version File');
  // })
}

function addCourse(course) {
  let transaction = db.transaction('courses', 'readwrite');
  let courseStore = transaction.objectStore('courses');
  courseStore.add(course);
  transaction.oncomplete = () => {
    console.log('Successfully added course');
  };
  transaction.onerror = (err) => {
    console.error('Error adding course to Database:');
    console.log(err);
  };
}

function getCourses(callback) {
  let courseStore = db.transaction('courses', 'readonly').objectStore('courses');
  let openCursor = courseStore.openCursor();
  let courses = [];
  let dataUpdateReturn = [];
  openCursor.onsuccess = (event) => {
    let cursor = event.target.result;
    if (cursor) {
      courses.push(cursor.value);
      let dataReturn = updateDataFormat(cursor.value);
      dataUpdateReturn.push(dataReturn);
      let needsSave = dataReturn.needsSave;
      repairPointers(cursor.value); //Relink assessment and objective pointers
      if(needsSave)
        UI.save(cursor.value);
      cursor.continue();
    } else { //We have finished querying the objectStore
      postDataFormatUpdate(dataUpdateReturn);
      callback(courses);
    }
  };
  openCursor.onerror = (error) => {
    console.error('Error getting courses from disk:\n' + error);
  };
}

function postDataFormatUpdate(updateReturn){
  let updateDate = false;
  for(let ret of updateReturn){
    if(ret.updateDate)
      updateDate = true;
  }

  if(updateDate){
    showToast('Database has been upgraded to add creation dates to assessments.<br/>' +
      'All assessments from prior versions will have the same creation date.', {keepOpen: true});
  }
}

/**
 * Detect missing data that was added in more recent versions and convert into that format
 * @param course {Course} course data
 */
function updateDataFormat(course) {
  let didUpdate = false;
  //Check for Question.UID field and populate if doesn't exist
  for (let topic of course.topics) {
    for (let question of topic.questions) {
      if (!question.UID) {
        new QuestionUtils(question).createUID();
        didUpdate = true;
      }
    }
  }

  //Check for objective.questions field and populate if doesn't exist
  for (let objective of course.objectives) {
    if (!objective.questionUIDs) { //Check if old data has questions field
      objective.questionUIDs = [];
      for (let topic of course.topics) {
        for (let question of topic.questions) {
          for (let obj of question.objectives) {
            if (obj.ID === objective.ID) {
              objective.questionUIDs.push(question.UID);
              didUpdate = true;
              break;
            }
          }
        }
      }
    }
  }

  //Check for question.creationDate field and populate with current date and time if doesn't exist
  let updateDate = false;
  for (let topic of course.topics){
    for(let question of topic.questions){
      if(!question.creationDate){
        updateDate = true;
        question.creationDate = Date.now();
        didUpdate = true;
      }
    }
  }

  //Check for objective.creationDate field and populate with current date and time if it doesn't exist
  for(let objective of course.objectives){
    if(!objective.creationDate){
      objective.creationDate = Date.now();
      didUpdate = true;
    }
  }

  //Check for topic.creationDate field and populate with current date and time if it doesn't exist
  for(let topic of course.topics){
    if(!topic.creationDate){
      topic.creationDate = Date.now();
      didUpdate = true;
    }
  }

  //Check for assessment.creationDate field and populate with current date and time if it doesn't exist
  for(let assessment of course.assessments){
    if(!assessment.creationDate){
      assessment.creationDate = Date.now();
      didUpdate = true;
    }
  }

  //Check no topic index is 0 (was broken in one update, so this will fix it)
  if(course.topics[0] && course.topics[0].ID !== 0){
    let noTopicIndex = -1;
    for(let i=0;i<course.topics.length;i++){
      if(course.topics[i].ID === 0){
        noTopicIndex = i;
        break;
      }
    }
    if(noTopicIndex === -1){
      console.error('No Topic not found!');
    } else{
      let noTopic = course.topics[noTopicIndex];
      course.topics.splice(noTopicIndex,1);
      course.topics.splice(0,0,noTopic);

      console.log('Fixed "No Topic" Index');
      didUpdate = true;
    }
  }

  //Deeply check if all properties in optimal are defined in current. If they are not copy the values from current
  let defineAllProps = function(optimal,current){
    if(optimal === undefined || optimal === null || !Object.keys(optimal).length) {
      return;
    }
    //Define new properties
    for(let property in optimal){
      if(optimal.hasOwnProperty(property)){
        if(!current.hasOwnProperty(property)) {
          current[property] = optimal[property];
          console.log('Added prefs property: \''+property+'\' with value:');
          console.log(optimal[property]);
          didUpdate = true;
        } else {
          defineAllProps(optimal[property], current[property]);
        }
      }
    }
    // Remove old properties
    for(let property in current){
      if(current.hasOwnProperty(property)){
        if(!optimal.hasOwnProperty(property)){
          delete current[property];
          console.log('Deleted prefs property: \''+property+'\'');
          didUpdate=true;
        }
      }
    }
  };
  let defaultCoursePrefs = new Course().prefs;
  if(!course.prefs){
    course.prefs = new Course().prefs;
    didUpdate = true;
    console.log('Created Course Prefs');
  } else{
    defineAllProps(defaultCoursePrefs,course.prefs);
  }

  //Check if displayOrder exists, if not create it
  if(course.displayOrder === undefined){
    course.displayOrder = course.ID;
    didUpdate = true;
  }

  //Migrate Assessment manuallyAdded from actual questions to UID
  for(let assessment of course.assessments){
    if(assessment.questions){
      let newQuestions = [];
      for(let question of assessment.questions){
        if(question.hasOwnProperty('UID')){
          newQuestions.push(UI.UIDtoJson(question.UID));
        }
      }
      if(newQuestions.length) {
        assessment.questions = newQuestions;
        console.log('Updated Assessment Manually Added Questions Format for Assessment: ' + assessment.assessmentName);
        didUpdate = true;
      }
    }
  }

  return {needsSave: didUpdate, updateDate: updateDate};
}

function repairPointers(course) {
  if (!course)
    return;

  let courseUtil = new CourseUtils(course);

  //Repair Question pointers to objectives
  for (let topic of course.topics) {
    for (let question of topic.questions) {
      for (let i = 0; i < question.objectives.length; i++) {
        let oldObjective = question.objectives.splice(0, 1)[0]; //0 because we are cycling through the array
        let objective = courseUtil.getObjective(oldObjective.ID);
        question.objectives.push(objective); //Repair Pointer
      }
    }
  }

  //Repair Topic/Objective pointers to Assessments
  for (let assessment of course.assessments) {
    for (let ruleIdx=0;ruleIdx<assessment.rules.length;ruleIdx++) { //Topic/Objectives
      let rule = assessment.rules[ruleIdx];
      for (let i = 0; i < rule.topics.length; i++) {
        let oldTopic = rule.topics.splice(0, 1)[0];
        if (oldTopic) {
          let topic = courseUtil.getTopic(oldTopic.ID);
          if(topic) //Handle if it was a dangling reference
            rule.topics.push(topic);
        }
      }
      for (let i = 0; i < rule.objectives.length; i++) {
        let oldObjective = rule.objectives.splice(0, 1)[0];
        if (oldObjective) {
          let objective = courseUtil.getObjective(oldObjective.ID);
          if(objective) //Handle if it was a dangling reference
            rule.objectives.push(objective);
        }
      }
      if(rule.objectives.length === 0 && rule.type==="Objective"){
        assessment.rules.splice(ruleIdx,1);
        ruleIdx--;
        console.warn("Deleted rule in assessment '"+assessment.assessmentName+"' with no Objectives.");
      } else if(rule.topics.length === 0 && rule.type==="Topic"){
        assessment.rules.splice(ruleIdx,1);
        ruleIdx--;
        console.warn("Deleted rule in assessment '"+assessment.assessmentName+"' with no Topics.");
      }
    }
  }
}

function modifyCourse(course) {
  let courseStore = db.transaction('courses', 'readwrite').objectStore('courses');
  let request = courseStore.put(course);
  request.onerror = (error) => {
    console.error('Error updating course in database' + error);
  };
  request.onsuccess = (event) => {
    console.log('Updated Database');
  }
}

function deleteCourse(courseID, callback) {
  let courseStore = db.transaction('courses', 'readwrite').objectStore('courses');
  let request = courseStore.delete(courseID);
  request.onerror = (error) => {
    console.error('Error deleting course in database' + error);
  };
  request.onsuccess = (event) => {
    console.log('Deleted Course in Database');
    if (callback)
      callback();
  }
}
var Database = {};
Database.loadDatabase = loadDatabase;
Database.deleteDatabase = deleteDatabase;
Database.addCourse = addCourse;
Database.getCourses = getCourses;
Database.modifyCourse = modifyCourse;
Database.deleteCourse = deleteCourse;
Database.closeDatabase = closeDatabase;

module.exports = Database;