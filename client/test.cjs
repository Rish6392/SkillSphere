const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

async function run() {
  try {
    const r = Math.random();
    const signupRes = await axios.post('http://localhost:5000/api/auth/register', {
      firstName: 'Test', lastName: 'Upload', email: `test${r}@test.com`, password: 'password123', role: 'client'
    });
    
    const token = signupRes.data.token;
    const userId = signupRes.data.user._id;
    
    fs.writeFileSync('dummy.jpg', 'dummy content');
    
    const form = new FormData();
    form.append('file', fs.createReadStream('dummy.jpg'));
    form.append('receiverId', userId);
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
    console.log('SIGNUP FAILED:', e.response?.data || e.message);
  }
}
run();
