window.ace = {
	edit: function(id){
		var textArea = document.createElement("textarea");
		textArea.value = document.getElementById(id).textContent;
		textArea.id = id;
		textArea.style.width = "50%";
		document.getElementById(id).replaceWith(textArea);
		return {
			setTheme(){},
			session: {
				setMode(){},
				on: function(event, handler){
					document.getElementById(id).addEventListener(event, handler);
				}
			},
			getValue() {
				return document.getElementById(id).value;
			},
			setValue(value){
				document.getElementById(id).value = value;
			}
		}
	}
}
