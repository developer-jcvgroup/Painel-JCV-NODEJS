const database = require("../../database/database");

exports.systemLogs = async (req,res) => {
    var page = "system/logs";
    res.render("panel/index", {page: page})
}