const database = require("../../database/database");

exports.pesquisasSystem = (req,res) => {
    var page = "pesquisas/pesquisaMain";
    res.render("panel/index", {page: page})
}