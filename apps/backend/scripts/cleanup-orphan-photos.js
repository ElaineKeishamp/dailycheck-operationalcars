const pool = require('../src/config/db');
const storageService = require('../src/services/storage.service');
const dailyCheckModel = require('../src/models/dailyCheck.model');

const DEFAULT_OLDER_THAN_HOURS = 24;

function parseArgs(argv) {
  const args = {
    apply: false,
    olderThanHours: DEFAULT_OLDER_THAN_HOURS,
  };

  argv.forEach((arg) => {
    if (arg === '--apply') {
      args.apply = true;
      return;
    }

    if (arg.startsWith('--older-than-hours=')) {
      const value = Number(arg.split('=')[1]);
      if (!Number.isFinite(value) || value <= 0) {
        throw new Error('--older-than-hours must be a positive number');
      }
      args.olderThanHours = value;
    }
  });

  return args;
}

function sanitizeKey(key) {
  const parts = key.split('/');
  const fileName = parts[parts.length - 1] || '';
  return `${parts.slice(0, 3).join('/')}/.../${fileName.slice(0, 24)}`;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const olderThanDate = new Date(Date.now() - args.olderThanHours * 60 * 60 * 1000);

  console.log('=== DailyCheck Orphan Photo Cleanup ===');
  console.log(`Mode: ${args.apply ? 'apply' : 'dry-run'}`);
  console.log(`Namespace: inspections/`);
  console.log(`Older than hours: ${args.olderThanHours}`);

  const [objects, confirmedKeys] = await Promise.all([
    storageService.listInspectionObjects({ olderThanDate }),
    dailyCheckModel.getConfirmedPhotoKeys(),
  ]);

  const confirmedKeySet = new Set(confirmedKeys);
  const orphanObjects = objects.filter((object) => (
    storageService.isSafeObjectKey(object.key) && !confirmedKeySet.has(object.key)
  ));

  console.log(`Objects scanned: ${objects.length}`);
  console.log(`Confirmed DB keys: ${confirmedKeySet.size}`);
  console.log(`Orphan candidates: ${orphanObjects.length}`);

  for (const object of orphanObjects) {
    console.log(`- ${sanitizeKey(object.key)} | lastModified=${object.lastModified?.toISOString?.() || 'unknown'} | size=${object.size ?? 'unknown'}`);
    if (args.apply) {
      await storageService.deleteObject(object.key);
    }
  }

  console.log(args.apply ? 'Cleanup apply completed.' : 'Dry-run completed. Re-run with --apply to delete candidates.');
}

main()
  .catch((error) => {
    console.error('Cleanup failed:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end().catch(() => undefined);
  });
