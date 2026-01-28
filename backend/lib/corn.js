import { CronJob } from 'cron';
import https from 'https';

const job = new CronJob("*/14 * * * *", async function () {
    https.get(process.env.API_URL, (res) => {
        if (res.statusCode === 200) {
            console.log('✅ API is up and running');
        } else {
            console.log('❌ API is down, status code:', res.statusCode);
        }
    }).on('error', (e) => {
        console.error('Error making request:', e.message);
    });
});

job.start(); // make sure to start it

export default job;
