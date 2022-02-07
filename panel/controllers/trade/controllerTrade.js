const database = require("../../database/database");

exports.controllerMain = async (req,res) =>{

    var page = "trade/mainTrade";
    res.render("panel/index", {page: page})
}

exports.visitForm = async (req,res) => {
    var page = "trade/visitaFormulario";
    res.render("panel/index", {page: page})
}