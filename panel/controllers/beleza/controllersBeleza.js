const database = require("../../database/database");
const getPermissions = require("../../middlewarePermissions");
const fs = require('fs');

const moment = require("moment");
moment.locale('pt-BR');

//URL arquivos para download
const URLdownloads = 'public/panel/downloads/beleza/';

//Mes de referencia
function getMonthReferece(){
    return moment().add(1, 'M').format('MM-YYYY')
}

//Data atual
function generateDate(){
    return moment().format('LT')+" "+moment().format('L')
}

//Beleza: Listando os itens necessários
exports.sysBLZrequest = async (req, res) =>{

    //Validando se o pedido foi criado
    await database.select("sys_blz_requestStatus").where({sys_blz_requestReference: getMonthReferece(), sys_blz_userId: GLOBAL_DASH[0]}).table("jcv_blz_orders").orderBy("sys_blz_id","DESC").then(data => {
        
        //Valida o status
        if(data != ""){
            let ordersStatus = 0;
            //Caso o pedido esteja cancelado ou separado ele vai para a pagina de solicitação
            if(data[0].sys_blz_requestStatus == 3 || data[0].sys_blz_requestStatus == 4){
                ordersStatus++;
            }

            if(ordersStatus == 0){
                //O ultimo pedido tem status 3 ou 4
                listProducts();
            }else{
                //Solicitação já criada, va para a pagina de status
                res.redirect("/painel/beleza/status");
            }

        }else{
            //Nenhuma solicitação encontrada
            listProducts();
        }
    })

    //Pegando os produtos, colocando-os em arrays e mandando para o front-end
    function listProducts (){
        let arrayProductOne = [];
        let arrayProductTwo = [];

        //Pegando os produtos
        database.select().where({sys_blz_productEnabled: 1}).table("jcv_blz_products").then(result => {
            result.forEach(element => {
                if(element["sys_blz_productType"] === 1){
                    arrayProductOne.push(element["sys_blz_productName"]);
                }else{
                    arrayProductTwo.push(element["sys_blz_productName"]);
                }
            });

            var page = "beleza/solicitar";
            res.render("panel/index", {page: page, arrayProductOne: arrayProductOne, arrayProductTwo: arrayProductTwo, monthReference: getMonthReferece()})
        })
    }
}

exports.finalizarSolicitacao = async (req,res) => {

    //Pegando os dois produtos do form
    let productOne = req.body.inputProductOne;
    let productTwo = req.body.inputProductTwo;

    //Validando os produtos
    await database.select().where({sys_blz_productEnabled: 1}).whereIn('sys_blz_productName', [productOne,productTwo]).table("jcv_blz_products").orderBy("sys_blz_productType").then(data => {
        //Com o orderBy ele lista primeiro o shampoo depois o tratamento

        //Verificando se existe algo e se o retorno da consulta foi exatamente 2 produtos
        if(data != "" && Object.keys(data).length === 2){
            const insertProductOne = data[0]["sys_blz_productSKU"]+" - "+data[0]["sys_blz_productName"];
            const insertProductTwo = data[1]["sys_blz_productSKU"]+" - "+data[1]["sys_blz_productName"];
            
            //Registrando o pedido
            database.insert({
                sys_blz_userId: GLOBAL_DASH[0],
                sys_blz_userName: GLOBAL_DASH[1],
                sys_blz_userUnity: GLOBAL_DASH[2],
                sys_blz_userManager: GLOBAL_DASH[4],
                sys_blz_tratmentOne: insertProductOne,
                sys_blz_tratmentTwo: insertProductTwo,
                sys_blz_requestReference: getMonthReferece(),//Mes atual
                sys_blz_requestCreate: generateDate(),//Data Atual
                sys_blz_requestStatus: 2
            }).table("jcv_blz_orders").then(data => {
                //Registro confirmado
                //Redirecionando para a pagina status
                res.cookie('SYS-NOTIFICATION-EXE1', "SYS01|Benefício referente ao mês ("+getMonthReferece()+") registrado!");
                res.redirect("/painel/beleza/status");
            }).catch(err => {
                //Erro ao registrar
                res.cookie('SYS-NOTIFICATION-EXE1', "SYS02|Erro ao registrar sua solcitação, erro interno");
                res.redirect("/painel/beleza/solicitar");
            })
        }else{
            //Erro ao validar os produtos
            res.cookie('SYS-NOTIFICATION-EXE1', "SYS03| Um dos produtos inserido é inválido, revise-o");
            res.redirect("/painel/beleza/solicitar");
        }
    }).catch(err => {
        //Erro ao validar os produtos
        res.cookie('SYS-NOTIFICATION-EXE1', "SYS03| Os produtos inserido são inválidos, revise-os");
        res.redirect("/painel/beleza/solicitar");
    })
}

