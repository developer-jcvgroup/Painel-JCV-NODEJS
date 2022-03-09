const database = require("../../database/database");
const moment = require("moment");
moment.tz.setDefault('America/Sao_Paulo');

function generateDate(){
    moment.locale('pt-br');
    return moment().format('LT')+" "+moment().format('L')
}

exports.mainNotifications = async (req,res) =>{
    var page = "notifications/mainNotify";
    res.render("panel/index", {page: page})
}