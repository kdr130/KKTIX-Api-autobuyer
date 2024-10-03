
var csrfToken = ""
var eventId = ""


function customURLEncode(str) {
  return encodeURIComponent(str)
    .replace(/!/g, '%21')
    .replace(/'/g, '%27')
    .replace(/\(/g, '%28')
    .replace(/\)/g, '%29')
    .replace(/\*/g, '%2A')
    .replace(/%20/g, '+');
}


document.getElementById('postForm').addEventListener('submit', function (e) {
  e.preventDefault();

  const url = "https://queue.kktix.com/queue/" + eventId + "?authenticity_token=" + customURLEncode(csrfToken)
  const data = document.getElementById('data').value;

  // 獲取當前標籤頁的URL
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    const pageUrl = tabs[0].url;

    // 發送消息到background script
    chrome.runtime.sendMessage({
      action: "performRequests",
      url: url,
      data: data,
      pageUrl: pageUrl
    }, function (response) {
      console.log("response.getData : " + JSON.stringify(response.getData))
      if (response.success) {
        document.getElementById('result').innerText = 'POST response: ' + JSON.stringify(response.postData) + '\n\nGET response: ' + JSON.stringify(response.getData);
      } else {
        document.getElementById('result').innerText = 'Error: ' + response.error;
      }
    });
  });
});


var init = (tab) => {
  var tabId = tab.id;
  chrome.tabs.sendMessage(tabId, { action: "getContentData" }, function (response) {
    console.log("response: " + JSON.stringify(response))
    console.log("response.csrfToken: " + response.csrfToken)
    csrfToken = response.csrfToken
    eventId = response.eventId
    questionExists = response.questionExists
    recaptchaExists = response.recaptchaExists

    console.log("questionExists: " + questionExists)
    console.log("recaptchaExists: " + recaptchaExists)  

    if (questionExists && recaptchaExists) {
      document.getElementById('questionType').innerText = '有一般問題' + '\n' + '有 Google 驗證';
    } else if (questionExists) {
      document.getElementById('questionType').innerText = '有一般問題';
    } else if (recaptchaExists) {
      document.getElementById('questionType').innerText = '有 Google 驗證';
    }

    if (csrfToken != "") {
      document.getElementById('questionType').innerText = document.getElementById('questionType').innerText + '\ncsrfToken: ' + csrfToken;
    }
  })
}

chrome.tabs.getSelected(null, init)
