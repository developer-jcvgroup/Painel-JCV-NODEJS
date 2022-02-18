const database = require("../../database/database");
const getPermissions = require("../../middlewarePermissions");
const fs = require('fs');

//Sistema de emails
const emailSystemExe = require('../system/emailSystem');

const moment = require("moment");
moment.tz.setDefault('America/Sao_Paulo');

//URL arquivos para download
const URLdownloads = 'public/panel/downloads/beleza/';

//Data atual
function generateDate(){
    moment.locale('pt-br');
    return moment().format('LT')+" "+moment().format('L')
}


//Chave aleatorio
function generateStrigRadom(tamanho) {
    var stringAleatoria = 'JCV-';
    var caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (var i = 0; i < tamanho; i++) {
        stringAleatoria += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
    }
    return stringAleatoria;
}

exports.listAllinformations = async (req,res) => {

    //Pegando os itens
    const resultItems = await database.select().where({sys_req_itemEnabled: 1}).table("jcv_req_items").then( data => {

        let arrayData = [];
        data.forEach(element => {
            let convert = element.sys_req_itemId+" - "+element.sys_req_itemName;
            arrayData.push(convert)
        });
        return arrayData;
    })

    var page = "requisitor/novaRequisicao";
    res.render("panel/index", {page: page, arrayItems: resultItems})
}

exports.createOrder = async(req,res) => {

    const arraYnamesItems = req.body['req-input-list-item-table'];

    //Validando se existe itens no pedido
    if(arraYnamesItems != undefined){
        
        //Pegando a quantidade de cada item e a observação
        const arraYamountsItems = req.body['req-input-list-amount-table'];
        const nodeOrder = req.body['req-input-node-order'];

        //Tranformando ou não os nomes e quantidades em arrays ou string
        let namesItems = [];
        let amountsItems = [];

        let errorArray = [];//Lista os ids do pedido que der erro
        const keyOperation = await generateStrigRadom(25);

        if(typeof(arraYnamesItems) != 'object'){
            namesItems.push(arraYnamesItems);
        }else{
            namesItems = arraYnamesItems;
        }

        if(typeof(arraYamountsItems) != 'object'){
            amountsItems.push(arraYamountsItems);
        }else{
            amountsItems = arraYamountsItems;
        }
        
        //Criando um array com nome dos itens e quantidades
        let newArray = [];
        for (let i = 0; i < namesItems.length; i++) {
            let arr = [namesItems[i], amountsItems[i]]
            newArray.push(arr);
        }

        //Percorrendo array com o nome e quantidade dos itens
        newArray.forEach(element => {

            //Validando se cada item existe e é ativo
            database.select("sys_req_itemId","sys_req_itemName").where({sys_req_itemEnabled: 1, sys_req_itemName: element[0]}).table("jcv_req_items").then( data => {
                if(data != ""){
                    //item existe
                    //Inserindo os itens na tabela de itens do pedido
                    database.insert({
                        sys_req_item_orderId: 0,
                        sys_req_item_userId: GLOBAL_DASH[0],
                        sys_req_item_itemId: data[0].sys_req_itemId,
                        sys_req_item_itemName: data[0].sys_req_itemName,
                        sys_req_item_itemAmount: element[1],
                        sys_req_item_amountReceived: null,
                        sys_req_item_keyOperation: keyOperation
                    }).table("jcv_req_orders_items").then( result => {
                        //Pedido inserido com sucesso
                    })
                }else{
                    //item não existe
                    errorArray.push(element);//Adicionando o item do array de erro
                }
            })
        });

        //Criando o pedido
        const idOrder = await database.insert({
            sys_req_userId: GLOBAL_DASH[0],
            sys_req_userName: GLOBAL_DASH[1],
            sys_req_userManager: GLOBAL_DASH[4],
            sys_req_userUnity: GLOBAL_DASH[2],
            sys_req_orderEmitter: generateDate(),
            sys_req_orderTotalItems: namesItems.length,
            sys_req_orderNode: nodeOrder,
            sys_req_orderStatus: 1,
            sys_req_orderKeyOperation: keyOperation
        }).table("jcv_req_orders").then( result => {
            if(result > 0){
                return result;//retornando
            }
        })

        //Inserindo o id na tabela de itens do pedido
        database.update({sys_req_item_orderId: idOrder}).where({sys_req_item_keyOperation: keyOperation}).table("jcv_req_orders_items").then( result => {
            //console.log(result);
        })
        
        //Caso tenha algum erro na insersão de itens do pedido
        if(errorArray.length > 0){
            res.cookie('SYS-NOTIFICATION-EXE1', "SYS02| Os itens: "+errorArray+" não puderam ser adicionados, requisição regsitrada!.");
            res.redirect("/painel/requisitor/VisualizarRequisicao/"+idOrder);
        }else{


            //Mandando email para o usuario
            database
                .select("jcv_userEmailCorporate")
                .where({jcv_id: GLOBAL_DASH[0], jcv_sysEmail: 1})
                .table("jcv_users")
                .then( data => {
                    
                    if(data != ''){
                        //Sistema de email: USUARIO
                        const textOne = 'Requisição criada com sucesso!';
                        const textTwo = `Id da requisição é <b>#${idOrder}</b>. <br> Status: <b>Requisição Efetuada.</b><br><br> Sua solicitação foi enviada para os administradores,
                        qualquer operação feita em sua requição um email será enviado para você.`;
                        emailSystemExe.sendMailExe(data[0].jcv_userEmailCorporate, 'Requisição concluida', 'Requisição feita com sucesso', 'Requisitor de Materiais', GLOBAL_DASH[1], textOne, textTwo);
                    }
            })

            //Email para os ADMINS do sistema
            database
            .select("jcv_users.jcv_userEmailCorporate")
            .where({sys_req_perm_admin: 1, jcv_sysEmail: 1})
            .table("jcv_users_permissions")
            .join('jcv_users', 'jcv_users_permissions.sys_perm_idUser', '=', 'jcv_users.jcv_id')
            .then( data => {

                if(data != ''){
                    //Transformando em array
                    let arrMail = []
                    for(let index = 0; index < data.length; index++){
                        arrMail.push(data[index].jcv_userEmailCorporate)
                    }

                    //Sistema de email: ADMIN
                    const textOne = 'Uma nova requisição foi criada. Segue dados abaixo:';
                    const textTwo = `Id da requisição é <b>#${idOrder}</b>. <br> Status: <b>Requisição Efetuada.</b><br> Solicitante: <b>${GLOBAL_DASH[1]}</b> <br>`;
                    emailSystemExe.sendMailExe(arrMail, 'Nova requisição', 'Nova Requisição', 'Requisitor de Materiais', 'Administradores', textOne, textTwo);
                }
                
            })

            res.cookie('SYS-NOTIFICATION-EXE1', "SYS01| Requisição realizada com sucesso. #"+idOrder+"!");
            res.redirect("/painel/requisitor/VisualizarRequisicao/"+idOrder);
            
        }
    }else{
        res.cookie('SYS-NOTIFICATION-EXE1', "SYS03| Insira ao menos um item na requisição.");
        res.redirect("/painel/requisitor/Novo")
    }

}

exports.viewRequest = async (req,res) => {

    //Verificando se o id foi inserido no HTTP
    if(req.params.id == undefined){
        res.cookie('SYS-NOTIFICATION-EXE1', "SYS02| Informe um pedido válido!");
        res.redirect("/painel")
    }else{

        //Validando o usuario, se for admin ele pode ter acesso a requisição
        const validateUser = await database.select("sys_req_perm_admin").where({sys_req_perm_admin: 1, sys_perm_idUser: GLOBAL_DASH[0]}).table("jcv_users_permissions").then( data => {
            if(data != ''){
                return true;
            }else{
                return false;
            }
        })

        //Pegando o id passado no parametro
        const idView = req.params.id;

        //Verificando se o usuario que esta tentando visualizar o pedido é admin
        if(validateUser == true){
            //É admin
 
            //Validando o id
            const orderSearch = await database.select().where({sys_req_idOne: idView}).table("jcv_req_orders").then( data => {
                return data;
            })

            //Verificando se foi encontrado
            if(orderSearch == ""){
                res.cookie('SYS-NOTIFICATION-EXE1', "SYS02| Nenhum pedido encontrado.");
                res.redirect("/painel/requisitor/ListaRequisicoes")
            }else{
                //Buscando os itens do pedido
                const orderSearchItems = await database.select().where({sys_req_item_orderId: idView}).table("jcv_req_orders_items").then( data => {
                    return data;
                })

                var page = "requisitor/viewRequisicao";
                res.render("panel/index", {page: page, arrayOrderItem: orderSearchItems, arrayOrderInfo: orderSearch})
            }

        }else{
            //Não é admin

            //Validando o id com base no id do usuario
            const orderSearch = await database.select().where({sys_req_idOne: idView, sys_req_userId: GLOBAL_DASH[0]}).table("jcv_req_orders").then( data => {
                return data;
            })

            //Verificando se foi encontrado
            if(orderSearch == ""){
                res.cookie('SYS-NOTIFICATION-EXE1', "SYS02| Nenhum pedido encontrado.");
                res.redirect("/painel/requisitor/minhasRequisicoes")
            }else{
                //Buscando os itens do pedido
                const orderSearchItems = await database.select().where({sys_req_item_orderId: idView, sys_req_item_userId: GLOBAL_DASH[0]}).table("jcv_req_orders_items").then( data => {
                    return data;
                })

                var page = "requisitor/viewRequisicao";
                res.render("panel/index", {page: page, arrayOrderItem: orderSearchItems, arrayOrderInfo: orderSearch})
            }
        }
    }
}

