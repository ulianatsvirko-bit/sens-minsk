import express from 'express';
import helmet from 'helmet';
import multer from 'multer';
import Database from 'better-sqlite3';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseBusySlot, publicBusy } from './lib/busy-slots.js';
import contactHandler from './api/contact.js';
import { createRegisterHandler } from './api/register.js';

const root = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(root, 'data');
const uploadDir = path.join(root, 'uploads');
fs.mkdirSync(dataDir, { recursive: true });
fs.mkdirSync(uploadDir, { recursive: true });

const app = express();
const port = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === 'production';
const adminLogin = process.env.ADMIN_LOGIN;
const adminPassword = process.env.ADMIN_PASSWORD;
const sessionSecret = process.env.SESSION_SECRET;
if (!adminLogin || !adminPassword || !sessionSecret || sessionSecret.length < 32) {
  console.error('Set ADMIN_LOGIN, ADMIN_PASSWORD and SESSION_SECRET (32+ chars) before startup.');
  process.exit(1);
}

const db = new Database(path.join(dataDir, 'events.sqlite'));
db.pragma('journal_mode = WAL');
try { db.exec("ALTER TABLE events ADD COLUMN gallery_json TEXT NOT NULL DEFAULT '[]'"); } catch {}
db.exec(`CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, date TEXT NOT NULL,
  time TEXT NOT NULL, type TEXT NOT NULL, price TEXT NOT NULL DEFAULT '',
  places INTEGER NOT NULL DEFAULT 0, description TEXT NOT NULL DEFAULT '',
  form_url TEXT NOT NULL DEFAULT '', image_url TEXT NOT NULL DEFAULT '',
  published INTEGER NOT NULL DEFAULT 0, gallery_json TEXT NOT NULL DEFAULT '[]', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
)`);

if (!db.prepare('PRAGMA table_info(events)').all().some(column => column.name === 'times_json')) {
  db.exec("ALTER TABLE events ADD COLUMN times_json TEXT NOT NULL DEFAULT '[]'");
}
db.exec(`CREATE TABLE IF NOT EXISTS busy_slots (
  id INTEGER PRIMARY KEY AUTOINCREMENT, date TEXT NOT NULL, start TEXT NOT NULL DEFAULT '',
  end TEXT NOT NULL DEFAULT '', note TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
)`);
const minskToday = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Minsk', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
const sessions = new Map();
const loginAttempts = new Map();
const COOKIE = 'sens_session';
const SESSION_AGE = 12 * 60 * 60 * 1000;
const safeEqual = (a, b) => { const aa = Buffer.from(String(a)); const bb = Buffer.from(String(b)); return aa.length === bb.length && crypto.timingSafeEqual(aa, bb); };
const cookies = req => Object.fromEntries((req.headers.cookie || '').split(';').filter(Boolean).map(v => { const i=v.indexOf('='); return [v.slice(0,i).trim(), decodeURIComponent(v.slice(i+1))]; }));
const clean = (value, max=2000) => String(value ?? '').trim().replace(/[\u0000-\u001f\u007f]/g, '').slice(0,max);
const eventFromRow = row => ({ id:String(row.id), title:row.title, date:row.date, time:row.time, times:JSON.parse(row.times_json || '[]').length ? JSON.parse(row.times_json) : [{time:row.time,age:''}], type:row.type, price:row.price, places:row.places, description:row.description, form:row.form_url, image:row.image_url, gallery:JSON.parse(row.gallery_json || '[]'), published:Boolean(row.published) });

app.set('trust proxy', 1);
app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: false }));
app.use(express.json({ limit: '250kb' }));
app.use('/uploads', express.static(uploadDir, { maxAge: '7d', immutable: true }));

function requireAuth(req, res, next) {
  const token = cookies(req)[COOKIE]; const session = token && sessions.get(token);
  if (!session || session.expires < Date.now()) { if (token) sessions.delete(token); return res.status(401).json({ message:'Войдите в админ-панель.' }); }
  session.expires = Date.now() + SESSION_AGE; next();
}
function sameOrigin(req, res, next) {
  const origin=req.headers.origin; const host=req.headers['x-forwarded-host']||req.headers.host;
  const allowedProxyOrigin = origin && ['sens-minsk.vercel.app', 'sens-minsk-o0e1l62bu-ulianatsvirko-bits-projects.vercel.app'].includes(new URL(origin).host);
  if (origin && new URL(origin).host !== host && !allowedProxyOrigin) return res.status(403).json({message:'Запрос с другого сайта запрещён.'});
  next();
}

