## Painel unificado do JCV GROUP

Compilado de apps do jcv group

# Codigo de Cada Modulo
- JCVMOD01 = ALL PAGES
- JCVMOD02 = Progama da beleza
- JCVMOD03 = Requsitor de Materiais
- JCVMOD04 = Calendario
- JCVMOD05 = Trade MKT
- JCVMOD06 = Config. Sistema: Geral
- JCVMOD07 = Perfil Usuario
- JCVMOD08 = Sistema de encurtador de links
- JCVMOD09 = Sistema de cursos e treinamentos

# Banco do usuarios
CPF
Funcionario
Unidade
Gestor
Email
Ramal
Setor

# Erros backend geral
100 - Erro de login ou senha

# Cookies do sistema
- SYS-NOTIFICATION: notificações do sistema (Sucesso, atenção, error):
    * SYS-01: Sucesso;
    * SYS-02: Atenção;
    * SYS-03: Error;

# Solictações {Programa da beleza}
- status: 1{pendente, exclusivo para consultas}, 2{solicitado}, 3{cancelado}, 4{EM separção}, 5{pedido de cancelamento}, 6{Pedido separador pela expedição}, 7{Pedido recebido pelo gestor};
# Commandos para o PROGRAMA DA BELEZA
- CMD01{Setar como pedido pendente}
- CMD02{Setar como pedido separado}
- CMD03{Setar como pedido cancelado}
- CMD04{Exportar Pedidos}
- CMD05{Exportar Produtos}
- CMD06{Gerar Etiquetas}

# ------------------------------------------------------------------------------
# ------------------------------------------------------------------------------

# Requsições {Requistor de Materiais}
- status: 1{Requisição Efetuada}, 2{Em Separação}, 3{requisição recebida pelo usuario}, 4{Cancelado}, 5{pendente}, 6{Requisição Enviada}
# Commandos para o REQUISITOR DE MATERIAIS
- CMD01{Status: Em separação}
- CMD02{Status: Cancelar requsição}
- CMD03{Status: Requisições enviadas}
- CMD04{Comandos: Exportar Pedidos}
- CMD05{Comandos: Exportar Itens}

# Grupos 
- Grupos: 1{masters}, 2{admins dos apps}, 3{usuarios geral}

# Produtos
- 1{Shampoo}, 2{Condicionador}, 3{máscaras e etc}
- CMD01{Habilitar produto}
- CMD02{Desabilitar Produtos}
- CMD03{Gerar planilha de produtos}

# Sistema de PopUP
- É executado por uma função que recebe o codigo do popup e o texto

Nome de cookies que ele aceita (atualizado 14/06/2022):
- SYS-NOTIFICATION-EXE1 *ANTIGO*
- SYS-NOTIFICATION-EXE2 *ANTIGO*
- SYS-NOTIFICATION-EXE3 *ANTIGO*

- SYSTEM-NOTIFICATIONS-MODULE {este é o nome do cookie gerado para exibir as menssagens}

- Exemplo de gerar cookie nodejs
res.cookie('SYSTEM-NOTIFICATIONS-MODULE', "{typeMsg: 'success',message:'XXXXXXXX',timeMsg: 2000}");

Ele aceita até tres popups por operação vinda do backend

# Sistem a de logs
createLog = (titleLog,messageLogAdmin,messageLogUser,appLog,typeLog,groupsLogs)
Tipos de logs:
- 01 = Log de sucesso
- 02 = Log de atenção
- 03 = Log de erro

o registro de log referente a grupos sera: 01,02,03 onde lista os grupos que vão ser exibidos as notificações


## APPs ja finalizados

# Programa da beleza
- USER: Criação de pedidos mais simples e objetiva
- USER: Cancelamento de pedido mais simples e direto
- ADM: Filtros dinamicos de gestores e unidades
- ADM: Campos de busca instantaneas
- ADM: Exportar pedidos, produtos dos pedidos e gerar etiquetas para os pedidos
- ADM: Listagem de produtos mais direta, exportar lista de produtos e alteração em massa

