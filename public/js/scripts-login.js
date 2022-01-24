$(function(){
    let arrayCountPopUp = [];
$.fn.sys_popupSystem = async function(code, valueMsg){
    $("#system-section-notification").fadeIn();//deixando visivel a section principal

    if(code == "SYS01"){
        let idPopUp = arrayCountPopUp.push(+1);

        $("#sys-notifi-container-main").fadeIn()
        .append(`<div class="sys-notifi-box-one" id="sys-notifi-box-one-${idPopUp}">
        <div class="sys-notifi-mark-left-one"></div>
            <div class="sys-notifi-main-msg-display-one">
                <div class="sys-notifi-container-msg-center-one">
                    <div class="sys-notifi-icon-one"><i class="ri-check-line"></i></div>
                    <div class="sys-notifi-text-one">
                        <span id="sys-nofiti-text-one">${valueMsg}</span>
                    </div>
                </div>
            </div>
        </div>`);

        setTimeout(()=> {
            $("#sys-notifi-box-one-"+idPopUp).fadeOut(1000,function() { $(this).remove(); })
            arrayCountPopUp.splice(arrayCountPopUp.indexOf(idPopUp), 1)
        },5000)
    }
    
    if(code == "SYS02"){
        let idPopUp = arrayCountPopUp.push(+1);

        $("#sys-notifi-container-main").fadeIn()
        .append(`<div class="sys-notifi-box-two" id="sys-notifi-box-two-${idPopUp}">
        <div class="sys-notifi-mark-left-two"></div>
            <div class="sys-notifi-main-msg-display-two">
                <div class="sys-notifi-container-msg-center-two">
                    <div class="sys-notifi-icon-two"><i class="ri-error-warning-line"></i></div>
                    <div class="sys-notifi-text-two">
                        <span id="sys-nofiti-text-two">${valueMsg}</span>
                    </div>
                </div>
            </div>
        </div>`);

        setTimeout(()=> {
            $("#sys-notifi-box-two-"+idPopUp).fadeOut(1000,function() { $(this).remove(); })
            arrayCountPopUp.splice(arrayCountPopUp.indexOf(idPopUp), 1)
        },6000)
    }
    
    if(code == "SYS03"){

        let idPopUp = arrayCountPopUp.push(+1);

        $("#sys-notifi-container-main").fadeIn()
        .append(`<div class="sys-notifi-box-three" id="sys-notifi-box-three-${idPopUp}">
        <div class="sys-notifi-mark-left-three"></div>
            <div class="sys-notifi-main-msg-display-three">
                <div class="sys-notifi-container-msg-center-three">
                    <div class="sys-notifi-icon-three"><i class="ri-close-circle-line"></i></div>
                    <div class="sys-notifi-text-three">
                        <span id="sys-nofiti-text-three">${valueMsg}</span>
                    </div>
                </div>
            </div>
        </div>`);

        setTimeout(()=> {
            $("#sys-notifi-box-three-"+idPopUp).fadeOut(1000,function() { $(this).remove(); })
        },7000)

    }

    
    //Deletando os cookies
    await Cookies.remove("SYS-NOTIFICATION-EXE1")
    await Cookies.remove("SYS-NOTIFICATION-EXE2")
    await Cookies.remove("SYS-NOTIFICATION-EXE3")
}
//SISTEMA DE POPUP {Sucesso, atenção, erro}
if(Cookies.get("SYS-NOTIFICATION-EXE1") != undefined){
    //Sucesso!!
    const valuesCookiesEXE1 = Cookies.get("SYS-NOTIFICATION-EXE1").split("|");
    $.fn.sys_popupSystem(valuesCookiesEXE1[0], valuesCookiesEXE1[1]);
}
if(Cookies.get("SYS-NOTIFICATION-EXE2") != undefined){
    //Sucesso!!
    const valuesCookiesEXE2 = Cookies.get("SYS-NOTIFICATION-EXE2").split("|");
    $.fn.sys_popupSystem(valuesCookiesEXE2[0], valuesCookiesEXE2[1]);
}
if(Cookies.get("SYS-NOTIFICATION-EXE3") != undefined){
    //Sucesso!!
    const valuesCookiesEXE3 = Cookies.get("SYS-NOTIFICATION-EXE3").split("|");
    $.fn.sys_popupSystem(valuesCookiesEXE3[0], valuesCookiesEXE3[1]);
}

//LGPD
setInterval(() => {
    $("#system-lgpd-container").fadeOut()    
}, 7000);


//$.fn.sys_popupSystem("SYS01", "Teste")

//Valida se o usuario fez login antes e salvou em um cookie
if(Cookies.get('CPF-USER') != ''){
    //Aplicando o CPF no input
    $("#input-cpf").val(parseInt(Cookies.get('CPF-USER')))
}

//Buscando o CPF inserido no array de CPF
let valideInitial = arrayPassNull.indexOf($("#input-cpf").val())

//console.log($("#input-cpf").val())

//Validação Inicial: Caso ele econtre o CPF
if(valideInitial == -1){
    //console.log('CPF possui senha! {1}')
    
    //CPF encontrado: Habilitar o campo de senha 
    $("#index-form-container-password").append(`
        <label for="">Insira sua senha</label>
        <input type="password" name="cpfPassword" id="input-password">
    `)

}else{
    //console.log('CPF não possui senha! {1}')
}

//Caso o usuario digite o CPF dele
$("#input-cpf").keyup(function(){

    let boxPassWord = $("#index-form-container-password");

    //Caso o campo tenha 11 caractere ele faz uma validação
    if($(this).cleanVal().split('').length == 11){
        //console.log("CPF digitado tem 11 carac! {2}")

        //Criando um cookie que garda o CPF para inserir automaticamente no campo cpf
        Cookies.set('CPF-USER',parseInt($(this).cleanVal()))

        //Buscando o CPF no array
        let valide = arrayPassNull.indexOf(($(this).cleanVal()))

        //Caso encontre o CPF ele deve LOGAR SEM SENHA
        if(valide == -1){

            //Verifica se o input FILHO na div existe
            if(boxPassWord.children().length == 0){
                //CPF encontrado: Habilitar o campo de senha 
                $("#index-form-container-password").append(`
                    <label for="">Insira sua senha</label>
                    <input type="password" name="cpfPassword" id="input-password">
                `)
            }

        }else{
            //Removendo os elementos FILHOS
            boxPassWord.empty();
        }
    }else{
        //Removendo os elementos FILHOS
        boxPassWord.empty();
    }

});

$("#index-recovery-open").click(function(){
    $("#index-recover-pass").fadeIn();
    $("#index-recover-pass").css("display","flex");
})

$("#index-recover-close").click(function(){
    $("#index-recover-pass").fadeOut();
})

//Input mask login
$('#input-cpf').mask('000.000.000-00');

//Input mask reset pass
$('#input-cpf-reset-pass').mask('000.000.000-00');

//Spin loader
$(".class-loader").click(function(){
    $("#sys-section-loader").fadeIn();
})

textmsg.pop()
textauthor.pop()

var atualmsg = 0;
var atualauthor = 0;

$('#span-msg').text(textmsg[atualmsg++]);
setInterval(function() {
    $('#span-msg').fadeOut(function() {
        if (atualmsg >= textmsg.length) atualmsg = 0;
        $('#span-msg').text(textmsg[atualmsg++]).fadeIn();
    });
}, 7000);


$('#span-author').text(textauthor[atualauthor++]);
setInterval(function() {
    $('#span-author').fadeOut(function() {
        if (atualauthor >= textauthor.length) atualauthor = 0;
        $('#span-author').text(textauthor[atualauthor++]).fadeIn();
    });
}, 7000);

})