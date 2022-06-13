const database = require("../../database/database");
const databaseCertificates = require("../../database/databaseCertificates");
const uuid = require('uuid')

const moment = require("moment");
moment.tz.setDefault('America/Sao_Paulo');

function generateDate(){
    moment.locale('pt-br');
    return moment().format('LT')+" "+moment().format('L')
}

exports.cursosMain = async (req,res) => {

    //Pegar os usuarios nomes
    const getAllUsers = await database
    .select("jcv_id","jcv_userNamePrimary")
    .table("jcv_users")
    .join("jcv_users_permissions","jcv_users_permissions.sys_perm_idUser","jcv_users.jcv_id")
    .then( data => {
        let objNew = []
        
        data.forEach(element => {
            objNew[element.jcv_id] = element.jcv_userNamePrimary
        });
        return objNew
    })

    //Pegando os cursos totais sem restrição
    const getAllCourseEnabled = await databaseCertificates
    .select("")
    .whereIn('jcv_course_status', [1,3])
    .table("jcv_course")
    .then( data => {return data})

    const getAllCourseFinalyEnd = await databaseCertificates
    .select("")
    .whereRaw("jcv_course_status != 1")
    .table("jcv_course")
    .then( data => {return data})

    const getPermissionCourses = await database
    .select("sys_courses_perm_admin","sys_courses_perm_manager")
    .where({sys_perm_idUser: GLOBAL_DASH[0]})
    .table("jcv_users_permissions")
    .then( data => {return data})

    var page = "cursos/cursosMain";
    res.render("panel/index", {
        page: page, 
        getAllCourseEnabled: getAllCourseEnabled, 
        getAllCourseFinalyEnd: getAllCourseFinalyEnd, 
        getAllUsers: getAllUsers, 
        getPermissionCourses: getPermissionCourses
    })
}

exports.cursosNew = async (req,res) => {

    //Pegar os usuarios que tem permissão para administrar
    const getAllUsers = await database
    .select("jcv_userNamePrimary")
    .table("jcv_users")
    .whereRaw(`sys_courses_perm_manager = 1 OR sys_courses_perm_admin = 1`)
    .join("jcv_users_permissions","jcv_users_permissions.sys_perm_idUser","jcv_users.jcv_id")
    .then( data => {
        return data.map(function(value){
            return value.jcv_userNamePrimary;
        })
    })
    
    var page = "cursos/cursosNew";
    res.render("panel/index", {page: page, getAllUsers: getAllUsers})
}

exports.saveNewCourse = async (req,res) => {

    const courseName = req.body['course-name']
    const courseTotalHours = req.body['course-total-hours']
    let courseManager;
    const courseBrand = req.body['course-brand']
    const courseInitial = req.body['course-initial']
    const courseStatus = req.body['course-status']
    const courseDescription = req.body['course-description']
    const courseTextCertificate = req.body['course-text-certificate']

    //Validando o instrutor
    await database
    .select("")
    .whereRaw(`jcv_userNamePrimary = '${req.body['course-manager']}' AND sys_courses_perm_manager = 1 OR sys_courses_perm_admin = 1`)
    .table("jcv_users")
    .join("jcv_users_permissions","jcv_users_permissions.sys_perm_idUser","jcv_users.jcv_id")
    .then( data => {
        courseManager = data[0].jcv_id != '' ? data[0].jcv_id : '';
    })


    if(courseName,courseTotalHours,courseManager,courseBrand,courseInitial,courseStatus,courseDescription != ''){
        
        //Podemos cadastrar o curso

        await databaseCertificates.insert({
            jcv_course_name: courseName,
            jcv_course_total_hours: courseTotalHours,
            jcv_course_manager_course: courseManager,
            jcv_course_created: GLOBAL_DASH[0],
            jcv_course_brand: courseBrand,
            jcv_course_initial_date: courseInitial,
            jcv_course_description: courseDescription,
            jcv_course_status: parseInt(courseStatus),
            jcv_course_uuid: uuid.v1(),
            jcv_course_text: courseTextCertificate
        })
        .table("jcv_course")
        .then( data => {
            if(data != ''){
                res.cookie('SYS-NOTIFICATION-EXE1', "SYS01| Curso <b>"+courseName+"</b> criado com sucesso!");
                res.redirect("/painel/cursos/main");
            }
        })

    }else{
        res.cookie('SYS-NOTIFICATION-EXE1', "SYS02| Existem valores a ser preenchido!");
        res.redirect("/painel/cursos/new");
    }
}

