import fs from 'fs';
import https from 'https';
import path from 'path';

const downloads = [
  { url: 'https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?w=800&q=80', dest: 'public/images/pizzas/buffalo-chicken.jpg' }, 
  { url: 'https://images.unsplash.com/photo-1605478371310-a9f1e9ddb9f0?w=800&q=80', dest: 'public/images/pizzas/detroit-style.jpg' },
  { url: 'https://images.unsplash.com/photo-1541745537411-b8046f4d86eb?w=800&q=80', dest: 'public/images/pizzas/thin-crust.jpg' },
  { url: 'https://images.unsplash.com/photo-1582281242378-005ad36fc197?w=800&q=80', dest: 'public/images/pizzas/pan-pizza.jpg' }
];

function download(url, dest) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return download(res.headers.location, dest).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error('Failed to get ' + url + ' ' + res.statusCode));
      }
      const file = fs.createWriteStream(dest);
      res.pipe(file);
      file.on('finish', () => {
        file.close();
         resolve();
      });
      file.on('error', (err) => {
        fs.unlink(dest, () => {});
        reject(err);
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

async function run() {
  for (const d of downloads) {
    try {
      await download(d.url, d.dest);
      console.log('Downloaded', d.dest);
    } catch(err) {
      console.error(err);
    }
  }
}
run();
