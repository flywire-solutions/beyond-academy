<template>
    <div class="quick-pay">
        <div class="card text-center">
            <div class="card-header">
                <!-- <img src="@/assets/flywire.png" height="20px"/> -->
            </div>
            <div class="card-body">
                <img v-if="client.logo" :src="client.logo" :alt="client.name" />
                <h4>{{ ui.title }}
                  <small class="text-muted">{{ ui.subTitle }}</small>
                </h4>
                <div v-if="formattedAmount" class="payment-info">
                    <h3>
                      <small>Please pay</small>
                      {{ formattedAmount }}
                    </h3>
                </div>
                <div v-if="ui.configErrors.length > 0 || ui.paymentErrors.length > 0" class="errors">
                    <template v-for="e in ui.configErrors">
                        <span :key="e">{{ e }}</span>
                    </template>
                    <template v-for="e in ui.paymentErrors">
                        <span :key="e.id">{{ e.msg }}</span>
                    </template>
                </div>
            </div>
            <div class="card-footer">
                <button :disabled="!canPay" class="btn btn-primary" v-on:click="onPay">Make Payment</button>
            </div>
        </div>
    </div>
</template>

<script>

import { mapGetters, mapState } from 'vuex'

export default {
    name: 'quick-pay',
    computed: {
        ...mapState({
          ui: 'ui',
          portal: 'portal',
          payment: 'payment'
        }),
        ...mapGetters([
          'formattedAmount',
          'client',
          'canPay'
       ])
    },
    mounted: function() {
      this.$store.dispatch('load');
    },
    methods: {
      onPay: function() {
        var that = this;
        var popup = null;

        this.$store.dispatch('pay')

        const config = {
            env: this.portal.env,
            recipientCode: this.portal.portalCode,

            amount: this.payment.amount,
            recipientFields: this.payment.parameters,

            requestPayerInfo: true,
            firstName: this.payment.firstName,
            lastName: this.payment.lastName,
            email: this.payment.email,
            phone: this.payment.phone,
            address: this.payment.address,
            city: this.payment.city,
            country: this.payment.country,

            callbackId: this.payment.callbackId,
            callbackUrl: this.payment.callbackUrl,

            nonce: this.payment.callbackId,

            onInvalidInput: (errs) => {
                that.$store.dispatch('paymentSetErrors', errs)
            },
            onCompleteCallback: (args) => {
                // eslint-disable-next-line no-console
                console.log(args);
                that.$store.dispatch('complete', args);
                that.$router.push('complete');
            }
        }

        popup = window.FlywirePayment.initiate(config);
        popup.render();
      }
    }
}
</script>

<style scoped lang="scss">
    .quick-pay {
        width: 400px;
        margin: 0 auto;

        .card-body {
            padding-bottom: 0;
        }
    }
    h4, h3 {
        small {
            display: block;
            font-size: 1rem;
        }
    }
    .payment-info, .form-group { 
        margin-top: 8px;
    }

    .card-body {
        margin-bottom: 10px;
    }

    .payment-info{ 
        background-color: #1274C4;
        color: white;
        margin: 0 -20px;
        padding: 5px 0;
    }

    .errors {
        background-color: #D3556B;
        color: white;
        margin: 5px -20px;
        padding: 5px 0;

        span {
            display: block;
        }
    }
</style>

