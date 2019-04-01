var postConsoleLogs = `
	(function(log){
		console.log = function(){

			var args = Array.from(arguments);
			var message = {
				type: "log"
			};
			var json;
			try {
				message.data = args;
				json = JSON.stringify(message);
			} catch (err) {
				message.data = "Something was logged. Check your browser's console.";
				json = JSON.stringify(message);
			}

			parent.postMessage(json);
			return log.apply(this, arguments);

		}
	})(console.log)
`;

// PURE FUNCTIONS
function getDataFromURL(location){
	var url = new URL(location);
	var json = url.searchParams.get("json");
	return Promise.resolve( JSON.parse(json) );
}

function editorsData(editors){
	return {
		html: editors.html.getValue(),
		css: editors.css.getValue(),
		javascript: editors.javascript.getValue()
	};
}

function urlForCode(data){
	var json = JSON.stringify(data);
	var urlInstance = new URL(window.location);
	urlInstance.searchParams.set("json", json);
	return urlInstance.toString();
}

function updateEditors(editors, data){
	editors.javascript.setValue(data.javascript);
	editors.html.setValue(data.html);
	editors.css.setValue(data.css);
}



// READING STATE FUNCTIONS
function createEditors(){
	var javascript = ace.edit("javascript");
	javascript.setTheme("ace/theme/monokai");
	javascript.session.setMode("ace/mode/javascript");

	var html = ace.edit("html");
	html.setTheme("ace/theme/monokai");
	html.session.setMode("ace/mode/html");

	var css = ace.edit("css");
	css.setTheme("ace/theme/monokai");
	css.session.setMode("ace/mode/css");

	return {
		javascript: javascript,
		html:html,
		css: css
	}
}

function onEditorsChange(editors, handler) {
	editors.javascript.session.on("change", handler);
	editors.html.session.on("change", handler);
	editors.css.session.on("change", handler);

	return function(){
		editors.javascript.session.off("change", handler);
		editors.html.session.off("change", handler);
		editors.css.session.off("change", handler);
	}
}

// WRITE STATE FUNCTIONS



function onEditorsChangeCallWithUrlFromCode(editors, callback) {
	onEditorsChange(editors, function(){
		var data = editorsData(editors);
		var url = urlForCode(data);
		callback(url);
	});
}


function writeLog(message){
	var p = document.createElement("p")
	p.textContent = message.data;
	consoleDisplay.appendChild(p);
}

var handlers = {
	log: writeLog,
	ready: function(){} //-> avoids a warning
}
// Calls functions that create side effects
function messageHandler(event, handlers) {
	var data = JSON.parse(event.data);
	if(handlers[data.type]){
		handlers[data.type](data);
	} else {
		console.warn("unable to handle message", event);
	}
}

window.addEventListener("message", function(event){
	messageHandler(event, handlers);
});

function getDataFromPostMessage(){
	var promise = new Promise(function(resolve, reject){
		function handler(event) {
			var data = JSON.parse(event.data);
			if(data.type === "code") {
				window.removeEventListener("message", handler);
				resolve(data);

			}
		}
		window.addEventListener("message", handler);
	});

	window.postMessage(JSON.stringify({type: "ready"}));
	return promise;
}

var editors = createEditors();

var url = new URL(window.location),
	dataPromise;


if(url.searchParams.has("json")) {
	dataPromise = getDataFromURL(window.location);
} else {
	dataPromise = getDataFromPostMessage();
}

dataPromise.then(function(data){
	updateEditors(editors, data);
});


onEditorsChangeCallWithUrlFromCode(editors, function(url){
	history.replaceState({}, "editor", url);
});

function runEditorCodeInIframe(editors) {

	var iframe = document.createElement("iframe");
	iframe.id = "result";
	var HTML = "<html><head><script>"+postConsoleLogs+"</"+"script><style>"+editors.css.getValue()+"</style></head><body>"+editors.html.getValue()+
		"<script type='module'>\n"+editors.javascript.getValue() +"\n</"+"script></body></html>";
	iframe.setAttribute("srcdoc", HTML);
	demo.innerHTML ="";
	var oldIframe = document.getElementById("result");

	demo.appendChild(iframe);
}

run.onclick = function(){
	runEditorCodeInIframe(editors);
}
