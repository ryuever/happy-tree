var CT = require('./modules/country-list');
var AM = require('./modules/account-manager');
var EM = require('./modules/email-dispatcher');
var PM = require('./modules/party-manager');

module.exports = function(app) {

// main login page //

	app.get('/', function(req, res){
        console.log('in app.get /');
	    // check if the user's credentials are saved in a cookie //
        // console.log(req.cookies);
		if (req.cookies.user == undefined || req.cookies.pass == undefined){
			res.render('login', { title: 'Hello - Please Login To Your Account' });
		}	else{
	// attempt automatic login //
			AM.autoLogin(req.cookies.user, req.cookies.pass, function(o){
				if (o != null){
				    req.session.user = o;
                    // res.redirect('/home');
                    // res.redirect(o._id);
                    var loc = "/"+req.session.user._id+"/home/";
                    console.log("redirect to : ",loc );
                    res.redirect(loc);
				}	else{
					res.render('login', { title: 'Hello - Please Login To Your Account' });
				}
			});
		}
	});
	
	app.post('/', function(req, res){
        console.log('in app post /');
		AM.manualLogin(req.body['user'], req.body['pass'], function(e, o){
            console.log("menual login", req.body['user'], req.body['pass']);
			if (!o){
				res.status(400).send(e);
			}	else{
				req.session.user = o;
				if (req.body['remember-me'] == 'true'){
					res.cookie('user', o.user, { maxAge: 900000 });
					res.cookie('pass', o.pass, { maxAge: 900000 });
				}
				res.status(200).send(o);
                // res.render('home', {
				//     title : 'My Page',
				//     countries : CT,
				//     udata : req.session.user
			    // });
			}
		});
	});

    // app.get('/profile/:ido', function(req, res){
    app.get('/:id/profile/', function(req, res){
        console.log('in app.get /:id/profile/');
        if(req.session.user == null){
            res.redirect('/');
        }else {
            AM.getAccountById(req.params.id, function(err, ref_user_record){
                console.log("req.params.id", req.params.id);
                if(err){
					res.status(400).send('account not exists');
                }else{
                    AM.getAccountById(req.session.user._id, function(err, record){
                        res.render("user-profile", {
                            name : ref_user_record.name,
                            country : ref_user_record.country,
                            udata : req.session.user,
                            user_friends : record.friends,
                            ref_user : ref_user_record.name       
                        });                        
                    });
                }
            });
        }
    });
    
	// app.get('/home', function(req, res) {
	app.get('/:id/home', function(req, res) {
        console.log('in app get /:id/');
		if (req.session.user == null){
	// if user is not logged-in redirect back to login page //
			res.redirect('/');
		}	else{
			res.render('home', {
				title : 'My Page',
				countries : CT,
				udata : req.session.user
			});
		}
	});

	// app.post('/home', function(req, res){
    
	app.post('/home', function(req, res){
        console.log('in app post /:id/');
		if (req.body['user'] != undefined) {
			AM.updateAccount({
				user 	: req.body['user'],
				name 	: req.body['name'],
				email 	: req.body['email'],
				pass	: req.body['pass'],
				country : req.body['country']
			}, function(e, o){
				if (e){
					res.status(400).send('error-updating-account');
				}	else{
					req.session.user = o;
			// update the user's login cookies if they exists //
					if (req.cookies.user != undefined && req.cookies.pass != undefined){
						res.cookie('user', o.user, { maxAge: 900000 });
						res.cookie('pass', o.pass, { maxAge: 900000 });	
					}
					res.status(200).send('ok');
				}
			});
		}	else if (req.body['logout'] == 'true'){
            console.log("log out successuful new");
			res.clearCookie('user');
			res.clearCookie('pass');
			req.session.destroy(function(e){ res.status(200).send('ok'); });            
            // req.session.destroy(function(e){ res.redirect('/');});
		}
	});
	
// creating new accounts //	
	app.get('/signup', function(req, res) {
		res.render('signup', {  title: 'Signup', countries : CT });
	});
	
	app.post('/signup', function(req, res){
		AM.addNewAccount({
			name      : req.body['name'],
			email     : req.body['email'],
			user      : req.body['user'],
			pass      : req.body['pass'],
			country   : req.body['country'],
            friends   : [],
            group     : [],
            partylist : [],
            manageParty : [] 
		}, function(e){
			if (e){
				res.status(400).send(e);
			}	else{
				res.status(200).send('ok');
			}
		});
	});

// password reset //
	app.post('/lost-password', function(req, res){
	// look up the user's account via their email //
		AM.getAccountByEmail(req.body['email'], function(o){
			if (o){
				EM.dispatchResetPasswordLink(o, function(e, m){
				// this callback takes a moment to return //
				// TODO add an ajax loader to give user feedback //
					if (!e){
						res.status(200).send('ok');
					}	else{
						for (k in e) console.log('ERROR : ', k, e[k]);
						res.status(400).send('unable to dispatch password reset');
					}
				});
			}	else{
				res.status(400).send('email-not-found');
			}
		});
	});

	app.get('/reset-password', function(req, res) {
		var email = req.query["e"];
		var passH = req.query["p"];
		AM.validateResetLink(email, passH, function(e){
			if (e != 'ok'){
				res.redirect('/');
			} else{
	// save the user's email in a session instead of sending to the client //
				req.session.reset = { email:email, passHash:passH };
				res.rendere('reset', { title : 'Reset Password' });
			}
		});
	});
	
	app.post('/reset-password', function(req, res) {
		var nPass = req.body['pass'];
	// retrieve the user's email from the session to lookup their account and reset password //
		var email = req.session.reset.email;
	// destory the session immediately after retrieving the stored email //
		req.session.destroy();
		AM.updatePassword(email, nPass, function(e, o){
			if (o){
				res.status(200).send('ok');
			}	else{
				res.status(400).send('unable to update password');
			}
		});
	});
	
// view & delete accounts //
	
	app.get('/print', function(req, res) {
		AM.getAllRecords( function(e, accounts){
			res.render('print', { title : 'Account List', accts : accounts });
		});
	});
	
	app.post('/delete', function(req, res){
		AM.deleteAccount(req.body.id, function(e, obj){
			if (!e){
				res.clearCookie('user');
				res.clearCookie('pass');
				req.session.destroy(function(e){ res.status(200).send('ok'); });
			}	else{
				res.status(400).send('record not found');
			}
	    });
	});
	
	app.get('/reset', function(req, res) {
		AM.delAllRecords(function(){
			res.redirect('/print');	
		});
	});

    // app.get('/parties', function(req, res){
    app.get('/partylist', function(req, res){        
        if (req.session.user == null){
	        // if user is not logged-in redirect back to login page //
			res.redirect('/');
		}else{
            var perPage = 10, 
                page = req.query.page > 0 ? req.query.page : 1;

            // console.log("page", page);
            PM.partiesPagination(page, perPage, function(err, pages, records){       
                if (!err){
                    // console.log("parties list", records, "pages", pages, "page", page);
                    res.render("partylist",{
                        records : records,
                        totalPages  : pages,
                        currentPage   : page,
                        udata  : req.session.user
                    });
                } else {
                    res.status(400).send("no records");
                }
		    });
        }
    });

    app.get('/:id/party/supervision', function(req, res){
        if (req.session.user == null){
	        // if user is not logged-in redirect back to login page //
			res.redirect('/');
		}else{
            var perPage = 10, 
                page = req.query.page > 0 ? req.query.page : 1;
            
            AM.getAccountById(req.params.id, function(err, record){
                console.log("req.params.id", req.params.id);
                if(err){
					res.status(400).send('account not exists');
                }else{
                    var partylist = record.manageParty;
                    console.log("manage parytlist", partylist);
                    var partylists = [];
                    var pages = Math.ceil(partylist.length / perPage);
                    partylists = partylist.slice((page-1)*perPage, page*perPage);
                    console.log("manage parytlist", partylists,partylist.length, pages);
                    res.render("partylist",{
                        records     : partylists,
                        totalPages  : pages,
                        currentPage : page,
                        udata       : req.session.user
                    });
                };
            });            
        }
    });

    // app.get('/:username/party/attendance', function(req, res){
    app.get('/:id/party/attendance', function(req, res){        
        if (req.session.user == null){
	        // if user is not logged-in redirect back to login page //
			res.redirect('/');
		}else{
            var perPage = 10, 
                page = req.query.page > 0 ? req.query.page : 1;

            AM.getAccountById(req.params.id, function(err, record){
                console.log("req.params.id", req.params.id);
                if(err){
					res.status(400).send('account not exists');
                }else{
                    var partylist = record.partylist;
                    console.log("attendance parytlist", partylist);
                    var partylists = [];
                    var pages = Math.ceil(partylist.length / perPage);
                    partylists = partylist.slice((page-1)*perPage, page*perPage);
                    console.log("attendance parytlist", partylists,partylist.length, pages);
                    res.render("partylist",{
                        records     : partylists,
                        totalPages  : pages,
                        currentPage : page,
                        udata       : req.session.user
                    });
                };
            });
        }
    });    

    app.get('/party/create', function(req, res){
        if (req.session.user == null){
	        // if user is not logged-in redirect back to login page //
			res.redirect('/');
		}else{
            console.log("present party create form");
            
			res.render('party-form', {
				title : 'My Page',
				countries : CT,
				udata : req.session.user
			});
		}      
    });

    app.post('/party/create', function(req, res){
        if (req.session.user == null){
	        // if user is not logged-in redirect back to login page //
			res.redirect('/');
		}else{
            console.log("req.body", req.body);
            PM.addNewParty({
			    party_theme      : req.body['party_theme'],                
		        party_time 	     : req.body['party_time'],
                party_creat_time : req.body['party_create_time'],
                party_menu       : req.body['party_menu'],
                party_location   : req.body['party_location'],                
                party_total_fee  : req.body['party_total_fee'],
                manager          : req.session.user['user'],
                manager_id       : req.session.user['_id'],
                member           : [req.session.user['user']]
		    }, function(e, records){
			    if (e){
                    console.log("insert with error");
                    res.json({"status":"error"});
				    // res.status(400).send(e);
			    } else{
			        AM.updateAccountPartyListManageParty({                        
				        user_id     : req.session.user['_id'],
                        party_id    : records.ops[0]._id,
                        party_info  : records.ops[0]
			        }, function(e, o){
				        if (e){
					        res.status(400).send('error-updating-account');
				        }
			        });                    
                    console.log("insert success");
                    res.json({"status":"success"});
			    }
		    });
		}                

    });

    // app.get('/parties/:id', function(req, res){
    app.get('/party/:id', function(req, res){        
        if (req.session.user == null){
	        // if user is not logged-in redirect back to login page //
			res.redirect('/');
		}else{
            PM.getPartyById(req.params.id, function(e,record){
                if (!e){
                    res.render("party-show", {
                        record : record,
                        udata : req.session.user
                    });
                } else {
                    res.status(400).send("no records");
                }
		    });
        }
    });

	app.post('/party/:id', function(req, res){
        console.log('runnning in post id');
		PM.updateParty(req.params.id, {
            party_theme : req.body['party_theme'],
            party_time : req.body['party_time'],
            party_total_fee : req.body['party_total_fee'],
            party_location : req.body['party_location'],
            member         : req.body['member']            
        },function(e, record){
            console.log("update attendance", record);
			if (e){
				res.status(400).send('error-updating-party');
			}else{
                PM.getPartyById(req.params.id, function(e,record){
                    if (!e){
                        AM.updateAccountPartyListAttendance({                        
				            user_id     : req.session.user['_id'],                    
                            username    : req.session.user['name'],
                            party_info  : record,
                            operation   : req.body['operation']
			            }, function(e, o){
				            if (e){
					            res.status(400).send('error-updating-account');
				            }
			            });
                        res.json({"status":"success"});
                    } else {
                        res.status(400).send("no records");
                    }
		        });
			}
		});
	});

    
    // search for a user from search bar, the request should be
    // http://browse.renren.com/s/all?from=opensearch&q=username
    // method should be considered again.
    app.post('/friend/:name', function(req, res){
        console.log("in post /friend/:name");
        AM.findFriends(req.params.name , function(err, records){
            if(err){
                res.status(400).send(e);
            }else{
                console.log("find friends", records);
                res.render("friends", {
                    records : records,
                    udata : req.session.user
                });
            }
        });
    });

    app.get('/:id/friendlist', function(req, res){
        console.log("in post /:id/friendlist");
        AM.findAllFriends(req.params.id , function(err, record){
            if(err){
                res.status(400).send(err);
            }else{
                console.log("find friends", record);
                var friendlist = [];
                console.log("findAllFriends ", record.friends);
                console.log("findAllFriends ", record);
                for(var i =0 ; i<record.friends.length;i++){
       	            AM.getAccountByName(record.friends[i], function(e, friendRecord) {
		                if (e){
                            res.status(400).send(e);
                        } else{
                            console.log("friendrecord", friendRecord);
                            friendlist.push(friendRecord);
                        }
	                });
                }
                setTimeout(
                    function(){
                        console.log("friendlist ", friendlist);
                        res.render("friendlist", {
                            records : friendlist,
                            udata : req.session.user
                        });
                    },500);
                // while(friendlist.length != record.friends.length){
                //     // console.log("nihao", friendlist.length, record.friends.length);
                // }
            }
        });
    });

    
    app.get('/buddy/:id', function(req, res){
        // console.log("find buddies");
        console.log("userid", req.params.id);
        AM.findBuddy(req.params.id , function(err, record){
            if(err){
                res.status(400).send(e);
            }else{
                res.json({
                    status : "success",
                    record : record,
                    udata : req.session.user
                });
            }
        });
    });
    
    // app.put('/friend/update', function(req, res){
    app.put('/:id/friend/update', function(req, res){        
        AM.updateFriends(req.body.friend_name,
                         req.body.friend_indicator,
                         req.session.user.name,
                         function(err){
            if(err){
                res.json({"status":"error"});
            }else{
                res.json({"status":"success"});
            }
        });       
    });

    app.get('/shuttle', function(req, res){
        console.log("parse successful");
        // res.status(200).send('ok');
		// res.render('party-home', { title: 'Signup', countries : CT, udata : req.session.user });
        // res.render('login', { title: 'Hello - Please Login To Your Account' });
        // res.status(200).send({ title: 'Signup', udata : req.session.user });
        res.render('shuttle-bus', {
			title : 'shuttle bus',
			udata : req.session.user
		});
    });

    app.get('/shuttle/wjk', function(req, res){
        console.log("parse successful");
        // res.status(200).send('ok');
		// res.render('party-home', { title: 'Signup', countries : CT, udata : req.session.user });
        // res.render('login', { title: 'Hello - Please Login To Your Account' });
        // res.status(200).send({ title: 'Signup', udata : req.session.user });
        res.render('shuttle-bus-wjk', {
			title : 'shuttle bus',
			udata : req.session.user
		});
    });
    
    
	app.get('*', function(req, res) {
        var href = req.protocol + "://"+ req.get('Host') + req.url;
        // console.log(req.get("Host"));
        // console.log(req.url);
        
        // console.log("href " + href + "\r\n");
        res.render('404', { title: 'Page Not Found'}); });

};
