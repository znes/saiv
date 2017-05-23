class DataManager {
	constructor() {
		this._json = null
    }

    set json  (paraJson)  { this._json = paraJson }
    get json  ()       { return this._json }


	updateScenario (data) {	
		this._json.name = data.name
		this._json.tags.description = data.tags.description
	}

	updateRelationNames (newName, oldName) {
		this._json.children.forEach(child => {
			child.predecessors.forEach(pred => {
				if(pred == oldName) pred = newName
			})
			child.successors.forEach(succ => {
				if(succ == oldName) succ = newName
			})
		})
	}

	addNode (child) {
		this._json.children.push(child)
	}

	/**
	 * [addEdge description]
	 * Adds predecessors and successors
	 * Return boolean of success 
	 * @param {[type]} predecessors [description]
	 * @param {[type]} successors   [description]
	 */
	addEdge (predecessors, successors) {
		// Add Successor
		var index = this._json.children.findIndex(x => x.name==predecessors)
		if (index !== -1) {
			if(this._json.children[index].successors.indexOf(successors) === -1) {
				this._json.children[index].successors.push(successors)
			} else {
				return false
			}
		}
		// Add Predecessor
		index = this._json.children.findIndex(x => x.name==successors);
		if (index !== -1) {
			this._json.children[index].predecessors.indexOf(predecessors) === -1 ? this._json.children[index].predecessors.push(predecessors) : console.log("This item already exists");
		}
		return true;
	}

	deleteItem (name) {
		this._json.children = $.grep(this._json.children, function (child) {
            return child.name != name
        });

		deleteRelationNames(name)
	}

	updateChildren (updateData) {
		this._json.children = $.grep(this._json.children, function (child) {
            return child.name != updateData.currentid
        });

        // if name(id) changes
        if(updateData.currentid != updateData.name) {
        	this.updateRelationNames(updateData.name, updateData.currentid)
        }
        delete updateData['currentid']


        // Add Successor and Predecessors to other
        for (var i = 0; i < updateData.successors.length; i++) {
        	var index = this._json.children.findIndex(x => x.name==updateData.successors[i])
			if (index !== -1) {
				this._json.children[index].predecessors.indexOf(updateData.name) === -1 ? this._json.children[index].predecessors.push(updateData.name) : console.log("This item already exists")
			}
        }
        for (var i = 0; i < updateData.predecessors.length; i++) {
        	var index = this._json.children.findIndex(x => x.name==updateData.predecessors[i]);
			if (index !== -1) {
				this._json.children[index].successors.indexOf(updateData.name) === -1 ? this._json.children[index].successors.push(updateData.name) : console.log("This item already exists")
			}
        }

        // Check if something has been removed
        for (var i = 0; i < this._json.children.length; i++) {
        	var index = this._json.children[i].predecessors.indexOf(x => x.name==updateData.predecessors[i])
        	if( index !== -1)
        	{
        		updateData.successors.indexOf(this._json.children[i].name) === -1 ? delete this._json.children[i].predecessors[index] : console.log("Bereits drin")
        	}

        	index = this._json.children[i].successors.indexOf(updateData.name)
        	if( index !== -1)
        	{
        		updateData.predecessors.indexOf(this._json.children[i].name) === -1 ? delete this._json.children[i].successors[index] : console.log("Bereits drin")
        	}
        }
        this._json.children.push(updateData)
    }

    addTag (name, tagName) {
    	var index = this._json.children.findIndex(x => x.name==name)
    	if( index !== -1)
    	{
    		this._json.children[index].tags[tagName] = ""
    	}
    }

    removeTag (name, tagName) {
    	console.log(name, tagName)
    	var index = this._json.children.findIndex(x => x.name==name)
    	if( index !== -1)
    	{
    		delete this._json.children[index].tags[tagName]
    	}
    }

    deleteRelationNames (name) {
    	for (var i = 0; i < this._json.children.length; i++) {
			for (var j = 0; j < this._json.children[i].predecessors.length; j++) {
				if(this._json.children[i].predecessors[j] == name) {
					this._json.children[i].predecessors.splice(j,1)
				}
			}
			for (var j = 0; j < this._json.children[i].successors.length; j++) {
				if(this._json.children[i].successors[j] == name) {
					this._json.children[i].successors.splice(j,1)
				}
			}
		}
    }
}