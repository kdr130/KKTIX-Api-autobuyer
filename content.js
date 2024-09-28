  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log("request: " + JSON.stringify(request))

    if (request.action === "getToParam") {
      if ('to_param' in request.data) {
        console.log("request.to_param: " + request.data.to_param)
        window.location.href = "https://kktix.com/events/plwrf/registrations/" + request.data.to_param + "#/booking"
      }
    }
  })
