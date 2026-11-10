; ============================================================================
; NSIS Per-User Installation Script (Installs to Local AppData)
; ============================================================================

!define APP_NAME "Hunterlog"
!define COMP_NAME "krinkl3"
!define VERSION "0.0.11"
!define EXE_NAME "hunterlog.exe"

Name "${APP_NAME}"
OutFile "Setup_${APP_NAME}.exe"

; CRITICAL: Tell Windows this installer does NOT need admin/UAC elevation.
; It will run completely under standard user rights.
RequestExecutionLevel user

; Set the default installation directory to %LOCALAPPDATA%\Programs\AppName
InstallDir "$LOCALAPPDATA\Programs\${APP_NAME}"

; not used [cmw]
; Registry key for application settings (Current User hive)
; !define REG_KEY "Software\${COMP_NAME}\${APP_NAME}"

; Registry key for Windows Apps & Features Uninstallation entry
!define UNINSTALL_KEY "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}"

; ============================================================================
; INCLUDES & INTERFACE CONFIGURATION
; ============================================================================
!include "MUI2.nsh"

!define MUI_ABORTWARNING
!define MUI_WELCOMEFINISHPAGE_INI

; Installer Pages
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

; Uninstaller Pages
!insertmacro MUI_UNPAGE_WELCOME
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_UNPAGE_FINISH

; Language
!insertmacro MUI_LANGUAGE "English"

; ============================================================================
; INSTALLATION SECTION
; ============================================================================
Section "MainSection" SEC01

    ; Set shell context to current user so constants like $SMPROGRAMS and $DESKTOP 
    ; point to the specific user's folders rather than "All Users".
    SetShellVarContext current

    ; Create installation directory and copy files
    SetOutPath "$INSTDIR"
    
    ; Replace "myapp.exe" with your compiled file, or use: File /r "path\to\your\files\*.*"
    FILE /r "..\dist\*.*"

    ; Create uninstaller
    WriteUninstaller "$INSTDIR\uninstall.exe"

    ; Create Shortcuts for the current user
    CreateDirectory "$SMPROGRAMS\${APP_NAME}"
    CreateShortcut "$SMPROGRAMS\${APP_NAME}\${APP_NAME}.lnk" "$INSTDIR\${EXE_NAME}"
    CreateShortcut "$SMPROGRAMS\${APP_NAME}\Uninstall ${APP_NAME}.lnk" "$INSTDIR\uninstall.exe"
    CreateShortcut "$DESKTOP\${APP_NAME}.lnk" "$INSTDIR\${EXE_NAME}"

    ; Write the registry entries for Windows Add/Remove Programs (HKCU hive)
    WriteRegStr HKCU "${UNINSTALL_KEY}" "DisplayName" "${APP_NAME}"
    WriteRegStr HKCU "${UNINSTALL_KEY}" "UninstallString" '"$INSTDIR\uninstall.exe"'
    WriteRegStr HKCU "${UNINSTALL_KEY}" "DisplayIcon" '"$INSTDIR\${EXE_NAME}"'
    WriteRegStr HKCU "${UNINSTALL_KEY}" "DisplayVersion" "${VERSION}"
    WriteRegStr HKCU "${UNINSTALL_KEY}" "Publisher" "${COMP_NAME}"

SectionEnd

; ============================================================================
; UNINSTALLATION SECTION
; ============================================================================
Section "Uninstall"

    SetShellVarContext current

    ; Remove application files (Be explicit to prevent accidental over-deletion)
    Delete "$INSTDIR\${EXE_NAME}"
    Delete "$INSTDIR\uninstall.exe"
    
    ; Remove directory if empty
    RMDir "$INSTDIR"
    ; Remove parent folder if empty (e.g., if you want to clean up the 'Programs' stack)
    RMDir "$LOCALAPPDATA\Programs\${APP_NAME}" 

    ; remove Hunterlogs data dir
    RMDir /r "$LOCALAPPDATA\Programs\${APP_NAME}\data" 


    ; Remove shortcuts
    Delete "$SMPROGRAMS\${APP_NAME}\${APP_NAME}.lnk"
    Delete "$SMPROGRAMS\${APP_NAME}\Uninstall ${APP_NAME}.lnk"
    RMDir "$SMPROGRAMS\${APP_NAME}"
    Delete "$DESKTOP\${APP_NAME}.lnk"

    ; Clean up registry hives
    DeleteRegKey HKCU "${UNINSTALL_KEY}"


SectionEnd
