const database = require("../../database/database");
const moment = require("moment");
moment.tz.setDefault('America/Sao_Paulo');
const fs = require('fs')
const uuid = require('uuid')

const axios = require('axios')

//Sistema de emails
const emailSystemExe = require('../system/emailSystem');

//Data atual
function generateDate(){
    return moment().format('LT')+" "+moment().format('L')
}


exports.viewCalendarMonth = async (req,res) => {

    //console.log('Pr: '+[req.params.numberMonth, req.params.yearMonth])

    //Validando se tem o numero do mes na url, caso não
    let getParams = [req.params.numberMonth, req.params.yearMonth];
    //console.log(getParams)
    if(getParams.indexOf(undefined) > -1 || getParams.indexOf('null') > -1){
        //Pegando o mes atual como referencia para passar na url
        //var monthNumber = 1 + moment().month(); //O moment js interpreta o 0 como janeiro, por isso a soma
        var monthNumber = moment().month() < 10 ? '0'+ (1 + moment().month()) : 1 + moment().month();
        var yearMonth = moment().year();
        
        //console.log([monthNumber, yearMonth])

        res.redirect("/painel/calendario/main/"+monthNumber+"/"+yearMonth);

    }else{

        //console.log('aaaaaaaaa')

        //Dia numero
        const dayNow = moment().format("DD-MM-YYYY")
        //Mes (numero)
        const monthIndex = req.params.numberMonth;
        //Ano (Numero)
        const yearMonth = req.params.yearMonth;

        //Dias totais do mes
        const AllDays = moment(yearMonth+"-"+monthIndex, "YYYY-MM").daysInMonth();

        //Listando todos os eventos deste mes
        const allEventsMonth = await database
        .select()
        .where({sys_calendar_eventMonth: monthIndex+'/'+yearMonth})
        .join("jcv_users","jcv_calendar_registers.sys_calendar_eventUserId","jcv_users.jcv_id")
        .join("jcv_calendar_rooms","jcv_calendar_registers.sys_calendar_eventRoom","jcv_calendar_rooms.sys_calendar_roomId")
        .table("jcv_calendar_registers")
        .orderBy("sys_calendar_eventId","DESC")
        .then( data => {
            return data;
        })

        //Listando eventos PUBLICOS do mes
        const allEventsPublic = await database
        .select()
        .where({sys_calendar_eventMonth: monthIndex+'/'+yearMonth, sys_calendar_eventPublic: 1})
        .join("jcv_users","jcv_calendar_registers.sys_calendar_eventUserId","jcv_users.jcv_id")
        .table("jcv_calendar_registers")
        .orderBy("sys_calendar_eventId","DESC")
        .then( data => {
            return data;
        })

        //Listando eventos PRIVADOS do mes
        const allEventsPrivate = await database
        .select()
        .where({sys_calendar_eventMonth: monthIndex+'/'+yearMonth, sys_calendar_eventUserId: GLOBAL_DASH[0]})
        .join("jcv_users","jcv_calendar_registers.sys_calendar_eventUserId","jcv_users.jcv_id")
        .table("jcv_calendar_registers")
        .orderBy("sys_calendar_eventId","DESC")
        .then( data => {
            return data;
        })

        //Listando os eventos totais do mes
        const allEventsCount = await database
        .select()
        .where({sys_calendar_eventMonth: monthIndex+'/'+yearMonth})
        .table("jcv_calendar_registers")
        .then( data => {
            return data;
        })

        //Lisatando os locais
        const allLocations = await database
        .select()
        .where({sys_unity_enabled: 1})
        .table("jcv_unitys")
        .then( data => {
            return data;
        })

        //Listando os usuario que tem PERMISSAO PARA ACESSO AO CALENDARIO
        const allUsers = await database
        .select("jcv_users.jcv_userNamePrimary","jcv_users.jcv_id","jcv_users.jcv_userImageIcon")
        .join("jcv_users_permissions","jcv_users.jcv_id","jcv_users_permissions.sys_perm_idUser")
        .where({sys_cal_perm_use: 1, jcv_userEnabled: 1})
        .table("jcv_users")
        .then(date => {
            return date;
        })

        //console.log('aaaa')

        //Criando um array com id do Usuario, nome e icone
        let arrayUserSetCal = {}
        allUsers.forEach(element => {
            if(element.jcv_userImageIcon == null){
                arrayUserSetCal[element.jcv_id] = [element.jcv_userNamePrimary, '']
            }else{
                arrayUserSetCal[element.jcv_id] = [element.jcv_userNamePrimary, element.jcv_userImageIcon]
            }
            
        });

        //console.log(arrayUserSetCal)

        //Criando um array
        let newArrUsers = []
        allUsers.forEach(element => {
            newArrUsers.push(element.jcv_userNamePrimary);
        });

        //Listando as salas disponiveis
        const getAllRooms = await database
        .select()
        .where({sys_calendar_roomEnabled: 1})
        .table("jcv_calendar_rooms")
        .join("jcv_unitys","jcv_calendar_rooms.sys_calendar_roomUnity","jcv_unitys.sys_unity_id")
        .then( data => {
            return data;
        })

        //Calculando o proximo mes e ano
        let previousMonthYear = moment(monthIndex+'/'+yearMonth, "MM/YYYY").add(-1, 'M').format("MM/YYYY");
        let nextMonthYear = moment(monthIndex+'/'+yearMonth, "MM/YYYY").add(1, 'M').format("MM/YYYY");

        //Pegando o mes e ano string
        let dateNow = moment(monthIndex, 'M').format('MMMM')+' de '+moment(yearMonth, 'Y').format('YYYY')
        let first = dateNow.split('')[0].toLocaleUpperCase();
        let second = dateNow.substr(1);
        let nameMonthYear = first+second;

        //Pegando o numero do primeiro dia da semana [0,1,2,3,4,5,6]
        //console.log([yearMonth+'-'+monthIndex])
        const NumberDayWeek = moment(yearMonth+'-'+monthIndex).startOf('month').format('d');
        //console.log(`moment(${yearMonth}+'-'+${monthIndex}).startOf('month').format('d')`)
        //Validando se estamos no mes atual
        const monthAgo = moment().format("MM/YYYY") == monthIndex+'/'+yearMonth ? 1 : 0;

        //Pegando os feriados do ano do calendario
        let arrayFeriados = [];
        const getFeriados = await axios.get('https://brasilapi.com.br/api/feriados/v1/'+yearMonth)
        getFeriados.data.map(function(values){
            arrayFeriados.push(values.date+' - '+values.name)
        })

        var page = "calendar/calendar";
        res.render("panel/index", {page: page,
            nextMonthYear: nextMonthYear,
            previousMonthYear: previousMonthYear,
            nameMonthYear: nameMonthYear, 
            monthNow: monthIndex+'/'+yearMonth,
            AllDays: AllDays,
            NumberDayWeek: NumberDayWeek,
            dayNow: dayNow,
            allUsers: JSON.stringify(newArrUsers),
            allUsersSystem: arrayUserSetCal,
            allEventsMonth: allEventsMonth,
            allLocations: allLocations,
            allEventsPublic: allEventsPublic,
            allEventsPrivate: allEventsPrivate,
            getAllRooms: getAllRooms,
            allEventsCount: allEventsCount,
            monthAgo: monthAgo,
            arrayFeriados: arrayFeriados
        })
    }
}

