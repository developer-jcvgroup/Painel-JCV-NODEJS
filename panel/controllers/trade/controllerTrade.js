const database = require("../../database/database");
const moment = require("moment");
moment.tz.setDefault('America/Sao_Paulo');

//Data atual
function generateDate(){
    moment.locale('pt-br');
    return moment().format('LT')+" "+moment().format('L')
}
//Get data atual DD/MM/YYYY
function generateDateSingle(){
    moment.locale('pt-br');
    return moment().format('DD/MM/YYYY')
}

exports.controllerMain = async (req,res) =>{

    //Pegando as permissões
    const getPerm = await database
    .select("sys_tra_perm_use","sys_tra_perm_admin")
    .where({sys_perm_idUser: GLOBAL_DASH[0]})
    .table("jcv_users_permissions")
    .then(data => {
        return data
    })

    //Vendo os formularios de pesquisa que esta pedente para este usuario
    const getFormsReponse = await database
    .raw("SELECT locate("+GLOBAL_DASH[12]+", jcv_trade_form_create_usersGroups) achado,jcv_trade_form_create_id,jcv_trade_form_create_created_userId,jcv_trade_form_create_titleForm,jcv_trade_form_create_jsonForm,jcv_trade_form_create_usersGroups,jcv_trade_form_res_formId FROM jcv_trade_form_create LEFT JOIN jcv_trade_form_response ON jcv_trade_form_create.jcv_trade_form_create_id = jcv_trade_form_response.jcv_trade_form_res_formId")
    //.select()
    //.whereRaw("jcv_trade_form_create_usersGroups LIKE '%,"+GLOBAL_DASH[12]+"' OR jcv_trade_form_create_usersGroups LIKE '"+GLOBAL_DASH[12]+",%' AND jcv_trade_form_create_usersListResponse IS NULL")
    //.leftJoin("jcv_trade_form_response","jcv_trade_form_create.jcv_trade_form_create_id","jcv_trade_form_response.jcv_trade_form_res_formId")
    //.table("jcv_trade_form_create")
    .then( data => { return data[0]})

    let formsIds = []
    getFormsReponse.forEach(element => {
        let inspectSet = element.jcv_trade_form_create_usersGroups.split(',').map(converNumber);
        
        function converNumber(num){
            return parseInt(num)
        }

        if(element.achado == 1 && inspectSet.indexOf(GLOBAL_DASH[12]) > -1 && element.jcv_trade_form_res_formId == null){
            formsIds.push(element.jcv_trade_form_create_id)
        }
    });

    const getFormsResp = await database
    .select()
    .whereIn("jcv_trade_form_create_id", formsIds)
    .table("jcv_trade_form_create")
    .then( data => {
        return data;
    })

    var page = "trade/mainTrade";
    res.render("panel/index", {
        page: page,
        getFormsReponse: getFormsResp,
        getPerm: getPerm
    })
}

exports.visitForm = async (req,res) => {

    const allShops = await database
    .select()
    .where({jcv_trade_shops_enabled: 1})
    .table("jcv_trade_shops")
    .then( data => {
        return data;
    })

    var page = "trade/visitaFormulario";
    res.render("panel/index", {page: page, allShops: allShops})
}

exports.visitFormNew = async (req,res) => {

    const idShop = parseInt(req.body['visit-shop'])
    const dateForm = req.body['visit-date'].split('-')[2]+'/'+req.body['visit-date'].split('-')[1]+'/'+req.body['visit-date'].split('-')[0]

    const shopInfo = await database
    .select()
    .where({jcv_trade_shops_id: idShop})
    .table("jcv_trade_shops")
    .then( data => {
        return data;
    })

    if(shopInfo != ''){
        let objForm = {};
        let indexInput = 1;
    






        function teste(){
            if(req.body['visit-form-'+indexInput+'-step'] != undefined){
    
                //console.log(req.body['visit-form-'+indexInput+'-step'])

                let compacArray = req.body['visit-form-'+indexInput+'-step'].filter( function (spaces){ return spaces != ''; })
                objForm[compacArray.shift()] = compacArray.splice(0);
    
                indexInput++
                teste()
    
            }else{
                indexInput++
            }
        }
    
        teste()
    
        //Nova string JSON
        const newObjForm = JSON.stringify(objForm);
    
        //Inserindo no banco
        database
        .insert({
            jcv_trade_visit_userId: GLOBAL_DASH[0],
            jcv_trade_visit_date: dateForm,
            jcv_trade_visit_shopId: idShop,
            jcv_trade_visit_created: generateDate(),
            jcv_trade_visit_repsonses: newObjForm
        })
        .table("jcv_trade_visit")
        .then( data => {
            if(data[0] > 0){
                res.cookie('SYS-NOTIFICATION-EXE1', "SYS01| Formulario de visita da loja <b>"+shopInfo[0].jcv_trade_shops_name+"</b> realizado com sucesso!");
                res.redirect("/painel/trademkt/main");
            }else{
                res.cookie('SYS-NOTIFICATION-EXE1', "SYS03| Erro ao registrar o formulario de visita.");
                res.redirect("/painel/trademkt/main");
            }
        })
    }else{
        res.cookie('SYS-NOTIFICATION-EXE1', "SYS02| Loja não encontrada.");
        res.redirect("/painel/trademkt/visit");
    }

    

}

