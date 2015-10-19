

$(document).ready(function(){
    console.log("data from render", $(".hd-fill #user_id").text());
    $("#friend-indicator #following").click(function(){
        var params = {
            friend_name : $("#profile #ref-name").text(),
            friend_indicator : "true"
        };

        $.ajax({
            data: params,
            url : "/"+$(".hd-fill #user_id").text()+"/friend/update",            
            dataType: 'json',
            cache: false,           
            type:'put',
            timeout: 5000,
            success: function(data){
                $("#friend-indicator #following").hide();
                $("#friend-indicator #followed").show();
            },
            error: function(jqXHR, textStatus, errorThrown){
                alert("update error");                
            }            
        });
        
    });
    $("#friend-indicator #followed").click(function(){
        var params = {
            friend_name : $("#profile #ref-name").text(),
            friend_indicator : "false"
        };
        $.ajax({
            data: params,
            // url: URL.parse(location.href).host+'/friend/update',
            url : "/"+$(".hd-fill #user_id").text()+"/friend/update",
            dataType: 'json',
            cache: false,           
            type:'put',
            timeout: 5000,
            success: function(data){
                $("#friend-indicator #following").show();
                $("#friend-indicator #followed").hide();
            },
            error: function(jqXHR, textStatus, errorThrown){
                alert("error");                
            }            
        });
        
    });    
});