app.post('/api/auth/login', sameOrigin, (req,res) => {
  const ip=req.ip; const attempt=loginAttempts.get(ip)||{count:0,until:0};
  if (attempt.until>Date.now()) return res.status(429).json({message:'Слишком много попыток. Попробуйте через 15 минут.'});
  if (!safeEqual(req.body?.login, adminLogin) || !safeEqual(req.body?.password, adminPassword)) {
    attempt.count++; if(attempt.count>=5){attempt.until=Date.now()+15*60*1000;attempt.count=0} loginAttempts.set(ip,attempt);
    return res.status(401).json({message:'Неверный логин или пароль.'});
  }
  loginAttempts.delete(ip); const token=crypto.randomBytes(32).toString('base64url'); sessions.set(token,{expires:Date.now()+SESSION_AGE});
  res.setHeader('Set-Cookie',`${COOKIE}=${token}; HttpOnly; Path=/; SameSite=Strict; Max-Age=${SESSION_AGE/1000}${req.secure?'; Secure':''}`); res.json({ok:true});
});
app.get('/api/auth/session', requireAuth, (req,res)=>res.json({authenticated:true}));
app.post('/api/auth/logout', sameOrigin, requireAuth, (req,res)=>{sessions.delete(cookies(req)[COOKIE]);res.setHeader('Set-Cookie',`${COOKIE}=; HttpOnly; Path=/; SameSite=Strict; Max-Age=0${req.secure?'; Secure':''}`);res.json({ok:true})});

app.get('/api/events', (req,res)=>res.json(db.prepare('SELECT * FROM events WHERE published=1 ORDER BY date,time').all().map(eventFromRow)));
app.get('/api/events/:id', (req,res)=>{const event=db.prepare('SELECT * FROM events WHERE id=? AND published=1').get(req.params.id); event?res.json(eventFromRow(event)):res.status(404).json({message:'Событие не найдено.'});});
app.get('/api/admin/events', requireAuth, (req,res)=>res.json(db.prepare('SELECT * FROM events ORDER BY date DESC,time DESC').all().map(eventFromRow)));

const storage=multer.diskStorage({destination:uploadDir,filename:(req,file,cb)=>cb(null,`${Date.now()}-${crypto.randomBytes(6).toString('hex')}${path.extname(file.originalname).toLowerCase()}`)});
const upload=multer({storage,limits:{fileSize:8*1024*1024},fileFilter:(req,file,cb)=>cb(null,['image/jpeg','image/png','image/webp'].includes(file.mimetype))});
app.post('/api/admin/upload', sameOrigin, requireAuth, upload.array('images', 16), (req,res)=>req.files?.length?res.json({urls:req.files.map(file=>`/uploads/${file.filename}`)}):res.status(400).json({message:'Выберите JPG, PNG или WebP до 8 МБ.'}));