exports.salesDay = async (req,res) => {

    //Vendo os formularios de pesquisa que esta pedente para este usuario
    const getFormsReponse = await database
    .raw("SELECT locate("+GLOBAL_DASH[0]+", jcv_trade_shops_users) achado,jcv_trade_shops_id,jcv_trade_shops_name FROM jcv_trade_shops")
    //.select()
    //.whereRaw("jcv_trade_form_create_usersGroups LIKE '%,"+GLOBAL_DASH[12]+"' OR jcv_trade_form_create_usersGroups LIKE '"+GLOBAL_DASH[12]+",%' AND jcv_trade_form_create_usersListResponse IS NULL")
    //.leftJoin("jcv_trade_form_response","jcv_trade_form_create.jcv_trade_form_create_id","jcv_trade_form_response.jcv_trade_form_res_formId")
    //.table("jcv_trade_form_create")
    .then( data => { return data[0]})

    
    /* let formsIds = []
    getFormsReponse.forEach(element => {
        let inspectSet = element.jcv_trade_shops_users.split(',').map(converNumber);
        
        function converNumber(num){
            return parseInt(num)
        }

        if(element.achado == 1 && inspectSet.indexOf(GLOBAL_DASH[12]) > -1 && element.jcv_trade_form_res_formId == null){
            formsIds.push(element.jcv_trade_form_create_id)
        }
    });

    const getFormsResp = await database
    .select()
    .whereIn("jcv_trade_form_create_id", formsIds)
    .table("jcv_trade_form_create")
    .then( data => {
        return data;
    }) */

    var page = "trade/vendasDiarias";
    res.render("panel/index", {page: page, shopsAll: getFormsReponse})
}

exports.visitFormModule = async (req,res) => {
    const typeOp = req.body['order-action-command-fv'];
    const idsFV = typeof(req.body['fv-id-actions-all']) == 'string' ? [req.body['fv-id-actions-all']] : req.body['fv-id-actions-all'];

    if(typeOp == 'FV01'){

        //Importando os dados para gerar excel
        const xl = require('excel4node');
        const wb = new xl.Workbook();
        const ws = wb.addWorksheet('Worksheet Name');
    
        //Exportando..
        const dataFV = await database
        .select("jcv_trade_visit_id","jcv_trade_visit_date","jcv_userNamePrimary","jcv_trade_shops_name","jcv_trade_visit_repsonses")
        .whereIn("jcv_trade_visit_id", idsFV)
        .table("jcv_trade_visit")
        .join("jcv_users","jcv_trade_visit.jcv_trade_visit_userId","jcv_users.jcv_id")
        .join("jcv_trade_shops","jcv_trade_visit.jcv_trade_visit_shopId","jcv_trade_shops.jcv_trade_shops_id")
        .then( data => {
            return data
        })

        //Criando os titulo das colunas da planilha
        const headingColumnNames = [
            "Shop ID",
            "Data",
            "Emissor",
            "Loja"
        ]

        //Tranformando em JSON e pegandos as keys
        let valuesJSON = Object.keys(JSON.parse(dataFV[0].jcv_trade_visit_repsonses));
        
        //Inserindo no header do excel
        valuesJSON.forEach(element => {
            headingColumnNames.push(element)    
        });

        //Configurando a planilha
        let headingColumnIndex = 1; //diz que começará na primeira linha
        headingColumnNames.forEach(heading => { //passa por todos itens do array
            // cria uma célula do tipo string para cada título
            ws.cell(1, headingColumnIndex++).string(heading);
        });


        //Quando começa a inserir os itens na planilha
        let rowIndex = 2;
        dataFV.forEach( record => {
            let columnIndex = 1;
            Object.keys(record).forEach(columnName =>{

                if(columnName == 'jcv_trade_visit_repsonses'){

                    let arrayColumn = JSON.parse(record [columnName])
                    let arraySet = Object.values(arrayColumn);

                    arraySet.forEach(elementTwo => {

                        if(Object.values(elementTwo).join() != ''){
                            ws.cell(rowIndex,columnIndex++)
                            .string(Object.values(elementTwo).join())
                        }else{
                            ws.cell(rowIndex,columnIndex++)
                            .string('Sem dados..')
                        }

                    })

                }else{
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
                }


                
            });
            rowIndex++;
        }); 

        //Gerando caracteres aleatorios e exportando a requisição
        const caracteresAleatorios = Math.random().toString(36).substring(5);
        const nameData = 'EXPORT-FV-'+caracteresAleatorios;

        wb.write(nameData+'.xlsx', res);//o res faz o download












    }
}


