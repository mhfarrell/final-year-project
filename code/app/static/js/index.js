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
            var socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port + namespace);
			console.log(socket);
            // Event handler for new connections.
            // The callback function is invoked when a connection with the
            // server is established.
            socket.on('connect', function() {
                socket.emit('myConnect', {data: ('#yourUsername').text});
            });


            socket.on('my_response', function(msg) {
				if(msg.username == null){
					console.log('Received #' + msg.count + ' : ' + msg.data);
				}else{
					if(activeUser == msg.username){
						$('<li class="sent"><img src="/static/images/placeholder.png" alt="" title="'+ msg.username +'" /><p>' + msg.data + '</p></li>').appendTo($('.messages ul'));
						$('.message-input input').val(null);
						$('.contact.active .preview').html('<span>' + msg.username +': </span>' + msg.data);
						$(".messages").animate({ scrollTop: $(document).height() }, "fast");						
					}else{
						$('<li class="replies"><img src="/static/images/placeholder.png" alt="" title="'+ msg.username +'" /><p>' + msg.data + '</p></li>').appendTo($('.messages ul'));
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
					socket.emit('join', {room: $('#chatOne').text(), username: activeUser});
					//username: $('#userOne').text(), room: $('#chatOne').val()
					console.log('joined ' + $('#userOne').text());			
					activeRoom = $('#chatOne').text();
					activeUser = $('#yourUsername').text();
					console.log("welcome: " + activeUser);
					$("#roomSub").prop('value', 'Leave Room');
					return false;
				}else{
					console.log('Leaving ' + activeRoom);
					socket.emit('leave', {room: activeRoom});
					$('#log').append('<br>' + $('<div/>').text('Goodbye: ' + activeUser).html());
					activeUser = null;
					activeRoom = null;
					$("#roomSub").prop('value', 'Join Room');
					$("#chatMsg").empty();
					return false;
				}				
            });
			//
			//
			//individual user chats
			//
			
            $('form#sendMessage').submit(function(event) {
				console.log('room: ' + activeRoom + ', username: ' + activeUser);
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