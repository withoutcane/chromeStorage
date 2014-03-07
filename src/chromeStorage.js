(function(window, angular, undefined) {
    angular.module("chromeStorage", [])
        .factory("chromeStorage", ['$parse', '$cookieStore', "$q", '$window',
            function($parse, $cookieStore, $q, $window) {
                var _localstorage = (typeof $window.localStorage === 'undefined') ? undefined : $window.localStorage;
                var _chromestorage = (typeof chrome.storage === 'undefined') ? undefined : chrome.storage;
                var supported = {};
                supported.local = typeof _localstorage !== 'undefined';
                supported.chrome = typeof _chromestorage !== 'undefined';

                var defaultOptions = {
                    defaultValue: '',
                    storeName: '',
                    storage: "chrome",
                    area: "local"
                };

                var settings = {
                    storage: "chrome",
                    area: "sync"
                };

                var parseValue = function(res) {
                    var val;
                    try {
                        val = angular.fromJson(res);
                        if (typeof val === 'undefined') {
                            val = res;
                        }
                        if (val === 'true') {
                            val = true;
                        }
                        if (val === 'false') {
                            val = false;
                        }
                        if ($window.parseFloat(val) === val && !angular.isObject(val)) {
                            val = $window.parseFloat(val);
                        }
                    } catch (e) {
                        val = res;
                    }
                    return val;
                }

                var cookieStorage = {
                    set: function($scope, key, value) {
                        var defered = $q.defer();
                        try {
                            $cookieStore.put(key, value);
                            defered.resolve(value);
                        } catch (e) {
                            $log.log('Local Storage not supported, make sure you have angular-cookies enabled.');
                            defered.reject();
                        }
                        return defered.promise;
                    },
                    get: function($scope, key, value) {
                        var defered = $q.defer();
                        try {
                            var value = privateMethods.parseValue($.cookie(key));
                            defered.resolve(value);
                        } catch (e) {
                            defered.reject();
                        }
                        return defered.promise;
                    },
                    remove: function($scope, key) {
                        var defered = $q.defer();
                        try {
                            $cookieStore.remove(key);
                            defered.resolve(true);
                        } catch (e) {
                            defered.reject(false);
                        }
                        return defered.promise;
                    },
                    clear: function($scope) {
                        var defered = $q.defer();
                        defered.resolve();
                        return defered.promise;
                    }
                }

                var chromeStorage = {
                    get: function($scope, key ,opts) {
                        var defered = $q.defer();
                        console.log(key);
                        _chromestorage[opts.area].get(key, function(data) {
                            defered.resolve(parseValue(data[key]));
                        });
                        return defered.promise;
                    },
                    set: function($scope, key, value ,opts) {
                        var defered = $q.defer();
                        var target = {};
                        target[key] = angular.toJson(value);
                        _chromestorage[opts.area].set(target, function(data) {
                            defered.resolve(data);
                        });
                        return defered.promise;
                    },
                    remove: function($scope, key,opts) {
                        var defered = $q.defer();
                        _chromestorage[opts.area].remove(key, function(data) {
                            defered.resolve(data);
                        });
                        return defered.promise;
                    },
                    clear: function($scope ,opts) {
                        var defered = $q.defer();
                        _chromestorage[opts.area].clear(function(data) {
                            defered.resolve(data);
                        });
                        return defered.promise;
                    }
                };

                var localStorage = {
                    get: function($scope, key) {
                        var defered = $q.defer();
                        defered.resolve(parseValue(_localstorage.getItem(key)));

                        return defered.promise;
                    },
                    set: function($scope, key, value) {
                        var defered = $q.defer();
                        var saver = angular.toJson(value);
                        defered.resolve(_localstorage.setItem(key, saver));

                        return defered.promise;
                    },
                    remove: function($scope, key) {
                        var defered = $q.defer();
                        defered.resolve(_localstorage.removeItem(key));

                        return defered.promise;
                    },
                    clearAll: function($scope) {
                        var defered = $q.defer();
                        defered.resolve(_localstorage.clear());

                        return defered.promise;
                    }
                };

                var storage = {
                    chrome: chromeStorage,
                    local: localStorage,
                    cookie: cookieStorage
                };

                var optsInit = function(opts) {
                    // Backwards compatibility with old defaultValue string
                    if (angular.isString(opts)) {
                        opts = angular.extend({}, defaultOptions, {
                            defaultValue: opts
                        });
                    } else {
                        // If no defined options we use defaults otherwise extend defaults
                        opts = (angular.isUndefined(opts)) ? defaultOptions : angular.extend(defaultOptions, opts);
                    }
                    if (!supported[opts.storage]) {
                        if (supported.local) {
                            opts.storage = "local";
                        } else {
                            opts.storage = "cookie";
                        }
                    }
                    if (opts.storage == "chrome") {
                        if (!["local", "sync"].indexOf(opts.area)) opts.area = "local";
                    } else {
                        opts.area = "local";
                    }
                    return opts;
                }

                var publicMethods = {
                    get: function($scope, key, opts) {
                        opts = optsInit(opts);
                        var promise = storage[opts.storage].get($scope, key ,opts);
                        return promise;
                    },
                    set: function($scope, key, value, opts) {
                        opts = optsInit(opts);
                        var promise = storage[opts.storage].set($scope, key, value　,opts);
                        return promise;
                    },
                    remove: function($scope, key, opts) {
                        opts = optsInit(opts);
                        var promise = storage[opts.storage].remove($scope, key,opts);
                        return promise;
                    },
                    clearAll: function($scope, opts) {
                        opts = optsInit(opts);
                        var promise = storage[opts.storage].clear($scope,opts);
                        return promise;
                    },
                    bind: function($scope, key, opts) {
                        opts = optsInit(opts);

                        // Set the storeName key for the localStorage entry
                        // use user defined in specified
                        var storeName = opts.storeName || key;

                        // If a value doesn't already exist store it as is                    
                        // if (!publicMethods.get(storeName)) {
                        //     publicMethods.set(storeName, opts.defaultValue);
                        // }
                        var getpromise = publicMethods.get($scope, storeName, opts)
                            .then(function(data) {
                                if (!data) {
                                    publicMethods.set(storeName, opts.defaultValue, opts);
                                    return opts.defaultValue;
                                }
                                return data;
                            }).then(function(data) {
                                $parse(key).assign($scope, data);
                                return data;
                            }).then(function(data) {
                                $scope.$watch(key, function(val) {
                                    if (angular.isDefined(val)) {
                                        publicMethods.set($scope, storeName, val, opts);
                                    }
                                }, true);
                                return data;
                            });

                        // Register a listener for changes on the $scope value
                        // to update the localStorage value

                        return getpromise;
                    },
                    unbind: function($scope, key, storeName, opts) {
                        opts = optsInit(opts);
                        storeName = storeName || key;
                        $parse(key).assign($scope, null);
                        $scope.$watch(key, function() {});
                        publicMethods.remove(storeName, opts);
                    }
                }

                return publicMethods;

            }
        ]);
})(window, window.angular);