exports.salesDayRegister = async (req,res) => {
    
    const shopSelect = req.body['sales-action-select-shop'];
    const dateRegister = req.body['sales-action-date'];

    const productSalesFelps = req.body['sales-action-number-parts-felps'] == '' ? "Sem dados.." : req.body['sales-action-number-parts-felps']
    const actionMKTFelps = req.body['sales-action-mkt-action-felps'][0] == 0 ? 'Não Possui' : req.body['sales-action-mkt-action-felps'][1] ;
    const popularFelps = req.body['sales-action-popular-sale-felps'] == '' ? "Sem dados.." : req.body['sales-action-popular-sale-felps']
    const materialFelps = req.body['sales-action-matetrial-mkt-felps'] == 0 ? "Não" : "Sim"

    const productSalesRetro = req.body['sales-action-number-parts-retro'] == '' ? "Sem dados.." : req.body['sales-action-number-parts-retro']
    const actionMKTRetro = req.body['sales-action-mkt-action-retro'][0] == 0 ? 'Não Possui' : req.body['sales-action-mkt-action-retro'][1] ;
    const popularRetro = req.body['sales-action-popular-sale-retro'] == '' ? "Sem dados.." : req.body['sales-action-popular-sale-retro']
    const materialRetro = req.body['sales-action-matetrial-mkt-retro'] == 0 ? "Não" : "Sim"

    const productSalesAvenca = req.body['sales-action-number-parts-avenca'] == '' ? "Sem dados.." : req.body['sales-action-number-parts-avenca']
    const actionMKTAvenca = req.body['sales-action-mkt-action-avenca'][0] == 0 ? 'Não Possui' : req.body['sales-action-mkt-action-avenca'][1] ;
    const popularAvenca = req.body['sales-action-popular-sale-avenca'] == '' ? "Sem dados.." : req.body['sales-action-popular-sale-avenca']
    const materialAvenca = req.body['sales-action-matetrial-mkt-avenca'] == 0 ? "Não" : "Sim"

    //Object Felps
    let objFrom= '{"FELPS Quantidade Vendida": "'+productSalesFelps+'", "FELPS Produto mais vendido": "'+popularFelps+'", "FELPS Ação?": "'+actionMKTFelps+'", "FELPS Loja com material de marketing?": "'+materialFelps+'", "RETRO Quantidade Vendida": "'+productSalesRetro+'", "RETRO Produto mais vendido": "'+popularRetro+'", "RETRO Ação?": "'+actionMKTRetro+'", "RETRO Loja com material de marketing?": "'+materialRetro+'", "AVENCA Quantidade Vendida": "'+productSalesAvenca+'", "AVENCA Produto mais vendido": "'+popularAvenca+'", "AVENCA Ação?": "'+actionMKTAvenca+'", "AVENCA Loja com material de marketing?": "'+materialAvenca+'"}'


    if(shopSelect != ''){
        //Validando se ja possui registro neste dia para esta loja
        const selectShopValidation = await database
        .select()
        .whereRaw("jcv_trade_sales_form_date LIKE '%"+generateDateSingle()+"%' AND jcv_trade_sales_form_shopId = "+shopSelect)
        .table("jcv_trade_sales_form")
        .then(data => {
            if(data != ''){
                return true
            }else{
                return false
            }
        })

        //Validando..
        if(selectShopValidation == false){

            database
            .insert({
                jcv_trade_sales_form_shopId: parseInt(shopSelect),
                jcv_trade_sales_form_date: generateDate(),
                jcv_trade_sales_form_userId: GLOBAL_DASH[0],
                jcv_trade_sales_form_obForm: objFrom
            })
            .table("jcv_trade_sales_form")
            .then( data => {
                if(data[0] > 0){
                    res.cookie('SYS-NOTIFICATION-EXE1', "SYS01| Registro da venda diaria da loja foi realizado com sucesso.");
                    res.redirect("/painel/trademkt/main");
                }
            })
        }else{
            res.cookie('SYS-NOTIFICATION-EXE1', "SYS03| Já possui um registro na data informada e na loja selecionada.");
            res.redirect("/painel/trademkt/main");
        }
    }else{
        res.cookie('SYS-NOTIFICATION-EXE1', "SYS03| Insira uma loja válida!.");
        res.redirect("/painel/trademkt/salesDay");
    }

    
}


exports.formSearch = async (req,res) => {
    var page = "trade/formularioPesquisa";
    res.render("panel/index", {page: page})
}

exports.formSearchNew = async (req,res) => {

    const titleForm = req.body['form-set-title'];
    const jsonForm = req.body['form-set-now'];
    const dateExpired = req.body['form-set-date-expired'].split('-')[2]+'/'+req.body['form-set-date-expired'].split('-')[1]+'/'+req.body['form-set-date-expired'].split('-')[0]
    const personsForm = req.body['form-search-form-persons'] 

    //Convertendo em array string
    let arrNewPerson = '';
    if(typeof(personsForm) == 'object'){
        
        personsForm.forEach(element => {
            arrNewPerson+=element+',';
        });

        //Nova Array string
        arrNewPerson = arrNewPerson.substring(0, arrNewPerson.length - 1);
    }else{
        arrNewPerson = personsForm;
    }

    database
    .insert({
        jcv_trade_form_create_created_userId: GLOBAL_DASH[0],
        jcv_trade_form_create_titleForm: titleForm,
        jcv_trade_form_create_jsonForm: jsonForm,
        jcv_trade_form_create_total_reponse: 0,
        jcv_trade_form_create_created_date: generateDate(),
        jcv_trade_form_create_expired: dateExpired,
        jcv_trade_form_create_enabled: 1,
        jcv_trade_form_create_usersGroups: arrNewPerson
    })
    .table("jcv_trade_form_create")
    .then( data => {
        if(data[0] > 0){
            res.cookie('SYS-NOTIFICATION-EXE1', "SYS01| Formulario registrado com sucesso!");
            res.redirect("/painel/trademkt/main");
        }
    })

}

exports.formResponse = async (req,res) => {
    const idForm = req.params['id']

    const getForm = await database
    .select()
    .where({jcv_trade_form_create_id: idForm})
    .table("jcv_trade_form_create")
    .then( data => {
        return data;
    })

    //Verificando se foi respondido
    const formInfo = await database
    .select()
    .where({jcv_trade_form_res_idUser: GLOBAL_DASH[0], jcv_trade_form_res_formId: idForm})
    .table("jcv_trade_form_response")
    .then( data => {
        if(data == ''){
            return true
        }else{
            return false
        }
    })

    if(getForm != '' || idForm != ''){

        if(formInfo == true){
            var page = "trade/formResponse";
            res.render("panel/index", {
                page: page,
                getForm: getForm
            })
        }else{
            res.cookie('SYS-NOTIFICATION-EXE1', "SYS03| Você nao pode mais responder este formulário.");
            res.redirect("/painel/trademkt/main");
        }
        
    }else{
        res.cookie('SYS-NOTIFICATION-EXE1', "SYS03| Formulario não encontrado.");
        res.redirect("/painel/trademkt/main");
    } 
}

