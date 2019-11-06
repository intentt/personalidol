// @flow

import raf from "raf";
import React from "react";
import ReactDOM from "react-dom";
import yn from "yn";

import BusClock from "./framework/classes/BusClock";
import ClockReactiveController from "./framework/classes/ClockReactiveController";
import Debugger from "./framework/classes/Debugger";
import ExceptionHandler from "./framework/classes/ExceptionHandler";
import ExpressionBus from "./framework/classes/ExpressionBus";
import ExpressionContext from "./framework/classes/ExpressionContext";
import LoadingManager from "./framework/classes/LoadingManager";
import Logger from "./framework/classes/Logger";
import LoggerBreadcrumbs from "./framework/classes/LoggerBreadcrumbs";
import Main from "./components/Main";
import QueryBus from "./framework/classes/QueryBus";

function init(rootElement: HTMLElement) {
  const loggerBreadcrumbs = new LoggerBreadcrumbs();
  const logger = new Logger();
  const debug = new Debugger();
  const exceptionHandler = new ExceptionHandler(logger);
  const expressionBus = new ExpressionBus();
  const expressionContext = new ExpressionContext(loggerBreadcrumbs.add("ExpressionContext"));
  const loadingManager = new LoadingManager(loggerBreadcrumbs.add("LoadingManager"));
  const queryBus = new QueryBus(loggerBreadcrumbs.add("QueryBus"));
  const clockReactiveController = new ClockReactiveController(new BusClock(), queryBus);

  debug.setIsEnabled(
    yn(process.env.REACT_APP_DEBUG, {
      default: false,
    })
  );

  ReactDOM.render(
    <React.StrictMode>
      <Main
        clockReactiveController={clockReactiveController}
        debug={debug}
        exceptionHandler={exceptionHandler}
        expressionBus={expressionBus}
        expressionContext={expressionContext}
        loadingManager={loadingManager}
        logger={logger}
        loggerBreadcrumbs={loggerBreadcrumbs}
        queryBus={queryBus}
      />
    </React.StrictMode>,
    rootElement
  );
}

function checkInit() {
  const rootElement = document.getElementById("root");

  if (rootElement) {
    if (rootElement.className === "js-dd-capable") {
      return void init(rootElement);
    } else if (rootElement.className === "js-dd-incapable") {
      return;
    }
  }

  raf(checkInit);
}

raf(checkInit);
