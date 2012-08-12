users = {}

routes = (app) ->
  app.get '/', (req, res) ->
    ip = req.connection.remoteAddress
    user = users[ip]
    console.log JSON.stringify(users)
    if user is undefined
      res.render "#{__dirname}/views/index.jade",
        title: 'Welcome'
        ip: ip
    else
      others = []
      others.push otherUser.name for othersIP, otherUser of users when othersIP isnt ip
      console.log(JSON.stringify(others))
      res.render "#{__dirname}/views/chat.jade",
        title: 'Welcome'
        ip: ip
        name: user.name
        others: others
  app.get '/faq', (req, res) ->
    res.render "#{__dirname}/views/faq.jade",
      title: 'FAQ'

  app.get '/credits', (req, res) ->
    res.render "#{__dirname}/views/credits.jade",
      title: 'Credits'

  app.post '/set_username', (req, res) ->
    ip = req.connection.remoteAddress
    users[ip] = name: req.body.name
    user = users[ip]
    if user.name is null
      req.flash 'error', "Enter a valid name"
      res.redirect '/'
    else
      req.flash 'info', "Welcome #{user.name}"
      res.redirect '/'

  app.get '/logout', (req, res) ->
    ip = req.connection.remoteAddress
    delete users[ip]
    req.session.currentUser = null
    req.flash 'info', "You have logged out."
    res.redirect '/'

module.exports = routes