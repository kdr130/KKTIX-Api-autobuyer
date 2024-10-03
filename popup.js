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
      console.log("response.error : " + JSON.stringify(response.error))
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

    document.getElementById('abortButton').addEventListener('click', abortOperation);
  })
}

function abortOperation() {
  console.log("abortOperation from popup")
  chrome.runtime.sendMessage({ action: "abortOperation" }, function(response) {
    if (response && response.success) {
      console.log("Abort signal sent successfully");
      document.getElementById('result').innerText = 'Abort signal sent successfully'
    } else {
      console.log("Failed to send abort signal");
      document.getElementById('result').innerText = 'Failed to send abort signal'
    }
  });
}


chrome.tabs.getSelected(null, init)
  

let backgroundPort;

function connectToBackground() {
  backgroundPort = chrome.runtime.connect({name: "popup"});
  
  backgroundPort.onMessage.addListener(function(message) {
    // 處理來自background的消息
    console.log("Received message from background:", message);
    
    // 根據消息類型更新UI
    if (message.type === "postUpdate") {
      updatePostStatus(message.data);
    } else if (message.type === "getUpdate") {
      updateGetStatus(message.data);
    }
    // ... 處理其他類型的消息 ...
  });
}

// 在popup打開時連接到background
document.addEventListener('DOMContentLoaded', connectToBackground);

// 更新UI的函數
function updatePostStatus(log) {
  // 更新UI以顯示POST請求的狀態
  console.log("updatePostStatus: log: " + log)
  document.getElementById('result').innerText = log
}

function updateGetStatus(data) {
    // 更新UI以顯示GET請求的狀態
  console.log("updateGetStatus: data: " + JSON.stringify(data))
}