const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const fs = require("fs");
const { spawn } = require("child_process");

let splash;
let mainWindow;
let backendProcess;
let backendPort = 8000;
let logFilePath = "";
const MAX_LOG_BYTES = 10 * 1024 * 1024;
const MAX_LOG_FILES = 5;

function rotateLogsIfNeeded() {
  try {
    if (!logFilePath || !fs.existsSync(logFilePath)) return;
    const size = fs.statSync(logFilePath).size;
    if (size < MAX_LOG_BYTES) return;

    for (let i = MAX_LOG_FILES - 1; i >= 1; i -= 1) {
      const src = `${logFilePath}.${i}`;
      const dst = `${logFilePath}.${i + 1}`;
      if (fs.existsSync(src)) {
        fs.renameSync(src, dst);
      }
    }
    fs.renameSync(logFilePath, `${logFilePath}.1`);
  } catch {
    // no-op
  }
}

function writeLog(level, message) {
  try {
    if (!logFilePath) return;
    rotateLogsIfNeeded();
    fs.appendFileSync(logFilePath, `${new Date().toISOString()} [${level}] ${message}\n`, "utf-8");
  } catch {
    // no-op
  }
}

function setupElectronLogging() {
  const logDir = path.join(app.getPath("userData"), "logs");
  fs.mkdirSync(logDir, { recursive: true });
  logFilePath = path.join(logDir, "electron.log");
  writeLog("INFO", "Electron logger initialized");
}

function pushSplashStatus(message) {
  writeLog("INFO", `Splash status: ${message}`);
  if (splash && !splash.isDestroyed()) {
    splash.webContents.send("startup-status", { message });
  }
}

function getBackendBaseDir() {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, "backend");
  }
  return path.resolve(__dirname, "..", "..", "backend");
}

function getPortFilePath() {
  return path.join(getBackendBaseDir(), "data", "server.port");
}

function createSplash() {
  splash = new BrowserWindow({ width: 480, height: 320, frame: false, alwaysOnTop: true, webPreferences: { preload: path.join(__dirname, "preload.js") } });
  splash.loadFile(path.join(__dirname, "splash.html"));
}

function createMain() {
  mainWindow = new BrowserWindow({ width: 1280, height: 800, webPreferences: { preload: path.join(__dirname, "preload.js") } });
  if (app.isPackaged) {
    mainWindow.loadFile(path.join(__dirname, "..", "dist", "index.html"));
  } else {
    mainWindow.loadURL("http://localhost:5174");
  }
}

function readPortFile() {
  try {
    const p = getPortFilePath();
    if (fs.existsSync(p)) {
      backendPort = parseInt(fs.readFileSync(p, "utf-8").trim(), 10) || 8000;
    }
  } catch {
    backendPort = 8000;
  }
}

function startBackend() {
  return new Promise((resolve, reject) => {
    const backendBase = getBackendBaseDir();
    const scriptPath = path.join(backendBase, "run_server.py");
    pushSplashStatus("Iniciando backend...");

    if (app.isPackaged) {
      const runner = path.join(backendBase, "factutienda-backend.exe");
      if (!fs.existsSync(runner)) {
        writeLog("ERROR", `Backend executable not found: ${runner}`);
        reject(new Error(`Backend no encontrado en: ${runner}`));
        return;
      }
      writeLog("INFO", `Starting packaged backend: ${runner}`);
      backendProcess = spawn(runner, [], { detached: false, windowsHide: true, cwd: backendBase });
      backendProcess.on("error", (err) => {
        writeLog("ERROR", `Packaged backend startup error: ${err.message}`);
        reject(err);
      });
    } else {
      if (!fs.existsSync(scriptPath)) {
        writeLog("ERROR", `run_server.py not found: ${scriptPath}`);
        reject(new Error(`run_server.py no encontrado en: ${scriptPath}`));
        return;
      }
      writeLog("INFO", `Starting dev backend script: ${scriptPath}`);
      backendProcess = spawn("python", [scriptPath], { detached: false, windowsHide: true, cwd: backendBase });
      backendProcess.on("error", () => {
        pushSplashStatus("'python' no disponible, probando con python3...");
        writeLog("WARN", "python unavailable, trying python3");
        backendProcess = spawn("python3", [scriptPath], { detached: false, windowsHide: true, cwd: backendBase });
        backendProcess.on("error", (err) => {
          writeLog("ERROR", `python3 startup error: ${err.message}`);
          reject(err);
        });
      });
    }

    const start = Date.now();
    const timer = setInterval(async () => {
      pushSplashStatus("Conectando base de datos...");
      readPortFile();
      try {
        const res = await fetch(`http://127.0.0.1:${backendPort}/health`);
        if (res.ok) {
          clearInterval(timer);
          pushSplashStatus("Listo");
          writeLog("INFO", `Backend health OK on port ${backendPort}`);
          resolve();
          return;
        }
      } catch {}
      if (Date.now() - start > 30000) {
        clearInterval(timer);
        writeLog("ERROR", "Backend startup timeout (30s)");
        reject(new Error("Timeout iniciando backend"));
      }
    }, 1000);
  });
}

function backupDatabaseOnExit() {
  try {
    const backendBase = getBackendBaseDir();
    const dbPath = path.join(backendBase, "data", "factutienda.db");
    if (!fs.existsSync(dbPath)) return;
    const backupDir = path.join(backendBase, "data", "backups");
    fs.mkdirSync(backupDir, { recursive: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const target = path.join(backupDir, `close_backup_${stamp}.db`);
    fs.copyFileSync(dbPath, target);
  } catch {
    // no-op
  }
}

app.whenReady().then(async () => {
  setupElectronLogging();
  writeLog("INFO", "Electron app ready");
  createSplash();
  pushSplashStatus("Iniciando backend...");
  try {
    await startBackend();
    pushSplashStatus("Cargando interfaz POS...");
    createMain();
    writeLog("INFO", "Main window created");
    splash?.close();
  } catch (err) {
    writeLog("ERROR", `Startup failed: ${err.message}`);
    dialog.showErrorBox("Error", `No se pudo iniciar backend: ${err.message}`);
    app.quit();
  }
});

app.on("before-quit", () => {
  writeLog("INFO", "before-quit received");
  backupDatabaseOnExit();
  if (backendProcess) {
    writeLog("INFO", "Stopping backend process");
    backendProcess.kill();
  }
});

ipcMain.handle("get-backend-port", () => backendPort);
