// app.js

// Use the injected global variable API_ID
console.log('API ID is:', API_ID);

// Example of using API_ID to make a request (illustrative only)
fetch(`https://example.com/api/some-endpoint?api_id=${API_ID}`)
  .then(response => response.json())
  .then(data => {
    // Do something with API response
    document.getElementById('api-result').textContent = JSON.stringify(data);
  })
  .catch(error => {
    // Handle error
    console.error(error);
  });
