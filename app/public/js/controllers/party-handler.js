$(document).ready(function(){

    $("#party-total-fee").blur(function(){
        var m = document.getElementsByClassName('party-member');
        $("#party-fee-average").val($("#party-total-fee").val()/m.length);
    });

    $("#show-party").submit(function(event) {
        event.preventDefault(); // Prevents the page from refreshing
        var $this = $(this); // `this` refers to the current form element
        var party_data = {};
        party_data['party_theme'] = $("#party-des").val();
        party_data['party_time'] = $("#party-time").val();
        party_data['party_location'] = $("#party-location").val();
        party_data['party_total_fee'] = $("#party-total-fee").val();
        // console.log($("#attend-indicator").prop('checked'));   true
        party_data['member'] = [];

        var member_element = document.getElementsByClassName('party-member');
        
        for (var i=0; i<member_element.length; i++){
            party_data['member'].push(member_element[i].value);
        }
        
        if ($("#attend-indicator").prop('checked')){
            party_data['member'].push($(".hd-fill #username").text());
            party_data['operation'] = 'ins';
        }else{
            for(var i = party_data['member'].length - 1; i>=0 ; i--){
                if (party_data['member'][i] == $(".hd-fill #username").text())
                    party_data['member'].splice(i,1);  
            }
            party_data['operation'] = 'del';
        }

        console.log("party_data", party_data);
            
        $.ajax({
            url: location.href,
            type: 'post',
            dataType: 'json',
            data: party_data,
            success:function(response){
                console.log(response);
                // if (status == 'success') $('.modal-alert').modal('show');
                alert("successful !!");
            }
        });
    });

    
});
