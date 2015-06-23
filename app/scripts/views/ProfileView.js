define([
'views/BaseView',
'text!templates/ProfileTemplate.html'

], function(BaseView, ProfileTemplate){
	var ProfileView = BaseView.extend({

		className: "view-profile",
		
		template: _.template(ProfileTemplate),

		events : {
			"submit form" : "update",
			"click .delete-picture": 'deleteProfilePicture'
		},

		deleteProfilePicture: function() {

			alert("still to do to remove profile picture");
		}, 

		update: function(event) {
			
			event.preventDefault();

			var data = {
				
				displayName: this._in('displayName').val(), 
				about: this._in('about').val(), 
				status: this._in('status').val(), 
				//url: profile.get('profilePicture') ? profile.get('profilePicture') : ''
				//profilePicture: profile.get('profilePicture') ? profile.get('profilePicture') : ''
			};
			
			var profileUpdateSuccess = function( profile ) {

				Parse.history.navigate('profiles', true);

			};

			this.model.save(data).then(profileUpdateSuccess);

		}

	});
	return ProfileView;
});
