const database = require("./database/database");

async function getUpdates(idUser, moduleOp){
    //Verificando se existe menssagem de novas atualizações

    //Definindo que all pages
    let moduleOpSet = moduleOp == 'JCVMOD01' ? `'${moduleOp}'` : `'${moduleOp}','JCVMOD01'`;

    const allUpdate = await database
    .raw(`
        SELECT * from sys_update WHERE NOT JSON_CONTAINS(sys_update_usersOkUpdate, '${idUser}', '$') AND sys_update_moduleUp in (${moduleOpSet}) AND sys_update_enabled = 1 LIMIT 1
    `)
    /* .raw(`
        SELECT *
        FROM sys_update
        WHERE sys_update_usersOkUpdate = null OR NOT CONCAT(',', sys_update_usersOkUpdate, ',')
        REGEXP CONCAT('[,]', '${idUser}', '[,]') AND sys_update_moduleUp in ('${moduleOp}')
    `) */
    //.raw("SELECT locate("+idUser+", sys_update_usersOkUpdate) achado,sys_update.* FROM sys_update WHERE NOT locate("+idUser+", sys_update_usersOkUpdate) > 0 AND sys_update_moduleUp = '"+moduleOp+"'")
    .then( data => { return data[0]; })

    return allUpdate;
}

