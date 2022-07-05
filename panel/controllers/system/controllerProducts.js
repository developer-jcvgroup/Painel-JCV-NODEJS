const database = require("../../database/database");
const moment = require("moment");
moment.tz.setDefault('America/Sao_Paulo');

function generateDate(){
    moment.locale('pt-br');
    return moment().format('LT')+" "+moment().format('L')
}

exports.viewProducts = async (req,res) => {

    //Pegando todos os produtos
    const getAllProdutcs = await database
    .select()
    .table("jcv_sys_products")
    .orderBy("jcv_sys_products_enabled", "DESC")
    .then( data => {return data})

    var page = "system/productsView";
    res.render("panel/index", {
        page: page,
        getAllProdutcs: getAllProdutcs
    })
}

exports.moduleSaveProduct = async (req,res) => {
    const productSKU = req.body['save-new-sku']
    const productName = req.body['save-new-name']
    const productType = req.body['save-new-type']
    const productBrand = req.body['save-new-brand']
    const productLine = req.body['save-new-line']
    const productImage = req.body['save-new-image']

    const productPropBLZ = req.body['save-new-op-prog-blz'] == 'on' ? 1:0
    const productPropTRADE = req.body['save-new-op-trade-mkt'] == 'on' ? 1:0

    //Validando se o produto já existe
    const getStatus = await database.select().where({jcv_sys_products_sku: productSKU}).table("jcv_sys_products").then( data => {return data})

    if(getStatus == ''){
        database
        .insert({
            jcv_sys_products_sku: productSKU,
            jcv_sys_products_name: productName,
            jcv_sys_products_type: productType,
            jcv_sys_products_brand: productBrand,
            jcv_sys_products_line: productLine,
            jcv_sys_products_img: productImage,
            jcv_sys_products_enabled: 1,
            jcv_sys_products_last_update:generateDate(),
            jcv_sys_products_prog_beleza: productPropBLZ,
            jcv_sys_products_trade_mkt: productPropTRADE
        })
        .table("jcv_sys_products")
        .then( data => {
            if( data > 0){
                res.cookie('SYSTEM-NOTIFICATIONS-MODULE', `{"typeMsg": "success","message":"<b>${productName}</b> cadastrado com sucesso!","timeMsg": 3000}`);
                res.redirect("/painel/system/products");
            }else{
                res.cookie('SYSTEM-NOTIFICATIONS-MODULE', `{"typeMsg": "error","message":"Erro ao cadastrar o produto","timeMsg": 3000}`);
                res.redirect("/painel/system/products");
            }
        })
    }else{
        res.cookie('SYSTEM-NOTIFICATIONS-MODULE', `{"typeMsg": "error","message":"SKU já cadastrado","timeMsg": 3000}`);
        res.redirect("/painel/system/products");
    }
    
}

exports.moduleEditSaveProduct = async (req,res) => {
    const productSKU = req.body['save-new-sku-edit']
    const productName = req.body['save-new-name-edit']
    const productType = req.body['save-new-type-edit']
    const productBrand = req.body['save-new-brand-edit']
    const productLine = req.body['save-new-line-edit']
    const productImage = req.body['save-new-image-edit']
    const productEnabled = req.body['save-new-enabled-edit']

    const productPropBLZ = req.body['save-new-op-prog-blz-edit'] == 'on' ? 1:0
    const productPropTRADE = req.body['save-new-op-trade-mkt-edit'] == 'on' ? 1:0

    const idProduct = req.body['button-save-edit']

    //Validando se o produto já existe
    database
    .update({
        jcv_sys_products_sku: productSKU,
        jcv_sys_products_name: productName,
        jcv_sys_products_type: productType,
        jcv_sys_products_brand: productBrand,
        jcv_sys_products_line: productLine,
        jcv_sys_products_img: productImage,
        jcv_sys_products_enabled: productEnabled,
        jcv_sys_products_last_update:generateDate(),
        jcv_sys_products_prog_beleza: productPropBLZ,
        jcv_sys_products_trade_mkt: productPropTRADE
    })
    .where({jcv_sys_products_id: idProduct})
    .table("jcv_sys_products")
    .then( data => {
        if( data > 0){
            res.cookie('SYSTEM-NOTIFICATIONS-MODULE', `{"typeMsg": "success","message":"<b>${productName}</b> editado com sucesso!","timeMsg": 3000}`);
            res.redirect("/painel/system/products");
        }else{
            res.cookie('SYSTEM-NOTIFICATIONS-MODULE', `{"typeMsg": "error","message":"Erro ao editar o produto","timeMsg": 3000}`);
            res.redirect("/painel/system/products");
        }
    })
    
}