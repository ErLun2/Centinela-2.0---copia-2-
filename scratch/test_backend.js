
async function testBackend() {
    const url = 'https://centinela-backend.onrender.com/api/planes';
    try {
        const response = await fetch(url);
        console.log('Status:', response.status);
        const text = await response.text();
        console.log('Body:', text);
    } catch (error) {
        console.error('Fetch error:', error);
    }
}

testBackend();
