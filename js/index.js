counter = 0
itv = 0
gcid = 0
gtitle = ''
gurl = ''
gfilter = ''

Storage.prototype.setObject = function(key, value) {
    this.setItem(key, JSON.stringify(value));
}
 
Storage.prototype.getObject = function(key) {
    return JSON.parse(this.getItem(key));
}

function urls_list_name() {
	var url = window.location.search.substring(1)
	var vars = url.split('&')

	for (var i=0; i<vars.length; i++) {
		var ps = vars[i].split('=')

		if (ps[0] == 'l')
			return ps[1]
	}
}

function retry() {
	if (window.confirm('Really want us to work all over again??? '))
	{
		if (gcid == 0) {
			return; 
		}

		clearInterval(itv)

		rpc_call('remove_cache', [gcid], function(data) {
			goto_url(gurl)
		})
	}
}

function hide_urls() {
	$('#urls-encoded-panel').fadeOut(300)
	$('#urls-panel').fadeOut(300)
}

function show_urls() {
	$('#urls-encoded-panel').fadeOut(300)
	$('#urls-panel').fadeIn(300)
}

function encode_urls() {
	$('#urls-panel').fadeOut(300)
	$('#urls-encoded').text(Base64.encode(JSON.stringify(getURLs())))
	$('#urls-encoded-panel').fadeIn(300)
}

function load_urls() {
	var str = window.prompt('What is the mystified URLs? ')
	var obj = JSON.parse(Base64.decode(str))
	setURLs(obj)
	reload_urls()
}

function clear_urls() {
	if (window.confirm("Really throw away all of us??? "))
	{
		setURLs([])
		reload_urls()
	}
}

function upload(key, content, callback) {
	var key = 'bilibili_sunday_webui_urls-' + key
	var url = 'http://ljh.me/simple_access.php?action=write&key=' + key + '&content=' + Base64.encode(content)

	$.ajax({url: url, async: false, success: callback})
}

function download(key, callback) {
	var key = 'bilibili_sunday_webui_urls-' + key
	var url = 'http://ljh.me/simple_access.php?action=read&key=' + key

	$.ajax({url: url, async: false, success: callback})
}

function rpc_call(method, params, callback) {
	var data = {
		id: 'bilibili_sunday_webui', 
		method: 'bilibili_sunday.' + method, 
		params: Base64.encode(JSON.stringify(params))
	}

	var query = 'id=' + encodeURIComponent(data.id) + '&method=' + encodeURIComponent(data.method) + '&params=' + encodeURIComponent(data.params)

	$.getJSON("http://ljh.me:10753/jsonrpc?" + query, callback)
}

function load_url(url) {
	counter = counter + 1
		
	rpc_call('cid_for_video_url', [url], function(data) {
		load_cid(data.result, counter)
	})

	rpc_call('title_for_video_url', [url], function(data) {
		load_title(data.result, counter)
	})
}

function goto_url(url)
{
	$('#url-input').val(url)
	$('#url-input-form').submit()
}

function reload_urls()
{
	var urls = getURLs(); 
	$('#urls').html('')

	console.log(urls)

	for (var i=0; i<urls.length; i++) {
		var url = urls[i]
		var up = url.url
		
		if (gfilter != '' && url.title.indexOf(gfilter) < 0)
			continue

		$('#urls').append('<div><a id="url' + i + "\" href=\"javascript: goto_url('" + up + "'); \">" + url.title + '</a></div>')
			// $('#url' + i).click(function() {
			// 	$('#url-input').val(up)
			// 	$('#url-input-form').submit()
			// })
	}
}

function update_urls()
{
	if (gcid == 0 || gtitle == '')
		return

	var urls = getURLs(); 

	for (var i=0; i<urls.length; i++) {
		if (urls[i].cid == gcid)
			return
	}

	urls.push({url: gurl, cid: gcid, title: gtitle})

	setURLs(urls); 

	reload_urls()
}

function load_title(title, c) {
	if (c != counter) return
	$('#title').html(title)
	gtitle = title

	update_urls()
}

function load_cid(cid, c) {
	if (c != counter) return
	gcid = cid

	update_urls()

	rpc_call('request_cache', [cid], function(data) {
		update_status(cid, c)
	})
}

