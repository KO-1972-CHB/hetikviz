type RedisArgument = string | number;

export function createSharedStore() {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!url || !token) return null;
  const endpoint = new URL(url);
  if (endpoint.protocol !== 'https:') throw new Error('Redis REST must use HTTPS');
  const scope = process.env.VERCEL_ENV || process.env.NODE_ENV || 'development';
  const prefix = process.env.QUIZ_STORE_PREFIX?.trim() || `hetikviz:${scope}`;
  const key = (suffix: string) => `${prefix}:${suffix}`;

  async function command<T>(...args: RedisArgument[]): Promise<T> {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(args),
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) throw new Error(`Redis REST HTTP ${response.status}`);
    const payload = await response.json();
    if (payload.error || !('result' in payload)) throw new Error('Redis command failed');
    return payload.result as T;
  }

  return {
    get: (name: string) => command<string | null>('GET', key(name)),
    setSession: (name: string, duration: number) => command('SET', key(name), 'active', 'PX', duration),
    remove: (name: string) => command('DEL', key(name)),
    setQuiz: (name: string, content: string) => command('SET', key(name), content, 'NX'),
    take: (name: string, max: number, cost: number, windowMs: number) => command<number>(
      'EVAL',
      `local n = tonumber(redis.call('GET', KEYS[1]) or '0')
       if n + tonumber(ARGV[2]) > tonumber(ARGV[1]) then return redis.call('PTTL', KEYS[1]) end
       if n == 0 then
         redis.call('SET', KEYS[1], ARGV[2], 'PX', ARGV[3])
       else
         redis.call('INCRBY', KEYS[1], ARGV[2])
       end
       return 0`,
      1, key(name), max, cost, windowMs,
    ),
  };
}

export type SharedStore = ReturnType<typeof createSharedStore>;