//async getPermissions = (urlArray) => (req, res, next) => 
const getPermissions = (urlArray) => async(req, res, next) => {

    const resultPermissions = await database
    .select("jcv_users.jcv_userCassification","jcv_users_permissions.*")
    .where({sys_perm_idUser: GLOBAL_DASH[0]})
    .table("jcv_users_permissions")
    .join("jcv_users", "jcv_users_permissions.sys_perm_idUser",'=','jcv_users.jcv_id')
    .then( data => {
        return data;
    })

    const getDataUser = await database
    .select("jcv_userEmailCorporate")
    .where({jcv_id: GLOBAL_DASH[0]})
    .table("jcv_users")
    .then(data => {return data})

    global.PROFILE_FINALYT = false;
    if(getDataUser[0].jcv_userEmailCorporate == null || getDataUser[0].jcv_userEmailCorporate == ''){
        //res.cookie('SYS-NOTIFICATION-EXE1', "SYS03| <b>Antes de utilizar os apps. Você precisa cadastrar um email!</b>");
        res.cookie('SYSTEM-NOTIFICATIONS-MODULE', `{"typeMsg": "error","message":"<b>Antes de utilizar os apps. Você precisa cadastrar um email!</b>","timeMsg": 4000}`);
        PROFILE_FINALYT = true;//O usuario precisa terminar seu cadastro
    }

    //Pegando e tranformando em array a URL
    const urlPage = urlArray;

    //PÁGINA INCIAL
    if(urlPage[0] == ''){
        //Pegando os updates deste modulo
        GLOBAL_DASH[11] = await getUpdates(GLOBAL_DASH[0], 'JCVMOD01')
        return next();
    }

    let objectPermissions = {
        "/": 1,
        "beleza/solicitar": resultPermissions[0].sys_blz_perm_use,
        "beleza/status": resultPermissions[0].sys_blz_perm_use,
        "beleza/solicitacoes": resultPermissions[0].sys_blz_perm_admin,
        "beleza/produtos": [resultPermissions[0].sys_blz_perm_manager, resultPermissions[0].sys_blz_perm_admin],

        "requisitor/novo": resultPermissions[0].sys_req_perm_use,
        "requisitor/EeditarRequisicao": resultPermissions[0].sys_req_perm_use,
        "requisitor/visualizarRequisicao": resultPermissions[0].sys_req_perm_use,
        "requisitor/minhasRequisicoes": resultPermissions[0].sys_req_perm_use,
        "requisitor/listaRequisicoes": resultPermissions[0].sys_req_perm_admin,
        "requisitor/items": resultPermissions[0].sys_req_perm_use,

        "system/users": resultPermissions[0].jcv_userCassification == 1 ? 1 : 0,
        "system/unidades": resultPermissions[0].jcv_userCassification,
        "system/departamentos": resultPermissions[0].jcv_userCassification,
        "system/products": [resultPermissions[0].sys_tra_perm_admin, resultPermissions[0].sys_blz_perm_manager],
        "system/users": resultPermissions[0].jcv_userCassification,
        "system/users/transfer": resultPermissions[0].jcv_userCassification == 1 ? 1 : 0,

        "formularios": resultPermissions[0].sys_forms_perm_admin,

        "calendario/main": resultPermissions[0].sys_cal_perm_use,
        "calendario/event": resultPermissions[0].sys_cal_perm_use,
        "calendario/room": resultPermissions[0].sys_cal_perm_admin,
        "calendario/viewRoom": resultPermissions[0].sys_cal_perm_use,
        "calendario/viewEvent": resultPermissions[0].sys_cal_perm_use,

        "notifications/main": resultPermissions[0].jcv_userCassification == 1 ? 1 : 0,
        "notifications/new": resultPermissions[0].jcv_userCassification == 1 ? 1 : 0,
        "notifications/edit": resultPermissions[0].jcv_userCassification == 1 ? 1 : 0,

        "cursos/main": [resultPermissions[0].sys_courses_perm_admin, resultPermissions[0].sys_courses_perm_manager],
        "cursos/start": [resultPermissions[0].sys_courses_perm_admin, resultPermissions[0].sys_courses_perm_manager],
        "cursos/new": resultPermissions[0].sys_courses_perm_admin,
        "cursos/edit": resultPermissions[0].sys_courses_perm_admin,

        "encurtador/main": resultPermissions[0].sys_enc_perm_use,
        "encurtador/new": resultPermissions[0].sys_enc_perm_use,
        "encurtador/edit": resultPermissions[0].sys_enc_perm_use,
        
        "trademkt/award/new": [resultPermissions[0].sys_tra_premiation_use, resultPermissions[0].sys_tra_premiation_admin],
        "trademkt/award/edit": [resultPermissions[0].sys_tra_premiation_use, resultPermissions[0].sys_tra_premiation_admin],
        "trademkt/award/list": [resultPermissions[0].sys_tra_premiation_use, resultPermissions[0].sys_tra_premiation_admin],

        "trademkt/main": [resultPermissions[0].sys_tra_perm_use, resultPermissions[0].sys_tra_perm_admin],
        "trademkt/formSearch": resultPermissions[0].sys_tra_perm_admin,
        "trademkt/visit": resultPermissions[0].sys_tra_perm_admin,
        "trademkt/listTrade": resultPermissions[0].sys_tra_perm_admin,
        "trademkt/edit": resultPermissions[0].sys_tra_perm_admin,
        "trademkt/form": [resultPermissions[0].sys_tra_perm_use, resultPermissions[0].sys_tra_perm_admin],
        "trademkt/salesDay": [resultPermissions[0].sys_tra_perm_use, resultPermissions[0].sys_tra_perm_admin],
        "trademkt/form/response": resultPermissions[0].sys_tra_perm_use,
        "trademkt/shops": resultPermissions[0].sys_tra_perm_admin,
        "trademkt/shops/config": resultPermissions[0].sys_tra_perm_admin,
        "trademkt/shops/maps": resultPermissions[0].sys_tra_perm_admin,

        "updates/main": resultPermissions[0].jcv_userCassification == 1 ? 1 : 0,
        "updates/new": resultPermissions[0].jcv_userCassification == 1 ? 1 : 0,
        "updates/edit": resultPermissions[0].jcv_userCassification == 1 ? 1 : 0,

        "notifications/main": resultPermissions[0].sys_notify_perm_admin,
        "notifications/new": resultPermissions[0].sys_notify_perm_admin,
        "notifications/edit": resultPermissions[0].sys_notify_perm_admin,

        "formularios/main": resultPermissions[0].sys_forms_perm_admin,
        "formularios/novo": resultPermissions[0].sys_forms_perm_admin,
        "formularios/edit": resultPermissions[0].sys_forms_perm_admin,

        "encurtador/main": resultPermissions[0].sys_enc_perm_use,
        "encurtador/novo": resultPermissions[0].sys_enc_perm_use,
        "encurtador/edit": resultPermissions[0].sys_enc_perm_use,

        "cursos/main": resultPermissions[0].sys_courses_perm_admin,
        "cursos/new": resultPermissions[0].sys_courses_perm_admin,
        "cursos/edit": resultPermissions[0].sys_courses_perm_admin,
        "cursos/delete": resultPermissions[0].sys_courses_perm_admin,//Post
        "cursos/start": [resultPermissions[0].sys_courses_perm_admin, resultPermissions[0].sys_courses_perm_manager],
    }

    async function validateParams (arrayGet, searchGet){
        let convertNewArr = []
        searchGet.forEach(element => {

            //Verificando se o parametro é referente a alguma edição, caso seja ele ira ignorar o parametro. ex: id, uuid da url
            if(element != '...'){convertNewArr.push(element)}
        })
      
        let convertAgain = convertNewArr.join('/')
    
        try{
          return typeof(arrayGet[convertAgain]) == 'object' ? arrayGet[convertAgain].indexOf(1) > -1 ? true : false : arrayGet[convertAgain] == 1 ? true : arrayGet[convertAgain] == 0 ? false : null
      }catch(err){
          alert('error')
      }
      
    }

    let validationGet = await validateParams(objectPermissions, urlPage)
    validationGet == true ? functionNetPage() : validationGet == null ? functionPageNull() : functionNotPermission()

    function functionNetPage(){
        //console.log('aaaaaaa')
        //GLOBAL_DASH[11] = await getUpdates(GLOBAL_DASH[0], 'JCVMOD02')
        next();
    }
    function functionPageNull(){
        res.cookie('SYSTEM-NOTIFICATIONS-MODULE', `{"typeMsg": "warning","message":"Página não encontrada","timeMsg": 4000}`);
        res.redirect("/painel");
    }
    function functionNotPermission(){
        res.cookie('SYSTEM-NOTIFICATIONS-MODULE', `{"typeMsg": "error","message":"Você não possui acesso a esta página","timeMsg": 4000}`);
        res.redirect("/painel");
    }


}

module.exports = getPermissions;