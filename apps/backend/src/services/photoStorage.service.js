const STORAGE_UNAVAILABLE_CODE = 'PHOTO_STORAGE_UNAVAILABLE';

function createStorageUnavailableError() {
  const error = new Error('Penyimpanan foto belum dikonfigurasi');
  error.code = STORAGE_UNAVAILABLE_CODE;
  return error;
}

async function storeCheckPhoto() {
  throw createStorageUnavailableError();
}

async function deleteStoredCheckPhoto() {
  return undefined;
}

module.exports = {
  STORAGE_UNAVAILABLE_CODE,
  storeCheckPhoto,
  deleteStoredCheckPhoto,
};
