import pg from 'pg';

const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

export const messageColumns = `
  id,
  sender_name,
  grade,
  message,
  envelope_color,
  stamp_type,
  likes,
  created_at
`;
