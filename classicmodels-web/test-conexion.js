const oracledb = require('oracledb');

async function probar() {
    let conn;
    try {
        conn = await oracledb.getConnection({
            user: 'GRUPO7',
            password: 'grupo7',
            connectString: 'localhost:1521/XEPDB1'
        });

        const r = await conn.execute(
            `SELECT USER, SYS_CONTEXT('USERENV','CON_NAME') FROM DUAL`
        );

        console.log('CONEXION OK ->', r.rows);
        console.log('Driver oracledb:', oracledb.versionString);
        console.log('Modo Thin:', oracledb.thin);

    } catch (e) {
        console.error('ERROR ->', e.message);
    } finally {
        if (conn) await conn.close();
    }
}

probar();