exports.viewDownloadOrder = async (req,res) => {
    //Pegando o id
    const id = req.body['button-view-action-download'];

    //Importando os dados para gerar excel
    const xl = require('excel4node');
    const wb = new xl.Workbook();
    const ws = wb.addWorksheet('Worksheet Name');

    //Buscando os pedidos
    const arryaDataSet = await database
    .select("jcv_req_orders_items.sys_req_item_orderId","jcv_users.jcv_userNamePrimary","jcv_unitys.sys_unity_name","jcv_req_orders_items.sys_req_item_itemId",
    "jcv_req_orders_items.sys_req_item_itemName","jcv_req_orders_items.sys_req_item_itemAmount")
    .table("jcv_req_orders_items")
    .join('jcv_unitys', 'jcv_req_orders_items.sys_req_item_userId', '=', 'jcv_unitys.sys_unity_id')
    .join('jcv_users', 'jcv_req_orders_items.sys_req_item_userId', '=', 'jcv_users.jcv_id')
    .whereRaw("jcv_req_orders_items.sys_req_item_orderId IN ("+id+")")
    .then( data => {
        return data
    })
    
    //Criando os titulo das colunas da planilha
    const headingColumnNames = [
        "ID Pedido",
        "Solicitante",
        "Unidade",
        "ID Item",
        "Item",
        "Quantidade"
    ]

    //Configurando a planilha
    let headingColumnIndex = 1; //diz que começará na primeira linha
    headingColumnNames.forEach(heading => { //passa por todos itens do array
        // cria uma célula do tipo string para cada título
        ws.cell(1, headingColumnIndex++).string(heading);
    });

    //Quando começa a inserir os itens na planilha
    let rowIndex = 2;
    arryaDataSet.forEach( record => {
        let columnIndex = 1;
        Object.keys(record).forEach(columnName =>{

            //Verificando se o dado é numero
            if(typeof(record[columnName]) === 'number'){

                //Convertendo o id do pedido para string
                record[columnName] = ""+record[columnName]+"";

                ws.cell(rowIndex,columnIndex++)
                .string(record [columnName])
            }else{
                ws.cell(rowIndex,columnIndex++)
                .string(record [columnName])
            }
        });
        rowIndex++;
    }); 

    //Gerando caracteres aleatorios e exportando a requisição
    const caracteresAleatorios = Math.random().toString(36).substring(5);
    const nameData = 'EXPORT-REQUISICAO-'+caracteresAleatorios;

    wb.write(nameData+'.xlsx', res);//o res faz o download
}






exports.sendRequests = async (req,res) => {
    const idsArray = req.params.idsOrders.split(',');

    //Pegando os itens de cada pedido
    const allOrderItems = await database.select().whereIn('sys_req_item_orderId', idsArray).table("jcv_req_orders_items").then( data => {
        return data;
    })


    var page = "requisitor/enviarRequisicoes";
    res.render("panel/index", {page: page, allOrderItems: allOrderItems})
}











/* exports.receberRequisicao = async (req,res) => {

    //Validando o id passado no HTTP
    if(req.params.id == undefined){
        res.cookie('SYS-NOTIFICATION-EXE1', "SYS02| Informe um pedido válido!");
        res.redirect("/painel/requisitor/ListaRequisicoes")
    }else{

        //Validando o usuario, se for admin ele pode ter acesso a VER E EDITAR A REQUISIÇÃO
        const validateUser = await database.select("sys_req_perm_admin").where({sys_req_perm_admin: 1, sys_perm_idUser: GLOBAL_DASH[0]}).table("jcv_users_permissions").then( data => {
            if(data != ''){
                return true;
            }else{
                return false;
            }
        })

        //Validando se é admin ou usuario
        if(validateUser == true){
            //É admin

            //Pegando o id passado
            const idView = req.params.id;

            //Validando a requisição
            const orderSearch = await database.select().where({sys_req_idOne: idView}).table("jcv_req_orders").then( data => {
                return data;
            })

            if(orderSearch == ""){
                res.cookie('SYS-NOTIFICATION-EXE1', "SYS03| Você não pode receber a requisição de outro usuario.");
                res.redirect("/painel/requisitor/ListaRequisicoes")
            }else{
                //buscando os itens do pedido
                const orderSearchItems = await database.select().where({sys_req_item_orderId: idView}).table("jcv_req_orders_items").then( data => {
                    return data;
                })

                if(orderSearch[0].sys_req_orderStatus == 3){
                    res.cookie('SYS-NOTIFICATION-EXE1', "SYS01| Requisição recebida com sucesso!");
                }

                var page = "requisitor/receberRequisicao";
                res.render("panel/index", {page: page, arrayOrderItem: orderSearchItems, arrayOrderInfo: orderSearch})
            }
        }else{
            //Não é admin

            //Pegando o id passado
            const idView = req.params.id;

            //Validando a requisição
            const orderSearch = await database.select().where({sys_req_idOne: idView, sys_req_userId: GLOBAL_DASH[0]}).table("jcv_req_orders").then( data => {
                return data;
            })

            if(orderSearch == ""){
                res.cookie('SYS-NOTIFICATION-EXE1', "SYS03| Nenhuma requisição encontrada.");
                res.redirect("/painel/requisitor/ListaRequisicoes")
            }else{
                //buscando os itens do pedido
                const orderSearchItems = await database.select().where({sys_req_item_orderId: idView, sys_req_item_userId: GLOBAL_DASH[0]}).table("jcv_req_orders_items").then( data => {
                    return data;
                })

                if(orderSearch[0].sys_req_orderStatus == 3){
                    res.cookie('SYS-NOTIFICATION-EXE1', "SYS01| Requisição já finalizada!");
                }

                var page = "requisitor/receberRequisicao";
                res.render("panel/index", {page: page, arrayOrderItem: orderSearchItems, arrayOrderInfo: orderSearch})
            }
        }

    }
} */
/* 
exports.receberRequisicaoAction = async (req,res) => {

    //Pegando o id da requisição
    const idOrder = req.body['btn-finalizar-order'];

    //Pegando o id dos itens do pedido
    const idsItems = req.body['received-ids-orders'];

    //Pegando a quantidade solicitada pelo usuario
    let amountOrder = typeof(req.body['received-order-amount']) == 'object' ? req.body['received-order-amount'] : req.body['received-order-amount'].split();

    //Pegando a quantidade da quantidade recebida pelo usuario
    let amountReceiveds = typeof(req.body['received-input-amount']) == 'object' ? req.body['received-input-amount'] : req.body['received-input-amount'].split();

    //Validando se este pedido pode ser recebido com base no status 5,6 retorna o pedido ou false
    const validateOrder = await database.select().whereRaw("sys_req_idOne = "+idOrder+" AND sys_req_orderStatus in (5,6,3)").table("jcv_req_orders").then( data => {
        if(data != ''){
            //console.log(data);
            return data[0].sys_req_orderStatus;
        }else{
            return false;
        }
    })

    //Validando se o status condiz com o recebimento da requisição
    if(validateOrder == 5 || validateOrder == 6){

        //Array de erros
        let arrayError = [];

        //Percorrendo a quantidade que foi recebida
        for(let i = 0; i < amountReceiveds.length; i++){

            parseInt(amountOrder[i]);//Tranformando em int

            //Varifica se a quantidade do pedido é igual a recebida
            if(amountOrder[i] == amountReceiveds[i]){

                //Caso a quantidade seja igual a quantidade recebida e inserida
                database.update({sys_req_item_amountReceived: amountReceiveds[i]}).where({sys_req_item_orderId: idOrder, sys_req_item_itemAmount: amountOrder[i], sys_req_item_itemId: idsItems[i]}).table("jcv_req_orders_items").then( result => {
                    //Update feito com sucesso
                })
            }else{
                //Caso a quantidade do pedido seja diferente do pedido
                
                //Inserido o id do item em um array de itens quem não batem
                arrayError.push(idsItems[i]);
                
                //Se o item recebido não for inserido nenhuma quantidade ele se tornara nulo
                amountReceiveds[i] = amountReceiveds[i] == "" ? amountReceiveds[i] == null : amountReceiveds[i];

                //Inserindo a quantidade recebida no item
                database.update({sys_req_item_amountReceived: amountReceiveds[i]}).where({sys_req_item_orderId: idOrder, sys_req_item_itemAmount: amountOrder[i], sys_req_item_itemId: idsItems[i]}).table("jcv_req_orders_items").then( result => {
                    //Update feito com sucesso
                })
            }
        }

        //Verificando se teve algum item que não bateu com a quantida do pedido
        if(arrayError.length > 0){

            //Tem itens que não batem, então o pedido altera o status para PENDENTE 
            database.update({sys_req_orderStatus: 5}).where({sys_req_idOne: idOrder, sys_req_userId: GLOBAL_DASH[0]}).table("jcv_req_orders").then( result => {
                //Update feito com sucesso
            })

            res.cookie('SYS-NOTIFICATION-EXE1', "SYS02| Existe itens pendentes em seu pedido!.");
            res.redirect("/painel/requisitor/ReceberRequisicao/"+idOrder)

        }else {
            //Todos os itens bateram com a quantidade recebida e a quantidade do pedido

            //Buscando o status do pedido para validar se ele já foi finalizado ou não
            const resultConsulta = await database.select("sys_req_orderStatus").where({sys_req_idOne: idOrder, sys_req_userId: GLOBAL_DASH[0]}).table("jcv_req_orders").then( data => {
                return data;
            })

            //Validando o status do pedido
            if(resultConsulta[0].sys_req_orderStatus == 6 || resultConsulta[0].sys_req_orderStatus == 5){

                //Alterando o status para finalizado
                database.update({sys_req_orderStatus: 3}).where({sys_req_idOne: idOrder, sys_req_userId: GLOBAL_DASH[0]}).table("jcv_req_orders").then( result => {
                    //Update feito com sucesso
                })

                ////////////////////////////////////////////////////////////
                ////////////////////////////////////////////////////////////
                //Mandando email para o USUARIO
                database.select("jcv_userEmailCorporate").where({jcv_id: GLOBAL_DASH[0], jcv_sysEmail: 1}).table("jcv_users").then( data => {
                    if(data != ''){
                        //Sistema de email: USUARIO
                        const textOne = 'Requisição finalizada com sucesso!';
                        const textTwo = `A requisição id: <b>#${idOrder}</b> foi finalizada com sucesso!. Um e-mail para os administradores foi enviado com sucesso.`;
                        emailSystemExe.sendMailExe(data[0].jcv_userEmailCorporate, 'Requisição finalizada', 'Requisição finalizada', 'Requisitor de Materiais', GLOBAL_DASH[1], textOne, textTwo);
                    }
                
                })

                ////////////////////////////////////////////////////////////
                ////////////////////////////////////////////////////////////
                //Email para os ADMINS do sistema
                database
                .select("jcv_users.jcv_userEmailCorporate")
                .where({sys_req_perm_admin: 1, jcv_sysEmail: 1})
                .table("jcv_users_permissions")
                .join('jcv_users', 'jcv_users_permissions.sys_perm_idUser', '=', 'jcv_users.jcv_id')
                .then( data => {

                    if(data != ''){
                        //Transformando em array
                        let arrMail = []
                        for(let index = 0; index < data.length; index++){
                            arrMail.push(data[index].jcv_userEmailCorporate)
                        }

                        //Sistema de email: ADMIN
                        const textOne = 'Uma requisição foi finalizada, segue dados abaixo';
                        const textTwo = `A requisição <b>#${idOrder}</b> do usuario <b>${GLOBAL_DASH[1]}</b> foi finalizado com sucesso as ${generateDate()}<br>`;
                        emailSystemExe.sendMailExe(arrMail, 'Requisição finalizada', 'Requisição finalizada', 'Requisitor de Materiais', 'Administradores', textOne, textTwo);
                    }

                })
        

                ////
                res.cookie('SYS-NOTIFICATION-EXE2', "SYS01| Requisição finalizada com sucesso!.");
                res.redirect("/painel/requisitor/ReceberRequisicao/"+idOrder)
            }else{
                res.cookie('SYS-NOTIFICATION-EXE2', "SYS03| Requisição já finalizada.");
                res.redirect("/painel/requisitor/ReceberRequisicao/"+idOrder)
            }
        }
    }else{
        if(validateOrder == 3){
            res.cookie('SYS-NOTIFICATION-EXE2', "SYS03| Você não pode mais receber esta requisição.");
            res.redirect("/painel/requisitor/ReceberRequisicao/"+idOrder)
        }else{
            res.cookie('SYS-NOTIFICATION-EXE2', "SYS03| Você ainda não pode receber esta requisição.");
            res.redirect("/painel/requisitor/ReceberRequisicao/"+idOrder)
        }
    }
} */

