window.user_friends = [];
window.user_group = {};
window.username = '';
var socket = io();
var notify_msg = {};
$(document).ready(function(){
    $(".wp_top_tabs .notify").click(function(){        
        var notify_html = "";
        if (Object.keys(notify_msg).length > 0){
            notify_html = '<ul>';
            for (var key in notify_msg){
                $.each(notify_msg[key], function(index, value){
                    $("#"+key+"-msg").append($('<p>').text(value));
                });
                notify_html = notify_html + '<li>' +
                    '<a href=javascript:chat_popup("'+ key +'")> message </a>'
                    + 'from ' + key + '</li>';
            }
            notify_html = notify_html + '</ul>';
        }else{
            notify_html = "<p> no notification messages </p>";
        }
        
        $("#notification-count").hide("slow");

        // display notification
        $("#chat-container").html(notify_html);
        $("#chat-container").show();
    });
    
    $("#webpager .friends").click(function(){
        var params = {
            user_id : $('.hd-fill span#user_id').text()
        };
        $.ajax({
            data: params,
            url : "/buddy/"+params.user_id,            
            dataType: 'json',
            cache: false,           
            type:'get',
            timeout: 5000,
            success: function(data){
                var buddy_layout = '<div id="buddy-collection"></div><div id="buddy" style="height: 590px;"><div style="height: 500px;" class="wp_collector_box"><div id="friends" class="wp_collector friends"><div data-type="friends" class="collector_title friends"><span class="text">全部好友</span><span class="num">20</span></div></div><div id="group" class="wp_collector groups"></div></div></div>';
                
                $('#chat-container').html(buddy_layout);                
                var s=document.getElementById('buddy-collection');
                $('#buddy-collection').html('');                
                var li_item;
                var a_item;
                var online_item;                
                var ul_item = document.createElement("ul");
                window.username = data.record.name;
                window.user_friends = data.record.friends;
                window.user_group   = data.record.group;
                console.log("use friends : ", window.user_friends );
                for(var i = 0; i<data.record.friends.length; i++){
                    li_item = document.createElement("li");
                    li_item.setAttribute("class", "buddy-item");
                    a_item = document.createElement("a");
                    a_item.appendChild(document.createTextNode(data.record.friends[i]));
                    // a_item.setAttribute('href', "javascript:register_popup('" + data.record.friends[i] + "', '" + data.record.friends[i] + "');");
                    a_item.setAttribute('href', "javascript:chat_popup('" + data.record.friends[i] + "')");
                    online_item = document.createElement("div");
                    online_item.setAttribute("class", "profile-status offline");
                    console.log("data.record.friends", data.record.friends[i]);
                    online_item.setAttribute("id", data.record.friends[i] + "-item");
                    li_item.appendChild(a_item);
                    li_item.appendChild(online_item);
                    ul_item.appendChild(li_item);
                }
                s.appendChild(ul_item);
                $("#chat-container #friends .num").text(" [ " + data.record.friends.length + " ]");
                
                socket.emit('appendBuddyGroup', {friends : window.user_friends,
                                                 group : window.user_group}); 
            },
            error: function(jqXHR, textStatus, errorThrown){
                alert("get friends error");
            }            
        });
    });    
});

Array.remove = function(array, from, to) {
    var rest = array.slice((to || from) + 1 || array.length);
    array.length = from < 0 ? array.length + from : from;
    return array.push.apply(array, rest);
};

//recalculate when window is loaded and also when window is resized.
// window.addEventListener("resize", calculate_popups);
// window.addEventListener("load", calculate_popups);

// on connection to server, ask for user's name with an anonymous callback
socket.on('connect', function(){
    console.log("send a connect request");
    console.log("user_friends in buddy.js", window.user_friends);
	// call the server-side function 'adduser' and send one parameter (value of prompt)
	// socket.emit('adduser', prompt("What's your name?"));
    socket.emit('adduser', {username: $('.hd-fill span#username').text(),
                            user_id: $('.hd-fill span#user_id').text()});      
});

