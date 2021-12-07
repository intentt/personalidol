import express from "express";
import getPort from "get-port";
import path from "path";
import { app, BrowserWindow } from "electron";

const server = express();

server.use("/g/personalidol", express.static(path.join(__dirname, "../public")));

let serverHandle = null;
let serverPort = null;

const createWindow = function () {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
  });

  mainWindow.loadURL(`http://127.0.0.1:${serverPort}/g/personalidol/index.html`);
  mainWindow.webContents.openDevTools();
};

app.on("ready", async function () {
  serverPort = await getPort();

  serverHandle = server.listen(serverPort);
  createWindow();
});

app.on("window-all-closed", function () {
  if (serverHandle) {
    serverHandle.close();
  }
  app.quit();
});

app.on("activate", function () {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
