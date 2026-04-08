const WORKER_URL = 'https://kapae-mail.kimhyunjin0730-sys.workers.dev';

async function getNotices() {
  const response = await fetch(`${WORKER_URL}/notices`); 
  const data = await response.json();
  console.log(data);
}
