function rpc_call(method, params, callback) {
	data = {
		id: 'bilibili_sunday_webui', 
		method: 'bilibili_sunday.' + method, 
		params: Base64.encode(JSON.stringify(params))
	}

	query = 'id=' + encodeURIComponent(data.id) + '&method=' + encodeURIComponent(data.method) + '&params=' + encodeURIComponent(data.params)

	alert("http://ljh.me:10753/jsonrpc?" + query)

	$.get("http://ljh.me:10753/jsonrpc?" + query, function(data) {

	})
}

function load_url(url) {
	rpc_call('cid_for_video_url', [url], function(data) {
		alert(data)
	})
}

function on_url_submit() {
	url = $.trim($('#url-input').val())
	load_url(url)
	return false
}


$(document).ready(function() {
	$('#url-input-form').submit(on_url_submit)
})