exports.listOrder = async (req,res,next) => {

    //Pegando as informações da solcitação, so pede ser exibido pedidos do status 2,4,5
    const requestUser = await database
    .select("sys_blz_id","sys_blz_tratmentOne","sys_blz_tratmentTwo","sys_blz_requestStatus")
    .where({sys_blz_requestReference: getMonthReferece(), sys_blz_userId: GLOBAL_DASH[0]})
    .whereIn('sys_blz_requestStatus', [2,4,5])
    .table("jcv_blz_orders").then(data => {
        return data;
    })

    if(requestUser != "" ){

        //Verificando se o pedido esta com a solicitação de cancelamento e se é deste mes
        if(requestUser[0]["sys_blz_requestStatus"] == 5){
            res.cookie('SYS-NOTIFICATION-EXE1', "SYS02|Seu pedido foi recebido pelo administrador. Aguarde até que sua solicitação seja cancelada.");
            var statusCancel = true;
        }else{
            var statusCancel = false;
        }

        var page = "beleza/status";
        res.render("panel/index", {
            page: page,
            requestUser: requestUser,
            productOne: requestUser[0]["sys_blz_tratmentOne"].split('-')[1], 
            productTwo: requestUser[0]["sys_blz_tratmentTwo"].split('-')[1], 
            idRequest: requestUser[0]["sys_blz_id"], 
            mesReferencia: getMonthReferece(), 
            statusCancel: statusCancel})
    }else{
        res.redirect("/painel/beleza/solicitar");
    }
}

exports.cancelOrder = async (req,res) => {
    let idOrder = req.body.buttonIDorder;
    
    database.update({sys_blz_requestStatus: 5}).where({sys_blz_id: idOrder}).table("jcv_blz_orders").then(data => {
        res.cookie('SYS-NOTIFICATION-EXE1', "SYS01|Seu pedido foi recebido pelo administrador. Aguarde até que sua solicitação seja cancelada.");
        res.redirect("/painel/beleza/status");
    })
}

exports.listRequests = async (req,res) => {

    //Ano atual
    const yearNow = moment().format('YYYY');

    //Listando as unidades
    const unidades = await database.select("sys_unity_id","sys_unity_name").where({sys_unity_enabled: 1}).table("jcv_unitys").then(data =>{
        return data;
    })

    //Listando os admins so programa da beleza
    const blzGestor = await database
        .select('jcv_users.jcv_id','jcv_users.jcv_userNamePrimary')
        .table("jcv_users")
        .join('jcv_users_permissions', 'jcv_users.jcv_id', '=', 'jcv_users_permissions.sys_perm_idUser')
        .where({jcv_userEnabled: 1, sys_blz_perm_manager: 1})
        .then(data => {
            return data;
    })

    //Renderizando tudo
    var page = "beleza/listRequests";
    res.render("panel/index", {page: page, monthReference: getMonthReferece(), unidades: unidades, blzGestor: blzGestor, yearNow: yearNow, resultSearchData: req.flash('resultSearchData')})
}

exports.searchRequests = async (req,res) => {
    let referenceDate = req.body.blzReferenceMonth;
    let blzStatus = req.body['sys-filter-input-selects-Status'] != undefined ? 'in ('+req.body['sys-filter-input-selects-Status']+')' : "LIKE '%%'";

    let listUnitys = req.body['sys-filter-input-selects-Unidade'] != undefined ? 'in ('+req.body['sys-filter-input-selects-Unidade']+')' : "LIKE '%%'";
    let listGestores = req.body['sys-filter-input-selects-Gestor'] != undefined ? 'in ('+req.body['sys-filter-input-selects-Gestor']+')' : "LIKE '%%'";

    database
    .select('jcv_blz_orders.sys_blz_id','jcv_blz_orders.sys_blz_userName','jcv_unitys.sys_unity_name',
    'jcv_users.jcv_userNameSecundary', 'jcv_blz_orders.sys_blz_tratmentOne','jcv_blz_orders.sys_blz_tratmentTwo',
    'jcv_blz_orders.sys_blz_requestStatus','jcv_blz_orders.sys_blz_requestReference','jcv_blz_orders.sys_blz_requestCreate')
    .table("jcv_blz_orders")
    .join('jcv_unitys', 'jcv_blz_orders.sys_blz_userUnity', '=', 'jcv_unitys.sys_unity_id')
    .join('jcv_users', 'jcv_blz_orders.sys_blz_userManager', '=', 'jcv_users.jcv_id')
    .whereRaw("jcv_blz_orders.sys_blz_requestReference LIKE '%"+referenceDate+"%' AND jcv_blz_orders.sys_blz_requestStatus "+blzStatus+" AND jcv_blz_orders.sys_blz_userManager "+listGestores+" AND jcv_unitys.sys_unity_id "+listUnitys+" ORDER BY jcv_blz_orders.sys_blz_id DESC")
    .then(data => {
        
        if(data != ""){
            req.flash('resultSearchData', data)
            res.redirect("/painel/beleza/solicitacoes");
        }else{
            res.cookie('SYS-NOTIFICATION-EXE1', "SYS02|Nenhum dado encontrado para sua busca");
            res.redirect("/painel/beleza/solicitacoes");
        }
    })
}

exports.listProducts = async (req,res) => {
    database.select().table("jcv_blz_products").orderBy("sys_blz_productName").then(data => {
        var page = "beleza/produtos";
        res.render("panel/index", {page: page, productsData: data})
    })
}

