$(window).unload(function () {
    endChat();
});
var socket = null;

var chattersCache = null;

var canSendDesktopNotifications = function () {
    return ((window.webkitNotifications != undefined) && (window.webkitNotifications.checkPermission() == 0))
}

var initDesktopNotificationsPermissions = function () {
    if (window.webkitNotifications && window.webkitNotifications.checkPermission() == 1) { //If available
        $("#desktop-notif-permissions").click(function () {
            window.webkitNotifications.requestPermission();

        });
        $("#desktop-notif-permissions").show();
    }
}

var initChat = function (newSocket) {
    socket = newSocket;
    socket.on('message', function (message) {
        ip = currentSelectedChatterIP();
        if (ip == message.ip) {
            showNewMessage(message);
        } else {
            if (canSendDesktopNotifications()) {
                window.webkitNotifications.createNotification(
                    'images/chat.jpg', message.ip + 'says...', message.message).show();
            }
            addMessageToBuffer(message);
        }

    });

    socket.on('initAvailableChatters', function (chatters) {
        chattersCache = clone(chatters);
        initAvailableChatters(chatters);
    });

    socket.on('newChatter', function (chatter) {
        addNewChatter(chatter);
    });

    socket.on('chatterLeft', function (chatter) {
        chatterLeft(chatter);
    })
}

var showNewMessage = function (message) {
    $("#messages").append(messageHTML(message)).animate({scrollTop:$('#messages-container').height()}, 800);
}

var endChat = function () {
    saveCurrentMessages();
    socket.emit('end', 'end');
    socket = null;
    chattersCache = null;
}

var sendMessage = function () {
    message = $('#message').val();
    if (message != '') {
        var toIP = currentSelectedChatterIP();
        if (toIP != undefined) {
            socket.emit('message', {
                to:toIP,
                message:message});
            $('#message').val('');
            showNewMessage({ip:null, from:'You', message:message});
        }
    }
    $('#message').focus();
}

var messageHTML = function (message) {
    var displayName = message.from;
    if (message.ip) {
        displayName += ' - ' + message.ip;
    }
    return '<li><span class="label label-info">' + displayName + '</span> <span class="message">' + message.message.replace(/\n|\r\n/g, '<br/>');
    +'</span></li>'
}

var initAvailableChatters = function (chatters) {
    for (chatterId in chatters) {
        addNewChatter(chatters[chatterId]);
    }
}

var addNewChatter = function (chatter) {
    if (chattersCache[chatter.ip] == undefined) {
        var html = '<li ip="' + chatter.ip + '"><a href="#">' + chatter.name + '</a></li>';
        var ele = $('#available-chatters').append(html);
        ele.children().last().click(toggleActivation);
        chattersCache[chatter.ip] = chatter.name;
    }
}

var chatterLeft = function (chatter) {
    //alert(chatter['ip'] + ' has left');
    chattersCache[chatter.ip].status = 'un-available';
}

function toggleActivation() {
    if ($(this).hasClass('active')) {
        //$(this).removeClass('active');
    } else {
        saveCurrentMessages();
        $(this).addClass('active').siblings().removeClass('active');
        restoreMessagesOfCurrentChatter();
        $('#message').focus();
    }
}

var saveCurrentMessages = function () {
    var currentChatterIP = currentSelectedChatterIP();
    if (currentChatterIP != undefined) {
        localStorage[currentChatterIP] = $('#messages').html();
    }
}

var restoreMessagesOfCurrentChatter = function () {
    var currentChatterIP = currentSelectedChatterIP();
    var messages = localStorage[currentChatterIP];
    if (messages != undefined) {
        $('#messages').html(messages);
    } else {
        $('#messages').empty();
    }

    //Now retrieve the buffered messages
    var bufferedMessages = popMessagesFromBuffer(currentChatterIP);
    for (messageID in bufferedMessages) {
        var bufferedMessage = bufferedMessages[messageID];
        showNewMessage(bufferedMessage);
    }
}

var currentSelectedChatterIP = function () {
    toEle = $('#available-chatters > li.active');
    if (toEle != undefined) {
        ip = toEle.attr('ip');
        return ip;
    }
    return undefined;
}

var addMessageToBuffer = function (message) {
    var bufferedMessages = localStorage[message.ip + 'messages']
    if (bufferedMessages == undefined) {
        var bufferedMessages = [message]
    } else {
        bufferedMessages = JSON.parse(bufferedMessages);
        bufferedMessages.push(message);
    }
    localStorage[message.ip + 'messages'] = JSON.stringify(bufferedMessages);
}

var popMessagesFromBuffer = function (ip) {
    var bufferedMessages = localStorage[ip + 'messages'];
    delete localStorage[ip + 'messages'];
    if (bufferedMessages == undefined) {
        return [];
    } else {
        return JSON.parse(bufferedMessages);
    }
}

//Utils
function clone(obj) {
    if (null == obj || "object" != typeof obj) return obj;
    var copy = obj.constructor();
    for (var attr in obj) {
        if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
    }
    return copy;
}