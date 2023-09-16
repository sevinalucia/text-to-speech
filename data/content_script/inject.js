var background = (function () {
  let tmp = {};
  /*  */
  chrome.runtime.onMessage.addListener(function (request) {
    for (let id in tmp) {
      if (tmp[id] && (typeof tmp[id] === "function")) {
        if (request.path === "background-to-page") {
          if (request.method === id) {
            tmp[id](request.data);
          }
        }
      }
    }
  });
  /*  */
  return {
    "receive": function (id, callback) {
      tmp[id] = callback;
    },
    "send": function (id, data) {
      chrome.runtime.sendMessage({
        "method": id, 
        "data": data,
        "path": "page-to-background"
      }, function () {
        return chrome.runtime.lastError;
      });
    }
  }
})();

var config = {
  "backup": [],
  "log": false,
  "audio": null,
  "keycode": '',
  "voices": null,
  "audiotext": [],
  "loaderctx": null,
  "isplaying": false,
  "audiotextarray": [],
  "selected": {
    "parent": null
  },
  "css": {
    "id": "tts-highlight-color-css"
  },
  "timeout": {
    "hide": null, 
    "show": null
  },
  "storage": {
    "isBubbleIcon": false,
    "showHighlight": true,
    "enableInputArea": true,
    "isTextSelection": false,
    "placeholderIconShow": 0,
    "placeholderIconTime": 3
  },
  "request": {
    "voice": function () {
      const url = document.location.href;
      const text = tts.engine.split.text(config.request.voice.text);
      const state = config.icon.placeholder.element.getAttribute("state");
      /*  */
      config.page.url = url;
      config.icon.placeholder.element.setAttribute("state", "loading");
      config.icon.placeholder.element.style.backgroundImage = 'url("' + config.icon.loading + '")';
      /*  */
      if (state === "play") config.app.voice.play();
      if (state === "pause") config.app.voice.pause();
      if (state === "replay") config.app.voice.replay();
      if (state === "voice") config.app.voice.start({"text": text, "url": url});
    }
  },
  "icon": {
    "play": chrome.runtime.getURL("data/content_script/icons/play.png"),
    "replay": chrome.runtime.getURL("data/content_script/icons/play.png"),
    "pause": chrome.runtime.getURL("data/content_script/icons/pause.png"),
    "voice": chrome.runtime.getURL("data/content_script/icons/voice.png"),
    "loading": chrome.runtime.getURL("data/content_script/icons/loading.gif"),
    "update": function (state) {
      if (state) {
        config.icon.placeholder.element.setAttribute("state", state);
        if (config.icon[state]) {
          config.icon.placeholder.element.style.backgroundImage = 'url("' + config.icon[state] + '")';
        }
      }
    },
    "placeholder": {
      "element": null,
      "hover": function (e) {
        while (e.parentNode && e.getAttribute) {
          if (e === config.icon.placeholder.element) return true;
          e = e.parentNode;
        }
        /*  */
        return false;
      },
      "show": function () {
        const rect = config.request.voice.rect;
        /*  */
        config.icon.placeholder.element.style.top = (rect.top + window.scrollY - 40) + "px";
        config.icon.placeholder.element.style.left = (rect.left + window.scrollX + rect.width / 2 - 16) + "px";
        /*  */
        if (config.timeout.show) window.clearTimeout(config.timeout.show);
        if (config.timeout.hide) window.clearTimeout(config.timeout.hide);
        /*  */
        const flag = config.storage.placeholderIconTime < 60;
        /*  */
        config.timeout.show = window.setTimeout(function () {
          config.icon.placeholder.element.setAttribute("visible", '');
        }, config.storage.placeholderIconShow * 1000);
        /*  */
        if (flag) {
          config.timeout.hide = window.setTimeout(function () {
            config.icon.placeholder.element.removeAttribute("visible");
          }, config.storage.placeholderIconTime * 1000);
        }
      }
    }
  },
  "selected": {
    "text": function (t) {
      const selection = function (e) {
        const value = e.value;
        const end = e.selectionEnd;
        const start = e.selectionStart;
        if (value && start && end) {
          return value.substring(start, end);
        }
      };
      /*  */
      let selected = window.getSelection().toString();
      if (!selected) selected = selection(t);
      /*  */
      return selected;
    },
    "rect": function (e) {
      const range = e.getRangeAt(0).cloneRange();
      const dummy = document.createElement("span");
      if (range.startOffset !== range.endOffset) {
        return range.getBoundingClientRect();
      } else {
        let arr = range.startContainer.childNodes;
        for (let i = 0; i < arr.length; i++) {
          const target = arr[i].nodeName.toLowerCase();
          if (target === "textarea" || target === "input") {
            let rect = getboundingbox(arr[i], arr[i].selectionStart, arr[i].selectionEnd);
            if (rect.top && rect.left && rect.height && rect.width) {
              return rect;
            }
          }
        }
        /*  */
        range.collapse(false);
        range.insertNode(dummy);
        const rect = dummy.getBoundingClientRect();
        dummy.parentNode.removeChild(dummy);
        /*  */
        return rect;
      }
    }
  },
  "app": {
    "bubble": {
      "hide": function (e) {
        if (config.isplaying) return;
        if (e && e.button === 2) return;
        if (e && config.icon.placeholder.hover(e.target)) return;
        /*  */
        config.app.loader.remove();
        tts.engine.highlight.remove();
        /*  */
        const selection = window.getSelection();
        selection.collapse(config.selected.parent, 0);
        /*  */
        if ("voice" in config.app) config.app.voice.reset(document.location.href, 2);
        if (config.selected.parent) config.selected.parent.style.backgroundColor = "transparent";
        /*  */
        if (config.icon.placeholder.element) {
          config.icon.placeholder.element.removeAttribute("visible");
          config.icon.placeholder.element.setAttribute("state", "voice");
          config.icon.placeholder.element.style.backgroundImage = 'url("' + config.icon.voice + '")';
        }
      }
    },
    "loader": {
      "canvas": null,
      "remove": function () {
        if (config.app.loader.canvas) {
          config.app.loader.canvas.style.display = "none";
        }
      },
      "draw": function (p) {
        if (config.app.loader.canvas) {
          config.app.loader.canvas.style.display = "block";
        }
        /*  */
        if (p) {
          const _render = function (g, p) {
            const PI2 = Math.PI * 2;
            const quart = Math.PI / 2;
            const extent = parseInt((g.end - g.start) * p);
            const current = (g.end - g.start) / 100 * PI2 * p - quart;
            /*  */
            config.loaderctx.beginPath();
            config.loaderctx.arc(g.x, g.y, g.radius, -quart, current);
            config.loaderctx.strokeStyle = g.color;
            config.loaderctx.stroke();
            config.loaderctx.fillStyle = g.color;
          };
          /*  */
          config.loaderctx.clearRect(0, 0, config.app.loader.canvas.width, config.app.loader.canvas.height);
          /*  */
          _render({
            'x': 18, 
            'y': 18,
            "end": 100,
            "start": 0,
            "radius": 15,
            "color": "rgba(0,0,0,0.4)"
          }, p);
        } else {
          config.app.loader.canvas.classList.add("loading-circle-blink");
        }
      }
    }
  },
  "page": {
    "url": '',
    "action": {
      "beforeunload": function (e) {
        if (e) {
          config.isplaying = false;
          config.app.bubble.hide(e);
        }
      },
      "keydown": function (e) {
        if (e) {
          config.keycode = e.keyCode;
          if (config.keycode === 27) {
            config.app.bubble.hide(e);
          }
        }
      },
      "mouseup": function (e) {
        if (e) {
          if (e.target) {
            if (config.icon.placeholder.hover(e.target)) return;
            /*  */
            const flag1 = e.target.getAttribute("contenteditable") === "true";
            const flag2 = e.target.localName === "input" || e.target.localName === "textarea";
            const flag3 = e.target.className ? e.target.className.indexOf("editable") !== -1 : false;
            /*  */
            const inputarea = flag1 || flag2 || flag3;
            if (inputarea && !config.storage.enableInputArea) return;
            const keyboard = e.metaKey || e.altKey || config.keycode === 45 || config.keycode === 84;
            const mouseup = (e.type === "mouseup") && config.storage.isTextSelection && keyboard;
            const selectedtext = config.selected.text(e.target);
            if (selectedtext && selectedtext.length > 2) {
              config.request.voice.text = selectedtext;
              config.selected.parent = e.target;
              config.request.voice.rect = config.selected.rect(window.getSelection());
              /*  */
              if (config.storage.isBubbleIcon) {
                config.icon.placeholder.show();
              } else if (mouseup) {
                config.request.voice();
              }
            }
          }
        }
      },
      "contentloaded": function () {
        const placeholder = document.getElementById("tts-placeholder-icon");
        if (placeholder) placeholder.parentNode.removeChild(placeholder);
        /*  */
        config.icon.placeholder.element = document.createElement("div");
        /*  */
        config.icon.placeholder.element.setAttribute("state", "voice");
        config.icon.placeholder.element.setAttribute("class", "placeholder-icon");
        config.icon.placeholder.element.setAttribute("id", "tts-placeholder-icon");
        config.icon.placeholder.element.setAttribute("title", "Click to show TTS button");
        config.icon.placeholder.element.addEventListener("click", config.request.voice, false);
        config.icon.placeholder.element.style.backgroundImage = 'url("' + config.icon.voice + '")';
        document.body.appendChild(config.icon.placeholder.element);
        /*  */
        config.app.loader.canvas = document.createElement("canvas");
        config.app.loader.canvas.setAttribute("width", 36);
        config.app.loader.canvas.setAttribute("height", 36);
        config.app.loader.canvas.setAttribute("class", "loading-circle");
        config.app.loader.canvas.setAttribute("id", "text-to-speech-loader");
        config.icon.placeholder.element.appendChild(config.app.loader.canvas);
        /*  */
        config.app.loader.canvas.style.display = "none";
        config.loaderctx = config.app.loader.canvas.getContext("2d");
        if (config.loaderctx) {
          config.loaderctx.lineWidth = 3;
        }
        /*  */
        tts.engine.load();
        background.send("load", null);
        audio.drawLoader = config.app.loader.draw;
        /*  */
        document.removeEventListener("DOMContentLoaded", config.page.action.contentloaded, false);
      }
    }
  }
};

document.addEventListener("mousedown", config.app.bubble.hide, false);
document.addEventListener("mouseup", config.page.action.mouseup, false);
document.addEventListener("keydown", config.page.action.keydown, false);
document.addEventListener("keyup", function () {config.keycode = null}, false);
document.addEventListener("DOMContentLoaded", config.page.action.contentloaded, false);

background.receive("storage", function (e) {config.storage = e});
background.receive("audio-text", function (e) {config.audiotextarray = e});
window.addEventListener("beforeunload", config.page.action.beforeunload, false);
