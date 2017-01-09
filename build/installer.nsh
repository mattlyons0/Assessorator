!macro customInstall
  WinShell::UninstShortcut "$desktopLink"
  Delete "$desktopLink"
  System::Call 'shell32::SHChangeNotify(i, i, i, i) v (0x08000000, 0, 0, 0)'
!macroend