exports.cursosEdit = async (req,res) => {

    const idCourse = req.params.id;

    let validadeDitGet = await databaseCertificates
    .select()
    .where({jcv_course_id: idCourse})
    .table("jcv_course")
    .then( data => {
        return data
    })

    if( validadeDitGet != ''){
        //Curso encontrado

        //Pegar os usuarios que tem permissão para gerir
        const getAllUsers = await database
        .select("jcv_userNamePrimary")
        .table("jcv_users")
        .whereRaw(`sys_courses_perm_manager = 1 OR sys_courses_perm_admin = 1`)
        .join("jcv_users_permissions","jcv_users_permissions.sys_perm_idUser","jcv_users.jcv_id")
        .then( data => {
            return data.map(function(value){
                return value.jcv_userNamePrimary;
            })
        })

        //Pegar os usuarios nomes
        const getAllUsersObj = await database
        .select("jcv_id","jcv_userNamePrimary")
        .table("jcv_users")
        .then( data => {
            let objNew = []
            
            data.forEach(element => {
                objNew[element.jcv_id] = element.jcv_userNamePrimary
            });
            return objNew
        })

        var page = "cursos/cursosEdit";
        res.render("panel/index", {page: page, allInfo: validadeDitGet, getAllUsers: getAllUsers, getAllUsersObj: getAllUsersObj})

    }else{
        res.cookie('SYS-NOTIFICATION-EXE1', "SYS03| Nenhum curso encontrado!");
        res.redirect("/painel/cursos/main");
    }

}

exports.saveEditCourse = async (req,res) => {

    const courseId = req.body['id-course']

    const courseName = req.body['course-name']
    const courseTotalHours = req.body['course-total-hours']
    let courseManager;
    const courseBrand = req.body['course-brand']
    const courseInitial = req.body['course-initial']
    const courseStatus = req.body['course-status']
    const courseDescription = req.body['course-description']
    const courseTextCertificate = req.body['course-text-certificate']

    //Validando o instrutor
    await database
    .select("")
    .whereRaw(`jcv_userNamePrimary = '${req.body['course-manager']}'`)
    .table("jcv_users")
    .join("jcv_users_permissions","jcv_users_permissions.sys_perm_idUser","jcv_users.jcv_id")
    .then( data => {
        courseManager = data != '' ? data[0].jcv_id : '';
    })

    if(courseManager != ''){
        if(courseName,courseTotalHours,courseManager,courseBrand,courseInitial,courseStatus,courseDescription != ''){
        
            //Podemos cadastrar o curso
    
            databaseCertificates.update({
                jcv_course_name: courseName,
                jcv_course_total_hours: courseTotalHours,
                jcv_course_manager_course: courseManager,
                jcv_course_created: GLOBAL_DASH[0],
                jcv_course_brand: courseBrand,
                jcv_course_initial_date: courseInitial,
                jcv_course_description: courseDescription,
                jcv_course_status: courseStatus,
                jcv_course_text: courseTextCertificate
            })
            .where({jcv_course_id: courseId})
            .table("jcv_course")
            .then( data => {
                if(data == 1){
                    res.cookie('SYS-NOTIFICATION-EXE1', "SYS01| Curso <b>"+courseName+"</b> editado com sucesso!");
                    res.redirect("/painel/cursos/main");
                }
            })
    
        }else{
            res.cookie('SYS-NOTIFICATION-EXE1', "SYS02| Existem valores a ser preenchido!");
            res.redirect("/painel/cursos/new");
        }
    }
}

