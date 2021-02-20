var background = (function () {
  var tmp = {};
  chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    for (var id in tmp) {
      if (tmp[id] && (typeof tmp[id] === "function")) {
        if (request.path === "background-to-page") {
          if (request.method === id) tmp[id](request.data);
        }
      }
    }
  });
  /*  */
  return {
    "receive": function (id, callback) {tmp[id] = callback},
    "send": function (id, data) {chrome.runtime.sendMessage({"path": "page-to-background", "method": id, "data": data})}
  }
})();

var request = {
  "voice": function (e) {
    var url = document.location.href;
    var text = tts.engine.split.text(request.voice.text);
    var state = config.icon.placeholder.element.getAttribute("state");
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
};

var page = {
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
          var flag1 = e.target.getAttribute("contenteditable") === "true";
          var flag2 = e.target.localName === "input" || e.target.localName === "textarea";
          var flag3 = e.target.className ? e.target.className.indexOf("editable") !== -1 : false;
          /*  */
          var inputarea = flag1 || flag2 || flag3;
          if (inputarea && !config.storage.enableInputArea) return;
          var keyboard = e.metaKey || e.altKey || config.keycode === 45 || config.keycode === 84;
          var mouseup = (e.type === "mouseup") && config.storage.isTextSelection && keyboard;
          var selectedtext = config.selected.text(e.target);
          if (selectedtext && selectedtext.length > 2) {
            request.voice.text = selectedtext;
            config.selected.parent = e.target;
            request.voice.rect = config.selected.rect(window.getSelection());
            if (config.storage.isBubbleIcon) config.icon.placeholder.show();
            else if (mouseup) request.voice();
          }
        }
      }
    },
    "contentloaded": function () {
      var placeholder = document.getElementById("tts-placeholder-icon");
      if (placeholder) placeholder.parentNode.removeChild(placeholder);
      /*  */
      config.icon.placeholder.element = document.createElement("div");
      config.icon.placeholder.element.setAttribute("state", "voice");
      config.icon.placeholder.element.setAttribute("class", "placeholder-icon");
      config.icon.placeholder.element.setAttribute("id", "tts-placeholder-icon");
      config.icon.placeholder.element.addEventListener("click", request.voice, false);
      config.icon.placeholder.element.setAttribute("title", "Click to show TTS button");
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
      if (config.loaderctx) config.loaderctx.lineWidth = 3;
      /*  */
      tts.engine.load();
      background.send("storage", null);
      audio.drawLoader = config.app.loader.draw;
      document.removeEventListener("DOMContentLoaded", page.action.contentloaded, false);
    }
  }
};

config.storage.isBubbleIcon = false;
config.storage.showHighlight = true;
config.storage.enableInputArea = true;
config.storage.placeholdericonShow = 0;
config.storage.placeholdericonTime = 3;
config.storage.isTextSelection = false;

document.addEventListener("mouseup", page.action.mouseup, false);
document.addEventListener("keydown", page.action.keydown, false);
document.addEventListener("mousedown", config.app.bubble.hide, false);
window.addEventListener("beforeunload", page.action.beforeunload, false);
document.addEventListener("keyup", function () {config.keycode = null}, false);
document.addEventListener("DOMContentLoaded", page.action.contentloaded, false);

background.receive("options-storage", function (e) {config.storage = e});
background.receive("audio-text", function (e) {config.audiotextarray = e});
