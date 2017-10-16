"use strict";

var config = {
	cytoscape: {
		defaultStyle: "cose-bilkent",
		styles: ["circle", "grid", "breadthfirst", "cose"]
	},
	dom: {
		canvasContainer: ".containerCanvas",
		mapContainerId: "map",
		content: {
			container: ".containerContent",
			heading: ".containerContent .page-header h1",
			body: ".containerContent .page-content"
		},
		sidebar: ".sidebar",
		links: {
			json: ".changeJson",
			home: ".home",
			style: ".styleSettings",
			graph: ".navbar .shoWExplorer",
			scenario: ".scenarioSetting",
			map: ".showMap",
			download: ".navbar .downloadJson",
			nodeSettings: ".nodeSettings"
		},
		modal: {
			container: ".modal",
			backdrop: ".modal-backdrop",
			heading: ".modal .modal-header h3",
			body: ".modal .modal-body"
		}
	},
	markerSettings: {
		src: "css/images/marker-icon-2x.png",
		width: 25,
		height: 41
	}
};
"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var CyptoScape = function () {
  function CyptoScape(selector) {
    var _this = this;

    _classCallCheck(this, CyptoScape);

    this.cy = null;

    this.init(selector);
    this.registerEvents();
    this.autoLayout = localStorage.getItem("autoLayout") ? localStorage.getItem("autoLayout") : globals.autoLayout;

    // debug
    window.cy = function () {
      return _this.cy;
    };
  }

  _createClass(CyptoScape, [{
    key: "init",
    value: function init(selector) {
      this.cy = cytoscape({
        container: $(selector),

        layout: {},
        style: [{
          selector: "node",
          style: {
            "content": "data(id)",
            "text-opacity": 0.7
          }
        }, {
          selector: "edge",
          style: {
            "target-arrow-shape": "triangle",
            "line-color": "#9dbaea",
            "target-arrow-color": "#9dbaea",
            "curve-style": "bezier"
          }
        }, {
          selector: "#shadowEdge",
          style: {
            "line-color": "rgba(0, 0, 0, 0.50)",
            "target-arrow-color": "rgba(0, 0, 0, 0.50)"
          }
        }, {
          selector: "core",
          style: {
            'active-bg-size': 0,
            'selection-box-border-width': 0,
            'active-bg-opacity': 0,
            'active-bg-color': 'red',
            'selection-box-opacity': 0,
            'selection-box-color': 'red'
          }
        }, {
          selector: ":selected",
          style: {
            'border-width': 1,
            'border-color': "#000"
          }
        }]
      });

      this.initMarkers();
      this.initEvents();
    }
  }, {
    key: "initMarkers",
    value: function initMarkers() {
      var _this2 = this;

      Object.keys(configNode.nodesAvailable).forEach(function (type) {
        _this2.cy.style().selector('node[type="' + type + '"]').style({
          'background-color': configNode.nodesAvailable[type].color,
          'background-image': configNode.nodesAvailable[type].icon,
          'background-fit': 'cover'
        });
      });
    }
  }, {
    key: "$",
    value: function $(sel) {
      return this.cy.$(sel);
    }
  }, {
    key: "registerEvents",
    value: function registerEvents() {
      var _this3 = this;

      document.addEventListener("dataChanged", function (e) {
        switch (e.detail.task) {
          case "initElements":
            _this3.initElements(e.detail.data);
            break;
          case "updateStyle":
            _this3.updateLayout();
            // only change to cytoscape view if elements available
            if (_this3.cy.$("node").length > 0) {
              showGraph();
            }
            break;
          case "renameNode":
            _this3.renameNode(e.detail.data.oldName, e.detail.data.newName);
            break;
          case "addNode":
            _this3.addNode(e.detail.data.name, e.detail.data.type, e.detail.data.pos);
            break;
          case "addNodes":
            _this3.addNodes(e.detail.data);
            break;
          case "changeType":
            _this3.changeType(e.detail.data.name, e.detail.data.type);
            break;
          case "deleteNode":
            _this3.deleteNode(e.detail.data);
            break;
          case "addEdge":
            _this3.addEdge(e.detail.data.from, e.detail.data.to);
            break;
          case "deleteEdge":
            _this3.deleteEdge(e.detail.data.from, e.detail.data.to);
            break;
        }
      });
    }
  }, {
    key: "initEvents",
    value: function initEvents() {
      var _this4 = this;

      this.updateBind();

      this.cy.contextMenus({
        menuItems: [{
          id: 'remove',
          title: 'Remove',
          selector: 'node',
          onClickFunction: function onClickFunction(event) {
            if (!discardChanges()) return;

            sendEvent("data", {
              task: "deleteNode",
              data: event.cyTarget.id()
            });
          }
        }, {
          id: 'add-successors',
          title: 'Connect successors',
          selector: 'node',
          onClickFunction: function onClickFunction(event) {
            var evtFromTarget = event.target || event.cyTarget;
            var pos = event.position || event.cyPosition;

            if (!discardChanges()) return;

            globals.unsavedChanges = true;

            _this4.cy.add([{
              group: "edges",
              data: {
                id: "shadowEdge",
                source: evtFromTarget.data().id,
                target: evtFromTarget.data().id
              }
            }]);

            _this4.cy.on("mouseover", "node", {}, function (_event) {
              var evtToTarget = _event.target || _event.cyTarget;
              _this4.cy.$('#shadowEdge').move({
                target: evtToTarget.data().id
              });
            });

            _this4.cy.on("click", "node", {}, function (_event) {
              var evtToTarget = _event.target || _event.cyTarget;
              globals.unsavedChanges = false;

              if (evtFromTarget == evtToTarget) {
                modal("Error", "Cant connect to same node");
              } else {
                sendEvent("data", {
                  task: "addEdge",
                  data: {
                    from: evtFromTarget.data().id,
                    to: evtToTarget.data().id
                  }
                });
              }

              _this4.cy.$('#shadowEdge').remove();
              _this4.updateBind();

              sendEvent("sidebar", {
                task: "showId",
                data: evtToTarget.data().id
              });
            });
          }
        }, {
          id: 'remove',
          title: 'Remove',
          selector: 'edge',
          onClickFunction: function onClickFunction(event) {
            if (!discardChanges()) return;

            sendEvent("data", {
              task: "deleteEdge",
              data: {
                from: event.cyTarget.source().id(),
                to: event.cyTarget.target().id()
              }
            });
            //datam.deleteEdge(, )
            //event.cyTarget.remove()
          }
        }, {
          id: 'add-node',
          title: 'Add node',
          coreAsWell: true,
          onClickFunction: function onClickFunction(event) {
            if (!discardChanges()) return;

            var pos = event.position || event.cyPosition;
            sendEvent("sidebar", {
              task: "addNode",
              data: {
                pos: pos
              }
            });
          }
        }, {
          id: 'center-map',
          title: 'Center Map',
          coreAsWell: true,
          onClickFunction: function onClickFunction(event) {
            _this4.cy.reset();
            _this4.cy.center();
          }
        }, {
          id: 'relayout-elements',
          title: 'Relayout Elements',
          coreAsWell: true,
          onClickFunction: function onClickFunction(event) {
            _this4.updateLayout();
          }
        }]
      });
    }
  }, {
    key: "updateBind",
    value: function updateBind() {
      this.cy.off('mouseover');
      this.cy.off('click');

      // Add default listener
      this.cy.on("click", function (evt) {
        closeSitebar();
      });

      this.cy.on("click", "node", {}, function (evt) {
        sendEvent("sidebar", {
          task: "showId",
          data: evt.cyTarget.id()
        });
      });
    }
  }, {
    key: "initElements",
    value: function initElements(jsonData) {
      var eles = [];
      this.cy.remove("*");

      this.addNodes(jsonData.children);
    }
  }, {
    key: "discard",
    value: function discard() {
      if (this.cy.$('#shadowEdge').length > 0) this.cy.$('#shadowEdge').remove();

      this.updateBind();
    }
  }, {
    key: "changeType",
    value: function changeType(name, newType) {
      var ele = this.cy.$("node#" + name);
      var position = ele.position();

      var edgesToUpdate = this.cy.edges("[source='" + name + "'], [target='" + name + "']");
      //replace Nodes
      var edges = [];
      edgesToUpdate.forEach(function (edge) {
        var target = edge.target().id(),
            source = edge.source().id(),
            ele = {
          group: "edges",
          data: {
            source: "",
            target: ""
          }
        };

        if (target == name) {
          ele.data.source = source;
          ele.data.target = name;
        } else {
          ele.data.source = name;
          ele.data.target = target;
        }

        edges.push(ele);
      });

      edgesToUpdate.remove();
      ele.remove();
      this.addNode(name, newType, position);
      this.cy.add(edges);
    }
  }, {
    key: "addNodes",
    value: function addNodes(childs) {
      var _this5 = this;

      var customPos = false;

      childs.forEach(function (child) {
        if (typeof child.pos != "undefined") {
          if (typeof child.pos.x != "undefined" && typeof child.pos.y != "undefined") {
            customPos = true;
            _this5.addNode(child.name, child.type, child.pos);
          } else {
            _this5.addNode(child.name, child.type);
          }
        } else {
          _this5.addNode(child.name, child.type);
        }
      });

      // Add edges when nodes loaded
      // Only add Successors
      childs.forEach(function (child) {
        child.successors.forEach(function (succ) {
          _this5.addEdge(child.name, succ);
        });
      });

      // check if all pred added
      childs.forEach(function (child) {
        child.predecessors.forEach(function (pred) {
          if (_this5.cy.edges("[source='" + pred + "'][target='" + child.name + "']").length == 0) {
            if (_this5.cy.$("#" + pred).length > 0) {
              _this5.addEdge(pred, child.name);
            }
          }
        });
      });

      if (!customPos || this.autoLayout == "true") {
        this.updateLayout();
      } else {
        this.cy.reset();
        this.cy.center();
      }
    }
  }, {
    key: "addNode",
    value: function addNode(name, type) {
      var pos = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

      var elementData = {};
      elementData.id = name;
      elementData.type = type;

      if (typeof pos.x != "undefined" && typeof pos.y != "undefined") {
        this.cy.add({
          group: "nodes",
          type: type,
          data: elementData,
          position: {
            x: Number.parseFloat(pos.x),
            y: Number.parseFloat(pos.y)
          }
        });
      } else {
        this.cy.add({
          group: "nodes",
          type: type,
          data: elementData
        });
      }

      if (this.autoLayout == "true") {
        this.updateLayout();
      }
    }
  }, {
    key: "renameNode",
    value: function renameNode(oldName, newName) {
      var ele = this.cy.$("node#" + oldName);

      var newEle = {
        group: "nodes",
        data: {
          id: newName
        },
        position: ele.position()
      };
      this.cy.add(newEle);

      var edgesToUpdate = this.cy.edges("[source='" + oldName + "'], [target='" + oldName + "']");
      //replace Nodes
      var edges = [];
      edgesToUpdate.forEach(function (edge) {
        var target = edge.target().id(),
            source = edge.source().id(),
            ele = {
          group: "edges",
          data: {
            source: "",
            target: ""
          }
        };

        if (target == oldName) {
          ele.data.source = source;
          ele.data.target = newName;
        } else {
          ele.data.source = newName;
          ele.data.target = target;
        }

        edges.push(ele);
      });

      ele.remove();
      edgesToUpdate.remove();
      this.cy.add(edges);
    }
  }, {
    key: "deleteNode",
    value: function deleteNode(name) {
      this.cy.$("#" + name).remove();
    }
  }, {
    key: "deleteEdge",
    value: function deleteEdge(from, to) {
      this.cy.edges("[source='" + from + "'][target='" + to + "']").remove();
    }
  }, {
    key: "addEdge",
    value: function addEdge(from, to) {
      this.cy.add([{
        group: "edges",
        data: {
          source: from,
          target: to
        }
      }]);
    }
  }, {
    key: "updateLayout",
    value: function updateLayout() {
      this.autoLayout = localStorage.getItem("autoLayout") ? localStorage.getItem("autoLayout") : globals.autoLayout;

      this.cy.makeLayout({
        name: localStorage.getItem("style") || config.cytoscape.defaultStyle
      }).run();
    }
  }]);

  return CyptoScape;
}();
"use strict";

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var DataManager = function () {
  function DataManager() {
    var _this = this;

    _classCallCheck(this, DataManager);

    this._json = null;
    this.filterElements = null;

    // debug
    window.json = function () {
      return _this._json;
    };

    document.addEventListener("data", function (e) {
      _this.updateData(e.detail);
    });
  }

  _createClass(DataManager, [{
    key: "getAllElements",


    /**
     * [getAllElements description]
     * Get all elements including filtered elements
     */
    value: function getAllElements() {
      return this._json.children.concat(this.filterElements);
    }
  }, {
    key: "getElement",
    value: function getElement(id) {
      var index = this._json.children.findIndex(function (x) {
        return x.name == id;
      });
      if (index !== -1) {
        return this._json.children[index];
      }
    }
  }, {
    key: "updateScenario",
    value: function updateScenario(data) {
      this._json.name = data.name;
      this._json.tags.description = data.tags.description;
    }
  }, {
    key: "getScenario",
    value: function getScenario() {
      if (this._json != null) {
        return {
          name: this._json.name,
          description: this._json.tags.description
        };
      } else return null;
    }
  }, {
    key: "initData",
    value: function initData(json) {
      var _this2 = this;

      this._json = json;
      this.filterElements = [];
      var removeItems = [];

      this._json.children.forEach(function (child) {
        // Node Type unknown
        if (typeof configNode.nodesAvailable[child.type] == "undefined") {
          console.log(child.name + " has been removed because type is unknown.");
          removeItems.push(child);
        } else {
          // Add valid geometry_type if not avaible
          if (typeof child.geometry_type == "undefined") {
            child.geometry_type = configNode.nodesAvailable[child.type].geometryTypes[0];
          } else if (configNode.nodesAvailable[child.type].geometryTypes.indexOf(child.geometry_type) == -1) {
            child.geometry_type = configNode.nodesAvailable[child.type].geometryTypes[0];
          }

          // Node Type is not enabled
          if (configNode.nodesEnabled.indexOf(child.type) == -1) {
            console.log("Not enabled", child.name, child.type);
            _this2.filterElements.push(child);
          }
          // Node Type is enabled
          else {
              if (typeof child.tags == "undefined") {
                child.tags = {};
              } else if (!configNode.allowCustomTags) {
                var _loop = function _loop(tag, value) {
                  if (configNode.nodesAvailable[child.type].tags.findIndex(function (x) {
                    return x.name == tag;
                  }) == -1) {
                    delete child.tags[tag];
                  }
                };

                var _iteratorNormalCompletion = true;
                var _didIteratorError = false;
                var _iteratorError = undefined;

                try {
                  for (var _iterator = Object.entries(child.tags)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var _ref = _step.value;

                    var _ref2 = _slicedToArray(_ref, 2);

                    var tag = _ref2[0];
                    var value = _ref2[1];

                    _loop(tag, value);
                  }
                } catch (err) {
                  _didIteratorError = true;
                  _iteratorError = err;
                } finally {
                  try {
                    if (!_iteratorNormalCompletion && _iterator.return) {
                      _iterator.return();
                    }
                  } finally {
                    if (_didIteratorError) {
                      throw _iteratorError;
                    }
                  }
                }
              }

              // create tags not created;
              configNode.nodesAvailable[child.type].tags.forEach(function (tag) {
                if (typeof child.tags[tag.name] == "undefined") {
                  child.tags[tag.name] = "";
                } else {
                  // parse value
                }
              });
            }
        }
      });

      // remove filtered Elements
      this.filterElements.concat(removeItems).forEach(function (child) {
        var index = _this2._json.children.findIndex(function (x) {
          return x.name == child.name;
        });
        if (index != -1) {
          _this2._json.children.splice(index, 1);
        }
      });
    }
  }, {
    key: "updateData",
    value: function updateData(detail) {
      switch (detail.task) {
        case "addNode":
          this.addNode(detail.data);
          break;
        case "addEdge":
          this.addEdge(detail.data.from, detail.data.to);
          break;
        case "deleteNode":
          this.deleteNode(detail.data);
          break;
        case "deleteEdge":
          this.deleteEdge(detail.data.from, detail.data.to);
          break;
        case "addTag":
          this.addTag(detail.data.id, detail.data.tag);
          break;
        case "removeTag":
          this.removeTag(detail.data.id, detail.data.tag);
          break;
        case "updateNode":
          this.updateNode(detail.data);
          break;
        case "updatePosition":
          this.updatePosition(detail.data.name, detail.data.pos);
          break;
        case "updateScenario":
          this.updateScenario(detail.data);
          break;
        case "updateNodesEnabled":
          this.updateNodesEnabled(detail.data);
          break;
        default:
          console.log("default case updateData");
          break;
      }
    }
  }, {
    key: "updateRelationNames",
    value: function updateRelationNames(newName, oldName) {
      var _this3 = this;

      this._json.children.forEach(function (child, index) {
        child.predecessors.forEach(function (pred, j) {
          if (pred == oldName) _this3._json.children[index].predecessors[j] = newName;
        });
        child.successors.forEach(function (succ, j) {
          if (succ == oldName) _this3._json.children[index].successors[j] = newName;
        });
      });
    }
  }, {
    key: "updatePosition",
    value: function updatePosition(name, pos) {
      var index = this._json.children.findIndex(function (x) {
        return x.name == name;
      });
      if (index !== -1) {
        this._json.children[index].pos = pos;

        sendEvent("dataChanged", {
          task: "positionUpdate",
          data: {
            name: name,
            pos: pos
          }
        });
      }
    }
  }, {
    key: "addNode",
    value: function addNode(data) {
      var formdata = {
        name: data.name,
        type: data.type,
        geometry_type: data.geometry_type,
        tags: {},
        predecessors: [],
        successors: [],
        pos: {}
      };

      var index = this._json.children.findIndex(function (x) {
        return x.name == data.name;
      });
      if (index !== -1) {
        modal("Error", "Element name already exists");
        return false;
      }

      if (typeof data.pos != "undefined") {
        formdata.pos = data.pos;
      }

      for (var i = 0; i < configNode.nodesAvailable[data.type].tags.length; i++) {
        formdata.tags[configNode.nodesAvailable[data.type].tags[i].name] = "";
      }

      this._json.children.push(formdata);

      sendEvent("dataChanged", {
        task: "addNode",
        data: {
          name: formdata.name,
          pos: formdata.pos,
          type: formdata.type,
          geometry_type: formdata.geometry_type
        }
      });

      sendEvent("sidebar", {
        task: "showId",
        data: data.name
      });
    }

    /**
     * [addEdge description]
     * Adds predecessors and successors
     */

  }, {
    key: "addEdge",
    value: function addEdge(predecessors, successors) {
      // Add Successor
      var index = this._json.children.findIndex(function (x) {
        return x.name == predecessors;
      });
      if (index !== -1) {
        if (this._json.children[index].successors.indexOf(successors) === -1) {
          this._json.children[index].successors.push(successors);
        } else {
          modal("Error", "Already exists");
          return false;
        }
      }
      // Add Predecessor
      index = this._json.children.findIndex(function (x) {
        return x.name == successors;
      });
      if (index !== -1) {
        if (this._json.children[index].predecessors.indexOf(predecessors) === -1) this._json.children[index].predecessors.push(predecessors);
      }

      sendEvent("dataChanged", {
        task: "addEdge",
        data: {
          from: predecessors,
          to: successors
        }
      });
    }
  }, {
    key: "deleteEdge",
    value: function deleteEdge(src, target) {
      var srcI = this._json.children.findIndex(function (x) {
        return x.name == src;
      }),
          targetI = this._json.children.findIndex(function (x) {
        return x.name == target;
      });

      if (srcI !== -1 && targetI !== -1) {
        this._json.children[srcI].successors = this._json.children[srcI].successors.filter(function (succ) {
          return succ != target;
        });
        this._json.children[targetI].predecessors = this._json.children[targetI].predecessors.filter(function (pred) {
          return pred != src;
        });
      }

      sendEvent("dataChanged", {
        task: "deleteEdge",
        data: {
          from: src,
          to: target
        }
      });
    }
  }, {
    key: "deleteNode",
    value: function deleteNode(name) {
      this._json.children = this._json.children.filter(function (child) {
        return child.name != name;
      });

      this.deleteRelationNames(name);

      sendEvent("dataChanged", {
        task: "deleteNode",
        data: name
      });
    }
  }, {
    key: "updateNode",
    value: function updateNode(updateData) {
      var _this4 = this;

      var ele = this.getElement(updateData.currentId);
      var nodeEnabled = true;

      // if name(id) changes
      if (updateData.currentId != updateData.name) {
        if (this.getAllElements().findIndex(function (x) {
          return x.name = updateData.name;
        }) != -1) {
          modal("Warning", "Name is already used. Changes have been discarded");
          return;
        }
      }

      if (configNode.nodesEnabled.indexOf(updateData.type) == -1) {
        nodeEnabled = false;

        sendEvent("dataChanged", {
          task: "deleteNode",
          data: updateData.currentId
        });
      } else {
        // check if pos changed
        if (typeof updateData.pos != "undefined") {
          if (typeof updateData.pos.lat != "undefined" && typeof updateData.pos.lng != "undefined") {
            if (updateData.pos.lat != ele.pos.lat || updateData.pos.lng != ele.pos.lng) {
              sendEvent("dataChanged", {
                task: "positionUpdate",
                data: {
                  name: updateData.currentId,
                  pos: {
                    lat: updateData.pos.lat,
                    lng: updateData.pos.lng
                  }
                }
              });
            }
          }
        }

        // check if type changed
        if (updateData.type != ele.type || updateData.geometry_type != ele.geometry_type) {
          sendEvent("dataChanged", {
            task: "changeType",
            data: {
              name: updateData.currentId,
              type: updateData.type,
              geometry_type: updateData.geometry_type
            }
          });
        }
      }

      // remove current updated Child.
      this._json.children = this._json.children.filter(function (child) {
        return child.name != updateData.currentId;
      });

      delete updateData['currentId'];

      if (typeof updateData.tags == "undefined") {
        updateData.tags = {};
      }

      // Add Successor and Predecessors to other
      updateData.successors.forEach(function (child) {
        var index = _this4._json.children.findIndex(function (x) {
          return x.name == child;
        });
        if (index !== -1) {
          if (_this4._json.children[index].predecessors.indexOf(updateData.name) === -1) {
            _this4._json.children[index].predecessors.push(updateData.name);

            if (nodeEnabled) {
              sendEvent("dataChanged", {
                task: "addEdge",
                data: {
                  from: updateData.name,
                  to: _this4._json.children[index].name
                }
              });
            }
          }
        }
      });

      updateData.predecessors.forEach(function (child) {
        var index = _this4._json.children.findIndex(function (x) {
          return x.name == child;
        });
        if (index !== -1) {
          if (_this4._json.children[index].successors.indexOf(updateData.name) === -1) {
            _this4._json.children[index].successors.push(updateData.name);

            if (nodeEnabled) {
              sendEvent("dataChanged", {
                task: "addEdge",
                data: {
                  from: _this4._json.children[index].name,
                  to: updateData.name
                }
              });
            }
          }
        }
      });

      // Check if Edges have been removed
      this._json.children.forEach(function (child, id, arr) {
        var index = child.predecessors.indexOf(updateData.name);
        if (index !== -1) {
          if (updateData.successors.indexOf(child.name) === -1) {
            delete arr[id].predecessors[index];

            if (nodeEnabled) {
              sendEvent("dataChanged", {
                task: "deleteEdge",
                data: {
                  from: updateData.name,
                  to: child.name
                }
              });
            }
          }
        }

        index = child.successors.indexOf(updateData.name);
        if (index !== -1) {
          if (updateData.predecessors.indexOf(child.name) === -1) {
            delete arr[id].successors[index];

            if (nodeEnabled) {
              sendEvent("dataChanged", {
                task: "deleteEdge",
                data: {
                  from: child.name,
                  to: updateData.name
                }
              });
            }
          }
        }
      });

      if (nodeEnabled) this._json.children.push(updateData);else this.filterElements.push(updateData);
    }
  }, {
    key: "addTag",
    value: function addTag(name, tagName) {
      var index = this._json.children.findIndex(function (x) {
        return x.name == name;
      });

      if (index !== -1) {
        if (typeof this._json.children[index].tags == "undefined") this._json.children[index].tags = {};

        this._json.children[index].tags[tagName] = "";
      }
    }
  }, {
    key: "removeTag",
    value: function removeTag(name, tagName) {
      var index = this._json.children.findIndex(function (x) {
        return x.name == name;
      });

      if (index !== -1) delete this._json.children[index].tags[tagName];
    }
  }, {
    key: "updateNodesEnabled",
    value: function updateNodesEnabled(nodesEnabled) {
      var _this5 = this;

      if (this._json != null) {
        var diffRemovedTypes = configNode.nodesEnabled.filter(function (el) {
          return nodesEnabled.indexOf(el) == -1;
        });

        var diffAddedTypes = nodesEnabled.filter(function (el) {
          return configNode.nodesEnabled.indexOf(el) == -1;
        });

        // remove filtered Elements
        diffRemovedTypes.forEach(function (name) {

          console.log(_this5._json.children.filter(function (x) {
            return x.type == name;
          }));

          _this5._json.children.filter(function (x) {
            return x.type == name;
          }).forEach(function (child) {
            _this5.filterElements.push(child);

            sendEvent("dataChanged", {
              task: "deleteNode",
              data: child.name
            });
          });
        });

        this.filterElements.forEach(function (child) {
          var index = _this5._json.children.findIndex(function (x) {
            return x.name == child.name;
          });
          if (index != -1) {
            _this5._json.children.splice(index, 1);
          }
        });

        var elesToAdd = [];
        diffAddedTypes.forEach(function (name) {
          elesToAdd = elesToAdd.concat(_this5.filterElements.filter(function (x) {
            return x.type == name;
          }));
        });

        elesToAdd.forEach(function (child) {
          var index = _this5.filterElements.findIndex(function (x) {
            return x.name == child.name;
          });
          _this5._json.children.push(child);

          if (index != -1) {
            _this5.filterElements.splice(index, 1);
          }
        });

        if (elesToAdd.length >= 1) {
          sendEvent("dataChanged", {
            task: "addNodes",
            data: elesToAdd
          });
        }
      }

      configNode.nodesEnabled = nodesEnabled;
    }
  }, {
    key: "deleteRelationNames",
    value: function deleteRelationNames(name) {
      this._json.children.forEach(function (child) {
        child.predecessors.forEach(function (pred, index) {
          if (pred == name) {
            child.predecessors.splice(index, 1);
          }
        });
        child.successors.forEach(function (succ, index) {
          if (succ == name) {
            child.successors.splice(index, 1);
          }
        });
      });
    }
  }, {
    key: "json",
    set: function set(paraJson) {
      this.initData(paraJson);
    },
    get: function get() {
      return this._json;
    }
  }]);

  return DataManager;
}();
"use strict";

