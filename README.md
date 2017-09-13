Assessorator
=====

### Purpose
- Manage a large database of Multiple Choice Questions
- Generate Assessments with random questions meeting specified criteria
- Reduce need to create new questions by simply regenerating assessments each semester to introduce new questions

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
