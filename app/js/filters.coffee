#imports
log = utils.log

angular.module('myApp.filters', []).
  filter('interpolate', ['version', (version) ->
    (text) -> String(text).replace(/\%VERSION\%/mg, version)
  ]).
  filter('urlize',(version) ->
    (text) -> urlize(text,{target:'link'})
  ).
  filter('sharingTypes', ['localizer',(localizer) ->
    (sharingTypes) -> (localizer.sharingType(t) for t in sharingTypes).join(', ')
  ]).
  filter('localize', ['localizer',(localizer) ->
    (id,locType) ->
      log("locType")
      log(locType)
      if localizer[locType]
        return localizer[locType](id) || id
      else
        return id
  ])

