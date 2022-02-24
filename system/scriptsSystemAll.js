const database = require("./database");
const moment = require("moment");
const cron = require('node-cron');
moment.locale('pt-BR');

//Sistema de emails
const emailSystemExe = require('../panel/controllers/system/emailSystem');

async function lembreteCalendar(){

    //Mes atual
    var monthNumber = moment().month() < 10 ? '0'+ (1 + moment().month()) : 1 + moment().month();
    var yearMonth = moment().year();

    //Pegando todos os eventos do mes atual e validando o inicio de cada
    //para disparar emails de lembrete
    database
    .select()
    .where({sys_calendar_eventMonth: monthNumber+'/'+yearMonth})
    .table("jcv_calendar_registers")
    .join("jcv_unitys","jcv_calendar_registers.sys_calendar_eventLocation","jcv_unitys.sys_unity_id")
    .join("jcv_calendar_rooms","jcv_calendar_registers.sys_calendar_eventRoom","jcv_calendar_rooms.sys_calendar_roomId")
    .then( data => {
        
        data.forEach(element => {
            
            let converMinutesHours = moment().add(element.sys_calendar_eventReminder, 'minutes').format("HH:mm");

            //Validando se o evento esta prestes a começar
            if(converMinutesHours == element.sys_calendar_eventHours.split(' - ')[0] && element.sys_calendar_eventDate == moment().format("DD/MM/YYYY") ){
                
                database
                .select("jcv_userEmailCorporate")
                .whereRaw('jcv_id IN ('+element.sys_calendar_eventPersons+')')
                .table("jcv_users")
                .then( dataTwo => {

                    let newArrayEamils = [];
                    dataTwo.forEach(elementTwo => {
                        newArrayEamils.push(elementTwo.jcv_userEmailCorporate)
                    });

                    const textOne = 'Um evento está próximo de acontecer';
                    const textTwo = `Existe um evento que esta prestes a iniciar faltando apenas <b>${element.sys_calendar_eventReminder} minutos!</b>.<br> Nome do evento: <b>${element.sys_calendar_eventName}</b>. <br> Data do evento: <b>${element.sys_calendar_eventDate}</b>.  <br> Sala: <b>${element.sys_calendar_roomName}</b>. <br> Local: <b>${element.sys_unity_name}</b>`;
                    emailSystemExe.sendMailExe(newArrayEamils, 'Evento Próximo', 'Evento Próximo', 'Calendario', '', textOne, textTwo);

                })
            }else if(moment().add(1, 'minutes').format("HH:mm") == element.sys_calendar_eventHours.split(' - ')[0] && element.sys_calendar_eventDate == moment().format("DD/MM/YYYY")){
                //Caso nao esteje na hora programada pelo usuario, o sistema manda automaticamente o email faltando 1 minuto para o evento começar
                //Ou seja, o usuario recebe por padrão 2 emails de aviso sobre o eventos

                //Ele não vai mais executar a partir do dia (18/02/2022)
                
                /* database
                .select("jcv_userEmailCorporate")
                .whereRaw('jcv_id IN ('+element.sys_calendar_eventPersons+')')
                .table("jcv_users")
                .then( dataTwo => {

                    let newArrayEamils = [];
                    dataTwo.forEach(elementTwo => {
                        newArrayEamils.push(elementTwo.jcv_userEmailCorporate)
                    });

                    const textOne = 'Um evento está próximo de acontecer';
                    const textTwo = `Existe um evento que esta prestes a iniciar faltando apenas <b>1 minuto!</b>.<br> Nome do evento: <b>${element.sys_calendar_eventName}</b>. <br> Data do evento: <b>${element.sys_calendar_eventDate}</b>. <br> Sala: <b>${element.sys_calendar_roomName}</b>. <br> Local: <b>${element.sys_unity_name}</b>`;
                    emailSystemExe.sendMailExe(newArrayEamils, 'Evento Próximo', 'Evento Próximo', 'Calendario', '', textOne, textTwo);

                }) */
            }
        });

    })
}

async function validationTradeForms(){

    function alterStatusForm(id){
        database
        .update({jcv_trade_form_create_enabled: 0})
        .where({jcv_trade_form_create_id: id})
        .table("jcv_trade_form_create")
        .then( data => {
            if(data != 0){
                //console.log(data)
            }
        })
    }

    //Pegando todos os formularios
    database
    .select()
    .where({jcv_trade_form_create_enabled: 1})
    .table("jcv_trade_form_create")
    .then(data => {

        //console.log(data)
        
        if(data != ''){
            data.forEach(element => {

                let convDatOne = moment(element.jcv_trade_form_create_expired, 'DD/MM/YYYY')
                let convDatTwo = moment().format('YYYY-MM-DD')
                if(moment(convDatOne).isBefore(convDatTwo)){
                    console.log('este evento ja expirou')

                    //Função para desabilitar o form
                    alterStatusForm(element.jcv_trade_form_create_id)
                }else{
                    console.log('este form ainda pode ser respondido')
                }

            })
        }else{
            //Não existe forms para ser validado
        }
    })
}

cron.schedule('*/60 * * * * *', () => {
    console.log("Executando a tarefa CALENDAR INITIAL EVENT a cada minuto: "+moment().format("DD-MM-YYYY HH:mm:ss"))
    lembreteCalendar()
}, {
    scheduled: true,
    timezone: "America/Sao_Paulo"
});

cron.schedule('0 0 0 * * *', () => {
    console.log("Executando a tarefa VALIDE FORM TRADE a cada dia: "+moment().format("DD-MM-YYYY HH:mm:ss"))
    validationTradeForms()
}, {
    scheduled: true,
    timezone: "America/Sao_Paulo"
});