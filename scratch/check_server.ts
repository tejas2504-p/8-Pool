import http from 'http';

const req = http.get('http://localhost:3000/health', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log('Status code:', res.statusCode);
    console.log('Response headers:', res.headers);
    console.log('Response body:', data);
  });
});

req.on('error', (err) => {
  console.error('Error connecting to backend server on port 3000:', err.message);
});
