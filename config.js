const MODE = 'live'; // change to 'live' for production

const config = {
    sandbox: {
        apiKey: 'e0e21704-240c-4fff-9a8a-a86be136b4cb',
        collectionId: 'fnfno2qa',
        apiUrl: 'https://www.billplz-sandbox.com/api/v3/bills',

        // Local testing (default)
        // backendUrl: 'http://localhost:5000',

        // 🔥 NGROK (uncomment when testing webhook locally)
        backendUrl: 'https://supernormally-martial-monica.ngrok-free.dev',

        frontendUrl: 'http://localhost:5173'
        },

    live: {
        apiKey: 'YOUR_LIVE_API_KEY',
        collectionId: 'YOUR_LIVE_COLLECTION_ID',
        apiUrl: 'https://www.billplz.com/api/v3/bills',

        backendUrl: 'https://qash-camp-be.vercel.app',
        frontendUrl: 'https://www.qashcamp.com'
        
    }
};

const current = config[MODE];

module.exports = current;
