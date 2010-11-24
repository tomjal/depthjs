/*
DepthJS
Copyright (C) 2010 Aaron Zinman, Doug Fritz, Roy Shilkrot

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

var DepthJS = {
  verbose: true,
  eventHandlers: {},
  canvasLink: {},
  eventLink: {},
  selectorBox: {},
  selectorBoxPopup: {},
  panner: {},
  depthose: {},
  MAX_HANDPLANE_WIDTH: 100,
  MAX_HANDPLANE_HEIGHT: 100
};

// EVENT HANDLERS ----------------------------------------------------------------------------------

/**
 * DepthJS here maps gestures to interactions with this web page.
 *
 * Users interact with the system in two different "modes".
 *
 * 1) Lazy gestures
 * 2) Virtual pointer
 *
 * LAZY GESTURES:
 * By default, the user can lazily make swiping motions with their whole hand:
 * up, down, left and right.
 *
 * The user does not leave her hand still in the air, but instead rests it hand out of frame.
 *
 * The swipes provide basic level navigation--moving forward and backward in history and
 * moving the web page up and down.
 *
 * VIRTUAL POINTER:
 * Once the hand is registered, the user manipulates a cursor along a parallel 2D plane to the monitor.
 *
 * The cursor can be moved, "pushed", and "pulled". Moving the cursor moves a visible selection box
 * around the web page. Pushing and pulling activate (click) any links below the selection box.
 **/


DepthJS.state = null;

DepthJS.eventHandlers.onSwipeLeft = function() {
  if (DepthJS.state == "selectorBoxPopup") {
    DepthJS.selectorBoxPopup.openHighlightedLink();
  } else{
    history.go(-1);
  }
};

DepthJS.eventHandlers.onSwipeRight = function() {
  // We interpret as "forward".
  history.go(1);
};

DepthJS.eventHandlers.onSwipeDown = function() {
  // We interpret as "scroll down 75% of window".
  var scrollAmount = Math.floor($(window).height() * 0.75);
  $("html, body").animate({
    scrollTop: ($(document).scrollTop() + scrollAmount)
  });
};

DepthJS.eventHandlers.onHandPointer = function(){
  console.log("DepthJS. Hand Pointer");
  DepthJS.eventHandlers.onUnregister();
  DepthJS.state = "selectorBox";
}

DepthJS.eventHandlers.onHandOpen = function(){
  console.log("DepthJS. Hand Open");
  DepthJS.eventHandlers.onUnregister();
  DepthJS.state = "panner";
  DepthJS.panner.show();
}

DepthJS.eventHandlers.onSwipeUp = function() {
  // We interpret as "scroll up 75% of window".
  var scrollAmount = Math.floor($(window).height() * 0.75);
  $("html, body").animate({
    scrollTop: ($(document).scrollTop() - scrollAmount)
  });
};

// POINTER -----------------------------------------------------------------------------------------
DepthJS.eventHandlers.onRegister = function() {
  console.log("DepthJS: User registered their hand");
  $(window).trigger("touchstart");
  DepthJS.state = "selectorBox";
  DepthJS.selectorBox.show();
};

DepthJS.eventHandlers.onUnregister = function() {
  console.log("DepthJS. User removed their hand");
  DepthJS.state = null;
  DepthJS.panner.hide();
  DepthJS.selectorBox.hide();
  DepthJS.selectorBoxPopup.hide();
  DepthJS.depthose.hide();
};

DepthJS.eventHandlers.onPush = function() {
  if (DepthJS.state == "selectorBox") {
    DepthJS.selectorBox.activate();
  } else if (DepthJS.state == "depthose") {
    DepthJS.depthose.select();
  }

  // They are now "unregistered"
  // setTimeout(DepthJS.eventHandlers.onUnregister, 200);
};

// Right now users can either push or pull
DepthJS.eventHandlers.onPull = function() {
  DepthJS.state = "depthose";
  DepthJS.depthose.start();
}

DepthJS.eventHandlers.onMove = function(data) {
  if (data.x == null || data.y == null) {
    console.log(["Could not understand data", data]);
    return;
  }

  if (DepthJS.state == "panner"){
    DepthJS.panner.move(data.x, data.y);
  } else if (DepthJS.state == "depthose") {
    DepthJS.depthose.move(data.x, data.y);
  } else if (DepthJS.state == "selectorBox") {
    DepthJS.selectorBox.move(data.x * $(window).width() / 100,
                             data.y * $(window).height() / 100);
   } else if (DepthJS.state == "selectorBoxPopup") {
     DepthJS.selectorBoxPopup.move(data.x, data.y);
  } else {
    console.log("Ignoring move in state " + DepthJS.state);
  }
}

// PANNER ------------------------------------------------------------------------------------------