exports.formResponseAction = async (req,res) => {
    const responseUser = req.body['form-response-response-text']
    const idForm = parseInt(req.body['form-send-form'])
    const titleForm = req.body['form-response-response-title'];


    const formInfo = await database
    .select()
    .where({jcv_trade_form_res_idUser: GLOBAL_DASH[0], jcv_trade_form_res_formId: idForm})
    .table("jcv_trade_form_response")
    .then( data => { 
        if(data == ''){
            return true
        }else{
            return false
        }
    })

    if(formInfo == true){

        database
        .insert({
            jcv_trade_form_res_formId: idForm,
            jcv_trade_form_res_idUser: GLOBAL_DASH[0],
            jcv_trade_form_res_jsonForm: responseUser,
            jcv_trade_form_res_response_date: generateDate()
        })
        .table("jcv_trade_form_response")
        .then( data => {
            if(data[0] > 0){
    
                database
                .raw("UPDATE jcv_trade_form_create SET jcv_trade_form_create_usersListResponse = CONCAT(COALESCE(jcv_trade_form_create_usersListResponse,''), '"+GLOBAL_DASH[0]+",'), jcv_trade_form_create_total_reponse = jcv_trade_form_create_total_reponse +1 WHERE jcv_trade_form_create_id = "+idForm)
                //.where({})
                //.table("jcv_trade_form_create")
                .then( datas => {
                    res.cookie('SYS-NOTIFICATION-EXE1', "SYS01| Sua resposta do formulario <b>"+titleForm+"</b> foi registrada com sucesso!");
                    res.redirect("/painel/trademkt/main");
                })
            }
        })

    }else{
        res.cookie('SYS-NOTIFICATION-EXE1', "SYS03| Você não pode mais responder o formulário <b>"+titleForm+"</b>!");
        res.redirect("/painel/trademkt/main");
    }

}

exports.listTradePage = async (req,res) => {
    var page = "trade/listTrade";
    res.render("panel/index", {page: page, resultSearchDataTrade: req.flash('resultSearchDataTrade')})
}

exports.listTradeSearch = async (req,res) => {
    
    const typeOperation = req.body['list-trade-rel-type'];

    if(typeOperation == 1){

        //Vendas Diarias
        let VDusuarios = req.body['sys-filter-input-selects-VD_Usuarios'] != undefined ? req.body['sys-filter-input-selects-VD_Usuarios'] : "";
        let VDshops = req.body['sys-filter-input-selects-VD_Shops'] != undefined ? req.body['sys-filter-input-selects-VD_Shops'] : "";
        let VDdate = req.body['list-trade-vd-date'] != '' ? req.body['list-trade-vd-date'].split('-')[2]+'/'+req.body['list-trade-vd-date'].split('-')[1]+'/'+req.body['list-trade-vd-date'].split('-')[0] : '';

        if(VDusuarios != ''){
            VDusuarios = 'IN ('+VDusuarios+') ';
        }else{
            VDusuarios = 'LIKE "%%"';
        }

        if(VDshops != ''){
            VDshops = 'IN ('+VDshops+') ';
        }else{
            VDshops = 'LIKE "%%"';
        }

        if(VDdate != ''){
            VDdate = 'LIKE "%'+VDdate+'%"'
        }else{
            VDdate = 'LIKE "%%"'
        }

        database
        .select()
        .whereRaw("jcv_trade_sales_form_userId "+VDusuarios+" AND jcv_trade_sales_form_shopId "+VDshops+" AND jcv_trade_sales_form_date "+VDdate)
        .table("jcv_trade_sales_form")
        .join("jcv_users","jcv_trade_sales_form.jcv_trade_sales_form_userId","jcv_users.jcv_id")
        .join("jcv_trade_shops","jcv_trade_sales_form.jcv_trade_sales_form_shopId","jcv_trade_shops.jcv_trade_shops_id")
        .then( data => {

            if(data != ''){
                req.flash('resultSearchDataTrade', [ 1,data])
                res.redirect("/painel/trademkt/listTrade");   
            }else{
                res.cookie('SYS-NOTIFICATION-EXE1', "SYS02| Nenhum registro encontrado.");
                res.redirect("/painel/trademkt/listTrade");
            }

        })

    }else if(typeOperation == 2){
        //Formulario de visita

        let FVshops = req.body['sys-filter-input-selects-FV_Shops'] != undefined ? req.body['sys-filter-input-selects-FV_Shops'] : "";
        let FVdate = req.body['list-trade-fv-date'] != '' ? req.body['list-trade-fv-date'].split('-')[2]+'/'+req.body['list-trade-fv-date'].split('-')[1]+'/'+req.body['list-trade-fv-date'].split('-')[0] : '';

        if(FVshops != ''){
            FVshops = 'IN ('+FVshops+') ';
        }else{
            FVshops = 'LIKE "%%"';
        }

        if(FVdate != ''){
            FVdate = 'LIKE "%'+FVdate+'%" ';
        }else{
            FVdate = 'LIKE "%%"';
        }

        database
        .select()
        .whereRaw("jcv_trade_visit_shopId "+FVshops+" AND jcv_trade_visit_created "+FVdate)
        .join("jcv_users","jcv_trade_visit.jcv_trade_visit_userId","jcv_users.jcv_id")
        .join("jcv_trade_shops","jcv_trade_visit.jcv_trade_visit_shopId","jcv_trade_shops.jcv_trade_shops_id")
        .table("jcv_trade_visit")
        .then( data => {

            if(data != ''){
                req.flash('resultSearchDataTrade', [ 2,data])
                res.redirect("/painel/trademkt/listTrade");   
            }else{
                res.cookie('SYS-NOTIFICATION-EXE1', "SYS02| Nenhum registro encontrado.");
                res.redirect("/painel/trademkt/listTrade");
            }

        })

    }else if(typeOperation == 3){
        //Formulario de pesquisa

        let PSdate = req.body['list-trade-ps-date'] != undefined ? req.body['list-trade-ps-date'] : "";
        let PStitle = req.body['list-trade-ps-title'] != undefined ? req.body['list-trade-ps-title'] : "";

        if(PSdate != ''){
            PSdate = 'IN ('+PSdate+') ';
        }else{
            PSdate = 'LIKE "%%"';
        }

        if(PStitle != ''){
            PStitle = 'LIKE "%'+PStitle+'%" ';
        }else{
            PStitle = 'LIKE "%%"';
        }

        database
        .select()
        .whereRaw("jcv_trade_form_create_created_date "+PSdate+" AND jcv_trade_form_create_titleForm "+PStitle)
        .table("jcv_trade_form_create")
        .then( data => {

            if(data != ''){
                req.flash('resultSearchDataTrade', [ 3,data])
                res.redirect("/painel/trademkt/listTrade");   
            }else{
                res.cookie('SYS-NOTIFICATION-EXE1', "SYS02| Nenhum registro encontrado.");
                res.redirect("/painel/trademkt/listTrade");
            }

        })
    }else{
        res.cookie('SYS-NOTIFICATION-EXE1', "SYS02| Selecione uma opção no filtro de <b>Relatorio</b>.");
        res.redirect("/painel/trademkt/listTrade");
    }


}