var globals = {
	unsavedChanges: false,
	autoLayout: "false",
	callSitebarTimestamp: 0
};
"use strict";

function setActiveMenuItem(href) {
	$(".navbar-nav .active").removeClass("active");
	$("a[href='#" + href + "']").parent("li").attr("class", "active");
}

function createContentPage(heading, content) {
	$(config.dom.sidebar).hide();
	$(config.dom.content.heading).text(heading);
	$(config.dom.content.body).html(content);
	showContentPage();
}

function showContentPage() {
	$(config.dom.content.container).show();
	$("#" + config.dom.mapContainerId).css("visibility", "hidden");
	$(config.dom.canvasContainer).css("visibility", "hidden");
	$(config.dom.sidebar).hide();
}

function showGraph() {
	$(config.dom.sidebar).show();
	$(config.dom.content.container).hide();
	$("#" + config.dom.mapContainerId).css("visibility", "hidden");
	$(config.dom.canvasContainer).css("visibility", "visible");
}

function showMap() {
	$(config.dom.content.container).hide();
	$(config.dom.canvasContainer).css("visibility", "hidden");
	$(config.dom.sidebar).show();
	$("#" + config.dom.mapContainerId).css("visibility", "visible");
}

function hideModal() {
	$(config.dom.modal.backdrop).removeClass("in");
	$(config.dom.modal.container).removeClass("in");
}

