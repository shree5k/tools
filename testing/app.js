// Use API_ID from api.js
document.getElementById('api-id').textContent = `API_ID: ${API_ID}`;

// Example API call - replace with your API endpoint
fetch(`https://script.google.com/macros/s/${API_ID}`)
  .then(response => response.json())
  .then(data => {
    document.getElementById('api-result').textContent = JSON.stringify(data, null, 2);
  })
  .catch(error => {
    document.getElementById('api-result').textContent = 'Error fetching API data';
    console.error(error);
  });