exports.registerProduct = async (req,res) => {
    if(req.body.productSKU != ""){
        const productSKU = req.body.productSKU.toUpperCase();
        const productBrand = req.body.productBrand;
        const productName = req.body.productName;
        const productType = req.body.productType;
        let productEnabled;
    
        if(req.body.productEnabled == undefined){
            productEnabled = 0;
        }else{
            productEnabled = 1
        }
        
        database.insert({
            sys_blz_productSKU: productSKU,
            sys_blz_productName: productName,
            sys_blz_productEnabled: productEnabled,
            sys_blz_productType: productType,
            sys_blz_productBrand: productBrand
        }).table("jcv_blz_products").then(data => {
            if(data != ""){
                res.cookie('SYS-NOTIFICATION-EXE1', "SYS01| O produto '"+productName+"' foi cadastrado com sucesso!");
                res.redirect("/painel/beleza/produtos");
            }else{
                res.cookie('SYS-NOTIFICATION-EXE1', "SYS02| Erro interno ao inserir o produto");
                res.redirect("/painel/beleza/produtos");
            }
        })
    }else{
        res.cookie('SYS-NOTIFICATION-EXE1', "SYS03| SKU inválido!");
        res.redirect("/painel/beleza/produtos");
    }
}

exports.actionProductSave = async (req,res) => {

    const idProd = req.body.btnEditProduct;
        
    const editproductSKU = req.body['editProductSKU'+idProd];
    const editproductBrand = req.body['editProductBrand'+idProd];
    const editproductName = req.body['editProductName'+idProd];
    const editproductType = req.body['editProductType'+idProd];
    let editproductEnabled;

    if(req.body['editProductEnabled'+idProd] == undefined){
        editproductEnabled = 0;
    }else{
        editproductEnabled = 1
    }

    database.update({
        sys_blz_productSKU: editproductSKU,
        sys_blz_productName: editproductName,
        sys_blz_productEnabled: editproductEnabled,
        sys_blz_productType: editproductType,
        sys_blz_productBrand: editproductBrand,
        sys_blz_productUpdate: generateDate()
    })
    .where({sys_blz_product_id: idProd})
    .table("jcv_blz_products").then(data => {
        if(data != ""){
            res.cookie('SYS-NOTIFICATION-EXE1', "SYS01| O produto '"+editproductName+"' foi salvo com sucesso!");
            res.redirect("/painel/beleza/produtos");
        }else{
            res.cookie('SYS-NOTIFICATION-EXE1', "SYS02| Erro interno ao inserir o produto");
            res.redirect("/painel/beleza/produtos");
        }
    })
}

exports.actionProductDelete = async (req,res) => {
    const id = req.body.btnDeleteProduct;

    database.where({sys_blz_product_id: id}).delete().table("jcv_blz_products").then( data => {
        if(data = 1){
            res.cookie('SYS-NOTIFICATION-EXE1', "SYS01| Produto deletado com sucesso!");
            res.redirect("/painel/beleza/produtos");
        }else{
            res.cookie('SYS-NOTIFICATION-EXE1', "SYS03| Erro interno ao deletar o produto.");
            res.redirect("/painel/beleza/produtos");
        }
    })
}

exports.statusProducts = async (req,res) => {
    const ids = req.body.productsIds;
    const action = req.body.actionProducts;

    if(action == "CMD01"){

        let updateSucess = 0;
        let updateError = 0;

        for (let i = 0; i < ids.length; i++) {
            let result = await database.update({sys_blz_productEnabled: 1}).where({sys_blz_product_id: ids[i]}).table("jcv_blz_products").then(data => {
                return data;
            })

            if(result == 1){
                updateSucess++;
            }else{
                updateError++;
            }
            
        }

        res.cookie('SYS-NOTIFICATION-EXE1', "SYS02| Total de: "+updateSucess+" foram alterados. Total de: "+updateError+" não teve o status alterado.");
        res.redirect("/painel/beleza/produtos");
    }else if(action == "CMD02"){
        {

            let updateSucess = 0;
            let updateError = 0;
    
            for (let i = 0; i < ids.length; i++) {
                let result = await database.update({sys_blz_productEnabled: 2}).where({sys_blz_product_id: ids[i]}).table("jcv_blz_products").then(data => {
                    return data;
                })
    
                if(result == 1){
                    updateSucess++;
                }else{
                    updateError++;
                }
                
            }
    
            res.cookie('SYS-NOTIFICATION-EXE1', "SYS02| Total de: "+updateSucess+" foram alterados. Total de: "+updateError+" não teve o status alterado.");
            res.redirect("/painel/beleza/produtos");
        }
    }else if(action == "CMD03"){

        const xl = require('excel4node');
        const wb = new xl.Workbook();
        const ws = wb.addWorksheet('Worksheet Name');

        database
        .select("sys_blz_productSKU","sys_blz_productName", "sys_blz_productEnabled", "sys_blz_productBrand")
        .table("jcv_blz_products")
        .whereRaw("jcv_blz_products.sys_blz_product_id IN ("+ids+")")
        .then(data => {
                
            const headingColumnNames = [
                "ID",
                "Produto",
                "Status",
                "Marca"
            ]
            
            let headingColumnIndex = 1; //diz que começará na primeira linha
            headingColumnNames.forEach(heading => { //passa por todos itens do array
                // cria uma célula do tipo string para cada título
                ws.cell(1, headingColumnIndex++).string(heading);
            });
            
            let rowIndex = 2;
            data.forEach( record => {
                let columnIndex = 1;
                Object.keys(record).forEach(columnName =>{

                    //Verificando se o dado é numero
                    if(typeof(record[columnName]) === 'number'){

                        
                        //Classificando o status do pedido
                        if(record.sys_blz_productEnabled == 1){
                            record.sys_blz_productEnabled = "Ativo"
                        }else if(record.sys_blz_productEnabled == 0){
                            record.sys_blz_productEnabled = "Desativado"
                        }

                        ws.cell(rowIndex,columnIndex++)
                        .string(record [columnName])
                    }else{
                        ws.cell(rowIndex,columnIndex++)
                        .string(record [columnName])
                    }
                });
                rowIndex++;
            }); 

            const caracteresAleatorios = Math.random().toString(36).substring(5);
            const nameData = 'EXPORT-ORDER-'+caracteresAleatorios;

            wb.write(nameData+'.xlsx', res)
        })
    }
}

