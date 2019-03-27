$(".messages").animate({ scrollTop: $(document).height() }, "fast");

$("#profile-img").click(function() {
	$("#status-options").toggleClass("active");
});

$(".expand-button").click(function() {
  $("#profile").toggleClass("expanded");
	$("#sidebar").toggleClass("expanded");
});

$("#status-options ul li").click(function() {
	$("#profile-img").removeClass();
	$("#status-online").removeClass("active");
	$("#status-away").removeClass("active");
	$("#status-busy").removeClass("active");
	$("#status-offline").removeClass("active");
	$(this).addClass("active");
	
	if($("#status-online").hasClass("active")) {
		$("#profile-img").addClass("online");
	} else if ($("#status-away").hasClass("active")) {
		$("#profile-img").addClass("away");
	} else if ($("#status-busy").hasClass("active")) {
		$("#profile-img").addClass("busy");
	} else if ($("#status-offline").hasClass("active")) {
		$("#profile-img").addClass("offline");
	} else {
		$("#profile-img").removeClass();
	};
	
	$("#status-options").removeClass("active");
});

        $(document).ready(function() {
			console.log("open");
            // Use a "/test" namespace.
            // An application can open a connection on multiple namespaces, and
            // Socket.IO will multiplex all those connections on a single
            // physical channel. If you don't care about multiple channels, you
            // can set the namespace to an empty string.
            namespace = '/test';
			var activeRoom = null;
			var activeUser = null;

            // Connect to the Socket.IO server.
            // The connection URL has the following format:
            //     http[s]://<domain>:<port>[/<namespace>]
			console.log("here");
			console.log(namespace);
            var socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port + namespace);
			console.log(socket);
            // Event handler for new connections.
            // The callback function is invoked when a connection with the
            // server is established.
            socket.on('connect', function() {
                socket.emit('my_event', {data: 'I\'m connected!'});
            });


            socket.on('my_response', function(msg) {
				if(msg.username == null){
					console.log('Received #' + msg.count + ' : ' + msg.data);
				}else{
					if(activeUser == msg.username){
						$('<li class="sent"><img src="/static/images/placeholder.png" alt="" /><p>' + msg.data + '</p></li>').appendTo($('.messages ul'));
						$('.message-input input').val(null);
						$('.contact.active .preview').html('<span>' + msg.username +': </span>' + msg.data);
						$(".messages").animate({ scrollTop: $(document).height() }, "fast");		
					}else{
						$('<li class="replies"><img src="/static/images/placeholder.png" alt="" /><p>' + msg.data + '</p></li>').appendTo($('.messages ul'));
						$('.contact.active .preview').html('<span>' + msg.username +': </span>' + msg.data);
						$(".messages").animate({ scrollTop: $(document).height() }, "fast");
					}
				}
            });
			
			//
			//individual user chats
			//
			//
            $('form#contact').submit(function(event) {
				if (activeRoom == null){
					socket.emit('join', {room: $('#userOne').text()});
					console.log('joined ' + $('#userOne').text());			
					activeRoom = $('#userOne').text();
					activeUser = $('#yourUsername').text();
					console.log("welcome: " + activeUser);
					return false;
				}else{
					console.log('Leaving ' + activeRoom);
					socket.emit('leave', {room: activeRoom});
					$('#log').append('<br>' + $('<div/>').text('Goodbye: ' + activeUser).html());
					activeUser = null;
					activeRoom = null;					
					return false;
				}				
            });
			//
			//
			//individual user chats
			//
			
            $('form#sendMessage').submit(function(event) {
				console.log($('#roomMessage').val());
                socket.emit('sendMessage', {room: activeRoom, data: $('#roomMessage').val(), username: activeUser});
				$("#roomMessage").prop("value", "");
                return false;
            });
			
			//part of logout code
            $('form#disconnect').submit(function(event) {
                socket.emit('disconnect_request');
                return false;
            });
        });

$(window).on('keydown', function(e) {
  if (e.which == 13) {
    ws_send($('.contact-profile input').val(),$('.message-input input').val());
    return false;
  }
});