# ------------------------------------------------------------------------------
# ------------------------------------------------------------------------------
## Trade Markenting

Formulário de visita: {ADM}: Novo formulário, lista de formulários
Vendas diárias: {USER,ADM}: Novo, listar;
Pesquisa de mercado: {USER,ADM}: Criar pesquisa, Listar Pesquisa

Vendas Diarias: form exibirá cada box por vez (box da marca felps,retro avenca):

* N° de peças (label(exeto saches))
* Teve Alguma ação? (S/N) sim? Qual? (campo text)
* Loja: select dinamico para a loja que a pessoa esta cadastrada na tabela de lojas 
* Item mais vendido: input text dinamico onde vamos campturar o id do produto
* Data: Data padrão é o dia em que foi clicado
* Possui material de marketing? (S/N)

Formulário de visita: o compo loja é dinamico a data o usuario decide

Lojas:
Cadastro de lojas e criar a lista de promotoras desta loja

Produtos:
Todos os produtos do GGP do jcv

Pesquisa de mercado:
Formulário dinâmico para a inserção do conteudo, somente uma respota POR LOJA

* Titulo global do form
* Descrição do form
* Perguntas: {
    titulo da pergunta: (input text),
    Resposta: {
        S/N/T: (input check sim,não,talvez),
        CheckPer: (input check personalizado onde ele colocara a resposta da pergunta caso este em check)
        Text: Campo texto  normal
    }
}
* Observação que a pessoa que respondeer pode fazer

## *****************************************************************************************
## *****************************************************************************************
## *****************************************************************************************
## FORMULAÇÃO DO BANCO DE DADOS

# Tabela Informações básicas do usuario
* [jcv_idUser] *PRIMARY KEY* //id
* [jcv_userNamePrimary] *VARCHAR* //Nome completo *Primario*
* [jcv_userNameSecundary] *VARCHAR* //Nome completo *Secundario, usado somente para duplicar o nome do usuario*
* [jcv_userCPF] *INT* //CPF
* [jcv_userEmailCorporate] *VARCHAR* //Email corporativo
* [jcv_userEmailFolks] *VARCHAR* //Email pesssoal
* [jcv_userExtension] *INT* //Ramal 
* [jcv_userPassword] *INT* //Senha
* [jcv_userSector] *INT* //Setor
* [jcv_userUnity] *INT* //Unidade
* [jcv_userManager] *INT* //Id Gestor
* [jcv_userImageIcon] *VARCHAR* //Imagem do usuario
* [jcv_userCassification] *INT* // 1[Master], 2[Gestores], 3[Funcionários-Internos], 4[Representantes], 5[Promotoras], 6 [Jovem-Aprendiz]
* [jcv_userEnabled] *INT* // 1[Sim] 2[Não]
* [jcv_sysEmails] *VARCHAR* // 1[Sim] 2[Não], envio de e-mails so sistema {updates, notificações do sistema, recuperação de senhas, etc}

# ------------------------------------------
# Tabela Sistema: Unidades
* [sys_unity_id] *PRIMARY KEY* //id
* [sys_unity_name] //
* [sys_unity_enabled] //

# ------------------------------------------
# Tabela Sistema: Departamentos
* [sys_department_id] *PRIMARY KEY* //id
* [sys_department_name] //
* [sys_department_enabled] //


# Tabela de permissões do usuario no sistema e aplicativos
Programa da beleza
- [sys_blz_perm_userId] *PRIMARY KEY* //id
- [sys_blz_perm_use] *INT* //Permissão para o uso PADRÂO do sistema {solicitar, pedir cancelamento}
- [sys_blz_perm_manager] *INT* //Gestores do sistema *NAO POSSUEM PRIVILEGIOS ADMIN* {adicionar, remover e salvar produtos}
- [sys_blz_perm_admin] *INT* //Permissão para uso como ADMIN {listar solicitações, aplicar ações, adicionar, remover e salvar produtos}
*------*
Requisitor de Materiais
- [sys_req_perm_use] *INT* //Permissão para o uso do requsitor {Criar requisição, editar requisição, visualizar requisição, editar requisição, receber requisição, listar requisições excluir}
- [sys_req_perm_manager] *INT* //Gestores do sistema *NAO POSSUEM PRIVILEGIOS ADMIN*
- [sys_req_perm_admin] *INT* //Admin do sistema {Criar requisição, editar requisição, visualizar requisição, editar requisição, receber requisição, listar requisições, excluir listar todos os pedidos, aplicar ações}

