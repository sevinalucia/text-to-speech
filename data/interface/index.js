var background = {
  "port": null,
  "message": {},
  "receive": function (id, callback) {
    if (id) {
      background.message[id] = callback;
    }
  },
  "connect": function (port) {
    chrome.runtime.onMessage.addListener(background.listener); 
    /*  */
    if (port) {
      background.port = port;
      background.port.onMessage.addListener(background.listener);
      background.port.onDisconnect.addListener(function () {
        background.port = null;
      });
    }
  },
  "send": function (id, data) {
    if (id) {
      if (background.port) {
        if (background.port.name !== "webapp") {
          chrome.runtime.sendMessage({
            "method": id,
            "data": data,
            "path": "interface-to-background"
          }); 
        }
      }
    }
  },
  "post": function (id, data) {
    if (id) {
      if (background.port) {
        background.port.postMessage({
          "method": id,
          "data": data,
          "port": background.port.name,
          "path": "interface-to-background"
        });
      }
    }
  },
  "listener": function (e) {
    if (e) {
      for (let id in background.message) {
        if (background.message[id]) {
          if ((typeof background.message[id]) === "function") {
            if (e.path === "background-to-interface") {
              if (e.method === id) {
                background.message[id](e.data);
              }
            }
          }
        }
      }
    }
  }
};

