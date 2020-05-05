/* global describe, before, after, it */

var expect = require('chai').expect
var router = require('osprey-router')
var join = require('path').join
var ServerAddress = require('server-address').ServerAddress
var parser = require('raml-1-parser')
var osprey = require('../')
var utils = require('./support/utils')

var EXAMPLE_RAML_PATH = join(__dirname, 'fixtures/types.raml')

var success = utils.response('success')

describe('RAML types', function () {
  var app
  var proxy
  var server

  before(function () {
    app = router()
    server = new ServerAddress(utils.createServer(app))

    server.listen()

    return parser.loadRAML(EXAMPLE_RAML_PATH)
      .then(function (ramlApi) {
        var raml = ramlApi.expand(true).toJSON({
          serializeMetadata: false
        })
        var ospreyApp = osprey.server(raml, { RAMLVersion: ramlApi.RAMLVersion() })
        var proxyApp = osprey.proxy(ospreyApp, server.url())

        proxy = new ServerAddress(proxyApp)
        proxy.listen()
      })
  })

  after(function () {
    proxy.close()
    server.close()
  })

  describe('libs', function () {
    it('should accept valid data', function () {
      app.post('/users', success)

      return utils.makeFetcher().fetch(proxy.url('/users'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstname: 'john',
          lastname: 'doe',
          age: 1
        })
      }).then(function (res) {
        expect(res.body).to.equal('success')
        expect(res.status).to.equal(200)
      })
    })

    it('should reject invalid data', function () {
      app.post('/users', success)

      return utils.makeFetcher().fetch(proxy.url('/users'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      }).then(function (res) {
        expect(res.status).to.equal(400)
      })
    })

    it('should accept valid query types', function () {
      app.get('/users', success)

      return utils.makeFetcher().fetch(proxy.url('/users?sort=asc'), {
        method: 'GET'
      }).then(function (res) {
        expect(res.body).to.equal('success')
        expect(res.status).to.equal(200)
      })
    })

    it('should reject invalid query types', function () {
      app.get('/users', success)

      return utils.makeFetcher().fetch(proxy.url('/users'), {
        method: 'GET'
      }).then(function (res) {
        expect(res.status).to.equal(400)
      })
    })
  })

  describe('built-in types', function () {
    it('should accept any type of data when type: any', function () {
      app.post('/any', success)

      return utils.makeFetcher().fetch(proxy.url('/any'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          anyone: 'one',
          anytwo: 12,
          anythree: [1, 2, 3]
        })
      }).then(function (res) {
        expect(res.body).to.equal('success')
        expect(res.status).to.equal(200)
      })
    })

    it('should accept valid object properties', function () {
      app.post('/object', success)

      return utils.makeFetcher().fetch(proxy.url('/object'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          obj: {
            existing_property: 'valid'
          }
        })
      }).then(function (res) {
        expect(res.body).to.equal('success')
        expect(res.status).to.equal(200)
      })
    })

    it('should reject invalid object properties', function () {
      app.post('/object', success)

      return utils.makeFetcher().fetch(proxy.url('/object'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          obj: {
            existing_property: 'valid',
            additional_property: 'invalid'
          }
        })
      }).then(function (res) {
        expect(res.status).to.equal(400)
      })
    })

    it('should accept valid array properties', function () {
      app.post('/array', success)

      return utils.makeFetcher().fetch(proxy.url('/array'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          choices: ['a', 'b', 'c']
        })
      }).then(function (res) {
        expect(res.body).to.equal('success')
        expect(res.status).to.equal(200)
      })
    })

    it('should reject invalid array properties', function () {
      app.post('/array', success)

      return utils.makeFetcher().fetch(proxy.url('/array'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          choices: ['a', 'b', 'c', 'a']
        })
      }).then(function (res) {
        expect(res.status).to.equal(400)
      })
    })

    it('should accept arrays as root element', function () {
      app.post('/arrayRoot', success)

      return utils.makeFetcher().fetch(proxy.url('/arrayRoot'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify([
          'a', 'b', 'c', 'd'
        ])
      }).then(function (res) {
        expect(res.body).to.equal('success')
        expect(res.status).to.equal(200)
      })
    })
  })

  it('should reject objects when an array is expected as root element', function () {
    app.post('/arrayRoot', success)

    return utils.makeFetcher().fetch(proxy.url('/arrayRoot'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        foo: 'bar'
      })
    }).then(function (res) {
      expect(res.status).to.equal(400)
    })
  })

  describe('scalar types', function () {
    it('should accept valid scalar types', function () {
      app.post('/people', success)

      return utils.makeFetcher().fetch(proxy.url('/people'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstname: 'john',
          lastname: 'doe',
          phone: '333-222-4444',
          birthday: '1999-12-31',
          head: 1,
          emails: ['john@doe.com'],
          married: false,
          dogOrCat: 'cat'
        })
      }).then(function (res) {
        expect(res.body).to.equal('success')
        expect(res.status).to.equal(200)
      })
    })

    it('should reject invalid scalar types', function () {
      app.post('/people', success)

      return utils.makeFetcher().fetch(proxy.url('/people'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstname: 1,
          lastname: 1,
          phone: '1111-222',
          // birthday: '1999-12-31T21:00:00',
          birthday: '1999-12',
          head: 3,
          emails: [],
          married: 'false',
          dogOrCat: 'fish',
          optionalTastes: []
        })
      }).then(function (res) {
        expect(res.status).to.equal(400)
      })
    })

    it('should accept strings as root element', function () {
      app.post('/stringRoot', success)

      return utils.makeFetcher().fetch(proxy.url('/stringRoot'), {
        method: 'POST',
        body: '"test"',
        headers: { 'Content-Type': 'application/json' }
      }).then(function (res) {
        expect(res.body).to.equal('success')
        expect(res.status).to.equal(200)
      })
    })

    it('should reject integers when a string is expected as root element', function () {
      app.post('/stringRoot', success)

      return utils.makeFetcher().fetch(proxy.url('/stringRoot'), {
        method: 'POST',
        body: '7',
        headers: { 'Content-Type': 'application/json' }
      }).then(function (res) {
        expect(res.status).to.equal(400)
      })
    })
  })

  it('should accept objects as root element', function () {
    app.post('/objectRoot', success)

    return utils.makeFetcher().fetch(proxy.url('/objectRoot'), {
      method: 'POST',
      body: JSON.stringify({
        foo: 'bar'
      }),
      headers: { 'Content-Type': 'application/json' }
    }).then(function (res) {
      expect(res.body).to.equal('success')
      expect(res.status).to.equal(200)
    })
  })

  it('should reject integers when an object is expected as root element', function () {
    app.post('/objectRoot', success)

    return utils.makeFetcher().fetch(proxy.url('/stringRoot'), {
      method: 'POST',
      body: '7',
      headers: { 'Content-Type': 'application/json' }
    }).then(function (res) {
      expect(res.status).to.equal(400)
    })
  })

  describe('resource types', function () {
    it('should accept valid Client bodies', function () {
      app.post('/clients', success)

      return utils.makeFetcher().fetch(proxy.url('/clients'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: 7,
          name: 'very important client'
        })
      }).then(function (res) {
        expect(res.body).to.equal('success')
        expect(res.status).to.equal(200)
      })
    })

    it('should reject invalid Client bodies', function () {
      app.post('/clients', success)

      return utils.makeFetcher().fetch(proxy.url('/clients'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: '7'
        })
      }).then(function (res) {
        expect(res.status).to.equal(400)
      })
    })

    it('should accept valid Resource bodies', function () {
      app.post('/resource', success)

      return utils.makeFetcher().fetch(proxy.url('/resource'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'amazing resource'
        })
      }).then(function (res) {
        expect(res.body).to.equal('success')
        expect(res.status).to.equal(200)
      })
    })

    it('should reject invalid Resource bodies', function () {
      app.post('/resource', success)

      return utils.makeFetcher().fetch(proxy.url('/resource'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 1234
        })
      }).then(function (res) {
        expect(res.status).to.equal(400)
      })
    })
  })
})
