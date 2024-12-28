const axios = require('axios');

// The URL of your API endpoint
const apiUrl = 'https://chat-app-42rc.onrender.com/api/get_users/';

// Function to hit the API and log the response status
async function hitApi() {
  try {
    console.log(`Sending request to ${apiUrl}...`);
    const response = await axios.get(apiUrl);
    console.log('Response Status:', response.status); // Only log the status code
  } catch (error) {
    console.error('Error hitting API:', error.message); // Only log the error message if there's one
  }
}

hitApi();
