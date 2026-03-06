const config = require('./config')

function processPayment(amount) {
    if (amount <= 0) {
        throw new Error('Amount must be greater than 0')
    }

    if (!config.apiKey.startsWith('pk_')) {
        throw new Error('Invalid API key format')
    }

    // this is testing for payment processing logic, in real implementation this would involve API calls to payment gateway
    return {
        success: true,
        amount,
        currency: config.currency,
        transactionId: `txn_${Date.now()}`
    }
}

module.exports = { processPayment }