function openSitebar() {
	globals.callSitebarTimestamp = Date.now();
	$("body").removeClass("sidebar-closed");
}

function closeSitebar() {
	// hack
	// map calls closeSitebar when polygone is clicked
	// if open call is called 100ms before it will not be called
	if (globals.callSitebarTimestamp + 100 < Date.now()) $("body").addClass("sidebar-closed");
}

function discardChanges(abort) {
	if (globals.unsavedChanges) {
		if (confirm('You have unsaved changes. You want to discard them?')) {
			sendEvent("discardChanges");
			globals.unsavedChanges = false;
		} else {
			return false;
		}
	}

	return true;
}

function arrayToPolygonWkt(arr) {
	var wktText = 'POLYGON (';

	for (var i = 0; i < arr.length; i++) {
		arr[i].forEach(function (entry) {
			wktText += entry + " ";
		});

		if (arr.length - 1 != i) {
			wktText = wktText.substring(0, wktText.length);
			wktText += ", ";
		}
	}

	wktText += ")";
	return wktText;
}
function arrayToPolylineWkt(arr) {
	var wktText = 'LINESTRING (';

	for (var i = 0; i < arr.length; i++) {
		arr[i].forEach(function (entry) {
			wktText += entry + " ";
		});

		if (arr.length - 1 != i) {
			wktText = wktText.substring(0, wktText.length);
			wktText += ", ";
		}
	}

	wktText += ")";
	return wktText;
}

function createInput(label, key, currentValue, type) {
	var required = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : false;
	var additionalTags = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : "";

	var html = "<div class=\"form-group\">";

	if (type != "hidden") {
		html += '<label for="' + key + '">' + label + '</label>';
	}
	if (required) {
		html += '<input class="form-control" required type="' + type + '" id="' + key + '" name="' + key + '" ' + additionalTags + ' value="' + currentValue + '"/>';
	} else {
		html += '<input class="form-control" type="' + type + '" id="' + key + '" name="' + key + '" ' + additionalTags + ' value="' + currentValue + '"/>';
	}
	html += "</div>";

	return html;
}
function createSelect(key, currentValues, options) {
	var additionalTags = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : "";

	var html = "<div class=\"form-group\">";
	html += '<label for="' + key + '">' + key + '</label>';
	html += '<select class="basic-select ' + key + '" ' + additionalTags + ' name="' + key + '">';

	options.forEach(function (opt) {
		var name = opt.name ? opt.name : opt;

		if (currentValues.indexOf(name) !== -1) {
			html += '<option selected value="' + name + '">' + name + '</option>';
		} else {
			html += '<option>' + name + '</option>';
		}
	});

	html += '</select></div>';
	return html;
}

function readForm(form) {
	var formData = {};
	$(form).serializeArray().forEach(function (field) {
		if (field.name.substring(0, 5) == "tags_") {
			if (typeof formData.tags === "undefined") formData.tags = {};

			formData.tags[field.name.substring(5, field.name.length)] = field.value;
		} else if (field.name == "predecessors" || field.name == "successors") {
			formData[field.name] = $(form + " [name=\"" + field.name + "\"]").val();
		} else if (field.name.substring(0, 4) == "pos_") {
			if (typeof formData.pos === "undefined") formData.pos = {};

			formData.pos[field.name.substring(4, field.name.length)] = field.value;
		} else {
			formData[field.name] = field.value;
		}
	});

	$(form + " select").val(function (index, value) {
		if (this.name != "") formData[this.name] = value;
	});

	return formData;
}

function sendEvent(name, data) {
	var event = new CustomEvent(name, { "detail": data });
	document.dispatchEvent(event);
}

