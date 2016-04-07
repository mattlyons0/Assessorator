"use strict";
let AppDirectory = require('appdirectory');
let dirs = new AppDirectory('Assessorator');
let versionFolder = dirs.userData();
let versionFile = versionFolder + '/DBVersion';

let fs = require('fs');
let mkdirp = require('mkdirp');

let DB_NAME = "AssessoratorDataStore";

let db = undefined; //Opened DB Object

let db_version = 1;

// getDBVersion(loadDatabase); //Open DB
loadDatabase( () => {
  getCourses( (loadedCourses) => {
    UI.loadFromDisk(loadedCourses);
  });
});

function loadDatabase(callback,addedData){
  console.log('Opening Database Version '+db_version+'...');
  let openRequest = indexedDB.open(DB_NAME,db_version);

  openRequest.onupgradeneeded = function(e) {
    let oldVersion = e.oldVersion;
    let newVersion = e.newVersion;
    console.log("Upgrading Database from version "+oldVersion+' to '+newVersion);

    if(oldVersion == 0){ //This is a new database
      let courseStore = e.target.result.createObjectStore("courses",{keyPath: "ID"});
      courseStore.transaction.oncomplete = function(event){
        console.log('Created courseStore');
        //TODO ensure it gets here
      };
      courseStore.transaction.onerror = function(event){
        console.error('Error creating initial courses object \n'+event);
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

  openRequest.onsuccess = function(e) {
    console.log("Database opened successfully.");
    db = e.target.result;
    db.onversionchange = function(e) {
      console.log('Version Change');

      if(e.newVersion == null) {
        console.log('New Version null, closing...');
        db.close();
      }
    };
    if(callback)
      callback();
  };

  openRequest.onerror = function(event) {
    console.log("Error");
    if(openRequest.error.name == 'VersionError'){
      console.error('Version Error: '+openRequest.error.message);
    } else{
      console.log(openRequest.error);
    }

    openRequest.onblocked = function(event){
      console.error('Error opening Database. Blocked.');
      console.error(event); //TODO fix this not occuring (chromium bug?)
    }
  };

  navigator.webkitPersistentStorage.queryUsageAndQuota(
    function(usedBytes, grantedBytes){
      let usedMB = usedBytes / 1000000; //Bytes to Megabyte
      let grantedMB = grantedBytes / 1000000; //Bytes to Megabyte
      console.log('Using '+usedMB+' MB of '+grantedMB+' MB.');
      if(grantedMB-usedMB <= 50){ //If there are less than 50MB free
        console.warn(grantedMB-usedMB+' MB free! Computer low on disk space!');
      }
    },
    function(error){
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

function deleteDatabase(){
  var deleteDbRequest = indexedDB.deleteDatabase(DB_NAME);
  deleteDbRequest.onsuccess = function (event) {
    console.log('Database Deleted')
  };
  deleteDbRequest.onerror = function (e) {
    console.log("Database error: " + e.target.errorCode);
  };
  db.close();
  location.reload();
  // fs.unlink(versionFile,function(err){
  //   if(err && err.code != 'ENOENT'){
  //     console.error('Failed to delete Database Version File: \n'+err);
  //     return;
  //   }
  //   console.log('Deleted Version File');
  // })
}

function addCourse(course){
  let transaction = db.transaction('courses','readwrite');
  let courseStore = transaction.objectStore('courses');
  courseStore.add(course);
  transaction.oncomplete = () => {
    console.log('Successfully added course');
  };
  transaction.onerror = (err) => {
    console.error('Error adding course to Database:\n'+err);
  };
}

function getCourses(callback){
  let courseStore = db.transaction('courses','readonly').objectStore('courses');
  let openCursor = courseStore.openCursor();
  let courses = [];
  openCursor.onsuccess = (event) => {
    let cursor = event.target.result;
    if(cursor){
      courses.push(cursor.value);
      cursor.continue();
    } else { //We have finished querying the objectStore
      callback(courses);
    }
  };
  openCursor.onerror = (error) => {
    console.error('Error getting courses from disk:\n'+error);
  };
}

function modifyCourse(course,callback){
  let courseStore = db.transaction('courses','readwrite').objectStore('courses');
  let request = courseStore.put(course);
  request.onerror = (error) => {
    console.error("Error updating course in database"+error);
  };
  request.onsuccess = (event) => {
    console.log('Updated Database');
  }
}
var Database = {};
Database.loadDatabase = loadDatabase;
Database.deleteDatabase = deleteDatabase;
Database.addCourse = addCourse;
Database.getCourses = getCourses;