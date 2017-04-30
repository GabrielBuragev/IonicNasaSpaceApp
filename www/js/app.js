(function() {

    var app = angular.module('MongoBay', ['ionic', 'ngResource', 'ngCordova']);
    var backend = 'http://192.168.100.18:8080/';
    /**
     * Controllers
     */
    app.controller('MainController', function($scope, $rootScope, $log, $cordovaGeolocation, BeachesService, $cordovaCamera) {
        $rootScope.title = 'Let\'s go to the Beach!';
        $scope.beaches = [];
        $scope.beachesLoaded = false;

        $cordovaGeolocation.getCurrentPosition().then(function(data) {

            if (BeachesService.nearByBeaches.length === 0) {

                BeachesService.getBeaches({
                    lat: data.coords.latitude,
                    long: data.coords.longitude
                }).then(function(data) {
                    data.forEach(function(e, i) {
                        e.index = i;
                        BeachesService.nearByBeaches.push(e);
                    });
                    $scope.beaches = BeachesService.nearByBeaches;
                    $scope.beachesLoaded = true;
                    BeachesService.beaches = $scope.beaches;
                });
            } else {
                $scope.beaches = BeachesService.nearByBeaches;
                $scope.beachesLoaded = true;
            }

        });

        $scope.searchInput = '';

        /**
         * Camera
         */
        $scope.camera = function() {
            // console.log(Camera);
            console.log(navigator);
            var options = {
                destinationType: navigator.camera.DATA_URL,
                sourceType: navigator.camera.PictureSourceType.CAMERA,
                allowEdit: true,
                encodingType: navigator.camera.EncodingType.JPEG,
                popoverOptions: navigator.camera.PopoverArrowDirection.ARROW_UP,
                saveToPhotoAlbum: false,
                correctOrientation: true
            };

            $cordovaCamera.getPicture(options).then(function(imgData) {
                console.log(imgData);
                console.log('got Picture');
            });

        };

        /**
         * Search
         */
        $scope.search = function() {

            if ($scope.searchInput.length === 0) {
                $scope.beaches = BeachesService.nearByBeaches;
                return;
            }

            BeachesService.getBeaches({
                query: $scope.searchInput
            }).then(function(data) {

                BeachesService.citySearchBeaches = [];
                data.forEach(function(e, i) {
                    e.index = i;
                    BeachesService.citySearchBeaches.push(e);
                });

                $scope.beaches = BeachesService.citySearchBeaches;
                $scope.beachesLoaded = true;
                console.log($scope.beaches);
                console.log($scope.beachesLoaded);
                BeachesService.beaches = $scope.beaches;
            });

        };

    });
    app.controller('BeachController', function($scope, $rootScope, $state, $stateParams, $log, BeachesService, WeatherService) {

        var id = parseInt($stateParams.id);

        if (BeachesService.beaches.length === 0) {
            console.log('2');
            return $state.go('main');
        }

        $rootScope.title = BeachesService.beaches[id].name;

        var latLng = new google.maps.LatLng(BeachesService.beaches[id].location.latitude, BeachesService.beaches[id].location.longtitude);
        console.log(latLng);

        var mapOptions = {
            center: latLng,
            zoom: 15,
            mapTypeId: google.maps.MapTypeId.ROADMAP
        };

        $scope.map = new google.maps.Map(document.getElementById("map"), mapOptions);


        google.maps.event.addListenerOnce($scope.map, 'idle', function() {

            var marker = new google.maps.Marker({
                map: $scope.map,
                animation: google.maps.Animation.DROP,
                position: latLng
            });

            var infoWindow = new google.maps.InfoWindow({
                content: BeachesService.beaches[id].name
            });

            google.maps.event.addListener(marker, 'click', function() {
                infoWindow.open($scope.map, marker);
            });

        });

        $scope.weather = [];
        WeatherService.getWeather(BeachesService.beaches[id].location.latitude, BeachesService.beaches[id].location.longtitude).then(function(data) {
            $scope.weather = data;
            // console.log($scope.weather)
            console.log($scope.weather);
        });

    });
    /**
     * Services
     */
    app.service('BeachesService', function($resource, $q) {

        this.beaches = [];
        this.nearByBeaches = [];
        this.citySearchBeaches = [];

        this.getBeaches = function(params) {
            var d = $q.defer();

            var Request = $resource(backend + 'getBeaches');

            Request.query(params, function(data) {
                if (data.length > 0) {
                    d.resolve(data);
                } else {
                    d.reject();
                }
            });

            return d.promise;
        };

    });

    app.service('WeatherService', function($resource) {

        this.getWeather = function(lat, long) {

            var Request = $resource(backend + 'getWeather');

            return Request.get({
                lat: lat,
                long: long
            }).$promise;

        };

    });

    /**
     * Routes
     */
    app.run(function($ionicPlatform) {
            $ionicPlatform.ready(function() {
                // When the website is loaded
            });
        })
        .config(function($stateProvider, $urlRouterProvider) {
            $stateProvider
                .state('main', {
                    url: '/',
                    templateUrl: 'templates/main.template.html',
                    controller: 'MainController'
                })
                .state('beach', {
                    url: '/beach/:id',
                    templateUrl: 'templates/beach.template.html',
                    controller: 'BeachController'
                });
            $urlRouterProvider.otherwise('/');
        });

}).call(this);