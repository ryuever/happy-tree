$(document).ready(function(){
    
    $('#my-attendance').click(function(){
        window.location.href='/' +$("#nav-tools-user").text() + '/party/attendance';                
    });

    $('#party-list').click(function(){
        window.location.href='/parties';
    });

    $('#create-request').click(function(){
        window.location.href='/party/create';        
    });
    
    // $('#create-request').click(function(){
    //     window.location.href='/party/create';        
    // });
    
    $('#my-managed').click(function(){
        window.location.href='/' +$("#nav-tools-user").text() + '/party/supervision';        
    });
});