exports.moduleSaveNewEvent = async(req,res) => {
    //console.log('olar')
    const eventName = req.body['event-register-name']
    const eventDescription = req.body['event-register-description']
    const eventDate = req.body['event-register-date'] == '' ? moment().format("DD/MM/YYYY") : moment(req.body['event-register-date']).format("DD/MM/YYYY")

    const eventInitialEnd = [req.body['event-register-initial'], req.body['event-register-end']]

    const eventLocation = JSON.parse(req.body['event-register-location']);
    const eventRemember = req.body['event-register-remember'];//In minutes
    const eventPersons = req.body['event-register-persons'].indexOf('[') > -1 ? JSON.parse(req.body['event-register-persons']).map(function(value){return parseInt(value)}) : [GLOBAL_DASH[0]];//Array

    const eventSendEmail = req.body['event-register-send-mails']
    
    //console.log([eventName, eventDate, eventInitialEnd, eventLocation, eventRemember])
    if([eventName, eventDate, eventInitialEnd, eventLocation, eventRemember].indexOf('') == -1){
        //Tudo certo
        //console.log(eventLocation)
        //Pegando o nome da sala
        const getRoomId = await database
        .select("sys_calendar_roomId","sys_calendar_roomName")
        .where({sys_calendar_roomId: eventLocation[0]})
        .table("jcv_calendar_rooms")
        .then( data => {
            return data[0]
        })

        //Pegando o nome do local
        const getLocateId = await database
        .select("sys_unity_id","sys_unity_name")
        .where({sys_unity_id: eventLocation[1]})
        .table("jcv_unitys")
        .then( data => {
            return data[0]
        })

        //Pegando todos eventos desta data
        const getAllEvent = await database
        .select()
        .where({sys_calendar_eventDate: eventDate, sys_calendar_eventRoom: eventLocation[1]})
        .table("jcv_calendar_registers")
        .then( data => {return data})

        async function executeValidationHours(){
            let validationEvent = false;
            if(getAllEvent != ''){
                getAllEvent.forEach(element => {

                    //console.log(getAllEvent[i])
        
                    let insertIntervalInitial = moment(eventInitialEnd[0],'hh:mm');
                    let insertIntervalFinal = moment(eventInitialEnd[1],'hh:mm');
        
                    let validateHours = element.sys_calendar_eventHours.split(' - ');
                    let registredInitial = moment(validateHours[0],'hh:mm');
                    let registredFinal = moment(validateHours[1],'hh:mm');
        
                    //Validando a hora inicial
                    if(moment(insertIntervalInitial).isBetween(registredInitial, registredFinal) == false){
                        //A data inicial está livre
                        //console.log('A data inicial está livre')
        
                        //Validando a hora final
                        if(moment(insertIntervalFinal).isBetween(registredInitial, registredFinal) == false){
                            //Horario final válido
                            //console.log('Horario final válido')
        
                            //Validando se os horarios do banco esta entre os horarios que o usuario inseriu
                            if(moment(registredInitial).isBetween(insertIntervalInitial, insertIntervalFinal) == false && moment(registredFinal).isBetween(insertIntervalInitial, insertIntervalFinal) == false){
                                //console.log('podemos registrar normalmente')
                                validationEvent = true;
                                //i = getAllEvent.length;
                            }else{
                                //console.log('as datas inseridas englobam a data do banco')
                            }
        
                        }else{
                            //Horario final já sendo usado
                            //console.log('Horario final já sendo usado')
                        }
                    }else{
                        //Data inicial já sendo usada, então vamos anular tudo! dar msg de erro
                        //console.log('Data inicial já sendo usada, então vamos anular tudo!')
                    }
                })
            }else{
                validationEvent = true
            }

            return validationEvent
        }

        let validationEvent = await executeValidationHours();
        //console.log(validationEvent)
        if(validationEvent == false){
            //Horarios inválido
            res.cookie('SYSTEM-NOTIFICATIONS-MODULE', `{"typeMsg": "error","message":"Horários inválidos","timeMsg": 3000}`);
            res.redirect("/painel/calendario/main");
        }else{
            //Tudo certo!

            //Convertendo os array de usuarios participanentes
            let arrayPersons = eventPersons
            //ICS
            let nameArquiveCalendar = 'JCV-EVENT-'+uuid.v1()+'.ics';

            const insertData = await database
            .insert({
                sys_calendar_eventUserId: GLOBAL_DASH[0],
                sys_calendar_eventName: eventName,
                sys_calendar_eventDescription: eventDescription,
                sys_calendar_eventDate: eventDate,
                sys_calendar_eventMonth: eventDate.split('/')[1]+'/'+eventDate.split('/')[2],
                sys_calendar_eventHours: eventInitialEnd.join(' - '),
                sys_calendar_eventPublic: 0,
                sys_calendar_eventLocation: getRoomId.sys_calendar_roomId,
                sys_calendar_eventReminder: eventRemember,
                sys_calendar_eventRoom: getLocateId.sys_unity_id,
                sys_calendar_eventPersons: JSON.stringify(arrayPersons),
                sys_calendar_nameIcs: nameArquiveCalendar,
                sys_calendar_eventCreateDate: generateDate(),
                sys_calendar_email_send: eventSendEmail
            }).table("jcv_calendar_registers")
            .then( dataInsert => {return dataInsert})

            //Validando disparo de emails
            if(eventSendEmail == 1 && insertData[0] > 0){
                //Disparar
                let newArrayEamils = database
                .select("jcv_userEmailCorporate","jcv_userEmailFolks")
                .whereRaw('jcv_id', arrayPersons)
                .table("jcv_users")
                .then( dato => {

                    let arrayGet = []
                    dato.forEach(element => {
                        if(element.jcv_userEmailCorporate != '' || element.jcv_userEmailCorporate != null){
                            arrayGet.push(element.jcv_userEmailCorporate)
                        }else if(element.jcv_userEmailFolks != '' || element.jcv_userEmailFolks != null){
                            arrayGet.push(element.jcv_userEmailFolks)
                        }
                    });

                    return arrayGet;
                    
                })

                const textOne = 'Evento criado!';
                const textTwo = `Olá, um evento foi criado onde você é um dos participantes!.</b><br> Criado por: <b>${GLOBAL_DASH[1]}</b>. <br> Data do evento: <b>${eventDate} | ${eventHourInitial} - ${eventInitialEnd}</b> <br> Nome do evento: <b>${eventName}</b>. <br> Sala: <b>${getRoomId.sys_calendar_roomName}</b>. <br> Local: <b>${getLocateId.sys_unity_name}</b>. <br><br> Link para adicionar no calendário: <a href="${PAINEL_URL+'/painel/calendario/download/'+nameArquiveCalendar}">Clique para adicionar</a> <br><br> Para maiores informações acesse o calendario jcv`;
                emailSystemExe.sendMailExe(newArrayEamils, 'Evento Criado', 'Evento Criado', 'Calendario', '', textOne, textTwo);
            }

            res.cookie('SYSTEM-NOTIFICATIONS-MODULE', `{"typeMsg": "success","message":"Evento <b>${eventName}</b> foi registrado com sucesso","timeMsg": 3000}`);
            res.redirect("/painel/calendario/main/"+eventDate.split('/')[1]+'/'+eventDate.split('/')[2]);

        }
    }else{
        //Erro
        res.cookie('SYSTEM-NOTIFICATIONS-MODULE', `{"typeMsg": "success","message":"<b>Dados necessarios faltando</b>","timeMsg": 3000}`);
        res.redirect("/painel/calendario/main");
    }

}
exports.moduleSaveEditEvent = async (req,res) => {
    
    const idEvent = req.body['button-save-edit-event'];

    const eventName = req.body['event-register-name']
    const eventDescription = req.body['event-register-description']
    const eventDate = req.body['event-register-date'] == '' ? moment().format("DD/MM/YYYY") : moment(req.body['event-register-date']).format("DD/MM/YYYY")

    const eventInitialEnd = [req.body['event-register-initial'], req.body['event-register-end']]

    const eventLocation = JSON.parse(req.body['event-register-location']);
    const eventRemember = req.body['event-register-remember'];//In minutes
    const eventPersons = req.body['event-register-persons'].indexOf('[') > -1 ? JSON.parse(req.body['event-register-persons']).map(function(value){return parseInt(value)}) : [GLOBAL_DASH[0]];//Array

    const eventSendEmail = req.body['event-register-send-mails']
    
    //console.log('parte 1')
    //console.log([eventName, eventDate, eventInitialEnd, eventLocation, eventRemember])
    if([eventName, eventDate, eventInitialEnd, eventLocation, eventRemember].indexOf('') == -1){
        //Tudo certo
        //console.log(eventLocation)
        //Pegando o nome da sala
        const getRoomId = await database
        .select("sys_calendar_roomId","sys_calendar_roomName")
        .where({sys_calendar_roomId: eventLocation[0]})
        .table("jcv_calendar_rooms")
        .then( data => {
            return data[0]
        })

        //Pegando o nome do local
        const getLocateId = await database
        .select("sys_unity_id","sys_unity_name")
        .where({sys_unity_id: eventLocation[1]})
        .table("jcv_unitys")
        .then( data => {
            return data[0]
        })

        //Pegando todos eventos desta data exeto o mesmo
        const getAllEvent = await database
        .select()
        .whereRaw(`sys_calendar_eventDate = "${eventDate}" AND sys_calendar_eventRoom = "${eventLocation[1]}" AND NOT sys_calendar_eventId = ${idEvent}`)
        .table("jcv_calendar_registers")
        .then( data => {return data})

        //console.log('parte 2')

        async function executeValidationHours(){
            let validationEvent = false;
            if(getAllEvent != ''){
                getAllEvent.forEach(element => {

                    //console.log(getAllEvent[i])
        
                    let insertIntervalInitial = moment(eventInitialEnd[0],'hh:mm');
                    let insertIntervalFinal = moment(eventInitialEnd[1],'hh:mm');
        
                    let validateHours = element.sys_calendar_eventHours.split(' - ');
                    let registredInitial = moment(validateHours[0],'hh:mm');
                    let registredFinal = moment(validateHours[1],'hh:mm');
        
                    //Validando a hora inicial
                    if(moment(insertIntervalInitial).isBetween(registredInitial, registredFinal) == false){
                        //A data inicial está livre
                        //console.log('A data inicial está livre')
        
                        //Validando a hora final
                        if(moment(insertIntervalFinal).isBetween(registredInitial, registredFinal) == false){
                            //Horario final válido
                            //console.log('Horario final válido')
        
                            //Validando se os horarios do banco esta entre os horarios que o usuario inseriu
                            if(moment(registredInitial).isBetween(insertIntervalInitial, insertIntervalFinal) == false && moment(registredFinal).isBetween(insertIntervalInitial, insertIntervalFinal) == false){
                                //console.log('podemos registrar normalmente')
                                validationEvent = true;
                                //i = getAllEvent.length;
                            }else{
                                //console.log('as datas inseridas englobam a data do banco')
                            }
        
                        }else{
                            //Horario final já sendo usado
                            //console.log('Horario final já sendo usado')
                        }
                    }else{
                        //Data inicial já sendo usada, então vamos anular tudo! dar msg de erro
                        //console.log('Data inicial já sendo usada, então vamos anular tudo!')
                    }
                })
            }else{
                validationEvent = true
            }

            return validationEvent
        }

        let validationEvent = await executeValidationHours();
        //console.log(validationEvent)

        //console.log('parte 3')
        if(validationEvent == false){
            //Horarios inválido
            res.cookie('SYSTEM-NOTIFICATIONS-MODULE', `{"typeMsg": "error","message":"Horários inválidos","timeMsg": 3000}`);
            res.redirect("/painel/calendario/main");
        }else{
            //Tudo certo!

            //Convertendo os array de usuarios participanentes
            let arrayPersons = eventPersons
            //ICS
            let nameArquiveCalendar = 'JCV-EVENT-'+uuid.v1()+'.ics';

            const insertData = await database
            .update({
                sys_calendar_eventUserId: GLOBAL_DASH[0],
                sys_calendar_eventName: eventName,
                sys_calendar_eventDescription: eventDescription,
                sys_calendar_eventDate: eventDate,
                sys_calendar_eventMonth: eventDate.split('/')[1]+'/'+eventDate.split('/')[2],
                sys_calendar_eventHours: eventInitialEnd.join(' - '),
                sys_calendar_eventPublic: 0,
                sys_calendar_eventLocation: getRoomId.sys_calendar_roomId,
                sys_calendar_eventReminder: eventRemember,
                sys_calendar_eventRoom: getLocateId.sys_unity_id,
                sys_calendar_eventPersons: JSON.stringify(arrayPersons),
                //sys_calendar_nameIcs: nameArquiveCalendar,
                //sys_calendar_eventCreateDate: generateDate(),
                sys_calendar_email_send: eventSendEmail
            })
            .where({sys_calendar_eventId: idEvent})
            .table("jcv_calendar_registers")
            .then( dataInsert => {return dataInsert})

            //console.log('parte 4')

            //Validando disparo de emails
            if(eventSendEmail == 1 && insertData == 1){
                //Disparar
                let newArrayEamils = await database
                .select("jcv_userEmailCorporate","jcv_userEmailFolks")
                .whereIn('jcv_id', arrayPersons)
                .table("jcv_users")
                .then( dato => {

                    let arrayGet = []
                    dato.forEach(element => {
                        if(element.jcv_userEmailCorporate != '' || element.jcv_userEmailCorporate != null){
                            arrayGet.push(element.jcv_userEmailCorporate)
                        }else if(element.jcv_userEmailFolks != '' || element.jcv_userEmailFolks != null){
                            arrayGet.push(element.jcv_userEmailFolks)
                        }
                    });

                    return arrayGet;
                    
                })

                //console.log(newArrayEamils)
                //console.log('aaa')
                
                const textOne = 'Evento criado!';
                const textTwo = `Olá, um evento foi criado onde você é um dos participantes!.</b><br> Criado por: <b>${GLOBAL_DASH[1]}</b>. <br> Data do evento: <b>${eventDate} | ${eventInitialEnd[0]} - ${eventInitialEnd[1]}</b> <br> Nome do evento: <b>${eventName}</b>. <br> Sala: <b>${getRoomId.sys_calendar_roomName}</b>. <br> Local: <b>${getLocateId.sys_unity_name}</b>. <br><br> Link para adicionar no calendário: <a href="${PAINEL_URL+'/painel/calendario/download/'+nameArquiveCalendar}">Clique para adicionar</a> <br><br> Para maiores informações acesse o calendario jcv`;
                emailSystemExe.sendMailExe(newArrayEamils, 'Evento Criado', 'Evento Criado', 'Calendario', '', textOne, textTwo);
            }

            //console.log('parte 5')

            res.cookie('SYSTEM-NOTIFICATIONS-MODULE', `{"typeMsg": "success","message":"Evento <b>${eventName}</b> foi registrado com sucesso","timeMsg": 3000}`);
            res.redirect("/painel/calendario/main");

        }
    }else{
        //Erro
        res.cookie('SYSTEM-NOTIFICATIONS-MODULE', `{"typeMsg": "success","message":"<b>Dados necessarios faltando</b>","timeMsg": 3000}`);
        res.redirect("/painel/calendario/main");
    }
}