exports.courseDelete = async (req,res) => {

    const couserId = req.body['button-delete-couser'];

    const validationCourse = await databaseCertificates
    .select()
    .where({jcv_course_id: couserId})
    .table("jcv_course")
    .then (data => {return data})

    if(validationCourse != ''){
        databaseCertificates
        .delete()
        .where({jcv_course_id: couserId})
        .table("jcv_course")
        .then( data => {
            if(data == 1){
                res.cookie('SYS-NOTIFICATION-EXE1', "SYS01| Curso deletado com sucesso!");
                res.redirect("/painel/cursos/main");
            }else{
                res.cookie('SYS-NOTIFICATION-EXE1', "SYS02| Erro ao deleta o curso");
                res.redirect("/painel/cursos/edit/"+couserId);
            }
        })
    }else{
        res.cookie('SYS-NOTIFICATION-EXE1', "SYS02| Erro ao deleta o curso*");
        res.redirect("/painel/cursos/edit/"+couserId);
    }

}

exports.cursosStartup = async (req,res) => {

    const courseId = req.params.id;

    const validationCourse = await databaseCertificates
    .select()
    .where({jcv_course_id: courseId})
    .table("jcv_course")
    .then (data => {return data})

    //Validando se o cusrso esta finalazado
    if(validationCourse[0].jcv_course_status == 4){
        res.cookie('SYS-NOTIFICATION-EXE1', "SYS02| Curso já finalizado");
        res.redirect("/painel/cursos/main");
    }else{
        //Lista de usuarios deste curso
        let getUsersCourse;
        if(validationCourse[0].jcv_course_array_users != null){
            getUsersCourse = await databaseCertificates
            .select()
            .whereIn('jcv_user_id', JSON.parse(validationCourse[0].jcv_course_array_users))
            .table("jcv_users")
            .then( data => {return data})
        }else{
            getUsersCourse = [];
        }

        //Pegando o usuario que vai ministrar o curso
        const getInfoIntructor = await database
        .select("jcv_userNamePrimary")
        .where({jcv_id: validationCourse[0].jcv_course_manager_course})
        .table("jcv_users")
        .then( data => {return data})

        //Pegando o usuario que criou o curso
        const getInfoCreater = await database
        .select("jcv_userNamePrimary")
        .where({jcv_id: validationCourse[0].jcv_course_created})
        .table("jcv_users")
        .then( data => {return data})

        //Pegandos as pessoas CADASTRADAS NO PORTAL DO CERTIFICADO
        const getAllInfoUsers = await databaseCertificates
        .select()
        .where({jcv_users_enabled: 1})
        .table("jcv_users")
        .then( data => {
            let newArrgen = [];
            data.forEach(element => {
                newArrgen.push(element.jcv_users_name, element.jcv_users_cpf)
            });
            return newArrgen
        })

        var page = "cursos/cursosStart";
        res.render("panel/index", {
            page: page, 
            getAllInfoUsers: getAllInfoUsers, 
            validationCourse: JSON.stringify(validationCourse), 
            getUsersCourse: JSON.stringify(getUsersCourse), 
            courseId: courseId,
            getInfoIntructor: getInfoIntructor,
            getInfoCreater: getInfoCreater
        })
    }


    
}

exports.startCourse = async (req,res) => {

    const dataObjUsers = req.body['button-start-course'] == '' ? false : JSON.parse(req.body['button-start-course']);
    //console.log(dataObjUsers)

    if(dataObjUsers == false){
        res.cookie('SYS-NOTIFICATION-EXE1', "SYS02| Dados essenciais estão faltando!");
        res.redirect("/painel/cursos/main");
    }else{
        let returnDataGetBase = await databaseCertificates
        .update({
            jcv_course_array_users: (dataObjUsers.listUsers),
            jcv_course_status: 3
        })
        .where({
            jcv_course_id: dataObjUsers.courseID
        })
        .table("jcv_course")
        .then( data => { return data})

        if(returnDataGetBase != ''){
            res.cookie('SYS-NOTIFICATION-EXE1', "SYS01| Curso iniciado com sucesso!");
            res.redirect("/painel/cursos/start/"+dataObjUsers.courseID);
        }else{
            res.cookie('SYS-NOTIFICATION-EXE1', "SYS02| Erro interno ao iniciar o curso");
            res.redirect("/painel/cursos/start/"+dataObjUsers.courseID);
        }
    }

}

