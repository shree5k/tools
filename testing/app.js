// Use API_ID from api.js
document.getElementById('api-id').textContent = `API_ID: ${API_ID}`;

// Example API URL - make sure this is correct and accessible
const apiUrl = `https://script.google.com/macros/s/${API_ID}`;

fetch(apiUrl)
  .then(response => {
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
    }
    return response.json();
  })
  .then(data => {
    document.getElementById('api-result').textContent = JSON.stringify(data, null, 2);
  })
  .catch(error => {
    document.getElementById('api-result').textContent = `Error fetching API data: ${error.message}`;
    console.error('Fetch error:', error);
  });
