import {
  CreateBucketCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import fs from 'fs'
import path from 'path'

/**
 * Готує сховище S3 і переносить у нього те, що вже лежить локально в /media.
 * Записи в базі зберігають лише імена файлів, тому після перенесення з тими
 * самими ключами нічого перезаписувати не треба — сайт просто починає
 * віддавати ті самі файли зі сховища.
 *
 * Локально це MinIO, на проді — AWS S3 або Cloudflare R2 з тими самими змінними.
 *
 * Запуск: npm run storage:sync
 */
const {
  S3_BUCKET,
  S3_REGION = 'us-east-1',
  S3_ACCESS_KEY_ID,
  S3_SECRET_ACCESS_KEY,
  S3_ENDPOINT,
} = process.env

if (!S3_BUCKET || !S3_ACCESS_KEY_ID || !S3_SECRET_ACCESS_KEY) {
  console.error('Немає налаштувань S3 у .env — нічого робити.')
  process.exit(1)
}

const client = new S3Client({
  region: S3_REGION,
  credentials: { accessKeyId: S3_ACCESS_KEY_ID, secretAccessKey: S3_SECRET_ACCESS_KEY },
  ...(S3_ENDPOINT ? { endpoint: S3_ENDPOINT, forcePathStyle: true } : {}),
})

try {
  await client.send(new HeadBucketCommand({ Bucket: S3_BUCKET }))
  console.log(`Бакет ${S3_BUCKET} уже є.`)
} catch {
  await client.send(new CreateBucketCommand({ Bucket: S3_BUCKET }))
  console.log(`Бакет ${S3_BUCKET} створено.`)
}

const MIME: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.mp4': 'video/mp4',
}

const localDir = path.resolve(process.cwd(), 'media')

if (!fs.existsSync(localDir)) {
  console.log('Локальної теки media немає — переносити нічого.')
  process.exit(0)
}

const files = fs.readdirSync(localDir).filter((name) => !name.startsWith('.'))
let uploaded = 0

for (const name of files) {
  const filePath = path.join(localDir, name)
  if (!fs.statSync(filePath).isFile()) continue

  await client.send(
    new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: name,
      Body: fs.readFileSync(filePath),
      ContentType: MIME[path.extname(name).toLowerCase()] ?? 'application/octet-stream',
    }),
  )
  uploaded += 1
}

console.log(`Перенесено файлів: ${uploaded}`)
process.exit(0)
