document.getElementById('postForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const url = document.getElementById('url').value;
    const data = document.getElementById('data').value;
  
    // Get the current tab's URL
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {action: "getPageUrl"}, function(response) {
        const pageUrl = new URL(response.url);
        
        // Get cookies for the current domain
        chrome.cookies.getAll({domain: pageUrl.hostname}, function(cookies) {
          const cookieString = cookies.map(cookie => `${cookie.name}=${cookie.value}`).join('; ');
          
          // Make the POST request with cookies
          fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Cookie': cookieString
            },
            body: data,
            credentials: 'include'
          })
          .then(response => response.json())
          .then(data => {
            let resultMessage = '';
            if (data && typeof data === 'object' && 'token' in data) {
              const token = data.token;
              resultMessage = `Token found: ${token}\n`;
              document.getElementById('result').innerText = resultMessage + 'Fetching data...';
              
              // Perform GET request with the token
              const getUrl = `https://queue.kktix.com/queue/token/${token}`;
              return fetch(getUrl, {
                method: 'GET',
                headers: {
                  'Cookie': cookieString
                },
                credentials: 'include'
              });
            } else {
              throw new Error('No token found in the response.');
            }
          })
          .then(response => response.json())
          .then(getData => {
            const resultElement = document.getElementById('result');
            resultElement.innerText += '\nGET request successful. Data:';
            resultElement.innerText += '\n' + JSON.stringify(getData, null, 2);
          })
          .catch(error => {
            document.getElementById('result').innerText = 'Error: ' + error.toString();
          });
        });
      });
    });
  });