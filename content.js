chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
      if (request.action === "getPageUrl") {
        sendResponse({url: window.location.href});
      }
    }
  );