window.$ = window.jQuery = require('jquery')
require('jquery-ui-bundle')
require('es6-shim')
require('patternfly/dist/css/patternfly.css')
require('patternfly/dist/css/patternfly-additions.css')
let initRemoteConsole = require('./common')

/* global WMKS */

$(function () {
  const settings = initRemoteConsole()
  $('#console-type').html('WebMKS')
  // WebMKS cannot be a part of the asset pipeline, therefore, it has to be loaded with this hack
  var WEBMKS_JS_PATH = '/webmks/wmks.min.js'
  // Test if the file exists under the given path
  fetch(WEBMKS_JS_PATH, {
    method: 'HEAD',
    cache: 'no-cache'
  }).then(function (response) {
    return new Promise(function (resolve, reject) {
      if (!response.ok) {
        // Reject the promise if there's any error with the request, i.e. the file doesn't exist
        reject(response)
      } else {
        // Create a <link> tag that loads the CSS file and append it to the page
        var link = document.createElement('link')
        link.rel = 'stylesheet'
        link.type = 'text/css'
        link.href = '/webmks/css/wmks-all.css'
        document.head.appendChild(link)

        // Create a <script> tag that loads the JS file
        var script = document.createElement('script')
        script.src = WEBMKS_JS_PATH
        // Set an onload function that resolves the promise
        script.onload = function () {
          resolve()
        }
        // Append the <script> tag to the page
        document.head.appendChild(script)
      }
    })
  }).then(function () {
    // Set up the remote console after the JS is loaded
    var host = window.location.hostname
    var encrypt = window.location.protocol === 'https:'
    var port = encrypt ? 443 : 80
    if (window.location.port) {
      port = window.location.port
    }
    var proto = encrypt ? 'wss' : 'ws'

    var options = {}
    // vCloud requires some extra attributes
    if (settings.isvcloud) {
      options.VCDProxyHandshakeVmxPath = settings.vmx
      options.enableUint8Utf8 = true
    }

    var wmks = WMKS.createWMKS('remote-console', options).register(WMKS.CONST.Events.CONNECTION_STATE_CHANGE, function (event, data) {
      if (data.state === WMKS.CONST.ConnectionState.CONNECTED) {
        $('#connection-status').text(__('Connected'))
      }
    })

    wmks.connect(proto + '://' + host + ':' + port + '/' + settings.path)

    $('#ctrlaltdel').on('click', function () {
      wmks.sendCAD()
    })

    $('#keymap').on('change', function () {
      wmks.setOption('keyboardLayoutId', this.value)
    })
  }).catch(function () {
    $('#remote-console').html(__('The appliance has no access to the assets required to run the WebMKS console. For more info please see the documentation.'))
  })
})
