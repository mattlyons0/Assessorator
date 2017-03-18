'use strict';

let pathh = require('path');

app.controller("settingsCtrl", function ($scope) {
  $scope.setting = {
    autoUpdate: {
      options: ['Automatic', 'Disable'],
      selectedIndex: Number(localStorage.autoUpdate)
    },
    backup: {
      enabled: Number(localStorage.backupEnabled),
      path: localStorage.backupPath,
      pathVerified: true,
      pathError: undefined
    }
  };
  let setting = $scope.setting;

  $scope.save = () => {
    if(setting.backup.enabled && setting.backup.pathVerified !== true){
      showToast('Unable to access backup folder. Use a different folder.',{level: 'danger',delay:10});
      return;
    }

    localStorage.autoUpdate = setting.autoUpdate.selectedIndex;
    localStorage.backupEnabled = setting.backup.enabled;
    localStorage.backupPath = setting.backup.path;

    $scope.$close();
  };

  $scope.changeBackupPath = (chooser) => {
    $scope.$apply( ($scope) =>{
      setting.backup.path = chooser.files[0].path;
      setting.backup.pathVerified = 'verifying';

      try {
        fs.accessSync(setting.backup.path, fs.constants.W_OK);
        setting.backup.pathVerified = true;
      } catch (err) {
        setting.backup.pathVerified = false;
        setting.backup.pathError = err.message;
      }
    });
  };

  $scope.defaultBackupPath = () =>{
    let appD = require('appdirectory');
    let dir = new appD("Assessorator");

    setting.backup.pathVerified = true;
    setting.backup.path = dir.userData();
  }

  $scope.joinPath = (path1, path2) =>{
    return pathh.join(path1,path2);
  }
});