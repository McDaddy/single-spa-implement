const window = {
  name: "window",
  type: "doc",
};

class ProxySandbox {
  constructor(target) {
    const rawTarget = target;
    const fakeTarget = {};
    const proxy = new Proxy(fakeTarget, {
      set(t, p, value) {
        t[p] = value;
        return true;
      },
      get(t, p) {
        return t[p] || rawTarget[p];
      },
    });
    this.proxy = proxy;
  }
}
let sandbox1 = new ProxySandbox(window);
let sandbox2 = new ProxySandbox(window);
window.a = 1;

((window) => {
  window.a = "hello";
  console.log("sandbox1 type", window.type);
  console.log("sandbox1", window);
})(sandbox1.proxy);

((window) => {
  window.a = "world";
  console.log("sandbox2", window);
})(sandbox2.proxy);

console.log("outside", window);
