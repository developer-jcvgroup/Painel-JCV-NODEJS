const database = require("../../database/database");
const getPermissions = require("../../middlewarePermissions");
const uuid = require('uuid')

const moment = require("moment");
const { count } = require("console");
moment.tz.setDefault('America/Sao_Paulo');

//Sistema de emails
const emailSystemExe = require('../system/emailSystem');
const { get } = require("https");

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
            //Caso o pedido esteja cancelado
            if(data[0].sys_blz_requestStatus == 2){
                listProducts();
            }else{
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
        database.select().where({jcv_sys_products_enabled: 1, jcv_sys_products_prog_beleza: 1}).table("jcv_sys_products").then(result => {
            result.forEach(element => {
                if(element["jcv_sys_products_type"] === 1){
                    arrayProductOne.push([element["jcv_sys_products_name"], element["jcv_sys_products_img"], element["jcv_sys_products_brand"]]);
                }else{
                    arrayProductTwo.push([element["jcv_sys_products_name"], element["jcv_sys_products_img"], element["jcv_sys_products_brand"]]);
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
    const confirmSend = req.body['input-send-confirm'] == 'on' ? 1 : 0

    //Validando os produtos
    await database.select().where({jcv_sys_products_enabled: 1, jcv_sys_products_prog_beleza: 1}).whereIn('jcv_sys_products_name', [productOne,productTwo]).table("jcv_sys_products").orderBy("jcv_sys_products_type").then(data => {
        //Com o orderBy ele lista primeiro o shampoo depois o tratamento

        //Verificando se existe algo e se o retorno da consulta foi exatamente 2 produtos
        if(data != "" && Object.keys(data).length === 2){
            const insertProductOne = data[0]["jcv_sys_products_sku"]+" - "+data[0]["jcv_sys_products_name"];
            const insertProductTwo = data[1]["jcv_sys_products_sku"]+" - "+data[1]["jcv_sys_products_name"];

            //Validando se já existe pedido feito
            database
            .select("sys_blz_id")
            .whereRaw(`sys_blz_userId = ${GLOBAL_DASH[0]} AND sys_blz_requestReference = ${getMonthReferece()} AND NOT sys_blz_requestStatus = 1`)
            .table("jcv_blz_orders")
            .then( dataValid => {

                if(dataValid == ''){
                    //Não existe pedido

                    const codeRequest = uuid.v1();//UUID unico
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
                        sys_blz_requestStatus: 1,
                        sys_blz_requestCode: codeRequest
                    }).table("jcv_blz_orders").then(data => {

                        //Enviando confirmação no email caso foi solicitado
                        if(confirmSend == 1){
                            ////////////////////////////////////////////////////////////
                            ////////////////////////////////////////////////////////////
                            //Mandando email para o USUARIO
                            database.select("jcv_userEmailCorporate").where({jcv_id: GLOBAL_DASH[0], jcv_sysEmail: 1}).table("jcv_users").then( data => {
                                if(data != ''){
                                    //Sistema de email: USUARIO
                                    const textOne = 'Registro Programa da Beleza';
                                    const textTwo = `Registro: <b>${codeRequest}</b>. <br><br> Emitido: <b>${generateDate()}</b> . <br><br> Shampoo: <b>${insertProductOne}</b> <br><br> Tratamento: <b>${insertProductTwo}</b><br><br> Status: <b style='color: #10772a'>Solicitado</b>.`;
                                    emailSystemExe.sendMailExe(data[0].jcv_userEmailCorporate, 'Programa da Beleza', 'Registro Programa da Beleza', 'Programa da Beleza', GLOBAL_DASH[1], textOne, textTwo);
                                }
                            })
                        }

                        let nameUserComp = GLOBAL_DASH[1].split(' ')
                        let countParts = nameUserComp.length -1;

                        //Criando a notificação do programa da beleza para os GESTORES
                        database
                        .insert({
                            jcv_notifications_type: 'JCVMOD02',
                            jcv_notifications_usersId: JSON.stringify([GLOBAL_DASH[4]]),
                            jcv_notifications_users_view: '[]',
                            jcv_notifications_title: 'Beleza',
                            jcv_notifications_message: ' '+nameUserComp[0]+' '+nameUserComp[countParts]+' fez sua solicitação referente ao mês <b>'+getMonthReferece()+'</b>',
                            jcv_notifications_link: '/painel/beleza/solicitar',
                            jcv_notifications_created: generateDate(),
                            jcv_notifications_enabled: 1
                        })
                        .table("jcv_notifications")
                        .then( datas => {
                            //Registro confirmado
                            //Redirecionando para a pagina status
                            //res.cookie('SYS-NOTIFICATION-EXE1', "SYS01|Benefício referente ao mês ("+getMonthReferece()+") registrado!");
                            res.cookie('SYSTEM-NOTIFICATIONS-MODULE', `{"typeMsg": "success","message":"Benefício referente ao mês (${getMonthReferece()}) registrado!","timeMsg": 3000}`);
                            res.redirect("/painel/beleza/status");
                        })
                    }).catch(err => {
                        //Erro ao registrar
                        //res.cookie('SYS-NOTIFICATION-EXE1', "SYS02|Erro ao registrar sua solcitação, erro interno");
                        res.cookie('SYSTEM-NOTIFICATIONS-MODULE', `{"typeMsg": "error","message":"Erro ao registrar sua solcitação, erro interno","timeMsg": 3000}`);
                        res.redirect("/painel/beleza/solicitar");
                    })
                }else{
                    //res.cookie('SYS-NOTIFICATION-EXE1', "SYS03| Benefício referente ao mês ("+getMonthReferece()+") já registrado!");
                    res.cookie('SYSTEM-NOTIFICATIONS-MODULE', `{"typeMsg": "warning","message":"Benefício referente ao mês (${getMonthReferece()}) já registrado!","timeMsg": 3000}`);
                    res.redirect("/painel/beleza/status");
                }
            })
        }else{
            //Erro ao validar os produtos
            //res.cookie('SYS-NOTIFICATION-EXE1', "SYS03| Um dos produtos inserido é inválido, revise-o");
            res.cookie('SYSTEM-NOTIFICATIONS-MODULE', `{"typeMsg": "warning","message":"Um dos produtos inserido é inválido, revise-o.","timeMsg": 3000}`);
            res.redirect("/painel/beleza/solicitar");
        }
    }).catch(err => {
        //Erro ao validar os produtos
        //res.cookie('SYS-NOTIFICATION-EXE1', "SYS03| Os produtos inserido são inválidos, revise-os");
        res.cookie('SYSTEM-NOTIFICATIONS-MODULE', `{"typeMsg": "warning","message":"Os produtos inserido são inválidos, revise-os.","timeMsg": 3000}`);
        res.redirect("/painel/beleza/solicitar");
    })
}

exports.listOrder = async (req,res,next) => {

    //Validando se existe pedidos para este usuario
    //Exeto os cancelados {2}
    const requestUser = await database
    .select("sys_blz_id","sys_blz_tratmentOne","sys_blz_tratmentTwo","sys_blz_requestStatus")
    .where({sys_blz_requestReference: getMonthReferece(), sys_blz_userId: GLOBAL_DASH[0]})
    .whereNot('sys_blz_requestStatus', [2])
    .table("jcv_blz_orders").then(data => {
        return data;
    })


    if(requestUser.length == 1){
        //Solicitação já realizada

        //Pegando dados dos produtos
        const verifyProd = await database
        .select()
        .whereIn("jcv_sys_products_name ", [requestUser[0].sys_blz_tratmentOne.split(' - ')[1], requestUser[0].sys_blz_tratmentTwo.split(' - ')[1]])
        .table("jcv_sys_products")
        .then( data => {
            return data
        }) 

        /* //Verificando se o pedido esta com a solicitação de cancelamento e se é deste mes
        if(requestUser[0]["sys_blz_requestStatus"] == 2){
            //res.cookie('SYS-NOTIFICATION-EXE1', "SYS02|Seu pedido foi recebido pelo administrador. Aguarde até que sua solicitação seja cancelada.");
            res.cookie('SYSTEM-NOTIFICATIONS-MODULE', `{"typeMsg": "success","message":"Seu pedido foi recebido pelo administrador. Aguarde até que sua solicitação seja cancelada.","timeMsg": 3000}`);
            var statusCancel = true;
        }else{
            var statusCancel = false;
        } */

        var page = "beleza/status";
        res.render("panel/index", {
            page: page,
            requestUser: requestUser,
            productOne: requestUser[0]["sys_blz_tratmentOne"].split('-')[1], 
            productTwo: requestUser[0]["sys_blz_tratmentTwo"].split('-')[1], 
            idRequest: requestUser[0]["sys_blz_id"], 
            mesReferencia: getMonthReferece(), 
            verifyProd:verifyProd
        })
    }else{
        res.redirect("/painel/beleza/solicitar");
    }
}

exports.cancelOrder = async (req,res) => {
    let idOrder = req.body.buttonIDorder;

    //Cancela o pedido diretamente

    //Validando se o usuario atingiu a cota de pedidos cancelador que é 2 vezes
    const validateCancel = await database
    .select()
    .where({sys_blz_userId: GLOBAL_DASH[0], sys_blz_requestStatus: 2, sys_blz_requestReference: getMonthReferece()})
    .table("jcv_blz_orders")
    .then( data => {
        if(data != ''){
            return data.length
        }else{
            return 0
        }
    })

    console.log(validateCancel)

    //Verifica se atingiu a cota
    if(validateCancel >= 2){
        //Já atingiu a cota
        //res.cookie('SYS-NOTIFICATION-EXE1', "SYS02|Você não pode mais cancelar sua solicitação sua cota foi excedida.");
        res.cookie('SYSTEM-NOTIFICATIONS-MODULE', `{"typeMsg": "error","message":"Você não pode mais cancelar sua solicitação sua cota foi excedida.","timeMsg": 3000}`);
        res.redirect("/painel/beleza/status");
    }else{
        //Cancelando o pedido
        database.update({sys_blz_requestStatus: 2}).where({sys_blz_id: idOrder}).table("jcv_blz_orders").then(data => {
            //res.cookie('SYS-NOTIFICATION-EXE1', "SYS01|Sua solicitação foi cancelada com sucesso! Não estrapole sua cota!");
            res.cookie('SYSTEM-NOTIFICATIONS-MODULE', `{"typeMsg": "success","message":"Sua solicitação foi cancelada com sucesso! Não estrapole sua cota!.","timeMsg": 3000}`);
            res.redirect("/painel/beleza/status");
        })
    }
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
    res.render("panel/index", {page: page, monthReference: getMonthReferece(), unidades: unidades, blzGestor: blzGestor, yearNow: yearNow, resultSearchData: req.flash('resultSearchData'), resultSearchDataPend: req.flash('resultSearchDataPend'), resultReferenceDate: req.flash('resultReferenceDate')})
}

exports.searchRequests = async (req,res) => {

    function convertStringNow(){
        let convertedString = req.body['sys-filter-name-date'].map(function(value){
            return "'"+value+"'"
        })
        
        return convertedString
    }
    

    let referenceDate = typeof(req.body['sys-filter-name-date']) == 'object' ? 'in ('+convertStringNow()+')' : req.body['sys-filter-name-date'] == undefined ? '= "'+getMonthReferece()+'"' : `= "${req.body['sys-filter-name-date']}"`;

    let blzStatus = req.body['sys-filter-name-status'] != undefined ? req.body['sys-filter-name-status'] == 0 ?  0 : 'in ('+req.body['sys-filter-name-status']+')' : "= 1";

    let listUnitys = req.body['sys-filter-name-unidade'] != undefined ? 'in ('+req.body['sys-filter-name-unidade']+')' : "LIKE '%%'";
    let listGestores = req.body['sys-filter-name-gestor'] != undefined ? 'in ('+req.body['sys-filter-name-gestor']+')' : "LIKE '%%'";

    if(blzStatus == 0){        
        database
        .raw(`
            SELECT * FROM jcv_users e JOIN jcv_users_permissions ON jcv_id = sys_perm_idUser JOIN jcv_unitys ON e.jcv_userUnity = sys_unity_id  
            WHERE e.jcv_userUnity ${listUnitys} AND e.jcv_userEnabled = 1 AND e.jcv_userManager ${listGestores} AND NOT EXISTS 
            (SELECT * FROM jcv_jcvpanel.jcv_blz_orders r WHERE e.jcv_id = r.sys_blz_userId AND r.sys_blz_requestReference ${referenceDate})
        `)
        //.join("jcv_users_permissions","jcv_users.jcv_id","jcv_users_permissions.sys_perm_idUser")
        .then( data => {

            if(data[0].length > 0){
                req.flash('resultSearchDataPend', data[0])
                req.flash('resultReferenceDate',referenceDate)
                res.redirect("/painel/beleza/solicitacoes");
            }else{
                //res.cookie('SYS-NOTIFICATION-EXE1', "SYS02|Nenhuma solicitação encontrado em sua busca");
                res.cookie('SYSTEM-NOTIFICATIONS-MODULE', `{"typeMsg": "warning","message":"Nenhuma solicitação encontrado em sua busca.","timeMsg": 3000}`);
                res.redirect("/painel/beleza/solicitacoes");
            }
        })
    }else{
        database
        .select('jcv_blz_orders.sys_blz_id','jcv_blz_orders.sys_blz_userName','jcv_unitys.sys_unity_name',
        'jcv_users.jcv_userNameSecundary', 'jcv_blz_orders.sys_blz_tratmentOne','jcv_blz_orders.sys_blz_tratmentTwo',
        'jcv_blz_orders.sys_blz_requestStatus','jcv_blz_orders.sys_blz_requestReference','jcv_blz_orders.sys_blz_requestCreate','jcv_blz_orders.sys_blz_requestCode')
        .table("jcv_blz_orders")
        .join('jcv_unitys', 'jcv_blz_orders.sys_blz_userUnity', '=', 'jcv_unitys.sys_unity_id')
        .join('jcv_users', 'jcv_blz_orders.sys_blz_userManager', '=', 'jcv_users.jcv_id')
        .whereRaw("jcv_blz_orders.sys_blz_requestStatus "+blzStatus+" AND jcv_blz_orders.sys_blz_userManager "+listGestores+" AND jcv_unitys.sys_unity_id "+listUnitys+" AND jcv_blz_orders.sys_blz_requestReference "+referenceDate+" ORDER BY jcv_blz_orders.sys_blz_id DESC")
        .then(data => {
            
            if(data != ""){
                req.flash('resultSearchData', data)
                res.redirect("/painel/beleza/solicitacoes");
            }else{
                //res.cookie('SYS-NOTIFICATION-EXE1', "SYS02|Nenhuma solicitação encontrada em sua busca");
                res.cookie('SYSTEM-NOTIFICATIONS-MODULE', `{"typeMsg": "warning","message":"Nenhuma solicitação encontrada em sua busca.","timeMsg": 3000}`);
                res.redirect("/painel/beleza/solicitacoes");
            }
        })
    }
}

exports.listProducts = async (req,res) => {
    database.select().table("jcv_sys_products").orderBy("jcv_sys_products_name").then(data => {
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
        const productLinkImg = req.body.productLinkImg

        let productEnabled;
    
        if(req.body.productEnabled == undefined){
            productEnabled = 0;
        }else{
            productEnabled = 1
        }
        
        database.insert({
            jcv_sys_products_sku: productSKU,
            jcv_sys_products_name: productName,
            jcv_sys_products_enabled: productEnabled,
            jcv_sys_products_type: productType,
            jcv_sys_products_brand: productBrand,
            jcv_sys_products_img: productLinkImg
        }).table("jcv_sys_products").then(data => {
            if(data != ""){
                //res.cookie('SYS-NOTIFICATION-EXE1', "SYS01| O produto '"+productName+"' foi cadastrado com sucesso!");
                res.cookie('SYSTEM-NOTIFICATIONS-MODULE', `{"typeMsg": "success","message":"O produto <b>${productName}</b> foi cadastrado com sucesso!.","timeMsg": 3000}`);
                res.redirect("/painel/beleza/produtos");
            }else{
                //res.cookie('SYS-NOTIFICATION-EXE1', "SYS02| Erro interno ao inserir o produto");
                res.cookie('SYSTEM-NOTIFICATIONS-MODULE', `{"typeMsg": "error","message":"Erro interno ao inserir o produto.","timeMsg": 3000}`);
                res.redirect("/painel/beleza/produtos");
            }
        })
    }else{
        //res.cookie('SYS-NOTIFICATION-EXE1', "SYS03| SKU inválido!");
        res.cookie('SYSTEM-NOTIFICATIONS-MODULE', `{"typeMsg": "warning","message":"SKU inválido!.","timeMsg": 3000}`);
        res.redirect("/painel/beleza/produtos");
    }
}

exports.actionProductSave = async (req,res) => {

    const idProd = req.body.btnEditProduct;
        
    const editproductSKU = req.body['editProductSKU'+idProd];
    const editproductBrand = req.body['editProductBrand'+idProd];
    const editproductName = req.body['editProductName'+idProd];
    const editproductType = req.body['editProductType'+idProd];
    const productLinkImg = req.body['editProductIMG'+idProd];

    let editproductEnabled;

    if(req.body['editProductEnabled'+idProd] == undefined){
        editproductEnabled = 0;
    }else{
        editproductEnabled = 1
    }

    database.update({
        jcv_sys_products_sku: editproductSKU,
        jcv_sys_products_name: editproductName,
        jcv_sys_products_enabled: editproductEnabled,
        jcv_sys_products_type: editproductType,
        jcv_sys_products_brand: editproductBrand,
        jcv_sys_products_last_update: generateDate(),
        jcv_sys_products_img: productLinkImg
    })
    .where({jcv_sys_products_id: idProd})
    .table("jcv_sys_products").then(data => {
        if(data != ""){
            //res.cookie('SYS-NOTIFICATION-EXE1', "SYS01| O produto '"+editproductName+"' foi salvo com sucesso!");
            res.cookie('SYSTEM-NOTIFICATIONS-MODULE', `{"typeMsg": "success","message":"O produto <b>${editproductName}</b> foi salvo com sucesso!","timeMsg": 3000}`);
            res.redirect("/painel/beleza/produtos");
        }else{
            //res.cookie('SYS-NOTIFICATION-EXE1', "SYS02| Erro interno ao inserir o produto");
            res.cookie('SYSTEM-NOTIFICATIONS-MODULE', `{"typeMsg": "error","message":"Erro interno ao inserir o produto","timeMsg": 3000}`);
            res.redirect("/painel/beleza/produtos");
        }
    })
}

exports.actionProductDelete = async (req,res) => {
    const id = req.body.btnDeleteProduct;

    database.where({jcv_sys_products_id: id}).delete().table("jcv_sys_products").then( data => {
        if(data = 1){
            //res.cookie('SYS-NOTIFICATION-EXE1', "SYS01| Produto deletado com sucesso!");
            res.cookie('SYSTEM-NOTIFICATIONS-MODULE', `{"typeMsg": "success","message":"Produto deletado com sucesso!","timeMsg": 3000}`);
            res.redirect("/painel/beleza/produtos");
        }else{
            //res.cookie('SYS-NOTIFICATION-EXE1', "SYS03| Erro interno ao deletar o produto.");
            res.cookie('SYSTEM-NOTIFICATIONS-MODULE', `{"typeMsg": "error","message":"Erro interno ao deletar o produto.","timeMsg": 3000}`);
            res.redirect("/painel/beleza/produtos");
        }
    })
}

exports.statusProducts = async (req,res) => {
    const ids = req.body.productsIds;
    const action = req.body.actionProducts;

    if(action == "CMD01"){
        //?Ativo

        let updateSucess = 0;
        let updateError = 0;

        for (let i = 0; i < ids.length; i++) {
            let result = await database.update({jcv_sys_products_enabled: 1}).where({jcv_sys_products_id: ids[i]}).table("jcv_sys_products").then(data => {
                return data;
            })

            if(result == 1){
                updateSucess++;
            }else{
                updateError++;
            }
            
        }

        //res.cookie('SYS-NOTIFICATION-EXE1', "SYS02| Total de: "+updateSucess+" foram alterados. Total de: "+updateError+" não teve o status alterado.");
        res.cookie('SYSTEM-NOTIFICATIONS-MODULE', `{"typeMsg": "warning","message":"Total de: ${updateSucess} foram alterados. Total de: ${updateError} não teve o status alterado.","timeMsg": 5000}`);
        res.redirect("/painel/beleza/produtos");
    }else if(action == "CMD02"){
        //Inativo

        let updateSucess = 0;
        let updateError = 0;

        for (let i = 0; i < ids.length; i++) {
            let result = await database.update({jcv_sys_products_enabled: 1}).where({jcv_sys_products_id: ids[i]}).table("jcv_sys_products").then(data => {
                return data;
            })

            if(result == 1){
                updateSucess++;
            }else{
                updateError++;
            }
            
        }

        res.cookie('SYS-NOTIFICATION-EXE1', "SYS02| Total de: "+updateSucess+" foram alterados. Total de: "+updateError+" não teve o status alterado.");
        res.cookie('SYSTEM-NOTIFICATIONS-MODULE', `{"typeMsg": "warning","message":"Total de: ${updateSucess} foram alterados. Total de: ${updateError} não teve o status alterado.","timeMsg": 5000}`);
        res.redirect("/painel/beleza/produtos");

    }else if(action == "CMD03"){

        const xl = require('excel4node');
        const wb = new xl.Workbook();
        const ws = wb.addWorksheet('Worksheet Name');

        database
        .select("jcv_sys_products_sku","jcv_sys_products_name", "jcv_sys_products_enabled", "jcv_sys_products_brand")
        .table("jcv_sys_products")
        .whereRaw("jcv_sys_products.jcv_sys_products_id IN ("+ids+")")
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
                        if(record.jcv_sys_products_enabled == 1){
                            record.jcv_sys_products_enabled = "Ativo"
                        }else if(record.jcv_sys_products_enabled == 0){
                            record.jcv_sys_products_enabled = "Desativado"
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
    const arrayPedidos = typeof(req.body.requestOrderId) == 'string' ? [req.body.requestOrderId] : req.body.requestOrderId;

    if(arrayPedidos == undefined){
        //res.cookie('SYS-NOTIFICATION-EXE1', "SYS02| Selecione algum pedido!");
        res.cookie('SYSTEM-NOTIFICATIONS-MODULE', `{"typeMsg": "warning","message":"Selecione algum pedido!","timeMsg": 3000}`);
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
    }else if(commandSet == "CMD09"){
        exportsEtiquetasQR(arrayPedidos,req,res)
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
                        record.sys_blz_id = "#"+record.sys_blz_id;
                        //Classificando o status do pedido

                        let newObjStatus = {
                            0: 'Pendente',
                            1: 'Solicitado',
                            2: 'Cancelado',
                            3: 'Em separação',
                            4: 'Separado',
                            5: 'Despachado',
                            6: 'Recebido pelo gestor',
                            7: 'Finalizado'
                        }

                        //record.blz_orderStatus = newObjStatus[record.blz_orderStatus]
                        record.sys_blz_requestStatus = newObjStatus[record.sys_blz_requestStatus]

                        /* if(record.blz_orderStatus == 1){
                            record.blz_orderStatus = "Pendente"
                        }else if(record.blz_orderStatus == 2){
                            record.blz_orderStatus = "Solicitado"
                        }else if(record.blz_orderStatus == 3){
                            record.blz_orderStatus = "Cancelado"
                        }else if(record.blz_orderStatus == 4){
                            record.blz_orderStatus = "Separado"
                        }else if(record.blz_orderStatus == 5){
                            record.blz_orderStatus = "Pedido de Cancelamento"
                        } */

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

    database.update({sys_blz_requestStatus: 2}).where({sys_blz_id: id, sys_blz_requestStatus: 1}).table("jcv_blz_orders").then(data => {

        if(data != ""){
            //res.cookie('SYS-NOTIFICATION-EXE1', "SYS01| Pedido #"+id+" cancelado com sucesso!");
            res.cookie('SYSTEM-NOTIFICATIONS-MODULE', `{"typeMsg": "success","message":"Pedido #${id} cancelado com sucesso!","timeMsg": 3000}`);
            res.redirect("/painel/beleza/solicitacoes");
        }else{
            //res.cookie('SYS-NOTIFICATION-EXE1', "SYS02| Erro, você não pode excluir o pedido #"+id);
            res.cookie('SYSTEM-NOTIFICATIONS-MODULE', `{"typeMsg": "error","message":"Você não pode excluir o pedido #${id}","timeMsg": 3000}`);
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

                        let newObjStatus = {
                            0: 'Pendente',
                            1: 'Solicitado',
                            2: 'Cancelado',
                            3: 'Em separação',
                            4: 'Separado',
                            5: 'Despachado',
                            6: 'Recebido pelo gestor',
                            7: 'Finalizado'
                        }

                        record.sys_blz_requestStatus = newObjStatus[record.sys_blz_requestStatus]

                        /* if(record.sys_blz_requestStatus == 1){
                            record.sys_blz_requestStatus = "Pendente"
                        }else if(record.sys_blz_requestStatus == 2){
                            record.sys_blz_requestStatus = "Solicitado"
                        }else if(record.sys_blz_requestStatus == 3){
                            record.sys_blz_requestStatus = "Cancelado"
                        }else if(record.sys_blz_requestStatus == 4){
                            record.sys_blz_requestStatus = "Separado"
                        }else if(record.sys_blz_requestStatus == 5){
                            record.sys_blz_requestStatus = "Pedido de Cancelamento"
                        } */

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
        .raw("SELECT sys_blz_tratmentTwo, COUNT(sys_blz_tratmentTwo) AS Qtd FROM jcv_jcvpanel.jcv_blz_orders WHERE sys_blz_id in("+ids+") GROUP BY sys_blz_tratmentTwo HAVING COUNT(sys_blz_tratmentTwo) > 0 ORDER BY COUNT(sys_blz_tratmentTwo) DESC")
        .then(data => {
            return data[0];
        })

        const productOne = await database
        .raw("SELECT sys_blz_tratmentOne, COUNT(sys_blz_tratmentOne) AS Qtd FROM jcv_jcvpanel.jcv_blz_orders WHERE sys_blz_id in("+ids+") GROUP BY sys_blz_tratmentOne HAVING COUNT(sys_blz_tratmentOne) > 0 ORDER BY COUNT(sys_blz_tratmentOne) DESC")
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

    /* Aqui vai ser o novo estilo de etiquetas do programa da beleza */
    /* const ArryaNewTags = [];

    let atualIndex = resultData[0].jcv_userNameSecundary;
    for(let i = 0; i < resultData.length; i++){
        if(resultData[i].jcv_userNameSecundary == atualIndex){


            console.log("é igual: "+resultData[i].jcv_userNameSecundary)

            ArryaNewTags.push([
                resultData[i].jcv_userNameSecundary,
                10,
                '03/2022',
                'QR CODE GESTOR',
            ])

            
        }else{


            //console.log("Mudou para: "+resultData[i].jcv_userNameSecundary)
            atualIndex = resultData[i].jcv_userNameSecundary;
            i--;


        }
    } */


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
    
    const fs = require('fs');
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

            res.send(result)
            /* const caracteresAleatorios = Math.random().toString(36).substring(5);
            pdf.create(result, options).toFile("/home/jcv/app/public/panel/downloads/beleza/ETIQUETAS-PDF-"+caracteresAleatorios+".pdf", (err,data) => {

                console.log(data)

                setTimeout(()=> {
                    fs.unlinkSync(data.filename)
                },2000)

                res.download(data.filename);
            }) */
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
        
        //Em separação
        //Pegando quais solicitações pode ou não pode ser adicionadas
        const getDataRequestsValidation = await database
        .select()
        .whereRaw(`sys_blz_id IN (${ids}) AND sys_blz_requestStatus = 1`)
        .table('jcv_blz_orders')
        .then( data => { return data })

        if(getDataRequestsValidation == ''){
            res.cookie('SYSTEM-NOTIFICATIONS-MODULE', `{"typeMsg": "warning","message":"Este pedido não pode alterar seu status","timeMsg": 3000}`);
            res.redirect("/painel/beleza/solicitacoes");
        }else{

            //console.log(getDataRequestsValidation+' '+ids)
            let validaeMonth = getDataRequestsValidation[0].sys_blz_requestReference;
            let validaeMonthCode = true;
            getDataRequestsValidation.forEach(element => {
                if(element.sys_blz_requestReference != validaeMonth){
                    validaeMonthCode = false
                }
            });


            if(getDataRequestsValidation.length == ids.length && validaeMonthCode == true){

                //Podemos continuar as operações
                ////////////////////////////////////////////////
                //Modulo para criar o compilado de dar sequencia ao processo, neste caso é o 3 (em separação)
                compilateOrders(ids, 3)
                ////////////////////////////////////////////////
                
                let ordersUpdated = 0;
                let ordersNoUpdated = 0;
                resultSearch.forEach(element => {
                    //So altere o status caso o status do pedido seja 1
                    if(element['sys_blz_requestStatus'] == 1){
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
                        //res.cookie('SYS-NOTIFICATION-EXE1', "SYS02| Total de: "+ordersNoUpdated+" não podem ser alterados. "+ordersUpdated+" teve o status alterado com sucesso.");
                        res.cookie('SYSTEM-NOTIFICATIONS-MODULE', `{"typeMsg": "warning","message":"Total de: ${ordersNoUpdated} não podem ser alterados. ${ordersUpdated} teve o status alterado com sucesso!","timeMsg": 3000}`);
                        res.redirect("/painel/beleza/solicitacoes");
                    }else{
                        //res.cookie('SYS-NOTIFICATION-EXE1', "SYS02| Os pedidos: não podem ser alterados");
                        res.cookie('SYSTEM-NOTIFICATIONS-MODULE', `{"typeMsg": "warning","message":"Os pedidos não podem ser alterados","timeMsg": 3000}`);
                        res.redirect("/painel/beleza/solicitacoes");
                    }
                }else{
                    //console.log("Não tem pedidos")
                    //res.cookie('SYS-NOTIFICATION-EXE1', "SYS01| Status alterados com sucesso.");
                    res.cookie('SYSTEM-NOTIFICATIONS-MODULE', `{"typeMsg": "success","message":"Status alterado(s) com sucesso!","timeMsg": 3000}`);
                    res.redirect("/painel/beleza/solicitacoes");
                }
            }else{
                //Erro ao processar
                res.cookie('SYSTEM-NOTIFICATIONS-MODULE', `{"typeMsg": "warning","message":"Os pedidos não podem ser alterados! <b>Todos</b> precisam estar com status <b>SOLICITADOS</b> e serem <b>TODOS</b> de um único <b>Mês</b>","timeMsg": 6000}`);
                res.redirect("/painel/beleza/solicitacoes");
            }

        }
        
    }else if (status == "CMD03"){

        let ordersUpdated = 0;
        let ordersNoUpdated = 0;
        resultSearch.forEach(element => {
            //So altere o status caso o status do pedido seja 1
            if(element['sys_blz_requestStatus'] == 1){
                //console.log("posso alterar")
                database.update({sys_blz_requestStatus: 2}).where({sys_blz_id: element['sys_blz_id']}).table("jcv_blz_orders").then(data => {
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
                //res.cookie('SYS-NOTIFICATION-EXE1', "SYS02| Total de: "+ordersNoUpdated+" não podem ser alterados. "+ordersUpdated+" teve o status alterado com sucesso.");
                res.cookie('SYSTEM-NOTIFICATIONS-MODULE', `{"typeMsg": "success","message":"Total de: ${ordersNoUpdated} não podem ser alterados. ${ordersUpdated} teve o status alterado com sucesso.","timeMsg": 3000}`);
                res.redirect("/painel/beleza/solicitacoes");
            }else{
                //res.cookie('SYS-NOTIFICATION-EXE1', "SYS02| Os pedidos não podem ser alterados");
                res.cookie('SYSTEM-NOTIFICATIONS-MODULE', `{"typeMsg": "error","message":"Os pedidos não podem ser alterados.","timeMsg": 3000}`);
                res.redirect("/painel/beleza/solicitacoes");
            }
        }else{
            //console.log("Não tem pedidos")
            //res.cookie('SYS-NOTIFICATION-EXE1', "SYS01| Status alterados com sucesso.");
            res.cookie('SYSTEM-NOTIFICATIONS-MODULE', `{"typeMsg": "success","message":"Status alterado com sucesso.","timeMsg": 3000}`);
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

        let allUnitysOrder = []
        //Pegando os ids das unidades e tranformando em array
        await database
        //.select()
        .distinct("sys_blz_userUnity")
        .whereRaw('sys_blz_id in ('+ids+')')
        .orderByRaw("sys_blz_userUnity")
        .table("jcv_blz_orders")
        .then( data => {
            data.forEach(element => {
                allUnitysOrder.push(element.sys_blz_userUnity)
            });
        })

        //Buscando os pedidos de cada unidade
        //console.log(allUnitysOrder)

        const headingColumnNames = [
            "Produto",
            "Unidade",
            "Quantidade"
        ]
        
        let headingColumnIndex = 1; //diz que começará na primeira linha
        headingColumnNames.forEach(heading => { //passa por todos itens do array
            // cria uma célula do tipo string para cada título
            ws.cell(1, headingColumnIndex++).string(heading);
        });
        
        let rowIndex = 2;

        allUnitysOrder.forEach(element => {

            database
            .raw("SELECT sys_blz_tratmentOne,sys_unity_name, COUNT(sys_blz_tratmentOne) AS Qtd FROM jcv_jcvpanel.jcv_blz_orders JOIN jcv_unitys ON jcv_blz_orders.sys_blz_userUnity = jcv_unitys.sys_unity_id WHERE sys_blz_userUnity = "+element+" AND sys_blz_userUnity in ("+ids+") GROUP BY sys_blz_tratmentOne HAVING COUNT(sys_blz_tratmentOne) > 0 ORDER BY sys_blz_userUnity, COUNT(sys_blz_tratmentOne) DESC")
            .then( data => {
                //console.table(data[0])

                //console.log(data[0])

                data[0].forEach( record => {
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

            })

            database
            .raw("SELECT sys_blz_tratmentTwo,sys_unity_name, COUNT(sys_blz_tratmentTwo) AS Qtd FROM jcv_jcvpanel.jcv_blz_orders JOIN jcv_unitys ON jcv_blz_orders.sys_blz_userUnity = jcv_unitys.sys_unity_id WHERE sys_blz_userUnity = "+element+" AND sys_blz_userUnity in ("+ids+") GROUP BY sys_blz_tratmentTwo HAVING COUNT(sys_blz_tratmentTwo) > 0 ORDER BY sys_blz_userUnity, COUNT(sys_blz_tratmentTwo) DESC")
            .then( data => {
                //console.table(data[0])

                data[0].forEach( record => {
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

            })

        });

        setTimeout(() => {
            const caracteresAleatorios = Math.random().toString(36).substring(5);
            const nameData = 'EXPORT-PRODUCTS-'+caracteresAleatorios;

            wb.write(nameData+'.xlsx', res)
        }, 3000);
        
        /* const productTwo = await database
        .raw("SELECT sys_blz_tratmentTwo,sys_blz_userUnity,sys_unity_name, COUNT(sys_blz_tratmentTwo) AS Qtd FROM jcv_jcvpanel.jcv_blz_orders JOIN jcv_unitys ON jcv_blz_orders.sys_blz_userUnity = jcv_unitys.sys_unity_id WHERE sys_blz_id in("+ids+") GROUP BY sys_blz_tratmentTwo HAVING COUNT(sys_blz_tratmentTwo) > 0 ORDER BY sys_blz_userUnity, COUNT(sys_blz_tratmentTwo) DESC")
        .then(data => {
            return data[0];
        })

        const productOne = await database
        .raw("SELECT sys_blz_tratmentOne,sys_blz_userUnity,sys_unity_name, COUNT(sys_blz_tratmentOne) AS Qtd FROM jcv_jcvpanel.jcv_blz_orders JOIN jcv_unitys ON jcv_blz_orders.sys_blz_userUnity = jcv_unitys.sys_unity_id WHERE sys_blz_id in("+ids+") GROUP BY sys_blz_tratmentOne HAVING COUNT(sys_blz_tratmentOne) > 0 ORDER BY sys_blz_userUnity, COUNT(sys_blz_tratmentOne) DESC")
        .then(data => {
            return data[0];
        })

        console.log(ids)

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

            if(parseInt(ordersExportsUnitys[i][3]) === atualIndex){
                console.log("é igual: "+ordersExportsUnitys[i][3])
            }else{

                console.log("Mudou para: "+ordersExportsUnitys[i][3])
                atualIndex = ordersExportsUnitys[i][3];
                i--;
                rowIndex++;

                
                ordersExportsUnitys.forEach( record => {
                    let columnIndex = 1;

                    //console.log(record[3]+'-'+atualIndex)
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
        } */

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

        
    }
}
compilateOrders = async (idsOrder, statusOrder) => {

    //Pegando os ids
    const getOrdersSelect = await database
    .select()
    .whereIn('sys_blz_id', idsOrder)
    .table("jcv_blz_orders")
    .orderBy('sys_blz_userManager','DESC')
    .then( data => {return data})

    //Pegando o array e convertendo os dados
    let indexManager = getOrdersSelect[0].sys_blz_userManager; // Pegando o primeiro index como usuario manager
    let objData = [];//Obj que vai armazenar os dados referente a cada gestor
    let arrayIdsRequests = [];//Listar os ids das solicitações

    for(let i = 0; i < getOrdersSelect.length; i++){
        
        //console.log(i)
        //Verificado se o index setado antes do forEach é o mesmo que o index atual
        if(indexManager == getOrdersSelect[i].sys_blz_userManager){
            //console.log('mesmo gestor')
            //Mesmo gestor

            
            
            //Puxando os dados para este novo objeto
            objData.push({
                blzIdRequest: getOrdersSelect[i].sys_blz_id,
                blzUserName: getOrdersSelect[i].sys_blz_userName,
                blzShampoo: getOrdersSelect[i].sys_blz_tratmentOne,
                blzTreatment: getOrdersSelect[i].sys_blz_tratmentTwo,
                blzRequestDate: getOrdersSelect[i].sys_blz_requestCreate
            })

            arrayIdsRequests.push(getOrdersSelect[i].sys_blz_id)

            //Validando se é o ultimo item do array
            if((i) +1 == getOrdersSelect.length){
                //console.log('ultimo item do array')
                //Neste caso por ser o ultimo item vamos salvar ele no banco de dados igual a
                //condição do else mais abaixo
                //console.log('Object data do gestor anterior: '+objData)
                //Salvando no banco de dados
                database
                .insert({
                    jcv_blz_compilate_id_manager: indexManager,
                    jcv_blz_compilate_array_data: JSON.stringify(objData),
                    jcv_blz_compilate_month_reference: getOrdersSelect[i].sys_blz_requestReference,
                    jcv_blz_compilate_generate_date: generateDate(),
                    jcv_blz_compilate_status: statusOrder,
                    jcv_blz_compilate_ids: JSON.stringify(arrayIdsRequests),
                    jcv_blz_compilate_active: 1,
                    jcv_blz_compilate_uuid: uuid.v1(),
                    jcv_blz_compilate_QR_manager: uuid.v1(),
                    jcv_blz_compilate_QR_expedicao: uuid.v1()
                })
                .table("jcv_blz_compilate")
                .then( data => {
                    //Okay
                    //console.log('inserido:'+data)
                })

                //indexManager[getOrdersSelect[getOrdersSelect.length].sys_blz_userManager]
            }
            
        }else{
            //Mudou de gestor

            //Neste ação vamos salvar este objeto no banco antes dele ser apagado
            //console.log('Object data do gestor anterior: '+objData)
            //Salvando no banco de dados
            database
            .insert({
                jcv_blz_compilate_id_manager: indexManager,
                jcv_blz_compilate_array_data: JSON.stringify(objData),
                jcv_blz_compilate_month_reference: getOrdersSelect[i].sys_blz_requestReference,
                jcv_blz_compilate_generate_date: generateDate(),
                jcv_blz_compilate_status: statusOrder,
                jcv_blz_compilate_active: 1,
                jcv_blz_compilate_ids: JSON.stringify(arrayIdsRequests),
                jcv_blz_compilate_uuid: uuid.v1(),
                jcv_blz_compilate_QR_manager: uuid.v1(),
                jcv_blz_compilate_QR_expedicao: uuid.v1()
            })
            .table("jcv_blz_compilate")
            .then( data => {
                //Okay
                //console.log('inserido:'+data)
            })
            
            //Limapando o objeto para uma novo inserção de dados
            objData = []
            arrayIdsRequests = []

            indexManager = getOrdersSelect[i].sys_blz_userManager
            i--
            //console.log('mudou de gestor (voltando uma casa)')
        }
    
    }

    //Registrar log das solicitações
    getOrdersSelect.forEach(element => {

        //Registrando os compilados
        registerLogCompilate(element.sys_blz_requestCode, statusOrder)


    });

    

}

exports.compilateView = async (req,res) => {

    const uuidGet = req.params.uuid;

    const getUUIDcompilates = await database
    .select("jcv_blz_compilate.*","jcv_users.jcv_userNamePrimary")
    .where({jcv_blz_compilate_uuid: uuidGet})
    .table("jcv_blz_compilate")
    .join("jcv_users","jcv_users.jcv_id", "jcv_blz_compilate.jcv_blz_compilate_id_manager")
    .then( data => { return data })

    //Pegando quem separou
    var userSeparador = '';

    //console.log(getUUIDcompilates)
    if(getUUIDcompilates != ''){
        if(getUUIDcompilates[0].jcv_blz_compilate_separte_user != null){
            userSeparador = await database
            .select("jcv_users.jcv_userNamePrimary")
            .where({jcv_id: getUUIDcompilates[0].jcv_blz_compilate_separte_user})
            .table("jcv_users")
            .then( data => {
                //console.log(data)
                return data[0].jcv_userNamePrimary
            })
        }
    
        //console.log(uuidGet)
    
        if(getUUIDcompilates != ''){
            var page = "beleza/compilateInfo";
            res.render("panel/index", {page: page, getUUIDcompilates: getUUIDcompilates, userSeparador: userSeparador, PAINEL_URL: PAINEL_URL})
        }else{
            res.cookie('SYSTEM-NOTIFICATIONS-MODULE', `{"typeMsg": "error","message":"Nenhuma informação encontrada","timeMsg": 3000}`);
            res.redirect("/painel/beleza/solicitacoes");
        }
    }else{
        res.cookie('SYSTEM-NOTIFICATIONS-MODULE', `{"typeMsg": "error","message":"Nenhuma informação encontrada","timeMsg": 3000}`);
        res.redirect("/painel/beleza/solicitacoes");
    }

    

}

exports.compilateActionExpedicao = async (req,res) => {
    const uuidCompilate = req.body['button-action-expedicao-separacao'];

    const getStatus = await database
    .select()
    .where({jcv_blz_compilate_uuid: uuidCompilate})
    .table("jcv_blz_compilate")
    .then( data => {return data})

    if(getStatus != '' && getStatus[0].jcv_blz_compilate_status == 3){
        //UUid existente e o compilador esta com status 3{em separação}

        database
        .update({
            jcv_blz_compilate_status: 4,
            jcv_blz_compilate_separte_user: GLOBAL_DASH[0]
        })
        .where({jcv_blz_compilate_uuid: uuidCompilate})
        .table("jcv_blz_compilate")
        .then( dataResult => {
            if(dataResult == 1){
                //Registrando os compilados
                //Pegando os UUID dos pedidos



                let arrayConvert
                database
                .select('sys_blz_requestCode')
                .whereRaw(`sys_blz_id in (${JSON.parse(getStatus[0].jcv_blz_compilate_ids)})`)
                .table("jcv_blz_orders")
                .then( dataGetUUID => {
                    dataGetUUID.forEach(element => {
                        registerLogCompilate(element.sys_blz_requestCode, 4)
                    });
                })

                //Atualizando o status do pedido
                database
                .update({
                    sys_blz_requestStatus: 4
                })
                .whereRaw(`sys_blz_id in (${JSON.parse(getStatus[0].jcv_blz_compilate_ids)})`)
                .table("jcv_blz_orders")
                .then( data => {
                    //Okay
                })





                res.cookie('SYSTEM-NOTIFICATIONS-MODULE', `{"typeMsg": "success","message":"Status alterado com sucesso para <b>SEPARADO</b>","timeMsg": 3000}`);
                res.redirect("/painel/beleza/compilate/"+uuidCompilate);
            }else{
                res.cookie('SYSTEM-NOTIFICATIONS-MODULE', `{"typeMsg": "error","message":"Erro ao processar este compilado","timeMsg": 3000}`);
                res.redirect("/painel/beleza/compilate/"+uuidCompilate);
            }
        })

    }else{
        res.cookie('SYSTEM-NOTIFICATIONS-MODULE', `{"typeMsg": "error","message":"Dados inexistentes","timeMsg": 3000}`);
        res.redirect("/painel/beleza/compilate/"+uuidCompilate);
    }

}

exports.compilateActionExpedicaoDespacho = async (req,res) => {
    const uuidCompilate = req.body['button-action-expedicao-despacho'];
    const observations = req.body['button-action-expedicao-obs'];

    const getStatus = await database
    .select()
    .where({jcv_blz_compilate_uuid: uuidCompilate})
    .table("jcv_blz_compilate")
    .then( data => {return data})

    if(getStatus != '' && getStatus[0].jcv_blz_compilate_status == 4){
        //UUid existente e o compilador esta com status 4{Separado}

        database
        .update({
            jcv_blz_compilate_status: 5,
            jcv_blz_compilate_obs: observations
        })
        .where({jcv_blz_compilate_uuid: uuidCompilate})
        .table("jcv_blz_compilate")
        .then( dataResult => {
            if(dataResult == 1){

                //Registrando os compilados
                //Registrando os compilados
                //Pegando os UUID dos pedidos





                database
                .select('sys_blz_requestCode')
                .whereRaw(`sys_blz_id in (${JSON.parse(getStatus[0].jcv_blz_compilate_ids)})`)
                .table("jcv_blz_orders")
                .then( dataGetUUID => {
                    dataGetUUID.forEach(element => {
                        registerLogCompilate(element.sys_blz_requestCode, 5) 
                    });
                })

                //Atualizando o status do pedido
                database
                .update({
                    sys_blz_requestStatus: 5
                })
                .whereRaw(`sys_blz_id in (${JSON.parse(getStatus[0].jcv_blz_compilate_ids)})`)
                .table("jcv_blz_orders")
                .then( data => {
                    //Okay
                })







                res.cookie('SYSTEM-NOTIFICATIONS-MODULE', `{"typeMsg": "success","message":"Status alterado com sucesso para <b>DESPACHADO</b>","timeMsg": 3000}`);
                res.redirect("/painel/beleza/compilate/"+uuidCompilate);
            }else{
                res.cookie('SYSTEM-NOTIFICATIONS-MODULE', `{"typeMsg": "error","message":"Erro ao processar este compilado","timeMsg": 3000}`);
                res.redirect("/painel/beleza/compilate/"+uuidCompilate);
            }
        })

    }else{
        res.cookie('SYSTEM-NOTIFICATIONS-MODULE', `{"typeMsg": "error","message":"Dados inexistentes","timeMsg": 3000}`);
        res.redirect("/painel/beleza/compilate/"+uuidCompilate);
    }

}

exports.compilateActionExpedicaoColeta = async (req,res) =>{

    const uuidCompilate = req.body['button-action-expedicao-coletar'];

    const getStatus = await database
    .select()
    .where({jcv_blz_compilate_uuid: uuidCompilate})
    .table("jcv_blz_compilate")
    .then( data => {return data})

    if(getStatus != '' && getStatus[0].jcv_blz_compilate_status == 5 && getStatus[0].jcv_blz_compilate_id_manager == GLOBAL_DASH[0]){
        //UUid existente e o compilador esta com status 4{Separado}

        database
        .update({
            jcv_blz_compilate_status: 6,
        })
        .where({jcv_blz_compilate_uuid: uuidCompilate})
        .table("jcv_blz_compilate")
        .then( dataResult => {
            if(dataResult == 1){
                //Registrando os compilados
                //Pegando os UUID dos pedidos





                database
                .select('sys_blz_requestCode')
                .whereRaw(`sys_blz_id in (${JSON.parse(getStatus[0].jcv_blz_compilate_ids)})`)
                .table("jcv_blz_orders")
                .then( dataGetUUID => {
                    dataGetUUID.forEach(element => {
                        registerLogCompilate(element.sys_blz_requestCode, 6) 
                    });
                })

                //Atualizando o status do pedido
                database
                .update({
                    sys_blz_requestStatus: 6
                })
                .whereRaw(`sys_blz_id in (${JSON.parse(getStatus[0].jcv_blz_compilate_ids)})`)
                .table("jcv_blz_orders")
                .then( data => {
                    //Okay
                })






                res.cookie('SYSTEM-NOTIFICATIONS-MODULE', `{"typeMsg": "success","message":"Status alterado com sucesso para <b>RECEBIDO PELO GESTOR</b>","timeMsg": 3000}`);
                res.redirect("/painel/beleza/compilate/"+uuidCompilate);
            }else{
                res.cookie('SYSTEM-NOTIFICATIONS-MODULE', `{"typeMsg": "error","message":"Erro ao processar este compilado","timeMsg": 3000}`);
                res.redirect("/painel/beleza/compilate/"+uuidCompilate);
            }
        })

    }else{
        res.cookie('SYSTEM-NOTIFICATIONS-MODULE', `{"typeMsg": "error","message":"Somente o gestor pode coletar estas solicitações","timeMsg": 3000}`);
        res.redirect("/painel/beleza/compilate/"+uuidCompilate);
    }

}

function registerLogCompilate(uuidRequest, statusCode){
    database
    .insert({
        jcv_blz_status_uuid_request: uuidRequest,
        jcv_blz_status_type: statusCode,
        jcv_blz_status_date: generateDate()
    })
    .table("jcv_blz_status_log")
    .then( data => {
        //Okay
    })
}

exports.compilateGeneratePDF = async (req,res) => {
    const uuidGet = req.params.uuid

    //Pegando dados deste compilado
    const getStatus = await database
    .select("jcv_blz_compilate.*","jcv_users.jcv_userNamePrimary")
    .where({jcv_blz_compilate_uuid: uuidGet})
    .table("jcv_blz_compilate")
    .join("jcv_users","jcv_users.jcv_id", "jcv_blz_compilate.jcv_blz_compilate_id_manager")
    .then( data => {return data})

    if(getStatus != ''){

        res.render('panel/beleza/modelGenerateEtiqueta', {getStatus: getStatus})

    }else{
        res.cookie('SYSTEM-NOTIFICATIONS-MODULE', `{"typeMsg": "error","message":"Nada encontrado","timeMsg": 3000}`);
        res.redirect("/painel/beleza/solicitacoes");
    }
}

async function exportsEtiquetasQR (idsRequests,req ,res){

    //Pegando somente os gestores das solitações e mes
    const getManager = await database
    .select('sys_blz_userManager','sys_blz_requestReference')
    .distinct('sys_blz_userManager')
    .whereIn('sys_blz_id', idsRequests)
    .table("jcv_blz_orders")
    .then( data => {

        //Verificando se todos eles são do mesmo mes, caso não seja um erro será exibido
        let error = false;
        let monthFirst = data[0].sys_blz_requestReference;
        for (let i = 0; i < data.length; i++) {
            if(data[i].sys_blz_requestReference != monthFirst){
                error = true;
                i = data.length
            }

        }

        //console.log(error)

        if(error == false){
            let result = data.map(functionConv);
            function functionConv(value){
                return value.sys_blz_userManager
            }
    
            return result 
        }else{
            return error;
        }
    })

    //console.log(getManager)

    //console.log(getManager)

    //Verificando se estes pedidos possuem o compilado

    //Verificando se deu erro nos pedidos
    if(typeof(getManager) != 'object'){
        res.cookie('SYSTEM-NOTIFICATIONS-MODULE', `{"typeMsg": "error","message":"Para consultar e gerar os QR CODES é necessário as solicitações serem do mesmo mes","timeMsg": 6000}`);
        res.redirect("/painel/beleza/solicitacoes");
    }else{
        const getCompilado = await database
        .select('jcv_users.jcv_userNamePrimary','jcv_blz_compilate.*')
        .whereIn('jcv_blz_compilate_id_manager', getManager)
        .table("jcv_blz_compilate")
        .join("jcv_users","jcv_blz_compilate.jcv_blz_compilate_id_manager", "jcv_users.jcv_id")
        .then( data => {return data})
    
        if(getCompilado != ''){

            //Pegando data da geração
            const dateGenerate = generateDate()

            //Dados achados
            res.render("panel/beleza/modelGenerateEtiqueta", {getCompilado: getCompilado, dateGenerate: dateGenerate})
            //console.log()
        }else{
            res.cookie('SYSTEM-NOTIFICATIONS-MODULE', `{"typeMsg": "error","message":"Nenhum dado foi encotrado. Certifique-se que as solicitações passou pelo status <b>EM SEPARAÇÃO</b>","timeMsg": 6000}`);
            res.redirect("/painel/beleza/solicitacoes");
        }

    }

}

exports.viewStatus = async (req,res) => {
    const uuidGet = req.params.uuid;

    //Pegando as informações
    const getData = await database
    .select('jcv_blz_orders.*','jcv_users.jcv_userNamePrimary')
    .where({sys_blz_requestCode: uuidGet})
    .table("jcv_blz_orders")
    .join("jcv_users","jcv_users.jcv_id","jcv_blz_orders.sys_blz_userManager")
    .then( data => {return data})

    //Pegando quem criou
    let getPerson = '';
    if(typeof(getData) != 'undefined'){
        getPerson = await database
        .select('jcv_userNamePrimary')
        .where({jcv_id: getData[0].sys_blz_userId})
        .table("jcv_users")
        .then( data => {return data})
    }

    //Pegando os logs
    const getLog = await database
    .select()
    .where({jcv_blz_status_uuid_request: uuidGet})
    .table("jcv_blz_status_log")
    .orderBy("jcv_blz_status_id","DESC")
    .then( data => {return data})

    //Pegando os dados do compilador
    const getComp = await database
    .raw("SELECT * from jcv_blz_compilate WHERE JSON_CONTAINS(jcv_blz_compilate_ids, '"+getData[0].sys_blz_id+"', '$') AND jcv_blz_compilate_month_reference = '"+getData[0].sys_blz_requestReference+"' ")
    .then( data => {return data[0]})


    var page = "beleza/viewStatus";
    res.render("panel/index", {page: page, getLog: getLog, getData: getData, getPerson:getPerson, getComp: getComp})

}