exports.actionVDmodule = async (req,res) => {

    const typeOp = req.body['order-action-command-vd'];

    if(typeOp == "VD01"){

        const idsVD = typeof(req.body['vd-id-actions-all']) == 'object' ? req.body['vd-id-actions-all'] : [req.body['vd-id-actions-all']]

        //Importando os dados para gerar excel
        const xl = require('excel4node');
        const wb = new xl.Workbook();
        const ws = wb.addWorksheet('Worksheet Name');
       
        //Exportando..
        const dataVD = await database
        .select("jcv_trade_shops_name","jcv_trade_sales_form_date","jcv_userNamePrimary","jcv_trade_sales_form_obForm")
        .whereIn("jcv_trade_sales_form_id", idsVD)
        .table("jcv_trade_sales_form")
        .join("jcv_users","jcv_trade_sales_form.jcv_trade_sales_form_userId","jcv_users.jcv_id")
        .join("jcv_trade_shops","jcv_trade_sales_form.jcv_trade_sales_form_shopId","jcv_trade_shops.jcv_trade_shops_id")
        .then( data => {
            return data
        })
    
    
        //Criando os titulo das colunas da planilha
        const headingColumnNames = [
            "Loja",
            "Data",
            "Emito por:"
        ]

        //Configurando a planilha
        let headingColumnIndex = 1; //diz que começará na primeira linha
        headingColumnNames.forEach(heading => { //passa por todos itens do array
            // cria uma célula do tipo string para cada título
            ws.cell(1, headingColumnIndex++).string(heading);
        });

        //Pegando todos os title para adicionar no excel
        let test = dataVD[0].jcv_trade_sales_form_obForm;
        let getJson = Object.keys(JSON.parse(test));

        getJson.forEach(elementTo => {
            ws.cell(1, headingColumnIndex++ ).string(elementTo);
        });
    
        //Quando começa a inserir os itens na planilha
        let rowIndex = 2;
        dataVD.forEach( record => {
            let columnIndex = 1;
            Object.keys(record).forEach(columnName =>{

                if(columnName == 'jcv_trade_sales_form_obForm'){

                    let arrayColumn = JSON.parse(record [columnName])
                    let arraySet = Object.values(arrayColumn);

                    arraySet.forEach(elementTwo => {

                        if(Object.values(elementTwo) != ''){
                            ws.cell(rowIndex,columnIndex++)
                            .string(Object.values(elementTwo))
                        }else{
                            ws.cell(rowIndex,columnIndex++)
                            .string('Sem dados..')
                        }

                    })

                }else{
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
                }


                
            });
            rowIndex++;
        }); 

        //Gerando caracteres aleatorios e exportando a requisição
        const caracteresAleatorios = Math.random().toString(36).substring(5);
        const nameData = 'EXPORT-FV-'+caracteresAleatorios;

        wb.write(nameData+'.xlsx', res);//o res faz o download
    }else{
        res.cookie('SYS-NOTIFICATION-EXE1', "SYS02| Selecione uma opção no filtro de <b>Ação</b>.");
        res.redirect("/painel/trademkt/listTrade");
    }

}

