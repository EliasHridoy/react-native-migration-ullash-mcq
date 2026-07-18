import http from 'k6/http';
import { check } from 'k6';

export let options = {
  stages: [
    { duration: '2m', target: 1000 },
    { duration: '5m', target: 10000 },
    { duration: '2m', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<150'],    // < 150ms API latency
    http_req_failed: ['rate<0.001'],      // < 0.1% failure
  },
};

export default function() {
  const res = http.get('https://bmqdmanvpbrerlgisald.supabase.co/rest/v1/boards', {
    headers: { apikey: __ENV.ANON_KEY },
  });
  check(res, { 'status 200': r => r.status === 200 });
}
