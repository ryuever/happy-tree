var crypto 		= require('crypto');
var MongoDB 	= require('mongodb').Db;
var Server 		= require('mongodb').Server;
var moment 		= require('moment');

var dbPort 		= 27017;
var dbHost 		= 'localhost';
var dbName 		= 'jaist';

/* establish the database connection */

var db = new MongoDB(dbName, new Server(dbHost, dbPort, {auto_reconnect: true}), {w: 1});
	db.open(function(e, d){
	if (e) {
		console.log(e);
	}	else{
		console.log('connected to database :: ' + dbName);
	}
});
var accounts = db.collection('accounts');

/* login validation methods */

exports.autoLogin = function(user, pass, callback)
{
	accounts.findOne({user:user}, function(e, o) {
		if (o){
			o.pass == pass ? callback(o) : callback(null);
		}	else{
			callback(null);
		}
	});
};

// exports.getProfile = function(user_id, callback)
// {
//     accounts.findOne({_id:user_id}, function(e, o){
//         if(o){
//             console.log("profile data", o);
//             callback(null, o);
//         }else{
//             callback(e, null);
//         }
//     });    
// };

exports.manualLogin = function(user, pass, callback)
{
	accounts.findOne({user:user}, function(e, o) {
		if (o == null){
			callback('user-not-found');
		}	else{
			validatePassword(pass, o.pass, function(err, res) {
				if (res){
					callback(null, o);
				}	else{
					callback('invalid-password');
				}
			});
		}
	});
}

/* record insertion, update & deletion methods */
exports.addNewAccount = function(newData, callback)
{
	accounts.findOne({user:newData.user}, function(e, o) {
		if (o){
			callback('username-taken');
		}	else{
			accounts.findOne({email:newData.email}, function(e, o) {
				if (o){
					callback('email-taken');
				}	else{
					saltAndHash(newData.pass, function(hash){
						newData.pass = hash;
					// append date stamp when record was created //
						newData.date = moment().format('MMMM Do YYYY, h:mm:ss a');
						accounts.insert(newData, {safe: true}, callback);
					});
				}
			});
		}
	});
}

exports.updateAccount = function(newData, callback)
{
	accounts.findOne({user:newData.user}, function(e, o){
		o.name 		= newData.name;
		o.email 	= newData.email;
		o.country 	= newData.country;
		if (newData.pass == ''){
			accounts.save(o, {safe: true}, function(err) {
				if (err) callback(err);
				else callback(null, o);
			});
		}	else{
			saltAndHash(newData.pass, function(hash){
				o.pass = hash;
				accounts.save(o, {safe: true}, function(err) {
					if (err) callback(err);
					else callback(null, o);
				});
			});
		}
	});
}

exports.updateAccountPartyListManageParty = function(newData, callback){
    accounts.findOne({_id:getObjectId(newData.user_id)}, function(e, o){
        var partylist = o.partylist;
        var manageParty = o.manageParty;
        console.log("new account value", o);        
        partylist.push(newData.party_info);
        manageParty.push(newData.party_info);
        accounts.update({_id:getObjectId(newData.user_id)}, {$set:{partylist : partylist, manageParty:manageParty}},function(err, records){
            if (err) callback(err);
			else callback(null, records);
        });
    });
};

exports.updateAccountPartyListAttendance = function(newData, callback){
    accounts.findOne({_id:getObjectId(newData.user_id)}, function(e, o){
        var partylist = o.partylist;
        
        // console.log("new account value", o);
        // console.log("delete " , partylist, newData.party_info._id);
        
        if(newData.operation == "del"){
            for(var i = partylist.length -1 ; i>=0; i--){
                console.log("partylist[i]._id", partylist[i]._id, newData.party_info._id);
                if(partylist[i]._id.toString() == newData.party_info._id.toString()){
                    console.log("shoudl ddddddddddddddddddddddddddddddddd");
                    partylist.splice(i, 1);
                }
            }
        }else if(newData.operation == "ins"){
            partylist.push(newData.party_info);
        }

        console.log("finished " , partylist);
        accounts.update({_id:getObjectId(newData.user_id)}, {$set:{partylist : partylist}},function(err, records){
            if (err) callback(err);
			else callback(null, records);
        });
    });
};