exports.actionFPmodule = async (req,res) => {

    const typeOp = req.body['order-action-command-fp'];

    if(typeOp == "FP01"){
        const idsFP = typeof(req.body['fp-id-actions-all']) == 'object' ? req.body['fp-id-actions-all'] : [req.body['fp-id-actions-all']]

        //Importando os dados para gerar excel
        const xl = require('excel4node');
        const wb = new xl.Workbook();
        const ws = wb.addWorksheet('Worksheet Name');
    
        //Exportando..
        const dataFP = await database
        .select("jcv_trade_form_res_formId","jcv_trade_form_res_response_date","jcv_userNamePrimary","jcv_trade_form_res_jsonForm")
        .whereIn("jcv_trade_form_res_formId", idsFP)
        .table("jcv_trade_form_response")
        .join("jcv_users","jcv_trade_form_response.jcv_trade_form_res_idUser","jcv_users.jcv_id")
        .then( data => {
            return data
        })


        //Criando os titulo das colunas da planilha
        const headingColumnNames = [
            "ID Form",
            "Date Generate",
            "Respondido por:",
        ]

        //Configurando a planilha
        let headingColumnIndex = 1; //diz que começará na primeira linha
        headingColumnNames.forEach(heading => { //passa por todos itens do array
            // cria uma célula do tipo string para cada título
            ws.cell(1, headingColumnIndex++).string(heading);
        });

        //Pegando todos os title para adicionar no excel
        let test = dataFP[0].jcv_trade_form_res_jsonForm
        let tt = JSON.parse(test);

        tt.forEach(elementTo => {
            if(elementTo.type == 'header' || elementTo.type == 'paragraph'){
                //Removendo umas iformações para não aparecer na planilha
                //ex.: header eu quero remover do cabeçalho da plahilha, paragrafo tambem
            }else{
                ws.cell(1, headingColumnIndex++ ).string(elementTo.label);
            }
        });

        //Quando começa a inserir os itens na planilha
        let rowIndex = 2;
        dataFP.forEach( record => {

            let columnIndex = 1;
            Object.keys(record).forEach(columnName =>{

                if([columnName] == 'jcv_trade_form_res_jsonForm'){

                    let arrayJSON = JSON.parse(record[columnName]);
                    
                    arrayJSON.forEach(elementTo => {

                        //ws.cell(1, headingColumnIndex++ ).string(elementTo.label);
                        
                        if(elementTo.type == 'checkbox-group' || elementTo.type == 'radio-group' || elementTo.type == 'select'){
                
                            //console.log('Pergunta: '+element.label+'. Resposta: '+resp)
                        
                            let response = typeof(elementTo.userData) == 'undefined' ? 'Não definido' : `${elementTo.userData}`
                            //textResponse+=`${elementTo.label}? . R: ${response}. `

                            //ws.cell(1, headingColumnIndex++ ).string(elementTo.label);
                            ws.cell(rowIndex,columnIndex++)
                            .string(response)

                        }else if(elementTo.type == 'textarea'){

                            let response = elementTo.userData[0] == '' ? 'Não definido' : `${elementTo.userData[0]}`
                            //textResponse+=`${elementTo.label}? . R: ${response}. `

                            //ws.cell(1, headingColumnIndex++ ).string(elementTo.label);
                            ws.cell(rowIndex,columnIndex++)
                            .string(response)
                            
                            //console.log('Pergunta: '+element.label+'. Resposta: '+element.userData)
                        }else if(elementTo.type == 'number'){
                        
                            let response = typeof(elementTo.userData) == 'undefined' ? 'Não definido' : `${elementTo.userData}`
                            //textResponse+=`${elementTo.label}? . R: ${response}. `

                            //ws.cell(1, headingColumnIndex++ ).string(elementTo.label);
                            ws.cell(rowIndex,columnIndex++)
                            .string(response)
                            
                            //console.log('Pergunta: '+element.label+'. Resposta: '+element.userData)
                        }else if(elementTo.type == 'autocomplete'){
                            
                            let response = typeof(elementTo.userData) == 'undefined' ? 'Não definido' : `${elementTo.userData}`
                            //textResponse+=`${elementTo.label}? . R: ${response}. `

                            //ws.cell(1, headingColumnIndex++ ).string(elementTo.label);
                            ws.cell(rowIndex,columnIndex++)
                            .string(response)
                        
                            //console.log('Pergunta: '+element.label+'. Resposta: '+element.userData)
                        }

                    })



                }else{

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


                }
                


            });
            rowIndex++;
        }); 

        //Gerando caracteres aleatorios e exportando a requisição
        const caracteresAleatorios = Math.random().toString(36).substring(5);
        const nameData = 'EXPORT-FORM-PESQUISA-'+caracteresAleatorios;

        wb.write(nameData+'.xlsx', res);//o res faz o download
    }else{
        res.cookie('SYS-NOTIFICATION-EXE1', "SYS02| Selecione uma opção no filtro de <b>Ação</b>.");
        res.redirect("/painel/trademkt/listTrade");
    }

}

exports.formSearchEdit = async(req,res) => {

    const idForm = req.params['id']

    const getForm = await database
    .select()
    .where({jcv_trade_form_create_id: idForm})
    .table("jcv_trade_form_create")
    .then( data => {
        return data;
    })

    const allUsersForm = await database
    .select("jcv_userNamePrimary","jcv_id")
    .whereRaw("jcv_id IN ("+getForm[0].jcv_trade_form_create_usersGroups+")")
    .table("jcv_users")
    .then( data => {
        return data;
    })

    //Criando um array
    let newArrUsers = []
    allUsersForm.forEach(element => {
        newArrUsers.push(element.jcv_id+'-'+element.jcv_userNamePrimary);
    });

    /* const allUsers = await database
    .select("jcv_userNamePrimary","jcv_id")
    //.whereRaw("jcv_id IN ("+getForm[0].jcv_trade_form_create_usersGroups+")")
    .table("jcv_users")
    .then( data => {
        return data;
    })

    //Criando um array
    let newArrUsersAll = []
    allUsers.forEach(element => {
        newArrUsersAll.push(element.jcv_id+'-'+element.jcv_userNamePrimary);
    }); */

    var page = "trade/editFormulario";
    res.render("panel/index", {page: page, getForm: getForm, allUsersForm: newArrUsers})
}

