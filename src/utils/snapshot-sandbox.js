const window = {
  name: "window",
  type: "doc",
};

class SnapshotSandbox {
  constructor(target) {
    this.proxy = target;
    this.modifyPropsMap = {}; // 修改了那些属性
    this.active();
  }
  active() {
    this.targetSnapshot = {}; // window对象的快照
    for (const prop in this.proxy) {
      if (this.proxy.hasOwnProperty(prop)) {
        // 将target上的属性进行拍照
        this.targetSnapshot[prop] = this.proxy[prop];
      }
    }
    Reflect.ownKeys(this.modifyPropsMap).forEach((p) => {
        this.proxy[p] = this.modifyPropsMap[p];
    });
  }
  inactive() {
    for (const prop in this.proxy) {
      // diff 差异
      if (this.proxy.hasOwnProperty(prop)) {
        // 将上次拍照的结果和本次target属性做对比
        if (this.proxy[prop] !== this.targetSnapshot[prop]) {
          // 保存修改后的结果
          this.modifyPropsMap[prop] = this.proxy[prop];
          // 还原target
          this.proxy[prop] = this.targetSnapshot[prop];
        }
      }
    }
  }
}

const sandbox = new SnapshotSandbox(window);
((window) => {
  console.log("after sandbox active", window);
  window.a = 1;
  window.b = 2;
  window.c = 3;
  window.name = "s1";
//   delete window.type;
  console.log("before sandbox inactive", window);
  sandbox.inactive();
  console.log("after sandbox inactive", window);
  sandbox.active();
  console.log("after sandbox active again", window);
})(sandbox.proxy);
