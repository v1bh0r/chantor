routes = (app) ->
  app.get '/', (req, res) ->
    res.render "#{__dirname}/views/index.jade",
      title: 'Welcome'

  app.get '/faq', (req, res) ->
    res.render "#{__dirname}/views/faq.jade",
      title: 'FAQ'

  app.get '/credits', (req, res) ->
    res.render "#{__dirname}/views/credits.jade",
      title: 'Credits'

module.exports = routes