define([
	'views/HomeView',
	'views/DashboardView',
	'views/BoatDaysView', 
	'views/BoatDayView',
	'views/HostsView', 
	'views/HostView',
	'views/ProfilesView', 
	'views/ProfileView',
	'views/BoatsView', 
	'views/BoatView', 
	'views/SendNotificationView'
], function(HomeView, DashboardView, BoatDaysView, BoatDayView, HostsView, HostView, ProfilesView, ProfileView, BoatsView, BoatView, SendNotificationView) {
	
	var AppRouter = Parse.Router.extend({

		routes: {
			
			'boatdays': 'showBoatDaysView',
			'boatday/:boatdayid': 'showBoatDayView', 
			'hosts': 'showHostsView',
			'host/:hostid': 'showHostView', 
			'profiles': 'showProfilesView',
			'profile/:profileid': 'showProfileView', 
			'boats': 'showBoatsView',
			'boat/:boatid': 'showBoatView',

			'home': 'showHomeView',
			'sign-out': 'signOut',
			'send-notification': 'showSendNotificationView', 
			'*actions': 'showDashboardView'
		},

		showHomeView: function() {
			this.render(new HomeView());
		},

		signOut: function() {
			Parse.User.logOut();
			this.showHomeView();
		},

		showBoatDaysView: function() {
			
			// var self = this;
			// var cb = function() {
			// 	self.render(new BoatDaysView());
			// };

			// self.handleAdminAndSignUp(cb);
			this.render(new BoatDaysView());

		}, 

		showHostsView: function() {

			this.render(new HostsView());

		}, 

		showProfilesView: function() {
			this.render(new ProfilesView());
		},

		showBoatsView: function() {

			// var self = this;
			// var cb = function() {
				
			// 	self.render(new BoatsView());

			// };

			// self.handleAdminAndSignUp(cb);
			this.render(new BoatsView());
		},

		showSendNotificationView: function() {

			var NotificationModel = Parse.Object.extend('Notification');
			this.render(new SendNotificationView({ model: new NotificationModel() }));

		}, 

		showProfileView: function( profileid ) {
			
			var self = this;
			var profileQuerySuccess = function( profile ) {

				self.render(new ProfileView({ model: profile }));

			};

			new Parse.Query(Parse.Object.extend('Profile')).get(profileid).then(profileQuerySuccess);


			// var cb = function() {

			// 	var profileQuerySuccess = function( profile ) {

			// 		self.render(new ProfileView({ model: profile }));

			// 	};

			// 	new Parse.Query(Parse.Object.extend('Profile')).get(profileid).then(profileQuerySuccess);

			// };

			// this.handleAdminAndSignUp(cb);

		},

		showHostView: function( hostid ) {
			var self = this;
			var hostQuerySuccess = function( host ) {

					self.render(new HostView({ model: host }));

			};

			new Parse.Query(Parse.Object.extend('Host')).get(hostid).then(hostQuerySuccess);

			// var self = this;
			// var cb = function() {

			// 	var hostQuerySuccess = function( host ) {

			// 		self.render(new HostView({ model: host }));

			// 	};

			// 	new Parse.Query(Parse.Object.extend('Host')).get(hostid).then(hostQuerySuccess);
			// };

			// this.handleAdminAndSignUp(cb);

		},

		showBoatDayView: function( boatdayid ) {

			var self = this;
			var boatdayQuerySuccess = function( boatday ) {

				self.render(new BoatDayView({ model: boatday }));
			};

			new Parse.Query(Parse.Object.extend('BoatDay')).get(boatdayid).then(boatdayQuerySuccess);
			// var cb = function() {

			// 	var boatdayQuerySuccess = function( boatday ) {

			// 		self.render(new BoatDayView({ model: boatday }));
			// 	};

			// 	new Parse.Query(Parse.Object.extend('BoatDay')).get(boatdayid).then(boatdayQuerySuccess);
			// };

			// this.handleAdminAndSignUp(cb);

		},

		showBoatView: function( boatid ) {

			var self = this;

			var boatQuerySuccess = function( boat ) {

				self.render(new BoatView({ model: boat }));
			};
			new Parse.Query(Parse.Object.extend('Boat')).get(boatid).then(boatQuerySuccess);
			// var cb = function() {

			// 	var boatQuerySuccess = function( boat ) {

			// 		self.render(new BoatView({ model: boat }));
			// 	};

			// 	new Parse.Query(Parse.Object.extend('Boat')).get(boatid).then(boatQuerySuccess);

			// };

			// this.handleAdminAndSignUp(cb);

		},

		showDashboardView: function() {
			this.render(new DashboardView());
			// var self = this;
			// var cb = function() {
				
			// 	self.render(new DashboardView());

			// };

			// this.handleAdminAndSignUp(cb);

		},

		handleAdminAndSignUp: function( cb ) {

			if( !Parse.User.current() ) {
				
				this.showHomeView();
				return ;

			} else {
				
				cb();

			}

		},

		render: function(view) {

			if(this.currentView != null) {

				this.currentView.teardown();

			}

			$("#app").html( view.render().el );

			view.afterRender();
			
			this.currentView = view;
			
		}
		
	});
	return AppRouter;
});