exports.actionsCommandsOrder = async (req,res) => {
    const commandSet = req.body.requestOrderCommands;
    const arrayPedidos = req.body.requestOrderId;

    if(arrayPedidos == undefined){
        res.cookie('SYS-NOTIFICATION-EXE1', "SYS02| Selecione algum pedido!");
        res.redirect("/painel/beleza/solicitacoes");
    }

    //Verificando os commandos
    if(commandSet == ""){

    }else if(commandSet == "CMD02"){
        //status
        alterarStatus(arrayPedidos,"CMD02",req,res)
    }else if(commandSet == "CMD03"){
        //status
        alterarStatus(arrayPedidos,"CMD03",req,res)
    }else if(commandSet == "CMD04"){
        exportOrders(arrayPedidos,req,res);
    }else if(commandSet == "CMD05"){
        exportProductsOrders(arrayPedidos,req,res)
    }else if(commandSet == "CMD06"){
        createTagsOrders(arrayPedidos,req,res)
    }else if(commandSet == "CMD07"){
        exportsUnitysExcel(arrayPedidos,req,res)
    }else if(commandSet == "CMD08"){
        exportProductsUnity(arrayPedidos,req,res)
    }else{
        //Opção não encontrado
    }
}

exports.actionsCommandsUnityDownload = async (req,res) => {
    const xl = require('excel4node');
    const wb = new xl.Workbook();
    const ws = wb.addWorksheet('Worksheet Name');

    const id = req.body.btnDownloadOrder;
    
    database
        .select('jcv_blz_orders.sys_blz_id','jcv_blz_orders.sys_blz_userName','jcv_unitys.sys_unity_name',
        'jcv_users.jcv_userNamePrimary', 'jcv_blz_orders.sys_blz_tratmentOne','jcv_blz_orders.sys_blz_tratmentTwo',
        'jcv_blz_orders.sys_blz_requestStatus','jcv_blz_orders.sys_blz_requestReference','jcv_blz_orders.sys_blz_requestCreate')
        .table("jcv_blz_orders")
        .join('jcv_unitys', 'jcv_blz_orders.sys_blz_userUnity', '=', 'jcv_unitys.sys_unity_id')
        .join('jcv_users', 'jcv_blz_orders.sys_blz_userManager', '=', 'jcv_users.jcv_id')
        .whereRaw("jcv_blz_orders.sys_blz_id = "+id)
        .then(data => {
                
            const headingColumnNames = [
                "ID",
                "Funcionário",
                "Unidade",
                "Gestor",
                "Shampoo",
                "Tratamento",
                "Status",
                "Mês de ref.",
                "Gerado em"
            ]
            
            let headingColumnIndex = 1; //diz que começará na primeira linha
            headingColumnNames.forEach(heading => { //passa por todos itens do array
                // cria uma célula do tipo string para cada título
                ws.cell(1, headingColumnIndex++).string(heading);
            });
            
            let rowIndex = 2;
            data.forEach( record => {
                let columnIndex = 1;
                Object.keys(record).forEach(columnName =>{

                    //Verificando se o dado é numero
                    if(typeof(record[columnName]) === 'number'){

                        //Convertendo o id do pedido para string
                        record.blz_id = "#"+record.blz_id;
                        //Classificando o status do pedido
                        if(record.blz_orderStatus == 1){
                            record.blz_orderStatus = "Pendente"
                        }else if(record.blz_orderStatus == 2){
                            record.blz_orderStatus = "Solicitado"
                        }else if(record.blz_orderStatus == 3){
                            record.blz_orderStatus = "Cancelado"
                        }else if(record.blz_orderStatus == 4){
                            record.blz_orderStatus = "Separado"
                        }else if(record.blz_orderStatus == 5){
                            record.blz_orderStatus = "Pedido de Cancelamento"
                        }

                        ws.cell(rowIndex,columnIndex++)
                        .string(record [columnName])
                    }else{
                        ws.cell(rowIndex,columnIndex++)
                        .string(record [columnName])
                    }
                });
                rowIndex++;
            }); 

            const caracteresAleatorios = Math.random().toString(36).substring(5);
            const nameData = 'EXPORT-ORDER-'+caracteresAleatorios;

            wb.write(nameData+'.xlsx', res)
        })
}
exports.actionsCommandsUnityCancel = async (req,res) => {
    
    const id = req.body.btnDeleteOrder;

    database.update({sys_blz_requestStatus: 3}).where({sys_blz_id: id, sys_blz_requestStatus: 2}).table("jcv_blz_orders").then(data => {

        if(data != ""){
            res.cookie('SYS-NOTIFICATION-EXE1', "SYS01| Pedido #"+id+" cancelado com sucesso!");
            res.redirect("/painel/beleza/solicitacoes");
        }else{
            res.cookie('SYS-NOTIFICATION-EXE1', "SYS02| Erro, você não pode excluir o pedido #"+id);
            res.redirect("/painel/beleza/solicitacoes");
        }
    })
}

