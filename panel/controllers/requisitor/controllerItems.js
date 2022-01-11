const moment = require("moment");
const { type } = require("os");
moment.locale('pt-BR');

const database = require("../../database/database");

exports.adminListAllItems = async (req,res) =>{

    database.select("sys_req_itemId","sys_req_itemName","sys_req_itemEnabled").orderBy("sys_req_itemId","DESC").table("jcv_req_items").then( data => {
        
        var page = "requisitor/itemsRequisicao";
        res.render("panel/index", {page: page, arrayItems: data})
    })

}

exports.saveEditItem = async(req,res) => {

    const idItem = req.body['button-edit-id'];

    const inputNameItem = req.body['item-input-edit-name-'+idItem];
    const inputEnabledItem = req.body['item-input-edit-enabled-'+idItem] != undefined ? 1 : 0;

    database.update({sys_req_itemName: inputNameItem, sys_req_itemEnabled: inputEnabledItem}).where({sys_req_itemId: idItem}).table("jcv_req_items").then( data => {
        res.cookie('SYS-NOTIFICATION-EXE1', "SYS01| O item '"+inputNameItem+"' foi editado com sucesso!");
        res.redirect("/painel/requisitor/items");
    })
}

exports.saveNewItem = async (req,res) => {
    const nameItem = req.body['item-register-name-item'].toUpperCase();
    const enabledItem = req.body['item-register-enabled-item'] != undefined ? 1 : 0;

    database.insert({
        sys_req_itemName: nameItem,
        sys_req_itemEnabled: enabledItem
    })
    .table("jcv_req_items")
    .then( data => {
        if(data != ''){
            res.cookie('SYS-NOTIFICATION-EXE1', "SYS01| O item '"+nameItem+"' foi cadastrado com sucesso!");
            res.redirect("/painel/requisitor/items");
        }
    })
}

exports.deleteItem = async (req,res) => {
    const idItem = req.body['button-remove-id'];

    database.where({sys_req_itemId: idItem}).delete().table("jcv_req_items").then( data => {
        if(data == 1){
            res.cookie('SYS-NOTIFICATION-EXE1', "SYS01| O item foi excluído com sucesso!");
            res.redirect("/painel/requisitor/items");
        }
    })
}