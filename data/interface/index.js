var config = {
  "log": false,
  "backup": [],
  "button": {},
  "element": {},
  "audio": null,
  "voices": null,
  "audiotext": [],
  "state": "voice",
  "isplaying": false,
  "audiotextarray": [],
  "page": {"url": "local"},
  "resize": {"timeout": {}},
  "selected": {"parent": null},
  "css": {"id": "tts-highlight-color-css"},
  "addon": {
    "homepage": function () {
      return chrome.runtime.getManifest().homepage_url;
    }
  },
  "nosupport": function (e) {
    config.button.start.disabled = true;
    config.button.dialect.disabled = true;
    config.button.language.disabled = true;
    window.setTimeout(function () {config.button.speak.src = "images/nospeaker.png"}, 500);
  },
  "support": function () {
    config.button.start.disabled = false;
    config.button.dialect.disabled = false;
    config.button.language.disabled = false;
    window.setTimeout(function () {config.button.speak.src = "images/speakeractive.png"}, 500);
  },
  "storage": {
    "local": {},
    "read": function (id) {
      return config.storage.local[id];
    },
    "load": function (callback) {
      chrome.storage.local.get(null, function (e) {
        config.storage.local = e;
        callback();
      });
    },
    "write": function (id, data) {
      if (id) {
        if (data !== '' && data !== null && data !== undefined) {
          var tmp = {};
          tmp[id] = data;
          config.storage.local[id] = data;
          chrome.storage.local.set(tmp, function () {});
        } else {
          delete config.storage.local[id];
          chrome.storage.local.remove(id, function () {});
        }
      }
    }
  },
  "port": {
    "name": '',
    "connect": function () {
      config.port.name = "webapp";
      var context = document.documentElement.getAttribute("context");
      /*  */
      if (chrome.runtime) {
        if (chrome.runtime.connect) {
          if (context !== config.port.name) {
            if (document.location.search === "?tab") config.port.name = "tab";
            if (document.location.search === "?win") config.port.name = "win";
            if (document.location.search === "?popup") config.port.name = "popup";
            /*  */
            if (config.port.name === "popup") {
              document.body.style.width = "650px";
              document.body.style.height = "550px";
            }
            /*  */
            chrome.runtime.connect({"name": config.port.name});
          }
        }
      }
      /*  */
      document.documentElement.setAttribute("context", config.port.name);
    }
  },
  "load": function () {
    config.state = "voice";
    var reload = document.getElementById("reload");
    var support = document.getElementById("support");
    var donation = document.getElementById("donation");
    /*  */
    config.button.speak = document.getElementById("speak");
    config.button.start = document.getElementById("start");
    config.element.input = document.getElementById("input");
    config.button.dialect = document.getElementById("dialect");
    config.button.language = document.getElementById("language");
    /*  */
    config.button.start.addEventListener("click", config.app.speak, false);
    config.element.input.addEventListener("change", config.app.store.input, false);
    config.button.dialect.addEventListener("change", config.app.store.dialect, false);
    reload.addEventListener("click", function () {document.location.reload()}, false);
    config.button.language.addEventListener("change", config.app.store.language, false);
    /*  */
    support.addEventListener("click", function (e) {
      var url = config.addon.homepage();
      chrome.tabs.create({"url": url, "active": true});
    }, false);
    /*  */
    donation.addEventListener("click", function (e) {
      var url = config.addon.homepage() + "?reason=support";
      chrome.tabs.create({"url": url, "active": true});
    }, false);
    /*  */
    config.storage.load(config.app.start);
    window.removeEventListener("load", config.load, false);
  },
  "app": {
    "start": function () {
      config.app.fill.select();
      tts.engine.load();
    },
    "prefs": {
      set input (val) {config.storage.write("input", val)},
      set dialect (val) {config.storage.write("dialect", val)},
      set language (val) {config.storage.write("language", val)},
      get dialect () {return config.storage.read("dialect") !== undefined ? config.storage.read("dialect") : 11},
      get language () {return config.storage.read("dialect") !== undefined ? config.storage.read("language") : 10},
      get input () {return config.storage.read("input") !== undefined ? config.storage.read("input") : "A text to speech tool with natural sounding voices"}
    },
    "speak": function (e) {
      config.button.start.src = "images/nospeaker.png";
      var text = tts.engine.split.text(config.element.input.textContent);
      /*  */
      if (config.state === "play") config.app.voice.play();
      if (config.state === "pause") config.app.voice.pause();
      if (config.state === "replay") config.app.voice.replay();
      if (config.state === "voice") config.app.voice.start({"text": text, "url": "local"});
    },
    "update": {
      "dialect": function (target) {
        if (target) {
          config.button.dialect.textContent = '';
          config.button.dialect.style.visibility = target[1].length === 1 ? "hidden" : "visible";
          for (var i = 1; i < target.length; i++) {
            config.button.dialect.options.add(new Option(target[i][1], target[i][0]));
          }
        }
      }
    },
    "fill": {
      "select": function (callback) {
        for (var i = 0; i < tts.language.length; i++) {
          config.button.language.options[i] = new Option(tts.language[i][0], i);
        }
        /*  */
        config.element.input.textContent = config.app.prefs.input;
        config.app.update.dialect(tts.language[config.app.prefs.language]);
        config.button.dialect.selectedIndex = config.button.dialect.length > config.app.prefs.dialect ? config.app.prefs.dialect : 0;
        config.button.language.selectedIndex = config.button.language.length > config.app.prefs.language ? config.app.prefs.language : 0;
      }
    },
    "store": {
      "input": function (e) {
        config.app.prefs.input = e.target.textContent;
      },
      "dialect": function () {
        config.app.prefs.dialect = config.button.dialect.selectedIndex;
        tts.engine.methods.reset("local");
      },
      "language": function () {
        config.app.prefs.language = config.button.language.selectedIndex;
        tts.engine.methods.reset("local");
        config.app.update.dialect(tts.language[config.button.language.selectedIndex]);
      }
    },
    "flash": {
      "timeout": '',
      "element": document.querySelector(".start"),
      "stop": function () {
        config.app.flash.element.removeAttribute("color");
        if (config.app.flash.timeout) window.clearTimeout(config.app.flash.timeout);
      },
      "start": function () {
        if (config.app.flash.timeout) window.clearTimeout(config.app.flash.timeout);
        config.app.flash.element.setAttribute("color", "green");
        var blink = function () {
          config.app.flash.timeout = window.setTimeout(function () {
            var color = config.app.flash.element.getAttribute("color") === "green" ? "white" : "green";
            config.app.flash.element.setAttribute("color", color);
            blink();
          }, 500);
        };
        /*  */
        blink();
      }
    }
  }
};

window.addEventListener("resize", function () {
  if (config.resize.timeout) window.clearTimeout(config.resize.timeout);
  config.resize.timeout = window.setTimeout(function () {
    config.storage.write("width", window.innerWidth || window.outerWidth);
    config.storage.write("height", window.innerHeight || window.outerHeight);
  }, 1000);
}, false);

config.port.connect();
window.addEventListener("load", config.load, false);
