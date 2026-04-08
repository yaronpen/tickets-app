import sql from 'mssql';

const config = {
  server:   process.env.DB_HOST,
  port:     parseInt(process.env.DB_PORT || '1433'),
  database: process.env.DB_DATABASE,
  user:     process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  options: {
    encrypt:                false,
    trustServerCertificate: true,
  },
  pool: {
    max:               10,
    min:               0,
    idleTimeoutMillis: 30000,
  },
};

const pool = new sql.ConnectionPool(config);
const poolConnect = pool.connect();

poolConnect.catch(err => {
  console.error('DB connection failed:', err.message);
});

export { pool, poolConnect, sql };
