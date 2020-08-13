import {
  NOT_LOADED,
  SKIP_BECAUSE_BROKEN,
  shouldBeActive,
  LOADING_SOURCE_CODE,
  NOT_BOOTSTRAPPED,
  NOT_MOUNTED,
  BOOTSTRAPPING,
  MOUNTED,
} from "./app.helpers";
import { reroute } from "../navigations/reroute";
import * as ss from '../navigations/navigator-event';

const apps = []; // 存放所有应用

export function registerApplication(appName, loadApp, activeWhen, customProps) {
  apps.push({
    name: appName,
    customProps,
    loadApp,
    activeWhen,
    status: NOT_LOADED,
  });

  // 预先加载应用
  reroute(); // 加载应用
}

export function getAppChanges() {
  const appsToUnmount = []; // 要卸载的app
  const appsToLoad = []; // 要加载的app
  const appsToMount = []; // 要挂载的app

  apps.forEach((app) => {
    // 需不需要被加载
    const appShouldBeActive =
      app.status !== SKIP_BECAUSE_BROKEN && shouldBeActive(app);
    switch (app.status) {
      case NOT_LOADED:
      case LOADING_SOURCE_CODE:
        if (appShouldBeActive) {
          appsToLoad.push(app);
        }
        break;
      case NOT_BOOTSTRAPPED:
      case NOT_MOUNTED:
      case BOOTSTRAPPING:
        if (appShouldBeActive) {
          appsToMount.push(app);
        }
      case MOUNTED:
        if (!appShouldBeActive) {
          appsToUnmount.push(app);
        }
      default:
        break;
    }
  });
  return {
    appsToMount,
    appsToLoad,
    appsToUnmount,
  };
}
