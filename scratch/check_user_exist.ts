import http from 'http';

function checkUser(username: string) {
  const req = http.get(`http://localhost:3000/api/users/${username}`, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
      console.log(`User ${username} check:`, res.statusCode, data);
    });
  });
  req.on('error', (err) => {
    console.error('Error:', err.message);
  });
}

checkUser('tejasprajapati2504');
checkUser('tejasprajapati2504@gmail.com');
checkUser('tejasprajapati');