// listener, whenever the server emits 'updatechat', this updates the chat body
socket.on('updatechat', function (username, data) {
    console.log("update chate");
	$('#conversation').append('<b>'+username + ':</b> ' + data + '<br>');
});

socket.on('updateOnlineStatus', function(onlineStatus){
    console.log("onlineStatus : ", onlineStatus);
    for(var i = 0; i<window.user_friends.length; i++){
        if(onlineStatus[window.user_friends[i]]){
            $('#' + window.user_friends[i] + "-item").attr("class", "profile-status online");
        }
    }    
});

// listener, whenever the server emits 'updaterooms', this updates the room the client is in
socket.on('updaterooms', function(rooms, current_room) {
	$('#rooms').empty();
	$.each(rooms, function(key, value) {
		if(value == current_room){
			$('#rooms').append('<div>' + value + '</div>');
		}
		else {
			$('#rooms').append('<div><a href="#" onclick="switchRoom(\''+value+'\')">' + value + '</a></div>');
		}
	});
});
socket.on("reply message", function(msg){
    // alert(msg.rival_name + " : " + msg.data);
    console.log("reply message", msg, $("#chatbox .active #rival-name").text());
    // if (document.getElementById(msg.rival_name)){
    if ($("#chatbox .active #rival-name").text() == msg.username){
        $('#chatbox .active #conversation-box').append($('<p class="msg-rival">').text(msg.username + " : " + msg.data));
    }else{
        $("#notification-count").text((parseInt($("#notification-count").text()) + 1).toString());
        $("#notification-count").show();
    }

    if(msg.username in notify_msg){
        notify_msg[msg.username].push(msg.data);
    }else{
        notify_msg[msg.username] = [];
        notify_msg[msg.username].push(msg.data);        
    }
});

function switchRoom(room){
	socket.emit('switchRoom', room);
}

function chat_popup(rival_name){
    $("#chatbox .active #rival-name").html('<b>' + rival_name + '</b>');    
    $("#chatbox .inactive").attr("style", "display:none;"); 
    $("#chatbox .active").show();

    var hasMsg = false;
    for (var i in notify_msg) {
        if (notify_msg.hasOwnProperty(rival_name)){
            hasMsg = true;
            var msg_items = "<ul>";
            $.each( notify_msg[i], function( key, value ) {                
                msg_items = msg_items +'<li class="msg-rival">'+i+ ':(m)'+value+ '</li>';
                $("#notification-count").text(parseInt($("#notification-count").text()) - 1);
            });
            msg_items = msg_items + '</ul>';                    
            delete notify_msg[i];
        }
    }

    $("#chatbox .active #conversation-box").html(msg_items);
    
    // $('#chatbox #message-input').keypress(function(e) {
	//     if(e.which == 13) {
    //         alert("keypress");
	// 	    $(this).blur();
	// 	    // $('#datasend').focus().click();
    //         $("#conversation-box").append($('<p>').text($('.hd-fill span#username').text() + " : " + $('#message-input').val()));
    //         socket.emit("message", {msg:$('#message-input').val(),
    //                                 username:$('.hd-fill span#username').text(),
    //                                 rival_name:rival_name});
    //         $('#message-input').val('');
	//     }
    // });

    $('#chatbox #message-input').keydown(function(event){
        event.stopImmediatePropagation();
        if(event.keyCode == 13 || event.keyCode==9) {
		    $(this).blur();
		    // $('#datasend').focus().click();
            $("#conversation-box").append($('<p>').text($('.hd-fill span#username').text() + " : " + $('#message-input').val()));
            socket.emit("message", {msg:$('#message-input').val(),
                                    username:$('.hd-fill span#username').text(),
                                    rival_name:rival_name});
            $('#message-input').val('');
        }
    });
}

