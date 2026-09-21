import http from 'k6/http';
import { check, sleep } from 'k6';

// Лаб 3 — Алхам 4: SLO → k6 threshold
// README-гийн Алхам 3 дахь SLO хүснэгтийн босго бүр энд кодчилогдсон.
// Ажиллуулах:  node server.js &   →   k6 run slo-test.js

export const options = {
    vus: 20,
    duration: '1m',

    thresholds: {
        // --- SLO 1: Performance (/cart/add) ---
        // I/O хийдэггүй endpoint тул localhost дээр нэгж мс-д хариулдаг.
        // 200 мс байсан бол юу ч хэмжихгүй сул босго болох байсан.
        'http_req_duration{name:cart}': ['p(95)<50', 'p(99)<100'],
        'http_req_failed{name:cart}': ['rate<0.01'],

        // --- SLO 2: Reliability (/pay) ---
        // Серверт яг 5% алдаа суулгасан. 5% дээр босго тавьбал тест тал
        // тохиолдолд өөрөө унана; 8% нь дунджаас 4.8σ дээш тул аюулгүй.
        'http_req_failed{name:pay}': ['rate<0.08'],
        'http_req_duration{name:pay}': ['p(95)<200'],

        // --- SLO 3: Availability (бүх хүсэлт) ---
        // 2 минутын цонхонд 10 сек зогсолтыг тэсэх түвшин (Алхам 5-д шалгана).
        'checks': ['rate>0.90'],

        // --- SLO 4: Performance, удаан зам (/report) ---
        // Сервер 200-400 мс санамсаргүй хүлээдэг тул онолын p95 = 390 мс.
        // 450 мс нь дараалал үүсэхээс бусад тохиолдолд давагдана.
        'http_req_duration{name:report}': ['p(95)<450'],
    },
};

// Хүсэлтийн timeout. Үүнгүй бол сервер унах мөчид нислэгт байсан холболт
// хэзээ ч завсарлахгүй өлгөгдөж, 2 минутын тест 17 минут үргэлжилсэн (max=15m22s).
const T = '10s';

export default function () {
    const base = 'http://localhost:3000';

    const c = http.post(`${base}/cart/add`, null, { timeout: T, tags: { name: 'cart' } });
    const r = http.get(`${base}/report`, { timeout: T, tags: { name: 'report' } });
    const p = http.post(`${base}/pay`, null, { timeout: T, tags: { name: 'pay' } });

    check(c, { 'cart 200': (x) => x.status === 200 });
    check(r, { 'report 200': (x) => x.status === 200 });
    check(p, { 'pay 200': (x) => x.status === 200 });

    sleep(1);
}
