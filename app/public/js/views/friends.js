$(document).ready(function(){
    $("#glb-friend-search-bar").click(function(){
        $('#search-friends').attr("action",'/friend/'+$("#search-term").val());
        $("#search-friends").submit();
        // var params ={
        //     search_item : $("#search-term").val()
        // };
        // $.ajax({
        //     data: params,
        //     type: 'post',
        //     url: '/friend/'+$("#search-term").val(),
        //     dataType: 'json',
        //     cache: false,
        //     timeout: 5000
        //     // success: function(data){
        //     //     var data = $.parseJSON(data);
        //     //     alert(data.message);
        //     // },
        //     // error: function(jqXHR, textStatus, errorThrown){
        //     //     alert('error ' + textStatus + " " + errorThrown);  
        //     // }
        // });
    });
});