/////////////////////////////////////////////////////////////////////////
// FUNÇÕES EXPORTAR PEDIDOS
function exportOrders(ids,req,res){
    const xl = require('excel4node');
    const wb = new xl.Workbook();
    const ws = wb.addWorksheet('Worksheet Name');

    if(ids.length >= 1){
        database
        .select('jcv_blz_orders.sys_blz_id','jcv_blz_orders.sys_blz_userName','jcv_unitys.sys_unity_name',
        'jcv_users.jcv_userNameSecundary', 'jcv_blz_orders.sys_blz_tratmentOne','jcv_blz_orders.sys_blz_tratmentTwo',
        'jcv_blz_orders.sys_blz_requestStatus','jcv_blz_orders.sys_blz_requestReference','jcv_blz_orders.sys_blz_requestCreate')
        .table("jcv_blz_orders")
        .join('jcv_unitys', 'jcv_blz_orders.sys_blz_userUnity', '=', 'jcv_unitys.sys_unity_id')
        .join('jcv_users', 'jcv_blz_orders.sys_blz_userManager', '=', 'jcv_users.jcv_id')
        .whereRaw("jcv_blz_orders.sys_blz_id IN ("+ids+")")
        .then(data => {
                
            const headingColumnNames = [
                "ID",
                "Funcionário",
                "Unidade",
                "Gestor",
                "Shampoo Escolhido",
                "Tratamento escolhido",
                "Status Atual",
                "Mês de referência",
                "Gerado em:"
            ]
            
            let headingColumnIndex = 1; //diz que começará na primeira linha
            headingColumnNames.forEach(heading => { //passa por todos itens do array
                // cria uma célula do tipo string para cada título
                ws.cell(1, headingColumnIndex++).string(heading);
            });
            
            let rowIndex = 2;
            data.forEach( record => {
                let columnIndex = 1;
                Object.keys(record).forEach(columnName =>{

                    //Verificando se o dado é numero
                    if(typeof(record[columnName]) === 'number'){

                        //Convertendo o id do pedido para string
                        record.sys_blz_id = "#"+record.sys_blz_id;
                        //Classificando o status do pedido
                        if(record.sys_blz_requestStatus == 1){
                            record.sys_blz_requestStatus = "Pendente"
                        }else if(record.sys_blz_requestStatus == 2){
                            record.sys_blz_requestStatus = "Solicitado"
                        }else if(record.sys_blz_requestStatus == 3){
                            record.sys_blz_requestStatus = "Cancelado"
                        }else if(record.sys_blz_requestStatus == 4){
                            record.sys_blz_requestStatus = "Separado"
                        }else if(record.sys_blz_requestStatus == 5){
                            record.sys_blz_requestStatus = "Pedido de Cancelamento"
                        }

                        ws.cell(rowIndex,columnIndex++)
                        .string(record [columnName])
                    }else{
                        ws.cell(rowIndex,columnIndex++)
                        .string(record [columnName])
                    }
                });
                rowIndex++;
            }); 

            const caracteresAleatorios = Math.random().toString(36).substring(5);
            const nameData = 'EXPORT-ORDER-'+caracteresAleatorios;

            wb.write(nameData+'.xlsx', res)
        })
    }
}

