var csrfToken = "";
var eventId = "";

function customURLEncode(str) {
  return encodeURIComponent(str)
    .replace(/!/g, "%21")
    .replace(/'/g, "%27")
    .replace(/\(/g, "%28")
    .replace(/\)/g, "%29")
    .replace(/\*/g, "%2A")
    .replace(/%20/g, "+");
}

document.getElementById("postForm").addEventListener("submit", function (e) {
  e.preventDefault();

  if (csrfToken == "") {
    alert("csrfToken 為空 請重整網頁再打開");
    return;
  }

  const url =
    "https://queue.kktix.com/queue/" +
    eventId +
    "?authenticity_token=" +
    customURLEncode(csrfToken);
  const data = document.getElementById("data").value;
  // 獲取 retry_interval 的值
  const retryInterval =
    parseInt(document.getElementById("retry_interval").value) || 500;

  // 獲取當前標籤頁的URL
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    const pageUrl = tabs[0].url;

    // 發送消息到background script，包括 retryInterval
    chrome.runtime.sendMessage(
      {
        action: "performRequests",
        url: url,
        data: data,
        pageUrl: pageUrl,
        retryInterval: retryInterval, // 新增的重試間隔參數
      },
      function (response) {
        console.log("response.getData : " + JSON.stringify(response.getData));
        console.log("response.error : " + JSON.stringify(response.error));
        if (response.success) {
          document.getElementById("result").innerText =
            "POST response: " +
            JSON.stringify(response.postData) +
            "\n\nGET response: " +
            JSON.stringify(response.getData);
        } else {
          document.getElementById("result").innerText =
            "Error: " + response.error;
        }
      }
    );
  });
});

document.addEventListener("DOMContentLoaded", function () {
  const textarea = document.getElementById("data");
  const retryIntervalInput = document.getElementById("retry_interval");

  // 當頁面載入時，讀取儲存的內容
  chrome.storage.local.get(
    ["textareaContent", "retryInterval"],
    function (result) {
      if (result.textareaContent) {
        textarea.value = result.textareaContent;
      }
      if (result.retryInterval) {
        retryIntervalInput.value = result.retryInterval;
      } else {
        retryIntervalInput.value = 500; // 默認值
      }
    }
  );

  // 當內容改變時，儲存內容
  textarea.addEventListener("input", function () {
    chrome.storage.local.set({
      textareaContent: textarea.value,
    });
  });

  // 當 retry_interval 改變時，儲存內容
  retryIntervalInput.addEventListener("input", function () {
    const retryInterval = parseInt(this.value);
    if (retryInterval < 100) {
      this.value = 100;
    }
    chrome.storage.local.set({
      retryInterval: this.value,
    });
  });
});

var init = (tab) => {
  var tabId = tab.id;
  chrome.tabs.sendMessage(
    tabId,
    { action: "getContentData" },
    function (response) {
      console.log("response: " + JSON.stringify(response));
      console.log("response.csrfToken: " + response.csrfToken);
      csrfToken = response.csrfToken;
      eventId = response.eventId;
      questionExists = response.questionExists;
      recaptchaExists = response.recaptchaExists;

      console.log("questionExists: " + questionExists);
      console.log("recaptchaExists: " + recaptchaExists);

      if (questionExists && recaptchaExists) {
        document.getElementById("questionType").innerText =
          "有一般問題" + "\n" + "有 Google 驗證";
      } else if (questionExists) {
        document.getElementById("questionType").innerText = "有一般問題";
      } else if (recaptchaExists) {
        document.getElementById("questionType").innerText = "有 Google 驗證";
      }

      if (csrfToken != "") {
        document.getElementById("questionType").innerText =
          document.getElementById("questionType").innerText +
          "\ncsrfToken: " +
          csrfToken;
      }

      document
        .getElementById("abortButton")
        .addEventListener("click", abortOperation);

      initTicketTable(response.ticketArray);
    }
  );
};

function initTicketTable(ticketArray) {
  var select = document.getElementById("tickets");

  var defaultOption = document.createElement("option");
  defaultOption.text = "     ";
  select.add(defaultOption);

  if (ticketArray) {
    console.log(ticketArray);
    for (var i = 0; i < ticketArray.length; i++) {
      var option = document.createElement("option");
      option.text = ticketArray[i].price + "/" + ticketArray[i].name;
      option.value = ticketArray[i].id;
      select.add(option);
    }
  } else {
    var option = document.createElement("option");
    option.text = "沒抓到資料，請重按一次";
    select.add(option);
  }

  select.addEventListener("change", function () {
    console.log("onchangeonchangeonchange");
    var ticketIdElement = document.getElementById("ticket_id");
    ticketIdElement.value = select.value;
    updateJsonData();
  });
}

function abortOperation() {
  console.log("abortOperation from popup");
  chrome.runtime.sendMessage({ action: "abortOperation" }, function (response) {
    if (response && response.success) {
      console.log("Abort signal sent successfully");
      document.getElementById("result").innerText =
        "Abort signal sent successfully";
    } else {
      console.log("Failed to send abort signal");
      document.getElementById("result").innerText =
        "Failed to send abort signal";
    }
  });
}

chrome.tabs.getSelected(null, init);

let backgroundPort;
function connectToBackground() {
  backgroundPort = chrome.runtime.connect({ name: "popup" });

  backgroundPort.onMessage.addListener(function (message) {
    console.log("Received message from background:", message);
    if (message.type === "postUpdate") {
      updatePostStatus(message.data);
    } else if (message.type === "getUpdate") {
      updateGetStatus(message.data);
    }
  });
}

document.addEventListener("DOMContentLoaded", connectToBackground);

function updatePostStatus(log) {
  console.log("updatePostStatus: log: " + log);
  document.getElementById("result").innerText = log;
}

function updateGetStatus(data) {
  console.log("updateGetStatus: data: " + JSON.stringify(data));
}

function addOnChangeListener() {
  document
    .getElementById("ticket_count")
    .addEventListener("input", function () {
      updateJsonData();
    });

  document.getElementById("member_code").addEventListener("input", function () {
    updateJsonData();
  });

  document
    .getElementById("captcha_answer")
    .addEventListener("input", function () {
      updateJsonData();
    });

  // 添加 retry_interval 的監聽器
  document
    .getElementById("retry_interval")
    .addEventListener("input", function () {
      const retryInterval = parseInt(this.value);
      if (retryInterval < 100) {
        this.value = 100; // 確保最小值為100ms
      }
    });
}

function updateJsonData() {
  var ticketFullId = document.getElementById("ticket_id").value;
  var ticketId = ticketFullId.replace("ticket_", "");
  console.log("ticketId: " + ticketId);

  var ticketCount = document.getElementById("ticket_count").value;
  console.log("ticketCount: " + ticketCount);

  var memberCode = document.getElementById("member_code").value;
  console.log("memberCode: " + memberCode);

  var customCaptcha = document.getElementById("captcha_answer").value;
  console.log("custom_captcha: " + customCaptcha);

  document.getElementById("data").value =
    '{"tickets":[{"id":' +
    ticketId +
    ',"quantity":' +
    ticketCount +
    ',"invitationCodes":[],"member_code":"' +
    memberCode +
    '","use_qualification_id":null}],"currency":"TWD","recaptcha":{},"custom_captcha":"' +
    customCaptcha +
    '","agreeTerm":true}';
}

addOnChangeListener();
