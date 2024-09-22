
document.getElementById('postForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const url = document.getElementById('url').value;
    const data = document.getElementById('data').value;
  
    // 獲取當前標籤頁的URL
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      const pageUrl = tabs[0].url;
      
      // 發送消息到background script
      chrome.runtime.sendMessage({
        action: "performRequests",
        url: url,
        data: data,
        pageUrl: pageUrl
      }, function(response) {
        if (response.success) {
          document.getElementById('result').innerText = 'POST response: ' + JSON.stringify(response.postData) + '\n\nGET response: ' + JSON.stringify(response.getData);
        } else {
          document.getElementById('result').innerText = 'Error: ' + response.error;
        }
      });
    });
  });

// document.getElementById('postForm').addEventListener('submit', function(e) {
//     const url = document.getElementById('url').value;
//     const data = document.getElementById('data').value;

//     chrome.runtime.sendMessage({
//         action: "performRequests",
//         url: url,
//         data: JSON.stringify({data})
//       }, function(response) {
//         if (response.success) {
//           console.log("POST response:", response.postData);
//           console.log("GET response:", response.getData);
//         } else {
//           console.error("Error:", response.error);
//         }
//       });
// })



// document.getElementById('postForm').addEventListener('submit', function(e) {
//     e.preventDefault();
    
//     const url = document.getElementById('url').value;
//     const data = document.getElementById('data').value;
  
//     // Get the current tab's URL
//     chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
//       chrome.tabs.sendMessage(tabs[0].id, {action: "getPageUrl"}, function(response) {
//         const pageUrl = new URL(response.url);

//         // pageUrl: https://kktix.com/events/plwrf/registrations/new
//         console.log("pageUrl: " + pageUrl)
        
//         // Get cookies for the current domain
//         chrome.cookies.getAll({domain: pageUrl.hostname}, function(cookies) {
//           const cookieString = cookies.map(cookie => `${cookie.name}=${cookie.value}`).join('; ');
          
//           console.log("cookieString")
//           console.log(cookieString)
//           // Make the POST request with cookies
//           fetch(url, {
//             method: 'POST',
//             headers: {
//               'Content-Type': 'application/json'
//             },
//             body: data,
//             credentials: 'include'
//           })
//           .then(response => response.json())
//           .then(data => {
//             let resultMessage = '';
//             if (data && typeof data === 'object' && 'token' in data) {
//               const token = data.token;
//               resultMessage = `Token found: ${token}\n`;
//               document.getElementById('result').innerText = resultMessage + 'Fetching data...';
              
//               // Perform GET request with the token
//               const getUrl = `https://queue.kktix.com/queue/token/${token}`;
//               return fetch(getUrl, {
//                 method: 'GET',
//                 headers: {
//                   'Cookie': cookieString
//                 },
//                 credentials: 'include'
//               });
//             } else {
//               throw new Error('No token found in the response.');
//             }
//           })
//           .then(response => response.json())
//           .then(getData => {
//             const resultElement = document.getElementById('result');
//             resultElement.innerText += '\nGET request successful. Data:';
//             resultElement.innerText += '\n' + JSON.stringify(getData, null, 2);
//           })
//           .catch(error => {
//             document.getElementById('result').innerText = 'Error: ' + error.toString();
//           });
//         });
//       });
//     });
//   });