// FUNÇÃO PARA EXPORTAR OS PRODUTOS
async function exportProductsOrders (ids,req,res){
    const xl = require('excel4node');
    const wb = new xl.Workbook();
    const ws = wb.addWorksheet('Worksheet Name');

    if(ids.length >= 1){
        const productTwo = await database
        .raw("SELECT sys_blz_tratmentTwo, COUNT(sys_blz_tratmentTwo) AS Qtd FROM jcvpanel.jcv_blz_orders WHERE sys_blz_id in("+ids+") GROUP BY sys_blz_tratmentTwo HAVING COUNT(sys_blz_tratmentTwo) > 0 ORDER BY COUNT(sys_blz_tratmentTwo) DESC")
        .then(data => {
            return data[0];
        })

        const productOne = await database
        .raw("SELECT sys_blz_tratmentOne, COUNT(sys_blz_tratmentOne) AS Qtd FROM jcvpanel.jcv_blz_orders WHERE sys_blz_id in("+ids+") GROUP BY sys_blz_tratmentOne HAVING COUNT(sys_blz_tratmentOne) > 0 ORDER BY COUNT(sys_blz_tratmentOne) DESC")
        .then(data => {
            return data[0];
        })


        const headingColumnNames = [
            "Produtos",
            "Quantidade"
        ]
        
        let headingColumnIndex = 1; //diz que começará na primeira linha
        headingColumnNames.forEach(heading => { //passa por todos itens do array
            // cria uma célula do tipo string para cada título
            ws.cell(1, headingColumnIndex++).string(heading);
        });
        
        let rowIndex = 2;
        productOne.forEach( record => {
            let columnIndex = 1;
            Object.keys(record).forEach(columnName =>{

                //Verificando se o dado é numero
                if(typeof(record[columnName]) === 'number'){
                    ws.cell(rowIndex,columnIndex++)
                    .number(record [columnName])
                }else{
                    ws.cell(rowIndex,columnIndex++)
                    .string(record [columnName])
                }
            });
            rowIndex++;
        });

        productTwo.forEach( record => {
            let columnIndex = 1;
            Object.keys(record).forEach(columnName =>{

                //Verificando se o dado é numero
                if(typeof(record[columnName]) === 'number'){
                    ws.cell(rowIndex,columnIndex++)
                    .number(record [columnName])
                }else{
                    ws.cell(rowIndex,columnIndex++)
                    .string(record [columnName])
                }
            });
            rowIndex++;
        });


        const caracteresAleatorios = Math.random().toString(36).substring(5);
        const nameData = 'EXPORT-PRODUCTS-'+caracteresAleatorios;

        wb.write(nameData+'.xlsx', res)
    }
}

// GERANDO AS ETIQUETA DOS PEDIDOS
async function createTagsOrders(ids,req,res){

    const resultData = await database
    .select('jcv_blz_orders.sys_blz_id','jcv_blz_orders.sys_blz_userName','jcv_unitys.sys_unity_name',
    'jcv_users.jcv_userNameSecundary', 'jcv_blz_orders.sys_blz_tratmentOne','jcv_blz_orders.sys_blz_tratmentTwo',
    'jcv_blz_orders.sys_blz_requestStatus','jcv_blz_orders.sys_blz_requestReference','jcv_blz_orders.sys_blz_requestCreate')
    .table("jcv_blz_orders")
    .join('jcv_unitys', 'jcv_blz_orders.sys_blz_userUnity', '=', 'jcv_unitys.sys_unity_id')
    .join('jcv_users', 'jcv_blz_orders.sys_blz_userManager', '=', 'jcv_users.jcv_id')
    .whereRaw("jcv_blz_orders.sys_blz_id IN ("+ids+")")
    .orderBy("jcv_users.jcv_userNameSecundary","ASC")
    .then(data => {
        return data
    })

    /* let atualIndex = resultData[0].jcv_userNameSecundary;

    for(let i = 0; i < resultData.length; i++){
        if(resultData[i].jcv_userNameSecundary == atualIndex){
            console.log("é igual: "+resultData[i].jcv_userNameSecundary)
        }else{
            console.log("Mudou para: "+resultData[i].jcv_userNameSecundary)
            atualIndex = resultData[i].jcv_userNameSecundary;
            i--;
        }
    } */
    
    const pdf = require('html-pdf');
    const ejs = require('ejs');
    
    ejs.renderFile('views/panel/beleza/HTMLpdfstyle.ejs', {arrayData: resultData, dateNow: generateDate()}, function(err, result) {
        // render on success
        if(result) {

            const options = {
                type: 'pdf',
                format: 'A4',
                orientation: 'portrait',
                border: 10
            } 

            //res.send(result)
            
            const caracteresAleatorios = Math.random().toString(36).substring(5);
            pdf.create(result, options).toFile(URLdownloads+"ETIQUETAS-PDF-"+caracteresAleatorios+".pdf", (err,data) => {
                setTimeout(()=> {
                    fs.unlinkSync(data.filename)
                },500)

                res.download(data.filename);
            })
        }
        // render or error
        else {
            res.end('An error occurred');
            console.log(err);
        }
    });

}

