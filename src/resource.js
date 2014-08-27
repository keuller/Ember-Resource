"use strict";

(function(Ember) {
	
Ember.Resource = Ember.Object.extend({ 
	url: "",
	token: "",

	__parseArgs: function() {
	    var settings = {};
	    if (arguments.length === 1) {
		    if (typeof arguments[0] === "string") {
		        settings.url = arguments[0];
		    } else {
		        settings = arguments[0];
		    }
	    } else if (arguments.length === 2) {
	    	settings = arguments[1];
	    	settings.url = arguments[0];
	    }
	    if (settings.success || settings.error) {
	    	throw new Ember.Error("ajax should use promises, received 'success' or 'error' callback");
	    }
	    var _token = this.token;
	    if (_token !== '') {
	    	settings.beforeSend = function (request) {
				request.setRequestHeader("Authorization", _token);
            };
	    }
	    return settings;
	},
	
	request: function(options) {
		options = options || {};
		var _token = this.token;
		var _contentType = options.contentType || 'application/x-www-form-urlencoded';
		return this.raw.apply(this, [options.url, { 
				type: options.type,
				data: options.data,
				contentType: _contentType
			}]).then(function(result) {
			return result.response;
		}, null, 'resource: dynamic ajax response');
	},

	fetch: function(type) {
	    return this.raw.apply(this, [this.url]).then(function(result) {
	    	var list = Ember.A();
	    	result.response.forEach(function(item) {
	    		if (type) {
	    			list.pushObject(type.create(item));
	    		} else {
	    			list.pushObject(Em.Object.create(item));
	    		}
	    	});
	    	return list;
	    }, null, 'resource: unwrap raw ajax response');
	},
	
	get: function(code) {
		return this.raw.apply(this, [this.url + '/' + code]).then(function(result) {
			return Em.Object.create(result.response);
		}, null, 'resource: raw ajax response');
	},

	save: function(obj) {
		var hash = JSON.stringify(obj);
		return this.raw.apply(this, [this.url, { type: 'POST', data: hash, dataType: 'json', contentType:'application/json' }]).then(function(result) {
			return result.response;
		}, null, 'resource: raw ajax response');
	},

	update: function(obj) {
		var hash = JSON.stringify(obj);
		var _data = JSON.parse(hash);
		return this.raw.apply(this, [this.url + '/' + _data.id, { type: 'PUT', data: hash, dataType: 'json', contentType:'application/json' }]).then(function(result) {
			return result.response;
		}, null, 'resource: raw ajax response');
	},

	remove: function(code, callback) {
		return this.raw.apply(this, [this.url + '/' + code, { type: 'DELETE' }]).then(function(result) {
			callback(result.response);
		}, null, 'resource: raw ajax response');
	},

	raw: function() {
    	return this.__doRequest(this.__parseArgs.apply(this, arguments));
	},

	defineFixture: function(url, fixture) {
	    if (fixture.response) {
	        fixture.response = JSON.parse(JSON.stringify(fixture.response));
	    }
	  	this.__fixtures__[url] = fixture;
	},

	lookupFixture: function(url) {
    	return this.__fixtures__ && this.__fixtures__[url];
	},

	__fixtures__: {
	},

	__doRequest: function(settings) {
		var self = this;
	    return new Ember.RSVP.Promise(function(resolve, reject) {
		    var fixture = self.lookupFixture(self.url);
		    if (fixture) {
		        if (fixture.textStatus === 'success' || fixture.textStatus == null) {
		        	return Ember.run(null, resolve, fixture);
		        } else {
		        	return Ember.run(null, reject, fixture);
		        }
		    }
		    settings.success = self.__success(resolve);
		    settings.error = self.__error(reject);
		    Ember.$.ajax(settings);
	    }, 'ic-ajax: ' + (settings.type || 'GET') + ' to ' + settings.url);
	},

	__success: function(resolve) {
	    return function(response, textStatus, jqXHR) {
		    Ember.run(null, resolve, {
		        response: response,
		        textStatus: textStatus,
		        jqXHR: jqXHR
		    });
	    };
	},

	__error: function(reject) {
	    return function(jqXHR, textStatus, errorThrown) {
		    Ember.run(null, reject, {
		        jqXHR: jqXHR,
		        textStatus: textStatus,
		        errorThrown: errorThrown
		    });
	    };
	}
});

})(Ember);
