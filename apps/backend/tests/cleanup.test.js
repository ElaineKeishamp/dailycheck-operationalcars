const {test}=require('node:test');const assert=require('node:assert/strict');
Object.assign(process.env,{S3_ENDPOINT:'http://127.0.0.1:1',S3_REGION:'test',S3_ACCESS_KEY:'test',S3_SECRET_KEY:'test',S3_BUCKET_NAME:'test'});
const pool=require('../src/config/db');const storage=require('../src/services/storage.service');const {run30DayCleanup}=require('../src/services/cleanup.service');
for(const failure of ['original','thumbnail',null])test('cleanup preserves failed objects and reports: '+failure,async()=>{
 const oldQuery=pool.query,oldDelete=storage.deleteObject;const queries=[],deleted=[];
 pool.query=async(sql,args)=>{queries.push({sql,args});if(sql.includes('SELECT cp.check_photos_id'))return{rows:[{check_photos_id:'photo-1',r2_key:'original',thumbnail_key:'thumbnail'}]};return{rowCount:1};};
 storage.deleteObject=async key=>{deleted.push(key);if(key===failure)throw Error('storage unavailable');};
 try{const result=await run30DayCleanup();const photoDeletes=queries.filter(q=>q.sql.includes('DELETE FROM check_photos'));assert.equal(photoDeletes.length,failure?0:1);assert.equal(result.failedPhotosCount,failure?1:0);assert.deepEqual(deleted,['original','thumbnail']);assert.match(queries.at(-1).sql,/NOT EXISTS/);if(!failure)assert.deepEqual(photoDeletes[0].args,[['photo-1']]);}finally{pool.query=oldQuery;storage.deleteObject=oldDelete;}
});
test('cleanup rejects invalid retention without querying the database',async()=>{for(const n of [0,-1,1.5,'30',NaN])await assert.rejects(run30DayCleanup(n),RangeError);});

test('cleanup keeps database references after storage failure and removes them on retry', {skip:!process.env.TEST_DATABASE_URL}, async()=>{
 const {Client}=require('pg');const url=new URL(process.env.TEST_DATABASE_URL);assert.equal(url.pathname,'/dailycheck_session_test');
 const client=new Client({connectionString:url.toString()});await client.connect();const oldQuery=pool.query,oldDelete=storage.deleteObject;
 try{
  await client.query('CREATE TEMP TABLE daily_checks (daily_id uuid PRIMARY KEY,check_date date)');
  await client.query('CREATE TEMP TABLE check_photos (check_photos_id uuid PRIMARY KEY,daily_id uuid REFERENCES daily_checks(daily_id) ON DELETE CASCADE,r2_key text,thumbnail_key text,created_at timestamp)');
  await client.query("INSERT INTO daily_checks VALUES ('00000000-0000-4000-8000-000000000001',CURRENT_DATE-40)");
  await client.query("INSERT INTO check_photos VALUES ('00000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000001','original','thumbnail',NOW()-INTERVAL '40 days')");
  pool.query=(...args)=>client.query(...args);storage.deleteObject=async()=>{throw Error('storage unavailable');};
  await run30DayCleanup();assert.equal((await client.query('SELECT count(*) FROM check_photos')).rows[0].count,'1');assert.equal((await client.query('SELECT count(*) FROM daily_checks')).rows[0].count,'1');
  storage.deleteObject=async()=>{};await run30DayCleanup();assert.equal((await client.query('SELECT count(*) FROM check_photos')).rows[0].count,'0');assert.equal((await client.query('SELECT count(*) FROM daily_checks')).rows[0].count,'0');
 }finally{pool.query=oldQuery;storage.deleteObject=oldDelete;await client.end();}
});
