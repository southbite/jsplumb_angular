'use strict';

/**
 * Binds an element to a jsplumb instance
 */
angular.module('ui.jsPlumb', [])
  .directive('jsPlumb', ['$templateCache', function ($templateCache) {
    if (angular.isUndefined(window.jsPlumb) || angular.isUndefined(window.jsPlumb)) {//TODO what is jquery.ui 's name?
      throw new Error('We need jsPlumb to work... (o rly?)');
    }
    
  
    return {
      restrict: 'E',
      scope: {
    	  drawingData: '=',
    	  drawingEvent: '='
      },
     // template: $templateCache.get('../templates/js-plumb.html'),
      template: '<div class="demo flowchart-demo" id="{{drawingData.id}}">' + 
    	     		'<div ng-repeat="shape in drawingData.shapes" class="{{drawingData.shapeClass + shape.cssClass}}" style="{{shape.style + shape.position}}" id="{{\'flowchart\' + shape.id}}"><strong>{{shape.label}}</strong><br/><br/></div>' +              
    	     	'</div> ',
      link: function (scope, elm, attrs) {
        var options, opts, instance;

        //added toEm function courtesy of Scott Jehl (scott@filamentgroup.com)
        $.fn.toEm = function(settings){
        	settings = jQuery.extend({
        		scope: 'body'
        	}, settings);
        	var that = parseInt(this[0],10),
        		scopeTest = jQuery('<div style="display: none; font-size: 1em; margin: 0; padding:0; height: auto; line-height: 1; border:0;">&nbsp;</div>').appendTo(settings.scope),
        		scopeVal = scopeTest.height();
        	scopeTest.remove();
        	return (that / scopeVal).toFixed(8) + 'em';
        };
        
        options = scope.drawingData.config || {
        	// default drag options
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
        };
        
        opts = angular.extend({}, options, scope.$eval(attrs.jsPlumb), {Container:scope.drawingData.id});
        instance = jsPlumb.getInstance(opts);		
        
    	//
		// listen for clicks on connections, and offer to delete connections on click.
		//
		instance.bind("click", function(conn, originalEvent) {
			
			var sourceShapeId = conn.sourceId.replace('flowchart','');
			var targetShapeId = conn.targetId.replace('flowchart','');
			
			if (confirm("Delete connection from " + sourceShapeId + " to " + targetShapeId + "?"))
			{
				jsPlumb.detach(conn); 
				scope.drawingEvent("connectionDetached", [conn, sourceShapeId, targetShapeId]);
			}
				
			scope.drawingEvent("click", [conn, originalEvent]);
		});	
		
		instance.bind("connectionDrag", function(connection) {
			console.log("connection " + connection.id + " is being dragged. suspendedElement is ", connection.suspendedElement, " of type ", connection.suspendedElementType);
			
			scope.drawingEvent("connectionDrag", [connection]);
		});		
		
		instance.bind("connectionDragStop", function(connection) {
			console.log("connection " + connection.id + " was dragged");
			
			scope.drawingEvent("connectionDragStop", [connection]);
		});

		instance.bind("connectionMoved", function(params) {
			console.log("connection " + params.connection.id + " was moved");
			
			scope.drawingEvent("connectionMoved", [params]);
		});
        
		scope.drawingEvent("instanceCreated", [instance]);
		
     // this is the paint style for the connecting lines..
		var connectorPaintStyle = scope.drawingData.connectorPaintStyle || {
			lineWidth:4,
			strokeStyle:"#61B7CF",
			joinstyle:"round",
			outlineColor:"white",
			outlineWidth:2
		},
		// .. and this is the hover style. 
		connectorHoverStyle = scope.drawingData.connectorHoverStyle || {
			lineWidth:4,
			strokeStyle:"#216477",
			outlineWidth:2,
			outlineColor:"white"
		},
		endpointHoverStyle = scope.drawingData.endpointHoverStyle || {
			fillStyle:"#216477",
			strokeStyle:"#216477"
		},
		// the definition of source endpoints (the small blue ones)
		sourceEndpoint = scope.drawingData.sourceEndpoint || {
			endpoint:"Dot",
			paintStyle:{ 
				strokeStyle:"#7AB02C",
				fillStyle:"transparent",
				radius:7,
				lineWidth:3 
			},				
			isSource:true,
			connector:[ "Flowchart", { stub:[40, 60], gap:10, cornerRadius:5, alwaysRespectStubs:true } ],								                
			connectorStyle:connectorPaintStyle,
			hoverPaintStyle:endpointHoverStyle,
			connectorHoverStyle:connectorHoverStyle,
            dragOptions:{},
            overlays:[
            	[ "Label", { 
                	location:[0.5, 1.5], 
                	label:"Drag",
                	cssClass:"endpointSourceLabel" 
                } ]
            ]
		},		
		// the definition of target endpoints (will appear when the user drags a connection) 
		targetEndpoint = scope.drawingData.targetEndpoint || {
			endpoint:"Dot",					
			paintStyle:{ fillStyle:"#7AB02C",radius:11 },
			hoverPaintStyle:endpointHoverStyle,
			maxConnections:-1,
			dropOptions:{ hoverClass:"hover", activeClass:"active" },
			isTarget:true,			
            overlays:[
            	[ "Label", { location:[0.5, -0.5], label:"Drop", cssClass:"endpointTargetLabel" } ]
            ]
		},	
		// initialize our connection - wire up edited event
		initConnection = function(connection) {			
			connection.getOverlay("label").setLabel(connection.sourceId.substring(15) + "-" + connection.targetId.substring(15));
			connection.bind("editCompleted", function(o) {
				if (typeof console != "undefined")
					scope.drawingEvent("connectionEdited", [connection, o.path]);
			});
			scope.drawingEvent("connectionInitialized", [connection]);
		},
		
		initShape = function(shapeElement) {
			shapeElement.draggable(
			{
				stop: function( event, ui ) {
					 var offset = $(this).offset();
					    var xPos = offset.left;
					    var yPos = offset.top;
					    var position = 'top:' + $(yPos).toEm() + ';left:' + $(xPos).toEm();
					    console.log(position);
					    scope.drawingEvent("shapeMoved", [$(this), position]);
				},
			    drag: function(){
				    instance.repaint($(this)); // (or) jsPlumb.repaintEverything(); to repaint the connections and endpoints
			    }
			});
		};

		var _addEndpoints = function(toId, sourceAnchors, targetAnchors) {
				for (var i = 0; i < sourceAnchors.length; i++) {
					var sourceUUID = toId + sourceAnchors[i];
					instance.addEndpoint("flowchart" + toId, sourceEndpoint, { anchor:sourceAnchors[i], uuid:sourceUUID });						
				}
				for (var j = 0; j < targetAnchors.length; j++) {
					var targetUUID = toId + targetAnchors[j];
					instance.addEndpoint("flowchart" + toId, targetEndpoint, { anchor:targetAnchors[j], uuid:targetUUID });						
				}
			};

		scope.drawingEvent("functionsPrepared", []);
		var loadedComplete = false;
		
		scope.$watch(
				//we are watching the container html
			    function () { return document.getElementById(scope.drawingData.id).innerHTML},  
			    function(newval, oldval){
			       
			        var shapes = $(document.getElementById(scope.drawingData.id)).find('.' + scope.drawingData.shapeClass);

			        //we check if the drawing hasn't been loaded yet, and we have the right amount of shapes in the html (ng-repeat is done)
			        if (shapes != null && shapes.length == scope.drawingData.shapes.length && !loadedComplete)
			        {
			        	 // suspend drawing and initialise.
			        	instance.doWhileSuspended(function() {

							//connect all the shapes
							scope.drawingData.shapes.map(function(currentShape, arrInex, arr){
								var currentShapeElement = $('#flowchart' + currentShape.id);
								_addEndpoints(currentShape.id, currentShape.sourceEndPoints, currentShape.targetEndPoints);
								initShape(currentShapeElement);
							});
							
							// listen for new connections; initialise them the same way we initialise the connections at startup.
							instance.bind("connection", function(connInfo, originalEvent) { 
								initConnection(connInfo.connection);
							});			
							
							// link all connections to the current scopes shapes
							scope.drawingData.connections.map(function(currentConnection, arrIndex, arr){
								instance.connect(currentConnection);
							});
							
						});
				    	
				        loadedComplete = true;
			        }
					
			    }, true);
      }
    };
  }]);