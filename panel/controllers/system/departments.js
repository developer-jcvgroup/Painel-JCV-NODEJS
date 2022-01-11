const database = require("../../database/database");

exports.listDepartments = async (req,res) => {

    database.select().table("jcv_departments").then( data => {

        var page = "system/departments";
        res.render("panel/index", {page: page, departments: data})
    })
}

exports.editSaveDepartment = async (req,res) => {
    const id = req.body['depart-edit-id-save'];

    const editName = req.body['depart-edit-name-'+id].toUpperCase();
    const editEnabled = parseInt(req.body['depart-edit-enabled-'+id] == 'on' ? 1 : 0)

    database.update({sys_department_name: editName, sys_department_enabled: editEnabled}).where({sys_department_id: id}).table("jcv_departments").then( data => {

        if(data != ''){
            res.cookie('SYS-NOTIFICATION-EXE1', "SYS01| Departamento salvo!");
            res.redirect("/painel/system/departamentos");
        }else{
            res.cookie('SYS-NOTIFICATION-EXE1', "SYS02| Erro ao salvar.");
            res.redirect("/painel/system/departamentos");
        }
    
    })
}

exports.saveNewDepartment = async (req,res) => {
    const depName = req.body['depart-save-name'].toUpperCase();
    const depEnabled = parseInt(req.body['depart-save-enabled'] == 'on' ? 1 : 0)

    database.insert({
        sys_department_name: depName,
        sys_department_enabled: depEnabled
    }).table("jcv_departments").then( data => {
        if(data > 0){
            res.cookie('SYS-NOTIFICATION-EXE1', "SYS01| Departamento salvo!");
            res.redirect("/painel/system/departamentos");
        }else{
            res.cookie('SYS-NOTIFICATION-EXE1', "SYS02| Erro ao salvar.");
            res.redirect("/painel/system/departamentos");
        }
    })
}

exports.listUnitys = async (req,res) => {
    database.select().table("jcv_unitys").then( data => {

        var page = "system/unidades";
        res.render("panel/index", {page: page, unitys: data})
    })
}

exports.saveUnity = (req,res) =>{
    const unityName = req.body['unidade-save-name'].toUpperCase();
    const unityRegion = req.body['unidade-save-region']
    const unityEnabled = parseInt(req.body['unidade-save-enabled'] == undefined ? 0 : 1);

    database.insert({
        sys_unity_name: unityName,
        sys_unity_region: unityRegion,
        sys_unity_enabled: unityEnabled
    }).table("jcv_unitys").then( data => {
        if(data > 0){
            res.cookie('SYS-NOTIFICATION-EXE1', "SYS01| Departamento salvo!");
            res.redirect("/painel/system/unidades");
        }else{
            res.cookie('SYS-NOTIFICATION-EXE1', "SYS02| Erro ao salvar.");
            res.redirect("/painel/system/unidades");
        }
    })
}

exports.saveEditUnity = (req,res) =>{
    const id = req.body['unitys-edit-id']
    
    const unityName = req.body['unitys-edit-name-'+id].toUpperCase();
    const unityRegion = req.body['unitys-edit-region-'+id].toUpperCase();
    const unityEnabled = parseInt(req.body['unitys-edit-enabled-'+id] == undefined ? 0 : 1);

    database.update({
        sys_unity_name: unityName,
        sys_unity_region: unityRegion,
        sys_unity_enabled: unityEnabled
    }).where({sys_unity_id: id}).table("jcv_unitys").then( data => {
        if(data > 0){
            res.cookie('SYS-NOTIFICATION-EXE1', "SYS01| Departamento salvo!");
            res.redirect("/painel/system/unidades");
        }else{
            res.cookie('SYS-NOTIFICATION-EXE1', "SYS02| Erro ao salvar.");
            res.redirect("/painel/system/unidades");
        }
    })
}