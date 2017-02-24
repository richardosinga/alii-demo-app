var protocolURL = 'http://alii.develop.crossmarx.nl/templates/mobileProtocol.vm?id=';

$('#detailsPage').live('pageshow', function(event) {
	var id = getUrlVars()["id"];
    $('#employeeTitle').load(protocolURL + id + '&loginname=hoop&password=hoop');
    console.log(protocolURL + id + '?loginname=hoop&password=hoop');
});

function getUrlVars() {
    var vars = [], hash;
    var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
    for(var i = 0; i < hashes.length; i++)
    {
        hash = hashes[i].split('=');
        vars.push(hash[0]);
        vars[hash[0]] = hash[1];
    }
    return vars;
}