exports.saveNewEvent = async (req,res) => {
    const eventName = req.body['calendar-register-name'];
    const eventDescription = req.body['calendar-register-description'];
    const eventDateDefault = req.body['calendar-register-date']//Stilo padrão do input data

    let eventDaySet = req.body['calendar-register-date'].split('-');
    const eventDay = eventDaySet[2]+'/'+eventDaySet[1]+'/'+eventDaySet[0];

    //Mes que vai ser redirecionado se der sucesso ou erro
    const monthCalendarRedirect = eventDaySet[1]+'/'+eventDaySet[0];

    const eventPublic = req.body['calendar-register-event-public'] == 'on' ? 1 : 0;
    const eventLocation = req.body['calendar-register-location'];
    const eventHourInitial = req.body['calendar-register-hour-initial'];
    const eventHourFinal = req.body['calendar-register-hour-final'];
    const eventReminder = req.body['calendar-register-reminder'];//FORMATO EM MINUTOS
    const eventRoom = req.body['calendar-register-room-'+eventLocation];//0 REPRESENTA NÃO USAREI SALA
    const eventPersons = req.body['calendar-register-persons'];
    
    //Pegando o nome da sala
    const getRoomName = await database
    .select("sys_calendar_roomName")
    .where({sys_calendar_roomId: eventRoom})
    .table("jcv_calendar_rooms")
    .then( data => {
        return data[0].sys_calendar_roomName
    })

    //Pegando o nome do local
    const getLocateName = await database
    .select("sys_unity_name")
    .where({sys_unity_id: eventLocation})
    .table("jcv_unitys")
    .then( data => {
        return data[0].sys_unity_name
    })

    if(moment(eventDateDefault).isBefore(moment().format("YYYY-MM-DD"))){
        //res.cookie('SYS-NOTIFICATION-EXE1', "SYS03|Data inferiror a data atual.");
        res.cookie('SYSTEM-NOTIFICATIONS-MODULE', `{"typeMsg": "warning","message":"Data inferiror a data atual.","timeMsg": 3000}`);
        res.redirect("/painel/calendario/main/"+monthCalendarRedirect);
    }else{

        //Validando se o LOCAL e SALA são parentes
        const validadeRooms = await database
        .select()
        .where({sys_calendar_roomUnity: eventLocation, sys_calendar_roomId: eventRoom})
        .table("jcv_calendar_rooms")
        .then(data => {
            if(data != ''){
                return true
            }else{
                return false
            }
        })

        if(validadeRooms != true){
            //res.cookie('SYS-NOTIFICATION-EXE1', "SYS03|Você não pode cadastrar um evento em salas diferentes!");
            res.cookie('SYSTEM-NOTIFICATIONS-MODULE', `{"typeMsg": "warning","message":"Você não pode cadastrar um evento em salas diferentes.","timeMsg": 3000}`);
            res.redirect("/painel/calendario/main/"+monthCalendarRedirect);
        }else{

            //Pegando as HORAS DISPONIVEIS DO DIA
            const hoursFree = await database
            .select("sys_calendar_eventHours")
            .where({
                sys_calendar_eventDate: eventDay,
                sys_calendar_eventRoom: eventRoom
            })
            .table("jcv_calendar_registers")
            .then( data => {
                return data;
            })

            //Validando os intervalos
            var format = 'HH:mm';
            let validationResult = true;//Inicialemnte a pessoa pode criar o evento

            hoursFree.forEach(element => {
                let eachElementOne = element.sys_calendar_eventHours.split(' - ')[0];
                let eachElementTwo = element.sys_calendar_eventHours.split(' - ')[1];

                var timeValidateInicial = moment(eventHourInitial,format);//Horario INICIAL a validar
                var timeValidateFinal = moment(eventHourFinal,format);//Horario FINAL a validar

                var initialTime = moment(eachElementOne,format).subtract(1, 'minute');//Horaio inicial
                var finalTime = moment(eachElementTwo, format).add(1, 'minute');//Horario final

                /* console.log(initialTime.format("HH:mm"))
                console.log(finalTime.format("HH:mm"))
                console.log('----')
                console.log(timeValidateInicial.format("HH:mm"))
                console.log(timeValidateFinal.format("HH:mm")) */

                if(timeValidateInicial.isBetween(initialTime, finalTime) == true || timeValidateFinal.isBetween(initialTime, finalTime) == true){
                    console.log("Voce não pode registrar nesse horario")
                    validationResult = false;
                }else{

                    if(initialTime.isBetween(timeValidateInicial, timeValidateFinal) == true || finalTime.isBetween(timeValidateInicial, timeValidateFinal) == true){
                        validationResult = false;
                    }else{
                        console.log("Voce pode registrar")

                        if(validationResult == false){
                            validationResult == true
                        }
                    }
                }
            });
            
            //Convertendo em array string
            let arrNewPerson = '';
            if(typeof(eventPersons) == 'object'){
                
                eventPersons.forEach(element => {
                    arrNewPerson+=element+',';
                });

                //Nova Array string
                arrNewPerson = arrNewPerson.substring(0, arrNewPerson.length - 1);
            }else{
                if(eventPersons != undefined){
                    arrNewPerson = GLOBAL_DASH[0]+','+eventPersons;
                }else{
                    arrNewPerson = [GLOBAL_DASH[0]];
                }
            }

            //Validando os inputs
            if(validationResult == false || eventName == '' || eventDay == '' || eventLocation == '' || eventHourInitial == '' || eventHourFinal == '' || eventRoom == ''){

                if(validationResult == false){
                    //res.cookie('SYS-NOTIFICATION-EXE1', "SYS03|Você não pode registrar um evento neste horario.");
                    res.cookie('SYSTEM-NOTIFICATIONS-MODULE', `{"typeMsg": "warning","message":"Você não pode registrar um evento neste horario.","timeMsg": 3000}`);
                    res.redirect("/painel/calendario/main/"+monthCalendarRedirect);
                }else{
                    //res.cookie('SYS-NOTIFICATION-EXE1', "SYS02|Falta dados cruciais para a criação do envento! Tente novamente.");
                    res.cookie('SYSTEM-NOTIFICATIONS-MODULE', `{"typeMsg": "warning","message":"Falta dados cruciais para a criação do envento! Tente novamente.","timeMsg": 3000}`);
                    res.redirect("/painel/calendario/main/"+monthCalendarRedirect);
                }
            }else{

                let nameArquiveCalendar = 'JCV-EVENT-'+uuid.v1()+'.ics';

                //Inserindo no banco
                database
                .insert({
                    sys_calendar_eventUserId: GLOBAL_DASH[0],
                    sys_calendar_eventName: eventName,
                    sys_calendar_eventDescription: eventDescription,
                    sys_calendar_eventDate: eventDay,
                    sys_calendar_eventMonth: eventDaySet[1]+'/'+eventDaySet[0],
                    sys_calendar_eventHours: eventHourInitial+' - '+eventHourFinal,
                    sys_calendar_eventPublic: eventPublic,
                    sys_calendar_eventLocation: eventLocation,
                    sys_calendar_eventReminder: eventReminder,
                    sys_calendar_eventRoom: eventRoom,
                    sys_calendar_eventPersons: arrNewPerson,
                    sys_calendar_nameIcs: nameArquiveCalendar,
                    sys_calendar_eventCreateDate: generateDate()
                }).table("jcv_calendar_registers").then(date => {
                    if(date != ''){

                        //Mandando emails para os os usuarios que irão participar
                        let arrayPersonSend;
                        if(arrNewPerson != ''){

                            if(typeof(arrNewPerson) == 'object'){
                                arrayPersonSend = arrNewPerson;
                            }else{
                                arrayPersonSend = arrNewPerson.split(',')
                            }

                            let newArrayEamils = [];
                            arrayPersonSend.forEach(element => {
                                database
                                .select("jcv_userEmailCorporate","jcv_userEmailFolks")
                                .where({jcv_id: element})
                                .table("jcv_users")
                                .then( dato => {
                                    
                                    if(dato[0].jcv_userEmailCorporate != '' || dato[0].jcv_userEmailCorporate != null){
                                        newArrayEamils.push(dato[0].jcv_userEmailCorporate)
                                    }else if(dato[0].jcv_userEmailFolks != '' || dato[0].jcv_userEmailFolks != null){
                                        newArrayEamils.push(dato[0].jcv_userEmailFolks)
                                    }
                                })
                            })

                            const textOne = 'Evento criado!';
                            const textTwo = `Olá, um evento foi criado onde você é um dos participantes!.</b><br> Criado por: <b>${GLOBAL_DASH[1]}</b>. <br> Data do evento: <b>${eventDay} | ${eventHourInitial} - ${eventHourFinal}</b> <br> Nome do evento: <b>${eventName}</b>. <br> Sala: <b>${getRoomName}</b>. <br> Local: <b>${getLocateName}</b>. <br><br> Link para adicionar no calendário: <a href="${PAINEL_URL+'/painel/calendario/download/'+nameArquiveCalendar}">Clique para adicionar</a> <br><br> Para maiores informações acesse o calendario jcv`;
                            emailSystemExe.sendMailExe(newArrayEamils, 'Evento Criado', 'Evento Criado', 'Calendario', '', textOne, textTwo);
                            
                        }

                        let convertArrPer = arrayPersonSend.map(convertString)
                        function convertString(value){
                            return parseInt(value)
                        }

                        //Adicionando este evento ao painel de notificações
                        database
                        .insert({
                            jcv_notifications_type: 'JCVMOD04',
                            jcv_notifications_usersId: JSON.stringify(convertArrPer),
                            jcv_notifications_users_view: '[]',
                            jcv_notifications_title: 'Calendário',
                            jcv_notifications_message: 'O evento <b>'+eventName+'</b> foi criado e conta com sua participação',
                            jcv_notifications_link: '/painel/calendario/main',
                            jcv_notifications_created: generateDate(),
                            jcv_notifications_enabled: 1
                        })
                        .table("jcv_notifications")
                        .then( data => {
                            //res.cookie('SYS-NOTIFICATION-EXE1', "SYS01|Evento <b>"+eventName+"</b> registrado com sucesso!");
                            res.cookie('SYSTEM-NOTIFICATIONS-MODULE', `{"typeMsg": "success","message":"Evento <b>${eventName}</b> registrado com sucesso!","timeMsg": 3000}`);
                            res.redirect("/painel/calendario/main/"+monthCalendarRedirect);
                        })
                    }
                })
            }   
        }
    }
}

