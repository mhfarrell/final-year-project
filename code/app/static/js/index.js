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

$('#addcontact').click(function(){
	$('form, .contactTog').animate({height: "toggle", opacity: "toggle"}, "slow");
	if ($("#addcontact span").text() == 'Chats'){
		$("#addcontact span").text('Add Contact');
		$("#addcontact i").removeClass();
		$("#addcontact i").addClass("fa fa-user-plus fa-fw");		
	}else{
		$("#addcontact span").text('Chats');
		$("#addcontact i").removeClass();
		$("#addcontact i").addClass("fa fa-comments-o fa-fw");
	}
});	

        $(document).ready(function() {
			console.log("open");
            // Use a "/test" namespace.
            // An application can open a connection on multiple namespaces, and
            // Socket.IO will multiplex all those connections on a single
            // physical channel. If you don't care about multiple channels, you
            // can set the namespace to an empty string.
            namespace = '/test';
			var currentRoom = null;
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
						$('.contact.active .preview').html('<i class="fa fa-comment-o fa-fw" aria-hidden="true"></i><span>' + msg.username +': </span>' + msg.data);
						$(".messages").animate({ scrollTop: $(document).height() }, "fast");						
					}else{
						$('<li class="replies"><img src="/static/images/placeholder.png" alt="" title="'+ msg.username +'" /><p>' + msg.data + '</p></li>').appendTo($('.messages ul'));
						$('.contact.active .preview').html('<i class="fa fa-comment-o fa-fw" aria-hidden="true"></i><span>' + msg.username +': </span>' + msg.data);
						$(".messages").animate({ scrollTop: $(document).height() }, "fast");							
					}
				}
            });
			
			//
			//individual user chats
			//
			$(document).on('click', function(event){
				var liID = $(event.target).closest('li').attr('id');
				if($(event.target).hasClass('contact')){
					if (activeRoom == null){						
						roomJoin(liID);
					}else{
						$('#'+activeRoom).removeClass('contact active').addClass('contact');
						roomJoin(liID);
					}
				}
			});

			function joinCode(i){
				currentRoom = $('#chat'+i).text();
				activeRoom = i;
				activeUser = $('#yourUsername').text();
				$('#curContact').text($('#user'+i).text());
				//toggle class later
				$('#'+i).attr('class', 'contact active');
				socket.emit('join', {room: currentRoom, username: activeUser});
				return;
			}
			
			function leaveCode(i){
				socket.emit('leave', {room: currentRoom});
				$('#curContact').text(null);
				$('#chatMsg').empty();
				//toggle class later
				$('#'+i).removeClass('contact active').addClass('contact');
				return;
			}
			
			//pointless but seems to not work without ?!?!
			function roomJoin(i){
				if (currentRoom == null){
					joinCode(i);
					return false;
				}else{
					leaveCode(i);
					joinCode(i);
					return false;
				}
				return;
			}
			//semi working
			
            $('form#sendMessage').submit(function(event) {
				console.log('room: ' + currentRoom + ', username: ' + activeUser);
                socket.emit('sendMessage', {room: currentRoom, data: $('#roomMessage').val(), sender: activeUser, recipient: $('#user'+activeRoom).text()});
				$("#roomMessage").prop("value", "");
                return false;
            });
			
			//part of logout code
            $('form#disconnect').submit(function(event) {
                socket.emit('disconnect_request');
                return false;
            });
        });