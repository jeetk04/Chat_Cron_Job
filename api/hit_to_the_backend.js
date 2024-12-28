const https = require('https');

// The URL of your API endpoint
const apiUrl = 'https://chat-app-42rc.onrender.com/api/get_users/';

async function hitApi() {
  try {
    console.log(`Sending request to ${apiUrl}...`);
    
    // Making the GET request using https module
    https.get(apiUrl, (response) => {
      console.log('Response Status:', response.statusCode); // Log only the status code

      // We are not processing the response body, just checking the status
      response.on('end', () => {
        console.log('Request completed');
      });
    }).on('error', (err) => {
      console.error('Error hitting API:', err.message);
    });
  } catch (error) {
    console.error('Error:', error.message);
  }
}

hitApi();
