Assessorator
=====

A Cross-Platform Desktop Application for managing multiple choice question databanks and generating randomized assessments based on specified criteria. Designed to export to EdX format but can be extended for various other formats.

### Contents
* [Purpose](#purpose)
* [Screenshots](#screenshots)
* [Usage](#usage)
* [Features](#features)
* [Technology](#technology)

### Purpose
- Manage a large database of Multiple Choice Questions
- Generate Assessments with random questions meeting specified criteria
- Reduce need to create new questions by simply regenerating assessments each semester to introduce new questions

### Screenshots
Start Screen:
![Start Screen Screenshot](https://github.com/mattlyons0/Assessorator/blob/master/screenshots/homepage.png?raw=true)
Assessments Overview:
![Assessments Overview Screenshot](https://github.com/mattlyons0/Assessorator/blob/master/screenshots/assessmentsOverview.png?raw=true)
Edit Assessment:
![Edit Assessment Screenshot](https://github.com/mattlyons0/Assessorator/blob/master/screenshots/assessmentDemo.png?raw=true)
Export Assessment:
![Export Assessment Screenshot](https://github.com/mattlyons0/Assessorator/blob/master/screenshots/assessmentExport.png?raw=true)
Questions Overview:
![Questions Overview Screenshot](https://github.com/mattlyons0/Assessorator/blob/master/screenshots/questionsOverview.png?raw=true)
Edit Question:
![Edit Question Screenshot](https://github.com/mattlyons0/Assessorator/blob/master/screenshots/questionDemo.png?raw=true)

### Usage
- Download and install the [Latest Release](https://github.com/mattlyons0/Assessorator/releases)
- *Optionally Import (File -> Import Database) [demoImport.json](https://github.com/mattlyons0/Assessorator/blob/master/demoImport.json)*
  - [demoImport.json](https://github.com/mattlyons0/Assessorator/blob/master/demoImport.json) will import a dummy course (CPI 101) containing dummy data which can be used to familiarize yourself with the application
- Create Assessments then Export them to generate edX syntax (which can be used in edX itself to import an assessment)

### Features
- Store Courses with Databanks of various information
  - Topics
    - Topic Areas to map questions to
    - Each question may only have 1 Topic
  - Objectives
    - Objectives are a more flexible way to map questions
    - Each question may have any number of objectives it covers
  - Questions
    - Questions are what the student will be given on the grading platform upon Assessment export
    - Each question must have a string, may have a description, may have a Topic and may have many objectives
    - Three Question types are supported
      - Multiple Choice
      - Multiple Answer
      - True/False
    - By default answer orderings are randomized but responses can be pinned to location as desired
  - Assessments
    - Saved 'Templates' used to generate Assessments
      - Can generate Assessments based on Added Questions or Requirements
    - Added Questions
      - Questions which will always be included in generated Assessment
    - Requirements
      - A Rule which must be fulfilled in generated Assessment
      - Requires a certain amount of Questions matching Topic(s) or Objective(s) to be included in generated Assessment
- UI
  - UI is a SPA designed for usability
  - There are many right click menus throughout the application and consistent design is used when possible
  - Filtering Sorting and Bulk operations are available when applicable
  - UI is designed to scale and handle large banks of questions, assessments, objectives and topics
  - UI preferences are remembered across sessions
- Misc
  - Support export and import of database
  - Automatically Backups (locally to configurable location)
  - Automatic Updates (Windows Only)
  - UI Tested with HCI Usability Study

### Technology
- [Electron](https://electron.atom.io/) - Cross Platform Application Tool (With [community extension](https://github.com/electron-userland/electron-builder) to support auto updates)
- [AngularJS 1](https://angularjs.org/) - UI Data Binding
- [Bootstrap 3](http://getbootstrap.com/) - UI Theme
- [Angular UI Bootstrap](https://angular-ui.github.io/bootstrap/) - Angular 1 bindings for Bootstrap
- [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API) - Data Storage
- Various Smaller Libraries - See [package.json](https://github.com/mattlyons0/Assessorator/blob/master/package.json)
