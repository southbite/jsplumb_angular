'use strict';

/* Services */

var ideServices = angular.module('ideServices', []);

ideServices.factory('ideHelper', function() {
	 return {
		 toPropertyNameArray:function(obj){
			 var returnArray = [];
			  for (var prop in obj)
				  returnArray.push(prop);
			  return returnArray;
		 }
	 }
});