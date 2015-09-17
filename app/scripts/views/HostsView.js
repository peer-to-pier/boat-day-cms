define([
'views/BaseView',
'text!templates/HostsTemplate.html', 
'text!templates/HostsRowTemplate.html'
], function(BaseView, HostsTemplate, HostsRowTemplate){
	var HostsView = BaseView.extend({

		className: "view-hosts-lists",
		
		template: _.template(HostsTemplate),

		events : {
			"blur .searchFilter": "renderRows",
			"keyup .searchFilter": "watchForReturn",
			"click .idInfo": "alertObjectID"
		},

		render: function() {

			BaseView.prototype.render.call(this);
			this.renderRows();
			
			return this;

		},

		alertObjectID: function(event) {
			event.preventDefault();
			alert($(event.currentTarget).closest('tr').attr('data-id'));
		}, 

		renderRows: function() {

			var self = this;
			var query = new Parse.Query(Parse.Object.extend("Host"));
			query.include("user");
			var tpl = _.template(HostsRowTemplate);

			if( this._in("searchobjectId").val() != "" ) {
				query.contains("objectId", this._in("searchobjectId").val());
			}

			if( this._in("searchFirstName").val() != "" ) {
				query.contains("firstname", this._in("searchFirstName").val());
			}

			if( this._in("searchLastName").val() != "" ) {
				query.contains("lastname", this._in("searchLastName").val());
			}

			if( this._in("searchPhone").val() != "" ) {
				query.notEqualTo("phone", this._in("searchPhone").val());
			}

			if( this._in("searchStatus").val() != "" ) {
				query.contains("status", this._in("searchStatus").val());
			} else {
				query.notEqualTo("status", 'creation');
			}

			if( this._in("searchType").val() != "" ) {
				query.contains("type", this._in("searchType").val());
			}

			this.$el.find('tbody').html("");

			var cbSuccess = function(hosts) {

				_.each(hosts, function(host) {
					
					var data = {
						id: host.id, 
						firstname: host.get('firstname'),
						lastname: host.get('lastname'),
						phone: host.get('phone'), 
						status: host.get('status'), 
						type: host.get('type'),
						profile: host.get('profile'),
						email: host.get('user').get('email') 
					}

					self.$el.find('tbody').append( tpl(data) );

				});

			};

			query.find().then(cbSuccess);
		}
		
	});
	return HostsView;
});
