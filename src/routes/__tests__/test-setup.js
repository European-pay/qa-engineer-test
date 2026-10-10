import { resetDatabase, initDatabase } from '../../db/database.js';


// to prevent duplicates in db, deletes old data from db then initialialize db
export function setupTestDatabase() {
  resetDatabase();
  initDatabase();
}