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
  "isgecko": navigator.userAgent.toLowerCase().includes("firefox"),
  "addon": {
    "homepage": function () {
      return chrome.runtime.getManifest().homepage_url;
    }
  },
  "show": {
    "info": function (i, q) {
      const comment = q ? '\n' + ">> " + q : '';
      config.element.info.textContent = ">> " + (i ? config.message[i] + comment : comment);
    }
  },
  "message": {
    "end": "Speech synthesis is ended.",
    "error": "An unexpected error happened!",
    "no_permission": "Host permission denied!",
    "start": "Text to Speech (TTS) app is ready.",
    "no_gpu": "WebGPU API is not supported in your browser!",
    "loading": "Text to Speech (TTS) is loading, please wait...",
    "no_support": "Speech synthesis API is NOT supported in your browser!"
  },
  "nosupport": function () {
    config.button.size.disabled = true;
    config.button.start.disabled = true;
    config.button.voices.disabled = true;
    config.button.engine.disabled = true;
    config.button.backend.disabled = true;
    config.button.dialect.disabled = true;
    config.button.language.disabled = true;
    window.setTimeout(function () {
      config.button.speak.src = "images/nospeaker.png";
    }, 500);
  },
  "support": function () {
    config.button.size.disabled = false;
    config.button.start.disabled = false;
    config.button.voices.disabled = false;
    config.button.engine.disabled = false;
    config.button.backend.disabled = false;
    config.button.dialect.disabled = false;
    config.button.language.disabled = false;
    window.setTimeout(function () {
      config.button.speak.src = "images/speaker.png";
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
  "storage": {
    "local": {},
    "read": function (id) {
      return config.storage.local[id];
    },
    "reset": function (callback) {
      chrome.storage.local.clear(callback);
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
  "load": function () {
    config.state = "voice";
    /*  */
    const theme = document.getElementById("theme");
    const reset = document.getElementById("reset");
    const reload = document.getElementById("reload");
    const support = document.getElementById("support");
    const donation = document.getElementById("donation");
    const actions = ["drop", "dragenter", "dragover", "dragleave"];
    /*  */
    config.element.info = document.getElementById("info");
    config.element.input = document.getElementById("input");
    config.element.buttons = document.querySelector(".buttons");
    /*  */
    config.button.size = document.getElementById("size");
    config.button.speak = document.getElementById("speak");
    config.button.audio = document.getElementById("audio");
    config.button.start = document.getElementById("start");
    config.button.engine = document.getElementById("engine");
    config.button.voices = document.getElementById("voices");
    config.button.backend = document.getElementById("backend");
    config.button.dialect = document.getElementById("dialect");
    config.button.language = document.getElementById("language");
    /*  */
    config.button.start.addEventListener("click", config.app.speak, false);
    config.button.size.addEventListener("change", config.app.store.size, false);
    config.element.input.addEventListener("drop", config.app.store.input, false);
    config.element.input.addEventListener("input", config.app.store.input, false);
    config.button.voices.addEventListener("change", config.app.store.voices, false);
    config.button.engine.addEventListener("change", config.app.store.engine, false);
    config.button.backend.addEventListener("change", config.app.store.backend, false);
    config.button.dialect.addEventListener("change", config.app.store.dialect, false);
    config.button.language.addEventListener("change", config.app.store.language, false);
    /*  */
    actions.forEach(function (action) {
      config.element.input.addEventListener(action, e => e.preventDefault(), false);
      config.element.input.addEventListener(action, e => e.stopPropagation(), false);
    });
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
    theme.addEventListener("click", function () {
      let attribute = document.documentElement.getAttribute("theme");
      attribute = attribute === "dark" ? "light" : "dark";
      /*  */
      document.documentElement.setAttribute("theme", attribute);
      config.storage.write("theme", attribute);
    }, false);
    /*  */
    reset.addEventListener("click", function () {
      const reset = window.confirm("Are you sure you want to reset the app to factory settings?");
      if (reset) {
        config.storage.reset(function () {
          document.location.reload();
        });
      }
    });
    /*  */
    config.button.audio.addEventListener("click", function (e) {
      if (e) {
        if (e.target) {
          const href = e.target.getAttribute("href");
          /*  */
          if (href === null) {
            window.alert("Please press the - Speak - button first to generate an audio, then click this button to download the final audio file (.wav)");
          }
        }
      }
    }, false);
    /*  */
    config.storage.load(config.app.start);
    window.removeEventListener("load", config.load, false);
  },
  "app": {
    "speak": function () {
      config.button.speak.src = "images/speakeractive.png";
      const text = tts.engine.split.text(config.element.input.textContent, null);
      /*  */
      if (config.state === "play") config.app.voice.play();
      if (config.state === "pause") config.app.voice.pause();
      if (config.state === "replay") config.app.voice.replay();
      if (config.state === "voice") config.app.voice.start({"text": text, "url": "local"});
    },
    "start": function () {
      const theme = config.app.prefs.theme;
      const engine = config.app.prefs.engine;
      const backend = config.app.prefs.backend;
      /*  */
      config.button.engine.value = engine;
      config.button.backend.value = backend;
      document.documentElement.setAttribute("theme", theme);
      document.documentElement.setAttribute("engine", config.app.prefs.engine);
      /*  */
      config.app.update.size();
      config.app.fill.select();
      /*  */
      if (engine === "webapi") tts.engine.load();
      if (engine === "kokoro") kokoro.engine.load();
    },
    "fill": {
      "select": async function () {
        const engine = config.app.prefs.engine;
        const language = engine === "webapi" ? tts.language : kokoro.language;
        /*  */
        await config.app.update.language(language);
        config.button.language.selectedIndex = config.button.language.length > config.app.prefs[engine].language ? config.app.prefs[engine].language : 0;
        /*  */
        await config.app.update.dialect(language[config.app.prefs[engine].language]);
        config.button.dialect.selectedIndex = config.button.dialect.length > config.app.prefs[engine].dialect ? config.app.prefs[engine].dialect : 0;
        /*  */
        await config.app.update.voices(language[config.app.prefs[engine].language]);
        config.button.voices.selectedIndex = config.button.voices.length > config.app.prefs[engine].voices ? config.app.prefs[engine].voices : 0;
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
    "prefs": {
      set size (val) {config.storage.write("size", val)},
      set theme (val) {config.storage.write("theme", val)},
      set input (val) {config.storage.write("input", val)},
      set engine (val) {config.storage.write("engine", val)},
      set backend (val) {config.storage.write("backend", val)},
      //
      get size () {return config.storage.read("size") !== undefined ? config.storage.read("size") : 14},
      get theme () {return config.storage.read("theme") !== undefined ? config.storage.read("theme") : "light"},
      get engine () {return config.storage.read("engine") !== undefined ? config.storage.read("engine") : "webapi"},
      get backend () {return config.storage.read("backend") !== undefined ? config.storage.read("backend") : config.isgecko ? "wasm" : "webgpu"},
      get input () {return config.storage.read("input") !== undefined ? config.storage.read("input") : "A text to speech tool with natural sounding voices"},
      //
      "webapi": {
        set voices (val) {config.storage.write("voices", val)},
        set dialect (val) {config.storage.write("dialect", val)},
        set language (val) {config.storage.write("language", val)},
        get voices () {return config.storage.read("voices") !== undefined ? config.storage.read("voices") : 0},
        get dialect () {return config.storage.read("dialect") !== undefined ? config.storage.read("dialect") : 11},
        get language () {return config.storage.read("language") !== undefined ? config.storage.read("language") : 10}
      },
      "kokoro": {
        set voices (val) {config.storage.write("voices-kokoro", val)},
        set permission (val) {config.storage.write("permission", val)},
        set dialect (val) {config.storage.write("dialect-kokoro", val)},
        set language (val) {config.storage.write("language-kokoro", val)},
        get voices () {return config.storage.read("voices-kokoro") !== undefined ? config.storage.read("voices-kokoro") : 0},
        get permission () {return config.storage.read("permission") !== undefined ? config.storage.read("permission") : false},
        get dialect () {return config.storage.read("dialect-kokoro") !== undefined ? config.storage.read("dialect-kokoro") : 0},
        get language () {return config.storage.read("language-kokoro") !== undefined ? config.storage.read("language-kokoro") : 0}
      }
    },
    "store": {
      "size": function () {
        config.app.prefs.size = config.button.size.value;
        config.app.update.size();
      },
      "engine": function () {
        config.app.prefs.engine = config.button.engine.value;
        /*  */
        window.setTimeout(function () {
          document.location.reload();
        }, 300);
      },
      "backend": function () {
        config.app.prefs.backend = config.button.backend.value;
        /*  */
        window.setTimeout(function () {
          document.location.reload();
        }, 300);
      },
      "voices": function () {
        const engine = config.app.prefs.engine;
        /*  */
        config.app.prefs[engine].voices = config.button.voices.selectedIndex;
        /*  */
        if (engine === "webapi") {
          tts.engine.methods.reset("local");
          config.app.fill.select();
        } else {
          window.setTimeout(function () {
            document.location.reload();
          }, 300);
        }
      },
      "dialect": function () {
        const engine = config.app.prefs.engine;
        /*  */
        config.app.prefs[engine].voices = 0;
        config.app.prefs[engine].dialect = config.button.dialect.selectedIndex;
        /*  */
        if (engine === "webapi") {
          tts.engine.methods.reset("local");
          config.app.fill.select();
        } else {
          window.setTimeout(function () {
            document.location.reload();
          }, 300);
        }
      },
      "language": function () {
        const engine = config.app.prefs.engine;
        /*  */
        config.app.prefs[engine].voices = 0;
        config.app.prefs[engine].dialect = 0;
        config.app.prefs[engine].language = config.button.language.selectedIndex;
        /*  */
        if (engine === "webapi") {
          tts.engine.methods.reset("local");
          config.app.fill.select();
        } else {
          window.setTimeout(function () {
            document.location.reload();
          }, 300);
        }
      },
      "input": async function (e) {
        const isbusy = document.querySelector(".start[color]");
        if (isbusy) return;
        /*  */
        if (e) {
          if (e.type === "drop") {
            const data = e.dataTransfer;
            if (data.types.includes("text/plain")) {
              const text = data.getData("text/plain");
              config.app.prefs.input = text;
              config.element.input.textContent = text;
            }
            /*  */
            if (data.files && data.files.length > 0) {
              for (const file of data.files) {
                if (file.type.startsWith("text/")) {
                  const text = await file.text();
                  config.app.prefs.input = text;
                  config.element.input.textContent = text;
                }
              }
            }
          } else {
            config.app.prefs.input = e.target.innerText;
          }
        }
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
        const engine = config.app.prefs.engine;
        /*  */
        if (target) {
          config.button.voices.textContent = '';
          config.button.voices.style.visibility = "hidden";
          /*  */
          if (engine === "webapi") {
            const voices = await tts.engine.get.voices();
            await new Promise((resolve) => {
              if (voices) {
                if (voices.length) {
                  for (let i = 0; i < voices.length; i++) {
                    const code = target[config.app.prefs[engine].dialect + 1] ? target[config.app.prefs[engine].dialect + 1][0] : null;
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
          } else {
            await new Promise((resolve) => {
              const dialect = config.app.prefs.kokoro.dialect;
              const voices = target[dialect + 1];
              /*  */
              for (let j = 2; j < voices.length; j++) {
                const current = voices[j];
                const value = current[1];
                const name = current[0] !== undefined ? current[0] : "System Default";
                if (name) {
                  const option = new Option(name, value);
                  config.button.voices.add(option);
                  config.button.voices.style.visibility = "visible";
                }
              }
              /*  */
              window.setTimeout(resolve, 10);
            });
          }
        }
      }
    }
  }
};

config.port.connect();

window.addEventListener("load", config.load, false);
window.addEventListener("resize", config.resize.method, false);
