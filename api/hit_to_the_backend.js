const https = require('https');

const apiUrl = 'https://chat-app-42rc.onrender.com/api/get_users/';

async function fetchApiResponse() {
  return new Promise((resolve, reject) => {
    console.log(`Sending request to ${apiUrl}...`);
    
    https.get(apiUrl, (response) => {
      console.log('Response Status:', response.statusCode);

      let data = '';
      
      // Collect the response body
      response.on('data', (chunk) => {
        data += chunk;
      });
      
      // Resolve the full response when it's finished
      response.on('end', () => {
        console.log('Response Body:', data);
        resolve({ statusCode: response.statusCode, body: data });
      });
    }).on('error', (err) => {
      console.error('Error hitting API:', err.message);
      reject(err);
    });
  });
}

module.exports = async (req, res) => {
  try {
    const apiResponse = await fetchApiResponse();
    res.status(apiResponse.statusCode).send(apiResponse.body);
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).send({ error: 'Failed to fetch API response' });
  }
};
