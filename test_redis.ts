import { Redis } from '@upstash/redis';

async function testRedis() {
  console.log("Connecting to Redis...");
  const redis = new Redis({
    url: 'https://uncommon-donkey-91093.upstash.io',
    token: 'gQAAAAAAAWPVAAIncDE2Mzg4NTUxZjlkZTY0YWZmOTM5MmU1YmNlMDA4NjJmNHAxOTEwOTM',
  });
  
  console.log("Setting a test key in Redis...");
  await redis.set('hello', 'world From Your NextJS App!');
  
  console.log("Retrieving the test key...");
  const value = await redis.get('hello');
  
  console.log("Value retrieved from Redis:", value);
  console.log("\nSuccess! The Redis instance is reachable and working!");
}

testRedis().catch(console.error);
