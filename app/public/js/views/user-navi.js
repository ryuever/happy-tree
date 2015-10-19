$(document).ready(function(){
    $(".hd-right #logout").click(function(){
        $.ajax({
            data: {logout:"true"},
            url: '/home',
            dataType: 'json',
            method : "post",
            cache: false,
            timeout: 5000,
            success: function(data){
            },
            error: function(jqXHR, textStatus, errorThrown){
            }
        });
    });
});
