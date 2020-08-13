import {
  LOADING_SOURCE_CODE,
  NOT_BOOTSTRAPPED,
} from "../applications/app.helpers";

function flattenFnArray(fns) {
  fns = Array.isArray(fns) ? fns : [fns];
  return function (props) {
    return fns.reduce((p, fn) => p.then(() => fn(props)), Promise.resolve());
  };
}

export async function toLoadPromise(app) {
  if (app.loadingPromise) {
    return app.loadingPromise; // 缓存机制
  }

  return (app.loadingPromise = Promise.resolve().then(async () => {
    app.status = LOADING_SOURCE_CODE;

    let { bootstrap, mount, unmount } = await app.loadApp(app.customProps);
    app.status = NOT_BOOTSTRAPPED;

    // bootstrap可能是数组，需要compose 拍平
    app.bootstrap = flattenFnArray(bootstrap);
    app.mount = flattenFnArray(mount);
    app.unmount = flattenFnArray(unmount);

    delete app.loadingPromise;
    return app;
  }));
}