# ------------------------------------------
# Tabela requisitor de materiais: Pedidos
* [sys_req_id] *PRIMARY KEY* //id
* [sys_req_userId] *INT* //Id do usuario
* [sys_req_userName] *VARCHAR* //Nome do usuario solicitante
* [sys_req_userManager] *INT* //Id do gestor
* [sys_req_userUnity] *INT* //Id da unidade
* [sys_req_orderEmitter] *DATE* //Data de emissão
* [sys_req_orderTotalItems] *INT* //Total de itens inseridos
* [sys_req_orderNode] *TEXT* //Observações do pedido
* [sys_req_orderStatus] *INT* //Status Atual do pedido
* [sys_req_orderKeyOperation] *VARCHAR* //Key de operação

# ------------------------------------------
# Tabela requisitor de materiais: Items do pedido
* [sys_req_IdTwo] *PRIMARY KEY* //id
* [sys_req_item_orderId] *XX* //
* [sys_req_item_userId] *XX* //
* [sys_req_item_itemId] *XX* //
* [sys_req_item_itemName] *XX* //
* [sys_req_item_itemAmount] *XX* //
* [sys_req_item_amountReceived] *XX* //
* [sys_req_item_keyOperation] *XX* //

# ------------------------------------------
# Tabela requisitor de materiais: Unidades


# Tabela requisitor de materiais: Items
* [sys_req_itemId] *PRIMARY KEY* //id
* [sys_req_itemName] *VARCHAR* //id
* [sys_req_itemEnabled] *INT* //id
* [sys_req_itemLastUpdate] *DATE* //id

# ------------------------------------------
# Tabela Programa da Beleza: Solicitações
* [sys_blz_id] *PRIMARY KEY* //id
* [sys_blz_userId] *INT* //id do usuario
* [sys_blz_userName] *VARCHAR* //nome do usuario
* [sys_blz_userUnity] *INT* //id da unidade do usuario
* [sys_blz_userManager] *INT* //id do gestor do usuario
* [sys_blz_tratmentOne] *VARHCAR* //nome do primeiro produto selecionado *SHAMPOO*
* [sys_blz_tratmentTwo] *VARHCAR* //nome do segundo produto selecionado *CONDICIONADOR*
* [sys_blz_requestReference] *DATE* //MÊS de referencia do pedido
* [sys_blz_requestCreate] *DATE* //Data e hora que foi solicitado
* [sys_blz_requestStatus] *INT* //Status da requisição

# Tabela Programa da Beleza: Produtos
* [sys_blz_product_id] *PRIMARY KEY* //id
* [sys_blz_productSKU] *VARHCAR* //id
* [sys_blz_productName] *VARHCAR* //id
* [sys_blz_productType] *INT* //{1: Shampoo, 2: Condicionadores, 3: Máscaras, etc}
* [sys_blz_productEnabled] *INT* //Ativo?
* [sys_blz_productBrand] *INT* //Marca
* [sys_blz_productUpdate] *INT* //Ultima atualização

# Tabela Programa da Beleza: Compilador de solicitações
* [sys_blz_compilate_id] *PRIMARY KEY* //id
* [sys_blz_compilate_id_manager] *INT* //Id do gestor
* [sys_blz_compilate_ids_requests] *JSON* // Lista em JSON de todos as requisições que este gestor é responsável
* [sys_blz_compilate_generate_date] *DATE* // Data da criação deste compilado
* [sys_blz_compilate_active] *INT* // Este compilado esta válido?

