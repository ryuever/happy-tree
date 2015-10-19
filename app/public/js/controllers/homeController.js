
function HomeController()
{

// bind event listeners to button clicks //
	var that = this;

    $("#glb-friend-search-bar").click(function(){
        $('#search-friends').attr("action",'/friend/'+$("#hd-search-item").val());
        $("#search-friends").submit();
    });
    
// handle user logout //
	$('#logout').click(function(){ that.attemptLogout(); });

	this.attemptLogout = function()
	{
		var that = this;
		$.ajax({
			url: "/home",
			type: "POST",
			data: {logout : true},
			success: function(data){
	 			that.showLockedAlert('You are now logged out.<br>Redirecting you back to the homepage.');
			},
			error: function(jqXHR){
				console.log(jqXHR.responseText+' :: '+jqXHR.statusText);
			}
		});
	};

	this.showLockedAlert = function(msg){
		$('.modal-alert').modal({ show : false, keyboard : false, backdrop : 'static' });
		$('.modal-alert .modal-header h3').text('Success!');
		$('.modal-alert .modal-body p').html(msg);
		$('.modal-alert').modal('show');
		$('.modal-alert button').click(function(){window.location.href = '/';});
		// setTimeout(function(){window.location.href = '/';}, 3000);
	};
}

HomeController.prototype.onUpdateSuccess = function(){
	$('.modal-alert').modal({ show : false, keyboard : true, backdrop : true });
	$('.modal-alert .modal-header h3').text('Success!');
	$('.modal-alert .modal-body p').html('Your account has been updated.');
	$('.modal-alert').modal('show');
	$('.modal-alert button').off('click');
}
