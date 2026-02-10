const { app, BrowserWindow, Menu, protocol, net } = require("electron");
const path = require("path");

const OUT_DIR = path.join(__dirname, "..", "out");

// Register custom scheme before app is ready
protocol.registerSchemesAsPrivileged([
  {
    scheme: "app",
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
    },
  },
]);

function createWindow() {
  const win = new BrowserWindow({
    width: 1920,
    height: 1080,
    fullscreen: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  Menu.setApplicationMenu(null);

  win.loadURL("app://./index.html");

  // Esc to exit fullscreen, F11 to toggle
  win.webContents.on("before-input-event", (event, input) => {
    if (input.key === "Escape" && win.isFullScreen()) {
      win.setFullScreen(false);
    }
    if (input.key === "F11") {
      win.setFullScreen(!win.isFullScreen());
    }
  });
}

app.whenReady().then(() => {
  // Handle custom protocol — serves files from out/ directory
  protocol.handle("app", (request) => {
    const url = new URL(request.url);
    let filePath = decodeURIComponent(url.pathname);

    // Resolve to out/ directory
    const fullPath = path.join(OUT_DIR, filePath);
    return net.fetch("file://" + fullPath);
  });

  createWindow();
});

app.on("window-all-closed", () => {
  app.quit();
});