/**
 * EXTEND SET OBJECT

Set.prototype.isSuperset = function(subset) {
    for (var elem of subset) {
        if (!this.has(elem)) {
            return false;
        }
    }
    return true;
}

Set.prototype.union = function(setB) {
    var union = new Set(this);
    for (var elem of setB) {
        union.add(elem);
    }
    return union;
}

Set.prototype.intersection = function(setB) {
    var intersection = new Set();
    for (var elem of setB) {
        if (this.has(elem)) {
            intersection.add(elem);
        }
    }
    return intersection;
}

Set.prototype.difference = function(setB) {
    var difference = new Set(this);
    for (var elem of setB) {
        difference.delete(elem);
    }
    return difference;
} */
"use strict";

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var LeafleatMap = function () {
  function LeafleatMap(id) {
    var _this = this;

    _classCallCheck(this, LeafleatMap);

    this.elements = {};

    this.redraw = {
      ghostPoly: null,
      name: null
    };

    this.shadowEdge = null;
    this.icons = {};

    this.init(id);
    this.registerEvents();
    this.addDefaultBind();

    // debug
    window.map = function () {
      return _this.map;
    };
  }

  _createClass(LeafleatMap, [{
    key: "init",
    value: function init(id) {
      var _this2 = this;

      //
      this.extendSidebar();

      this.map = L.map(id, {
        // Flensburg
        center: [54.79118460009706, 9.434165954589844],
        zoom: 11,
        contextmenu: true,
        contextmenuWidth: 140,
        contextmenuItems: [{
          text: 'Add Node',
          callback: function callback(e) {
            if (discardChanges()) sendEvent("sidebar", {
              task: "addNode",
              data: {
                pos: e.latlng
              }
            });
          }
        },
        /*{
                       text: 'Add Polygon',
                       callback: e => {
                           if (discardChanges())
                               this.drawPolygon()
                       }
                   }, */
        {
          text: 'Show coordinates',
          callback: function callback(e) {
            _this2.showCoordinates(e);
          }
        }, {
          text: 'Center map',
          callback: function callback(e) {
            _this2.centerMap(e);
          }
        }, {
          text: 'Zoom in',
          callback: function callback(e) {
            _this2.zoomIn(e);
          }
        }, {
          text: 'Zoom out',
          callback: function callback(e) {
            _this2.zoomOut(e);
          }
        }]
      });

      L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw', {
        maxZoom: 18,
        attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' + '<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' + 'Imagery © <a href="http://mapbox.com">Mapbox</a>',
        id: 'mapbox.streets'
      }).addTo(this.map);

      this.alertButton = $('<div class="alertMissingPositionBar leaflet-control-zoom leaflet-bar leaflet-control"><a class="leaflet-control-zoom-in" href="#" title="Show Nodes" role="button" aria-label="Show Nodes">!</a></div>');
      $('.leaflet-top.leaflet-right').append(this.alertButton);

      this.alertButton.hide().on('click', function (e) {
        if (!discardChanges()) return;

        var head = "<h4>Elements without Positions</h4>";
        var body = _this2.getNoPosElements();

        _this2.registerDragEvents(body.find("img"));

        sendEvent("sidebar", {
          task: "show",
          data: {
            head: head,
            body: body
          }
        });
      });

      this.initMarkers();
    }
  }, {
    key: "initMarkers",
    value: function initMarkers() {
      var _this3 = this;

      Object.keys(configNode.nodesAvailable).forEach(function (type) {
        _this3.icons[type] = L.icon({
          iconUrl: configNode.nodesAvailable[type].icon,
          iconSize: [40, 40],
          iconAnchor: [20, 40]
          //popupAnchor:  [0, -80]
        });
      });
    }
  }, {
    key: "registerEvents",
    value: function registerEvents() {
      var _this4 = this;

      document.addEventListener("dataChanged", function (e) {
        switch (e.detail.task) {
          case "initElements":
            _this4.initElements(e.detail.data);
            break;
          case "updateStyle":
            //if(this.cy.$("nodes").length > 0)
            //this.updateLayout()
            break;
          case "renameNode":
            _this4.renameNode(e.detail.data.oldName, e.detail.data.newName);
            break;
          case "changeType":
            _this4.changeType(e.detail.data.name, e.detail.data.type, e.detail.data.geometry_type);
            break;
          case "addNode":
            _this4.addNode(e.detail.data.name, e.detail.data.type, e.detail.data.pos, e.detail.data.geometry_type);
            break;
          case "addNodes":
            _this4.addNodes(e.detail.data);
            break;
          case "deleteNode":
            _this4.deleteNode(e.detail.data);
            break;
          case "addEdge":
            _this4.addEdge(e.detail.data.from, e.detail.data.to);
            break;
          case "deleteEdge":
            _this4.deleteEdge(e.detail.data.from, e.detail.data.to);
            break;
          case "positionUpdate":
            _this4.updatePosition(e.detail.data.name, e.detail.data.pos, e.detail.data.geometry_type);
            break;
        }
      });
    }
  }, {
    key: "initElements",
    value: function initElements(json) {
      this.removeExistingElements();

      this.addNodes(json.children);

      this.centerMap();
    }
  }, {
    key: "extendSidebar",
    value: function extendSidebar() {
      var _this5 = this;

      document.addEventListener("sidebar", function (e) {
        switch (e.detail.task) {
          case "showId":
            window.setTimeout(function (event) {
              console.log("showId");
              _this5.addPositionToSidebar(e.detail.data);
            }, 500);
            break;
        }
      });
    }
  }, {
    key: "addPositionToSidebar",
    value: function addPositionToSidebar(name) {
      var _this6 = this;

      var setPositionEle = $('<a href="#" class="btn btn-success setPosition">Set Position</a>');
      var that = this;
      $(".editForm").append(setPositionEle);

      setPositionEle.on("click", function (e) {
        switch (_this6.elements[name].geometry_type) {
          case "polygon":
            console.log("Listener Poly");
            that.drawPolygon(name);
            break;
          case "line":
            console.log("Listener Line");
            that.drawLine(name);
            break;
          case "point":
            console.log("Listener Line");
          //this.drawPoint(name)
        }
        showMap();
      });
    }
  }, {
    key: "renameNode",
    value: function renameNode(oldName, newName) {
      var pos = this.elements[oldName].marker.getLatLng();
      var succs = this.elements[oldName].successors;

      this.addNode(newName, this.elements[oldName].type, pos, this.elements[oldName].geometry_type);

      // rename relative links
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = Object.entries(this.elements)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var _ref = _step.value;

          var _ref2 = _slicedToArray(_ref, 2);

          var property = _ref2[0];
          var data = _ref2[1];

          if (property != oldName) {
            var _iteratorNormalCompletion3 = true;
            var _didIteratorError3 = false;
            var _iteratorError3 = undefined;

            try {
              for (var _iterator3 = Object.entries(this.elements[property].successors)[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                var _ref5 = _step3.value;

                var _ref6 = _slicedToArray(_ref5, 2);

                var _succ = _ref6[0];
                var _obj = _ref6[1];

                if (_succ == oldName) {
                  this.deleteEdge(property, oldName);
                  this.addEdge(property, newName);
                }
              }
            } catch (err) {
              _didIteratorError3 = true;
              _iteratorError3 = err;
            } finally {
              try {
                if (!_iteratorNormalCompletion3 && _iterator3.return) {
                  _iterator3.return();
                }
              } finally {
                if (_didIteratorError3) {
                  throw _iteratorError3;
                }
              }
            }
          }
        }

        // remove Old
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator.return) {
            _iterator.return();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }

      this.map.removeLayer(this.elements[oldName].marker);
      var _iteratorNormalCompletion2 = true;
      var _didIteratorError2 = false;
      var _iteratorError2 = undefined;

      try {
        for (var _iterator2 = Object.entries(succs)[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
          var _ref3 = _step2.value;

          var _ref4 = _slicedToArray(_ref3, 2);

          var succ = _ref4[0];
          var obj = _ref4[1];

          this.deleteEdge(oldName, succ);

          this.addEdge(newName, succ);
        }
      } catch (err) {
        _didIteratorError2 = true;
        _iteratorError2 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion2 && _iterator2.return) {
            _iterator2.return();
          }
        } finally {
          if (_didIteratorError2) {
            throw _iteratorError2;
          }
        }
      }

      delete this.elements[oldName];
    }
  }, {
    key: "removeExistingElements",
    value: function removeExistingElements() {
      var _iteratorNormalCompletion4 = true;
      var _didIteratorError4 = false;
      var _iteratorError4 = undefined;

      try {
        for (var _iterator4 = Object.entries(this.elements)[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
          var _ref7 = _step4.value;

          var _ref8 = _slicedToArray(_ref7, 2);

          var k = _ref8[0];
          var v = _ref8[1];

          if (v.marker != null) {
            this.map.removeLayer(v.marker);

            var _iteratorNormalCompletion5 = true;
            var _didIteratorError5 = false;
            var _iteratorError5 = undefined;

            try {
              for (var _iterator5 = Object.entries(v.successors)[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
                var _ref9 = _step5.value;

                var _ref10 = _slicedToArray(_ref9, 2);

                var succ = _ref10[0];
                var obj = _ref10[1];

                this.deleteEdge(k, succ);
              }
            } catch (err) {
              _didIteratorError5 = true;
              _iteratorError5 = err;
            } finally {
              try {
                if (!_iteratorNormalCompletion5 && _iterator5.return) {
                  _iterator5.return();
                }
              } finally {
                if (_didIteratorError5) {
                  throw _iteratorError5;
                }
              }
            }
          }
        }
      } catch (err) {
        _didIteratorError4 = true;
        _iteratorError4 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion4 && _iterator4.return) {
            _iterator4.return();
          }
        } finally {
          if (_didIteratorError4) {
            throw _iteratorError4;
          }
        }
      }

      this.elements = {};
    }
  }, {
    key: "createNode",
    value: function createNode(name, pos) {
      var _this7 = this;

      var obj = null;

      if (this.elements[name].geometry_type == "polygon") {
        var posArr = null;

        if (typeof pos.wkt != "undefined") {
          var wkt = new Wkt.Wkt();
          wkt.read(pos.wkt);
          posArr = wkt.toJson().coordinates;
        } else {
          posArr = pos;
        }

        obj = L.polygon(posArr, {
          contextmenu: true,
          contextmenuItems: [{
            text: 'Change position',
            index: 0,
            callback: function callback(e) {
              if (discardChanges()) _this7.drawPolygon(name);
            }
          }, {
            separator: true,
            index: 1
          }, {
            text: 'Connect successors',
            index: 2,
            callback: function callback(e) {
              if (discardChanges()) _this7.connectSuccessor(e, name);
            }
          }, {
            text: 'Delete',
            index: 3,
            callback: function callback(e) {
              if (discardChanges()) sendEvent("data", {
                task: "deleteNode",
                data: name
              });
            }
          }, {
            separator: true,
            index: 4
          }]
        });
      } else if (this.elements[name].geometry_type == "point") {
        obj = L.marker(pos, {
          icon: this.icons[this.elements[name].type],
          contextmenu: true,
          contextmenuItems: [{
            text: 'Connect successors',
            index: 0,
            callback: function callback(e) {
              if (discardChanges()) _this7.connectSuccessor(e, name);
            }
          }, {
            text: 'Delete',
            index: 1,
            callback: function callback(e) {
              if (discardChanges()) sendEvent("data", {
                task: "deleteNode",
                data: name
              });
            }
          }, {
            separator: true,
            index: 2
          }]
        });
      } else //if(this.elements[name].geometry_type == "line")
        {
          var _posArr = null;

          if (typeof pos.wkt != "undefined") {
            var _wkt = new Wkt.Wkt();
            _wkt.read(pos.wkt);
            _posArr = _wkt.toJson().coordinates;
          } else {
            _posArr = pos;
          }

          obj = L.polyline(_posArr, {
            contextmenu: true,
            contextmenuItems: [{
              text: 'Change position',
              index: 0,
              callback: function callback(e) {
                if (discardChanges()) _this7.drawLine(name);
              }
            }, {
              separator: true,
              index: 1
            }, {
              text: 'Connect successors',
              index: 2,
              callback: function callback(e) {
                if (discardChanges()) _this7.connectSuccessor(e, name);
              }
            }, {
              text: 'Delete',
              index: 3,
              callback: function callback(e) {
                if (discardChanges()) sendEvent("data", {
                  task: "deleteNode",
                  data: name
                });
              }
            }, {
              separator: true,
              index: 4
            }]
          });
        }

      obj.addTo(this.map)
      //.bindPopup(name)
      .on("click", function () {
        sendEvent("sidebar", {
          task: "showId",
          data: name
        });
        return false;
      });

      return obj;
    }
  }, {
    key: "changeType",
    value: function changeType(name, newType, geometryType) {
      console.log(name, newType, geometryType);
      var oldType = this.elements[name].type;
      var oldGeo = this.elements[name].geometry_type;

      this.elements[name].type = newType;
      this.elements[name].geometry_type = geometryType;

      if (this.elements[name].marker != null) {
        if (oldGeo != geometryType) {
          this.deleteNode(name, false);
          // No Pos Data
          this.showButtonAddNodes();
        } else {
          var pos = null;
          if (oldGeo == "line" || oldGeo == "polygon") pos = this.elements[name].marker.getLatLngs();else pos = this.elements[name].marker.getLatLng();

          this.elements[name].marker.remove();
          this.elements[name].marker = this.createNode(name, pos);
        }
      }
    }
  }, {
    key: "sidebarTextPolyCreation",
    value: function sidebarTextPolyCreation(wktText) {
      var name = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "";

      var body = $('<div></div>');
      var form = $('<form class="createPolyForm clearfix"></form>');
      form.append(createInput("name", "name", name, "text", true)).append(createInput("type", "type", "polygon", "text", true, "readonly")).append(createInput("wkt", "pos_wkt", wktText, "hidden")).append('<button class="btn btn-success">Save</button>').append('<a class="cancel btn btn-warning pull-right">Cancel</a>');

      body.append(form).append('<a class="resetPoly btn m-t-sm btn-default">Reset</a>').append('<a class="revertPoly btn m-t-sm btn-primary pull-right">Revert</a>');

      sendEvent("sidebar", {
        task: "show",
        data: {
          head: "<h4>Create Polygon</h4>",
          body: body
        }
      });
    }
  }, {
    key: "sidebarTextPolyPlacement",
    value: function sidebarTextPolyPlacement(wktText) {
      var name = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "";

      var body = $('<div></div>');
      var form = $('<form class="createPolyForm clearfix"></form>');
      form.append(createInput("name", "name", name, "hidden")).append(createInput("wkt", "pos_wkt", wktText, "hidden")).append('<button class="btn btn-success">Save</button>').append('<a class="cancel btn btn-warning pull-right">Cancel</a>');

      body.append(form).append('<button class="resetPoly btn btn-default m-t-sm">Reset</button>').append('<button class="revertPoly btn btn-primary m-t-sm pull-right">Revert</button>');

      sendEvent("sidebar", {
        task: "show",
        data: {
          head: "<h4>Place Polygon</h4>",
          body: body
        }
      });
    }
  }, {
    key: "discard",
    value: function discard() {
      globals.unsavedChanges = false;
      closeSitebar();

      if (this.redraw.ghostPoly != null) {
        this.redraw.ghostPoly.remove();
        this.redraw.ghostPoly = null;
      }

      if (this.redraw.name != null && this.elements[this.redraw.name].marker != null) {
        // redraw OLD !!!
        this.elements[this.redraw.name].marker = this.createNode(this.redraw.name, this.redraw.pos);

        this.redraw.name = null;
      }

      if (this.shadowEdge != null) {
        this.shadowEdge.remove();
        this.shadowEdge = null;
      }

      this.addDefaultBind();
    }
  }, {
    key: "drawPolygon",
    value: function drawPolygon(name) {
      var _this8 = this;

      var currentPoints = [],
          that = this;

      if (this.elements[name].marker != null) {
        this.redraw.pos = this.elements[name].marker.getLatLngs()[0];
        this.redraw.name = name;

        this.elements[name].marker.remove();
      }

      modal("Info", "Start adding Points to the map. You need to add at least 3 Points to the Map. Click submit when you are done.");
      globals.unsavedChanges = true;

      this.removeClickListener();
      updateBodyPoly();

      this.map.on('click', function (e) {
        if (_this8.redraw.ghostPoly != null) {
          _this8.redraw.ghostPoly.remove();
        }

        currentPoints.push([e.latlng.lat, e.latlng.lng]);

        _this8.redraw.ghostPoly = L.polygon(currentPoints, {}).addTo(_this8.map);
        updateBodyPoly();
      });

      function updateBodyPoly() {
        var wktText = arrayToPolygonWkt(currentPoints);

        // if (name != null) {
        that.sidebarTextPolyPlacement(wktText, name);
        /* } else {
            that.sidebarTextPolyCreation(wktText, $(".createPolyForm input#name").val())
        }*/

        $(".createPolyForm").submit(function (e) {
          e.preventDefault();
          if (currentPoints.length > 2) {
            if (name != null) {
              sendEvent("data", {
                task: "updatePosition",
                data: readForm(".createPolyForm")
              });
              sendEvent("sidebar", {
                task: "showId",
                data: name
              });

              that.checkCountNoPosElements();
            } else {
              var fromData = readForm(".createPolyForm");
              sendEvent("data", {
                task: "addNode",
                data: fromData
              });
            }

            that.addDefaultBind();
            that.redraw.ghostPoly.remove();
            that.redraw.ghostPoly = null;
            currentPoints = [];

            globals.unsavedChanges = false;
          } else {
            modal("Alarm", "At least 3 points required");
          }
        });

        $(".resetPoly").on("click", function (e) {
          if (that.redraw.ghostPoly != null) that.redraw.ghostPoly.remove();

          that.redraw.ghostPoly = null;
          currentPoints = [];
          return false;
        });

        $(".cancel").on("click", function (e) {
          that.discard();
          return false;
        });

        $(".revertPoly").on("click", function (e) {
          if (that.redraw.ghostPoly != null) that.redraw.ghostPoly.remove();
          if (currentPoints.length >= 1) currentPoints.pop();

          that.redraw.ghostPoly = L.polygon(currentPoints, {}).addTo(that.map);
          updateBodyPoly();
          return false;
        });
      }
    }
  }, {
    key: "drawLine",
    value: function drawLine(name) {
      var _this9 = this;

      var currentPoints = [],
          that = this;

      if (this.elements[name].marker != null) {
        this.redraw.pos = this.elements[name].marker.getLatLngs();
        this.redraw.name = name;

        this.elements[name].marker.remove();
      }

      modal("Info", "Start adding Points to the map. You need to add at least 2 Points to the Map. Click submit when you are done.");
      globals.unsavedChanges = true;

      this.removeClickListener();
      updateBodyPoly();

      this.map.on('click', function (e) {
        if (_this9.redraw.ghostPoly != null) {
          _this9.redraw.ghostPoly.remove();
        }

        currentPoints.push([e.latlng.lat, e.latlng.lng]);

        _this9.redraw.ghostPoly = L.polyline(currentPoints, {}).addTo(_this9.map);
        updateBodyPoly();
      });

      function updateBodyPoly() {
        var wktText = arrayToPolylineWkt(currentPoints);

        that.sidebarTextPolyPlacement(wktText, name);
        /*if (name != null) {
          } else {
            that.sidebarTextPolyCreation(wktText, $(".createPolyForm input#name").val())
        }*/

        $(".createPolyForm").submit(function (e) {
          e.preventDefault();
          if (currentPoints.length > 2) {
            if (name != null) {
              sendEvent("data", {
                task: "updatePosition",
                data: readForm(".createPolyForm")
              });
              sendEvent("sidebar", {
                task: "showId",
                data: name
              });

              that.checkCountNoPosElements();
            } else {
              var fromData = readForm(".createPolyForm");
              sendEvent("data", {
                task: "addNode",
                data: fromData
              });
            }

            that.addDefaultBind();
            that.redraw.ghostPoly.remove();
            that.redraw.ghostPoly = null;
            currentPoints = [];

            globals.unsavedChanges = false;
          } else {
            modal("Alarm", "At least 3 points required");
          }
        });

        $(".resetPoly").on("click", function (e) {
          if (that.redraw.ghostPoly != null) that.redraw.ghostPoly.remove();

          that.redraw.ghostPoly = null;
          currentPoints = [];
          return false;
        });

        $(".cancel").on("click", function (e) {
          that.discard();
          return false;
        });

        $(".revertPoly").on("click", function (e) {
          if (that.redraw.ghostPoly != null) that.redraw.ghostPoly.remove();
          if (currentPoints.length >= 1) currentPoints.pop();

          that.redraw.ghostPoly = L.polyline(currentPoints, {}).addTo(that.map);
          updateBodyPoly();
          return false;
        });
      }
    }
  }, {
    key: "addDefaultBind",
    value: function addDefaultBind() {
      this.map.off("click").off("mousemove").on("click", function (e) {
        closeSitebar();
      });

      var _loop = function _loop(property, data) {
        if (data.marker != null) {
          data.marker.off("click").off("mouseover").off("mouseout").on("click", function () {
            sendEvent("sidebar", {
              task: "showId",
              data: property
            });
          });
          //.bindPopup(property)
        }
      };

      var _iteratorNormalCompletion6 = true;
      var _didIteratorError6 = false;
      var _iteratorError6 = undefined;

      try {
        for (var _iterator6 = Object.entries(this.elements)[Symbol.iterator](), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
          var _ref11 = _step6.value;

          var _ref12 = _slicedToArray(_ref11, 2);

          var property = _ref12[0];
          var data = _ref12[1];

          _loop(property, data);
        }
      } catch (err) {
        _didIteratorError6 = true;
        _iteratorError6 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion6 && _iterator6.return) {
            _iterator6.return();
          }
        } finally {
          if (_didIteratorError6) {
            throw _iteratorError6;
          }
        }
      }
    }
  }, {
    key: "removeClickListener",
    value: function removeClickListener() {
      var _iteratorNormalCompletion7 = true;
      var _didIteratorError7 = false;
      var _iteratorError7 = undefined;

      try {
        for (var _iterator7 = Object.entries(this.elements)[Symbol.iterator](), _step7; !(_iteratorNormalCompletion7 = (_step7 = _iterator7.next()).done); _iteratorNormalCompletion7 = true) {
          var _ref13 = _step7.value;

          var _ref14 = _slicedToArray(_ref13, 2);

          var property = _ref14[0];
          var data = _ref14[1];

          if (data.marker != null) {
            data.marker.off("click");
          }
        }
      } catch (err) {
        _didIteratorError7 = true;
        _iteratorError7 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion7 && _iterator7.return) {
            _iterator7.return();
          }
        } finally {
          if (_didIteratorError7) {
            throw _iteratorError7;
          }
        }
      }
    }
  }, {
    key: "connectSuccessor",
    value: function connectSuccessor(evt, name) {
      var _this10 = this;

      var evtFromTarget = event.target || event.cyTarget,
          fromPos = this.getCoordinates(name),
          hoverNode = false,
          mousePos = evt.latlng;

      globals.unsavedChanges = true;

      this.shadowEdge = L.polyline([fromPos, mousePos], {
        weight: 5,
        clickable: false,
        color: "black"
      });

      this.shadowEdge.addTo(this.map).bringToBack();

      this.map.on("mousemove", function (e) {
        if (!hoverNode) {
          _this10.shadowEdge.setLatLngs([fromPos, e.latlng]);
        }
      });

      this.map.on("click", function (e) {
        globals.unsavedChanges = false;
        _this10.shadowEdge.remove();
        _this10.addDefaultBind();
      });

      // add onclick Marker

      var _loop2 = function _loop2(property, data) {
        if (property != name) {
          if (data.marker != null) {
            data.marker.on("mouseover", function () {
              hoverNode = true;
              _this10.shadowEdge.setLatLngs([fromPos, _this10.getCoordinates(property)]);
            });

            data.marker.on("mouseout", function () {
              hoverNode = false;
              _this10.shadowEdge.setLatLngs([fromPos, _this10.getCoordinates(property)]);
            });

            data.marker.off("click").on("click", function () {
              globals.unsavedChanges = false;
              _this10.shadowEdge.remove();
              _this10.shadowEdge = null;
              _this10.addDefaultBind();

              sendEvent("data", {
                task: "addEdge",
                data: {
                  from: name,
                  to: property
                }
              });

              sendEvent("sidebar", {
                task: "showId",
                data: property
              });
            });
          }
        }
      };

      var _iteratorNormalCompletion8 = true;
      var _didIteratorError8 = false;
      var _iteratorError8 = undefined;

      try {
        for (var _iterator8 = Object.entries(this.elements)[Symbol.iterator](), _step8; !(_iteratorNormalCompletion8 = (_step8 = _iterator8.next()).done); _iteratorNormalCompletion8 = true) {
          var _ref15 = _step8.value;

          var _ref16 = _slicedToArray(_ref15, 2);

          var property = _ref16[0];
          var data = _ref16[1];

          _loop2(property, data);
        }
      } catch (err) {
        _didIteratorError8 = true;
        _iteratorError8 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion8 && _iterator8.return) {
            _iterator8.return();
          }
        } finally {
          if (_didIteratorError8) {
            throw _iteratorError8;
          }
        }
      }
    }
  }, {
    key: "addNode",
    value: function addNode(name, type) {
      var pos = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
      var geometry_type = arguments[3];

      this.elements[name] = {
        successors: {},
        marker: null,
        type: type,
        geometry_type: geometry_type
      };

      if (pos != null) {
        if (typeof pos.lng != "undefined" && typeof pos.lat != "undefined" && geometry_type == "point" || typeof pos.wkt != "undefined" && geometry_type == "polygon" || typeof pos.wkt != "undefined" && geometry_type == "line") {
          this.elements[name].marker = this.createNode(name, pos);
        } else {
          this.showButtonAddNodes();
        }
      } else {
        this.showButtonAddNodes();
      }
    }
  }, {
    key: "addNodes",
    value: function addNodes(childs) {
      var _this11 = this;

      childs.forEach(function (child) {
        _this11.addNode(child.name, child.type, child.pos, child.geometry_type);
      });

      childs.forEach(function (child) {
        child.successors.forEach(function (succ) {
          //let index = childs.findIndex(x => x.name == succ)
          if (typeof _this11.elements[succ] != "undefined") {
            _this11.addEdge(child.name, succ);
          }
        });
        child.predecessors.forEach(function (pred) {
          if (typeof _this11.elements[pred] != "undefined") {
            if (typeof _this11.elements[pred].successors[child.name] == "undefined") {
              _this11.addEdge(pred, child.name);
            }
          }
        });
      });
    }
  }, {
    key: "getNoPosElements",
    value: function getNoPosElements() {
      var _this12 = this;

      var dragContainer = $("<div class=\"dragContainer\"></div>"),
          polyContainer = $("<div class=\"listContainer\"></div>"),
          list = $("<div class=\"list-group\"></div>"),
          body = $("<div></div>");

      polyContainer.append(list);

      var _loop3 = function _loop3(property, data) {
        if (data.marker == null) {
          if (data.geometry_type == "polygon" || data.geometry_type == "line") {
            var li = $("<a class=\"list-group-item\" href=\"#\">" + property + "</a>");
            li.on("click", function (e) {
              if (data.geometry_type == "polygon") {
                _this12.drawPolygon(property);
              } else {
                _this12.drawLine(property);
              }
            });
            list.append(li);
          } else {
            var letEle = $("<div class=\"dragArticle\"></div>");

            var imgClone = $("<img>").prop("src", config.markerSettings.src).prop("data-name", property).prop("class", "dragImg").prop("width", config.markerSettings.width).prop("height", config.markerSettings.height);

            letEle.append('<p class="dragMarkerName">' + property + '</p>');
            letEle.append(imgClone);
            dragContainer.append(letEle);
          }
        }
      };

      var _iteratorNormalCompletion9 = true;
      var _didIteratorError9 = false;
      var _iteratorError9 = undefined;

      try {
        for (var _iterator9 = Object.entries(this.elements)[Symbol.iterator](), _step9; !(_iteratorNormalCompletion9 = (_step9 = _iterator9.next()).done); _iteratorNormalCompletion9 = true) {
          var _ref17 = _step9.value;

          var _ref18 = _slicedToArray(_ref17, 2);

          var property = _ref18[0];
          var data = _ref18[1];

          _loop3(property, data);
        }
      } catch (err) {
        _didIteratorError9 = true;
        _iteratorError9 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion9 && _iterator9.return) {
            _iterator9.return();
          }
        } finally {
          if (_didIteratorError9) {
            throw _iteratorError9;
          }
        }
      }

      if (dragContainer.find("div").length > 0) {
        body.append("<p>Drag Makers into Map</p>");
        body.append(dragContainer);
      }
      if (list.find("a").length > 0) {
        body.append("<p>Click element to start adding area</p>");
        body.append(polyContainer);
      }

      return body;
    }
  }, {
    key: "checkCountNoPosElements",
    value: function checkCountNoPosElements() {
      var count = 0;
      var _iteratorNormalCompletion10 = true;
      var _didIteratorError10 = false;
      var _iteratorError10 = undefined;

      try {
        for (var _iterator10 = Object.entries(this.elements)[Symbol.iterator](), _step10; !(_iteratorNormalCompletion10 = (_step10 = _iterator10.next()).done); _iteratorNormalCompletion10 = true) {
          var _ref19 = _step10.value;

          var _ref20 = _slicedToArray(_ref19, 2);

          var property = _ref20[0];
          var data = _ref20[1];

          if (data.marker == null) count += 1;
        }
      } catch (err) {
        _didIteratorError10 = true;
        _iteratorError10 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion10 && _iterator10.return) {
            _iterator10.return();
          }
        } finally {
          if (_didIteratorError10) {
            throw _iteratorError10;
          }
        }
      }

      if (count == 0) this.alertButton.hide();

      return count;
    }
  }, {
    key: "registerDragEvents",
    value: function registerDragEvents(eles) {
      var srcEle = null,
          srcName = null,
          that = this,
          added = false;

      eles.each(function (index, item) {
        item.addEventListener('dragstart', handleDragStart, false);
        item.addEventListener('dragend', handleDragEnd, false);
      });

      $("#" + config.dom.mapContainerId).off('dragenter').off('drop').off('dragleave').on('dragenter', handleDragEnter).on('drop', handleDrop).on('dragleave', handleDragLeave);

      function handleDragStart(e) {
        srcEle = $(this);
        srcName = srcEle.parent().find("p").text();
        srcEle.parent().addClass('moving');
        added = false;

        var img = new Image();
        img.crossOrigin = "anonymous";
        img.src = srcEle.prop("src");

        var canvas = document.createElement('canvas');
        canvas.width = "25";
        canvas.height = "41";
        var context = canvas.getContext('2d');
        context.drawImage(img, 0, 0);

        var canvasImage = new Image();
        canvasImage.crossOrigin = "anonymous";
        canvasImage.src = canvas.toDataURL();

        document.body.append(canvasImage);

        e.dataTransfer.setDragImage(canvasImage, 0, 0);
      }

      function handleDragEnter(e) {
        // this / e.target is the current hover target.
        //this.classList.add('over')
      }

      function handleDragLeave(e) {
        // this / e.target is previous target element.
        //this.classList.remove('over')
      }

      function handleDrop(e) {
        if (e.stopPropagation) {
          e.stopPropagation();
        }
        e.preventDefault();
        var mousePos = that.map.mouseEventToLatLng(e);
        added = true;

        sendEvent("data", {
          task: "updatePosition",
          data: {
            name: srcName,
            pos: mousePos
          }
        });

        this.classList.remove('over');

        if (that.checkCountNoPosElements() == 0) {
          closeSitebar();
        }

        return false;
      }

      function handleDragEnd(e) {
        if (added) {
          srcEle.parent().remove();
        } else {
          srcEle.parent().removeClass('moving');
        }
        srcEle = null;
        srcName = null;
      }
    }
  }, {
    key: "showButtonAddNodes",
    value: function showButtonAddNodes() {
      this.alertButton.show();
    }
  }, {
    key: "deleteNode",
    value: function deleteNode(name) {
      var deleteRefs = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;
      var _iteratorNormalCompletion11 = true;
      var _didIteratorError11 = false;
      var _iteratorError11 = undefined;

      try {
        for (var _iterator11 = Object.entries(this.elements)[Symbol.iterator](), _step11; !(_iteratorNormalCompletion11 = (_step11 = _iterator11.next()).done); _iteratorNormalCompletion11 = true) {
          var _ref21 = _step11.value;

          var _ref22 = _slicedToArray(_ref21, 2);

          var k = _ref22[0];
          var v = _ref22[1];

          if (k != name) {
            var _iteratorNormalCompletion12 = true;
            var _didIteratorError12 = false;
            var _iteratorError12 = undefined;

            try {
              for (var _iterator12 = Object.entries(this.elements[k].successors)[Symbol.iterator](), _step12; !(_iteratorNormalCompletion12 = (_step12 = _iterator12.next()).done); _iteratorNormalCompletion12 = true) {
                var _ref23 = _step12.value;

                var _ref24 = _slicedToArray(_ref23, 2);

                var succ = _ref24[0];
                var obj = _ref24[1];

                if (succ == name) {
                  if (obj.arrow != null) {
                    this.map.removeLayer(obj.arrow);
                    this.map.removeLayer(obj.head);
                    obj.arrow = null;
                    obj.head = null;
                  }
                  if (deleteRefs) delete this.elements[k].successors[succ];
                }
              }
            } catch (err) {
              _didIteratorError12 = true;
              _iteratorError12 = err;
            } finally {
              try {
                if (!_iteratorNormalCompletion12 && _iterator12.return) {
                  _iterator12.return();
                }
              } finally {
                if (_didIteratorError12) {
                  throw _iteratorError12;
                }
              }
            }
          } else {
            if (this.elements[name].marker != null) {
              this.map.removeLayer(this.elements[name].marker);
              this.elements[name].marker = null;
              var _iteratorNormalCompletion13 = true;
              var _didIteratorError13 = false;
              var _iteratorError13 = undefined;

              try {
                for (var _iterator13 = Object.entries(this.elements[k].successors)[Symbol.iterator](), _step13; !(_iteratorNormalCompletion13 = (_step13 = _iterator13.next()).done); _iteratorNormalCompletion13 = true) {
                  var _ref25 = _step13.value;

                  var _ref26 = _slicedToArray(_ref25, 2);

                  var _succ2 = _ref26[0];
                  var _obj2 = _ref26[1];

                  if (_obj2.arrow != null) {
                    this.map.removeLayer(_obj2.arrow);
                    this.map.removeLayer(_obj2.head);
                    _obj2.arrow = null;
                    _obj2.head = null;
                  }
                }
              } catch (err) {
                _didIteratorError13 = true;
                _iteratorError13 = err;
              } finally {
                try {
                  if (!_iteratorNormalCompletion13 && _iterator13.return) {
                    _iterator13.return();
                  }
                } finally {
                  if (_didIteratorError13) {
                    throw _iteratorError13;
                  }
                }
              }
            }
            if (deleteRefs) delete this.elements[name];
          }
        }
      } catch (err) {
        _didIteratorError11 = true;
        _iteratorError11 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion11 && _iterator11.return) {
            _iterator11.return();
          }
        } finally {
          if (_didIteratorError11) {
            throw _iteratorError11;
          }
        }
      }
    }
  }, {
    key: "addEdge",
    value: function addEdge(from, to) {
      if (this.elements[from].marker != null && this.elements[to].marker != null) {
        var arrow = L.polyline([this.getCoordinates(from), this.getCoordinates(to)], {
          weight: 5,
          color: "#9dbaea",
          contextmenu: true,
          contextmenuItems: [{
            text: 'Delete Edge',
            index: 0,
            callback: function callback(e) {
              sendEvent("data", {
                task: "deleteEdge",
                data: {
                  from: from,
                  to: to
                }
              });
            }
          }, {
            separator: true,
            index: 1
          }]
        }).addTo(this.map);

        var arrowHead = L.polylineDecorator(arrow).addTo(this.map);
        arrowHead.setPatterns([{
          offset: '100%',
          repeat: 0,
          symbol: L.Symbol.arrowHead({
            polygon: false,
            pathOptions: {
              stroke: true,
              color: "#9dbaea"
            }
          })
        }]);

        if (typeof this.elements[from].successors[to] != "undefined") {
          if (this.elements[from].successors[to].arrow != null) {
            console.log(this.elements[from].successors[to].arrow);
            this.map.removeLayer(this.elements[from].successors[to].arrow);
            this.map.removeLayer(this.elements[from].successors[to].head);
          }
        }

        this.elements[from].successors[to] = {
          arrow: arrow,
          head: arrowHead
        };
      } else {
        this.elements[from].successors[to] = {
          arrow: null,
          head: null
        };
      }
    }
  }, {
    key: "getCoordinates",
    value: function getCoordinates(name) {
      if (this.elements[name].geometry_type == "polygon" || this.elements[name].geometry_type == "line") {
        // different implementations for polygons can be found here
        // https://stackoverflow.com/questions/22796520/finding-the-center-of-leaflet-polygon
        return this.elements[name].marker.getBounds().getCenter();
      } else {
        return this.elements[name].marker.getLatLng();
      }
    }
  }, {
    key: "deleteEdge",
    value: function deleteEdge(from, to) {
      if (this.elements[from].successors[to].arrow != null) {
        this.map.removeLayer(this.elements[from].successors[to].arrow);
        this.map.removeLayer(this.elements[from].successors[to].head);
        this.elements[from].successors[to].arrow = null;
        this.elements[from].successors[to].head = null;
      }
      delete this.elements[from].successors[to];
    }
  }, {
    key: "updatePosition",
    value: function updatePosition(name, pos) {
      // checck if already on Map
      if (this.elements[name].marker != null) {
        if (this.elements[name].geometry_type == "polygon" || this.elements[name].geometry_type == "line") {
          this.elements[name].marker.remove();
          this.elements[name].marker = this.createNode(name, pos);
        } else {
          this.elements[name].marker.setLatLng(pos);
        }
        // Update Connections
        var _iteratorNormalCompletion14 = true;
        var _didIteratorError14 = false;
        var _iteratorError14 = undefined;

        try {
          for (var _iterator14 = Object.entries(this.elements)[Symbol.iterator](), _step14; !(_iteratorNormalCompletion14 = (_step14 = _iterator14.next()).done); _iteratorNormalCompletion14 = true) {
            var _ref27 = _step14.value;

            var _ref28 = _slicedToArray(_ref27, 2);

            var prob = _ref28[0];
            var data = _ref28[1];

            if (prob == name) {
              var _iteratorNormalCompletion15 = true;
              var _didIteratorError15 = false;
              var _iteratorError15 = undefined;

              try {
                for (var _iterator15 = Object.entries(data.successors)[Symbol.iterator](), _step15; !(_iteratorNormalCompletion15 = (_step15 = _iterator15.next()).done); _iteratorNormalCompletion15 = true) {
                  var _ref29 = _step15.value;

                  var _ref30 = _slicedToArray(_ref29, 2);

                  var succ = _ref30[0];
                  var obj = _ref30[1];

                  this.deleteEdge(name, succ);
                  this.addEdge(name, succ);
                }
              } catch (err) {
                _didIteratorError15 = true;
                _iteratorError15 = err;
              } finally {
                try {
                  if (!_iteratorNormalCompletion15 && _iterator15.return) {
                    _iterator15.return();
                  }
                } finally {
                  if (_didIteratorError15) {
                    throw _iteratorError15;
                  }
                }
              }
            } else {
              var _iteratorNormalCompletion16 = true;
              var _didIteratorError16 = false;
              var _iteratorError16 = undefined;

              try {
                for (var _iterator16 = Object.entries(data.successors)[Symbol.iterator](), _step16; !(_iteratorNormalCompletion16 = (_step16 = _iterator16.next()).done); _iteratorNormalCompletion16 = true) {
                  var _ref31 = _step16.value;

                  var _ref32 = _slicedToArray(_ref31, 2);

                  var _succ3 = _ref32[0];
                  var _obj3 = _ref32[1];

                  if (_succ3 == name) {
                    this.deleteEdge(prob, name);
                    this.addEdge(prob, name);
                  }
                }
              } catch (err) {
                _didIteratorError16 = true;
                _iteratorError16 = err;
              } finally {
                try {
                  if (!_iteratorNormalCompletion16 && _iterator16.return) {
                    _iterator16.return();
                  }
                } finally {
                  if (_didIteratorError16) {
                    throw _iteratorError16;
                  }
                }
              }
            }
          }
        } catch (err) {
          _didIteratorError14 = true;
          _iteratorError14 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion14 && _iterator14.return) {
              _iterator14.return();
            }
          } finally {
            if (_didIteratorError14) {
              throw _iteratorError14;
            }
          }
        }
      }
      // create Node and Successors
      else {
          this.elements[name].marker = this.createNode(name, pos);

          // check succs
          var _iteratorNormalCompletion17 = true;
          var _didIteratorError17 = false;
          var _iteratorError17 = undefined;

          try {
            for (var _iterator17 = Object.entries(this.elements)[Symbol.iterator](), _step17; !(_iteratorNormalCompletion17 = (_step17 = _iterator17.next()).done); _iteratorNormalCompletion17 = true) {
              var _ref33 = _step17.value;

              var _ref34 = _slicedToArray(_ref33, 2);

              var _prob = _ref34[0];
              var _data = _ref34[1];

              if (_prob == name) {
                var _iteratorNormalCompletion18 = true;
                var _didIteratorError18 = false;
                var _iteratorError18 = undefined;

                try {
                  for (var _iterator18 = Object.entries(_data.successors)[Symbol.iterator](), _step18; !(_iteratorNormalCompletion18 = (_step18 = _iterator18.next()).done); _iteratorNormalCompletion18 = true) {
                    var _ref35 = _step18.value;

                    var _ref36 = _slicedToArray(_ref35, 2);

                    var _succ4 = _ref36[0];
                    var _obj4 = _ref36[1];

                    // check if marker already exists
                    if (this.elements[_succ4].marker != null) {
                      this.addEdge(name, _succ4);
                    }
                  }
                } catch (err) {
                  _didIteratorError18 = true;
                  _iteratorError18 = err;
                } finally {
                  try {
                    if (!_iteratorNormalCompletion18 && _iterator18.return) {
                      _iterator18.return();
                    }
                  } finally {
                    if (_didIteratorError18) {
                      throw _iteratorError18;
                    }
                  }
                }
              } else {
                var _iteratorNormalCompletion19 = true;
                var _didIteratorError19 = false;
                var _iteratorError19 = undefined;

                try {
                  for (var _iterator19 = Object.entries(_data.successors)[Symbol.iterator](), _step19; !(_iteratorNormalCompletion19 = (_step19 = _iterator19.next()).done); _iteratorNormalCompletion19 = true) {
                    var _ref37 = _step19.value;

                    var _ref38 = _slicedToArray(_ref37, 2);

                    var _succ5 = _ref38[0];
                    var _obj5 = _ref38[1];

                    if (_succ5 == name) {
                      if (_data.marker != null) {
                        this.addEdge(_prob, name);
                      }
                    }
                  }
                } catch (err) {
                  _didIteratorError19 = true;
                  _iteratorError19 = err;
                } finally {
                  try {
                    if (!_iteratorNormalCompletion19 && _iterator19.return) {
                      _iterator19.return();
                    }
                  } finally {
                    if (_didIteratorError19) {
                      throw _iteratorError19;
                    }
                  }
                }
              }
            }
          } catch (err) {
            _didIteratorError17 = true;
            _iteratorError17 = err;
          } finally {
            try {
              if (!_iteratorNormalCompletion17 && _iterator17.return) {
                _iterator17.return();
              }
            } finally {
              if (_didIteratorError17) {
                throw _iteratorError17;
              }
            }
          }
        }
    }
  }, {
    key: "showCoordinates",
    value: function showCoordinates(e) {
      modal("Coordinates", "Latitude: " + e.latlng.lat + "</br>Longitude: " + e.latlng.lng);
    }
  }, {
    key: "centerMap",
    value: function centerMap(e) {
      var markers = [];
      var _iteratorNormalCompletion20 = true;
      var _didIteratorError20 = false;
      var _iteratorError20 = undefined;

      try {
        for (var _iterator20 = Object.entries(this.elements)[Symbol.iterator](), _step20; !(_iteratorNormalCompletion20 = (_step20 = _iterator20.next()).done); _iteratorNormalCompletion20 = true) {
          var _ref39 = _step20.value;

          var _ref40 = _slicedToArray(_ref39, 2);

          var k = _ref40[0];
          var v = _ref40[1];

          if (v.marker != null) markers.push(v.marker);
        }
      } catch (err) {
        _didIteratorError20 = true;
        _iteratorError20 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion20 && _iterator20.return) {
            _iterator20.return();
          }
        } finally {
          if (_didIteratorError20) {
            throw _iteratorError20;
          }
        }
      }

      if (markers.length > 0) {
        var group = new L.featureGroup(markers);
        this.map.fitBounds(group.getBounds().pad(0.3));
      }
    }
  }, {
    key: "zoomIn",
    value: function zoomIn(e) {
      this.map.zoomIn();
    }
  }, {
    key: "zoomOut",
    value: function zoomOut(e) {
      this.map.zoomOut();
    }
  }]);

  return LeafleatMap;
}();
"use strict";

