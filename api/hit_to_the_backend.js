const https = require('https');

const apiUrl = 'https://chat-app-42rc.onrender.com/api/get_users/';

async function hitApi() {
  try {
    console.log(`Sending request to ${apiUrl}...`);
    
    https.get(apiUrl, (response) => {
      console.log('Response Status:', response.statusCode);

      let data = '';
      
      // Collect the response body
      response.on('data', (chunk) => {
        data += chunk;
      });
      
      // Log the full response when it's finished
      response.on('end', () => {
        console.log('Response Body:', data);
        console.log('Request completed');
      });
    }).on('error', (err) => {
      console.error('Error hitting API:', err.message);
    });
  } catch (error) {
    console.error('Error:', error.message);
  }
}

module.exports = async (req, res) => {
  await hitApi();
  res.status(200).send('API hit successfully');
};
