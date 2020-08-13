import { reroute } from "./reroute";

export const routingEventsListeningTo = ['hashchange', 'popstate'];

function urlReroute() {
    reroute([], arguments);
}

const  capturedEventListeners = {
    hashchange:[],
    popstate: [],
}

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
}
window.removeEventListener = function (eventName, fn) {
    if (routingEventsListeningTo.indexOf(eventName) > 0) {
        capturedEventListeners[eventName] = capturedEventListeners[eventName].filter(l => l !== fn)
        return;
    }
    return originalRemoveEventListener.apply(this, arguments);
}

function patchedUpdateState(updateState, methodName) {
    return function () {
        const urlBefore = window.location.href;
        updateState.apply(this, arguments); 
        const urlAfter = window.location.href;

        if (urlBefore !== urlAfter) {
            urlReroute(new PopStateEvent('popstate'))
        }
    }
    
}

window.history.pushState = patchedUpdateState(window.history.pushState, 'pushState')
window.history.replaceState = patchedUpdateState(window.history.replaceState, 'replaceState')