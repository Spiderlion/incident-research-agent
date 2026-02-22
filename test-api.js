const axios = require('axios');

async function testApi() {
    const query = "car accident Indore 2026";
    console.log(`🚀 Sending POST request to /api/research with query: "${query}"\n`);

    try {
        const response = await axios.post('http://localhost:3000/api/research', {
            query: query
        });

        console.log(`✅ Request successful! Received ${response.data.length} total results.`);
        console.log('--- JSON RESPONSE ---');
        console.log(JSON.stringify(response.data, null, 2));
    } catch (error) {
        if (error.response) {
            console.error(`❌ API returned an error: ${error.response.status}`);
            console.error(error.response.data);
        } else {
            console.error(`❌ Could not reach the server: ${error.message}`);
            console.log('\n⚠️ Make sure the Express server is running first!');
            console.log('Run `node src/server.js` in a separate terminal window, then run this test script again.');
        }
    }
}

testApi();