/* exports.receberRequisicaoActionForce = async (req,res) => {

    //Pegando o id do pedido
    const idOrder = req.body['btn-force-finalizar-order'];

    //Consultando se a requisição existe e retorna
    const resultConsulta = await database.select("sys_req_orderStatus").where({sys_req_idOne: idOrder, sys_req_userId: GLOBAL_DASH[0]}).table("jcv_req_orders").then( data => {
        return data;
    })

    //Validando se o pedido esta com o status 6 e 5
    if(resultConsulta[0].sys_req_orderStatus == 6 || resultConsulta[0].sys_req_orderStatus == 5){

        //Finalizando o pedido
        database.update({sys_req_orderStatus: 3}).where({sys_req_idOne: idOrder, sys_req_userId: GLOBAL_DASH[0]}).table("jcv_req_orders").then( result => {
            //Update com sucesso
        })

        ////////////////////////////////////////////////////////////
        ////////////////////////////////////////////////////////////
        //Mandando email para o USUARIO
        database.select("jcv_userEmailCorporate").where({jcv_id: GLOBAL_DASH[0], jcv_sysEmail: 1}).table("jcv_users").then( data => {
            if(data != ''){
                //Sistema de email: USUARIO
                const textOne = 'Requisição finalizada com sucesso!';
                const textTwo = `A requisição id: <b>#${idOrder}</b> foi finalizada com sucesso!. Um e-mail para os administradores foi enviado com sucesso.`;
                emailSystemExe.sendMailExe(data[0].jcv_userEmailCorporate, 'Requisição finalizada', 'Requisição finalizada', 'Requisitor de Materiais', GLOBAL_DASH[1], textOne, textTwo);
            }
        })

        ////////////////////////////////////////////////////////////
        ////////////////////////////////////////////////////////////
        //Email para os ADMINS do sistema
        database
        .select("jcv_users.jcv_userEmailCorporate")
        .where({sys_req_perm_admin: 1, jcv_sysEmail: 1})
        .table("jcv_users_permissions")
        .join('jcv_users', 'jcv_users_permissions.sys_perm_idUser', '=', 'jcv_users.jcv_id')
        .then( data => {

            if(data != ''){
                //Transformando em array
                let arrMail = []
                for(let index = 0; index < data.length; index++){
                    arrMail.push(data[index].jcv_userEmailCorporate)
                }

                //Sistema de email: ADMIN
                const textOne = 'Uma requisição foi finalizada, segue dados abaixo';
                const textTwo = `A requisição <b>#${idOrder}</b> do usuario <b>${GLOBAL_DASH[1]}</b> foi finalizado com sucesso as ${generateDate()}<br>`;
                emailSystemExe.sendMailExe(arrMail, 'Requisição finalizada', 'Requisição finalizada', 'Requisitor de Materiais', 'Administradores', textOne, textTwo);
            }
            
        })

        res.cookie('SYS-NOTIFICATION-EXE2', "SYS02| Requisição forçada finalizada com sucesso!.");
        res.redirect("/painel/requisitor/ReceberRequisicao/"+idOrder)
    }else{

        //A requsição não pode ser finalizada por conta do status
        res.cookie('SYS-NOTIFICATION-EXE2', "SYS03| Você ainda não pode forçar finalizar esta requisição.");
        res.redirect("/painel/requisitor/ReceberRequisicao/"+idOrder)
    }
} */

exports.listRequsicoesAll = async (req,res) => {
    //Colenanto as informações sobre usuarios, gestores e unidades para mandar pro front end

    //Buscando e retornando os usuarios que SAO GESTORES no sistema
    const allUsers = await database
    .select("jcv_users.jcv_id","jcv_users.jcv_userNamePrimary")
    .table("jcv_users")
    .join('jcv_users_permissions', 'jcv_users.jcv_id', '=', 'jcv_users_permissions.sys_perm_idUser')
    .whereRaw("jcv_users_permissions.sys_req_perm_use = 1")
    .then( data => {
        return data;
    })

    //Buscando e retornando as unidades
    const allUnitys = await database.select("sys_unity_id","sys_unity_name").where({sys_unity_enabled: 1}).table("jcv_unitys").then( data => {
        return data;
    })

    var page = "requisitor/listaRequisicao";
    res.render("panel/index", {page: page, arrayAllUsers: allUsers, arrayUnidades: allUnitys, resultSearchDataRequisitor: req.flash('resultSearchDataRequisitor')})
}