exports.deleteEvent = async(req,res) => {
    const idEvent = req.body['delete-event'];

    //Pegando info do evento
    const infoEvent = await database
    .select()
    .where({sys_calendar_eventId: idEvent})
    .table("jcv_calendar_registers")
    .then( data => {
        return data
    })

    //Mandando o email referente ao evento
    await database
    .select()
    .where({sys_calendar_eventId: idEvent})
    .table("jcv_calendar_registers")
    .then (data => {
        //console.log(data[0])
        if(data[0].sys_calendar_email_send == 1){
            let newArrayUser = data[0].sys_calendar_eventPersons.split(',')

            let newArrayEamils = [];
            newArrayUser.forEach(element => {
                database
                .select("jcv_userEmailCorporate","jcv_userEmailFolks")
                .where({jcv_id: element})
                .table("jcv_users")
                .then( dato => {
                    
                    if(dato[0].jcv_userEmailCorporate != ''){
                        newArrayEamils.push(dato[0].jcv_userEmailCorporate)
                    }else if(dato[0].jcv_userEmailFolks != ''){
                        newArrayEamils.push(dato[0].jcv_userEmailFolks)
                    }
                })
            })

            const textOne = 'Evento Excluido!';
            const textTwo = `Olá, um evento foi excluido onde você era um dos participantes.</b><br> Excluido por: <b>${GLOBAL_DASH[1]}</b>. <br> Data do evento: <b>${data[0].sys_calendar_eventDate}</b> <br> Evento: <b>${data[0].sys_calendar_eventName}</b>. <br><br> Para maiores informações entre em contato com o responsável pelo evento`;
            emailSystemExe.sendMailExe(newArrayEamils, 'Evento Excluido', 'Evento Excluido', 'Calendario', '', textOne, textTwo);
        }
    })

    setTimeout(() => {
        database
        .delete()
        .where({sys_calendar_eventId: idEvent})
        .table("jcv_calendar_registers")
        .then( data => {
            if(data != ''){
                //res.cookie('SYS-NOTIFICATION-EXE1', "SYS01| <b>"+infoEvent[0].sys_calendar_eventName+"</b> deletado com sucesso!");
                res.cookie('SYSTEM-NOTIFICATIONS-MODULE', `{"typeMsg": "success","message":"<b>${infoEvent[0].sys_calendar_eventName}</b> deletado com sucesso!","timeMsg": 3000}`);
                res.redirect("/painel/calendario/main/"+infoEvent[0].sys_calendar_eventMonth);
            }
        })
    }, 500);
}