function modal() {
	var head = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : "";
	var content = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "";
	var abortFunction = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : function () {};

	// Get the modal
	var modal = $(config.dom.modal.container);
	var backdrop = $(config.dom.modal.backdrop);
	$(config.dom.modal.heading).text(head);
	$(config.dom.modal.body).html(content);

	// Move success buttons to footer
	modal.find(".modal-footer .btn-success").remove();
	modal.find(".modal-body .btn-success").insertAfter('.modal-footer .btn-default');
	modal.find(".modal-footer .btn-success").on("click", function (e) {
		modal.find("form").submit();
	});

	// Get the <span> element that closes the modal
	modal.addClass("in");
	backdrop.addClass("in");

	window.setTimeout(function () {
		modal.off("click").on("click", function (event) {
			if ($(event.target).hasClass("modal")) {
				abortFunction();
				hideModal();
			}
		});

		modal.find(".modal-header .close, .modal-footer .btn-default").off("click").on("click", function (event) {
			abortFunction();
			hideModal();
		});
	}, 100);

	// 
}
"use strict";

function home() {
  var content = "Home";

  createContentPage("Saiv", content);
  setActiveMenuItem("home");
}
"use strict";

function nodeSettings() {
	var form = $("<form class='nodeSettingsForm'></form>");
	var heading = "Node Settings";

	form.append(createSelect("Nodes enabled", configNode.nodesEnabled, Object.keys(configNode.nodesAvailable), "multiple=\"multiple\""));

	if (configNode.allowCustomTags == true) {
		form.append('<div class="form-group"><label for="allowCustomTags">Allow custom Tags</label><input checked class="" type="checkbox" name="allowCustomTags"></div>');
	} else {
		form.append('<div class="form-group"><label for="allowCustomTags">Allow custom Tags</label><input class="" type="checkbox" name="allowCustomTags"></div>');
	}

	form.append('<button class="btn btn-success">Save</button>');

	form.submit(function (e) {
		e.preventDefault();
		var formData = readForm(".nodeSettingsForm");

		// Update Nodes Enabled
		if (configNode.nodesEnabled.toString() !== formData["Nodes enabled"].toString()) {
			sendEvent("data", {
				task: "updateNodesEnabled",
				data: formData["Nodes enabled"]
			});
		}

		if (typeof formData.allowCustomTags != "undefined") {
			configNode.allowCustomTags = true;
		} else {
			configNode.allowCustomTags = false;
		}

		hideModal();
	});

	$('select', form).select2({ width: "100%" });
	modal(heading, form);
}
"use strict";

