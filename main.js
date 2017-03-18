'use strict';

const electron = require('electron');
const autoUpdater = require('electron-auto-updater').autoUpdater;
const app = electron.app; // Module to control application life.
const BrowserWindow = electron.BrowserWindow; // Module to create native browser window.
const dialog = electron.dialog;
const windowState = require('electron-window-state');
const os = require('os');
const pkg = require('./package.json');
const path = require('path');
const logger = require('electron-log');

let autoUpdaterTriggered = false;

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

//If something causes the process to crash before opening, log that
process.on('uncaughtException',function (error){
  logger.error('Uncaught exception in main process:');
  logger.error(error);
  console.error('Uncaught exception:');
  console.error(error);
});

function registerUpdater(){
  //Don't autoupdate dev env or linux
  if(process.env.NODE_ENV === 'dev' || os.platform() === 'linux') {
    return;
  }

  autoUpdater.logger = require('electron-log');
  autoUpdater.logger.transports.file.level = 'info';

  autoUpdater.addListener('update-available', function(event) {
    autoUpdaterTriggered = true;

    showToast('A update is available and will be downloaded in the background shortly.');
    showToast('<p style="text-align:center">Downloading Update at 0.00 mbps<p/>' +
      '<div class="progress progress-striped active"><div class="progress-bar progress-bar-info" style="width:100%">Starting Download...</div></div>',
      {level: 'success', keepOpen: true, noClick: true, disallowClose: true, apply: true}, 'downloadProgress');
  });
  autoUpdater.addListener('update-downloaded', function(event,releaseNotes,releaseName,releaseDate,updateURL){
    mainWindow.send('dismissToast','downloadProgress');

    showToast('<p>A new update is ready to install.<br/><i>'+ pkg.name +' v'+ releaseName +'</i> will be automatically<br/>installed once the application is closed.</p>' +
      '<div style="text-align:center"><p class="btn btn-default" onclick="require(\'electron\').ipcRenderer.send(\'installUpdate\')" ' +
      'style="opacity:.75; margin 0 !important;">Restart and Install Now</p></div>', {level: 'success', keepOpen: true, noClick: true, compile: true, apply: true});
  });
  autoUpdater.addListener('download-progress', function(data){
    editToast('downloadProgress','<p style="text-align:center">Downloading Update at '+ (data.bytesPerSecond/125000.0).toFixed(2) +' mbps</p>'+
      '<div class="progress progress-striped active"><div class="progress-bar" style="width:'+data.percent+'%">'+(data.percent).toFixed(2)+'%</div></div>');
  });
  autoUpdater.addListener('error', function(error){
    console.warn('Error checking for updates:');
    console.warn(error);
  });
  autoUpdater.addListener('checking-for-update', function(event){
    console.log('Checking for updates...');
  });
  autoUpdater.addListener('update-not-available', function(){
    console.log('Up to date!');
  });

  autoUpdater.checkForUpdates();
}

function createWindow() {
  //Save window location and make sure it is visible on screen
  const widthMult = 0.9;
  const heightMult = 0.85;
  let mainDisplay = electron.screen.getPrimaryDisplay();
  let mainState = new windowState({defaultWidth:mainDisplay.size.width * 0.9,defaultHeight:mainDisplay.size.height * 0.85});
  let x = mainState.x;
  let y = mainState.y;
  let width = mainState.width;
  let height = mainState.height;
  let displays = electron.screen.getAllDisplays();
  let top=0,bottom=0,left=0,right=0;
  for(let display of displays){
    if(display.bounds.x < left)
      left = display.bounds.x;
    if(display.bounds.y < bottom)
      bottom = display.bounds.y;
    if(display.bounds.x+display.size.width > right)
      right = display.bounds.x+display.size.width;
    if(display.bounds.y+display.size.height > top)
      top = display.bounds.y+display.size.height;
  }
  if(x < left || x+width > right || y+height > top || y < bottom){
    let newDisplay = electron.screen.getDisplayNearestPoint({x:x,y:y});
    width = Math.round(newDisplay.size.width * 0.9);
    height = Math.round(newDisplay.size.height * 0.85);
    x = (newDisplay.size.width/2)-(width/2);
    y = (newDisplay.size.height/2)-(height/2);
  }

  // Create the browser window.
  mainWindow = new BrowserWindow({width: width, height: height,x: x, y: y, icon: path.join(__dirname,'titlebarIcon.png'), webPreferences: {"zoomFactor": 1.0}}); //If things are too big we can zoom out possibly

  mainState.manage(mainWindow); //Hook to store location on close

  mainWindow.loadURL('file://' + __dirname + '/public/index.html');

  if(process.env.NODE_ENV === 'dev') {
    mainWindow.webContents.openDevTools(); // Open the DevTools.
  }

  mainWindow.on('close',function(e){
    mainWindow.hide(); //Appear as the window is closed

    e.preventDefault(); //Delay closing until onClose finishes
    mainWindow.webContents.executeJavaScript("UI.onClose()"); //Execute UI.onClose() which will destroy the window
  });

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object
    mainWindow = null;
  });

  mainWindow.on('unresponsive',function(){
    let name = pkg.name;
    let buttons = ["Restart (Unsaved Changes Will Be Lost!)", "Wait"];

    dialog.showMessageBox({type: "question", buttons: buttons, title: name+" has become unresponsive",
    message: "Would you like to restart the application or wait?"}, function(response){
      if(response === 0){ //Kill the window
        mainWindow.destroy();
        createWindow();

      } else{ //Wait

      }
    });
  })
}

function showToast(content,options,tidName){
  mainWindow.send('toast',content,options,tidName);
}
function editToast(tidName,newContent){
  mainWindow.send('editToast',tidName,newContent);
}
//Called by autoupdate tooltip once update is done downloading
electron.ipcMain.on('installUpdate', function(){
  autoUpdater.quitAndInstall();
});

electron.ipcMain.on('updateConfig', function(info,updateMode){
  if(autoUpdaterTriggered)
    return;

  if(updateMode === 0){ //Automatic
    registerUpdater();
  }
  // Otherwise disabled
});

//Called by UI.onClose() once close scripts are done running
electron.ipcMain.on('destroy', function(){
  mainWindow.destroy();
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.on('ready', function () {
  createWindow();
});

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow();
  }
});