# ------------------------------------------
# Tabela calendario:
* [sys_calendar_eventId] *PRIMARY KEY* //id
* [sys_calendar_eventUserId] *INT* //id do usuario
* [sys_calendar_eventName] *TEXT* //Nome do evento
* [sys_calendar_eventDescription] *TEXT* //Descrição do evento
* [sys_calendar_eventDate] *VARCHAR* //Data do evento
* [sys_calendar_eventHours] *XX* //Hora do evento
* [sys_calendar_eventLocation] *VARCHAR* //Local do evento
* [sys_calendar_eventPublic] *INT* //Evento Publico
* [sys_calendar_eventReminder] *INT* //Lembrar do evento XX MINUTOS antes (Disparo por email)
* [sys_calendar_eventRoom] *INT* //id da sala que pode ser feito o evento
* [sys_calendar_eventPersons] *INT* //ids dos usuario que fazem parte da reunião ex.: 1,2,3,4,5,6..
* [sys_calendar_eventCreateDate] *XX* //Data da criação deste evento

# Tabela Salas:
* [sys_calendar_roomId] *PRIMARY KEY* //id
* [sys_calendar_roomName] *VARCHAR* //Nome da sala
* [sys_calendar_roomEnabled] *INT* //1 ou 0
* [sys_calendar_roomColor] *VARCHAR* //Cor simbólica da sala

# ------------------------------------------
# Tabela calendario:
* [sys_update_idUp] *PRIMARY KEY* //id
* [sys_update_versionUpdate] *VARCHAR* //Versão do update
* [sys_update_nameUpdate] *VARCHAR* //Nome da atualização 
* [sys_update_textUpdate] *VARCHAR* //texto da atualização
* [sys_update_usersOkUpdate] *VARCHAR* //Usuarios que deram OK para não exibir mais a atualização 


# ------------------------------------------
# Tabela Trade MKT pesquisa:
* [jcv_trade_form_create_id] *PRIMARY KEY* //id
* [jcv_trade_form_create_created_userId] *VARCHAR* //Id do usuario que criou
* [jcv_trade_form_create_titleForm] *VARCHAR* //Titulo do formulario
* [jcv_trade_form_create_jsonForm] *TEXT* //JSON que o formulario manda
* [jcv_trade_form_create_total_reponse] *INT* //Respostas totais do formulario
* [jcv_trade_form_create_created_date] *INT* //Data da criação
* [jcv_trade_form_create_expired] *INT* //Data em que expira  
* [jcv_trade_form_create_usersList] *VARCHAR* //Lista de usuarios que vao poder responder, caso seja 'null' => todos devem receber (aqueles que tem permissão)  
* [jcv_trade_form_create_enabled] *INT* //Formulario ativo? 

# Tabela Trade MKT resposta da pesquisa:
* [jcv_trade_form_res_id] *PRIMARY KEY* //id
* [jcv_trade_form_res_formId] *VARCHAR* //Id do formulario
* [jcv_trade_form_res_idUser] *VARCHAR* //Id do usuario que respondeu
* [jcv_trade_form_res_jsonForm] *TEXT* //JSON que o formulario manda
* [jcv_trade_form_res_response_date] *INT* //Respostas totais do formulario 


# Tabela Trade MKT Lojas:
* [jcv_trade_shops_id] *PRIMARY KEY* //id
* [jcv_trade_shops_name] *VARCHAR* //Nome da loja
* [jcv_trade_shops_enabled] *INT* //Ativo ou desativado

# Tabela Trade Formulario de visita:
* [jcv_trade_visit_id] *PRIMARY KEY* //id
* [jcv_trade_visit_userId] *ID* //Id do usuario que respondeu
* [jcv_trade_visit_date] *VARHCAR* //Data em foi feita a visita
* [jcv_trade_visit_shopId] *INT* //Id da loja
* [jcv_trade_visit_created] *VARHCAR* //Data da criação do formulario
* [jcv_trade_visit_repsonses] *TEXT* //Inserindo o obj das respostas

