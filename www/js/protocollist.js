
function getProtocolList() {
    var authhash = window.localStorage["authhash"];
    var serviceURL = "http://alii.develop.crossmarx.nl/engine/api/Getprotocols/query?querydef={%22class%22:%22protocol%22}&authhash=" + authhash;
	$.getJSON(serviceURL, function(data) {
		$('#protocolList li').remove();
        recordList = data.recordList;
		$.each(recordList, function(index, obj) {
			$('#protocolList').append('<li><a href="protocol.html?id=' + obj.data.Id + '">' + obj.data.Title + '</a></li>');
		});
		$('#protocolList').listview('refresh');
	});
};


function checkPreAuth() {
    var authhash = window.localStorage["authhash"];
    if(authhash.length > 1) {
        getProtocolList();
        $("#protocolListPage").show();
    } else {
       $("#loginPage").show();
    }
    return false;
};

function handleLogin(e) {
    var form = $("#loginForm"); 
    var u = $("#username", form).val();
    var p = $("#password", form).val();
    var authhash = $("#authhash", form).val();
    if(u != '' && p != '') {
        var loginString = '{loginname: "' + u + '", password: "' + p +'"}'
        $.ajax({
            type: "POST",
            url: "http://develop.crossmarx.nl/engine/api/Getprotocols/login?app=alii",
            data: loginString,
            contentType : "application/json", 
            dataType: 'json',
            success: function(res) {
                var authhash = res.authhash;
                window.localStorage["authhash"] = authhash;                    
                getProtocolList();
                $("#protocolListPage").show();
                $("#loginPage").hide();
                },
            fail: function(m) {
                alert("We cannot authenticate you with this login and password. Please check again.");
                }
        });
    } else {
        alert("We cannot authenticate you with this login and password. Please check again.");
    }
    return false;
};

  
  


