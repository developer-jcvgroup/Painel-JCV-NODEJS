Modulo trake mkt

Aplicar tecnologia UUID

Modulo voltado para promotoras, representantes e admins

# Formulario de visita(só adm): 
Ja tem um modelo prévio do que eles precisam, esta no email.

# Vendas diarias (adm e user): 
Este fomrulario informa as vendas diarias POR LOJA das marcas felps, retro avenca (box dinamico para cada):
    - Numero de peças vendidas (total ou por marca?)
    - Teve Ação de Mkt? Sim = qual? (descreva a ação), Não = nao teve
    - Loja: (Box dinamico para listar a loja do usuario em si)
    - Produto mais vendido: (box dinamico para inserção do produto)
    - Loja possui mat. mkt? S/N
    - Data: data normal

# Sistema de pesquisa:
Criar pesquisas para os representantes responder (1 resposta por loja), com modulo que notifique os representantes sobre novas pesquisas

question_type = 1{Pergunta com resposta}, 2{Pergunta com resposta em checkbox}, 3{Pergunta com resposta em checkbox em grade}, 4{Pergunta com reposta S/N}

Modelagem das perguntas dinamicas:


{
    question_type: 1,
    question_response: "Aqui vai a reposta da pergunta tipo texto"
},


{
    question_type: 2,
    question_response: {
        question_ckeck_title: "Titulo da resposta do checkbox simples",
        question_ckeck_value: 1 OR 0, //Aqui ele define se o input esta on ou off
    }
},


{
    question_type: 3,
    question_response: {

        question_check_resp_1: {
            question_ckeck_id: 1,
            question_ckeck_title: "Titulo da resposta do checkbox em grade",
            question_ckeck_value: 1 OR 0, //Aqui ele define se o input esta on ou off
        },
        question_check_resp_2: {
            question_ckeck_id: 2,
            question_ckeck_title: "Titulo da resposta do checkbox em grade",
            question_ckeck_value: 1 OR 0, //Aqui ele define se o input esta on ou off
        }

    }
},


{
    question_type: 4,
    question_response_bolean: 1/0
},