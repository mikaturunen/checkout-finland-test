const test = require('tape')
const payments = require('../../source/resources/payments')
const path = require('path')
const config = require('konfig')({ path: path.join(__dirname, '..', '..', 'source', 'config') })
const crypto = require('crypto')
const xmlParser = require('js2xmlparser')
const helper = require('./helper')

const VERSION = '0001'
const STAMP = '11111111'
const AMOUNT = 1000
const REFERENCE = '12344'
const MERCHANT = config.app.merchant_id
const RETURN = 'http://demo1.checkout.fi/xml2.php?test=1'
const CANCEL = 'http://demo1.checkout.fi/xml2.php?test=2'
const REJECT = ''
const DELAYED = ''
const DELIVERY_DATE = '20170602'
const MESSAGE = ''
const LANGUAGE = 'FI'
const COUNTRY = 'FIN'
const CURRENCY = 'EUR'
const CONTENT = 1
const ALGORITHM = 3
const TYPE = 0
const DEVICE = 10
const FIRSTNAME = 'Keijo'
const FAMILYNAME = 'Romanof'
const ADDRESS = 'Katutie 12'
const POSTCODE = '00100'
const POSTOFFICE = 'Helsinki'
const EMAIL = 'keijo@couch.com'
const DESCRIPTION = ''

const requiredParameters = [
  { key: 'VERSION', value: VERSION },
  { key: 'STAMP', value: STAMP },
  { key: 'AMOUNT', value: AMOUNT },
  { key: 'REFERENCE', value: REFERENCE },
  { key: 'MESSAGE', value: MESSAGE },

  { key: 'LANGUAGE', value: LANGUAGE },
  { key: 'MERCHANT', value: MERCHANT },
  { key: 'RETURN', value: RETURN },
  { key: 'CANCEL', value: CANCEL },
  { key: 'REJECT', value: REJECT },

  { key: 'DELAYED', value: DELAYED },
  { key: 'COUNTRY', value: COUNTRY },
  { key: 'CURRENCY', value: CURRENCY },
  { key: 'DEVICE', value: DEVICE },
  { key: 'CONTENT', value: CONTENT },

  { key: 'TYPE', value: TYPE },
  { key: 'ALGORITHM', value: ALGORITHM },
  { key: 'DELIVERY_DATE', value: DELIVERY_DATE }, //Ymd php date.
  { key: 'FIRSTNAME', value: FIRSTNAME },

  { key: 'FAMILYNAME', value: FAMILYNAME },
  { key: 'ADDRESS', value: ADDRESS },
  { key: 'POSTCODE', value: POSTCODE },
  { key: 'POSTOFFICE', value: POSTOFFICE },
  { key: 'SECRET_KEY', value: config.app.secret_key }
]

const calculateMac = (algorithm, payload, secret) =>
  (algorithm === 'sha256-hmac' ? crypto.createHmac('sha256', secret) : crypto.createHash(algorithm))
    .update(payload)
    .digest('hex')
    .toUpperCase()

const paymentTest = (algorithm) => (test) => {
  let parameters = helper.getNumberOfParameters(requiredParameters, 24)
  const properties = Object.keys(parameters).map(key => key).join('+')

  // STAMP must be unique, otherwise same, already created trade is always returned
  parameters.STAMP = new Date().getTime()
  // With HMAC the secret is not included in the payload
  if (algorithm === 'sha256-hmac') {
    delete parameters.SECRET_KEY;
  }

  const values = Object.keys(parameters).map(key => parameters[key]).join('+')
  parameters.MAC = calculateMac(algorithm, values, config.app.secret_key)

  console.log('properties', properties)
  console.log('values:', values)
  console.log('hmac:', parameters.MAC)

  test.plan(1)
  test.timeoutAfter(1500)

  // Notice how loosely the return is handled. Assuming it's okay when we see the <trade> closing tag.

  payments
    .openPaymentWall(parameters)
    .then(response => test.equal(response.indexOf('</trade>') != -1, true))
}

test('Make a payment (MD5)', paymentTest('md5'))

test('Make a payment (SHA256)', paymentTest('sha256'))

test('Make a payment (SHA256-HMAC)', paymentTest('sha256-hmac'))
