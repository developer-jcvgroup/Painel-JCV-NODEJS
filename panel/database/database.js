const connection = require('knex')({
    client: 'mysql2',
    connection: {
    host : 'localhost',
    user : 'root',
    password : '!@#246810cp',
    database : 'jcvpanel'
    }
});

module.exports = connection;