exports.actionSearchOrder = async (req,res) => {
    //Search dinamico

    //Validanddo e pegando os valores dos inputs dinamicos, caso o input não tenha nada ele
    //ira retornar 'LIKE '%%' para que na query ele seje ignorado
    let idSearch = req.body['all-id-search'] != "" ? '= '+req.body['all-id-search'] : "LIKE '%%'";

    let actionStatus = req.body['sys-filter-input-selects-status'] != undefined ? req.body['sys-filter-input-selects-status'] : "";
    let actionUsers = req.body['sys-filter-input-selects-users'] != undefined ? req.body['sys-filter-input-selects-users'] : "";
    let actionSector = req.body['sys-filter-input-selects-sector'] != undefined ? req.body['sys-filter-input-selects-sector'] : "";
    let actionUnitys = req.body['sys-filter-input-selects-unitys'] != undefined ? req.body['sys-filter-input-selects-unitys'] : ""; 

    //Caso o inputs esteje vazio, ele retornara 99999
    let actionAmountList = req.body['all-order-by-amount'] != 'all' ? req.body['all-order-by-amount'] : '99999';

    //Contando se os objetos é ou não maior ou igual a 1, caso não a quey Like entra no lugar
    if(actionStatus.length >= 1){
        actionStatus = "in ("+actionStatus+")";
    }else{
        actionStatus = "LIKE '%%'";   
    }

    if(actionUsers.length >= 1){
        actionUsers = "in ("+actionUsers+")";
    }else{
        actionUsers = "LIKE '%%'";
    }
    
    if(actionUnitys.length >= 1){
        actionUnitys = "in ("+actionUnitys+")";
    }else{
        actionUnitys = "LIKE '%%'";
    }


    //Fazendo a busca e retornando
    const resultSearch = await database
    .select("jcv_req_orders.sys_req_idOne","jcv_req_orders.sys_req_orderEmitter","jcv_req_orders.sys_req_userName","jcv_unitys.sys_unity_name",
    "jcv_req_orders.sys_req_orderTotalItems","jcv_req_orders.sys_req_orderStatus")
    .table("jcv_req_orders")
    .join('jcv_unitys', 'jcv_req_orders.sys_req_userUnity', '=', 'jcv_unitys.sys_unity_id')
    .join('jcv_users', 'jcv_req_orders.sys_req_userManager', '=', 'jcv_users.jcv_id')
    .whereRaw("jcv_req_orders.sys_req_idOne "+idSearch+" AND jcv_req_orders.sys_req_orderStatus "+actionStatus+" AND jcv_req_orders.sys_req_userUnity "+actionUnitys+" AND jcv_req_orders.sys_req_userId "+actionUsers+" ORDER BY sys_req_idOne DESC LIMIT "+actionAmountList)
    .then(data => {
        return data;
    })

    //Valida se o resultado foi vazio ou não
    if(resultSearch != ""){
        req.flash('resultSearchDataRequisitor', resultSearch)
        res.redirect("/painel/requisitor/ListaRequisicoes");
    }else{
        res.cookie('SYS-NOTIFICATION-EXE1', "SYS02| Nenhum registro encontrado.");
        res.redirect("/painel/requisitor/ListaRequisicoes");
    }

}

exports.actionCommandsORders = async(req,res) => {

    //Validando se o campo action é undefined
    if(req.body['order-action-command'] != undefined){
        
        //Validando se o input dos ids das requsições é undefined
        if(req.body['order-id-actions-all'] != undefined){
            //Pegando os ids e a ação
            const idsOrders = req.body['order-id-actions-all'];
            const actionCommand = req.body['order-action-command'];

            //Validando cada comando
            if(actionCommand == "CMD01"){
                //Status: Em separação
                modifiOrderStatus(req,res,idsOrders,"CMD01")
            }else if(actionCommand == "CMD02"){
                //Cancelar requisição
                modifiOrderStatus(req,res,idsOrders,"CMD02")
            }else if(actionCommand == "CMD03"){
                //Requisições enviadas

                modifiOrderStatus(req,res,idsOrders,"CMD03")

                //sendRequests(req,res,idsOrders);

                //modifiOrderStatus(req,res,idsOrders,"CMD03") ver e excluir
            }else if(actionCommand == "CMD04"){
                //Exportar Pedidos
                exportOrders(req,res,idsOrders);
            }else if(actionCommand == "CMD05"){
                //Exportar Soma de itens
                exportItemsOrdersTotal(req,res,idsOrders);
            }else if(actionCommand == "CMD06"){
                //Exportar itens dos pedidos
                exportItemsOrders(req,res,idsOrders);
            }else{
                res.cookie('SYS-NOTIFICATION-EXE1', "SYS03| Selecione alguma ação!");
                res.redirect("/painel/requisitor/ListaRequisicoes");
            }
        }else{
            res.cookie('SYS-NOTIFICATION-EXE1', "SYS03| Selecione algum pedido!");
            res.redirect("/painel/requisitor/ListaRequisicoes");
        }       
    }else{
        res.cookie('SYS-NOTIFICATION-EXE1', "SYS03| Selecione alguma ação!");
        res.redirect("/painel/requisitor/ListaRequisicoes");
    }
    
}

exports.listMyRequests = async (req,res) => {
    //Pagina que lista a requisição do usuario

    var page = "requisitor/minhasRequisicoes";
    res.render("panel/index", {page: page, resultSearchMyRequests: req.flash('resultSearchMyRequests')})
}

exports.searchMyRequest = async (req,res) => {

    //Search dinamico

    //Validanddo e pegando os valores dos inputs dinamicos, caso o input não tenha nada ele
    //ira retornar 'LIKE '%%' para que na query ele seje ignorado
    const idSearch = req.body['search-id-order'] != undefined ? 'in ('+req.body['search-id-order']+')' : "LIKE '%%'";
    const statusOrder = req.body['sys-filter-input-selects-status'] != undefined ? 'in ('+req.body['sys-filter-input-selects-status']+')' : "LIKE '%%'";
    const orderLimit = req.body['search-status-limit'] != undefined ? req.body['search-status-limit'] : '999';

    //Fazendo a busca e retornando
    const resultSearch = await database
    .select("jcv_req_orders.sys_req_idOne","jcv_req_orders.sys_req_orderEmitter","sys_req_userName","jcv_unitys.sys_unity_name",
    "jcv_req_orders.sys_req_orderTotalItems","jcv_req_orders.sys_req_orderStatus")
    .table("jcv_req_orders")
    .join('jcv_unitys', 'jcv_req_orders.sys_req_userUnity', '=', 'jcv_unitys.sys_unity_id')
    .join('jcv_users', 'jcv_req_orders.sys_req_userManager', '=', 'jcv_users.jcv_id')
    .whereRaw(" sys_req_userId = "+GLOBAL_DASH[0]+" AND jcv_req_orders.sys_req_idOne "+idSearch+" AND jcv_req_orders.sys_req_orderStatus "+statusOrder+" ORDER BY sys_req_idOne DESC LIMIT "+orderLimit)
    .then(data => {
        return data;
    })


    //Validando se a busca é vazia
    if(resultSearch != ""){
        req.flash('resultSearchMyRequests', resultSearch)
        res.redirect("/painel/requisitor/MinhasRequisicoes");
    }else{
        res.cookie('SYS-NOTIFICATION-EXE1', "SYS02| Nenhum registro encontrado.");
        res.redirect("/painel/requisitor/MinhasRequisicoes");
    }
}

exports.editRequestUser = async (req,res) => {

    //Validando o id passado no parametro
    if(req.params.id != undefined){

        //Validando o usuario, se for admin ele pode ter acesso a editar a requisição
        const validateUser = await database.select("sys_req_perm_admin").where({sys_req_perm_admin: 1, sys_perm_idUser: GLOBAL_DASH[0]}).table("jcv_users_permissions").then( data => {
            if(data != ''){
                return true;
            }else{
                return false;
            }
        })

        //Validando se é admin ou não
        if(validateUser == true){
            //É admin

            //Pegando o id do paremetro
            const id = req.params.id;

            //Validando o pedido e retornando o pedido ou false
            const result = await database.select("sys_req_idOne","sys_req_orderNode","sys_req_orderStatus").where({sys_req_idOne: id}).table("jcv_req_orders").then( data => {
                if(data != ""){
                    return data;
                }else{
                    return false;
                }
            })

            //Validando se o pedido existe
            if(result != false){

                //Validando e criando um cookie caso o status seja diferente de solicitado
                if(result[0].sys_req_orderStatus != 1){
                    res.cookie('SYS-NOTIFICATION-EXE1', "SYS03| Você não pode editar este pedido por conta do status atual dele.");
                    res.redirect("/painel/requisitor/ListaRequisicoes");
                }else{
                    //O pedido pode ser exibido

                    //Pegando os itens do requisitor, convertendo em um novo array e retornando
                    const resultItems = await database.select().where({sys_req_itemEnabled: 1}).table("jcv_req_items").then( data => {
                        let arrayData = [];//Novo array
                        data.forEach(element => {
                            let convert = element.sys_req_itemId+" - "+element.sys_req_itemName;
                            arrayData.push(convert)
                        });
                        return arrayData;
                    })

                    //Buscando os itens do pedido
                    await database.select().where({sys_req_item_orderId: id}).table("jcv_req_orders_items").then( data => {
                        var page = "requisitor/editRequisicao";
                        res.render("panel/index", {page: page, listItemsRequest: data, arrayItems: resultItems, infoOrder: result})
                    })
                }
            }else{
                res.cookie('SYS-NOTIFICATION-EXE1', "SYS03| Requisição não encontrada.");
                res.redirect("/painel/requisitor/ListaRequisicoes");
            }
        }else if(validateUser == false){
            //Não é admin

            //Pegando o id do paremetro
            const id = req.params.id;

            //Validando o pedido e retornando o pedido ou false
            const result = await database.select("sys_req_idOne","sys_req_orderNode","sys_req_orderStatus").where({sys_req_idOne: id, sys_req_userId: GLOBAL_DASH[0]}).table("jcv_req_orders").then( data => {    
                
                if(data != ""){
                    return data;
                }else{
                    return false;
                }
            })

            //Validando e criando um cookie caso o status seja diferente de solicitado
            if(result[0].sys_req_orderStatus != 1){
                res.cookie('SYS-NOTIFICATION-EXE1', "SYS03| Você não pode editar este pedido por conta do status atual dele.");
                res.redirect("/painel/requisitor/minhasRequisicoes");
            }else{
                //Validando se o pedido é do usuario ou não
                if(result != false){

                    //Pegando os itens do requisitor, convertendo em um novo array e retornando
                    const resultItems = await database.select().where({sys_req_itemEnabled: 1}).table("jcv_req_items").then( data => {
                        let arrayData = [];//Novo array
                        data.forEach(element => {
                            let convert = element.sys_req_itemId+" - "+element.sys_req_itemName;
                            arrayData.push(convert)
                        });
                        return arrayData;
                    })
                    
                    //Buscando os itens do pedido
                    await database.select().where({sys_req_item_orderId: id, sys_req_item_userId: GLOBAL_DASH[0]}).table("jcv_req_orders_items").then( data => {

                        var page = "requisitor/editRequisicao";
                        res.render("panel/index", {page: page, listItemsRequest: data, arrayItems: resultItems, infoOrder: result})

                    })

                }else{
                    res.cookie('SYS-NOTIFICATION-EXE1', "SYS03| Requisição não encontrada.");
                    res.redirect("/painel/requisitor/minhasRequisicoes");
                }
            }
        }
    }else{
        res.cookie('SYS-NOTIFICATION-EXE1', "SYS03| Requisição não encontrada.");
        res.redirect("/painel/requisitor/minhasRequisicoes");
    }
}

