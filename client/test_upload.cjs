const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

async function run() {
  try {
    const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'rishabhgzp2004@gmail.com',
      password: 'password123'
    });
    const token = loginRes.data.token;
    
    // Create a 1x1 transparent PNG buffer
    const pngBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');
    fs.writeFileSync('real.png', pngBuffer);
    
    const form = new FormData();
    form.append('file', fs.createReadStream('real.png'), { filename: 'real.png', contentType: 'image/png' });
    form.append('receiverId', loginRes.data.user._id);
    form.append('conversationId', 'null');
    form.append('gigId', 'null');
    
    try {
        const res = await axios.post('http://localhost:5000/api/messages/upload', form, {
          headers: {
            ...form.getHeaders(),
            Authorization: 'Bearer ' + token
          }
        });
        console.log('SUCCESS:', res.data);
    } catch(err) {
        console.log('UPLOAD FAILED:', err.response?.data || err.message);
    }
  } catch(e) {
    console.log('LOGIN/REQ FAILED:', e.response?.data || e.message);
  }
}
run();
