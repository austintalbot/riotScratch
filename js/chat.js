riot.tag2('chat', '<div> <div>{name}</div> <div show="{this.error_state==\'error\'}" class="{error}"> error: {error_display}</div> <div> <form name="sign_in_form" onsubmit="{login}"> <input required value="" ref="email" type="email"> <input type="password" required value="" ref="password"> <br> <button disabled="{this.state==\'authenticated\'}"> sign In </button> <button disabled="{this.state==\'unauthenticated\'}" onclick="{signOut}"> Sign Out</button> <button disabled="{this.state==\'authenticated\'}" onclick="{register}"> register </button> </form> </div> <div show="{this.state==\'authenticated\'}"> <form onsubmit="{submit_message}"> <input disabled placeholder="User Name" ref="logged_in_email" value="" type="email"> <input type="text" placeholder="Message" ref="logged_message" value=""> <button disabled="{this.state==\'unauthenticated\'}" type="submit" value="Submit"> submit </button> </form> </div> </div> <hr> <div class="messages"> <ul> <li href="#{message}" each="{message in outputMessages}"> {message}</li> </ul </div>', '', '', function(opts) {
    self = this;
   this.outputMessages = [];

    var currentUser = {};

    this.state = 'unauthenticated';
    this.name = '';
    this.error_display = 'no errors';

    var uid = '';
    var messageQueueRef = firebase.database().ref('/data/userWriteable/messageQueue');
    var loginsRef = firebase.database().ref('/data/userWriteable/login');
    var accountsRef = firebase.database().ref('/data/userReadable/accounts');
    var messagesRef = null;
    var userMessageRef = null;
    loginsRef.on('child_added',function (snap)
    {
        console.log('login received', snap.val());
        var user = snap.val();
        var userRef = snap.ref;

        user.lastLoggedin = Date.now();

    });

    this.login = function(e) {
        e.preventDefault();
        self.error_display = '';
        self.error_state = 'no errors';
        var results = null;
        var error_results = null;
       firebase.auth().signInWithEmailAndPassword(this.refs.email.value, this.refs.password.value)
        .then(function(results){
            console.log('sign in successful');
            self.name = 'authenticated';
            self.state = 'authenticated';
            self.refs.logged_in_email.value = self.refs.email.value;
            self.update();
        })
        .catch(function(error) {

            var errorCode = error.code;
            var errorMessage = error.message;
            console.log('error code: ' + errorCode + ' message: ' + errorMessage);

            self.error_display = errorMessage;
            self.name = 'unauthenticated';
            self.state = 'unauthenticated';
            self.refs.logged_in_email.value = '';
            self.update();
        })
    };

    firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
            var loginQueueRef = firebase.database().ref('/data/userWriteable/login');
            var userLoginRef = loginQueueRef.child(user.uid);

            user.lastLoggedin = Date.now();
            console.log(userLoginRef.toString(),user);
            userLoginRef.set({
                email: user.email,
                uid: user.uid,
                lastLoggedin: user.lastLoggedin
            })
            .catch( function(error){
                console.log('login error', error)
            });
           uid = user.uid;

        }
    });

    this.register = function(e) {
        e.preventDefault();
        firebase.auth().createUserWithEmailAndPassword(this.refs.email.value, this.refs.password.value)
        .then(function(result){
            console.log('registration successful');
        })
        .catch(function(error) {

            var errorCode = error.code;
            var errorMessage = error.message;
            self.error_display = errorMessage;
            self.state = 'unathenticated';
            self.update();
        });
    };

    this.signOut = function(e) {
        firebase.auth().signOut()
            .then(function(result){
                console.log('sign out successful');
                self.state = 'unauthenticated';
                self.name = 'unathenticated';
                self.refs.logged_in_email.value = '';
                self.update();
            })
            .catch(function(err) {

            });
    };

    this.submit_message = function(e) {
        e.preventDefault();

        var email = this.refs.logged_in_email.value;

        var messageText = this.refs.logged_message.value;
        userMessageRef = messageQueueRef.child(uid);
        var sentTime = Date();
        messagesRef = firebase.database().ref('/data/userReadable/messages').child( sentTime)
        var messageData= {
            uid: uid,
            email: email,
            messageText:messageText,
            time: new Date().toLocaleString()
         };
        userMessageRef.update(
           messageData
        )
         messagesRef.push(messageData)

        updateDisplayedmessages();

        this.refs.logged_message.value = '';
    };

    function updateDisplayedmessages(){
        var messageRead = firebase.database().ref('/data/userReadable/messages');

        messageRead.on('value',function(snap)
        {
             self.outputMessages = [];

            var messageref = snap.ref;
            var _uid = snap.key;
            var message = snap.val();

             snap.forEach(function(childSnapshot) {
                childSnapshot.forEach(function(grandChildSnap) {
                    var childKey = grandChildSnap.key;
                    var childData = grandChildSnap.val();
                    self.outputMessages.push(childData.email + ' says: ' + childData.messageText )

                });
             });

        });
    };

});