module.exports = function(grunt){
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    'create-windows-installer': {
      x64: {
        appDirectory: 'bin/Assessorator-win32-x64',
        outputDirectory: 'bin/Installer-Win64',
        authors: 'Matt Lyons',
      },
      ia32: {
        appDirectory: 'bin/Assessorator-win32-ia32',
        outputDirectory: 'bin/Installer-Win32',
        authors: 'Matt Lyons'
      }
    }
  });

  grunt.loadNpmTasks('grunt-electron-installer');
};