DepthJS.panner.initTransform = null;
DepthJS.panner.initTransition = null;

DepthJS.panner.show = function() {
  if (DepthJS.panner.initTransform == null) {
    DepthJS.panner.initTransform = $("body").css("-webkit-transform");
  }
  if (DepthJS.panner.initTransition == null) {
    DepthJS.panner.initTransition = $("body").css("-webkit-transition-duration");
  }
  var centerPoint = $(window).height()/2 + $(window).scrollTop();
  $("body").css({"-webkit-transform":"scale(1.55) translate(0px,0px)",
                 "-webkit-transition-duration":"1s",
                 "-webkit-transform-origin":"50% " + centerPoint + "px"});
}

DepthJS.panner.hide = function() {
  if ($("body").css("-webkit-transform") == "none") return;
  $("body").css({"-webkit-transform":"scale(1)","-webkit-transition-duration":"1s"});
  // Reset it to whatever the page had before
  setTimeout(function() {
    $("body").css({"-webkit-transform": DepthJS.panner.initTransform,
                   "-webkit-transition-duration": DepthJS.panner.initTransition});
  }, 1000);
}

DepthJS.panner.move = function(x, y) {
  var x = x * $(window).width() / 100;
  var y = y * $(window).height() / 100;
  $("body").css({"-webkit-transform":"scale(1.55) translate(" + x + "px, " + y + "px)",
                 "-webkit-transition-duration":".25s"})
}

// SELECTOR BOX ------------------------------------------------------------------------------------

DepthJS.selectorBox.init = function() {
  var $box = $("<div id='depthjs_selectorBox'></div>");
  $box.appendTo("body").hide();
  DepthJS.selectorBox.$box = $box;
};

DepthJS.selectorBox.show = function() {
  DepthJS.selectorBox.$box.show();
};

DepthJS.selectorBox.hide = function() {
  DepthJS.selectorBox.$box.hide();
};

DepthJS.selectorBox.move = function(x, y) {
  console.log("move selector box");
   // Constrain to window
  if (x < 0) x = 0;
  if (y < 0) y = 0;
  var $box = DepthJS.selectorBox.$box;
  x = Math.min(x, $(window).width() - $box.width());
  y = Math.min(y, $(window).height() - $box.height());

  if (x != $box.css("left") || y != $box.css("top")) {
    $box.animate({
      left: x,
      top: y
    });
  }
};

DepthJS.selectorBox.activate = function() {
  console.log("DepthJS: Activating underneath selectorBox");
  // Lame code for now...

  var $intersectingLinks = $("a").filter(function() {
    var $a = $(this);
    var ax = $a.offset().left + $(window).scrollLeft();
    var aw = $a.width();
    var ay = $a.offset().top + $(window).scrollTop();
    var ah = $a.height();

    var $box = DepthJS.selectorBox.$box;
    var bx = $box.position().left;
    var by = $box.position().top;
    var bw = $box.width();
    var bh = $box.height();

    if (by > ay + ah || // box-top is lower than link-bottom
        by + bh < ay || // box-bottom is higher than link-top
        bx > ax + aw || // box-left is right of link right
        bx + bw < aw) { // box-right is left of link left
      return false;
    }
    return true;
  });

  console.log("Got " + $intersectingLinks.length + " links");
  console.log($intersectingLinks);
  if ($intersectingLinks.length > 0) {
    DepthJS.selectorBoxPopup.$links = $intersectingLinks;
    DepthJS.selectorBoxPopup.activate();
  }
};


// SELECTOR BOX POPUP ------------------------------------------------------------------------------
DepthJS.selectorBoxPopup.activate = function(){
  var $links = DepthJS.selectorBoxPopup.$links;
  DepthJS.state = "selectorBoxPopup";
  var $box = DepthJS.selectorBox.$box;
  var position = "top:" + $box.position().top + "px; left:" + $box.position().left + "px";
  $("body").append("<div id='depthjs_selectorBoxPopup' style='" + position + "'></div>");
  var popupContent = "";
  var popupItemIndex = 0;
  for(var i = 0; i < $links.length; i++){
    var linkText = $($links[i]).text();

    if (linkText.length <= 0) continue;

    if (linkText.indexOf("<img") > 0){
      popupContent += "<div id='depthjs_popupItem" + popupItemIndex +
      "' class='depthjs_selectorBoxPopupItem'>" +
      linkText.substring(0,70) + "</div>";
    } else{
      popupContent += "<div id='depthjs_popupItem" + popupItemIndex +
      "' class='depthjs_selectorBoxPopupItem'>" +
      $($links[i]).html() + "</div>";
    }
    popupItemIndex += 1;
  }
  DepthJS.selectorBox.$box.hide();
  $("#depthjs_selectorBoxPopup").html(popupContent);
}

