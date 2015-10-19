$(document).ready(function(){
    $('#weekday-kanazawa-jaist').click(function(){
        window.location.href='/shuttle';        
    });
    $('#weekday-jaist-kanazawa').click(function(){
        window.location.href='/shuttle/wjk';
    });

    $('#holiday-kanazawa-jaist').click(function(){
        window.location.href='/shuttle/hkj';        
    });

    $('#holiday-jaist-kanazawa').click(function(){
        window.location.href='/shuttle/hjk'; 
    });    
});
