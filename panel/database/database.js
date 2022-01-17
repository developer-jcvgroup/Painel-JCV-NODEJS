const connection = require('knex')({
    client: 'mysql2',
    connection: {
    host : '45.82.72.240',
    user : 'jcv',
    password : '!@#246810Cp',
    database : 'jcvpanel'
    }
});

module.exports = connection;