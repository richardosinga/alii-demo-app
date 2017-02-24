var serviceURL = "http://www.triposo.com/_online/loc_search?q=Amst";

var employees;

$('#protocolListPage').bind('pageinit', function(event) {
	getEmployeeList();
});

function getEmployeeList() {
	$.getJSON(serviceURL, function(data) {
		$('#protocolList li').remove();
		results = data;
		$.each(results, function(index, obj) {
			$('#protocolList').append('<li><a href="protocol.html">' +obj.id + '</a></li>');
		});
		$('#protocolList').listview('refresh');
	});
}