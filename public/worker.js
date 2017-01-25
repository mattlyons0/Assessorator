"use strict";

/**
 * WebWorker that currently just saves courses to the indexeddb
 */

let DB_NAME = "AssessoratorDataStore";
let db_version = 1;
let db = undefined; //Opened DB Object

//noinspection JSUnresolvedVariable
onmessage = function(msg){
  save(msg.data);
};

function save(course){
  course = JSON.parse(course);

  let openRequest = indexedDB.open(DB_NAME,db_version);
  openRequest.onsuccess = function(e) {
    db = e.target.result;

    let courseStore = db.transaction('courses','readwrite').objectStore('courses');
    let request = courseStore.put(course);
    request.onerror = (error) => {
      console.error("Error updating course in database"+error);
    };
    request.onsuccess = () => {
      self.postMessage('success');
      console.log('Saved');
      // setTimeout(function(){
        // close();
      // },30*1000);
    };
    db.close();
  };
}