async function exportsUnitysExcel(ids,req,res) {

    const xl = require('excel4node');
    const wb = new xl.Workbook();
    const ws = wb.addWorksheet('Worksheet Name');

    if(typeof(ids) != 'object'){
        ids = ids.split('')
    }

    const ordersExportsUnitys = await database
    .select(
        "sys_blz_id","sys_blz_userName","sys_unity_name","jcv_userNameSecundary","sys_blz_tratmentOne",
        "sys_blz_tratmentTwo","sys_blz_requestReference","sys_blz_userUnity"
    )
    .whereIn('sys_blz_id', ids)
    .table("jcv_blz_orders")
    .join("jcv_unitys","jcv_blz_orders.sys_blz_userUnity","jcv_unitys.sys_unity_id")
    .join("jcv_users","jcv_blz_orders.sys_blz_userManager","jcv_users.jcv_id")
    .orderBy("sys_blz_userUnity","ASC")
    .then( data => {
        return data;
    })

    const headingColumnNames = [
        "Pedido #",
        "Solicitante",
        "Unidade",
        "Gestor",
        "Shampoo",
        "Tratamento",
        "Mês de ref."
    ]
    
    let headingColumnIndex = 1; //diz que começará na primeira linha
    headingColumnNames.forEach(heading => { //passa por todos itens do array
        // cria uma célula do tipo string para cada título
        ws.cell(1, headingColumnIndex++).string(heading);
    });
    
    let rowIndex = 2;
    let atualIndex = 0;

    for(let i = 0; i < ordersExportsUnitys.length; i++){
        if(ordersExportsUnitys[i].sys_blz_userUnity == atualIndex){
            //console.log("é igual: "+ordersExportsUnitys[i].sys_blz_userUnity)
        }else{

            //console.log("Mudou para: "+ordersExportsUnitys[i].sys_blz_userUnity)
            atualIndex = ordersExportsUnitys[i].sys_blz_userUnity;
            i--;
            rowIndex++;

            ordersExportsUnitys.forEach( record => {
                let columnIndex = 1;

                if(record.sys_blz_userUnity == atualIndex){


                    Object.keys(record).forEach(columnName =>{


                        //Verificando se o dado é numero
                        if(typeof(record[columnName]) === 'number'){
                            ws.cell(rowIndex,columnIndex++)
                            .number(record [columnName])
                        }else{
                            ws.cell(rowIndex,columnIndex++)
                            .string(record [columnName])
                        }

                    });
                    rowIndex++;

                }else{
                    //rowIndex++;
                }
            });
        }
    }

    const caracteresAleatorios = Math.random().toString(36).substring(5);
    const nameData = 'EXPORT-PRODUCTS-'+caracteresAleatorios;

    wb.write(nameData+'.xlsx', res)
}

async function alterarStatus(ids, status,req,res) {

    const resultSearch = await database.select().whereRaw("sys_blz_id in ("+ids+")").table("jcv_blz_orders").then(data => {
        return data;
    })

    if(status == "CMD02"){    
        let ordersUpdated = 0;
        let ordersNoUpdated = 0;
        resultSearch.forEach(element => {
            //So altere o status caso o status do pedido seja 2
            if(element['sys_blz_requestStatus'] == 2){
                //console.log("posso alterar")
                database.update({sys_blz_requestStatus: 4}).where({sys_blz_id: element['sys_blz_id']}).table("jcv_blz_orders").then(data => {
                    //update ok
                })
                //adicionando pedidos que podem ser alterados
                ordersUpdated++;
            }else{
                //adicionando pedidos que não podem ser alterados
                ordersNoUpdated++;
            }
        })
    
        if(ordersNoUpdated != ""){
            if(ordersUpdated != ""){
                res.cookie('SYS-NOTIFICATION-EXE1', "SYS02| Total de: "+ordersNoUpdated+" não podem ser alterados. "+ordersUpdated+" teve o status alterado com sucesso.");
                res.redirect("/painel/beleza/solicitacoes");
            }else{
                res.cookie('SYS-NOTIFICATION-EXE1', "SYS02| Os pedidos: não podem ser alterados");
                res.redirect("/painel/beleza/solicitacoes");
            }
        }else{
            console.log("Não tem pedidos")
            res.cookie('SYS-NOTIFICATION-EXE1', "SYS01| Status alterados com sucesso.");
            res.redirect("/painel/beleza/solicitacoes");
        }
    }else if (status == "CMD03"){
        let ordersUpdated = 0;
        let ordersNoUpdated = 0;
        resultSearch.forEach(element => {
            //So altere o status caso o status do pedido seja 2 e 5
            if(element['sys_blz_requestStatus'] == 2 || element['sys_blz_requestStatus'] == 5){
                //console.log("posso alterar")
                database.update({sys_blz_requestStatus: 3}).where({sys_blz_id: element['sys_blz_id']}).table("jcv_blz_orders").then(data => {
                    //update ok
                })
                //adicionando pedidos que podem ser alterados
                ordersUpdated++;
            }else{
                //adicionando pedidos que não podem ser alterados
                ordersNoUpdated++;
            }
        })
    
        if(ordersNoUpdated != ""){
            if(ordersUpdated != ""){
                res.cookie('SYS-NOTIFICATION-EXE1', "SYS02| Total de: "+ordersNoUpdated+" não podem ser alterados. "+ordersUpdated+" teve o status alterado com sucesso.");
                res.redirect("/painel/beleza/solicitacoes");
            }else{
                res.cookie('SYS-NOTIFICATION-EXE1', "SYS02| Os pedidos: não podem ser alterados");
                res.redirect("/painel/beleza/solicitacoes");
            }
        }else{
            console.log("Não tem pedidos")
            res.cookie('SYS-NOTIFICATION-EXE1', "SYS01| Status alterados com sucesso.");
            res.redirect("/painel/beleza/solicitacoes");
        }
    }
}

