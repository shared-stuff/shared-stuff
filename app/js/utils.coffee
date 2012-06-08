'use strict'

log = (t)->
  console.log(t)

focus = (id)->
  setTimeout(->
      $('#' + id).focus()
  , 100)

focusAndSelect = (id)->
  setTimeout(->
    $('#' + id).focus().select()
  , 100)

defer = (callback)->
  setTimeout(->
    callback()
  , 1)

cleanObjectFromAngular = (items) ->
  for item in items
    for own key, value of item
      if key.indexOf('$$') >= 0
        delete item[key]

charsForRange = (low,high) ->
  (String.fromCharCode(x) for x in [low..high])

randomStringCharacterRange = ("" + x for x in [0..9]).concat(charsForRange(65,90)).concat(charsForRange(97,122))

randomArrayElement = (array)-> array[Math.floor(Math.random()*array.length)]

randomString = (length)->
  (randomArrayElement(randomStringCharacterRange) for i in [0..length]).join('')

doNothing = ->
  #


isBlank = (str) -> !str || /^\s*$/.test(str)
#
#  // Math.random()-based RNG.  All platforms, very fast, unknown quality
#  var _rndBytes = new Array(16);
#  mathRNG = function() {
#  var r, b = _rndBytes, i = 0;
#
#  for (var i = 0, r; i < 16; i++) {
#  if ((i & 0x03) == 0) r = Math.random() * 0x100000000;
#  b[i] = r >>> ((i & 0x03) << 3) & 0xff;
#  }
#
#  return b;
#  }
#
#  // WHATWG crypto-based RNG - http://wiki.whatwg.org/wiki/Crypto
#  // WebKit only (currently), moderately fast, high quality
#  if (_global.crypto && crypto.getRandomValues) {
#  var _rnds = new Uint32Array(4);
#    whatwgRNG = function() {
#    crypto.getRandomValues(_rnds);
#
#    for (var c = 0 ; c < 16; c++) {
#    _rndBytes[c] = _rnds[c >> 2] >>> ((c & 0x03) * 8) & 0xff;
#    }
#    return _rndBytes;
#    }
#  }


applyIfNeeded = ($scope,f)->
  #if (!$scope.$$phase) $scope.$digest();
  if $scope.$root.$$phase
    f()
  else
    $scope.$apply(f)


collectTokenStringFromItem = (item) ->
  searchString = ''
  for key,value of item
    if (typeof value)  == 'string'
      searchString += ' '+value.toLowerCase()
    else if (typeof value)  == 'object'
      searchString += ' '+collectTokenStringFromItem(value)
  return searchString

matchesSearchTokens = (item,searchTokens) ->
  tokenString = collectTokenStringFromItem(item)
  return _.all(searchTokens, (sw) -> tokenString.indexOf(sw)>=0)

search = (list,query) ->
  if !isBlank(query)
    searchTokens = query.toLowerCase().split(/\s+/g)
    return _.filter(list, (item) -> matchesSearchTokens(item,searchTokens))
  else
    return list

this.utils =
  log: log
  focus: focus
  cleanObjectFromAngular: cleanObjectFromAngular
  randomString: randomString
  doNothing: doNothing
  defer: defer
  isBlank: isBlank
  focusAndSelect: focusAndSelect
  applyIfNeeded: applyIfNeeded
  search: search