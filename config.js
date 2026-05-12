const MODE = 'sandbox'; // change to 'live' for production

const config = {
    sandbox: {
        apiKey: 'e0e21704-240c-4fff-9a8a-a86be136b4cb',
        collectionId: 'fnfno2qa',
        apiUrl: 'https://www.billplz-sandbox.com/api/v3/bills'
    },
    live: {
        apiKey: 'YOUR_LIVE_API_KEY',
        collectionId: 'YOUR_LIVE_COLLECTION_ID',
        apiUrl: 'https://www.billplz.com/api/v3/bills'
    }
};

const current = config[MODE];

module.exports = current;