// FUNÇÃO PARA EXPORTAR OS PRODUTOS POR UNIDADE
async function exportProductsUnity (ids,req,res){

    const xl = require('excel4node');
    const wb = new xl.Workbook();
    const ws = wb.addWorksheet('Worksheet Name');

    if(ids.length >= 1){
        const productTwo = await database
        .raw("SELECT sys_blz_tratmentTwo,sys_blz_userUnity,sys_unity_name, COUNT(sys_blz_tratmentTwo) AS Qtd FROM jcvpanel.jcv_blz_orders JOIN jcv_unitys ON jcv_blz_orders.sys_blz_userUnity = jcv_unitys.sys_unity_id WHERE sys_blz_id in("+ids+") GROUP BY sys_blz_tratmentTwo HAVING COUNT(sys_blz_tratmentTwo) > 0 ORDER BY COUNT(sys_blz_tratmentTwo) DESC")
        .then(data => {
            return data[0];
        })

        const productOne = await database
        .raw("SELECT sys_blz_tratmentOne,sys_blz_userUnity,sys_unity_name, COUNT(sys_blz_tratmentOne) AS Qtd FROM jcvpanel.jcv_blz_orders JOIN jcv_unitys ON jcv_blz_orders.sys_blz_userUnity = jcv_unitys.sys_unity_id WHERE sys_blz_id in("+ids+") GROUP BY sys_blz_tratmentOne HAVING COUNT(sys_blz_tratmentOne) > 0 ORDER BY COUNT(sys_blz_tratmentOne) DESC")
        .then(data => {
            return data[0];
        })

        let newArrayComp = []
        productOne.forEach(element => {
            newArrayComp.push([element.sys_blz_tratmentOne,element.sys_unity_name,element.Qtd,element.sys_blz_userUnity])
        })
        productTwo.forEach(elementO => {
            newArrayComp.push([elementO.sys_blz_tratmentTwo,elementO.sys_unity_name,elementO.Qtd,elementO.sys_blz_userUnity])
        })

        function sortByKey(array, key) {
            return array.sort(function(a, b) {
                var x = a[key]; var y = b[key];
                return ((x < y) ? -1 : ((x > y) ? 1 : 0));
            });
        }

        //let newArrayItensExports = sortByKey(newArrayComp,2)


        const headingColumnNames = [
            "Produtos",
            "Unidade",
            "Quantidade Somada"
        ]
        
        let headingColumnIndex = 1; //diz que começará na primeira linha
        headingColumnNames.forEach(heading => { //passa por todos itens do array
            // cria uma célula do tipo string para cada título
            ws.cell(1, headingColumnIndex++).string(heading);
        });
        
        let ordersExportsUnitys = sortByKey(newArrayComp,3);
        //console.log(ordersExportsUnitys)


        let rowIndex = 2;
        let atualIndex = 0;

        for(let i = 0; i < ordersExportsUnitys.length; i++){

            if(ordersExportsUnitys[i][3] == atualIndex){
                //console.log("é igual: "+ordersExportsUnitys[i].sys_blz_userUnity)
            }else{

                //console.log("Mudou para: "+ordersExportsUnitys[i].sys_blz_userUnity)
                atualIndex = ordersExportsUnitys[i][3];
                i--;
                rowIndex++;

                ordersExportsUnitys.forEach( record => {
                    let columnIndex = 1;

                    if(record[3] == atualIndex){

                        Object.keys(record).forEach(columnName =>{

                            //Verificando se o dado é numero
                            if(typeof(record[columnName]) === 'number'){
                                ws.cell(rowIndex,columnIndex++)
                                .number(record [columnName])
                            }else{
                                ws.cell(rowIndex,columnIndex++)
                                .string(record [columnName])
                            }
                        });
                        rowIndex++;

                    }else{
                        //rowIndex++;
                    }
                });
            }


        }

        /* let rowIndex = 2;
        productOne.forEach( record => {
            let columnIndex = 1;
            Object.keys(record).forEach(columnName =>{

                //Verificando se o dado é numero
                if(typeof(record[columnName]) === 'number'){
                    ws.cell(rowIndex,columnIndex++)
                    .number(record [columnName])
                }else{
                    ws.cell(rowIndex,columnIndex++)
                    .string(record [columnName])
                }
            });
            rowIndex++;
        });

        productTwo.forEach( record => {
            let columnIndex = 1;
            Object.keys(record).forEach(columnName =>{

                //Verificando se o dado é numero
                if(typeof(record[columnName]) === 'number'){
                    ws.cell(rowIndex,columnIndex++)
                    .number(record [columnName])
                }else{
                    ws.cell(rowIndex,columnIndex++)
                    .string(record [columnName])
                }
            });
            rowIndex++;
        }); */

        const caracteresAleatorios = Math.random().toString(36).substring(5);
        const nameData = 'EXPORT-PRODUCTS-'+caracteresAleatorios;

        wb.write(nameData+'.xlsx', res)
    }
}