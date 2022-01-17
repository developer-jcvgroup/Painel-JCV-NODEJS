const connection = require('knex')({
    client: 'mysql2',
    connection: {
    host : 'localhostAAAAAAAAAAA',
    user : 'jcv',
    password : '!@#246810Cp',
    database : 'jcvpanel'
    }
});

module.exports = connection;