import express from "express";
import getPort from "get-port";
import path from "path";
import { app, BrowserWindow } from "electron";

import type { Server } from "http";

const server = express();

server.use("/g/personalidol", express.static(path.join(__dirname, "../public")));

let serverHandle: null | Server = null;
let serverPort: null | number = null;

const createWindow = function () {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
  });

  mainWindow.setMenu(null);
  mainWindow.loadURL(`http://127.0.0.1:${serverPort}/g/personalidol/index.html`);
};

app.on("ready", async function () {
  serverPort = await getPort();

  if (!serverPort) {
    process.crash();
  }

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

process.on("beforeExit", function () {
  app.quit();
});