exports.viewEvent = async (req,res) => {
    //URL: 1° id do pedido / 2° dia do evento / 3° mes do evento / 4° ano do evento

    const idEvent = req.params.idEvent;
    const dayEvent = req.params.dayEvent;
    const monthEvent = req.params.monthEvent;
    const yearEvent = req.params.yearEvent;

    //Pegando o evento
    const getEvent = await database
    .select()
    .where({sys_calendar_eventId:idEvent})
    .join("jcv_calendar_rooms","jcv_calendar_registers.sys_calendar_eventRoom","jcv_calendar_rooms.sys_calendar_roomId")
    .join("jcv_unitys","jcv_calendar_registers.sys_calendar_eventLocation","jcv_unitys.sys_unity_id")
    .table("jcv_calendar_registers")
    .then( data => {
        return data;
    })

    //Lisatando os locais
    const allLocations = await database
    .select()
    .where({sys_unity_enabled: 1})
    .table("jcv_unitys")
    .then( data => {
        return data;
    })

    //Listando os usuario que tem PERMISSAO PARA ACESSO AO CALENDARIO
    const allUsers = await database
    .select("jcv_users.jcv_userNamePrimary","jcv_users.jcv_id")
    .join("jcv_users_permissions","jcv_users.jcv_id","jcv_users_permissions.sys_perm_idUser")
    .where({sys_cal_perm_use: 1, jcv_userEnabled: 1})
    .table("jcv_users")
    .then(date => {
        return date;
    })
    //Criando um array
    let newArrUsers = []
    allUsers.forEach(element => {
        newArrUsers.push(element.jcv_id+'-'+element.jcv_userNamePrimary);
    });

    //Pegando os usuarios do evento
    let getPersonsEvents;
    if(getEvent[0].sys_calendar_eventPersons != ''){
        getPersonsEvents = await database
        .select("jcv_userNamePrimary","jcv_id")
        .whereIn("jcv_id", getEvent[0].sys_calendar_eventPersons.indexOf('[') > -1 ? JSON.parse(getEvent[0].sys_calendar_eventPersons) : [getEvent[0].sys_calendar_eventPersons])
        .table("jcv_users")
        .then( data => {
            return data;
        })
    }else{
        getPersonsEvents = false;
    }

    //Pegando as unidades
    let getLocation = await database
    .select("sys_unity_name")
    .where({sys_unity_id: getEvent[0].sys_calendar_eventLocation})
    .table("jcv_unitys")
    .then( data => {
        return data;
    })
    

    if(getLocation == ''){
        getLocation = getEvent[0].sys_calendar_eventLocation;
    }

    //Listando as salas disponiveis
    const getAllRooms = await database
    .select()
    .where({sys_calendar_roomEnabled: 1})
    .table("jcv_calendar_rooms")
    .then( data => {
        return data;
    })

    if(getEvent != ''){
        let personsEvent;
        if(getEvent[0].sys_calendar_eventPersons == ''){
            personsEvent = false;
        }else{
            //Pegando os particiapentes do evento
            personsEvent = await database
            .select("jcv_userNamePrimary","jcv_userImageIcon")
            .whereIn("jcv_id", getEvent[0].sys_calendar_eventPersons.indexOf('[') > -1 ? JSON.parse(getEvent[0].sys_calendar_eventPersons) : [getEvent[0].sys_calendar_eventPersons])
            .table("jcv_users")
            .then( data => {
                return data;
            })    
        }

        var page = "calendar/viewEvent";
        res.render("panel/index", {
            page: page, 
            allDataEvent: getEvent, 
            getLocation: getLocation, 
            allDataPersons: personsEvent,
            allLocations: allLocations, 
            allUsers: newArrUsers,
            getPersonsEvents: getPersonsEvents,
            getAllRooms: getAllRooms,
            dateNowAcutal: generateDate()
        })
    }else{
        console.log('Erro')
    }
}

