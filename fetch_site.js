const http = require('http');

http.get('http://localhost:3005', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log("HTML:");
    console.log(data);
  });
}).on('error', console.error);
