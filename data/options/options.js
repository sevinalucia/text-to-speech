var background = (function () {
  var tmp = {};
  chrome.runtime.onMessage.addListener(function (request) {
    for (var id in tmp) {
      if (tmp[id] && (typeof tmp[id] === "function")) {
        if (request.path === "background-to-options") {
          if (request.method === id) tmp[id](request.data);
        }
      }
    }
  });
  /*  */
  return {
    "receive": function (id, callback) {tmp[id] = callback},
    "send": function (id, data) {chrome.runtime.sendMessage({"path": "options-to-background", "method": id, "data": data})}
  }
})();

var config = {
  "render": function (e) {
    if ("pref" in e) {
      if (window[e.pref]) {
        window[e.pref].value = e.value;
        if (e.pref === "settings.isBubbleIcon") {
          document.querySelector("input[data-pref='settings.placeholderIconShow']").disabled = !e.value;
          document.querySelector("input[data-pref='settings.placeholderIconTime']").disabled = !e.value;
        }
      }
    }
    /*  */
    const theme = e.theme !== undefined ? e.theme : "light";
    document.documentElement.setAttribute("theme", theme);
  },
  "connect": function (elem, pref) {
    let att = "value";
    if (elem) {
      if (elem.type === "checkbox") att = "checked";
      if (elem.localName === "select") att = "value";
      if (elem.localName === "span") att = "textContent";
      /*  */
      pref = elem.getAttribute("data-pref");
      background.send("get", pref);
      elem.addEventListener("change", function () {
        background.send("changed", {
          "pref": pref,
          "value": this[att]
        })
      });
    }
    /*  */
    return {
      get value () {return elem[att]},
      set value (val) {
        if (val === "true") val = true;
        if (elem.type === "file") return;
        else if (val === "false") val = false;
        /*  */
        elem[att] = val;
      }
    }
  },
  "load": function () {
    const prefs = [...document.querySelectorAll("*[data-pref]")];
    const selection = document.querySelector("input[data-pref='settings.selection']");
    const isBubbleIcon = document.querySelector("input[data-pref='settings.isBubbleIcon']");
    const placeholderIconShow = document.querySelector("input[data-pref='settings.placeholderIconShow']");
    const placeholderIconTime = document.querySelector("input[data-pref='settings.placeholderIconTime']");
    /*  */
    prefs.forEach(function (elem) {
      const pref = elem.getAttribute("data-pref");
      window[pref] = config.connect(elem, pref);
    });
    /*  */
    const _set = function (elm, pref, value) {
      if (!elm) return;
      elm.checked = value;
      background.send("changed", {
        "pref": pref, 
        "value": value
      });
    };
    /*  */
    selection.addEventListener("change", function (e) {
      placeholderIconShow.disabled = true;
      placeholderIconTime.disabled = true;
      _set(isBubbleIcon, "settings.isBubbleIcon", false);
      _set(selection, "settings.selection", e.target.checked);
    }, false);
    /*  */
    isBubbleIcon.addEventListener("change", function (e) {
      _set(selection, "settings.selection", false);
      placeholderIconShow.disabled = !e.target.checked;
      placeholderIconTime.disabled = !e.target.checked;
      _set(isBubbleIcon, "settings.isBubbleIcon", e.target.checked);
    }, false);
    /*  */
    window.removeEventListener("load", config.load, false);
  }
};

background.receive("set", config.render);

window.addEventListener("load", config.load, false);
