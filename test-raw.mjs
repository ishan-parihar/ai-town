import net from 'net';

const client = net.createConnection({ port: 3001 }, () => {
  console.log('Connected to server!');
  
  client.write('GET /health HTTP/1.1\r\n');
  client.write('Host: localhost\r\n');
  client.write('Connection: close\r\n\r\n');
});

client.on('data', (data) => {
  console.log('Response:', data.toString());
  client.end();
});

client.on('error', (err) => {
  console.error('Connection error:', err.message);
});

client.on('end', () => {
  console.log('Disconnected from server');
});