exports.editSaveNewEvent = async (req,res) => {
    const idEvent = req.body['button-edit-event'];//Id do evento

    const eventName = req.body['event-edit-register-name'];
    const eventDescription = req.body['event-edit-register-description'];

    let eventDaySet = req.body['event-edit-register-date'].split('-');
    const eventDay = eventDaySet[2]+'/'+eventDaySet[1]+'/'+eventDaySet[0];
    
    const eventPublic = req.body['event-edit-register-event-public'] == 'on' ? 1 : 0;
    const eventLocation = req.body['event-edit-register-location'];
    const eventHourInitial = req.body['event-edit-register-hour-initial'];
    const eventHourFinal = req.body['event-edit-register-hour-final'];
    const eventReminder = req.body['event-edit-register-reminder'];//FORMATO EM MINUTOS
    const eventRoom = req.body['event-edit-register-room-'+eventLocation];//0 REPRESENTA NÃO USAREI SALA

    const eventPersons = req.body['event-edit-register-persons'];

    //Pegando o nome da sala
    const getRoomName = await database
    .select("sys_calendar_roomName")
    .where({sys_calendar_roomId: eventRoom})
    .table("jcv_calendar_rooms")
    .then( data => {
        return data[0].sys_calendar_roomName
    })

    //Pegando o nome do local
    const getLocateName = await database
    .select("sys_unity_name")
    .where({sys_unity_id: eventLocation})
    .table("jcv_unitys")
    .then( data => {
        return data[0].sys_unity_name
    })
    
    //Mes que vai ser redirecionado se der sucesso ou erro
    const monthCalendarRedirect = eventDaySet[1]+'/'+eventDaySet[0];

    //console.log(eventDay)
    if(moment(eventDaySet).isBefore(moment().format("YYYY-MM-DD"))){
        //res.cookie('SYS-NOTIFICATION-EXE1', "SYS03|Você não pode modificar a data do evento! Data inferiror ao dia atual.");
        res.cookie('SYSTEM-NOTIFICATIONS-MODULE', `{"typeMsg": "warning","message":"Você não pode modificar a data do evento! Data inferiror ao dia atual","timeMsg": 3000}`);
        res.redirect("/painel/calendario/main/"+monthCalendarRedirect);
    }else{

        //Validando se o LOCAL e SALA são parentes
        const validadeRooms = await database
        .select()
        .where({sys_calendar_roomUnity: eventLocation, sys_calendar_roomId: eventRoom})
        .table("jcv_calendar_rooms")
        .then(data => {
            if(data != ''){
                return true
            }else{
                return false
            }
        })

        if(validadeRooms != true){
            //res.cookie('SYS-NOTIFICATION-EXE1', "SYS03|Você não pode cadastrar um evento em salas diferentes!");
            res.cookie('SYSTEM-NOTIFICATIONS-MODULE', `{"typeMsg": "warning","message":"Você não pode cadastrar um evento em salas diferentes!","timeMsg": 3000}`);
            res.redirect("/painel/calendario/main/"+monthCalendarRedirect);
        }else{

            //Pegando as HORAS DISPONIVEIS DO DIA
            const hoursFree = await database
            .select("sys_calendar_eventHours")
            .whereRaw("sys_calendar_eventDate = '"+eventDay+"' AND sys_calendar_eventId NOT IN("+idEvent+") AND sys_calendar_eventRoom = "+eventRoom)
            .table("jcv_calendar_registers")
            .then( data => {
                return data;
            })

            //console.log(hoursFree);

            //Validando os intervalos
            var format = 'hh:mm';
            let validationResult = true;//Inicialemnte a pessoa pode criar o evento

            hoursFree.forEach(element => {
                let eachElementOne = element.sys_calendar_eventHours.split(' - ')[0];
                let eachElementTwo = element.sys_calendar_eventHours.split(' - ')[1];

                var timeValidateInicial = moment(eventHourInitial,format);//Horario INICIAL a validar
                var timeValidateFinal = moment(eventHourFinal,format);//Horario FINAL a validar

                var initialTime = moment(eachElementOne,format).subtract(1, 'minutes');//Horaio inicial
                var finalTime = moment(eachElementTwo, format).add(1, 'minutes');//Horario final

                if(timeValidateInicial.isBetween(initialTime, finalTime) || timeValidateFinal.isBetween(initialTime, finalTime)){
                    console.log("Voce não pode editar nesse horario")
                    validationResult = false;
                }else{

                    if(initialTime.isBetween(timeValidateInicial, timeValidateFinal) == true || finalTime.isBetween(timeValidateInicial, timeValidateFinal) == true){
                        validationResult = false;
                    }else{
                        console.log("Voce pode editar neste horario")

                        if(validationResult == false){
                            validationResult == true
                        }
                    }
                }
            });

            //console.log(eventPersons)
            //Convertendo em array string
            let arrayPerson = eventPersons;
            let arrNewPerson = '';//Nova array

            if(typeof(eventPersons) == 'object'){
                
                eventPersons.forEach(element => {
                    arrNewPerson+=element+',';
                });

                //Nova Array string
                arrNewPerson = arrNewPerson.substring(0, arrNewPerson.length - 1);
            }else{
                arrNewPerson = eventPersons;
            }

            //Validando os inputs
            if(validationResult == false || eventName == '' || eventDay == '' || eventLocation == '' || eventHourInitial == '' || eventHourFinal == '' ||eventRoom == ''){
                if(validationResult == false){
                    //res.cookie('SYS-NOTIFICATION-EXE1', "SYS03|Você não pode modificar a hora do evento! Horários incompatíveis.");
                    res.cookie('SYSTEM-NOTIFICATIONS-MODULE', `{"typeMsg": "warning","message":"Você não pode modificar a hora do evento! Horários incompatíveis","timeMsg": 3000}`);
                    res.redirect("/painel/calendario/main/"+monthCalendarRedirect);
                }else{
                    //res.cookie('SYS-NOTIFICATION-EXE1', "SYS02|Falta dados cruciais para a criação do envento! Tente novamente.");
                    res.cookie('SYSTEM-NOTIFICATIONS-MODULE', `{"typeMsg": "error","message":"Falta dados cruciais para a criação do envento! Tente novamente","timeMsg": 3000}`);
                    res.redirect("/painel/calendario/main/"+monthCalendarRedirect);
                }
            }else{

                //pegando informações do evento
                const getInfoEventNow = await database
                .select("sys_calendar_nameIcs")
                .where({sys_calendar_eventId: idEvent})
                .table("jcv_calendar_registers")
                .then( data => {return data})

                let nameArquiveCalendar = getInfoEventNow[0].sys_calendar_nameIcs;


                //Inserindo no banco
                database
                .update({
                    sys_calendar_eventName: eventName,
                    sys_calendar_eventDescription: eventDescription,
                    sys_calendar_eventDate: eventDay,
                    sys_calendar_eventMonth: eventDaySet[1]+'/'+eventDaySet[0],
                    sys_calendar_eventHours: eventHourInitial+' - '+eventHourFinal,
                    sys_calendar_eventPublic: eventPublic,
                    sys_calendar_eventLocation: eventLocation,
                    sys_calendar_eventReminder: eventReminder,
                    sys_calendar_eventRoom: eventRoom,
                    sys_calendar_eventPersons: JSON.stringify(arrNewPerson.split(',').map(function(value){return parseInt(value)})),
                    sys_calendar_eventCreateDate: generateDate()
                })
                .where({sys_calendar_eventId: idEvent})
                .table("jcv_calendar_registers").then(date => {
                    if(date != ''){

                        //Mandando emails para os os usuarios que irão participar
                        if(arrNewPerson != undefined){
                            let arrayPersonSend = arrNewPerson.split(',')

                            let newArrayEamils = [];
                            arrayPersonSend.forEach(element => {
                                database
                                .select("jcv_userEmailCorporate","jcv_userEmailFolks")
                                .where({jcv_id: element})
                                .table("jcv_users")
                                .then( dato => {
                                    
                                    if(dato[0].jcv_userEmailCorporate != ''){
                                        newArrayEamils.push(dato[0].jcv_userEmailCorporate)
                                    }else if(dato[0].jcv_userEmailFolks != ''){
                                        newArrayEamils.push(dato[0].jcv_userEmailFolks)
                                    }
                                })
                            })

                            const textOne = 'Evento editado!';
                            const textTwo = `Olá, um evento foi editado onde você é um dos participantes!.</b><br> Editado por: <b>${GLOBAL_DASH[1]}</b>. <br> Data do evento: <b>${eventDay}</b> <br> Evento: <b>${eventName}</b>. <br> Sala: <b>${getRoomName}</b>. <br> Local: <b>${getLocateName}</b>. <br><br>  Link para adicionar no calendário: <a href="${PAINEL_URL+'/painel/calendario/download/'+nameArquiveCalendar}">Clique para adicionar</a> <br><br> Para maiores informações acesse o calendario jcv`;
                            emailSystemExe.sendMailExe(newArrayEamils, 'Evento Editado', 'Evento Editado', 'Calendario', '', textOne, textTwo);
                            
                        }

                        let convertArrPer = arrNewPerson.split(',').map(convertString)
                        function convertString(value){
                            return parseInt(value)
                        }

                        //Adicionando este evento ao painel de notificações
                        database
                        .insert({
                            jcv_notifications_type: 'JCVMOD04',
                            jcv_notifications_usersId: JSON.stringify(convertArrPer),
                            jcv_notifications_users_view: '[]',
                            jcv_notifications_title: 'Calendário',
                            jcv_notifications_message: 'O evento <b>'+eventName+'</b> foi editado clique e veja as mudanças',
                            jcv_notifications_link: '/painel/calendario/main',
                            jcv_notifications_created: generateDate(),
                            jcv_notifications_enabled: 1
                        })
                        .table("jcv_notifications")
                        .then( data => {
                            //res.cookie('SYS-NOTIFICATION-EXE1', "SYS01|Evento <b>"+eventName+"</b> editado com sucesso!");
                            res.cookie('SYSTEM-NOTIFICATIONS-MODULE', `{"typeMsg": "success","message":"Evento <b>${eventName}</b> editado com sucesso!","timeMsg": 3000}`);
                            res.redirect("/painel/calendario/main/"+monthCalendarRedirect);
                        })
                    }
                })
            }   
        }
    }
}

