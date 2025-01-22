const fetch = require('node-fetch');

async function testFetch() {
    try {
        const response = await fetch('https://jsonplaceholder.typicode.com/todos/1');
        const data = await response.json();
        console.log(data);
    } catch (error) {
        console.error('Fetch error:', error);
    }
}

testFetch();