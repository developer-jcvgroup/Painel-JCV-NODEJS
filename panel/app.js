const express = require("express");
const router = express.Router();
const multer  = require('multer');

const getPermissions = require("./middlewarePermissions");

//middle
const authenticate = require("./middleware");

const storage = multer.diskStorage({
    destination: (req, file, cb) =>{
        cb(null, 'public/panel/img/img-user')
    },
    filename: (req,file,cb) => {
        let typeImage = file.mimetype.split("/")[1];
        cb(null, 'userId-'+GLOBAL_DASH[0]+"."+typeImage)
    }
})

const upload = multer({ storage })

//Controllers da beleza
const programaBeleza = require("./controllers/beleza/controllersBeleza");
//Controller system: Home page
const homePanel = require("./controllers/index/controllerHome");
//Controller system: profile
const controllerProfile = require("./controllers/system/profile");
//Controller do requisitor
const requisitorMateriais = require("./controllers/requisitor/controllerOrder")
//Controller dos itens de requisitor
const itemsRequisitor = require("./controllers/requisitor/controllerItems")
//Controller Usuarios
const controllerUsers = require("./controllers/system/sysUsers")
//Controller departamentos
const controllerDepartment = require("./controllers/system/departments")
//Controller Calendar
const controllerCalendar = require("./controllers/calendar/controllerCalendar")
//Consollter System General
const controllerSystemGeneral = require("./controllers/system/sysGeneral")

/*===================================*/
//Index: criando informacoes globais do usuario



/*===================================*/



//Logout
router.get("/logout", (req,res)=> {
    req.session.cookieLogin = undefined;
    res.redirect("/");
})

//Pagina inicial
router.get("/", authenticate, getPermissions, homePanel.homeInfo)
router.post("/action/define/pass", homePanel.indexSetPass)


/***********************************/
/***********************************/
//Requisitor: Novo Pedido
router.get("/requisitor/Novo", authenticate, getPermissions, requisitorMateriais.listAllinformations)
router.post("/requisitor/create/order", authenticate, requisitorMateriais.createOrder);
router.post("/requisitor/new/item/request", authenticate, itemsRequisitor.requestItemAdmin)

//Requisitor: Editar Pedido
router.get("/requisitor/EditarRequisicao/:id?", authenticate, getPermissions, requisitorMateriais.editRequestUser);
router.post("/requisitor/EditarRequisicao/save/new/Request", authenticate, requisitorMateriais.editRequestUserCommand);

//Requisitor: Visualizar pedido
router.get("/requisitor/VisualizarRequisicao/:id?", authenticate, getPermissions, requisitorMateriais.viewRequest)
router.post("/requisitor/VisualizarRequisicao/view/order/download", authenticate, requisitorMateriais.viewDownloadOrder)//Botao de download pagina view

//Requisitor: Receber pedido *EXCLUIR, MUDOU PARA ENVIAR REQ*
//router.get("/requisitor/ReceberRequisicao/:id?", authenticate, getPermissions, requisitorMateriais.receberRequisicao)
//router.post("/requisitor/ReceberRequisicao/receber/finalizar", authenticate, requisitorMateriais.receberRequisicaoAction)
//router.post("/requisitor/ReceberRequisicao/receber/finalizar/force", authenticate, requisitorMateriais.receberRequisicaoActionForce)

//Requisitor: Enviar requisição
router.get("/requisitor/EnviarRequisicoes/:idsOrders?", authenticate, requisitorMateriais.sendRequests)

//Requisitor: Meus pedidos
router.get("/requisitor/MinhasRequisicoes", authenticate, getPermissions, requisitorMateriais.listMyRequests)
router.post("/requisitor/action/search/myRequests", authenticate, requisitorMateriais.searchMyRequest)
router.post("/requisitor/action/download/myRequest", authenticate, requisitorMateriais.myRequestDownload)
router.post("/requisitor/action/remove/myRequest", authenticate, requisitorMateriais.myRequestRemove)

//Requisitor: Lista de Pedidos {admin}
router.get("/requisitor/ListaRequisicoes", authenticate, getPermissions, requisitorMateriais.listRequsicoesAll)
router.post("/requisitor/action/list/requisicoes", authenticate, requisitorMateriais.actionSearchOrder)
router.post("/requisitor/action/commands/orders", authenticate, requisitorMateriais.actionCommandsORders)
router.post("/requisitor/admin/action/remove/myRequest", authenticate, requisitorMateriais.adminRequestRemove)
router.post("/requisitor/admin/action/download/myRequest", authenticate, requisitorMateriais.adminRequestDownload)

//Requisitor: Lista de Itens {admin}
router.get("/requisitor/Items", authenticate, getPermissions, itemsRequisitor.adminListAllItems)
router.post("/requisitor/save/item/edit", authenticate, itemsRequisitor.saveEditItem);
router.post("/requisitor/save/item/new", authenticate, itemsRequisitor.saveNewItem)
router.post("/requisitor/delete/item", authenticate, itemsRequisitor.deleteItem)

/***********************************/
/***********************************/
//Calendario: Pagina inicial
router.get("/calendario/main/:numberMonth?/:yearMonth?", authenticate, getPermissions, controllerCalendar.viewCalendarMonth)
//Calendario: Pagina de eventos
router.get("/calendario/event/:idEvent?/:dayEvent?/:monthEvent?/:yearEvent?", authenticate, getPermissions, controllerCalendar.viewEvent)
//Calendario: Pagina de salas
router.get("/calendario/room/RoomSettings", authenticate, getPermissions, controllerCalendar.roomSettings)