exports.roomSettings = async (req,res) => {

    //Listando todos as UNIDADES
    const getAllUnitys = await database
    .select()
    .table("jcv_unitys")
    .then( data => {{
        return data;
    }})

    //Listando todas as salas
    const getAllRoom = await database
    .select()
    .table("jcv_calendar_rooms")
    .join("jcv_unitys","jcv_calendar_rooms.sys_calendar_roomUnity","jcv_unitys.sys_unity_id")
    .then( data => {{
        return data;
    }})


    
    var page = "calendar/RoomSettings";
    res.render("panel/index", {
        page: page,
        getAllUnitys: getAllUnitys,
        getAllRoom: getAllRoom

    })
}

exports.registerNewRoom = async (req,res) => {

    const roomName = req.body['room-register-name']
    const roomEnabled = req.body['room-register-enabled']
    const roomColor = req.body['room-register-color']
    const roomUnity = req.body['room-register-unity']


    database
    .insert({
        sys_calendar_roomName: roomName,
        sys_calendar_roomEnabled: roomEnabled,
        sys_calendar_roomColor: roomColor,
        sys_calendar_roomUnity: roomUnity
    })
    .table("jcv_calendar_rooms")
    .then( data => {
        if(data != ''){
            //res.cookie('SYS-NOTIFICATION-EXE1', "SYS01|Sala <b>"+roomName+"</b> editado com sucesso!");
            res.cookie('SYSTEM-NOTIFICATIONS-MODULE', `{"typeMsg": "success","message":"Sala <b>${roomName}</b> registrada com sucesso!","timeMsg": 3000}`);
            res.redirect("/painel/calendario/room/RoomSettings");
        }
    })

}

exports.editNewRoom = async (req,res) => {
    const idRoom = req.body['room-edit-id']

    const roomName = req.body['room-edit-name-'+idRoom];
    const roomEnabled = req.body['room-edit-enabled-'+idRoom];
    const roomColor = req.body['room-edit-color-'+idRoom];
    const roomUnity = req.body['room-edit-unity-'+idRoom];

    database
    .update({
        sys_calendar_roomName: roomName,
        sys_calendar_roomEnabled: roomEnabled,
        sys_calendar_roomColor: roomColor,
        sys_calendar_roomUnity: roomUnity
    })
    .where({sys_calendar_roomId: idRoom})
    .table("jcv_calendar_rooms")
    .then( data => {
        if(data != ''){
            //res.cookie('SYS-NOTIFICATION-EXE1', "SYS01|Sala <b>"+roomName+"</b> editado com sucesso!");
            res.cookie('SYSTEM-NOTIFICATIONS-MODULE', `{"typeMsg": "success","message":"Sala <b>${roomName}</b> editado com sucesso!","timeMsg": 3000}`);
            res.redirect("/painel/calendario/room/RoomSettings");
        }
    })
}

