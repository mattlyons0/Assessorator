'use strict';

const electron = require('electron');
const app = electron.app; // Module to control application life.
const BrowserWindow = electron.BrowserWindow; // Module to create native browser window.
const dialog = electron.dialog;

const pkg = require('./package.json');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({width: 800, height: 600, icon: './icon.png', webPreferences: {"zoomFactor": 0.9}}); //If things are too big we can zoom out possibly

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
      if(response == 0){ //Kill the window
        mainWindow.destroy();
        createWindow();

      } else{ //Wait

      }
    });
  })
}

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