exports.finalityCourse = async (req,res) => {

    const dataObjUsers = req.body['button-end-course'] == '' ? false : JSON.parse(req.body['button-end-course']);
    const saveAssinaturaBlob = req.body['save-ass'];

    //console.log(dataObjUsers.listUsers)
    if(dataObjUsers != false && saveAssinaturaBlob != ''){

        if(dataObjUsers.listUsers == ''){
            res.cookie('SYS-NOTIFICATION-EXE1', "SYS02| Dados essenciais estão faltando!");
            res.redirect("/painel/cursos/main");
        }else{
            databaseCertificates
            .update({
                jcv_course_array_users: (dataObjUsers.listUsers),
                jcv_course_signature: saveAssinaturaBlob,
                jcv_course_status: 4
            })
            .where({
                jcv_course_id: dataObjUsers.courseID
            })
            .table("jcv_course")
            .then( data => {
                if(data != ''){
                    res.cookie('SYS-NOTIFICATION-EXE1', "SYS01| Curso finalizado com sucesso!");
                    res.redirect("/painel/cursos/main");
                }else{
                    res.cookie('SYS-NOTIFICATION-EXE1', "SYS02| Erro interno ao finalizar o curso");
                    res.redirect("/painel/cursos/main");
                }
            })
        }

    }else{
        res.cookie('SYS-NOTIFICATION-EXE1', "SYS02| Dados essenciais estão faltando!");
        res.redirect("/painel/cursos/start/"+dataObjUsers.courseID);
    }

}

exports.moduleSicProfile = async (req,res) => {
    var page = "cursos/sincProfile";
    res.render("panel/index", {
        page: page,
    })
}

exports.moduleActionSync = async (req,res) => {

    //Pegando o CPF do usuario
    const getCPF = await database
    .select("jcv_userCpf","jcv_userNamePrimary","jcv_userEmailCorporate","jcv_userEmailFolks")
    .where({jcv_id: GLOBAL_DASH[0]})
    .table("jcv_users")
    .then( data =>{ return data})

    //Verificar se o usuario tem conta no portal de certificados
    const verifyAccount = await databaseCertificates
    .select()
    .where({jcv_users_cpf: getCPF[0].jcv_userCpf})
    .table("jcv_users")
    .then( data => { return data})

    if(verifyAccount != ''){
        //Possui já conta!
        res.cookie('SYS-NOTIFICATION-EXE1', "SYS01| Sincronismo já relizado! Acesse o portal utilizando o link próximo ao seu avatar!");
        res.redirect("/painel");
    }else{
        //Não possui, vamos sincronizar!!
        databaseCertificates
        .insert({
            jcv_users_name: getCPF[0].jcv_userNamePrimary,
            jcv_users_cpf: getCPF[0].jcv_userCpf,
            jcv_users_email_primary: getCPF[0].jcv_userEmailCorporate,
            jcv_users_email_secundary: getCPF[0].jcv_userEmailFolks,
            jcv_users_enabled: 1
        })
        .table("jcv_users")
        .then( data => {
            //console.log(data)
            if(data != 0){
                res.cookie('SYS-NOTIFICATION-EXE1', "SYS01| Sincronizado com sucesso! Acesse o portal utilizando o link próximo ao seu avatar!");
                res.redirect("/painel");
            }else{
                res.cookie('SYS-NOTIFICATION-EXE1', "SYS02| Erro interno ao sincronizar");
                res.redirect("/painel");
            }
        })
        
    }
}