exports.createQrCode = async (req,res) => {

    const idRoom = req.body['room-qrcode-id'];

    res.redirect('https://chart.googleapis.com/chart?chs=500x500&cht=qr&chl=https://jcv.net.br/painel/calendario/viewRoom/'+idRoom+'/?linkspecial=/painel/calendario/viewRoom/'+idRoom)
    
}

exports.viewRoom = async (req,res) => {
    const idRoom = req.params['idRoom']
    const monthRoom = req.params['monthRoom'];

    //Caso o mes e ano não esteja definido ele pega o mes atual
    if(monthRoom == undefined){
        let monthDef = moment().format("MM-YYYY");
        res.redirect("/painel/calendario/viewRoom/"+idRoom+"/"+monthDef)
    }else{

        //Buscando as informações da sala
        const roomInfo = await database
        .select()
        .where({sys_calendar_roomId: idRoom})
        .table("jcv_calendar_rooms")
        .join("jcv_unitys","jcv_calendar_rooms.sys_calendar_roomUnity","jcv_unitys.sys_unity_id")
        .then ( data =>{ return data} )

        if(roomInfo != ''){

            //Mes em que vai ser listado
            const monthSelect = monthRoom.split('-')[0] +'/'+monthRoom.split('-')[1]

            //Buscando os eventos
            const resultEventsRoom = await database
            .select()
            .where({
                sys_calendar_roomId: idRoom,
                sys_calendar_eventMonth: monthSelect
            })
            .table("jcv_calendar_rooms")
            .join("jcv_calendar_registers", "jcv_calendar_rooms.sys_calendar_roomId", "jcv_calendar_registers.sys_calendar_eventRoom")
            .join("jcv_users","jcv_calendar_registers.sys_calendar_eventUserId","jcv_users.jcv_id")
            .orderBy("jcv_calendar_registers.sys_calendar_eventId","DESC")
            .then( data => {
                return data
            })

            //Buscando todos os usuario
            const userAll = await database
            .select("jcv_id","jcv_userNamePrimary")
            .where({jcv_userEnabled: 1})
            .table("jcv_users")
            .then( data => {
                return data;
            })
            .catch( err => {console.log(err)})

            var page = "calendar/viewRoom";
            res.render("panel/index", {
                page: page,
                resultEventsRoom: resultEventsRoom,
                userAll: userAll,
                roomInfo: roomInfo,
                monthRoom: monthRoom
            })
        }else{
            //res.cookie('SYS-NOTIFICATION-EXE1', "SYS03|Sala não encontrada");
            res.cookie('SYSTEM-NOTIFICATIONS-MODULE', `{"typeMsg": "error","message":"Sala não encontrada","timeMsg": 3000}`);
            res.redirect("/painel/calendario/main")
        }
    }
}

exports.viewEventDay = async (req,res) => {

    try {
        const dayEvent = req.params['dayEvent']

        if(dayEvent == undefined){
            throw {
                error: "",
                urllink: "/painel/calendario/viewEvent/Day/"+moment().format("DD-MM-YYYY")
            }
        }

        //Caso o mes e ano não esteja definido ele pega o mes atual
        if(dayEvent.split('-').length > 3){
            //res.cookie('SYS-NOTIFICATION-EXE1', "SYS03|Dia não definido");
            res.cookie('SYSTEM-NOTIFICATIONS-MODULE', `{"typeMsg": "error","message":"Dia não definido","timeMsg": 3000}`);
            res.redirect("/painel/calendario")
        }else{


            let dayComp = dayEvent.split('-')[0]+'/'+dayEvent.split('-')[1]+'/'+dayEvent.split('-')[2]

            //Buscando os eventos do dia
            const roomInfo = await database
            .select()
            .where({sys_calendar_eventDate: dayComp})
            .table("jcv_calendar_registers")
            .join("jcv_unitys","jcv_calendar_registers.sys_calendar_eventLocation","jcv_unitys.sys_unity_id")
            .join("jcv_calendar_rooms","jcv_calendar_registers.sys_calendar_eventRoom","jcv_calendar_rooms.sys_calendar_roomId")
            .orderByRaw("sys_calendar_eventId DESC, sys_calendar_eventRoom")
            .then ( data =>{ return data} )

            if(roomInfo != ''){
                //Buscando todos os usuario
                const userAll = await database
                .select("jcv_id","jcv_userNamePrimary","jcv_userImageIcon")
                .where({jcv_userEnabled: 1})
                .table("jcv_users")
                .then( data => {
                    return data;
                })
                .catch( err => {console.log(err)})

                var page = "calendar/viewEventDay";
                res.render("panel/index", {
                    page: page,
                    userAll: userAll,
                    roomInfo: roomInfo,
                    dayComp: dayComp
                })
            }else{
                //res.cookie('SYS-NOTIFICATION-EXE1', "SYS02|Nenhum evento encontrado neste dia");
                res.cookie('SYSTEM-NOTIFICATIONS-MODULE', `{"typeMsg": "error","message":"Nenhum evento encontrado neste dia","timeMsg": 3000}`);
                res.redirect("/painel/calendario/main")
            }
        }
    } catch (error) {
        res.cookie('SYS-NOTIFICATION-EXE1', error.error);
        res.redirect(error.urllink)
    }
}

exports.eventDownload = async (req,res) => {
    const linkEvent = req.params.eventFile;

    //Pegando o evento
    const getInfo = await database
    .select()
    .where({sys_calendar_nameIcs: linkEvent})
    .table("jcv_calendar_registers")
    .join("jcv_unitys","jcv_unitys.sys_unity_id","jcv_calendar_registers.sys_calendar_eventLocation")
    .join("jcv_calendar_rooms","jcv_calendar_rooms.sys_calendar_roomId","jcv_calendar_registers.sys_calendar_eventRoom")
    .then( data => {return data})

    if(getInfo != ''){

        //Convertendo as horas e datas
        let convertDateIcs = moment(getInfo[0].sys_calendar_eventDate, 'DD/MM/YYYY').format("YYYY-MM-DD");
        //console.log(convertDateIcs)

        let initialIcs = moment(convertDateIcs+' '+getInfo[0].sys_calendar_eventHours.split(' - ')[0]).format().replace(/-/gi,'').replace(/:/gi,'')
        let FinalIcs = moment(convertDateIcs+' '+getInfo[0].sys_calendar_eventHours.split(' - ')[1]).format().replace(/-/gi,'').replace(/:/gi,'')
        
        //console.log(initialIcs)
        //console.log(FinalIcs)

        let dataSet = 
`
BEGIN:VCALENDAR
VERSION:1.0
BEGIN:VEVENT
DTSTART:${initialIcs}
DTEND:${FinalIcs}
LOCATION:${getInfo[0].sys_unity_name +' | '+getInfo[0].sys_calendar_roomName}
DESCRIPTION:${getInfo[0].sys_calendar_eventDescription}
SUMMARY:${getInfo[0].sys_calendar_eventName}
PRIORITY:3
END:VEVENT
END:VCALENDAR
`;
        
            //console.log(dataSet);
            
            fs.writeFile('public/arquives/icalendar/'+getInfo[0].sys_calendar_nameIcs, dataSet, function (err) {
                if (err) throw err;
                console.log('It\'s saved!');
            });
            
            setTimeout(() => {
                res.download('public/arquives/icalendar/'+getInfo[0].sys_calendar_nameIcs)
            }, 500);
    }else{
        res.redirect('/')
    }



}