var config = {};

config.welcome = {
  set lastupdate (val) {app.storage.write("lastupdate", val)},
  get lastupdate () {return app.storage.read("lastupdate") !== undefined ? app.storage.read("lastupdate") : 0}
};

config.interface = {
  set size (val) {app.storage.write("interface.size", val)},
  set context (val) {app.storage.write("interface.context", val)},
  get size () {return app.storage.read("interface.size") !== undefined ? app.storage.read("interface.size") : config.interface.default.size},
  get context () {return app.storage.read("interface.context") !== undefined ? app.storage.read("interface.context") : config.interface.default.context},
  "default": {
    "context": "win",
    "size": {
      "width": 900, 
      "height": 650
    }
  }
};

config.settings = {
  set isBubbleIcon (val) {app.storage.write("isBubbleIcon", val)},
  set selection (val) {app.storage.write("isTextSelection", val)},
  set showHighlight (val) {app.storage.write("showHighlight", val)},
  set enableInputArea (val) {app.storage.write("enableInputArea", val)},
  get isBubbleIcon () {return (app.storage.read("isBubbleIcon") !== undefined ? app.storage.read("isBubbleIcon") : true)},
  get showHighlight () {return (app.storage.read("showHighlight") !== undefined ? app.storage.read("showHighlight") : true)},
  get selection () {return (app.storage.read("isTextSelection") !== undefined ? app.storage.read("isTextSelection") : false)},
  get enableInputArea () {return (app.storage.read("enableInputArea") !== undefined ? app.storage.read("enableInputArea") : false)},
  get placeholderIconShow () {return app.storage.read("placeholderIcon-Show") !== undefined ? app.storage.read("placeholderIcon-Show") : 0},
  get placeholderIconTime () {return app.storage.read("placeholderIcon-Time") !== undefined ? app.storage.read("placeholderIcon-Time") : 60},
  set placeholderIconTime (val) {
    val = parseInt(val);
    if (val < 1) val = 1;
    app.storage.write("placeholderIcon-Time", val);
  },
  set placeholderIconShow (val) {
    val = parseInt(val);
    if (val < 0) val = 0;
    app.storage.write("placeholderIcon-Show", val);
  }
};

config.get = function (name) {
  return name.split('.').reduce(function (p, c) {
    return p[c];
  }, config);
};

config.set = function (name, value) {
  const _set = function (name, value, scope) {
    name = name.split('.');
    if (name.length > 1) {
      _set.call((scope || this)[name.shift()], name.join('.'), value);
    } else {
      this[name[0]] = value;
    }
  }
  /*  */
  _set(name, value, config);
};
