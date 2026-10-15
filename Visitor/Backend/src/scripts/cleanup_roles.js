const db = require('../config/db');

async function cleanupDuplicateRoles() {
  try {
    console.log('Cleaning up duplicate / cloned test roles from MySQL...');

    const rolesToDelete = await db.query(
      `SELECT id, role_name FROM roles WHERE role_name LIKE 'Cloned%' OR role_name LIKE 'Security Operations Manager 1786%'`
    );

    console.log('Roles to delete:', rolesToDelete.map(r => r.role_name));

    if (rolesToDelete.length > 0) {
      const deleteIds = rolesToDelete.map(r => r.id);
      const placeholders = deleteIds.map(() => '?').join(',');

      await db.query(`DELETE FROM role_permissions WHERE role_id IN (${placeholders})`, deleteIds);
      await db.query(`DELETE FROM user_roles WHERE role_id IN (${placeholders})`, deleteIds);
      await db.query(`DELETE FROM role_hierarchy WHERE parent_role_id IN (${placeholders}) OR child_role_id IN (${placeholders})`, [...deleteIds, ...deleteIds]);
      await db.query(`DELETE FROM roles WHERE id IN (${placeholders})`, deleteIds);

      console.log('✓ Successfully deleted duplicate test roles!');
    }

    const remainingRoles = await db.query('SELECT id, role_name, role_code FROM roles ORDER BY id ASC');
    console.log('✓ Remaining Clean Unique Enterprise Roles:', remainingRoles);
  } catch (e) {
    console.error('Error during role cleanup:', e);
  }
  process.exit(0);
}

cleanupDuplicateRoles();