function scenario() {
	var data = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;

	var form = $("<form class='scenarioForm'></form>");
	var heading = "";

	// EditForm
	if (data != null) {
		heading = "Edit Scenario";
		form.append(createInput("currentId", "currentId", data.name, "hidden", true)).append(createInput("Name", "name", data.name, "text", true)).append(createInput("Description", "tags_description", data.description, "text")).append("<button class='btn-success btn'>Save</button>");
	}
	// create new Scenario
	else {
			heading = "Create Scenario";
			form.append(createInput("Name", "name", "", "text", true)).append(createInput("Description", "tags_description", "", "text")).append("<button class='btn-success btn'>Create</button>");
		}

	form.submit(function (e) {
		e.preventDefault();
		var formData = readForm(".scenarioForm");

		// CreateForm
		if (typeof formData.currentId == "undefined") {
			sendEvent("dataReceived", {
				name: formData.name,
				tags: {
					description: formData.tags.description
				},
				children: []
			});
		}
		// Edit Form
		else {
				sendEvent("data", {
					task: "updateScenario",
					data: formData
				});
			}

		hideModal();
	});

	modal(heading, form);
}
"use strict";

function openJsonSelection() {
  var content = $("<div></div>");
  content.append("<p>Select File</p>").append("<p><label class='btn btn-default'>Browse <input type='file' id='selectFile' hidden></label></p>").append("<button id='useDefault' class='btn btn-primary'>Use default</button>").append("<button class='createScenario btn btn-success pull-right'>Create new scenario</button>");

  modal("Select File", content);

  $("#selectFile").on('change', function (event) {
    var input = event.target;
    sendFile(input.files[0]);
  });

  $("#useDefault").on('click', function () {
    $.getJSON("minimal-example.json", function (jsonData) {
      sendEvent("dataReceived", jsonData);
      hideModal();
    }).fail(function (er) {
      modal("Error", "Cross orgin error. Choose json file above or drop it.");
    });
  });

  $(".createScenario").on('click', function () {
    scenario();
  });
}

