counter = 0

function rpc_call(method, params, callback) {
	data = {
		id: 'bilibili_sunday_webui', 
		method: 'bilibili_sunday.' + method, 
		params: Base64.encode(JSON.stringify(params))
	}

	query = 'id=' + encodeURIComponent(data.id) + '&method=' + encodeURIComponent(data.method) + '&params=' + encodeURIComponent(data.params)

	$.getJSON("http://ljh.me:10753/jsonrpc?" + query, callback)
}

function load_url(url) {
	counter = counter + 1
	$('#status').html('')
	rpc_call('cid_for_video_url', [url], function(data) {
		load_cid(data.result, counter)
	})

	rpc_call('title_for_video_url', [url], function(data) {
		load_title(data.result, counter)
	})
}

function load_title(title, c) {
	if (c != counter) return
	$('#title').html(title)
}

function load_cid(cid, c) {
	if (c != counter) return
	if (itv != 0) clearInterval(itv)

	rpc_call('request_cache', [cid], function(data) {
		update_status(cid, c)
	})
}

function update_status_quick(cid, c) {
	if (c != counter) return
	rpc_call('query_status', [cid], function(data) {
		if (c != counter) return
		if (data.result.status == 'complete')
			$('#status').html('<a href="' + 'http://ljh.me/direct_access.php?path=' + encodeURIComponent(data.result.path) + '">complete</a>')
		else
			$('#status').html(data.result.status)
		for (var i=num; i<data.result.downloads.length; i++) {
			pct = Math.floor(100 * data.result.downloads[i].status.progress) + '%'
			$('#progresses').append('<div class="progress"><div class="meter" style="width: ' + pct + '" id="progress' + i + '"></div></div>') 
		}
		for (var i=0; i<data.result.downloads.length; i++) {
			pct = Math.floor(100 * data.result.downloads[i].status.progress) + '%'
			if (data.result.downloads[i].status.status == 'waiting')
				pct = '100%'
			$('#progress' + i).css('width', pct)
			if (data.result.downloads[i].status.status == 'complete')
				$('#progresso' + i).removeClass('alert success').addClass('success')
			else if (data.result.downloads[i].status.status == 'waiting')
				$('#progresso' + i).removeClass('alert success').addClass('alert')
			else
				$('#progresso' + i).removeClass('alert success')
		}
		num = data.result.downloads.length
	})	
}

function update_status(cid, c) {
	if (c != counter) return
	rpc_call('query_status', [cid], function(data) {
		if (c != counter) return
		$('#progresses').html('')
		if (data.result.status == 'complete')
			$('#status').html('<a href="' + 'http://ljh.me/direct_access.php?path=' + encodeURIComponent(data.result.path) + '">complete</a>')
		else
			$('#status').html(data.result.status)
		for (var i=0; i<data.result.downloads.length; i++) {
			pct = Math.floor(100 * data.result.downloads[i].status.progress) + '%'
			if (data.result.downloads[i].status.status == 'waiting')
				pct = '100%'
			$('#progresses').append('<div class="progress" id="progresso' + i + '"><div class="meter" style="width: ' + pct + '" id="progress' + i + '"></div></div>')
			if (data.result.downloads[i].status.status == 'complete')
				$('#progresso' + i).removeClass('alert success').addClass('success')
			else if (data.result.downloads[i].status.status == 'waiting')
				$('#progresso' + i).removeClass('alert success').addClass('alert')
			else
				$('#progresso' + i).removeClass('alert success')
		}
		num = data.result.downloads.length
		itv = setInterval(function() {
			update_status_quick(cid, c)
		}, 3000)
	})
}

function on_url_submit() {
	itv = 0
	url = $.trim($('#url-input').val())
	load_url(url)
	return false
}


$(document).ready(function() {
	$('#url-input-form').submit(on_url_submit)
})