function update_status_quick(cid, c) {
	if (c != counter) return
	rpc_call('query_status', [cid], function(data) {
		if (c != counter) return
		if (data.result.status == 'complete')
			$('#status').html('<a download="' + gtitle + '" href="' + 'http://ljh.me/direct_access.php?path=' + encodeURIComponent(data.result.path) + '">complete</a>' + ' <a download="' + gtitle + '" href="' + 'http://ljh.me/direct_access.php?path=' + encodeURIComponent(data.result.comments_path) + '">comments</a>')
		else
			$('#status').html(data.result.status)
		var pct
		for (var i=num; i<data.result.downloads.length; i++) {
			pct = Math.floor(100 * data.result.downloads[i].status.progress) + '%'
			$('#progresses').append('<div class="progress"><div class="meter" style="width: ' + pct + '" id="progress' + i + '"></div></div>') 
		}
		for (var i=0; i<data.result.downloads.length; i++) {
			pct = Math.floor(100 * data.result.downloads[i].status.progress) + '%'
			if (data.result.downloads[i].status.status == 'waiting' || data.result.downloads[i].status.status == 'error')
				pct = '100%'
			$('#progress' + i).css('width', pct)
			if (data.result.downloads[i].status.status == 'complete')
				$('#progresso' + i).removeClass('alert success error').addClass('success')
			else if (data.result.downloads[i].status.status == 'waiting')
				$('#progresso' + i).removeClass('alert success error').addClass('alert')
			else if (data.result.downloads[i].status.status == 'error')
				$('#progresso' + i).removeClass('alert success error').addClass('error')
			else
				$('#progresso' + i).removeClass('alert success error')
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
			$('#status').html('<a download="' + gtitle + '" href="' + 'http://ljh.me/direct_access.php?path=' + encodeURIComponent(data.result.path) + '">complete</a>' + ' <a download="' + gtitle + '" href="' + 'http://ljh.me/direct_access.php?path=' + encodeURIComponent(data.result.comments_path) + '">comments</a>')
		else
			$('#status').html(data.result.status)
		for (var i=0; i<data.result.downloads.length; i++) {
			var pct 
			pct = Math.floor(100 * data.result.downloads[i].status.progress) + '%'
			if (data.result.downloads[i].status.status == 'waiting' || data.result.downloads[i].status.status == 'error')
				pct = '100%'
			$('#progresses').append('<div class="progress" id="progresso' + i + '"><div class="meter" style="width: ' + pct + '" id="progress' + i + '"></div></div>')
			if (data.result.downloads[i].status.status == 'complete')
				$('#progresso' + i).removeClass('alert success error').addClass('success')
			else if (data.result.downloads[i].status.status == 'waiting')
				$('#progresso' + i).removeClass('alert success error').addClass('alert')
			else if (data.result.downloads[i].status.status == 'error')
				$('#progresso' + i).removeClass('alert success error').addClass('error')
			else
				$('#progresso' + i).removeClass('alert success error')
		}
		num = data.result.downloads.length
		itv = setInterval(function() {
			update_status_quick(cid, c)
		}, 3000)
	})
}

function getURLs() {
	// if (urls_list_name()) {
	// 	download(urls_list_name(), function(content) {
	// 		if (content == '')
	// 			URLs = []
	// 		else {
	// 			console.log(content)
	// 			URLs = JSON.parse(content)
	// 		}
	// 	})
	// 	return URLs
	// }	else {
		return localStorage.getObject('urls') || []; 
	// }
}

function setURLs(urls) {
	// if (urls_list_name()) {
	// 	upload(urls_list_name(), JSON.stringify(urls), function(content) {})
	// 	URLs = urls
	// }	else {
		localStorage.setObject('urls', urls); 
	// }
}

function on_url_submit() {
	var urls = getURLs(); 
	var url = $.trim($('#url-input').val())
	$('#title').html('')
	$('#progresses').html('')
	$('#status').html('')
	gcid = 0
	gtitle = ''
	gurl = url
	if (itv != 0) clearInterval(itv)
	load_url(url)
	return false
}

function on_search_change() {
	content = $('#url-search-input').val()
	gfilter = content
	reload_urls()
}

$(document).ready(function() {
	$('#url-input-form').submit(on_url_submit)
	$('#url-search-input').keyup(on_search_change)
	reload_urls()
})