function sendFile(file) {
  var reader = new FileReader();

  reader.onload = function () {
    var dataURL = reader.result;
    try {
      var json = JSON.parse(dataURL);
      sendEvent("dataReceived", json);
      hideModal();
    } catch (e) {
      modal("Error", "File not supported");
    }
  };

  reader.readAsText(file);
}

function initDropEvents() {
  document.addEventListener('dragover', function (e) {
    e.preventDefault();
  });

  document.addEventListener("drop", function (e) {
    e.preventDefault();
    var json = e.dataTransfer.files[0];

    sendFile(e.dataTransfer.files[0]);
  });
}
"use strict";

function selectStyle() {
	var currentStyle = localStorage.getItem("style") ? localStorage.getItem("style") : config.cytoscape.defaultStyle;
	var currentAutoLayout = localStorage.getItem("autoLayout") ? localStorage.getItem("autoLayout") : globals.autoLayout;
	var form = $('<form class="editStyle selectStyle"></form>');

	form.append(createSelect("style", [currentStyle], config.cytoscape.styles));

	if (currentAutoLayout == "true") {
		form.append('<div class="form-group"><label for="autoLayout">Relayout Explorer after adding Elements</label><input checked class="" type="checkbox" name="autoLayout"></div>');
	} else {
		form.append('<div class="form-group"><label for="autoLayout">Relayout Explorer after adding Elements</label><input class="" type="checkbox" name="autoLayout"></div>');
	}

	form.append('<button class="btn btn-success">Save</button>');
	form.submit(function (e) {
		e.preventDefault();
		var data = readForm(".editStyle");

		if (typeof data.autoLayout != "undefined") {
			globals.autoLayout = "true";
		} else {
			globals.autoLayout = "false";
		}

		localStorage.setItem("style", data.style);
		localStorage.setItem("autoLayout", globals.autoLayout);

		sendEvent("dataChanged", {
			task: "updateStyle"
		});

		hideModal();
	});

	modal("Set Explorer Styles", form);
	$('.basic-select', form).select2();
}
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * DOM Ready
 */
