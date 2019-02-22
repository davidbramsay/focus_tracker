
function login_success(data, email){
    chrome.runtime.sendMessage({"message": "login_success", "data": data, "email": email});
}

function logout_click(){
    chrome.runtime.sendMessage({"message": "logout_click"});
}

function focusHandler(event) {

    var id = event.target.id;

    if (id == 'email' || id == 'password') {
        if (document.getElementById(id).value == 'email') {
            $('#' + id).val("");
        }
    }
}

function blurHandler(event) {

    var id = event.target.id;

    if (id == 'email' || id == 'password') {
        if (document.getElementById(id).value == '') {
            $('#' + id).val("email");
        }
    }
}


document.addEventListener("focus", focusHandler, true);
document.addEventListener("blur", blurHandler, true);


//Stop click event
$('a').click(function(event){
            event.preventDefault();
            console.log(event.currentTarget.name);
            var login_data = {
              email: document.getElementById('email').value,
              password: document.getElementById('password').value,
              ttl: 60 * 60 * 24 * 30 * 12
            };

            if (event.currentTarget.name == 'signin') {
                $.post('https://feedback.media.mit.edu/api/appUsers/login', login_data, function (data, textStatus, jqXHR) {
                    login_success(data, login_data.email);

                }).fail(function() {
                    document.getElementById("errors").innerHTML = "invalid username or password.";
                });
            }

            if (event.currentTarget.name == 'signup') {
                $.post('https://feedback.media.mit.edu/api/appUsers', login_data, function (data, textStatus, jqXHR) {
                    $.post('https://feedback.media.mit.edu/api/appUsers/login', login_data, function (data, textStatus, jqXHR) {
                        login_success(data, login_data.email);

                    }).fail(function() {
                        document.getElementById("errors").innerHTML = "invalid username or password.";
                    });

                }).fail(function() {
                    document.getElementById("errors").innerHTML = "username already taken.";
                });
            }

            if (event.currentTarget.name == 'logout') {
               logout_click();
            }
});


var username = chrome.extension.getBackgroundPage().state.username;

if (username == null){
        document.getElementById('loginbox').classList.remove("visuallyhidden");
        document.getElementById('logoutbox').classList.add("visuallyhidden");
}else {
        document.getElementById("loginbox").classList.add("visuallyhidden");
        document.getElementById("logoutbox").classList.remove("visuallyhidden");
        document.getElementById("username").innerHTML = username;
}
