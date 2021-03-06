define([
'async!https://maps.google.com/maps/api/js?sensor=false',
'views/BaseView',
'text!templates/BoatDayTemplate.html', 
'text!templates/SeatRequestsTableTemplate.html', 
'text!templates/ChatMessagesTableTemplate.html', 
'text!templates/QuestionsTableTemplate.html'
], function(gmaps, BaseView, BoatDayTemplate, SeatRequestsTableTemplate, ChatMessagesTableTemplate, QuestionsTableTemplate){
	var BoatDayView = BaseView.extend({

		className: "view-boatday-update",
		
		template: _.template(BoatDayTemplate),

		seatRequests: {},

		chatWall: {}, 

		questions: {}, 

		events : {

			'submit form' : 'update',
			"click .update-requests": "updateSeatRequest", 
			"click .idInfo": "alertObjectID", 
			"click .update-question": "updateQuestions", 
			"click .btn-notify-guest": "notifyGuest"
		},

		_map: null,

		_marker: null,

		render: function() {

			BaseView.prototype.render.call(this);

			this.renderSeatRequests();
			this.renderChatWall();
			this.renderQuestions();

			this.$el.find('.date').datepicker({
				startDate: '0d',
				autoclose: true
			});

			if( this.model.get('date') ) {
				this.$el.find('.date').datepicker('setDate', this.model.get('date'));

			}

			this.setupGoogleMap();

			return this;

		},

		alertObjectID: function(event) {
			event.preventDefault();
			alert($(event.currentTarget).closest('tr').attr('data-id'));
		},

		boatSelected: function() {


		}, 

		renderSeatRequests: function() {

			var self = this; 
			self.seatRequests = {};
			this.$el.find('#seatRequests').html('');

			var query = self.model.relation('seatRequests').query();
			query.include('boatday');
			query.include('profile');
			query.ascending("createdAt");
			query.find().then(function(matches){
				_.each(matches, self.appendSeatRequests, self);
			});
		}, 

		appendSeatRequests: function(SeatRequest) {
			this.$el.find('#seatRequests').append(_.template(SeatRequestsTableTemplate)({
				id: SeatRequest.id, 
				seat: SeatRequest
			}));
			this.seatRequests[SeatRequest.id] = SeatRequest;
		},

		renderChatWall: function() {

			var self = this;
			self.chatWall = {};
			this.$el.find('#chatWall').html('');

			var query = self.model.relation('chatMessages').query();
			query.include('profile');
			query.ascending("createdAt");
			query.find().then(function(matches) {
				_.each(matches, self.appendChatWall, self);
			});
		}, 

		appendChatWall: function(ChatMessages) {

			this.$el.find('#chatWall').append(_.template(ChatMessagesTableTemplate)({
				id: ChatMessages.id, 
				message: ChatMessages
			}));

			this.chatWall[chatWall.id] = ChatMessages;
		}, 

		renderQuestions: function() {

			var self = this;
			self.questions = {};
			this.$el.find("#questions").html("");

			var query = self.model.relation('questions').query();
			query.include('from');
			query.ascending('createdAt');
			query.find().then(function(matches) {
				_.each(matches, function(question) {
					self.$el.find("#questions").append(_.template(QuestionsTableTemplate)({
						id: question.id, 
						question: question
					}));
					self.questions[question.id] = question;
				});	
			});
		}, 
		
		updateSeatRequest: function(event) {

			event.preventDefault();

			var self = this;
			var parent = $(event.currentTarget).closest('tr');
			var id = parent.attr('data-id');
			var request = self.seatRequests[id];
			
			var baseSeats = request.get('seats');
			var nextSeats = parseInt(parent.find('[name="seats"]').val());

			var baseStatus = request.get('status');
			var nextStatus = parent.find('[name="status"]').val();

			self.seatRequests[parent.attr('data-id')].save({ 
				status: nextStatus,
				seats: nextSeats,
				contribution: parseInt(parent.find('[name="contribution"]').val()),
			}).then(function() {
				
				if( nextStatus === 'approved' && baseStatus !== 'approved' ) {
					self.model.increment('bookedSeats', nextSeats);
					self.model.save().then(function() {
						self.render();
					});
				} 

				if( baseStatus === 'approved' && nextStatus !== 'approved' ) {
					self.model.increment('bookedSeats', nextSeats * -1);
					self.model.save().then(function() {
						self.render();
					});
				}

				if( baseStatus === 'approved' && nextStatus === 'approved' && baseSeats !== nextSeats ) {
					self.model.increment('bookedSeats', nextSeats - baseSeats);
					self.model.save().then(function() {
						self.render();
					});
				}
			}, function(e) {
				console.log(e);
			});
			
		},

		updateQuestions: function(event) {
			event.preventDefault();

			var self = this;
			var e = $(event.currentTarget);
			var parent = e.closest('tr');

			self.questions[parent.attr('data-id')].save({
				question: parent.find('[name="question"]').val(), 
				answer: parent.find('[name="answer"]').val(), 
				"public": parent.find('[name="public"]').val() == "true", 
				status: parent.find('[name="status"]').val()
			}).then(function() {
				self.renderQuestions();
			}, function(e) {
				console.log(e);
			});
		}, 

		notifyGuest: function(event) {
			event.preventDefault();
			var self = this;

			self.model.relation('questions').query().first().then(function(matches) {

				var NotificationModel = Parse.Object.extend("Notification");
				if( confirm("Are you sure you want to send a notification ?") ) {
					new NotificationModel({
						action: "boatday-answer",
						from: self.model.get('captain'),
						to: matches.get('from'),
						boatday: self.model,
						fromTeam: false,
						sendEmail: false
					}).save().then(function() {
						alert('Notification Sent');	
					});
				}
			});
		}, 

		setupGoogleMap: function() {

			var self = this;

			var displayMap = function(latlng) {

				var opts = {
					zoom: 10,
					center: latlng
				};

				if( !self._map ) {
					
					var ctn = self.$el.find('.map').get(0);
					self._map = new google.maps.Map(ctn, opts);

					google.maps.event.addListenerOnce(self._map, "idle", function(){
						google.maps.event.trigger(self._map, 'resize');
						self._map.setCenter(latlng);
					});

					google.maps.event.addListener(self._map, 'click', function(event) {
						self.moveMarker(event.latLng)
					});

				}

				if( self.model.get('location') ) {

					self.moveMarker(new google.maps.LatLng(self.model.get('location').latitude, self.model.get('location').longitude));

				}

			};

			displayMap(new google.maps.LatLng(25.761919, -80.190225));
		},

		moveMarker: function(latlng) {

			var self = this;

			new google.maps.Geocoder().geocode({ 'latLng': latlng }, function (results, status) {
				if (status === google.maps.GeocoderStatus.OK) {
					if (results[0]) {
						var addr = results[0].formatted_address;
						self._in('locationText').val(addr.slice(0, addr.lastIndexOf(",")));
					}
				}
			});

			if( !self._marker ) {
				self._marker = new google.maps.Marker({
					map: self._map,
					draggable: true,
					animation: google.maps.Animation.DROP,
					position: latlng
				});
			} else {
				self._marker.setPosition(latlng);
			}

		},

		update: function(event) {
			
			event.preventDefault();

			var self = this;
			
			this.model.save({
				
				availableSeats: parseInt(this._in('availableSeats').val()),
				bookingPolicy: this._in('bookingPolicy').val(),
				cancellationPolicy: this._in('cancellationPolicy').val(), 
				category: this._in('category').val(), 
				date: this._in('date').datepicker('getDate'),
				departureTime: parseFloat(this._in('departureTime').val()),
				arrivalTime: parseFloat(this._in('departureTime').val()) + parseInt(this._in('duration').val()),
				description: this._in('description').val(), 
				duration: parseFloat(this._in('duration').val()),
				name: this._in('name').val(), 
				price: parseFloat(this._in('price').val()), 
				status: this._in('status').val(), 
				category: this._in('activity').val(),
				location: self._marker ? new Parse.GeoPoint({latitude: self._marker.getPosition().lat(), longitude: self._marker.getPosition().lng()}) : null,
				locationText: this._in('locationText').val(),
				bookedSeats: parseInt(this._in('bookSeats').val()), 
				earnings: parseFloat(this._in('earnings').val()),
				featured: parseInt(this._in('featured').val()), 
				displayInWebsite: Boolean(this._in('displayInWebsite').val()), 
				features: {
					leisure: {
						cruising: Boolean(this.$el.find('[name="featuresLeisureCruising"]').is(':checked')),
						partying: Boolean(this.$el.find('[name="featuresLeisurePartying"]').is(':checked')),
						sightseeing: Boolean(this.$el.find('[name="featuresLeisureSightseeing"]').is(':checked')),
						other: Boolean(this.$el.find('[name="featuresLeisureOther"]').is(':checked'))
					},
					fishing: {
						flats: Boolean(this.$el.find('[name="featuresFishingFlats"]').is(':checked')),
						lake: Boolean(this.$el.find('[name="featuresFishingLake"]').is(':checked')),
						offshore: Boolean(this.$el.find('[name="featuresFishingOffshore"]').is(':checked')),
						recreational: Boolean(this.$el.find('[name="featuresFishingRecreational"]').is(':checked')),
						other: Boolean(this.$el.find('[name="featuresFishingOther"]').is(':checked')),
						equipment: Boolean(this.$el.find('[name="featuresFishingEquipment"]').is(':checked')),
						equipmentItems: {
							bait: Boolean(this.$el.find('[name="featuresFishingEquipmentItemsBait"]').is(':checked')),
							lines: Boolean(this.$el.find('[name="featuresFishingEquipmentItemsLines"]').is(':checked')),
							hooks: Boolean(this.$el.find('[name="featuresFishingEquipmentItemsHooks"]').is(':checked')),
							lures: Boolean(this.$el.find('[name="featuresFishingEquipmentItemsLures"]').is(':checked')),
							nets: Boolean(this.$el.find('[name="featuresFishingEquipmentItemsNets"]').is(':checked')),
							rods: Boolean(this.$el.find('[name="featuresFishingEquipmentItemsRods"]').is(':checked')),
							sinkers: Boolean(this.$el.find('[name="featuresFishingEquipmentItemsSinkers"]').is(':checked'))
						}
					},
					sports: {
						snorkeling: Boolean(this.$el.find('[name="featuresSportsSnorkeling"]').is(':checked')),
						tubing: Boolean(this.$el.find('[name="featuresSportStubing"]').is(':checked')),
						wakeBoarding: Boolean(this.$el.find('[name="featuresSportsWakeBoarding"]').is(':checked')),
						waterSkiing: Boolean(this.$el.find('[name="featuresSportsWaterSkiing"]').is(':checked')),
						equipment: Boolean(this.$el.find('[name="featuresSportsEquipment"]').is(':checked')),
						equipmentItems: {
							fins: Boolean(this.$el.find('[name="featuresSportsEquipmentItemsFins"]').is(':checked')),
							helmets: Boolean(this.$el.find('[name="featuresSportsEquipmentItemsHelmets"]').is(':checked')),
							masks: Boolean(this.$el.find('[name="featuresSportsEquipmentItemsMasks"]').is(':checked')),
							snorkels: Boolean(this.$el.find('[name="featuresSportsEquipmentItemsSnorkels"]').is(':checked')),
							towLine: Boolean(this.$el.find('[name="featuresSportsEquipmentItemsTowLine"]').is(':checked')),
							tubes: Boolean(this.$el.find('[name="featuresSportsEquipmentItemsTubes"]').is(':checked')),
							wakeboard: Boolean(this.$el.find('[name="featuresSportsEquipmentItemsWakeboard"]').is(':checked')),
							waterSkis: Boolean(this.$el.find('[name="featuresSportsEquipmentItemsWaterSkis"]').is(':checked'))
						}
					},
					global: {
						children: Boolean(this.$el.find('[name="featuresGlobalChildren"]').is(':checked')),
						smoking: Boolean(this.$el.find('[name="featuresGlobalSmoking"]').is(':checked')),
						drinking: Boolean(this.$el.find('[name="featuresGlobalDrinking"]').is(':checked')),
						pets: Boolean(this.$el.find('[name="featuresGlobalPets"]').is(':checked')) 
					}, 
					extras: {
						food: Boolean(this.$el.find('[name="featuresExtrasFood"]').is(':checked')),
						drink: Boolean(this.$el.find('[name="featuresExtrasDrink"]').is(':checked')),
						music: Boolean(this.$el.find('[name="featuresExtrasMusic"]').is(':checked')),
						towels: Boolean(this.$el.find('[name="featuresExtrasTowels"]').is(':checked')),
						sunscreen: Boolean(this.$el.find('[name="featuresExtrasSunscreen"]').is(':checked')),
						inflatables: Boolean(this.$el.find('[name="featuresExtrasInflatables"]').is(':checked'))
					}
				}

			}).then(function( boatday ) {
				Parse.history.navigate('upcoming-boatdays', true);
			});

		},

	});
	return BoatDayView;
});
