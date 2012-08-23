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
        message.timestamp = timeStamp();
        var ip = currentSelectedChatterIP();
        if (ip == message.ip) {
            if (Visibility.hidden()) {
                popup(message);
            }
            showNewMessage(message);
        } else {
            //Save the message to local storage
            addMessageToBuffer(message);

            //Show an envelope icon next to the chatter.
            $("li[ip='" + message.ip + "'] .icon-envelope").show();

            //Show popup and make a sound
            popup(message);
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

    $('#available-chatters').parent().popover({
        content:'Fellow chatters would appear online here as and when they login.<br/><strong>Click on one to start chatting...</strong>',
        placement:'bottom'
    });
    $('#available-chatters').parent().popover('show');
    setTimeout(function () {
        $('#available-chatters').parent().popover('hide');
    }, 10000);

    $('#clear-chat').click(function () {
        $('#messages').empty();
    });

    if (isMessagesDownloadSupported()) {
        $('#download-chat').click(function () {
            var messages = messagesToText();
            var data = new Blob([messages]);
            if (window.webkitURL != undefined) {
                window.open(window.webkitURL.createObjectURL(data), 'Chat.txt');
            } else if (window.URL != undefined) {
                window.open(window.URL.createObjectURL(data), 'Chat.txt');
            }
        });
    } else {
        $('#download-chat').hide();
    }


}

var isMessagesDownloadSupported = function () {
    if (window.webkitURL != undefined || window.URL != undefined) {
        return true;
    }
    return false;
}

var showNewMessage = function (message) {
    $("#messages").append(messageHTML(message)).animate({scrollTop:$('#messages-container').height()}, 800);
    scrollMessagesDown();
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
            showNewMessage({ip:null, from:'You', message:message, timestamp:timeStamp()});
        } else {
            alert('Select a recipient from the left.');
        }
    }
    $('#message').focus();
}

var messageHTML = function (message) {
    var displayName = message.from;
    if (message.ip) {
        displayName += ' - ' + message.ip;
    }
    return '<li><span class="label label-info">' + displayName + '</span>&nbsp;<span class="label label-success">' + message.timestamp + '</span> <span class="message">' + message.message.replace(/\n|\r\n/g, '<br/>');
    +'</span></li>'
}

var initAvailableChatters = function (chatters) {
    for (chatterId in chatters) {
        addNewChatter(chatters[chatterId]);
    }
}

var addNewChatter = function (chatter) {
    if (chatter.ip != undefined && chattersCache[chatter.ip] == undefined) {
        var hasntBufferedMessages = getBufferedMessages(chatter.ip) == undefined;
        var style = "";
        if (hasntBufferedMessages) {
            style = "display: none;";
        }
        var html = '<li ip="' + chatter.ip + '"><a href="#"><i class="icon-envelope" style="' + style + '"></i><i class="icon-user"></i>&nbsp;' + chatter.name + '<i class="icon-chevron-right pull-right"></i></a></li>';
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
    if (!$(this).hasClass('active')) {
        saveCurrentMessages();
        $(this).addClass('active').siblings().removeClass('active');
        restoreMessagesOfCurrentChatter();
        $('#message').focus();
        scrollMessagesDown();
    }
    $("li[ip='" + $(this).attr('ip') + "'] .icon-envelope").hide();
}

var scrollMessagesDown = function () {
    $('.message-container').scrollTop($('.message-container')[0].scrollHeight);
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
    var bufferedMessages = getBufferedMessages(ip);
    if (bufferedMessages == undefined) {
        return [];
    } else {
        delete localStorage[ip + 'messages'];
        return JSON.parse(bufferedMessages);
    }
}

var getBufferedMessages = function (ip) {
    return localStorage[ip + 'messages'];
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

var popup = function (message) {
    //Play Sound
    $('#message-sound').get(0).play();

    //Show popup
    if (canSendDesktopNotifications()) {
        window.webkitNotifications.createNotification(
            'images/chat.jpg', message.from + ' says...', message.message).show();
    } else {
        $.gritter.add({
            // (string | mandatory) the heading of the notification
            title:message.from + ' says...',
            // (string | mandatory) the text inside the notification
            text:message.message,
            // (string | optional) the image to display on the left
            image:'images/chat.jpg',
            // (bool | optional) if you want it to fade out on its own or just sit there
            sticky:true
        });
    }
}

var timeStamp = function () {
    var dateTime, timestamp;
    dateTime = new Date();
    timestamp = "" + (dateTime.getDate()) + "/" + (dateTime.getMonth()) + "/" + (dateTime.getFullYear()) + " " + (dateTime.getHours()) + ":" + (dateTime.getMinutes());
    return timestamp;
}

var messagesToText = function () {
    var returnText = "";
    var messages = $('#messages li')
    $.each(messages, function (index, value) {
        var who, when, what;
        who = $($(value).children()[0]).html();
        when = $($(value).children()[1]).html();
        what = $($(value).children()[2]).html();
        returnText += who + " (" + when + ") : " + what + "\r\n";
    });
    return returnText;
}