exports.editRequestUserCommand = async(req,res) => {
    const dateNow = generateDate();//Data Atual
    
    //Editando o pedido pegando o id, observação, itens e quantidade
    const idOrderUpdate = req.body['button-id-order-request'];
    const orderNode = req.body['edit-order-node-request'];
    const arraYnamesItems = req.body['req-input-list-item-table'];
    const arraYamountsItems = req.body['req-input-list-amount-table'];

    //Validando o usuario, se for admin ele pode ter acesso a editar a requisição
    const validateUser = await database.select("sys_req_perm_admin").where({sys_req_perm_admin: 1, sys_perm_idUser: GLOBAL_DASH[0]}).table("jcv_users_permissions").then( data => {
        if(data != ''){
            return true;
        }else{
            return false;
        }
    })

    //Validando o pedido, somente com o status 1 pode ser editado e retornando data ou false
    const ValidateRequest = await database.select().where({sys_req_idOne: idOrderUpdate, sys_req_orderStatus: 1}).table("jcv_req_orders").then( data => {       
        if(data != ''){
            return data;
        }else{
            return false;
        }
    })

    //Validando o retorno
    if(ValidateRequest != false){
        //Podemos editar o pedido

        //Validando o USUARIO que quer editar o pedido
        if(validateUser == true){
            //É admin tentando editar
            
            //Pegando o id od usuario do pedido
            const idUserEmitter = ValidateRequest[0].sys_req_userId;

            //Deletando todos os itens antigos e retornando a ação: true ou false
            const resultDelete = await database.where({sys_req_item_orderId: idOrderUpdate}).delete().table("jcv_req_orders_items").then( data => {
                if(data != ""){
                    return true;
                }else{
                    return false;
                }
            })

            //Validando o retorno
            if(resultDelete == true){
                //Pegando os itens e a quantidade para tranformar em uma nova array
                let namesItems = [];
                let amountsItems = [];

                let errorArray = [];//Lista os erros dos itens
                const keyOperation = await generateStrigRadom(25);

                if(typeof(arraYnamesItems) != 'object'){
                    namesItems.push(arraYnamesItems);
                }else{
                    namesItems = arraYnamesItems;
                }

                if(typeof(arraYamountsItems) != 'object'){
                    amountsItems.push(arraYamountsItems);
                }else{
                    amountsItems = arraYamountsItems;
                }
                
                let newArray = [];
                for (let i = 0; i < namesItems.length; i++) {
                    
                    let arr = [namesItems[i], amountsItems[i]]
                    newArray.push(arr);
                    
                }

                //Inserindo os itens do pedido na tabela
                newArray.forEach(element => {

                    //Validando o item
                    database.select("sys_req_itemId","sys_req_itemName").where({sys_req_itemEnabled: 1, sys_req_itemName: element[0]}).table("jcv_req_items").then( data => {
                        if(data != ""){
                            //item existe

                            //Inserindo os itens já com o id do pedido
                            database.insert({
                                sys_req_item_orderId: idOrderUpdate,
                                sys_req_item_userId: idUserEmitter,
                                sys_req_item_itemId: data[0].sys_req_itemId,
                                sys_req_item_itemName: data[0].sys_req_itemName,
                                sys_req_item_itemAmount: element[1],
                                sys_req_item_amountReceived: null,
                                sys_req_item_keyOperation: keyOperation
                            }).table("jcv_req_orders_items").then( result => {
                                //Insert com sucesso
                            })
                        }else{
                            //item não existe
                            errorArray.push(element);//Adicionando o item em uma lista de erro
                        }
                    })
                });


                //Fanzendo o update do pedido com as novas informações
                await database.update({
                    sys_req_orderNode: orderNode,
                    sys_req_orderEmitter: dateNow,
                    sys_req_orderTotalItems: namesItems.length,
                    sys_req_orderKeyOperation: keyOperation
                }).where({sys_req_idOne: idOrderUpdate}).table("jcv_req_orders").then( result => {
                    //Update com sucesso
                })
                
                //Valida se teve algum erro no insert dos itens
                if(errorArray.length > 0){
                    res.cookie('SYS-NOTIFICATION-EXE1', "SYS02| Os itens: "+errorArray+" não puderam ser adicionados, requisição regsitrada!.");
                    res.redirect("/painel/requisitor/VisualizarRequisicao/"+idOrderUpdate);
                }else{

                    ////////////////////////////////////////////////////////////
                    ////////////////////////////////////////////////////////////
                    //Mandando email para o USUARIO
                    database.select("jcv_userEmailCorporate","jcv_userNamePrimary").where({jcv_id: idUserEmitter, jcv_sysEmail: 1}).table("jcv_users").then( data => {

                        if(data != ''){
                            //Sistema de email: USUARIO
                            const textOne = 'Requisição editada com sucesso';
                            const textTwo = `A requisição id: <b>#${idOrderUpdate}</b> foi editada com sucesso por um administrador. Um e-mail para os administradores foi enviado com sucesso.`;
                            emailSystemExe.sendMailExe(data[0].jcv_userEmailCorporate, 'Requisição editada', 'Requisição editada', 'Requisitor de Materiais', data[0].jcv_userNamePrimary, textOne, textTwo);
                        }

                    })

                    ////////////////////////////////////////////////////////////
                    ////////////////////////////////////////////////////////////
                    //Email para os ADMINS do sistema
                    database
                    .select("jcv_users.jcv_userEmailCorporate")
                    .where({sys_req_perm_admin: 1, jcv_sysEmail: 1})
                    .table("jcv_users_permissions")
                    .join('jcv_users', 'jcv_users_permissions.sys_perm_idUser', '=', 'jcv_users.jcv_id')
                    .then( data => {

                        if(data != ''){
                            //Transformando em array
                            let arrMail = []
                            for(let index = 0; index < data.length; index++){
                                arrMail.push(data[index].jcv_userEmailCorporate)
                            }

                            //Sistema de email: ADMIN
                            const textOne = 'Uma requisição foi editada, segue dados abaixo';
                            const textTwo = `A requisição <b>#${idOrderUpdate}</b> foi editada com sucesso as ${generateDate()}<br>`;
                            emailSystemExe.sendMailExe(arrMail, 'Requisição editada', 'Requisição editada', 'Requisitor de Materiais', 'Administradores', textOne, textTwo);
                        }
                        
                    })

                    res.cookie('SYS-NOTIFICATION-EXE1', "SYS01| Requisição editada com sucesso. #"+idOrderUpdate+"!");
                    res.redirect("/painel/requisitor/VisualizarRequisicao/"+idOrderUpdate);
                }
            }
        }else{
            //É usuario tentando editar

            //Deletando todos os itens antigos e retornando a ação: true ou false
            const resultDelete = await database.where({sys_req_item_orderId: idOrderUpdate}).delete().table("jcv_req_orders_items").then( data => {
                if(data != ""){
                    return true;
                }else{
                    return false;
                }
            })

            //Validando o retorno
            if(resultDelete == true){
                //Pegando os itens e a quantidade para tranformar em uma nova array
                let namesItems = [];
                let amountsItems = [];

                let errorArray = [];//Lista os erros dos itens
                const keyOperation = await generateStrigRadom(25);

                if(typeof(arraYnamesItems) != 'object'){
                    namesItems.push(arraYnamesItems);
                }else{
                    namesItems = arraYnamesItems;
                }

                if(typeof(arraYamountsItems) != 'object'){
                    amountsItems.push(arraYamountsItems);
                }else{
                    amountsItems = arraYamountsItems;
                }
                
                let newArray = [];
                for (let i = 0; i < namesItems.length; i++) {
                    
                    let arr = [namesItems[i], amountsItems[i]]
                    newArray.push(arr);

                }

                //Inserindo os itens do pedido na tabela
                newArray.forEach(element => {

                    //Validando o item
                    database.select("sys_req_itemId","sys_req_itemName").where({sys_req_itemEnabled: 1, sys_req_itemName: element[0]}).table("jcv_req_items").then( data => {
                        if(data != ""){
                            //item existe

                            //Inserindo os itens já com o id do pedido
                            database.insert({
                                sys_req_item_orderId: idOrderUpdate,
                                sys_req_item_userId: GLOBAL_DASH[0],
                                sys_req_item_itemId: data[0].sys_req_itemId,
                                sys_req_item_itemName: data[0].sys_req_itemName,
                                sys_req_item_itemAmount: element[1],
                                sys_req_item_amountReceived: null,
                                sys_req_item_keyOperation: keyOperation
                            }).table("jcv_req_orders_items").then( result => {
                                //Insert com sucesso
                            })
                        }else{
                            //item não existe
                            errorArray.push(element);//Adicionando o item em uma lista de erro
                        }
                    })
                });


                //Fanzendo o update do pedido com as novas informações
                await database.update({
                    sys_req_orderNode: orderNode,
                    sys_req_orderEmitter: dateNow,
                    sys_req_orderTotalItems: namesItems.length,
                    sys_req_orderKeyOperation: keyOperation
                }).where({sys_req_idOne: idOrderUpdate}).table("jcv_req_orders").then( result => {
                    //Update com sucesso
                })
                
                //Valida se teve algum erro no insert dos itens
                if(errorArray.length > 0){
                    res.cookie('SYS-NOTIFICATION-EXE1', "SYS02| Os itens: "+errorArray+" não puderam ser adicionados, requisição regsitrada!.");
                    res.redirect("/painel/requisitor/VisualizarRequisicao/"+idOrderUpdate);
                }else{

                    ////////////////////////////////////////////////////////////
                    ////////////////////////////////////////////////////////////
                    //Mandando email para o USUARIO
                    database.select("jcv_userEmailCorporate").where({jcv_id: GLOBAL_DASH[0], jcv_sysEmail: 1}).table("jcv_users").then( data => {
                        if(data != ''){
                            //Sistema de email: USUARIO
                            const textOne = 'Requisição editada com sucesso';
                            const textTwo = `A requisição id: <b>#${idOrderUpdate}</b> foi editada com sucesso!. Um e-mail para os administradores foi enviado com sucesso.`;
                            emailSystemExe.sendMailExe(data[0].jcv_userEmailCorporate, 'Requisição editada', 'Requisição editada', 'Requisitor de Materiais', GLOBAL_DASH[1], textOne, textTwo);
                        }

                    })

                    ////////////////////////////////////////////////////////////
                    ////////////////////////////////////////////////////////////
                    //Email para os ADMINS do sistema
                    database
                    .select("jcv_users.jcv_userEmailCorporate")
                    .where({sys_req_perm_admin: 1, jcv_sysEmail: 1})
                    .table("jcv_users_permissions")
                    .join('jcv_users', 'jcv_users_permissions.sys_perm_idUser', '=', 'jcv_users.jcv_id')
                    .then( data => {

                        if(data != ''){
                            //Transformando em array
                            let arrMail = []
                            for(let index = 0; index < data.length; index++){
                                arrMail.push(data[index].jcv_userEmailCorporate)
                            }

                            //Sistema de email: ADMIN
                            const textOne = 'Uma requisição foi editada, segue dados abaixo';
                            const textTwo = `A requisição <b>#${idOrderUpdate}</b> do usuario <b>${GLOBAL_DASH[1]}</b> foi editada as ${generateDate()}<br>`;
                            emailSystemExe.sendMailExe(arrMail, 'Requisição editada', 'Requisição editada', 'Requisitor de Materiais', 'Administradores', textOne, textTwo);
                        }
                        
                    })

                    res.cookie('SYS-NOTIFICATION-EXE1', "SYS01| Requisição editada com sucesso. #"+idOrderUpdate+"!");
                    res.redirect("/painel/requisitor/VisualizarRequisicao/"+idOrderUpdate);
                }
            }
        }
    }else{
        res.cookie('SYS-NOTIFICATION-EXE1', "SYS03| Você não pode editar esta requisição.");
        res.redirect("/painel/requisitor/minhasRequisicoes");
    }
}

