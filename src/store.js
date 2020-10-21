import Vue from "vue";
import Vuex from "vuex";

import dataService from "./api/flywireApi";
import utils from "./utils";

Vue.use(Vuex);

const initialState = {
  ui: {
    isLoading: false,
    title: null,
    subTitle: null,
    configErrors: [],
    paymentErrors: [],
  },
  portal: {
    env: null,
    portalCode: null,
    recipient: {},
  },
  payment: {
    amount: null,
    firstName: null,
    lastName: null,
    email: null,
    phone: null,
    address: null,
    city: null,
    country: null,
    callbackUrl: null,
    callbackId: null,
    parameters: {},
  },
  result: {
    status: null,
    reference: null,
    paymentMethod: null,
  },
};

const getters = {
  formattedAmount: (state) => {
    return utils.formatAmount(
      state.payment.amount,
      state.portal.recipient.currency
    );
  },
  client: (state) => {
    return {
      name: state.portal.recipient.name,
      logo: state.portal.recipient.logo_url,
    };
  },
  canPay: (state) => {
    return !state.ui.isLoading && state.ui.configErrors.length === 0;
  },
  isError: (state) => {
    return (
      !state.ui.isLoading &&
      state.result.status !== "success" &&
      state.result.status !== "pending"
    );
  },
};

const mutations = {
  UI_START_LOADING(state) {
    state.ui.isLoading = true;
  },
  UI_STOP_LOADING(state) {
    state.ui.isLoading = false;
  },
  UI_INIT(state, payload) {
    (state.ui.title = payload.title), (state.ui.subTitle = payload.subTitle);
  },
  UI_ADD_CONFIG_ERROR(state, payload) {
    state.ui.configErrors.push(payload.error);
  },
  UI_ADD_PAYMENT_ERRORS(state, payload) {
    state.ui.paymentErrors = payload.errors;
  },
  UI_CLEAR_ERRORS(state) {
    state.ui.configErrors = [];
    state.ui.paymentErrors = [];
  },
  PAYMENT_INIT(state, payload) {
    state.payment.amount = payload.amount;
    state.payment.firstName = payload.firstName;
    state.payment.lastName = payload.lastName;
    state.payment.email = payload.email;
    state.payment.phone = payload.phone;
    state.payment.address = payload.address;
    state.payment.city = payload.city;
    state.payment.country = payload.country;
    state.payment.callbackUrl = payload.callbackUrl;
    state.payment.callbackId = payload.callbackId;
    state.payment.parameters =
      {
        payment_number: payload.num,
        zoho_entity_type: payload.type,
        zoho_entity_id: payload.id,
        invoice_number: `${payload.firstName} ${payload.lastName}`
      };
  },
  PORTAL_INIT(state, payload) {
    state.portal.env = payload.env;
    state.portal.portalCode = payload.portalCode;
    state.portal.recipient = payload.recipient;
  },
  RESULT_INIT(state, payload) {
    (state.result.status = payload.status),
      (state.result.reference = payload.reference),
      (state.result.paymentMethod = payload.paymentMethod);
  },
};

const actions = {
  load: ({ commit }) => {
    commit("UI_START_LOADING");
    let { amt, ccy, firstName, lastName, email, phone, address, city, country, env = "prod", id, num, title, subTitle } = utils.getQueryStringValues();

    function addConfigErrorIf(fn, message) {
      if (fn()) {
        commit("UI_ADD_CONFIG_ERROR", { error: message });
      }
    }

    addConfigErrorIf(() => !ccy, "Currency code not supplied");
    addConfigErrorIf(() => ccy && (ccy.length != 3), `Invalid currency code supplied (${ccy})`);
    addConfigErrorIf(() => !id, "Zoho CRM entity id not supplied");
    addConfigErrorIf(() => !num, "Payment number not supplied");
    addConfigErrorIf(() => num && (isNaN(num) || parseInt(num) < 1 || parseInt(num) > 1), `Invalid payment number (${num})`);
    addConfigErrorIf(() => !amt, "Amount not supplied");
    addConfigErrorIf(() => amt && (isNaN(amt) || parseFloat(amt) <= 0), `Invalid amount (${amt})`);

    let type = "";
    let callbackUrl = "";
    let callbackId = id;

    if (parseInt(num) === 1) {
      type = "Lead";
      callbackUrl = "https://flow.zoho.com/699449867/flow/webhook/incoming?zapikey=1001.4d28aad7882cd97478c0156d4998784d.afea37c18f1a9f73284b8eb6b80b444c&isdebug=false";
    } else if (parseInt(num) === 2) {
      type = "Contact";
      callbackUrl = "https://flow.zoho.com/699449867/flow/webhook/incoming?zapikey=1001.bb385eeeef5bb91d183c1c5e7653ca44.52199737f38cd0523b96c604b84a4a4d&isdebug=false";
    } else if (parseInt(num) === 3) {
      type = "Contact";
      callbackUrl = "https://flow.zoho.com/699449867/flow/webhook/incoming?zapikey=1001.3bf65dc00dbb0c2b545f656346b4d220.b86c730ad18441b545fbf158b4cbeb79&isdebug=false";
    }

    const portalCodes = {
      AUD: "BYA",
      EUR: "BDE",
      GBP: "BYG",
      JPY: "BAJ",
      SEK: "BAS",
      USD: "BAU"
    };
    let portalCode = portalCodes[ccy];

    commit("PAYMENT_INIT", { amount: parseFloat(amt), firstName, lastName, email, phone, address, city, country, callbackUrl, callbackId, type, id, num });

    title = title ?? "Beyond Academy";
    subTitle = subTitle ?? `Payment Number: ${num}`;
    commit("UI_INIT", { title, subTitle });

    const recipientPromise = dataService.getRecipient(portalCode, env);

    Promise.all([recipientPromise]).then((values) => {
      addConfigErrorIf(() => !values[0].id, `Client not found (${portalCode})`);

      commit("PORTAL_INIT", { env, portalCode, recipient: values[0] });
      commit("UI_STOP_LOADING");
    });
  },
  paymentSetErrors: ({ commit }, value) => {
    commit("UI_ADD_PAYMENT_ERRORS", {
      errors: value,
    });
  },
  pay: ({ commit }) => {
    commit("UI_CLEAR_ERRORS");
  },
  complete: ({ commit }, value) => {
    let { reference, status, payment_method: paymentMethod } = value;

    commit("RESULT_INIT", {
      status,
      reference,
      paymentMethod,
    });
  },
};

const debug = process.env.NODE_ENV !== "production";

const store = new Vuex.Store({
  strict: debug,
  state: initialState,
  getters,
  mutations,
  actions,
});

export default store;