exports.updatePassword = function(email, newPass, callback)
{
	accounts.findOne({email:email}, function(e, o){
		if (e){
			callback(e, null);
		}	else{
			saltAndHash(newPass, function(hash){
		        o.pass = hash;
		        accounts.save(o, {safe: true}, callback);
			});
		}
	});
}

/* account lookup methods */

exports.deleteAccount = function(id, callback)
{
	accounts.remove({_id: getObjectId(id)}, callback);
}

exports.getAccountByEmail = function(email, callback)
{
	accounts.findOne({email:email}, function(e, o){ callback(o); });
}

exports.validateResetLink = function(email, passHash, callback)
{
	accounts.find({ $and: [{email:email, pass:passHash}] }, function(e, o){
		callback(o ? 'ok' : null);
	});
}

exports.getAllRecords = function(callback)
{
	accounts.find().toArray(
		function(e, res) {
		    if (e) callback(e);
		    else callback(null, res);
	});
};

exports.delAllRecords = function(callback)
{
	accounts.remove({}, callback); // reset accounts collection for testing //
};

/* private encryption & validation methods */

var generateSalt = function()
{
	var set = '0123456789abcdefghijklmnopqurstuvwxyzABCDEFGHIJKLMNOPQURSTUVWXYZ';
	var salt = '';
	for (var i = 0; i < 10; i++) {
		var p = Math.floor(Math.random() * set.length);
		salt += set[p];
	}
	return salt;
};

var md5 = function(str) {
	return crypto.createHash('md5').update(str).digest('hex');
};

var saltAndHash = function(pass, callback)
{
	var salt = generateSalt();
	callback(salt + md5(pass + salt));
}

var validatePassword = function(plainPass, hashedPass, callback)
{
	var salt = hashedPass.substr(0, 10);
	var validHash = salt + md5(plainPass + salt);
	callback(null, hashedPass === validHash);
}

/* auxiliary methods */

var getObjectId = function(id)
{
	return new require('mongodb').ObjectID(id);
}

var findById = function(id, callback)
{
	accounts.findOne({_id: getObjectId(id)},
		function(e, res) {
		if (e) callback(e)
		else callback(null, res)
	});
};


var findByMultipleFields = function(a, callback)
{
// this takes an array of name/val pairs to search against {fieldName : 'value'} //
	accounts.find( { $or : a } ).toArray(
		function(e, results) {
		    if (e) callback(e);
		    else callback(null, results);
	});
};

exports.findFriends = function(username, callback){
    accounts.find({user:username}).toArray(
		function(e, res) {
		    if (e) callback(e);
		    else callback(null, res);
	    });
};


exports.findBuddy = function(user_id, callback){
    accounts.findOne({_id:getObjectId(user_id)}, function(e, o){
		if (e){
			callback(e, null);
		}else{
            callback(null, o);
        }
    });
};


exports.findAllFriends = function(user_id, callback){
    accounts.findOne({_id:getObjectId(user_id)}, function(e, o){
		if (e){
			callback(e, null);
		}else{
            callback(null, o);
        }
    });
};

exports.getAccountById = function(user_id, callback){
   accounts.findOne({_id: getObjectId(user_id)}, function(e, o){
		if (e){
			callback(e, null);
		}else{
            callback(null, o);
        }
    });
};
exports.getAccountByName = function(username, callback){
   accounts.findOne({user: username}, function(e, o){
		if (e){
			callback(e, null);
		}else{
            callback(null, o);
        }
    });
};


exports.updateFriends = function(friend_name, friend_indicator, username,callback){
    console.log("friend_name, friend_indicator, username in account-manager.js", friend_name, friend_indicator, username);
    accounts.findOne({user:username}, function(e, o){
		if (e){
			callback(e, null);
		}else{
            if (friend_indicator == "true"){
                o.friends.push(friend_name);
            }else{
                console.log("delete a friend");
                for(var i = o.friends.length - 1; i>=0 ; i--){
                    if (o.friends[i] == friend_name)

                        o.friends.splice(i,1);                    
                }
            }
            accounts.save(o, {safe: true}, callback(null));
		}        
    });
};