exports.myRequestDownload = async (req,res) => {

    //Pegando o id da requisição
    const id = req.body['button-view-action-download'];

    //Impotando os arquivos para gerar excel
    const xl = require('excel4node');
    const wb = new xl.Workbook();
    const ws = wb.addWorksheet('Worksheet Name');

    //Fazendo o select e retornando
    const arryaDataSet = await database
    .select("jcv_req_orders_items.sys_req_item_orderId","jcv_users.jcv_userNamePrimary","jcv_unitys.sys_unity_name","jcv_req_orders_items.sys_req_item_itemId",
    "jcv_req_orders_items.sys_req_item_itemName","jcv_req_orders_items.sys_req_item_itemAmount")
    .table("jcv_req_orders_items")
    .join('jcv_unitys', 'jcv_req_orders_items.sys_req_item_userId', '=', 'jcv_unitys.sys_unity_id')
    .join('jcv_users', 'jcv_req_orders_items.sys_req_item_userId', '=', 'jcv_users.jcv_id')
    .whereRaw("jcv_req_orders_items.sys_req_item_orderId IN ("+id+")")
    .then( data => {
        return data
    })
    
    //Criando as colunas do excel
    const headingColumnNames = [
        "ID Pedido",
        "Solicitante",
        "Unidade",
        "ID Item",
        "Item",
        "Quantidade"
    ]

    //Configurações do excel
    let headingColumnIndex = 1; //diz que começará na primeira linha
    headingColumnNames.forEach(heading => { //passa por todos itens do array
        // cria uma célula do tipo string para cada título
        ws.cell(1, headingColumnIndex++).string(heading);
    });

    //Inicia-se na segunda linha a insereção dos itens
    let rowIndex = 2;
    arryaDataSet.forEach( record => {
        let columnIndex = 1;
        Object.keys(record).forEach(columnName =>{

            //Verificando se o dado é numero
            if(typeof(record[columnName]) === 'number'){

                //Convertendo o id do pedido para string
                record[columnName] = ""+record[columnName]+"";

                ws.cell(rowIndex,columnIndex++)
                .string(record [columnName])
            }else{
                ws.cell(rowIndex,columnIndex++)
                .string(record [columnName])
            }
        });
        rowIndex++;
    }); 

    //Gerando caracteres aleatorios e fazendo o download
    const caracteresAleatorios = Math.random().toString(36).substring(5);
    const nameData = 'EXPORT-REQUISICAO-'+caracteresAleatorios;

    wb.write(nameData+'.xlsx', res);

}

exports.adminRequestDownload = async (req,res) => {

    //Pegando o id da requisição
    const id = req.body['button-admin-download-request'];
    console.log(id)

    //Impotando os arquivos para gerar excel
    const xl = require('excel4node');
    const wb = new xl.Workbook();
    const ws = wb.addWorksheet('Worksheet Name');

    //Fazendo o select e retornando
    const arryaDataSet = await database
    .select("jcv_req_orders_items.sys_req_item_orderId","jcv_users.jcv_userNamePrimary","jcv_unitys.sys_unity_name","jcv_req_orders_items.sys_req_item_itemId",
    "jcv_req_orders_items.sys_req_item_itemName","jcv_req_orders_items.sys_req_item_itemAmount")
    .table("jcv_req_orders_items")
    .join('jcv_unitys', 'jcv_req_orders_items.sys_req_item_userId', '=', 'jcv_unitys.sys_unity_id')
    .join('jcv_users', 'jcv_req_orders_items.sys_req_item_userId', '=', 'jcv_users.jcv_id')
    .whereRaw("jcv_req_orders_items.sys_req_item_orderId IN ("+id+")")
    .then( data => {
        return data
    })
    
    //Criando as colunas do excel
    const headingColumnNames = [
        "ID Pedido",
        "Solicitante",
        "Unidade",
        "ID Item",
        "Item",
        "Quantidade"
    ]

    //Configurações do excel
    let headingColumnIndex = 1; //diz que começará na primeira linha
    headingColumnNames.forEach(heading => { //passa por todos itens do array
        // cria uma célula do tipo string para cada título
        ws.cell(1, headingColumnIndex++).string(heading);
    });

    //Inicia-se na segunda linha a insereção dos itens
    let rowIndex = 2;
    arryaDataSet.forEach( record => {
        let columnIndex = 1;
        Object.keys(record).forEach(columnName =>{

            //Verificando se o dado é numero
            if(typeof(record[columnName]) === 'number'){

                //Convertendo o id do pedido para string
                record[columnName] = ""+record[columnName]+"";

                ws.cell(rowIndex,columnIndex++)
                .string(record [columnName])
            }else{
                ws.cell(rowIndex,columnIndex++)
                .string(record [columnName])
            }
        });
        rowIndex++;
    }); 

    //Gerando caracteres aleatorios e fazendo o download
    const caracteresAleatorios = Math.random().toString(36).substring(5);
    const nameData = 'EXPORT-REQUISICAO-'+caracteresAleatorios;

    wb.write(nameData+'.xlsx', res);

}

