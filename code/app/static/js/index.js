$(".messages").animate({ scrollTop: $(document).height() }, "fast");

$('#addcontact').click(function(){
	$('.sideMenu').animate({height: "toggle", opacity: "toggle"}, "slow");
	if ($("#addcontact span").text() == 'Chats'){
		$("#addcontact span").text('Add Contact');
		$("#addcontact").removeClass();
		$("#addcontact").addClass("fa fa-user-plus fa-fw");		
	}else{
		$("#addcontact span").text('Chats');
		$("#addcontact").removeClass();
		$("#addcontact").addClass("fa fa-comments-o fa-fw");
	}
});	

        $(document).ready(function() {
            namespace = '/';
			var currentRoom = null;
			var activeRoom = null;
			var activeUser = null;
            var socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port + namespace);
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
				console.log(liID);
				if($(event.target).hasClass('contactName')){
					console.log("contact selected")
					if (activeRoom == null){						
						roomJoin(liID);
					}else{
						$('#'+activeRoom).removeClass('contact active').addClass('contact');
						roomJoin(liID);
					}
				}else if($(event.target).hasClass('searchedName')){
					
					console.log('ajax');
					$.ajax({
						data : {
							username : liID
						},
						type : 'POST',
						url : '/newchat'
						})
							.done(function(data) {
						console.log('after ajax');
						if (data.error) {
							console.log(data.error)
						}
						else {
							console.log(data);
							for(i in data){
								console.log(i);
						
								//$('<li id="3" class="contact"><div class="wrap"><span class="contact-status online"></span><img src="{{ url_for(' + "static" + ', filename=' + "images/placeholder.png" + ') }}" alt="" /><div class="meta"><p hidden id="' + data[i].chatID + '">' + data[i].chatID + '</p><p id="' + liID + '" class="name contactName">' + data[i].chatID +'</p><p class="preview"><i class="fa fa-comment-o fa-fw" aria-hidden="true"></i><span>' + data[i].username + ':</span>'+ "Hi" + '</p></div></div></li>'.appendTo($('.contacts ul'));
							console.log(data[i].chatID);
							}
						}
					});
					//$("#contSearch").prop("value", "");
					event.preventDefault();					

				}
			});

			function joinCode(i){
				currentRoom = $('#chat'+i).text();
				activeRoom = i;
				activeUser = $('#yourUsername').text();
				$('#curContact').text($('#user'+i).text());
				//toggle class later with css
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
			
			document.getElementById('contactSearch').onkeydown = function(e){
				if(e.keyCode == 13){
					console.log('ajax');
					$.ajax({
						data : {
							name : $('#yourUsername').text(),
							search : $('#contSearch').val()
						},
						type : 'POST',
						url : '/search'
						})
							.done(function(data) {
						console.log('after ajax');
						if (data.error) {
							console.log(data.error)
						}
						else {
							console.log(data);
							for(i in data){
								console.log(i);
								$('<li class="contactResult" id="'+ data[i].username +'"><div class="wrap"><div class="meta"><p class="name searchedName">'+ data[i].username +'</p></div></div></li>').appendTo($('.contactResults ul'));
							console.log(data[i].username);
							}
						}
					});
					$("#contSearch").prop("value", "");
					event.preventDefault();
				}			   
			};
			
			
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