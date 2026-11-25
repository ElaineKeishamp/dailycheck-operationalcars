const { types } = require('pg');

const DATABASE_TIME_ZONE = 'Asia/Jakarta';
const databaseTypes = {
  getTypeParser(oid, format) {
    if (format !== 'binary' && oid === 1082) {
      return value => value;
    }
    if (format !== 'binary' && oid === 1114) {
      // Existing timestamp columns contain WIB wall-clock values, without an offset.
      return value => new Date(`${value.replace(' ', 'T')}+07:00`);
    }
    return types.getTypeParser(oid, format);
  },
};

module.exports = { DATABASE_TIME_ZONE, databaseTypes };