exports.myRequestRemove = async (req,res) => {
    //Deletando a requisição

    //Pegando o id do pedido
    const id = req.body['action-request-romove'];

    //Validando para ser se o pedido é do usuario e se os status é 1 e retornando
    const resultValidade = await database.select().where({sys_req_idOne: id, sys_req_userId: GLOBAL_DASH[0], sys_req_orderStatus: 1}).table("jcv_req_orders").then( data => {
        return data;
    })

    //Validando o retorno
    if(resultValidade != ''){

        //Deletando o pedido
        database.where({sys_req_idOne: id, sys_req_userId: GLOBAL_DASH[0], sys_req_orderStatus: 1}).delete().table("jcv_req_orders").then( data => {
            //Delete com sucesso
        })

        //Deletando os itens
        database.where({sys_req_IdTwo: id, sys_req_item_itemId: GLOBAL_DASH[0]}).delete().table("jcv_req_orders_items").then( data => {
            //Delete com sucesso
        })

        ////////////////////////////////////////////////////////////
        ////////////////////////////////////////////////////////////
        //Mandando email para o USUARIO
        database.select("jcv_userEmailCorporate").where({jcv_id: GLOBAL_DASH[0], jcv_sysEmail: 1}).table("jcv_users").then( data => {
            if(data != ''){
                //Sistema de email: USUARIO
                const textOne = 'Requisição excluida com sucesso';
                const textTwo = `A requisição id: <b>#${id}</b> foi excluida com sucesso!. Um e-mail para os administradores foi enviado com sucesso.`;
                emailSystemExe.sendMailExe(data[0].jcv_userEmailCorporate, 'Requisição excluída', 'Requisição excluída', 'Requisitor de Materiais', GLOBAL_DASH[1], textOne, textTwo);
            }

        })

        ////////////////////////////////////////////////////////////
        ////////////////////////////////////////////////////////////
        //Email para os ADMINS do sistema
        database
        .select("jcv_users.jcv_userEmailCorporate")
        .where({sys_req_perm_admin: 1, jcv_sysEmail: 1})
        .table("jcv_users_permissions")
        .join('jcv_users', 'jcv_users_permissions.sys_perm_idUser', '=', 'jcv_users.jcv_id')
        .then( data => {

            if(data != ''){
                //Transformando em array
                let arrMail = []
                for(let index = 0; index < data.length; index++){
                    arrMail.push(data[index].jcv_userEmailCorporate)
                }

                //Sistema de email: ADMIN
                const textOne = 'Uma requisição foi excluída, segue dados abaixo';
                const textTwo = `A requisição <b>#${id}</b> do usuario <b>${GLOBAL_DASH[1]}</b> foi excluída as ${generateDate()}<br>`;
                emailSystemExe.sendMailExe(arrMail, 'Requisição excluída', 'Requisição excluída', 'Requisitor de Materiais', 'Administradores', textOne, textTwo);
            }
            
        })




        res.cookie('SYS-NOTIFICATION-EXE1', "SYS01| Exclusão realizada com sucesso!");
        res.redirect("/painel/requisitor/minhasRequisicoes");

    }else{
        res.cookie('SYS-NOTIFICATION-EXE1', "SYS03| Você não pode excluir este pedido!");
        res.redirect("/painel/requisitor/minhasRequisicoes");
    }
}


exports.adminRequestRemove = async (req,res) => {
    //Deletando a requisição

    //Pegando o id do pedido
    const id = req.body['button-admin-remove-request'];

    //Validando se o status é 1 e retornando
    const resultValidade = await database.select().where({sys_req_idOne: id, sys_req_orderStatus: 1}).table("jcv_req_orders").then( data => {
        return data;
    })

    //Validando o retorno
    if(resultValidade != ''){

        //Deletando o pedido
        database.where({sys_req_idOne: id, sys_req_orderStatus: 1}).delete().table("jcv_req_orders").then( data => {
            //Delete com sucesso
        })

        //Deletando os itens
        database.where({sys_req_item_orderId: id}).delete().table("jcv_req_orders_items").then( data => {
            //Delete com sucesso
        })

        ////////////////////////////////////////////////////////////
        ////////////////////////////////////////////////////////////
        //Mandando email para o USUARIO
        database.select("jcv_userEmailCorporate","jcv_userNamePrimary").where({jcv_id: resultValidade[0].sys_req_userId, jcv_sysEmail: 1}).table("jcv_users").then( data => {
            if(data != ''){
                //Sistema de email: USUARIO
                const textOne = 'Requisição excluida com sucesso';
                const textTwo = `A requisição id: <b>#${id}</b> foi excluida com sucesso!. Um e-mail para os administradores foi enviado com sucesso.`;
                emailSystemExe.sendMailExe(data[0].jcv_userEmailCorporate, 'Requisição excluída', 'Requisição excluída', 'Requisitor de Materiais', data[0].jcv_userNamePrimary, textOne, textTwo);
            }

        })

        ////////////////////////////////////////////////////////////
        ////////////////////////////////////////////////////////////
        //Email para os ADMINS do sistema
        database
        .select("jcv_users.jcv_userEmailCorporate")
        .where({sys_req_perm_admin: 1, jcv_sysEmail: 1})
        .table("jcv_users_permissions")
        .join('jcv_users', 'jcv_users_permissions.sys_perm_idUser', '=', 'jcv_users.jcv_id')
        .then( data => {

            if(data != ''){
                //Transformando em array
                let arrMail = []
                for(let index = 0; index < data.length; index++){
                    arrMail.push(data[index].jcv_userEmailCorporate)
                }

                //Sistema de email: ADMIN
                const textOne = 'Uma requisição foi excluída, segue dados abaixo';
                const textTwo = `A requisição <b>#${id}</b> foi excluída as ${generateDate()}<br>`;
                emailSystemExe.sendMailExe(arrMail, 'Requisição excluída', 'Requisição excluída', 'Requisitor de Materiais', 'Administradores', textOne, textTwo);
            }
            
        })

        res.cookie('SYS-NOTIFICATION-EXE1', "SYS01| Exclusão realizada com sucesso!");
        res.redirect("/painel/requisitor/ListaRequisicoes");

    }else{
        res.cookie('SYS-NOTIFICATION-EXE1', "SYS03| Você não pode excluir este pedido!");
        res.redirect("/painel/requisitor/ListaRequisicoes");
    }
}


