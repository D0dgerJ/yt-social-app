import { createClient } from 'redis';

const redisPub = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
});
const redisSub = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
});

redisPub.on('error', (err) => console.error('Redis Publisher Error:', err));
redisSub.on('error', (err) => console.error('Redis Subscriber Error:', err));

Promise.all([redisPub.connect(), redisSub.connect()])
  .then(() => console.log('✅ Redis Pub/Sub подключены'))
  .catch((err) => console.error('❌ Ошибка подключения к Redis:', err));

export { redisPub, redisSub };