DepthJS.selectorBoxPopup.move = function(x, y) {
  console.log("move selector box popup (" + x + ", " + y + ")");
  if (y == 0) y = 1;

  var $links = DepthJS.selectorBoxPopup.$links;
  var popupHeight = $("#depthjs_selectorBoxPopup").height();
  y = (y * popupHeight / 100) / (popupHeight / $links.length);
  var closestLinkIndex = Math.round(y);
  console.log("Closest link is " + closestLinkIndex);

  var $lastHighlightedLink = DepthJS.selectorBoxPopup.$lastHighlightedLink;
  console.log($lastHighlightedLink);
  if ($lastHighlightedLink != null){
    $lastHighlightedLink.removeClass("depthjs_selectorBoxPopupItemHighlight");
  }
  var $closestLink = $("#depthjs_popupItem" + closestLinkIndex);
  $closestLink.addClass("depthjs_selectorBoxPopupItemHighlight");
  DepthJS.selectorBoxPopup.lastHighlightedLinkIndex = closestLinkIndex;
  DepthJS.selectorBoxPopup.$lastHighlightedLink = $closestLink;
}

DepthJS.selectorBoxPopup.openHighlightedLink = function(){
  var $links = DepthJS.selectorBoxPopup.$links;
  var lastHighlightedLinkIndex = DepthJS.selectorBoxPopup.lastHighlightedLinkIndex;

  if (lastHighlightedLinkIndex <= 0) return;

  var $linkToOpen = $links.eq(lastHighlightedLinkIndex);

  var evt = document.createEvent("MouseEvents");
  evt.initMouseEvent("click", true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
  $linkToOpen[0].dispatchEvent(evt);
}

DepthJS.selectorBoxPopup.hide = function(){
  $("#depthjs_selectorBoxPopup").fadeOut(300, function(){
    $("#depthjs_selectorBoxPopup").remove();
  });
}

// EVENT LINK --------------------------------------------------------------------------------------

DepthJS.eventLink.initPort = function() {
  console.log("DepthJS: Event link init");
  var $DepthJS_eventPort = $("<div id='DepthJS_eventPort' style='display:none'></div>");
  $DepthJS_eventPort.appendTo("body");
  var port = chrome.extension.connect({name: "event"});
  port.onMessage.addListener(DepthJS.eventLink.onEvent);
  DepthJS.eventLink.port = port;
};

DepthJS.eventLink.onEvent = function (msg) {
  if (DepthJS.verbose) console.log("DepthJS: event " + msg.type);
  var handler = DepthJS.eventHandlers["on"+msg.type];
  if (handler != null) {
    handler(msg.data);
  }
  // jQuery's trigger doesn't seem to work here for some reason
  var event = document.createEvent("Event");
  event.initEvent(msg.type, false, false);
  $("#DepthJS_eventPort").text(msg.jsonRep);
  $("#DepthJS_eventPort").get(0).dispatchEvent(event);
};

// CANVAS LINK -------------------------------------------------------------------------------------

DepthJS.canvasLink.initDepth = function() {
  var $depthCanvas = $("canvas#DepthJS_depth");
  if ($depthCanvas.length > 0) {
    console.log("DepthJS: Will write to depth canvas");
    var depthCanvas = $depthCanvas.get(0);
    var c = depthCanvas.getContext("2d");

    // read the width and height of the canvas
    var w = 640;
    var h = 480;
    var imageData = c.createImageData(w, h);

    var port = chrome.extension.connect({name: "depth"});
    port.onMessage.addListener(function(msg) {
      var depthData = msg.data;
      // depthData is 255-valued depth repeated 640x480 times
      var imgPtr = 0;
      for (var ptr = 0; ptr < depthData.length; ptr++) {
        imageData.data[imgPtr++] = depthData.charCodeAt(ptr); // R
        imageData.data[imgPtr++] = depthData.charCodeAt(ptr); // G
        imageData.data[imgPtr++] = depthData.charCodeAt(ptr); // B
        imageData.data[imgPtr++] = 0xFF; // Alpha
      }
      c.putImageData(imageData, 0, 0);
    });

    // Start with all gray
    for (var i = 0; i < imageData.data.length; i+=4) {
      imageData.data[i+0] = 0x55; // R
      imageData.data[i+1] = 0x55; // G
      imageData.data[i+2] = 0x55; // B
      imageData.data[i+3] = 0xFF; // Alpha
    }
    c.putImageData(imageData, 0, 0);
  }
};

DepthJS.canvasLink.initImage = function () {
  var $imageCanvas = $("canvas#DepthJS_image");
  if ($imageCanvas.length > 0) {
    console.log("DepthJS: Will write to image canvas");

    // read the width and height of the canvas
    var w = 640;
    var h = 480;
    var imageCanvas = $imageCanvas.get(0);
    var c = imageCanvas.getContext("2d");
    var imageData = c.createImageData(w, h);

    var port = chrome.extension.connect({name: "image"});
    port.onMessage.addListener(function(msg) {
      var rawData = msg.data;
      // rawData is RGB repeated 640x480 times
      var imgPtr = 0;
      for (var ptr = 0; ptr < rawData.length; ptr+=3) {
        imageData.data[imgPtr++] = rawData.charCodeAt(ptr+0); // R
        imageData.data[imgPtr++] = rawData.charCodeAt(ptr+1); // G
        imageData.data[imgPtr++] = rawData.charCodeAt(ptr+2); // B
        imageData.data[imgPtr++] = 0xFF; // Alpha
      }
      c.putImageData(imageData, 0, 0);
    });

    // Start with all blue
    var c = imageCanvas.getContext("2d");
    var imageData = c.createImageData(w, h);
    for (var i = 0; i < imageData.data.length; i+=4) {
      imageData.data[i+0] = 0; // R
      imageData.data[i+1] = 0; // G
      imageData.data[i+2] = 0xFF; // B
      imageData.data[i+3] = 0xFF; // Alpha
    }
    c.putImageData(imageData, 0, 0);
  }
};




// DEPTHOSE

DepthJS.depthose.$div = null;
DepthJS.depthose.windows = null;
DepthJS.depthose.start = function() {
  DepthJS.eventLink.port.postMessage({type: "getThumbnailUrls"});
};
DepthJS.eventHandlers.onThumbnailUrls = function(response) {
  console.log(["REPSONE", response]);
  var windows = response.windows;
  DepthJS.depthose.windows = windows; // Make a local copy in case these objects are reused
  console.log(["got windows", windows]);
  DepthJS.depthose.show();
};


DepthJS.depthose.show = function() {
  if (DepthJS.depthose.windows == null) {
    DepthJS.depthose.start();
    return;
  }


  console.log("DepthJS: Entering Depthose");
  console.log(["Starting depthose with", DepthJS.depthose.windows]);
  DepthJS.selectorBox.hide();
  $("#DepthJS_depthose").remove();
  DepthJS.depthose.$div = $("<div id='DepthJS_depthose'></div>");
  var $div = DepthJS.depthose.$div;
  $div.css({"position": "fixed",
            "width": "100%",
            "height": "100%",
            "background-color": "#333",
            "z-index": "10000",
            "top": "0",
            "left": "0"})
      .addClass("zflow")
      .appendTo("body");

  $div.append("<div class='centering'><div id='DepthJS_tray' class='tray'></div></div>");
  // var images = _.pluck(DepthJS.depthose.windows, "dataUrl");
  var imageObjs = _.reject(DepthJS.depthose.windows,
                           function(el) { el.dataUrl == null; });
  console.log("after filtering we have " + imageObjs.length + " done.");

  imageObjs = _.map(imageObjs, function(window) {
    return {
      url: window.dataUrl,
      label: "im stupid",
      selectCallback: function() {
        console.log("selecting window id " + window.id);
      }
    };
  });

  if (imageObjs.length > 0) {
    console.log("starting zflow");
    zflow(imageObjs, "#DepthJS_tray");
    var e = document.createEvent("Event");
    e.initEvent("depthstart");
    e.pageX = $(window).width()/2;
    e.pageY = $(window).height()/2;
    document.getElementById("DepthJS_tray").dispatchEvent(e);
  } else {
    console.log("Not showing Depthose--no windows to show");
  }
};

DepthJS.depthose.hide = function() {
  if (DepthJS.depthose.$div == null) return;
  console.log("DepthJS: Exiting Depthose");
  var e = document.createEvent("Event");
  e.initEvent("depthend");
  document.getElementById("DepthJS_tray").dispatchEvent(e);
  DepthJS.depthose.$div.remove();
  DepthJS.depthose.$div = null;
};

DepthJS.depthose.move = function(x, y) {
  console.log("DepthJS: Move depthose");
  var e = document.createEvent("Event");
  e.initEvent("depthmove");
  e.pageX = x * $(window).width() / 100;
  e.pageY = y * $(window).height() / 100;
  document.getElementById("DepthJS_tray").dispatchEvent(e);
}

DepthJS.depthose.select = function() {
  console.log("DepthJS: Selecting");
  var e = document.createEvent("Event");
  e.initEvent("depthselect");
  document.getElementById("DepthJS_tray").dispatchEvent(e);
}

// Do the initialization
DepthJS.selectorBox.init();
DepthJS.eventLink.initPort();
DepthJS.canvasLink.initDepth();
DepthJS.canvasLink.initImage();
