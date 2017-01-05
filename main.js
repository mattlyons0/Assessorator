'use strict';

const electron = require('electron');
const autoUpdater = require('electron-auto-updater').autoUpdater;
const app = electron.app; // Module to control application life.
const BrowserWindow = electron.BrowserWindow; // Module to create native browser window.
const dialog = electron.dialog;

const pkg = require('./package.json');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

function registerUpdater(){
  //Don't autoupdate dev env or linux
  // if(process.env.NODE_ENV === 'dev' || os.platform() === 'linux') {
  //   return;
  // }
  const version = app.getVersion();

  autoUpdater.addListener('update-available', function(event) {
    showToast('A update is available');
  });
  autoUpdater.addListener('update-downloaded', function(event,releaseNotes,releaseName,releaseDate,updateURL){
    showToast('A new update is ready to install. Version '+ releaseName +' released on '+ releaseDate +' will be automatically installed on Quit');
    showToast('Changes: '+releaseNotes+'\nURL: '+updateURL);
  });
  autoUpdater.addListener('error', function(error){
    showToast('Error within autoUpdater.','','error');
    showToast(error);
  });
  autoUpdater.addListener('checking-for-update', function(event){
    showToast('Checking for update...');
  });
  autoUpdater.addListener('update-not-available', function(){
    showToast('Update not available');
  });

  mainWindow.webContents.once('did-frame-finish-load', function(event){
    showToast('trigger update check');
    autoUpdater.checkForUpdates();
  });
}

function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({width: 1280, height: 720, icon: './icon.png', webPreferences: {"zoomFactor": 1.0}}); //If things are too big we can zoom out possibly

  mainWindow.loadURL('file://' + __dirname + '/public/index.html');

  if(process.env.NODE_ENV === 'dev') {
    // Open the DevTools.
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('close',function(e){
    // mainWindow.hide(); //Appear as the window is closed

    // e.preventDefault(); //Delay closing until onClose finishes
    // mainWindow.webContents.executeJavaScript("UI.onClose()",function(){mainWindow.destroy();}); //Execute UI.onClose() then destroy the window
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

function showToast(title,content,level){
  mainWindow.send('toast',title,content,level);
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.on('ready', function () {
  createWindow();
  registerUpdater();
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