var saiv = function () {
  function saiv() {
    _classCallCheck(this, saiv);

    this.dataManager = new DataManager();
    this.sb = new Sidebar(config.dom.sidebar);
    this.cy = new CyptoScape(config.dom.canvasContainer);
    this.map = new LeafleatMap(config.dom.mapContainerId);

    // Init File Drop Events
    initDropEvents();
    // Open Page home
    home();
  }

  _createClass(saiv, [{
    key: "init",
    value: function init() {
      /**
       * init menu listener
       */
      $(config.dom.links.json).click(function () {
        if (discardChanges()) {
          openJsonSelection();
        }
      });

      $(config.dom.links.home).click(function () {
        if (discardChanges()) {
          home();
        }
      });

      $(config.dom.links.style).click(function () {
        selectStyle();
      });

      $(config.dom.links.scenario).click(function () {
        scenario(dataManager.getScenario());
      });

      $(config.dom.links.nodeSettings).click(function () {
        nodeSettings();
      });

      document.addEventListener("discardChanges", function (e) {
        if ($(".navbar li.active").length == 1) {
          var activeLink = $(".navbar li.active").text();
          switch (activeLink) {
            case "Map":
              map.discard();
              break;
            case "Graph Explorer":
              cy.discard();
              break;
          }
        }
      });

      document.addEventListener("sidebar", function (e) {
        switch (e.detail.task) {
          case "showId":
            showId(e.detail.data);
            break;
          case "addNode":
            sb.addNode(e.detail.data.pos);
            break;
          case "show":
            sb.show(e.detail.data.head, e.detail.data.body);
            break;
        }
      });

      // Init Event Reciver
      document.addEventListener("dataReceived", function (e) {
        initListenerDataRevieved();
        dataManager.json = e.detail;

        sendEvent("dataChanged", {
          task: "initElements",
          data: dataManager.json
        });

        showGraph();
      });

      function showId(id) {
        var data = dataManager.getElement(id);

        sb.updateNodeForm(data, dataManager.getAllElements());
      }

      function initListenerDataRevieved() {
        $(config.dom.links.graph).off("click").on("click", function () {
          if (discardChanges()) {
            setActiveMenuItem("Explorer");
            showGraph();
          }
        }).click();

        $(config.dom.links.map).off("click").on("click", function () {
          if (discardChanges()) {
            setActiveMenuItem("Map");
            showMap();
          }
        }).parent("li").removeClass("disabled");

        $(config.dom.links.download).off("click").on("click", function () {
          var bool = confirm("Attach Explorer Positions to json?");
          var data = dataManager.json;
          data.children = dataManager.getAllElements();
          var urlString = "text/json;charset=utf-8,";

          if (bool) {
            for (var i = 0; i < data.children.length; i++) {
              if (typeof data.children[i].pos == "undefined") data.children[i].pos = {};
              Object.assign(data.children[i].pos, cy.$("#" + data.children[i].name).position());
            }
          } else {
            for (var _i = 0; _i < data.children.length; _i++) {
              if (typeof data.children[_i].pos != "undefined") {
                if (typeof data.children[_i].pos.x != "undefined") delete data.children[_i].pos.x;
                if (typeof data.children[_i].pos.y != "undefined") delete data.children[_i].pos.y;
              }
            }
          }
          urlString += encodeURIComponent(JSON.stringify(data));

          $(config.dom.links.download).prop("href", "data:" + urlString);
          $(config.dom.links.download).prop("download", "data.json");
        }).parent("li").removeClass("disabled");
      }
    }
  }]);

  return saiv;
}();

exports.default = saiv;
'use strict';

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Sidebar = function () {
  function Sidebar(selector) {
    _classCallCheck(this, Sidebar);

    this.container = $(selector);
    this.head = $('<div class="head"></div>');
    this.body = $('<div class="body"></div>');
    this.container.append(this.head);
    this.container.append(this.body);
  }

  _createClass(Sidebar, [{
    key: 'showData',
    value: function showData(data) {
      this.open();
      this.head.html(JSON.stringify(data));
    }
  }, {
    key: 'show',
    value: function show($head, $body) {
      this.open();
      this.head.html("").append($head);
      this.body.html("").append($body);
    }
  }, {
    key: 'addTag',
    value: function addTag(ready) {
      this.open();
      this.head.html("").append("<h4>Add Tag</h4>");
      this.body.html("");
      var form = $('<form class="editForm"></form>');

      form.append(createInput("Tag name", "tag", "", "text", true)).append('<button class="btn btn-success">Add</button>').append('<a class="btn btn-warning cancelForm pull-right">Cancel</button>').submit(function (e) {
        e.preventDefault();
        ready(readForm(".editForm").tag);
      }).find("a.cancelForm").on("click", function (e) {
        ready(false);
        return false;
      });

      this.body.append(form);
    }
  }, {
    key: 'updateNodeForm',
    value: function updateNodeForm(data, nodes) {
      var _this = this;

      console.log("updateNodeForm");
      this.open();
      this.head.html("<h4>Update " + data.name + "</h4>");
      this.body.html("");
      var form = $('<form class="editForm"></form>');

      form.append(createInput("currentId", "currentId", data.name, "hidden")).append(createInput("Name", "name", data.name, "text")).append(createSelect("type", [data.type], Object.keys(configNode.nodesAvailable).map(function (k) {
        return k;
      })));

      if (typeof data.geometry_type != "undefined") form.append(createSelect("geometry_type", [data.geometry_type], configNode.nodesAvailable[data.type].geometryTypes));else form.append(createSelect("geometry_type", [], configNode.nodesAvailable[data.type].geometryTypes));

      form.append(this.createTags(data.tags, data.type));

      form.append(createSelect("predecessors", data.predecessors, nodes.filter(function (node) {
        return node != data.name;
      }), "multiple=\"multiple\"")).append(createSelect("successors", data.successors, nodes.filter(function (node) {
        return node != data.name;
      }), "multiple=\"multiple\""));

      $('.basic-select', form).select2();

      form.find(".addTag").on("click", function () {
        _this.addTag(function (newTag) {
          if (typeof newTag == "string") {
            sendEvent("data", {
              task: "addTag",
              data: {
                id: data.name,
                tag: newTag
              }
            });
          }

          sendEvent("sidebar", {
            task: "showId",
            data: data.name
          });
        });
      });

      // listen to changes of type
      // geometry type according to it
      this.updateGeometryTypeOnTypeChange(form);

      // update tags
      if (!configNode.allowCustomTags) {
        form.find("select[name='type']").on('change', function (e) {
          form.find('.formTags').replaceWith(_this.createTags(data.tags, form.find('select[name="type"]').val()));
        });
      }

      form.find('.removeTag').on("click", function () {
        var inputName = $(this).parent().parent().find("input").prop("name");
        var tag = inputName.substring(5, inputName.length);

        sendEvent("data", {
          task: "removeTag",
          data: {
            id: data.name,
            tag: tag
          }
        });

        sendEvent("sidebar", {
          task: "showId",
          data: data.name
        });
      });

      form.append('<button class="btn btn-success">Save</button>');
      form.append('<a class="btn btn-warning cancelForm pull-right">Cancel</a>');
      form.submit(function (e) {
        e.preventDefault();
        var test = readForm('.editForm');

        sendEvent("data", {
          task: "updateNode",
          data: test
        });

        _this.close();
      });
      form.find("a.cancelForm").on("click", function (e) {
        _this.close();
        return false;
      });

      this.body.append(form);
    }
  }, {
    key: 'createTags',
    value: function createTags(tags, type) {
      var div = $("<div class='formTags form-group'></div>");

      if (configNode.allowCustomTags) div.append('<h5>Tags <small><a href="#" class="addTag">Add Tag</a></small></h5>');else div.append('<h5>Tags</h5>');

      //if (!configNode.allowCustomTags) {
      configNode.nodesAvailable[type].tags.forEach(function (tag) {

        var input = $("<div class=\"input-group\"></div>");
        if (typeof tags[tag.name] != "undefined") {
          input.append('<input class="form-control" type="' + tag.type + '" name="tags_' + tag.name + '" value="' + tags[tag.name] + '"></input>');
        } else {
          input.append('<input class="form-control" type="' + tag.type + '" name="tags_' + tag.name + '" value=""></input>');
        }

        if (configNode.allowCustomTags) {
          input.append('<span class="input-group-btn"><a class="btn btn-danger removeTag">&times;</a></span>');
        }

        div.append('<label for="tags_' + tag.name + '">' + tag.name + '</label>').append(input);
      });

      // if didnt added above and custom tags are allowed

      var _loop = function _loop(key, value) {
        if (configNode.nodesAvailable[type].tags.findIndex(function (x) {
          return x.name == key;
        }) == -1) {
          var input = $("<div class=\"input-group\"></div>");
          if (configNode.allowCustomTags) {
            input.append('<input class="form-control" type="text" name="tags_' + key + '" value="' + value + '"></input>');
            input.append('<span class="input-group-btn"><a class="btn btn-danger removeTag">&times;</a></span>');
            div.append('<label for="tags_' + key + '">' + key + '</label>');
          } else {
            input = $('<input class="form-control" type="hidden" name="tags_' + key + '" value="' + value + '"></input>');
          }

          div.append(input);
        }
      };

      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = Object.entries(tags)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var _ref = _step.value;

          var _ref2 = _slicedToArray(_ref, 2);

          var key = _ref2[0];
          var value = _ref2[1];

          _loop(key, value);
        }

        //}
        /*// add current tags hidden
        }
        } else {
        for (let [key, value] of Object.entries(tags)) {
          }
        }*/
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator.return) {
            _iterator.return();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }

      return div;
    }
  }, {
    key: 'addNode',
    value: function addNode(pos) {
      var _this2 = this;

      this.open();
      this.head.html("Add Node");
      this.body.html("");

      var form = $('<form class="editForm"></form>');
      form.append(createInput("name", "name", "", "text", true));
      form.append(createSelect("type", [configNode.nodesEnabled], configNode.nodesEnabled, "required"));
      form.append(createSelect("geometry_type", [], configNode.nodesAvailable[configNode.nodesEnabled[0]].geometryTypes));

      var _iteratorNormalCompletion2 = true;
      var _didIteratorError2 = false;
      var _iteratorError2 = undefined;

      try {
        for (var _iterator2 = Object.entries(pos)[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
          var _ref3 = _step2.value;

          var _ref4 = _slicedToArray(_ref3, 2);

          var property = _ref4[0];
          var val = _ref4[1];

          form.append(createInput("pos_" + property, "pos_" + property, val, "hidden"));
        }
      } catch (err) {
        _didIteratorError2 = true;
        _iteratorError2 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion2 && _iterator2.return) {
            _iterator2.return();
          }
        } finally {
          if (_didIteratorError2) {
            throw _iteratorError2;
          }
        }
      }

      form.append('<button class="btn btn-success">Add</button>');
      form.append('<a class="btn btn-warning pull-right">Cancel</button>');

      $('.basic-select', form).select2();

      form.submit(function (e) {
        e.preventDefault();

        sendEvent("data", {
          task: "addNode",
          data: readForm(".editForm")
        });
      });
      form.find(".btn-warning").on("click", function (e) {
        _this2.close();
      });

      // listen to changes of type
      // update tags and geometry type according to it
      this.updateGeometryTypeOnTypeChange(form);

      this.body.append(form);
    }
  }, {
    key: 'open',
    value: function open() {
      openSitebar();
    }
  }, {
    key: 'close',
    value: function close() {
      closeSitebar();
    }
  }, {
    key: 'updateGeometryTypeOnTypeChange',
    value: function updateGeometryTypeOnTypeChange(form) {
      form.find("select[name='type']").on('change', function (e) {
        var currentType = form.find('select[name="type"]').val();

        // update geometric types to select
        form.find('label[for="geometry_type"]').parent().replaceWith(createSelect("geometry_type", [currentType], configNode.nodesAvailable[e.target.value].geometryTypes));
        $('select[name="geometry_type"]', form).select2({
          width: '100%'
        });
      });
    }
  }]);

  return Sidebar;
}();
