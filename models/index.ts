import { Pool } from 'pg'
import poolConfig from '../database.json'

const pool = new Pool(poolConfig['dev'])

export default pool;