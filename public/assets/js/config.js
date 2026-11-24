/* ---------------------------------------------------------------------------
 * ÚNICO lugar dos dados de contato do site.
 *
 * O HTML nunca contém estes valores fixos: eles são preenchidos pelo main.js
 * a partir deste objeto (atributos data-config, links wa.me e mailto).
 * ------------------------------------------------------------------------- */
window.SITE_CONFIG = {
  // 13 dígitos: DDI (55) + DDD (27) + número. Exibido como (27) 99289-2844.
  whatsapp: '5527992892844',

  // Número para leitura. Quem clica abre o WhatsApp (wa.me) com o número acima.
  telefone: '(27) 99289-2844',

  email: 'lucasbelesa.adv@gmail.com',

  // Inscrição e seccional, no formato usado no rodapé.
  // Seccional ES assumida pelo escritório em Vila Velha/ES.
  oab: 'OAB/ES 44153',

  cidade: 'Vila Velha/ES',

  endereco: 'Vila Velha/ES',

  instagram: 'https://www.instagram.com/lucasbelesa.adv/',

  // Mensagem pré-preenchida nos botões que não têm texto próprio.
  mensagemPadrao: 'Olá, Dr. Lucas. Vim pelo site e gostaria de falar sobre um caso.',

  // Dados de contato ainda faltando. Vazia: todos os dados estão preenchidos.
  pendentes: [],
};