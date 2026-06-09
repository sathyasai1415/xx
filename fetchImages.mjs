import fs from 'fs';
import https from 'https';
import path from 'path';

const dirs = [
  'public/images/pizzas',
  'public/images/toppings',
  'public/images/stores'
];

dirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const downloads = [
  { url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&q=80', dest: 'public/images/pizzas/cheese.jpg' },
  { url: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=800&q=80', dest: 'public/images/pizzas/pepperoni.jpg' },
  { url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80', dest: 'public/images/pizzas/bbq-chicken.jpg' },
  { url: 'https://images.unsplash.com/photo-1511688878353-3a2f5be94cd7?w=800&q=80', dest: 'public/images/pizzas/veggie.jpg' },
  { url: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=800&q=80', dest: 'public/images/pizzas/meat-lovers.jpg' },
  { url: 'https://images.unsplash.com/photo-1579751626657-72bc17010498?w=800&q=80', dest: 'public/images/pizzas/hawaiian.jpg' },
];

function download(url, dest) {
  return new Promise((resolve, reject) => {
    debugger;
    https.get(url, (res) => {
      // Handle redirects
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return download(res.headers.location, dest).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`Failed to get '${url}' (${res.statusCode})`));
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
