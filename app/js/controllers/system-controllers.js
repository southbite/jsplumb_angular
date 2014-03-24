'use strict';

ideControllers.controller('BaseController', ['$scope', '$modal', '$log', '$sce', 'AppSession', function($scope, $modal, $log, $sce, AppSession) {

	  $scope.data = {};
	
	  $scope.openModal = function (templatePath, controller, handler, args) {
		    var modalInstance = $modal.open({
		      templateUrl: templatePath,
		      controller: controller,
		      resolve: {
		        data: function () {
		          return $scope.data;
		        },
		        args: function () {
		          return args;
		        }
		      }
		    });

      if (handler)
    	  modalInstance.result.then(handler.saved, handler.dismissed);
	 };
		  
	 $scope.openNewModal = function (type, action) {
		 
		 var handler = {
				 saved:function(result){
					 $scope.selected = selectedItem;
				 },
				 dismissed:function(){
					 $log.info('Modal dismissed at: ' + new Date());
				 }
		 };
		 
		 return $scope.openModal('../templates/' + action + '.html', action.toString(), handler);
	 };
	 
	 $scope.to_trusted = function(html_code) {
		  return $sce.trustAsHtml(html_code);
	 };
	 
	 $scope.toArray = function(items){
		  var returnArray = [];
		  for (var item in items)
			  returnArray.push(item);
		  return returnArray;
	  };
	  
}]);

ideControllers.controller('FlowchartController', ['$scope', 'AppSession', function($scope, AppSession) {
	
	$scope.drawingEvent = function(event, params){
		
		console.log('drawing event happened ' + event);
		console.log(params);
		
	}
	
	$scope.drawing = {
		id:'drawing1',
		styles:{
		},
		shapeClass:'window',
		shapes:[
			{id:'Window1', 
			 label:'Shape 1', 
			 icon:'', 
			 sourceEndPoints:["LeftMiddle", "RightMiddle"], 
			 targetEndPoints:["TopCenter", "BottomCenter"], 
			 cssClass:"",
			 style:"",
			 position:"top:34em;left:5em"},
			{id:'Window2', 
			 label:'Shape 2', 
			 icon:'', 
			 sourceEndPoints:["LeftMiddle", "BottomCenter"], 
			 targetEndPoints:["TopCenter", "RightMiddle"], 
			 cssClass:"",
			 style:"",
			 position:"top:7em; left:36em;"},
			{id:'Window3', 
			 label:'Shape 3', 
			 icon:'', 
			 sourceEndPoints:["RightMiddle", "BottomCenter"], 
			 targetEndPoints:["LeftMiddle", "TopCenter"], 
			 cssClass:"",
			 style:"",
			 position:"top:27em;left:48em;"},
			{id:'Window4', 
			 label:'Shape 4', 
			 icon:'', 
			 sourceEndPoints:["TopCenter", "BottomCenter"], 
			 targetEndPoints:["LeftMiddle", "RightMiddle"], 
			 cssClass:"",
			 style:"",
			 position:"top:23em; left:22em;"}
		],
		connections:[
			{uuids:["Window2BottomCenter", "Window3TopCenter"], editable:true},
			{uuids:["Window2LeftMiddle", "Window4LeftMiddle"], editable:true},
			{uuids:["Window4TopCenter", "Window4RightMiddle"], editable:true},
			{uuids:["Window3RightMiddle", "Window2RightMiddle"], editable:true},
			{uuids:["Window4BottomCenter", "Window1TopCenter"], editable:true},
			{uuids:["Window3BottomCenter", "Window1BottomCenter"], editable:true}
		],
		config:{
			DragOptions : { cursor: 'pointer', zIndex:2000 },
			// the overlays to decorate each connection with.  note that the label overlay uses a function to generate the label text; in this
			// case it returns the 'labelText' member that we set on each connection in the 'init' method below.
			ConnectionOverlays : [
				[ "Arrow", { location:1 } ],
				[ "Label", { 
					location:0.1,
					id:"label",
					cssClass:"aLabel"
				}]
			]
		}
	};

}]);

ideControllers.controller('ContentController', ['$scope', '$modal', '$log', 'dataService', 'AppSession', function($scope, $modal, $log, dataService, AppSession) {
	
	  $scope.action_selected = function(action){
		  action.handler();
	  };
	  
	  $scope.$on('editItemSelected', function(event, args) {
		  dataService.traverse($scope.data, args.path, function(e, node){
			  if (!e){
				  $scope.editData = node;
				  $scope.templatePath = '../templates/' + args.meta.type + '_edit.html';
				  $scope.eventArgs = args;
			  }else{
				  //TODO error handling?
				  throw e;
			  }
			  
		  });
	  });
	  
	  $scope.$on('editor_loaded', function(event, args) {
		  
		  $scope.actions = [];
		  $scope.actions_display = "none";
		 
		  if (event.targetScope.actions != null && event.targetScope.actions.length > 0)
		  {
			  $scope.actions = event.targetScope.actions;
			  $scope.actions_display = "inline";
		  }
	  });
	  
	  
	  /*
	  $scope.$on('$includeContentLoaded', function(event) {
			 console.log('$includeContentLoaded');
			 console.log(event);
			 console.log(event.targetScope);
			 console.log($scope);
			 $scope.actions = event.targetScope.actions;
			 
			 console.log('$scope.actions');
			 console.log($scope.actions);
	  });
	  */
}]);


ideControllers.controller('ModalContentController', ['$scope', '$modal', '$log', 'dataService', 'AppSession', function($scope, $modal, $log, dataService, AppSession) {
	
	  dataService.init(AppSession.firebaseURL);
	  dataService.setToScope($scope, 'data');
	
	  $scope.open = function (type, action) {

	    var modalInstance = $modal.open({
	      templateUrl: '../templates/' + action + '.html',
	      controller: action.toString(),
	      resolve: {
	        data: function () {
	          return $scope.data;
	        }
	      }
	    });

	    modalInstance.result.then(function (selectedItem) {
	      $scope.selected = selectedItem;
	    }, function () {
	      $log.info('Modal dismissed at: ' + new Date());
	    });
	  };
	}]);

