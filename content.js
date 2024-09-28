chrome.runtime.onMessage.addListener(onMessage)

var eventId = ""

function onMessage(request, sender, sendResponse) {
  console.log("request: " + JSON.stringify(request))
  switch (request.action) {
    case "getToParam":
      if ('to_param' in request.data) {
        console.log("request.to_param: " + request.data.to_param)
        window.location.href = "https://kktix.com/events/" + eventId + "/registrations/" + request.data.to_param + "#/booking"
      }
      break

    case "getCsrfToken":
      let currentUrl = window.location.href;
      const urlParts = currentUrl.split('/');
      const eventIndex = urlParts.indexOf('events');
      eventId = eventIndex !== -1 && eventIndex + 1 < urlParts.length ? urlParts[eventIndex + 1] : null;
      // console.log("Event ID:", eventId);

      const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
      console.log("getCsrfToken: " + csrfToken)
      sendResponse({ csrfToken: csrfToken, eventId: eventId })
      break
  }
}
