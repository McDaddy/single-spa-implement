import { started } from "../start";
import { getAppChanges } from "../applications/app";
import { toLoadPromise } from '../lifecycles/load'
import { toBootstrapPromise } from "../lifecycles/bootstrap";
import { toMountPromise } from "../lifecycles/mount";
import { toUnmountPromise } from "../lifecycles/unmount";


// 核心方法
export function reroute() {
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
        })

        appsToMount.map(async (app) => {
            app = await toBootstrapPromise(app);
            return toMountPromise(app);
        })
    }

    async function loadApps() { // 预加载应用
        // 加载需要加载的
       let apps = await Promise.all(appsToLoad.map(toLoadPromise)); // 将获取到的bootstrap mount unmount 方法放到app上

    }
}