//Calendario: Pagina ver eventos da sala
router.get("/calendario/viewRoom/:idRoom/:monthRoom?", authenticate, getPermissions, controllerCalendar.viewRoom)

//Calendario: Ver evento do dia
router.get("/calendario/viewEvent/Day/:dayEvent?", authenticate, getPermissions, controllerCalendar.viewEventDay)

//Calendario: Criar novo evento
router.post("/calendario/main/register/new", authenticate, controllerCalendar.saveNewEvent)
router.post("/calendario/main/register/edit", authenticate, controllerCalendar.editSaveNewEvent)
//Remover evento
router.post("/calendario/main/delete/event", authenticate, controllerCalendar.deleteEvent)

//Calendario: Criar nova sala
router.post("/calendario/room/register/new", authenticate, controllerCalendar.registerNewRoom)
router.post("/calendario/room/register/edit", authenticate, controllerCalendar.editNewRoom)
router.post("/calendario/room/register/createQrCode", authenticate, controllerCalendar.createQrCode)

/***********************************/
/***********************************/
//Programa da Beleza: Solicitar
router.get("/beleza/solicitar", authenticate, getPermissions, programaBeleza.sysBLZrequest)
router.post("/beleza/action/solicitar", authenticate, programaBeleza.finalizarSolicitacao);

//Programa da Beleza: Status
router.get("/beleza/status", authenticate, getPermissions, programaBeleza.listOrder)
router.post("/beleza/request/cancel", authenticate, programaBeleza.cancelOrder);

//Programa da Beleza: Lista de solicitações
router.get("/beleza/solicitacoes", authenticate, getPermissions, programaBeleza.listRequests);
router.post("/beleza/requests/search", authenticate, programaBeleza.searchRequests);

//Programa da Beleza: Lista de produtos
router.get("/beleza/produtos", authenticate, getPermissions, programaBeleza.listProducts);
router.post("/beleza/register/product", authenticate, programaBeleza.registerProduct);
router.post("/beleza/status/products", authenticate, programaBeleza.statusProducts);
router.post("/beleza/actions/product/save", authenticate, programaBeleza.actionProductSave)
router.post("/beleza/actions/product/delete", authenticate, programaBeleza.actionProductDelete)

//Programa da beleza: operações em pedidos listados
router.post("/beleza/actions/orders/commands", authenticate, programaBeleza.actionsCommandsOrder)
//Programa da beleza: operações em pedidos separados
router.post("/beleza/actions/order/download", authenticate, programaBeleza.actionsCommandsUnityDownload)
router.post("/beleza/actions/order/delete", authenticate, programaBeleza.actionsCommandsUnityCancel)

/***********************************/
/***********************************/
//Sistema: Usuarios, permissoes, departamentos, unidades
router.get("/system/users", authenticate, getPermissions, controllerUsers.listAllinformations)

//Salvar novo usuario
router.post("/system/action/sys/user/save", authenticate, controllerUsers.saveNewUser)
//Salvar um usuario editado
router.post("/system/action/sys/user/save-edit", authenticate, controllerUsers.editSaveUser)
//Resetar a senha do usuario
router.post("/system/action/sys/user/resetpass", authenticate, controllerUsers.resetPassUser)

//Departamentos
router.get("/system/departamentos", authenticate, getPermissions, controllerDepartment.listDepartments)
router.post("/system/department/action/saveEdit", authenticate, controllerDepartment.editSaveDepartment)
router.post("/system/department/action/save", authenticate, controllerDepartment.saveNewDepartment)

//Sistema: Unidades
router.get("/system/unidades", authenticate, getPermissions, controllerDepartment.listUnitys)
router.post("/system/unidades/action/save", authenticate, controllerDepartment.saveUnity)
router.post("/system/unidades/action/save/edit", authenticate, controllerDepartment.saveEditUnity)

/***********************************/
//Pagina: Perfil
router.get("/perfil", authenticate, controllerProfile.getInfoUser);
//Alterando a senha
router.post("/perfil/pass/redefine", authenticate, controllerProfile.sysNewpassword);
//Update dos dados
router.post("/perfil/update", authenticate, controllerProfile.updateDataUser);
router.post("/perfil/update/image", authenticate, upload.single('userImageUpload'), controllerProfile.updateImageUser);

/***********************************/
/***********************************/
//Chat: Pagina inicial
router.get("/chat", authenticate,(req,res)=>{

    res.cookie('SYS-NOTIFICATION-EXE1', "SYS03|Em desenvolvimento...");
    res.redirect("/painel")

    /* var page = "chat/chat";
    res.render("panel/index", {page: page}) */
})


/***********************************/
/***********************************/
//Updates: Pagina inicial
router.get("/updates", authenticate,(req,res)=>{

    res.cookie('SYS-NOTIFICATION-EXE1', "SYS03|Em desenvolvimento...");
    res.redirect("/painel")

    /* var page = "system/updates";
    res.render("panel/index", {page: page}) */
})

//Updates: Sistema de exibição do update
router.post("/update/closeUp", authenticate, controllerSystemGeneral.closeUpdateSingle)
router.post("/update/closeAll", authenticate, controllerSystemGeneral.closeUpdateAll)

/***********************************/
/***********************************/
//Notificações: Pagina inicial
router.get("/notifications", authenticate,(req,res)=>{

    res.cookie('SYS-NOTIFICATION-EXE1', "SYS03|Em desenvolvimento...");
    res.redirect("/painel")

    /* var page = "system/notifications";
    res.render("panel/index", {page: page}) */
})

/***********************************/
/***********************************/
//Logs do sistema: Pagina inicial
//router.get("/logs", authenticate, controllerSystemGeneral.systemLogs)

module.exports = router;