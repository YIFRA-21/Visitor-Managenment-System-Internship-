const db = require('../config/db');

async function cleanDeletedRecords() {
  try {
    const ts = Date.now();
    // 1. Rename employee_number on soft-deleted employees so they don't block new employees
    const empRes = await db.query(
      `UPDATE employees 
       SET employee_number = CONCAT('DEL_', id, '_', ?, '_', employee_number) 
       WHERE deleted_at IS NOT NULL AND employee_number NOT LIKE 'DEL_%'`,
      [ts]
    );
    console.log('Soft-deleted employees freed:', empRes.affectedRows || empRes[0]?.affectedRows || 0);

    // 2. Rename user_code on soft-deleted users so they don't block new users
    const usrRes = await db.query(
      `UPDATE users 
       SET user_code = CONCAT('DEL_', id, '_', ?, '_', user_code) 
       WHERE deleted_at IS NOT NULL AND user_code NOT LIKE 'DEL_%'`,
      [ts]
    );
    console.log('Soft-deleted users freed:', usrRes.affectedRows || usrRes[0]?.affectedRows || 0);

    // 3. Rename manager_number on manager_profiles for deleted users
    try {
      const mgrRes = await db.query(
        `UPDATE manager_profiles 
         SET manager_number = CONCAT('DEL_', id, '_', ?, '_', manager_number)
         WHERE user_id IN (SELECT id FROM users WHERE deleted_at IS NOT NULL) 
           AND manager_number NOT LIKE 'DEL_%'`,
        [ts]
      );
      console.log('Soft-deleted managers freed:', mgrRes.affectedRows || mgrRes[0]?.affectedRows || 0);
    } catch (e) {
      console.warn('Manager profiles update notice:', e.message);
    }

    const remaining = await db.query('SELECT id, employee_number, deleted_at FROM employees');
    console.log('Current employees table:', remaining);
  } catch (err) {
    console.error('Clean error:', err);
  } finally {
    process.exit(0);
  }
}

cleanDeletedRecords();
