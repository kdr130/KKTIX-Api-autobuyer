chrome.runtime.onMessage.addListener(onMessage);

var eventId = "";

function onMessage(request, sender, sendResponse) {
  console.log("request: " + JSON.stringify(request));
  switch (request.action) {
    case "getToParam":
      if ("to_param" in request.data) {
        console.log("request.to_param: " + request.data.to_param);
        window.location.href =
          "https://kktix.com/events/" +
          eventId +
          "/registrations/" +
          request.data.to_param +
          "#/booking";
      }
      break;

    case "getContentData":
      let currentUrl = window.location.href;
      const urlParts = currentUrl.split("/");
      const eventIndex = urlParts.indexOf("events");
      eventId =
        eventIndex !== -1 && eventIndex + 1 < urlParts.length
          ? urlParts[eventIndex + 1]
          : null;
      // console.log("Event ID:", eventId);

      const csrfToken = document
        .querySelector('meta[name="csrf-token"]')
        .getAttribute("content");
      console.log("getCsrfToken: " + csrfToken);

      var tickets = document.getElementsByClassName("display-table");

      var dataArray = [];
      for (var i = 0; i < tickets.length; i++) {
        var t = tickets[i];
        // console.log(t.id)
        // console.log(t.getElementsByClassName("ticket-name")[0].innerText)
        // console.log(t.getElementsByClassName("ticket-price")[0].innerText)

        dataArray.push({
          id: t.id,
          name: t.getElementsByClassName("ticket-name")[0].innerText,
          price: t.getElementsByClassName("ticket-price")[0].innerText,
        });
      }

      sendResponse({
        csrfToken: csrfToken,
        eventId: eventId,
        questionExists: checkQuestionExists(),
        recaptchaExists: checkRecaptchaExists(),
        ticketArray: dataArray,
      });
      break;
  }
}

function checkQuestionExists() {
  const targetDiv = document.querySelector('div[ng-switch-when="2"].ng-scope');

  // 檢查是否找到了目標元素
  if (targetDiv) {
    return true;
  } else {
    return false;
  }
}

function checkRecaptchaExists() {
  const targetDiv = document.querySelector(
    'div[ng-switch-when="1|3"].ng-scope'
  );

  // 檢查是否找到了目標元素
  if (targetDiv) {
    return true;
  } else {
    return false;
  }
}
