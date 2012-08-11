routes = (app) ->
  app.get '/login', (req, res) ->
    if req.session.currentUser != null
      res.redirect '/'
    else
      res.render "#{__dirname}/views/login",
        title: 'Login'

  app.get '/logout', (req, res) ->
    req.session.currentUser = null
    req.flash 'info', "You have logged out."
    res.redirect '/'

  app.post '/sessions', (req, res) ->
    if ('vibhor' is req.body.user) and ('123' is req.body.password)
      req.session.currentUser = req.body.user
      req.flash 'info', "You are logged in as #{req.session.currentUser}."
      res.redirect '/'
      return
    req.flash 'error', "Access Denied"
    res.redirect '/login'
module.exports = routes