function parseEvent(body){const type=clean(body.type,30);
const inputTimes=body.times===undefined?[{time:body.time,age:''}]:body.times;
if(!Array.isArray(inputTimes)||!inputTimes.length||inputTimes.length>100)throw new Error('Добавьте от 1 до 100 вариантов времени.');
const times=inputTimes.map(slot=>{if(!slot||typeof slot.time!=='string'||!/^([01]\d|2[0-3]):[0-5]\d$/.test(slot.time))throw new Error('Укажите корректное время для каждого варианта.');const endTime=slot.endTime??'';if(typeof endTime!=='string'||(endTime&&!/^([01]\d|2[0-3]):[0-5]\d$/.test(endTime)))throw new Error('Укажите корректное время окончания.');if(endTime&&endTime<=slot.time)throw new Error('Время окончания должно быть позже времени начала.');return {time:slot.time,endTime,age:clean(slot.age,100)};}).sort((a,b)=>a.time.localeCompare(b.time));
const data={title:clean(body.title,160),date:clean(body.date,10),time:times[0].time,times,type:type||'practice',price:clean(body.price,80),places:Math.max(0,Number(body.places)||0),description:String(body.description||'').trim().slice(0,2000).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g,'' ),form:clean(body.form,500),image:clean(body.image,500),gallery:Array.isArray(body.gallery)?body.gallery.filter(item=>/^\/uploads\//.test(item)).slice(0,15):[],published:body.published?1:0};if(!data.image&&data.gallery.length)data.image=data.gallery[0];if(!data.title||!/^\d{4}-\d{2}-\d{2}$/.test(data.date)||!/^\d{2}:\d{2}$/.test(data.time))throw new Error('Заполните название, дату и время.');if(data.form&&!/^https:\/\//.test(data.form))throw new Error('Ссылка записи должна начинаться с https://');return data}
app.post('/api/admin/events', sameOrigin, requireAuth, (req,res)=>{try{const e=parseEvent(req.body);const out=db.prepare('INSERT INTO events(title,date,time,type,price,places,description,form_url,image_url,gallery_json,times_json,published) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)').run(e.title,e.date,e.time,e.type,e.price,e.places,e.description,e.form,e.image,JSON.stringify(e.gallery),JSON.stringify(e.times),e.published);res.status(201).json(eventFromRow(db.prepare('SELECT * FROM events WHERE id=?').get(out.lastInsertRowid)))}catch(e){res.status(400).json({message:e.message})}});
app.put('/api/admin/events/:id', sameOrigin, requireAuth, (req,res)=>{try{const e=parseEvent(req.body);const out=db.prepare('UPDATE events SET title=?,date=?,time=?,type=?,price=?,places=?,description=?,form_url=?,image_url=?,gallery_json=?,times_json=?,published=?,updated_at=CURRENT_TIMESTAMP WHERE id=?').run(e.title,e.date,e.time,e.type,e.price,e.places,e.description,e.form,e.image,JSON.stringify(e.gallery),JSON.stringify(e.times),e.published,req.params.id);if(!out.changes)return res.status(404).json({message:'Событие не найдено.'});res.json(eventFromRow(db.prepare('SELECT * FROM events WHERE id=?').get(req.params.id)))}catch(e){res.status(400).json({message:e.message})}});
// Site forms → Telegram. The same handlers run as Vercel functions; here registration reads events from the local database.
app.post('/api/contact', contactHandler);
app.post('/api/register', createRegisterHandler(async () => db.prepare('SELECT * FROM events WHERE published=1').all().map(eventFromRow)));
app.get('/api/busy', (req,res)=>{const today=minskToday();res.set('Cache-Control','public, max-age=60');res.json(publicBusy(db.prepare('SELECT date,start,end FROM busy_slots WHERE date>=? ORDER BY date,start').all(today), today))});
app.get('/api/admin/busy', requireAuth, (req,res)=>res.json(db.prepare('SELECT id,date,start,end,note FROM busy_slots WHERE date>=? ORDER BY date,start').all(minskToday()).map(row=>({...row,id:String(row.id)}))));
app.post('/api/admin/busy', sameOrigin, requireAuth, (req,res)=>{try{const slot=parseBusySlot(req.body);const out=db.prepare('INSERT INTO busy_slots(date,start,end,note) VALUES(?,?,?,?)').run(slot.date,slot.start,slot.end,slot.note);res.status(201).json({id:String(out.lastInsertRowid),...slot})}catch(e){res.status(400).json({message:e.message})}});
app.delete('/api/admin/busy/:id', sameOrigin, requireAuth, (req,res)=>{const out=db.prepare('DELETE FROM busy_slots WHERE id=?').run(req.params.id);res.status(out.changes?200:404).json(out.changes?{ok:true}:{message:'Запись не найдена.'})});
app.delete('/api/admin/events/:id', sameOrigin, requireAuth, (req,res)=>{const out=db.prepare('DELETE FROM events WHERE id=?').run(req.params.id);res.status(out.changes?200:404).json(out.changes?{ok:true}:{message:'Событие не найдено.'})});

app.get('/', (req,res) => res.sendFile(path.join(root, 'index.html')));
app.get('/index.html', (req,res) => res.sendFile(path.join(root, 'index.html')));
app.get(['/space', '/space.html'], (req,res) => res.sendFile(path.join(root, 'space.html')));
app.use(express.static(root, { extensions:['html'] }));
app.use((error,req,res,next)=>{console.error(error);res.status(error.code==='LIMIT_FILE_SIZE'?413:500).json({message:error.code==='LIMIT_FILE_SIZE'?'Файл больше 8 МБ.':'Ошибка сервера.'})});
app.listen(port,()=>console.log(`SENS started on http://127.0.0.1:${port}`));