exports.formSearchEditAction = async (req,res) => {
    const titleForm = req.body['form-set-title']
    const dateExpired = req.body['form-set-date-expired'].split('-')[2]+'/'+req.body['form-set-date-expired'].split('-')[1]+'/'+req.body['form-set-date-expired'].split('-')[0]
    
    const jsonNew = req.body['form-edit-json-edit']
    const idForm = req.body['form-edit-button-id']

    database
    .select()
    .where({jcv_trade_form_create_id: idForm})
    .table("jcv_trade_form_create")
    .then(data => {

        database
        .update({
            jcv_trade_form_create_jsonForm: jsonNew,
            jcv_trade_form_create_edited_date: generateDate(),
            jcv_trade_form_create_titleForm: titleForm,
            jcv_trade_form_create_expired: dateExpired
        })
        .where({jcv_trade_form_create_id: idForm})
        .table("jcv_trade_form_create")
        .then( data => {
            if(data[0] != ''){
                res.cookie('SYS-NOTIFICATION-EXE1', "SYS01| Edição realizada com sucesso!.");
                res.redirect("/painel/trademkt/formSearch/edit/"+idForm);
            }else{
                res.cookie('SYS-NOTIFICATION-EXE1', "SYS03| Erro ao editar o formulario!.");
                res.redirect("/painel/trademkt/main");
            }
        })

    })
}

exports.shopsPage = async (req,res) => {

    //Pegando todas as lojas
    const allShops = await database
    .select()
    .table("jcv_trade_shops")
    .then( data => {
        return data
    })

    var page = "trade/shops";
    res.render("panel/index", {page: page, allShops: allShops})
}

exports.shopsRegisterNew = async (req,res) => {
    const nameShop = req.body['shop-name']
    const regionShop = req.body['shop-name-region']
    const enabledShop = req.body['shop-enabled'] == 'on' ? 1 : 0;

    if(nameShop != '' && regionShop != ''){
        database
        .insert({
            jcv_trade_shops_name: nameShop,
            jcv_trade_shops_region: regionShop,
            jcv_trade_shops_enabled: enabledShop
        })
        .table("jcv_trade_shops")
        .then( data => {
            if(data != ''){
                res.cookie('SYS-NOTIFICATION-EXE1', "SYS01| Loja <b>"+nameShop+"</b> foi cadastrado com sucesso!.");
                res.redirect("/painel/trademkt/shops");
            }
        })
    }else{
        res.cookie('SYS-NOTIFICATION-EXE1', "SYS02| Você precisa todas as informações!.");
        res.redirect("/painel/trademkt/shops");
    }

}

exports.shopsRegisterEdit = async (req,res) => {
    const id = req.body['action-save-edit-shop'];

    const nameShop = req.body['shop-name-edit-'+id]
    const regionShop = req.body['shop-name-region-edit-'+id]
    const enabledShop = req.body['shop-enabled-edit-'+id] == 'on' ? 1 : 0;

    if(nameShop != '' && regionShop != ''){
        database
        .update({
            jcv_trade_shops_name: nameShop,
            jcv_trade_shops_region: regionShop,
            jcv_trade_shops_enabled: enabledShop
        })
        .where({jcv_trade_shops_id: id})
        .table("jcv_trade_shops")
        .then( data => {
            if(data != ''){
                res.cookie('SYS-NOTIFICATION-EXE1', "SYS01| Loja <b>"+nameShop+"</b> foi cadastrado com sucesso!.");
                res.redirect("/painel/trademkt/shops");
            }else{
                res.redirect("/painel/trademkt/shops");
            }
        })
    }else{
        res.cookie('SYS-NOTIFICATION-EXE1', "SYS02| Você precisa todas as informações!.");
        res.redirect("/painel/trademkt/shops");
    }

}

exports.shopsRegisterActions = async (req,res) => {
    const allIds = typeof(req.body['shop-edit-id']) == 'object' ? req.body['shop-edit-id'] : [req.body['shop-edit-id']];

    const opType = req.body['action-shops-select']

    if(opType == "CMD01"){
        //Habilitar
        actionShopsEnabled(req,res,allIds)
    }else if(opType == "CMD02"){
        //Desabilitar
        actionShopsDisabled(req,res,allIds)
        
    }else if(opType == "CMD03"){
        //Exportar
        actionShops(req,res,allIds)
    }else{
        res.cookie('SYS-NOTIFICATION-EXE1', "SYS02| Informe o tipo de operação!.");
        res.redirect("/painel/trademkt/shops");
    }
}