# Tabela Trade MKT Vendas diarias:
* [jcv_trade_sales_form_id] *PRIMARY KEY* //id
* [jcv_trade_sales_form_shopId] *VARCHAR* //Id do formulario
* [jcv_trade_sales_form_date] *VARCHAR* //Id do usuario que respondeu
* [jcv_trade_sales_form_userId] *TEXT* //JSON que o formulario manda
* [jcv_trade_sales_form_infoFelps] *TEXT* //Aqui sera armazenado o objeto com as perguntas e resposta da felps
* [jcv_trade_sales_form_infoRetro] *TEXT* //Aqui sera armazenado o objeto com as perguntas e resposta da retro 
* [jcv_trade_sales_form_infoAvenca] *TEXT* //Aqui sera armazenado o objeto com as perguntas e resposta da avenca


# Tabela Trade MKT produtos:
* [jcv_trade_products_id] *PRIMARY KEY* //id
* [jcv_trade_products_brand] *VARCHAR* //linha do produto
* [jcv_trade_products_line] *VARCHAR* //linha do produto
* [jcv_trade_products_product] *VARCHAR* //linha do produto
* [jcv_trade_products_enable] *INT* //linha do produto

# Tabela notificações:
* [jcv_notifications_id] *PRIMARY KEY* //id
* [jcv_notifications_type] *VARCHAR* //Tipo da notificação: SYS: Notifcação de sistema, JCVMODXX: Por app
* [jcv_notifications_users_groups] *VARCHAR* //Grupos de usuarios
* [jcv_notifications_users_single] *VARCHAR* //Por usuarios pré selecionados
* [jcv_notifications_title] *VARCHAR*
* [jcv_notifications_message] *VARCHAR*
* [jcv_notifications_enabled] *INT*


# Tabela formulario:
* [jcv_formularios_registers_id] *PRIMARY KEY* //id
* [jcv_formularios_registers_title] *VARCHAR* //titulo
* [jcv_formularios_registers_userCreated] *INT* //id do usuario
* [jcv_formularios_registers_jsonForm] *TEXT* //Formulario em si
* [jcv_formularios_registers_totalResponse] *INT* //Formularios respondidos
* [jcv_formularios_registers_createdDate] *VARCHAR* //Data de criação
* [jcv_formularios_registers_expired] *VARCHAR* //Data de criação
* [jcv_formularios_registers_users] *JSON* //Usuarios que vao responder
* [jcv_formularios_registers_usersResponses] *JSON* //Usuarios que ja responderam
* [jcv_formularios_registers_enabled] *INT* //Ativo?

# Tabela formulario resposta:
* [jcv_formularios_responses_id] *PRIMARY KEY* //id
* [jcv_formularios_responses_idForm] *INT* //Id form
* [jcv_formularios_responses_userResponse] *INT* //id do usuario
* [jcv_formularios_responses_jsonForm] *TEXT* //Formulario em si
* [jcv_formularios_responses_responseDate] *INT* //Formularios respondidos

# Tabela termos e aceite *sempre criar um registro novo após mudanças*
* [jcv_sys_term_id] *PRIMARY KEY* //id
* [jcv_sys_term_termText] *TEXT*
* [jcv_sys_term_term_lastUpdate] *VARCHAR* //data
* [jcv_sys_term_userId_update] *INT* // id do ultimo usuario do update

# Tabela encurtador *Sistema de encurtador de url*
* [jcv_sys_shortener_id] *PRIMARY KEY* //id
* [jcv_sys_shortener_link_title] *VARCHAR* //Titulo
* [jcv_sys_shortener_link_created_date] *VARCHAR* //Data da criação
* [jcv_sys_shortener_link_createdUser] *INT* //Quem criou a url
* [jcv_sys_shortener_link_original] *TEXT* //URL original
* [jcv_sys_shortener_link_short] *TEXT* // URL encurtada
* [jcv_sys_shortener_link_clicks] *INT* //Clicks totais
* [jcv_sys_shortener_link_active] *TEXT* // Ativa?

PADRAO DA URL DINAMICA PARA ACESSO
?linkspecial=/painel/calendario/main/

EX.: http://localhost:8080/painel/?linkspecial=/painel/calendario/main/
AO ACESSAR A ROTA PAINEL ELE PEGA ESSA VARIAVEL E JOGA NO LOGIN