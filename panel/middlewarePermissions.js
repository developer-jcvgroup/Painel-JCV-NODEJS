const database = require("./database/database");

async function getPermissions (req, res, next) {

    const resultPermissions = await database
    .select("jcv_users.jcv_userCassification","jcv_users_permissions.*")
    .where({sys_perm_idUser: GLOBAL_DASH[0]})
    .table("jcv_users_permissions")
    .join("jcv_users", "jcv_users_permissions.sys_perm_idUser",'=','jcv_users.jcv_id')
    .then( data => {
        return data;
    })

    //Pegando e tranformando em array a URL
    const urlPage = req.path.split('/');urlPage.shift();

    //PROGRAMA DA BELEZA
    if(urlPage[0] == "beleza"){

        let pageError = true;
        //USER:
        if(urlPage[1] == "solicitar" && resultPermissions[0].sys_blz_perm_use == 1){
            return next();
        }
        if(urlPage[1] == "status" && resultPermissions[0].sys_blz_perm_use == 1){
            return next();
        }
        if(urlPage[1] == "listaItens" && resultPermissions[0].sys_blz_perm_use == 1){
            return next();
        }
      
        //ADMIN:
        if(urlPage[1] == "solicitacoes" && resultPermissions[0].sys_blz_perm_admin == 1){
            return next();
        }
        if(urlPage[1] == "produtos" && resultPermissions[0].sys_blz_perm_manager == 1 || resultPermissions[0].sys_blz_perm_admin == 1){
            return next();
        }

        //Não foi encontrado
        if(pageError){
            res.cookie('SYS-NOTIFICATION-EXE1', "SYS03| Você não possui permissão");
            res.redirect("/painel");
        }
    }


    //REQUISITOR DE MATERIAIS
    if(urlPage[0] == "requisitor"){

        let pageError = true;
        //USER
        if(urlPage[1] == "Novo" && resultPermissions[0].sys_req_perm_use == 1){
            return next();
        }
        if(urlPage[1] == "EditarRequisicao" && resultPermissions[0].sys_req_perm_use == 1){
            return next();
        }
        if(urlPage[1] == "VisualizarRequisicao" && resultPermissions[0].sys_req_perm_use == 1){
            return next();
        }
        if(urlPage[1] == "ReceberRequisicao" && resultPermissions[0].sys_req_perm_use == 1){
            return next();
        }
        if(urlPage[1] == "MinhasRequisicoes" && resultPermissions[0].sys_req_perm_use == 1){
            return next();
        }
        if(urlPage[1] == "itemsAll" && resultPermissions[0].sys_req_perm_use == 1){
            return next();
        }

        //ADMIN
        if(urlPage[1] == "ListaRequisicoes" && resultPermissions[0].sys_req_perm_admin == 1){
            return next();
        }
        if(urlPage[1] == "Items" && resultPermissions[0].sys_req_perm_manager == 1 || resultPermissions[0].sys_req_perm_admin == 1){
            return next();
        }

        //Não foi encontrado
        if(pageError){
            res.cookie('SYS-NOTIFICATION-EXE1', "SYS03| Você não possui permissão");
            res.redirect("/painel");
        }
    }

    //CONFIGURAÇÃO DO SISTEMA
    if(urlPage[0] == "system"){

        let pageError = true;
        //ADMIN GERAL
        if(urlPage[1] == "users" && resultPermissions[0].jcv_userCassification == 1){
            return next();
        }
        if(urlPage[1] == "unidades" && resultPermissions[0].jcv_userCassification == 1){
            return next();
        }
        if(urlPage[1] == "departamentos" && resultPermissions[0].jcv_userCassification == 1){
            return next();
        }

        //Não foi encontrado
        if(pageError){
            res.cookie('SYS-NOTIFICATION-EXE1', "SYS03| Você não possui permissão");
            res.redirect("/painel");
        }

    }

    //CONFIGURAÇÃO DO CALENDARIO
    if(urlPage[0] == "calendario"){

        let pageError = true;
        //ADMIN GERAL
        if(urlPage[1] == "main" && resultPermissions[0].sys_cal_perm_use == 1){
            return next();
        }
        if(urlPage[1] == "event" && resultPermissions[0].sys_cal_perm_use == 1){
            return next();
        }
        if(urlPage[1] == "room" && resultPermissions[0].sys_cal_perm_manager == 1){
            return next();
        }
        if(urlPage[1] == "viewRoom" && resultPermissions[0].sys_cal_perm_use == 1){
            return next();
        }
        if(urlPage[1] == "viewEvent" && resultPermissions[0].sys_cal_perm_use == 1){
            return next();
        }

        //Não foi encontrado
        if(pageError){
            res.cookie('SYS-NOTIFICATION-EXE1', "SYS03| Você não possui permissão");
            res.redirect("/painel");
        }

    }




}

module.exports = getPermissions;