async function actionShops(req,res,allIds) {
    //Importando os dados para gerar excel
    const xl = require('excel4node');
    const wb = new xl.Workbook();
    const ws = wb.addWorksheet('Worksheet Name');

    const allShops = await database
    .select()
    .whereIn("jcv_trade_shops_id", allIds)
    .table("jcv_trade_shops")
    .then(data => {
        return data
    })

    //Criando os titulo das colunas da planilha
    const headingColumnNames = [
        "ID",
        "Loja",
        "Região",
        "Ativo?"
    ]

    //Configurando a planilha
    let headingColumnIndex = 1; //diz que começará na primeira linha
    headingColumnNames.forEach(heading => { //passa por todos itens do array
        // cria uma célula do tipo string para cada título
        ws.cell(1, headingColumnIndex++).string(heading);
    });

    //Quando começa a inserir os itens na planilha
    let rowIndex = 2;
    allShops.forEach( record => {
        let columnIndex = 1;
        Object.keys(record).forEach(columnName =>{

            if(columnName == 'jcv_trade_shops_enabled'){

                if(record [columnName] == 1){
                    ws.cell(rowIndex,columnIndex++)
                    .string("Sim")
                }else{
                    ws.cell(rowIndex,columnIndex++)
                    .string("Não")
                }
            }else if(typeof(record[columnName]) === 'number'){

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
    const nameData = 'EXPORT-SHOPS-'+caracteresAleatorios;

    wb.write(nameData+'.xlsx', res);//o res faz o download
}

async function actionShopsEnabled(req,res,allIds){
    database
    .update({
        jcv_trade_shops_enabled: 1
    })
    .whereIn("jcv_trade_shops_id", allIds)
    .table("jcv_trade_shops")
    .then(data => {
        if(data != ''){
            res.cookie('SYS-NOTIFICATION-EXE1', "SYS01| <b>"+allIds.length+"</b> teve seu status alterado para <b>Habilitado</b>!.");
            res.redirect("/painel/trademkt/shops");
        }else{
            res.redirect("/painel/trademkt/shops");
        }
    })
}

async function actionShopsDisabled(req,res,allIds){
    database
    .update({
        jcv_trade_shops_enabled: 0
    })
    .whereIn("jcv_trade_shops_id", allIds)
    .table("jcv_trade_shops")
    .then(data => {
        if(data != ''){
            res.cookie('SYS-NOTIFICATION-EXE1', "SYS01| <b>"+allIds.length+"</b> teve seu status alterado para <b>Habilitado</b>!.");
            res.redirect("/painel/trademkt/shops");
        }else{
            res.redirect("/painel/trademkt/shops");
        }
    })
}

exports.configShops = async (req,res) => {

    const idForm = req.params['id']

    //Pegando o nome da loja
    const shopData = await database
    .select("jcv_trade_shops_id","jcv_trade_shops_name")
    .where({jcv_trade_shops_id: idForm})
    .table("jcv_trade_shops")
    .then( data => {
        return data;
    })

    //Pegando todos os usuarios que tem acesso ao TRADE MKT
    const getAllUserTrade = await database
    .select("jcv_id","jcv_userNamePrimary")
    .whereRaw("sys_tra_perm_use = 1 OR sys_tra_perm_admin = 1")
    .table("jcv_users")
    .join("jcv_users_permissions","jcv_users.jcv_id","jcv_users_permissions.sys_perm_idUser")
    .then( data => {return data})

    //Criando um array
    let newArrUsers = []
    getAllUserTrade.forEach(element => {
        newArrUsers.push(element.jcv_id+' - '+element.jcv_userNamePrimary);
    });

    //Pegando todos os usuarios que fazer partes desta loja
    const allUsersShops = await database
    .select()
    .where({jcv_trade_shops_id: idForm})
    .table("jcv_trade_shops")
    .then( data => {return data})

    let newArrUsersSet = []
    if(allUsersShops[0].jcv_trade_shops_users != null || allUsersShops[0].jcv_trade_shops_users == ''){
        const getAllUsersData = await database
        .select("jcv_id","jcv_userNamePrimary")
        .whereRaw("jcv_id in ("+allUsersShops[0].jcv_trade_shops_users+")")
        .table("jcv_users")
        //.join("jcv_users_permissions","jcv_users.jcv_id","jcv_users_permissions.sys_perm_idUser")
        .then( data => {return data})

        //Criando um array
        getAllUsersData.forEach(element => {
            newArrUsersSet.push(element.jcv_id+' - '+element.jcv_userNamePrimary);
        });
    }

    var page = "trade/shopsConfig";
    res.render("panel/index", {page: page, newArrUsers: newArrUsers, newArrUsersSet: newArrUsersSet, shopData: shopData})
}

exports.saveSetUsers = async (req,res) => {
    const allUsers = typeof(req.body['shop-config-set-persons']) == 'object' ? req.body['shop-config-set-persons'] : [req.body['shop-config-set-persons']];
    const idShop = req.body['shop-config-id-shop'];

    //Pegando o nome da loja
    const shopData = await database
    .select("jcv_trade_shops_id","jcv_trade_shops_name")
    .where({jcv_trade_shops_id: idShop})
    .table("jcv_trade_shops")
    .then( data => {
        return data;
    })

    if(allUsers != ''){

        database
        .update({
            jcv_trade_shops_users: allUsers.join()
        })
        .where({jcv_trade_shops_id: idShop})
        .table("jcv_trade_shops")
        .then( data => {
            if(data != ''){
                res.cookie('SYS-NOTIFICATION-EXE1', "SYS01| Os usuarios da loja <b>"+shopData[0].jcv_trade_shops_name+"</b> foram atualizados com sucesso!.");
                res.redirect("/painel/trademkt/shops");
            }else{
                res.cookie('SYS-NOTIFICATION-EXE1', "SYS03| Erro ao atualizar usuarios da loja <b>"+shopData[0].jcv_trade_shops_name+"</b>.");
                res.redirect("/painel/trademkt/shops");
            }
        })
    }else{
        database
        .update({
            jcv_trade_shops_users: null
        })
        .where({jcv_trade_shops_id: idShop})
        .table("jcv_trade_shops")
        .then( data => {
            if(data != ''){
                res.cookie('SYS-NOTIFICATION-EXE1', "SYS01| Foram removidos os usuarios da loja <b>"+shopData[0].jcv_trade_shops_name+"</b>.");
                res.redirect("/painel/trademkt/shops");
            }else{
                res.cookie('SYS-NOTIFICATION-EXE1', "SYS03| Erro ao remover os usuarios da loja <b>"+shopData[0].jcv_trade_shops_name+"</b>.");
                res.redirect("/painel/trademkt/shops");
            }
        })
    }

    


}