//////////////////////////////////////////////////////////////////////////////////
async function exportOrders(req,res,ids){

    //Importando os arquivos para trabalhar com o excel
    const xl = require('excel4node');
    const wb = new xl.Workbook();
    const ws = wb.addWorksheet('Worksheet Name');

    //Validando se os ids é um array/obejto
    if(ids.length >= 1){
        database
        .select("jcv_req_orders.sys_req_idOne","jcv_req_orders.sys_req_orderEmitter","jcv_req_orders.sys_req_userName","jcv_unitys.sys_unity_name",
        "jcv_req_orders.sys_req_orderTotalItems","jcv_req_orders.sys_req_orderStatus")
        .table("jcv_req_orders")
        .join('jcv_unitys', 'jcv_req_orders.sys_req_userUnity', '=', 'jcv_unitys.sys_unity_id')
        .join('jcv_users', 'jcv_req_orders.sys_req_userManager', '=', 'jcv_users.jcv_id')
        .whereRaw("jcv_req_orders.sys_req_idOne IN ("+ids+") ORDER BY jcv_req_orders.sys_req_idOne DESC")
        .then(data => {
            
            const headingColumnNames = [
                "ID",
                "Emitido",
                "Solicitante",
                "Unidade",
                "Itens Totais",
                "Status Atual"
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
                        record.sys_req_idOne = "#"+record.sys_req_idOne;

                        //Convertendo o itens totais do pedido para string
                        record.sys_req_orderTotalItems = ""+record.sys_req_orderTotalItems+"";

                        //Classificando o status do pedido
                        if(record.sys_req_orderStatus == 1){
                            record.sys_req_orderStatus = "Requisição Efetuada"
                        }else if(record.sys_req_orderStatus == 2){
                            record.sys_req_orderStatus = "Em Separação"
                        }else if(record.sys_req_orderStatus == 3){
                            record.sys_req_orderStatus = "Finalizada"
                        }else if(record.sys_req_orderStatus == 4){
                            record.sys_req_orderStatus = "Requisição Cancelada"
                        }else if(record.sys_req_orderStatus == 5){
                            record.sys_req_orderStatus = "Requisição Pendente"
                        }else if(record.sys_req_orderStatus == 6){
                            record.sys_req_orderStatus = "Requisição Enviada"
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
            const nameData = 'EXPORT-REQUISICOES-'+caracteresAleatorios;

            wb.write(nameData+'.xlsx', res)
        })
    }
}

async function exportItemsOrdersTotal(req,res,ids){

    ids = typeof(ids) == 'object' ? ids.join(',') : ids;

    const xl = require('excel4node');
    const wb = new xl.Workbook();
    const ws = wb.addWorksheet('Worksheet Name');
    
    const itemsOrders = await database.raw("SELECT sys_req_item_itemName, SUM(sys_req_item_itemAmount) AS Qtd FROM jcv_req_orders_items WHERE jcv_req_orders_items.sys_req_item_orderId in("+ids+") GROUP BY sys_req_item_itemName HAVING COUNT(sys_req_item_itemName) > 0 ORDER BY SUM(sys_req_item_itemName) DESC").then( data => {
        return data[0];
    })


    const headingColumnNames = [
        "Item",
        "Quantidade"
    ]
    
    let headingColumnIndex = 1; //diz que começará na primeira linha
    headingColumnNames.forEach(heading => { //passa por todos itens do array
        // cria uma célula do tipo string para cada título
        ws.cell(1, headingColumnIndex++).string(heading);
    });
    
    let rowIndex = 2;
    itemsOrders.forEach( record => {
        let columnIndex = 1;
        Object.keys(record).forEach(columnName =>{

            //Verificando se o dado é numero
            if(typeof(record[columnName]) === 'number'){

                //Convertendo o id do pedido para string
                record.sys_req_item_itemAmount = ""+record.sys_req_item_itemAmount+"";

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
    const nameData = 'EXPORT-ITEMS-TOTAL-'+caracteresAleatorios;

    wb.write(nameData+'.xlsx', res)

}

async function exportItemsOrders(req,res,ids){
    ids = typeof(ids) == 'object' ? ids.join(',') : ids;

    const xl = require('excel4node');
    const wb = new xl.Workbook();
    const ws = wb.addWorksheet('Worksheet Name');
    
    const itemsOrders = await database
    .select("jcv_req_orders_items.sys_req_item_orderId","jcv_users.jcv_userNamePrimary","jcv_req_orders_items.sys_req_item_itemName","jcv_req_orders_items.sys_req_item_itemAmount","jcv_unitys.sys_unity_name")
    .join('jcv_users', 'jcv_req_orders_items.sys_req_item_userId', '=', 'jcv_users.jcv_id')
    .join('jcv_unitys', 'jcv_users.jcv_userUnity', '=', 'jcv_unitys.sys_unity_id')
    .whereRaw("jcv_req_orders_items.sys_req_item_orderId in("+ids+")")
    .table("jcv_req_orders_items")
    .then( data => {
        return data;
    })

    const headingColumnNames = [
        "ID requisição",
        "Solicitante",
        "Item",
        "Quantidade",
        "Unidade"
    ]
    
    let headingColumnIndex = 1; //diz que começará na primeira linha
    headingColumnNames.forEach(heading => { //passa por todos itens do array
        // cria uma célula do tipo string para cada título
        ws.cell(1, headingColumnIndex++).string(heading);
    });
    
    let rowIndex = 2;
    itemsOrders.forEach( record => {
        let columnIndex = 1;
        Object.keys(record).forEach(columnName =>{

            //Verificando se o dado é numero
            if(typeof(record[columnName]) === 'number'){

                //Convertendo o numeros para string
                record.sys_req_item_orderId = "#"+record.sys_req_item_orderId+"";
                record.sys_req_item_itemAmount = ""+record.sys_req_item_itemAmount+"";

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
    const nameData = 'EXPORT-ITEMS-ORDERS'+caracteresAleatorios;

    wb.write(nameData+'.xlsx', res)
}

async function modifiOrderStatus(req,res,ids,code){

    if(code == "CMD01"){
        //Em separação

        //Validando o ids se é objeto ou não
        ids = typeof(ids) == 'object' ? ids : [ids] 

        let arrayErr = [];
        let arrayOkay = [];

        //Percorrendo os ids
        for(let i = 0; i < ids.length; i++){
            await database.update({sys_req_orderStatus: 2}).where({sys_req_idOne: ids[i], sys_req_orderStatus: 1}).table("jcv_req_orders").then( data => {
                if(data == 0){
                    arrayErr.push(ids[i]);
                }else{
                    arrayOkay.push(ids[i]);
                }
            })
        }

        //Validando se os arrays possuem dados
        if(arrayErr.length > 0){
            res.cookie('SYS-NOTIFICATION-EXE2', "SYS02| O(s) pedido(s) ("+arrayErr+") não foram atualizados por conta dos status atuais.");
        }
        
        if(arrayOkay.length > 0){

            ////////////////////////////////////////////////////////////
            ////////////////////////////////////////////////////////////
            //Email para os USUARIOS do sistema
            database
            .select("jcv_users.jcv_userEmailCorporate","jcv_users.jcv_userNamePrimary","jcv_req_orders.sys_req_idOne")
            .table("jcv_users")
            .join('jcv_req_orders', 'jcv_users.jcv_id', '=', 'jcv_req_orders.sys_req_userId')
            .whereIn('jcv_req_orders.sys_req_idOne', arrayOkay)
            .where({jcv_sysEmail: 1})
            .then( data => {

                if(data != ''){
                    //Sistema de email: USUARIO
                    data.forEach(element => {
                        const textOne = 'Sua requisição teve o status alterado, segue dados abaixo';
                        const textTwo = `A requisição <b>#${element.sys_req_idOne}</b> teve o status alterado para <b>Em Separação</b>, status alterado as ${generateDate()}<br>`;
                        emailSystemExe.sendMailExe(element.jcv_userEmailCorporate, 'Status Alterado', 'Status Alterado', 'Requisitor de Materiais', element.jcv_userNamePrimary, textOne, textTwo);
                    });
                }
            })

            res.cookie('SYS-NOTIFICATION-EXE1', "SYS01| O(s) pedido(s) ("+arrayOkay+") foram atualizados com sucesso.");
        }


        res.redirect("/painel/requisitor/ListaRequisicoes");


    }else if(code == "CMD02"){
        //Cancelado

        //Validando o ids se é objeto ou não
        ids = typeof(ids) == 'object' ? ids : [ids] 

        let arrayErr = [];
        let arrayOkay = [];

        //Percorrendo os ids
        for(let i = 0; i < ids.length; i++){
            await database.update({sys_req_orderStatus: 4}).where({sys_req_idOne: ids[i], sys_req_orderStatus: 1}).table("jcv_req_orders").then( data => {
                if(data == 0){
                    arrayErr.push(ids[i]);
                }else{
                    arrayOkay.push(ids[i]);
                }
            })
        }

        //Validando se os arrays possuem dados
        if(arrayErr.length > 0){
            res.cookie('SYS-NOTIFICATION-EXE2', "SYS02| Os pedidos ("+arrayErr+") não foram atualizados por conta dos status atuais");
        }
        if(arrayOkay.length > 0){

            ////////////////////////////////////////////////////////////
            ////////////////////////////////////////////////////////////
            //Email para os USUARIOS do sistema
            database
            .select("jcv_users.jcv_userEmailCorporate","jcv_users.jcv_userNamePrimary","jcv_req_orders.sys_req_idOne")
            .table("jcv_users")
            .join('jcv_req_orders', 'jcv_users.jcv_id', '=', 'jcv_req_orders.sys_req_userId')
            .whereIn('jcv_req_orders.sys_req_idOne', arrayOkay)
            .where({jcv_sysEmail: 1})
            .then( data => {

                if(data != ''){
                    //Sistema de email: USUARIO
                    data.forEach(element => {
                        const textOne = 'Sua requisição teve o status alterado, segue dados abaixo';
                        const textTwo = `A requisição <b>#${element.sys_req_idOne}</b> teve o status alterado para <b>Cancelado</b>, status alterado as ${generateDate()}<br>`;
                        emailSystemExe.sendMailExe(element.jcv_userEmailCorporate, 'Status Alterado', 'Status Alterado', 'Requisitor de Materiais', element.jcv_userNamePrimary, textOne, textTwo);
                    });
                }
            })

            res.cookie('SYS-NOTIFICATION-EXE1', "SYS01| Status CANCELADO para os pedidos: ("+arrayOkay+") foi realizado com sucesso.");
        }

        res.redirect("/painel/requisitor/ListaRequisicoes");
    }else if(code == "CMD03"){
        //Pedido enviado

        //Validando o ids se é objeto ou não
        ids = typeof(ids) == 'object' ? ids : [ids] 

        let arrayErr = [];
        let arrayOkay = [];

        //Percorrendo os ids
        for(let i = 0; i < ids.length; i++){
            await database.update({sys_req_orderStatus: 6}).where({sys_req_idOne: ids[i], sys_req_orderStatus: 2}).table("jcv_req_orders").then( data => {
                if(data == 0){
                    arrayErr.push(ids[i]);
                }else{
                    arrayOkay.push(ids[i]);
                }
            })
        }

        //Validando se os arrays possuem dados
        if(arrayErr.length > 0){

            res.cookie('SYS-NOTIFICATION-EXE2', "SYS02| Os pedidos ("+arrayErr+") não foram atualizados, altere para status EM SEPARAÇÃO");
        }
        if(arrayOkay.length > 0){

            ////////////////////////////////////////////////////////////
            ////////////////////////////////////////////////////////////
            //Email para os USUARIOS do sistema
            database
            .select("jcv_users.jcv_userEmailCorporate","jcv_users.jcv_userNamePrimary","jcv_req_orders.sys_req_idOne")
            .table("jcv_users")
            .join('jcv_req_orders', 'jcv_users.jcv_id', '=', 'jcv_req_orders.sys_req_userId')
            .whereIn('jcv_req_orders.sys_req_idOne', arrayOkay)
            .where({jcv_sysEmail: 1})
            .then( data => {

                if(data != ''){
                    //Sistema de email: USUARIO
                    data.forEach(element => {
                        const textOne = 'Sua requisição teve o status alterado, segue dados abaixo';
                        const textTwo = `A requisição <b>#${element.sys_req_idOne}</b> teve o status alterado para <b>Requisição Enviada</b>, status alterado as ${generateDate()}<br>`;
                        emailSystemExe.sendMailExe(element.jcv_userEmailCorporate, 'Requisição Enviada', 'Requisição Enviada', 'Requisitor de Materiais', element.jcv_userNamePrimary, textOne, textTwo);
                    });
                }
            })

            res.cookie('SYS-NOTIFICATION-EXE1', "SYS01| Status REQUSIÇÃO ENVIADA para os pedidos: ("+arrayOkay+") foi realizado com sucesso.");
        }
        res.redirect("/painel/requisitor/ListaRequisicoes");
    }
}

async function sendRequests (req,res,idsOrders){


    res.redirect("/painel/requisitor/enviarRequisicoes/"+idsOrders)
}