var config = {
  "log": false,
  "backup": [],
  "button": {},
  "element": {},
  "audio": null,
  "audiotext": [],
  "state": "voice",
  "isplaying": false,
  "audiotextarray": [],
  "page": {"url": "local"},
  "selected": {"parent": null},
  "css": {"id": "tts-highlight-color-css"},
  "addon": {
    "homepage": function () {
      return chrome.runtime.getManifest().homepage_url;
    }
  },
  "nosupport": function () {
    config.button.size.disabled = true;
    config.button.start.disabled = true;
    config.button.voices.disabled = true;
    config.button.dialect.disabled = true;
    config.button.language.disabled = true;
    window.setTimeout(function () {
      config.button.speak.src = "images/nospeaker.png";
    }, 500);
  },
  "support": function () {
    config.button.start.disabled = false;
    config.button.voices.disabled = false;
    config.button.dialect.disabled = false;
    config.button.language.disabled = false;
    window.setTimeout(function () {
      config.button.speak.src = "images/speakeractive.png";
    }, 500);
  },
  "resize": {
    "timeout": null,
    "method": function () {
      if (config.port.name === "win") {
        if (config.resize.timeout) window.clearTimeout(config.resize.timeout);
        config.resize.timeout = window.setTimeout(async function () {
          const current = await chrome.windows.getCurrent();
          /*  */
          config.storage.write("interface.size", {
            "top": current.top,
            "left": current.left,
            "width": current.width,
            "height": current.height
          });
        }, 1000);
      }
    }
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
          let tmp = {};
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
      const context = document.documentElement.getAttribute("context");
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
            background.connect(chrome.runtime.connect({"name": config.port.name}));
          }
        }
      }
      /*  */
      document.documentElement.setAttribute("context", config.port.name);
    }
  },
  "load": function () {
    config.state = "voice";
    /*  */
    const reload = document.getElementById("reload");
    const support = document.getElementById("support");
    const donation = document.getElementById("donation");
    /*  */
    config.button.size = document.getElementById("size");
    config.button.speak = document.getElementById("speak");
    config.button.start = document.getElementById("start");
    config.element.input = document.getElementById("input");
    config.button.voices = document.getElementById("voices");
    config.button.dialect = document.getElementById("dialect");
    config.button.language = document.getElementById("language");
    /*  */
    config.button.start.addEventListener("click", config.app.speak, false);
    config.button.size.addEventListener("change", config.app.store.size, false);
    config.element.input.addEventListener("change", config.app.store.input, false);
    config.button.voices.addEventListener("change", config.app.store.voices, false);
    config.button.dialect.addEventListener("change", config.app.store.dialect, false);
    config.button.language.addEventListener("change", config.app.store.language, false);
    /*  */
    reload.addEventListener("click", function () {
      document.location.reload();
    });
    /*  */
    support.addEventListener("click", function () {
      const url = config.addon.homepage();
      chrome.tabs.create({"url": url, "active": true});
    }, false);
    /*  */
    donation.addEventListener("click", function () {
      const url = config.addon.homepage() + "?reason=support";
      chrome.tabs.create({"url": url, "active": true});
    }, false);
    /*  */
    config.storage.load(config.app.start);
    window.removeEventListener("load", config.load, false);
  },
  "app": {
    "start": function () {
      config.app.update.size();
      config.app.fill.select();
      tts.engine.load();
    },
    "prefs": {
      set size (val) {config.storage.write("size", val)},
      set input (val) {config.storage.write("input", val)},
      set voices (val) {config.storage.write("voices", val)},
      set dialect (val) {config.storage.write("dialect", val)},
      set language (val) {config.storage.write("language", val)},
      get size () {return config.storage.read("size") !== undefined ? config.storage.read("size") : 14},
      get voices () {return config.storage.read("voices") !== undefined ? config.storage.read("voices") : 0},
      get dialect () {return config.storage.read("dialect") !== undefined ? config.storage.read("dialect") : 11},
      get language () {return config.storage.read("language") !== undefined ? config.storage.read("language") : 10},
      get input () {return config.storage.read("input") !== undefined ? config.storage.read("input") : "A text to speech tool with natural sounding voices"}
    },
    "speak": function (e) {
      config.button.start.src = "images/nospeaker.png";
      const text = tts.engine.split.text(config.element.input.textContent);
      /*  */
      if (config.state === "play") config.app.voice.play();
      if (config.state === "pause") config.app.voice.pause();
      if (config.state === "replay") config.app.voice.replay();
      if (config.state === "voice") config.app.voice.start({"text": text, "url": "local"});
    },
    "fill": {
      "select": async function () {
        await config.app.update.language(tts.language);
        config.button.language.selectedIndex = config.button.language.length > config.app.prefs.language ? config.app.prefs.language : 0;
        /*  */
        await config.app.update.voices(tts.language[config.app.prefs.language]);
        config.button.voices.selectedIndex = config.button.voices.length > config.app.prefs.voices ? config.app.prefs.voices : 0;
        /*  */
        await config.app.update.dialect(tts.language[config.app.prefs.language]);
        config.button.dialect.selectedIndex = config.button.dialect.length > config.app.prefs.dialect ? config.app.prefs.dialect : 0;
        /*  */
        config.element.input.textContent = config.app.prefs.input;
        config.button.size.value = config.app.prefs.size;
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
        config.app.flash.element.setAttribute("color", "green");
        if (config.app.flash.timeout) window.clearTimeout(config.app.flash.timeout);
        /*  */
        const _blink = function () {
          config.app.flash.timeout = window.setTimeout(function () {
            const color = config.app.flash.element.getAttribute("color") === "green" ? "white" : "green";
            config.app.flash.element.setAttribute("color", color);
            _blink();
          }, 500);
        };
        /*  */
        _blink();
      }
    },
    "store": {
      "input": function (e) {
        config.app.prefs.input = e.target.textContent;
      },
      "size": function () {
        config.app.prefs.size = config.button.size.value;
        config.app.update.size();
      },
      "voices": function () {
        config.app.prefs.voices = config.button.voices.selectedIndex;
        tts.engine.methods.reset("local");
        config.app.fill.select();
      },
      "dialect": function () {
        config.app.prefs.voices = 0;
        config.app.prefs.dialect = config.button.dialect.selectedIndex;
        tts.engine.methods.reset("local");
        config.app.fill.select();
      },
      "language": function () {
        config.app.prefs.voices = 0;
        config.app.prefs.dialect = 0;
        config.app.prefs.language = config.button.language.selectedIndex;
        tts.engine.methods.reset("local");
        config.app.fill.select();
      }
    },
    "update": {
      "size": function () {
        const size = config.app.prefs.size;
        config.element.input.style.fontSize = size + "px";
      },
      "language": async function (target) {
        if (target) {
          config.button.language.textContent = '';
          config.button.language.style.visibility = "hidden";
          /*  */
          await new Promise((resolve) => {
            for (let i = 0; i < target.length; i++) {
              const value = i;
              const name = target[i][0] !== undefined ? target[i][0] : "General";
              const option = new Option(name, value);
              config.button.language.add(option);
              config.button.language.style.visibility = "visible";
            }
            /*  */
            if (config.button.language.style.visibility === "hidden") {
              config.button.language.add(new Option("N/A", ''));
              config.button.language.style.visibility = "visible";
            }
            /*  */
            window.setTimeout(resolve, 10);
          });
        }
      },
      "dialect": async function (target) {
        if (target) {
          config.button.dialect.textContent = '';
          config.button.dialect.style.visibility = "hidden";
          /*  */
          await new Promise((resolve) => {
            for (let i = 1; i < target.length; i++) {
              const value = target[i][0] !== undefined ? target[i][0] : '';
              const name = target[i][1] !== undefined ? target[i][1] : "System Default";
              if (value) {
                const option = new Option(name, value);
                config.button.dialect.add(option);
                config.button.dialect.style.visibility = "visible";
              }
            }
            /*  */
            if (config.button.dialect.style.visibility === "hidden") {
              config.button.dialect.add(new Option("N/A", ''));
              config.button.dialect.style.visibility = "visible";
            }
            /*  */
            window.setTimeout(resolve, 10);
          });
        }
      },
      "voices": async function (target) {
        if (target) {
          config.button.voices.textContent = '';
          config.button.voices.style.visibility = "hidden";
          /*  */
          const voices = await tts.engine.get.voices();
          await new Promise((resolve) => {
            if (voices) {
              if (voices.length) {
                for (let i = 0; i < voices.length; i++) {
                  const code = target[config.app.prefs.dialect + 1] ? target[config.app.prefs.dialect + 1][0] : null;
                  if (code) {
                    if (code === voices[i].lang) {
                      const value = i;
                      const name = voices[i].name !== undefined ? voices[i].name : "System Default";
                      const option = new Option(name, value);
                      config.button.voices.add(option);
                      config.button.voices.style.visibility = "visible";
                    }
                  }
                }
              }
            }
            /*  */
            if (config.button.voices.style.visibility === "hidden") {
              config.button.voices.style.visibility = "visible";
              config.button.voices.add(new Option("System Default", ''));
            }
            /*  */
            window.setTimeout(resolve, 10);
          });
        }
      }
    }
  }
};

config.port.connect();

window.addEventListener("load", config.load, false);
window.addEventListener("resize", config.resize.method, false);
