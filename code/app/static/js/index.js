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

// Escape HTML to prevent XSS when inserting user content into the DOM
function escapeHtml(str) {
	if (!str) return '';
	var div = document.createElement('div');
	div.appendChild(document.createTextNode(str));
	return div.innerHTML;
}

$(document).ready(function() {
	var namespace = '/';
	var currentRoom = null;
	var activeRoom = null;
	var activeUser = null;
	var socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port + namespace);

	socket.on('connect', function() {
		socket.emit('myConnect', {data: $('#yourUsername').text()});
	});

	socket.on('my_response', function(msg) {
		if(msg.username == null){
			console.log('Received #' + msg.count + ' : ' + msg.data);
		}else{
			var safeUser = escapeHtml(msg.username);
			var safeData = escapeHtml(msg.data);
			if(activeUser == msg.username){
				$('<li class="sent"><img src="/static/images/placeholder.png" alt="" title="'+ safeUser +'" /><p>' + safeData + '</p></li>').appendTo($('.messages ul'));
				$('.message-input input').val(null);
				$('.contact.active .preview').html('<i class="fa fa-comment-o fa-fw" aria-hidden="true"></i><span>' + safeUser +': </span>' + safeData);
				$(".messages").animate({ scrollTop: $(document).height() }, "fast");
			}else{
				$('<li class="replies"><img src="/static/images/placeholder.png" alt="" title="'+ safeUser +'" /><p>' + safeData + '</p></li>').appendTo($('.messages ul'));
				$('.contact.active .preview').html('<i class="fa fa-comment-o fa-fw" aria-hidden="true"></i><span>' + safeUser +': </span>' + safeData);
				$(".messages").animate({ scrollTop: $(document).height() }, "fast");
			}
		}
	});

	// Contact selection - delegate to entire .contact li
	$(document).on('click', '.contact', function(){
		var liID = $(this).attr('id');
		console.log('contact selected', liID);
		if (activeRoom == null){
			roomJoin(liID);
		}else{
			$('#'+activeRoom).removeClass('contact active').addClass('contact');
			roomJoin(liID);
		}
	});

	// Search result selection
	$(document).on('click', '.searchedName', function(event){
		var liID = $(event.target).closest('li').attr('id');
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
				console.log(data.error);
			}
			else {
				window.location.href = '/';
			}
		});
		event.preventDefault();
	});

	function joinCode(i){
		currentRoom = $('#chat'+i).text();
		activeRoom = i;
		activeUser = $('#yourUsername').text();
		$('#curContact').text($('#user'+i).text());
		$('#'+i).attr('class', 'contact active');
		socket.emit('join', {room: currentRoom, username: activeUser});
	}

	function leaveCode(i){
		socket.emit('leave', {room: currentRoom});
		$('#curContact').text(null);
		$('#chatMsg').empty();
		$('#'+i).removeClass('contact active').addClass('contact');
	}

	function roomJoin(i){
		if (currentRoom == null){
			joinCode(i);
		}else{
			leaveCode(i);
			joinCode(i);
		}
		return false;
	}

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
					console.log(data.error);
				}
				else {
					console.log(data);
					for(var i in data){
						var safeUsername = escapeHtml(data[i].username);
						$('<li class="contactResult" id="'+ safeUsername +'"><div class="wrap"><div class="meta"><p class="name searchedName">'+ safeUsername +'</p></div></div></li>').appendTo($('.contactResults ul'));
					}
				}
			});
			$("#contSearch").prop("value", "");
			e.preventDefault();
		}
	};

	$('form#sendMessage').submit(function(event) {
		console.log('room: ' + currentRoom + ', username: ' + activeUser);
		socket.emit('sendMessage', {room: currentRoom, data: $('#roomMessage').val(), sender: activeUser, recipient: $('#user'+activeRoom).text()});
		$("#roomMessage").prop("value", "");
		return false;
	});

	$('form#disconnect').submit(function(event) {
		socket.emit('disconnect_request');
		return false;
	});

	// Auto-select the first chat on load
	var firstContact = $('.contacts ul li.contact').first();
	if (firstContact.length) {
		roomJoin(firstContact.attr('id'));
	}
});
