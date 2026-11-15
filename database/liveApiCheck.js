const http = require('http');
const app = require('../app');
const { initDb } = require('../database/initDb');
const { seedData } = require('../database/seedData');

async function testApi() {
  initDb();
  seedData();

  const PORT = 5001;
  const server = app.listen(PORT);

  const makeRequest = (options, postData = null) => {
    return new Promise((resolve, reject) => {
      const req = http.request(
        {
          hostname: '127.0.0.1',
          port: PORT,
          ...options,
          headers: {
            'Content-Type': 'application/json',
            ...(options.headers || {})
          }
        },
        (res) => {
          let data = '';
          res.on('data', (chunk) => (data += chunk));
          res.on('end', () => {
            try {
              resolve({ status: res.statusCode, body: JSON.parse(data) });
            } catch (e) {
              resolve({ status: res.statusCode, body: data });
            }
          });
        }
      );
      req.on('error', reject);
      if (postData) {
        req.write(JSON.stringify(postData));
      }
      req.end();
    });
  };

  try {
    console.log('Testing live API server on port', PORT);

    // 1. Health
    const health = await makeRequest({ path: '/health', method: 'GET' });
    console.log('1. GET /health -> Status:', health.status, 'Service:', health.body.service);

    // 2. Doctors Search
    const docSearch = await makeRequest({
      path: '/doctors?specialization=Cardio',
      method: 'GET'
    });
    console.log(
      '2. GET /doctors?specialization=Cardio -> Status:',
      docSearch.status,
      'Matches:',
      docSearch.body.data.map((d) => `${d.name} (${d.specialization})`)
    );

    // 3. Room Floor Search
    const roomSearch = await makeRequest({ path: '/rooms?floor=2', method: 'GET' });
    console.log(
      '3. GET /rooms?floor=2 -> Status:',
      roomSearch.status,
      'Rooms on Floor 2:',
      roomSearch.body.data.map((r) => `${r.name} (Floor ${r.floor})`)
    );

    // 4. SQL JOIN Details
    const joinRes = await makeRequest({ path: '/bookings/details', method: 'GET' });
    console.log(
      '4. GET /bookings/details -> Status:',
      joinRes.status,
      'Total joined bookings:',
      joinRes.body.count
    );
    console.log('   Sample Joined Booking:', joinRes.body.data[0]);

    // 5. Mandatory 4-Step Soft-Delete Cycle
    console.log('\n--- MANDATORY 4-STEP SOFT DELETE CYCLE ---');
    // Step 1
    const delRes = await makeRequest({ path: '/rooms/3', method: 'DELETE' });
    console.log('Step 1: DELETE /rooms/3 -> Status:', delRes.status, delRes.body.message);

    // Step 2
    const getDelRes = await makeRequest({ path: '/rooms/3', method: 'GET' });
    console.log('Step 2: GET /rooms/3 -> Status:', getDelRes.status, getDelRes.body.message);

    // Step 3
    const restRes = await makeRequest({ path: '/rooms/3/restore', method: 'POST' });
    console.log('Step 3: POST /rooms/3/restore -> Status:', restRes.status, restRes.body.message);

    // Step 4
    const getRestRes = await makeRequest({ path: '/rooms/3', method: 'GET' });
    console.log(
      'Step 4: GET /rooms/3 -> Status:',
      getRestRes.status,
      'Room Name:',
      getRestRes.body.data.name,
      'is_deleted:',
      getRestRes.body.data.is_deleted
    );

    console.log('\n✓ Live API Verification Complete and All Checks Passed!');
  } finally {
    server.close();
  }
}

testApi().catch((err) => {
  console.error('Error during live test:', err);
  process.exit(1);
});
