users = {}

sockets = {}

availableChatters = (myIP) ->
  console.log 'Populating available chatters'
  chatters = []
  for othersIP, socket of sockets
    if othersIP isnt myIP
      othersName = users[othersIP]
      if othersName isnt undefined
        chatters.push(
          name: othersName
          ip: othersIP
        )
  console.log JSON.stringify(chatters)
  return chatters

sayHello = (myIP) ->
  console.log 'Say Hello'
  for othersIP, socket of sockets
    if othersIP isnt myIP
      othersName = users[myIP]
      if othersName isnt undefined
        sockets[othersIP].emit('newChatter',
          ip: myIP
          name: othersName
        )

sayBye = (myIP) ->
  console.log 'Say Bye'
  for othersIP, socket of sockets
    if othersIP isnt myIP
      sockets[othersIP].emit('chatterLeft',
        ip: myIP
      )

routes = (app, io) ->
  app.get '/', (req, res) ->
    ip = req.headers['X-Forwarded-For'] || req.connection.remoteAddress
    user = users[ip]
    if user is undefined
      res.render "#{__dirname}/views/index.jade",
        title: 'Welcome'
        ip: ip
    else
      res.render "#{__dirname}/views/chat.jade",
        title: 'Chat'
        ip: ip
        name: user

  app.get '/faq', (req, res) ->
    res.render "#{__dirname}/views/faq.jade",
      title: 'FAQ'

  app.get '/credits', (req, res) ->
    res.render "#{__dirname}/views/credits.jade",
      title: 'Credits'

  app.post '/set_username', (req, res) ->
    ip = req.connection.remoteAddress
    users[ip] = req.body.name
    user = users[ip]
    if user is null
      req.flash 'error', "Enter a valid name"
      res.redirect '/'
    else
      res.redirect '/'

  app.get '/logout', (req, res) ->
    ip = req.connection.remoteAddress
    sayBye ip
    delete users[ip]
    req.session.currentUser = null
    req.flash 'info', "You have logged out."
    res.redirect '/'

  io.sockets.on('connection', (socket) ->
    ip = socket.handshake.address.address
    sockets[ip] = socket
    console.log("connnect")

    socket.emit('initAvailableChatters', availableChatters(ip))
    sayHello(ip)

    socket.on('message', (data) ->
      console.log JSON.stringify(data)
      sockets[data['to']].emit('message', {ip: ip, from: users[ip], message: data.message})
    )

    socket.on('end', (data) ->
      sayBye ip
      delete sockets[ip]
      console.log "#{ip} left chat"
    )
  )

module.exports = routes