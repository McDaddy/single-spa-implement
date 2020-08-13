(function (global, factory) {
   typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
   typeof define === 'function' && define.amd ? define(['exports'], factory) :
   (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.singleSpa = {}));
}(this, (function (exports) { 'use strict';

   // 描述应用的整个状态
   const NOT_LOADED = 'NOT_LOADED';// 应用初始状态
   const LOADING_SOURCE_CODE ='LOADING_SOURCE_CODE'; // 加载资源
   const NOT_BOOTSTRAPPED = 'NOT_BOOTSTRAPPED'; // 还没有调用bootstrap方法
   const BOOTSTRAPPING = 'BOOTSTRAPPING'; // 启动中
   const NOT_MOUNTED = 'NOT_MOUNTED';// 没有调用mount方法
   const MOUNTING = 'MOUNTING'; // 正在挂载中
   const MOUNTED = 'MOUNTED'; // 挂载完毕
   const UNMOUNTING = 'UNMOUNTING'; // 解除挂载
   const SKIP_BECAUSE_BROKEN = 'SKIP_BECAUSE_BROKEN';
   // 当前这个应用是否要被激活
   function shouldBeActive(app){ //如果返回true 那么应用应该就开始初始化等一系列操作
      return app.activeWhen(window.location)
   }

   let started = false;
   function start() {
     started = true;
     reroute();
   }

   function flattenFnArray(fns) {
     fns = Array.isArray(fns) ? fns : [fns];
     return function (props) {
       return fns.reduce((p, fn) => p.then(() => fn(props)), Promise.resolve());
     };
   }

   async function toLoadPromise(app) {
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

   async function toBootstrapPromise(app) {
       if (app.status !== NOT_BOOTSTRAPPED) {
           return app;
       }
       app.status = BOOTSTRAPPING;
       await app.bootstrap(app.customProps);
       app.status = NOT_MOUNTED;
       return app;
   }

   async function toMountPromise(app) {
       if (app.status !== NOT_MOUNTED) {
           return app;
       }
       app.status = MOUNTING;
       await app.mount(app.customProps);
       app.status = MOUNTED;
       return app;
   }

   async function toUnmountPromise(app) {
     if (app.status !== MOUNTED) {
       return app;
     }

     app.status = UNMOUNTING;
     await app.unmount(app.customProps);
     app.status = NOT_MOUNTED;
     return app;
   }

   // 核心方法
   function reroute() {
       // 获取需要变更的应用（加载 挂载 卸载）
       const { appsToLoad, appsToMount, appsToUnmount } = getAppChanges();

       if (started) {
           console.log('调用start时');
           return performAppChanges();
       } else {
           console.log('调用register时， 需要预先加载');
           return loadApps();
       }

       async function performAppChanges() { // 根据路径来装载应用
           // 先卸载需要被卸载的  可以并发卸载
           const apps = appsToUnmount.map(toUnmountPromise);

           // Mount需要加载的应用
           appsToLoad.map(async (app) => {
               app = await toLoadPromise(app);
               app = await toBootstrapPromise(app);
               return toMountPromise(app);
           });

           appsToMount.map(async (app) => {
               app = await toBootstrapPromise(app);
               return toMountPromise(app);
           });
       }

       async function loadApps() { // 预加载应用
           // 加载需要加载的
          let apps = await Promise.all(appsToLoad.map(toLoadPromise)); // 将获取到的bootstrap mount unmount 方法放到app上

       }
   }

   const routingEventsListeningTo = ['hashchange', 'popstate'];

   function urlReroute() {
       reroute();
   }

   const  capturedEventListeners = {
       hashchange:[],
       popstate: [],
   };

   // 
   window.addEventListener('hashchange', urlReroute);
   window.addEventListener('popstate', urlReroute);

   const originalAddEventListener = window.addEventListener;
   const originalRemoveEventListener = window.removeEventListener;

   // 用户自己的路由事件会被覆盖，所以必须把之前的事件方法重新执行
   window.addEventListener = function (eventName, fn) {
       if (routingEventsListeningTo.indexOf(eventName) > 0 && !capturedEventListeners[eventName].some(l => l == fn)) {
           capturedEventListeners[eventName].push(fn);
           return;
       }
       return originalAddEventListener.apply(this, arguments);
   };
   window.removeEventListener = function (eventName, fn) {
       if (routingEventsListeningTo.indexOf(eventName) > 0) {
           capturedEventListeners[eventName] = capturedEventListeners[eventName].filter(l => l !== fn);
           return;
       }
       return originalRemoveEventListener.apply(this, arguments);
   };

   function patchedUpdateState(updateState, methodName) {
       return function () {
           const urlBefore = window.location.href;
           updateState.apply(this, arguments); 
           const urlAfter = window.location.href;

           if (urlBefore !== urlAfter) {
               urlReroute(new PopStateEvent('popstate'));
           }
       }
       
   }

   window.history.pushState = patchedUpdateState(window.history.pushState);
   window.history.replaceState = patchedUpdateState(window.history.replaceState);

   const apps = []; // 存放所有应用

   function registerApplication(appName, loadApp, activeWhen, customProps) {
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

   function getAppChanges() {
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
       }
     });
     return {
       appsToMount,
       appsToLoad,
       appsToUnmount,
     };
   }

   exports.registerApplication = registerApplication;
   exports.start = start;

   Object.defineProperty(exports, '__esModule', { value: true });

})));
